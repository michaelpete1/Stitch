import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { consumeChatRateLimit, getChatSession, rateLimitResponse, sessionJson, setChatSessionCookie } from '@/lib/anonymous-chat';
import { d1Query, d1Run, isChatId } from '@/lib/d1';
import { requestAssistantStream, toPlainTextStream, type AIProvider } from '@/lib/gemini-stream';
import { buildConversationContext } from '@/lib/chat-context';
import { requireChatConsent, sameOriginError } from '@/lib/chat-consent';

const messageSchema = z.object({ content: z.string().trim().min(1).max(8_000), context: z.string().max(30_000).optional(), clientMessageId: z.string().uuid(), provider: z.enum(['gemini', 'workers']).default('gemini') });
type MessageRow = { id: string; role: 'user' | 'assistant'; content: string; context: string | null; created_at: number };

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getChatSession(request);
  const originError = sameOriginError(request, session);
  if (originError) return originError;
  const consentError = await requireChatConsent(session);
  if (consentError) return consentError;
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > 42_000) {
    return sessionJson(session, { error: 'Message and context are too large.' }, { status: 413 });
  }
  const { id } = await params;
  if (!isChatId(id)) return sessionJson(session, { error: 'Chat not found' }, { status: 404 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return sessionJson(session, { error: 'Invalid request body' }, { status: 400 }); }
  const parsed = messageSchema.safeParse(payload);
  if (!parsed.success) return sessionJson(session, { error: 'Message must be between 1 and 8,000 characters' }, { status: 400 });

  try {
    const retryAfterSeconds = await consumeChatRateLimit(request, session.sessionId);
    if (retryAfterSeconds) return sessionJson(session, rateLimitResponse(retryAfterSeconds), { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } });
    const [conversation] = await d1Query<{ id: string; title: string }>('SELECT id, title FROM stitch_chat_conversations WHERE id = ? AND session_id = ?', [id, session.sessionId]);
    if (!conversation) return sessionJson(session, { error: 'Chat not found' }, { status: 404 });

    let [userMessage] = await d1Query<MessageRow>(
      'SELECT id, role, content, context, created_at FROM stitch_chat_messages WHERE conversation_id = ? AND client_message_id = ?', [id, parsed.data.clientMessageId]);
    if (userMessage) {
      const [reply] = await d1Query<{ content: string }>('SELECT content FROM stitch_chat_messages WHERE conversation_id = ? AND reply_to = ?', [id, userMessage.id]);
      if (reply) {
        const response = new NextResponse(reply.content, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
        return session.needsCookie ? setChatSessionCookie(response, session.sessionId) : response;
      }
    }

    const context = parsed.data.context?.trim();
    if (!userMessage) {
      const now = Date.now();
      const userId = randomUUID();
      await d1Run('INSERT INTO stitch_chat_messages (id, conversation_id, role, content, context, client_message_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, id, 'user', parsed.data.content, context || null, parsed.data.clientMessageId, now]);
      userMessage = { id: userId, role: 'user', content: parsed.data.content, context: context || null, created_at: now };
      const title = conversation.title === 'New chat' ? parsed.data.content.slice(0, 56).trim() || 'New chat' : conversation.title;
      await d1Run('UPDATE stitch_chat_conversations SET title = ?, updated_at = ? WHERE id = ? AND session_id = ?', [title, now, id, session.sessionId]);
    }

    const previous = await d1Query<{ role: 'user' | 'assistant'; content: string }>(
      `SELECT role, content FROM stitch_chat_messages WHERE conversation_id = ? ${userMessage ? 'AND (created_at, id) < (?, ?)' : ''}
       ORDER BY created_at DESC, id DESC LIMIT 20`,
      userMessage ? [id, userMessage.created_at, userMessage.id] : [id]);
    previous.reverse();
    const earlierAttachments = await d1Query<{ context: string | null }>(
      `SELECT context FROM stitch_chat_messages
       WHERE conversation_id = ? AND role = 'user' AND id != ?
         AND context IS NOT NULL AND context LIKE '%Attached document%'
       ORDER BY created_at DESC, id DESC LIMIT 10`,
      [id, userMessage.id],
    );
    const conversationContext = buildConversationContext(
      context || userMessage.context,
      earlierAttachments.map((message) => message.context),
    );
    const prompt = conversationContext
      ? `Use the documents and course context below when helpful. Refer to previously attached documents when the question points to them.\n\n${conversationContext}\n\nQuestion: ${parsed.data.content}`
      : parsed.data.content;
    const upstream = await requestAssistantStream([
      ...previous.map((message) => ({ role: message.role === 'assistant' ? 'model' as const : 'user' as const, parts: [{ text: message.content }] })),
      { role: 'user', parts: [{ text: prompt }] },
    ], request.signal, parsed.data.provider as AIProvider);
    if (!upstream.ok) {
      console.error('AI provider stream failed with status:', upstream.status);
      return sessionJson(session, { error: 'The message was saved, but the assistant could not respond. Check your Gemini and Workers AI API keys, then retry.' }, { status: 502 });
    }

    const stream = toPlainTextStream(upstream, async (content, tokens) => {
      if (!content) return;
      const now = Date.now();
      await d1Run(
        `INSERT INTO stitch_chat_messages (id, conversation_id, role, content, reply_to, tokens, created_at) VALUES (?, ?, 'assistant', ?, ?, ?, ?)
         ON CONFLICT(conversation_id, reply_to) WHERE reply_to IS NOT NULL
         DO UPDATE SET content = excluded.content, tokens = excluded.tokens`,
        [randomUUID(), id, content, userMessage!.id, tokens, now]);
      await d1Run('UPDATE stitch_chat_conversations SET updated_at = ? WHERE id = ? AND session_id = ?', [now, id, session.sessionId]);
    });
    const response = new NextResponse(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'X-Content-Type-Options': 'nosniff', 'X-Stitch-AI-Provider': upstream.headers.get('X-Stitch-AI-Provider') ?? parsed.data.provider } });
    return session.needsCookie ? setChatSessionCookie(response, session.sessionId) : response;
  } catch (error) {
    console.error('Send chat message error:', error);
    const missingConfig = error instanceof Error && error.message.startsWith('Cloudflare D1 is not configured');
    return sessionJson(session, { error: missingConfig ? 'Chat history needs Cloudflare D1 configured before you can chat.' : 'Could not send your message. Please try again.' }, { status: missingConfig ? 503 : 500 });
  }
}
