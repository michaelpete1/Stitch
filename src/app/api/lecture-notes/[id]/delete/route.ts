import { NextRequest, NextResponse } from 'next/server';
import { existsSync, unlinkSync } from 'fs';
import db from '@/lib/database';
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
  const noteId = parseInt(id, 10);

  const note = db.prepare(
    'SELECT file_path, file_name, course_id FROM lecture_notes WHERE id = ? AND user_id = ?'
  ).get(noteId, user.userId) as { file_path: string; file_name: string; course_id: number } | undefined;

  if (!note) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }

  if (existsSync(note.file_path)) {
    unlinkSync(note.file_path);
  }

  db.prepare('DELETE FROM lecture_notes WHERE id = ? AND user_id = ?').run(noteId, user.userId);
  db.prepare('DELETE FROM lecture_note_texts WHERE user_id = ? AND course_id = ? AND file_name = ?')
    .run(user.userId, note.course_id, note.file_name);

  return NextResponse.json({ success: true });
}
