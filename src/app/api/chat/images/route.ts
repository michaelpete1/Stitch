import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { consumeChatRateLimit, getChatSession, rateLimitResponse, sessionJson, setChatSessionCookie } from '@/lib/anonymous-chat';
import { d1Query, d1Run, isChatId } from '@/lib/d1';
import { generateImage, type AIProvider } from '@/lib/gemini-stream';
import { requireChatConsent, sameOriginError } from '@/lib/chat-consent';

const schema = z.object({
  prompt: z.string().trim().min(1).max(1000),
  provider: z.enum(['gemini', 'workers']).default('gemini'),
  conversationId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = getChatSession(request);
  const originError = sameOriginError(request, session);
  if (originError) return originError;
  const consentError = await requireChatConsent(session);
  if (consentError) return consentError;
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > 16_000) {
    return sessionJson(session, { error: 'Image request is too large.' }, { status: 413 });
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return sessionJson(session, { error: 'Invalid request body' }, { status: 400 });
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return sessionJson(session, { error: 'Prompt must be between 1 and 1,000 characters' }, { status: 400 });
  }

  try {
    const retryAfterSeconds = await consumeChatRateLimit(request, session.sessionId);
    if (retryAfterSeconds) {
      return sessionJson(session, rateLimitResponse(retryAfterSeconds), { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } });
    }

    const { prompt, provider, conversationId } = parsed.data;

    if (conversationId && isChatId(conversationId)) {
      const [conversation] = await d1Query<{ id: string }>(
        'SELECT id FROM stitch_chat_conversations WHERE id = ? AND session_id = ?',
        [conversationId, session.sessionId],
      );
      if (conversation) {
        const now = Date.now();
        await d1Run(
          'INSERT INTO stitch_chat_messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)',
          [randomUUID(), conversationId, 'user', `[Image request] ${prompt}`, now],
        );
        await d1Run('UPDATE stitch_chat_conversations SET updated_at = ? WHERE id = ? AND session_id = ?', [now, conversationId, session.sessionId]);
      }
    }

    const image = await generateImage(prompt, provider as AIProvider, request.signal);
    const dataUrl = `data:${image.mimeType};base64,${image.data}`;

    if (conversationId && isChatId(conversationId)) {
      const [conversation] = await d1Query<{ id: string }>(
        'SELECT id FROM stitch_chat_conversations WHERE id = ? AND session_id = ?',
        [conversationId, session.sessionId],
      );
      if (conversation) {
        const now = Date.now();
        await d1Run(
          'INSERT INTO stitch_chat_messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)',
          [randomUUID(), conversationId, 'assistant', `![Generated image](${dataUrl})\n\nPrompt: ${prompt}`, now],
        );
        await d1Run('UPDATE stitch_chat_conversations SET updated_at = ? WHERE id = ? AND session_id = ?', [now, conversationId, session.sessionId]);
      }
    }

    const response = sessionJson(session, { image: dataUrl, prompt, provider: image.provider });
    return session.needsCookie ? setChatSessionCookie(response, session.sessionId) : response;
  } catch (error) {
    const failureDetails = error instanceof Error ? error.message : 'Both providers are unavailable.';
    const failures = failureDetails.split('; ');
    const notConfigured = failures.length > 0 && failures.every((detail) => detail.toLowerCase().includes('not configured'));
    if (notConfigured) {
      return sessionJson(session, { error: 'Image generation is not configured for either provider. Check the server Gemini and Workers AI keys.' }, { status: 503 });
    }
    return sessionJson(session, { error: `Image generation failed. ${failureDetails}` }, { status: 502 });
  }
}
