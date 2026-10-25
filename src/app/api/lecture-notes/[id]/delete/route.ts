import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { d1Batch, d1First } from '@/lib/d1';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';
import { sameOriginError } from '@/lib/chat-consent';

async function getUser(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get('authorization')) || req.cookies.get('auth-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const originError = sameOriginError(req);
  if (originError) return originError;
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  const noteId = Number(id);
  const note = await d1First<{ object_key: string; course_id: number; file_name: string }>(
    'SELECT object_key, course_id, file_name FROM lecture_notes WHERE id = ? AND user_id = ?',
    [noteId, user.userId],
  );
  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

  const { env } = getCloudflareContext();
  await env.UPLOADS.delete(note.object_key);
  await d1Batch([
    { sql: 'DELETE FROM lecture_notes WHERE id = ? AND user_id = ?', params: [noteId, user.userId] },
    { sql: 'DELETE FROM lecture_note_texts WHERE user_id = ? AND course_id = ? AND file_name = ?', params: [user.userId, note.course_id, note.file_name] },
  ]);
  return NextResponse.json({ success: true });
}
