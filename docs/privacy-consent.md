# Consent and privacy implementation

## Consent storage and checks

Consent is issued by the Next.js server as a signed, HTTP-only cookie. The server validates its signature, expiry, adult confirmation, and the current Terms and Privacy Notice versions before protected APIs run. The cookie lasts up to one year and can be revoked from the Privacy Notice. Consent status does not depend on D1 availability, and the app does not store consent as a separate D1 record.

When either notice materially changes, update its page and increment the matching constant in `src/lib/consent-versions.ts`. Existing browser sessions then need to accept the new version before using protected features.

## Credentials and providers

Keep `GEMINI_API_KEY`, Cloudflare tokens, and `SUPABASE_KEY` in server environment variables. Never rename a secret to a `NEXT_PUBLIC_*` variable. Gemini REST requests send the key in the `x-goog-api-key` header. The old browser Supabase adapter now uses the same-origin Next.js API.

Google Gemini API and Cloudflare Workers AI are external processors. Their handling depends on provider, account, region, and billing tier; the privacy page links their current terms. The app currently has no speech synthesis, microphone recording, or phone-control implementation.

## Legacy Express service

The unused Express service is disabled unless `ENABLE_LEGACY_EXPRESS_API=true`, binds only to loopback, and requires a random `LEGACY_BACKEND_API_TOKEN` of at least 32 characters. Prefer the Next.js API routes for application traffic.
