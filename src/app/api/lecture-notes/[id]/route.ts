import { NextRequest, NextResponse } from 'next/server';
import { existsSync, readFileSync } from 'fs';
import db from '@/lib/database';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

async function getUser(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get('authorization')) || req.cookies.get('auth-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const noteId = parseInt(id, 10);

  const note = db.prepare(
    'SELECT file_path, file_name, mime_type FROM lecture_notes WHERE id = ? AND user_id = ?'
  ).get(noteId, user.userId) as { file_path: string; file_name: string; mime_type: string } | undefined;

  if (!note || !existsSync(note.file_path)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const fileBuffer = readFileSync(note.file_path);
  
  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': note.mime_type || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${note.file_name}"`,
    },
  });
}