import { NextRequest, NextResponse } from 'next/server';
import { d1First } from '@/lib/d1';
import { verifyPassword, createToken } from '@/lib/auth';
import { consumeChatRateLimit, getChatSession, rateLimitResponse, sessionJson } from '@/lib/anonymous-chat';
import { requireChatConsent, sameOriginError } from '@/lib/chat-consent';

export async function POST(req: NextRequest) {
  const session = getChatSession(req);
  const originError = sameOriginError(req, session);
  if (originError) return originError;
  const consentError = await requireChatConsent(session);
  if (consentError) return consentError;
  const declaredLength = Number(req.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > 4_000) return sessionJson(session, { error: 'Sign-in request is too large.' }, { status: 413 });
  try {
    const retryAfter = await consumeChatRateLimit(req, session.sessionId);
    if (retryAfter) return sessionJson(session, rateLimitResponse(retryAfter), { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  } catch {
    return sessionJson(session, { error: 'Sign in is temporarily unavailable. Please try again shortly.' }, { status: 503 });
  }
  try {
    const payload = await req.json() as Record<string, unknown>;
    const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const password = typeof payload?.password === 'string' ? payload.password : '';

    if (!email || !password || email.length > 254 || password.length > 128) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await d1First<{ id: number; email: string; password_hash: string; first_name: string; last_name: string }>(
      'SELECT id, email, password_hash, first_name, last_name FROM users WHERE email = ?', [email],
    );

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await createToken({ userId: user.id, email: user.email });

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
