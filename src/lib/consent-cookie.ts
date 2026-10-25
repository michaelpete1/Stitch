import { SignJWT, jwtVerify } from 'jose';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/consent-versions';

export const CONSENT_COOKIE = 'stitch-consent';
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function getSigningKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || new TextEncoder().encode(secret).length < 32) {
    throw new Error('JWT_SECRET must be set to a random value of at least 32 bytes');
  }
  return new TextEncoder().encode(secret);
}

export async function createConsentToken() {
  return new SignJWT({
    termsVersion: TERMS_VERSION,
    privacyVersion: PRIVACY_VERSION,
    adultConfirmed: true,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('stitch')
    .setAudience('stitch-consent')
    .setIssuedAt()
    .setExpirationTime(`${CONSENT_MAX_AGE_SECONDS}s`)
    .sign(getSigningKey());
}

export async function hasValidConsentToken(token?: string) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSigningKey(), {
      issuer: 'stitch',
      audience: 'stitch-consent',
    });
    return payload.termsVersion === TERMS_VERSION
      && payload.privacyVersion === PRIVACY_VERSION
      && payload.adultConfirmed === true;
  } catch {
    return false;
  }
}
