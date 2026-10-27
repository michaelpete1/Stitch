import { NextResponse, type NextRequest } from 'next/server';
import { hasValidConsentToken } from '@/lib/consent-cookie';
import { sessionJson } from '@/lib/anonymous-chat';

type ChatSession = { sessionId: string; needsCookie: boolean; consentToken?: string };

export async function hasCurrentChatConsent(consentToken?: string) {
  return hasValidConsentToken(consentToken);
}

export async function requireChatConsent(session: ChatSession) {
  if (await hasCurrentChatConsent(session.consentToken)) return null;
  return sessionJson(session, {
    error: 'Please review and accept the current Terms and Privacy Notice before using Stitch.',
    code: 'CONSENT_REQUIRED',
  }, { status: 428 });
}

export function sameOriginError(request: NextRequest, session?: ChatSession) {
  const origin = request.headers.get('origin');
  let sameOrigin = false;
  try {
    if (origin) {
      const requestOrigin = new URL(origin).origin;
      const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
      const host = forwardedHost || request.headers.get('host');
      const forwardedProtocol = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
      const protocol = forwardedProtocol || request.nextUrl.protocol.slice(0, -1);
      const forwardedOrigin = host ? new URL(`${protocol}://${host}`).origin : null;
      sameOrigin = requestOrigin === request.nextUrl.origin || requestOrigin === forwardedOrigin;
    }
  } catch {
    sameOrigin = false;
  }
  if (sameOrigin) return null;
  const body = { error: 'This request could not be verified. Refresh the page and try again.' };
  return session ? sessionJson(session, body, { status: 403 }) : NextResponse.json(body, { status: 403 });
}
