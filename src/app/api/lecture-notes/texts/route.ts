import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

async function getUser(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get('authorization')) || req.cookies.get('auth-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');

  if (!courseId) {
    return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
  }

  const texts = db.prepare(
    'SELECT file_name, text FROM lecture_note_texts WHERE user_id = ? AND course_id = ?'
  ).all(user.userId, courseId) as { file_name: string; text: string }[];

  const textMap: Record<string, string> = {};
  for (const t of texts) {
    textMap[t.file_name] = t.text;
  }

  return NextResponse.json({ texts: textMap });
}