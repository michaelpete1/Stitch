import Link from 'next/link';
import ConsentRevokeButton from '@/app/components/ConsentRevokeButton';

export const metadata = { title: 'Privacy Notice | Stitch' };

export default function PrivacyPage() {
  return (
    <main className="policy-screen">
      <article className="policy-page">
        <Link className="policy-back" href="/">← Back to Stitch</Link>
        <p className="policy-eyebrow">STITCH · VERSION 2026-10-25</p>
        <h1>Privacy Notice</h1>
        <p className="policy-updated">Last updated October 25, 2026</p>
        <p>This notice describes the current Stitch codebase. Hosting, provider settings, and future features can change how information is handled; this page must be updated when those practices change.</p>

        <h2>Information Stitch handles</h2>
        <ul>
          <li><strong>Account and course data:</strong> name, email, password hash, course details, and uploaded course files or extracted text.</li>
          <li><strong>Chat data:</strong> messages, assistant replies, attached document text, generated images, feedback, and chat titles.</li>
          <li><strong>Consent and security data:</strong> a random browser chat-session identifier, the accepted Terms and Privacy Notice versions in a signed, HTTP-only cookie, and hashed rate-limit identifiers derived from the session and request IP address.</li>
          <li><strong>Device data:</strong> this version does not request microphone, contacts, call, SMS, location, or other phone permissions. It does not implement text-to-speech or phone actions.</li>
        </ul>

        <h2>How information is used and stored</h2>
        <p>Prompts and any included document text are sent to the selected AI service to produce a response. The app may fall back between Google Gemini and Cloudflare Workers AI when the selected provider is unavailable. Image prompts may be sent to those providers for image generation.</p>
        <p>Chat history, account/course data, and extracted document text are stored in Cloudflare D1. Uploaded course files are stored in Cloudflare R2. Consent is stored in a signed, HTTP-only browser cookie for up to one year; it is not stored as a separate D1 record. The chat-session cookie is HTTP-only and can last for up to one year. The application has no automatic chat or account-data retention schedule; use the in-app chat and course deletion controls where available. There is currently no self-service account deletion control.</p>
        <p>Rate-limit records contain hashed session and IP identifiers with expiry timestamps. They are used to limit abusive request volume, not to identify you by name.</p>

        <h2>AI service providers</h2>
        <p>Google and Cloudflare process submitted content under their own terms and policies. Provider practices can depend on service, account, region, and billing tier. Review the <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer">Gemini API terms</a> and <a href="https://developers.cloudflare.com/workers-ai/platform/data-usage/" target="_blank" rel="noreferrer">Cloudflare Workers AI data usage notice</a>. Do not submit information you are not comfortable sharing with the selected provider.</p>

        <h2>Your controls</h2>
        <p>You can delete chats and course files using the controls currently provided in Stitch. Revoking this browser’s consent blocks further use of Stitch from this browser until consent is given again; it does not automatically delete existing chat, account, or course data.</p>
        <ConsentRevokeButton />

        <h2>Updates</h2>
        <p>We will update this notice when data practices or features change. A material update requires renewed consent before the app can be used.</p>
        <p><Link href="/terms">Read the Terms of Service</Link>.</p>
      </article>
    </main>
  );
}
