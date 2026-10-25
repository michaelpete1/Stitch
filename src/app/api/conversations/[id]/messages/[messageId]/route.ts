import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getChatSession, sessionJson } from '@/lib/anonymous-chat';
import { d1Query, d1Run, isChatId } from '@/lib/d1';
import { requireChatConsent, sameOriginError } from '@/lib/chat-consent';

const updateSchema = z.union([
  z.object({ content: z.string().trim().min(1).max(8_000) }),
  z.object({ feedback: z.enum(['up', 'down']).nullable() }),
]);

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; messageId: string }> }) {
  const session = getChatSession(request);
  const originError = sameOriginError(request, session);
  if (originError) return originError;
  const consentError = await requireChatConsent(session);
  if (consentError) return consentError;
  const { id, messageId } = await params;
  if (!isChatId(id) || !isChatId(messageId)) return sessionJson(session, { error: 'Message not found' }, { status: 404 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return sessionJson(session, { error: 'Invalid request body' }, { status: 400 }); }
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) return sessionJson(session, { error: 'Invalid message update' }, { status: 400 });

  try {
    const [conversation] = await d1Query<{ id: string }>('SELECT id FROM stitch_chat_conversations WHERE id = ? AND session_id = ?', [id, session.sessionId]);
    if (!conversation) return sessionJson(session, { error: 'Chat not found' }, { status: 404 });
    const [message] = await d1Query<{ id: string; role: 'user' | 'assistant'; created_at: number; feedback: 'up' | 'down' | null }>(
      'SELECT id, role, created_at, feedback FROM stitch_chat_messages WHERE id = ? AND conversation_id = ?', [messageId, id]);
    if (!message) return sessionJson(session, { error: 'Message not found' }, { status: 404 });

    if ('content' in parsed.data) {
      if (message.role !== 'user') return sessionJson(session, { error: 'Only your messages can be edited' }, { status: 400 });
      const now = Date.now();
      await d1Run('UPDATE stitch_chat_messages SET content = ? WHERE id = ?', [parsed.data.content, messageId]);
      await d1Run('DELETE FROM stitch_chat_messages WHERE conversation_id = ? AND (created_at, id) > (?, ?)', [id, message.created_at, messageId]);
      await d1Run('UPDATE stitch_chat_conversations SET updated_at = ? WHERE id = ?', [now, id]);
      return sessionJson(session, { success: true });
    }

    if (message.role !== 'assistant') return sessionJson(session, { error: 'Feedback is only for assistant messages' }, { status: 400 });
    await d1Run('UPDATE stitch_chat_messages SET feedback = ? WHERE id = ?', [parsed.data.feedback, messageId]);
    return sessionJson(session, { success: true, feedback: parsed.data.feedback });
  } catch (error) {
    console.error('Update message error:', error);
    return sessionJson(session, { error: 'Could not update this message' }, { status: 503 });
  }
}
