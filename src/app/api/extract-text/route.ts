import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { d1First, d1Run } from '@/lib/d1';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';
import { getChatSession } from '@/lib/anonymous-chat';
import { requireChatConsent, sameOriginError } from '@/lib/chat-consent';

export const runtime = 'nodejs';

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
  if (Number.isFinite(declaredLength) && declaredLength > 10 * 1024 * 1024 + 256_000) return NextResponse.json({ error: 'File must be 10 MB or smaller' }, { status: 413 });
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const courseId = formData.get('courseId') as string;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size === 0 || file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be 10 MB or smaller' }, { status: 400 });
    }

    if (!courseId || !/^\d+$/.test(courseId)) {
      return NextResponse.json({ error: 'A valid courseId is required' }, { status: 400 });
    }
    const course = await d1First<{ id: number }>('SELECT id FROM courses WHERE id = ? AND user_id = ?', [Number(courseId), user.userId]);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    let text = '';

    try {
      if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer });
        text = value;
      } else if (ext === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const data = await pdfParse(buffer);
        text = data.text;
      } else if (ext === 'txt') {
        text = await file.text();
      } else {
        return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Failed to extract text' }, { status: 500 });
    }

    if (courseId) {
      await d1Run(
        'INSERT INTO lecture_note_texts (user_id, course_id, file_name, text) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, course_id, file_name) DO UPDATE SET text = excluded.text',
        [user.userId, Number(courseId), file.name, text],
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error('Extract text error:', error);
    return NextResponse.json({ error: 'Failed to extract text' }, { status: 500 });
  }
}
