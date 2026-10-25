import { NextRequest, NextResponse } from 'next/server';
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
  const courseId = parseInt(id, 10);

  const result = db.prepare('DELETE FROM courses WHERE id = ? AND user_id = ?').run(courseId, user.userId);

  if (result.changes === 0) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
