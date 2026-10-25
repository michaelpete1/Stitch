import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { d1First, d1Run } from '@/lib/d1';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';
import { getChatSession } from '@/lib/anonymous-chat';
import { requireChatConsent, sameOriginError } from '@/lib/chat-consent';

async function getUser(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get('authorization')) || req.cookies.get('auth-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function POST(req: NextRequest) {
  const session = getChatSession(req);
  const originError = sameOriginError(req, session);
  if (originError) return originError;
  const consentError = await requireChatConsent(session);
  if (consentError) return consentError;
  const declaredLength = Number(req.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > 10 * 1024 * 1024 + 256_000) {
    return NextResponse.json({ error: 'Document must be 10 MB or smaller' }, { status: 413 });
  }
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let objectKey: string | null = null;
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const courseIdValue = formData.get('courseId');
    if (!(file instanceof File) || typeof courseIdValue !== 'string' || !/^\d+$/.test(courseIdValue)) {
      return NextResponse.json({ error: 'File and valid courseId are required' }, { status: 400 });
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !['pdf', 'docx', 'txt'].includes(extension)) {
      return NextResponse.json({ error: 'Only PDF, DOCX, and TXT documents are supported' }, { status: 400 });
    }
    if (file.size === 0 || file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Document must be 10 MB or smaller' }, { status: 400 });
    }

    const courseId = Number(courseIdValue);
    const course = await d1First<{ id: number }>(
      'SELECT id FROM courses WHERE id = ? AND user_id = ?', [courseId, user.userId],
    );
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    const { env } = getCloudflareContext();
    objectKey = `course-files/${user.userId}/${courseId}/${crypto.randomUUID()}.${extension}`;
    await env.UPLOADS.put(objectKey, file.stream(), {
      httpMetadata: { contentType: file.type || 'application/octet-stream' },
      customMetadata: { originalName: file.name.slice(0, 255) },
    });

    const note = await d1First<{ id: number }>(
      'INSERT INTO lecture_notes (user_id, course_id, file_name, object_key, mime_type, file_size) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
      [user.userId, courseId, file.name.slice(0, 255), objectKey, file.type || null, file.size],
    );
    if (!note) throw new Error('Upload metadata was not saved');

    return NextResponse.json({
      note: { id: note.id, file_name: file.name, url: `/api/lecture-notes/${note.id}/file` },
    }, { status: 201 });
  } catch (error) {
    if (objectKey) {
      try {
        const { env } = getCloudflareContext();
        await env.UPLOADS.delete(objectKey);
      } catch (cleanupError) {
        console.error('Upload cleanup error:', cleanupError);
      }
    }
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
