import { NextRequest, NextResponse } from 'next/server';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import db from '@/lib/database';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';
import { getChatSession } from '@/lib/anonymous-chat';
import { requireChatConsent, sameOriginError } from '@/lib/chat-consent';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

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
  if (Number.isFinite(declaredLength) && declaredLength > 10 * 1024 * 1024 + 256_000) return NextResponse.json({ error: 'Document must be 10 MB or smaller' }, { status: 413 });
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const courseId = formData.get('courseId') as string;

    if (!(file instanceof File) || !courseId) {
      return NextResponse.json({ error: 'File and courseId are required' }, { status: 400 });
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !['pdf', 'docx', 'txt'].includes(extension)) {
      return NextResponse.json({ error: 'Only PDF, DOCX, and TXT documents are supported' }, { status: 400 });
    }

    if (file.size === 0 || file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Document must be 10 MB or smaller' }, { status: 400 });
    }

    const course = db.prepare('SELECT id FROM courses WHERE id = ? AND user_id = ?').get(courseId, user.userId);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${safeName}`;
    const userDir = join(UPLOAD_DIR, String(user.userId), courseId);
    
    if (!existsSync(userDir)) {
      mkdirSync(userDir, { recursive: true });
    }
    
    const filePath = join(userDir, fileName);
    writeFileSync(filePath, buffer);

    const result = db.prepare(
      'INSERT INTO lecture_notes (user_id, course_id, file_name, file_path, mime_type, file_size) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(user.userId, courseId, file.name, filePath, file.type, file.size);

    return NextResponse.json({ 
      note: { 
        id: result.lastInsertRowid, 
        file_name: file.name, 
        url: `/api/lecture-notes/${result.lastInsertRowid}/file` 
      } 
    }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
