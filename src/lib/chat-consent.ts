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
    sameOrigin = Boolean(origin) && new URL(origin!).origin === request.nextUrl.origin;
  } catch {
    sameOrigin = false;
  }
  if (sameOrigin) return null;
  const body = { error: 'This request could not be verified. Refresh the page and try again.' };
  return session ? sessionJson(session, body, { status: 403 }) : NextResponse.json(body, { status: 403 });
}
