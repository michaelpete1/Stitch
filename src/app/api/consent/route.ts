import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getChatSession, sessionJson } from '@/lib/anonymous-chat';
import { CONSENT_COOKIE, CONSENT_MAX_AGE_SECONDS, createConsentToken } from '@/lib/consent-cookie';
import { hasCurrentChatConsent, sameOriginError } from '@/lib/chat-consent';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/consent-versions';

const consentSchema = z.object({
  acceptTerms: z.literal(true),
  acknowledgePrivacy: z.literal(true),
  adultConfirmed: z.literal(true),
  termsVersion: z.literal(TERMS_VERSION),
  privacyVersion: z.literal(PRIVACY_VERSION),
});

export async function GET(request: NextRequest) {
  const session = getChatSession(request);
  const accepted = await hasCurrentChatConsent(session.consentToken);
  return sessionJson(session, {
    accepted,
    termsVersion: accepted ? TERMS_VERSION : null,
    privacyVersion: accepted ? PRIVACY_VERSION : null,
  });
}

export async function POST(request: NextRequest) {
  const session = getChatSession(request);
  const originError = sameOriginError(request, session);
  if (originError) return originError;
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > 2_000) return sessionJson(session, { error: 'Consent request is too large.' }, { status: 413 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return sessionJson(session, { error: 'Please confirm the Terms and Privacy Notice.' }, { status: 400 });
  }
  const parsed = consentSchema.safeParse(payload);
  if (!parsed.success) {
    return sessionJson(session, { error: 'You must accept the current Terms, acknowledge the Privacy Notice, and confirm you are at least 18.' }, { status: 400 });
  }

  try {
    const token = await createConsentToken();
    const response = sessionJson(session, { accepted: true, termsVersion: TERMS_VERSION, privacyVersion: PRIVACY_VERSION });
    response.cookies.set(CONSENT_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: CONSENT_MAX_AGE_SECONDS,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Create consent token failed:', error instanceof Error ? error.message : 'unknown error');
    return sessionJson(session, { error: 'Could not save your consent. Check the server JWT_SECRET configuration.' }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = getChatSession(request);
  const originError = sameOriginError(request, session);
  if (originError) return originError;
  const response = sessionJson(session, { accepted: false });
  response.cookies.set(CONSENT_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
