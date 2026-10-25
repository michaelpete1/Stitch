import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';
import { getChatSession } from '@/lib/anonymous-chat';
import { requireChatConsent, sameOriginError } from '@/lib/chat-consent';

async function getUser(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get('authorization')) || req.cookies.get('auth-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const courses = db.prepare('SELECT * FROM courses WHERE user_id = ? ORDER BY name').all(user.userId);
  return NextResponse.json({ courses });
}

export async function POST(req: NextRequest) {
  const session = getChatSession(req);
  const originError = sameOriginError(req, session);
  if (originError) return originError;
  const consentError = await requireChatConsent(session);
  if (consentError) return consentError;
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, code, instructor, semester, credits, description } = await req.json();

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 });
    }

    const result = db.prepare(
      'INSERT INTO courses (user_id, name, code, instructor, semester, credits, description) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(user.userId, name, code, instructor || '', semester || '', credits || 0, description || '');

    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error('Create course error:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
