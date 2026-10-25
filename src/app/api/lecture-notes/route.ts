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

  const notes = db.prepare(
    'SELECT id, file_name, created_at, \'/api/lecture-notes/\' || id || \'/file\' AS url FROM lecture_notes WHERE user_id = ? AND course_id = ? ORDER BY created_at DESC'
  ).all(user.userId, courseId);

  return NextResponse.json({ notes });
}
