import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getChatSession, sessionJson } from '@/lib/anonymous-chat';
import { dateFromMillis, d1Query, d1Run, isChatId } from '@/lib/d1';
import { requireChatConsent, sameOriginError } from '@/lib/chat-consent';

const renameSchema = z.object({ title: z.string().trim().min(1).max(120) });

type ConversationRow = { id: string; title: string; created_at: number; updated_at: number };
type MessageRow = { id: string; role: 'user' | 'assistant'; content: string; tokens: number; created_at: number; feedback: 'up' | 'down' | null };

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getChatSession(request);
  const consentError = await requireChatConsent(session);
  if (consentError) return consentError;
  const { id } = await params;
  if (!isChatId(id)) return sessionJson(session, { error: 'Chat not found' }, { status: 404 });

  const url = new URL(request.url);
  const cursor = url.searchParams.get('before');
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 30, 1), 100);
  if (cursor && !isChatId(cursor)) return sessionJson(session, { error: 'Invalid message cursor' }, { status: 400 });

  try {
    const [conversation] = await d1Query<ConversationRow>(
      'SELECT id, title, created_at, updated_at FROM stitch_chat_conversations WHERE id = ? AND session_id = ?', [id, session.sessionId]);
    if (!conversation) return sessionJson(session, { error: 'Chat not found' }, { status: 404 });

    const messages = await d1Query<MessageRow>(
      `SELECT id, role, content, tokens, created_at, feedback FROM stitch_chat_messages
       WHERE conversation_id = ? ${cursor ? 'AND (created_at, id) < (SELECT created_at, id FROM stitch_chat_messages WHERE id = ? AND conversation_id = ?)' : ''}
       ORDER BY created_at DESC, id DESC LIMIT ?`,
      cursor ? [id, cursor, id, limit + 1] : [id, limit + 1],
    );
    const hasMore = messages.length > limit;
    const visible = messages.slice(0, limit);
    const nextCursor = hasMore ? visible[visible.length - 1]?.id ?? null : null;
    return sessionJson(session, {
      conversation: { id: conversation.id, title: conversation.title, createdAt: dateFromMillis(conversation.created_at), updatedAt: dateFromMillis(conversation.updated_at) },
      messages: visible.reverse().map((message) => ({ id: message.id, role: message.role, content: message.content, tokens: message.tokens, createdAt: dateFromMillis(message.created_at), feedback: message.feedback })),
      nextCursor,
    });
  } catch (error) {
    console.error('Load conversation error:', error);
    return sessionJson(session, { error: 'Could not load this conversation' }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getChatSession(request);
  const originError = sameOriginError(request, session);
  if (originError) return originError;
  const consentError = await requireChatConsent(session);
  if (consentError) return consentError;
  const { id } = await params;
  if (!isChatId(id)) return sessionJson(session, { error: 'Chat not found' }, { status: 404 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return sessionJson(session, { error: 'Invalid request body' }, { status: 400 }); }
  const parsed = renameSchema.safeParse(payload);
  if (!parsed.success) return sessionJson(session, { error: 'Title must be between 1 and 120 characters' }, { status: 400 });
  try {
    const now = Date.now();
    const rows = await d1Query<ConversationRow>(
      'UPDATE stitch_chat_conversations SET title = ?, updated_at = ? WHERE id = ? AND session_id = ? RETURNING id, title, created_at, updated_at',
      [parsed.data.title, now, id, session.sessionId]);
    const conversation = rows[0];
    if (!conversation) return sessionJson(session, { error: 'Chat not found' }, { status: 404 });
    return sessionJson(session, { conversation: { id: conversation.id, title: conversation.title, createdAt: dateFromMillis(conversation.created_at), updatedAt: dateFromMillis(conversation.updated_at) } });
  } catch (error) {
    console.error('Rename conversation error:', error);
    return sessionJson(session, { error: 'Could not rename this conversation' }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getChatSession(request);
  const originError = sameOriginError(request, session);
  if (originError) return originError;
  const { id } = await params;
  if (!isChatId(id)) return sessionJson(session, { error: 'Chat not found' }, { status: 404 });
  try {
    const [conversation] = await d1Query<{ id: string }>('SELECT id FROM stitch_chat_conversations WHERE id = ? AND session_id = ?', [id, session.sessionId]);
    if (!conversation) return sessionJson(session, { error: 'Chat not found' }, { status: 404 });
    await d1Run('DELETE FROM stitch_chat_messages WHERE conversation_id = ?', [id]);
    await d1Run('DELETE FROM stitch_chat_conversations WHERE id = ? AND session_id = ?', [id, session.sessionId]);
    return sessionJson(session, { success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return sessionJson(session, { error: 'Could not delete this conversation' }, { status: 503 });
  }
}
