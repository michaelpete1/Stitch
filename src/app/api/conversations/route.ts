import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { consumeChatRateLimit, getChatSession, rateLimitResponse, sessionJson, setChatSessionCookie } from '@/lib/anonymous-chat';
import { dateFromMillis, d1Query, d1Run } from '@/lib/d1';
import { randomUUID } from 'node:crypto';
import { requireChatConsent, sameOriginError } from '@/lib/chat-consent';

const createConversationSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
});

export async function GET(request: NextRequest) {
  const session = getChatSession(request);
  const { sessionId, needsCookie } = session;
  const consentError = await requireChatConsent(session);
  if (consentError) return consentError;
  try {
    const conversations = await d1Query<{ id: string; title: string; created_at: number; updated_at: number }>(
      'SELECT id, title, created_at, updated_at FROM stitch_chat_conversations WHERE session_id = ? ORDER BY updated_at DESC LIMIT 200',
      [sessionId],
    );
    const response = NextResponse.json({
      conversations: conversations.map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        createdAt: dateFromMillis(conversation.created_at),
        updatedAt: dateFromMillis(conversation.updated_at),
      })),
    });
    return needsCookie ? setChatSessionCookie(response, sessionId) : response;
  } catch (error) {
    console.error('List conversations error:', error);
    const response = NextResponse.json({ error: 'Chat history is unavailable. Check Cloudflare D1 configuration.' }, { status: 503 });
    return needsCookie ? setChatSessionCookie(response, sessionId) : response;
  }
}

export async function POST(request: NextRequest) {
  const session = getChatSession(request);
  const { sessionId, needsCookie } = session;
  const originError = sameOriginError(request, session);
  if (originError) return originError;
  const consentError = await requireChatConsent(session);
  if (consentError) return consentError;
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > 2_000) {
    return sessionJson(session, { error: 'Chat request is too large.' }, { status: 413 });
  }
  const respond = (body: object, status = 200) => {
    const response = NextResponse.json(body, { status });
    return needsCookie ? setChatSessionCookie(response, sessionId) : response;
  };

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return respond({ error: 'Invalid request body' }, 400);
  }
  const parsed = createConversationSchema.safeParse(payload);
  if (!parsed.success) return respond({ error: 'Enter a valid chat title' }, 400);

  try {
    const retryAfterSeconds = await consumeChatRateLimit(request, sessionId);
    if (retryAfterSeconds) {
      const response = NextResponse.json(rateLimitResponse(retryAfterSeconds), {
        status: 429,
        headers: { 'Retry-After': String(retryAfterSeconds) },
      });
      return needsCookie ? setChatSessionCookie(response, sessionId) : response;
    }
    const now = Date.now();
    const id = randomUUID();
    await d1Run('INSERT INTO stitch_chat_conversations (id, session_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, sessionId, parsed.data.title ?? 'New chat', now, now]);
    return respond({
      conversation: {
        id,
        title: parsed.data.title ?? 'New chat',
        createdAt: new Date(now).toISOString(),
        updatedAt: new Date(now).toISOString(),
      },
    }, 201);
  } catch (error) {
    console.error('Create conversation error:', error);
    return respond({ error: 'Could not create a chat. Check Cloudflare D1 configuration.' }, 503);
  }
}

export async function DELETE(request: NextRequest) {
  const session = getChatSession(request);
  const { sessionId, needsCookie } = session;
  const originError = sameOriginError(request, session);
  if (originError) return originError;
  try {
    const [count] = await d1Query<{ count: number }>('SELECT COUNT(*) AS count FROM stitch_chat_conversations WHERE session_id = ?', [sessionId]);
    await d1Run('DELETE FROM stitch_chat_messages WHERE conversation_id IN (SELECT id FROM stitch_chat_conversations WHERE session_id = ?)', [sessionId]);
    await d1Run('DELETE FROM stitch_chat_conversations WHERE session_id = ?', [sessionId]);
    const response = NextResponse.json({ success: true, deletedCount: count?.count ?? 0 });
    return needsCookie ? setChatSessionCookie(response, sessionId) : response;
  } catch (error) {
    console.error('Clear chat history error:', error);
    const response = NextResponse.json({ error: 'Could not clear your chats right now.' }, { status: 503 });
    return needsCookie ? setChatSessionCookie(response, sessionId) : response;
  }
}
