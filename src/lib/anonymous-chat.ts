import { createHash, randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';

export const CHAT_SESSION_COOKIE = 'stitch-chat-session';
const CONSENT_COOKIE = 'stitch-consent';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export function getChatSession(request: NextRequest) {
  const cookieValue = request.cookies.get(CHAT_SESSION_COOKIE)?.value;
  const validCookie = cookieValue && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cookieValue);
  return {
    sessionId: validCookie ? cookieValue : randomUUID(),
    needsCookie: !validCookie,
    consentToken: request.cookies.get(CONSENT_COOKIE)?.value,
  };
}

export function setChatSessionCookie(response: NextResponse, sessionId: string) {
  response.cookies.set(CHAT_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
  });
  return response;
}

export function sessionJson(
  session: { sessionId: string; needsCookie: boolean },
  body: object,
  init?: ResponseInit,
) {
  const response = NextResponse.json(body, init);
  return session.needsCookie ? setChatSessionCookie(response, session.sessionId) : response;
}

function hash(value: string) {
  return createHash('sha256').update(value).digest('hex').slice(0, 32);
}

/** Apply a shared 10-minute bucket for anonymous session and source IP. */
export async function consumeChatRateLimit(request: NextRequest, sessionId: string) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const clientIp = request.headers.get('cf-connecting-ip')?.trim()
    || request.headers.get('x-real-ip')?.trim()
    || forwardedFor
    || 'unknown';
  const windowId = Math.floor(Date.now() / RATE_WINDOW_MS);
  const expiresAt = (windowId + 2) * RATE_WINDOW_MS;
  if (windowId % 6 === 0) {
    await d1Run('DELETE FROM chat_rate_limits WHERE expires_at < ?', [Date.now()]);
  }
  const buckets = [
    { key: `session:${hash(sessionId)}:${windowId}`, limit: 20 },
    { key: `ip:${hash(clientIp)}:${windowId}`, limit: 80 },
  ];

  const counters = await Promise.all(buckets.map(async (bucket) => {
    const [counter] = await d1Query<{ count: number }>(
      `INSERT INTO chat_rate_limits (id, count, expires_at) VALUES (?, 1, ?)
       ON CONFLICT(id) DO UPDATE SET count = count + 1, expires_at = excluded.expires_at
       RETURNING count`,
      [bucket.key, expiresAt],
    );
    return { bucket, counter };
  }));

  let retryAfterSeconds = 0;
  for (const { bucket, counter } of counters) {
    if (counter.count > bucket.limit) {
      retryAfterSeconds = Math.max(retryAfterSeconds, Math.ceil((expiresAt - Date.now()) / 1000));
    }
  }
  return retryAfterSeconds;
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return {
    error: 'You’re sending messages a little too quickly. Please try again shortly.',
    retryAfterSeconds,
  };
}
