import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { d1Query, d1Run } from '@/lib/d1';
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
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  const courseId = Number(id);

  const notes = await d1Query<{ object_key: string }>(
    'SELECT object_key FROM lecture_notes WHERE course_id = ? AND user_id = ?', [courseId, user.userId],
  );
  const result = await d1Run('DELETE FROM courses WHERE id = ? AND user_id = ?', [courseId, user.userId]);

  if (result.changes === 0) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  if (notes.length) {
    const { env } = getCloudflareContext();
    await env.UPLOADS.delete(notes.map((note) => note.object_key));
  }

  return NextResponse.json({ success: true });
}
