import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';
import { hashPassword, createToken } from '@/lib/auth';
import { consumeChatRateLimit, getChatSession, rateLimitResponse, sessionJson } from '@/lib/anonymous-chat';
import { requireChatConsent, sameOriginError } from '@/lib/chat-consent';

export async function POST(req: NextRequest) {
  const session = getChatSession(req);
  const originError = sameOriginError(req, session);
  if (originError) return originError;
  const consentError = await requireChatConsent(session);
  if (consentError) return consentError;
  const declaredLength = Number(req.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > 4_000) return sessionJson(session, { error: 'Registration request is too large.' }, { status: 413 });
  try {
    const retryAfter = await consumeChatRateLimit(req, session.sessionId);
    if (retryAfter) return sessionJson(session, rateLimitResponse(retryAfter), { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  } catch {
    return sessionJson(session, { error: 'Registration is temporarily unavailable. Please try again shortly.' }, { status: 503 });
  }
  try {
    const payload = await req.json();
    const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const password = typeof payload?.password === 'string' ? payload.password : '';
    const firstName = typeof payload?.firstName === 'string' ? payload.firstName.trim().slice(0, 100) : '';
    const lastName = typeof payload?.lastName === 'string' ? payload.lastName.trim().slice(0, 100) : '';

    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (password.length < 12 || password.length > 128) {
      return NextResponse.json({ error: 'Password must be between 12 and 128 characters.' }, { status: 400 });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const result = db.prepare(
      'INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)'
    ).run(email, passwordHash, firstName || '', lastName || '');

    const userId = result.lastInsertRowid as number;
    const token = await createToken({ userId, email });

    const response = NextResponse.json({ user: { id: userId, email, firstName, lastName } });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
