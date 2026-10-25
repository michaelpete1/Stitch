import { NextRequest, NextResponse } from 'next/server';
import { d1First, d1Query } from '@/lib/d1';
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

  const courses = await d1Query('SELECT * FROM courses WHERE user_id = ? ORDER BY name', [user.userId]);
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
    const payload = await req.json() as Record<string, unknown>;
    const name = typeof payload.name === 'string' ? payload.name : '';
    const code = typeof payload.code === 'string' ? payload.code : '';
    const instructor = typeof payload.instructor === 'string' ? payload.instructor : '';
    const semester = typeof payload.semester === 'string' ? payload.semester : '';
    const credits = typeof payload.credits === 'number' ? payload.credits : 0;
    const description = typeof payload.description === 'string' ? payload.description : '';

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 });
    }

    const course = await d1First(
      'INSERT INTO courses (user_id, name, code, instructor, semester, credits, description) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *',
      [user.userId, name, code, instructor || '', semester || '', credits || 0, description || ''],
    );
    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error('Create course error:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
