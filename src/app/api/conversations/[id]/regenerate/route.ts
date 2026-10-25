import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { consumeChatRateLimit, getChatSession, rateLimitResponse, sessionJson, setChatSessionCookie } from '@/lib/anonymous-chat';
import { d1Query, d1Run, isChatId } from '@/lib/d1';
import { requestAssistantStream, toPlainTextStream, type AIProvider } from '@/lib/gemini-stream';
import { buildConversationContext } from '@/lib/chat-context';
import { requireChatConsent, sameOriginError } from '@/lib/chat-consent';

type MessageRow = { id: string; role: 'user' | 'assistant'; content: string; context: string | null; created_at: number };

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getChatSession(request);
  const originError = sameOriginError(request, session);
  if (originError) return originError;
  const consentError = await requireChatConsent(session);
  if (consentError) return consentError;
  const { id } = await params;
  if (!isChatId(id)) return sessionJson(session, { error: 'Chat not found' }, { status: 404 });

  let provider: AIProvider = 'gemini';
  try {
    const payload = await request.json() as { provider?: unknown };
    if (payload.provider === 'gemini' || payload.provider === 'workers') provider = payload.provider;
    else if (payload.provider !== undefined) return sessionJson(session, { error: 'Invalid AI provider' }, { status: 400 });
  } catch {
    // Keep the default provider for clients that send no request body.
  }

  try {
    const retryAfterSeconds = await consumeChatRateLimit(request, session.sessionId);
    if (retryAfterSeconds) return sessionJson(session, rateLimitResponse(retryAfterSeconds), { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } });
    const [conversation] = await d1Query<{ id: string }>('SELECT id FROM stitch_chat_conversations WHERE id = ? AND session_id = ?', [id, session.sessionId]);
    if (!conversation) return sessionJson(session, { error: 'Chat not found' }, { status: 404 });

    const [lastUserMessage] = await d1Query<MessageRow>(
      "SELECT id, role, content, context, created_at FROM stitch_chat_messages WHERE conversation_id = ? AND role = 'user' ORDER BY created_at DESC, id DESC LIMIT 1", [id]);
    if (!lastUserMessage) return sessionJson(session, { error: 'There is no message to regenerate' }, { status: 400 });
    const previous = await d1Query<{ role: 'user' | 'assistant'; content: string }>(
      'SELECT role, content FROM stitch_chat_messages WHERE conversation_id = ? AND (created_at, id) < (?, ?) ORDER BY created_at DESC, id DESC LIMIT 20',
      [id, lastUserMessage.created_at, lastUserMessage.id]);
    previous.reverse();

    const earlierAttachments = await d1Query<{ context: string | null }>(
      `SELECT context FROM stitch_chat_messages
       WHERE conversation_id = ? AND role = 'user' AND context IS NOT NULL AND context LIKE '%Attached document%'
       ORDER BY created_at DESC, id DESC LIMIT 10`,
      [id],
    );
    const conversationContext = buildConversationContext(
      lastUserMessage.context,
      earlierAttachments.map((message) => message.context),
    );
    const prompt = conversationContext
      ? `Use the documents and course context below when helpful. Refer to previously attached documents when the question points to them.\n\n${conversationContext}\n\nQuestion: ${lastUserMessage.content}`
      : lastUserMessage.content;
    const upstream = await requestAssistantStream([
      ...previous.map((message) => ({ role: message.role === 'assistant' ? 'model' as const : 'user' as const, parts: [{ text: message.content }] })),
      { role: 'user', parts: [{ text: prompt }] },
    ], request.signal, provider);
    if (!upstream.ok) {
      console.error('AI provider regenerate failed with status:', upstream.status);
      return sessionJson(session, { error: 'The assistant could not respond. Please try again.' }, { status: 502 });
    }

    const stream = toPlainTextStream(upstream, async (content, tokens) => {
      if (!content) return;
      const now = Date.now();
      await d1Run(`INSERT INTO stitch_chat_messages (id, conversation_id, role, content, reply_to, tokens, created_at) VALUES (?, ?, 'assistant', ?, ?, ?, ?)
        ON CONFLICT(conversation_id, reply_to) WHERE reply_to IS NOT NULL DO UPDATE SET content = excluded.content, tokens = excluded.tokens, created_at = excluded.created_at`,
        [randomUUID(), id, content, lastUserMessage.id, tokens, now]);
      await d1Run('UPDATE stitch_chat_conversations SET updated_at = ? WHERE id = ? AND session_id = ?', [now, id, session.sessionId]);
    });
    const response = new NextResponse(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'X-Stitch-AI-Provider': upstream.headers.get('X-Stitch-AI-Provider') ?? provider } });
    return session.needsCookie ? setChatSessionCookie(response, session.sessionId) : response;
  } catch (error) {
    console.error('Regenerate response error:', error);
    return sessionJson(session, { error: 'Could not regenerate this response' }, { status: 503 });
  }
}
