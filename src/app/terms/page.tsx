import Link from 'next/link';

export const metadata = { title: 'Terms of Service | Stitch' };

export default function TermsPage() {
  return (
    <main className="policy-screen">
      <article className="policy-page">
        <Link className="policy-back" href="/">← Back to Stitch</Link>
        <p className="policy-eyebrow">STITCH · VERSION 2026-10-25</p>
        <h1>Terms of Service</h1>
        <p className="policy-updated">Last updated October 25, 2026</p>

        <h2>1. Who may use Stitch</h2>
        <p>You must be at least 18 years old to use Stitch. The Gemini API terms currently require API clients to be for adults, and Stitch may route a request to Gemini as its configured fallback even when another provider is selected. Do not use Stitch if you are under 18.</p>

        <h2>2. What Stitch does</h2>
        <p>Stitch provides AI-assisted chat, document text extraction, and image generation. AI output can be incorrect, incomplete, or unsuitable for your situation. Check important claims and do not rely on Stitch for emergency, medical, legal, financial, or other professional decisions.</p>
        <p>This version does not synthesize speech, record microphone audio, access contacts, make calls, send messages, or control your phone. Any future device feature must be separately described and must request the relevant permission before use.</p>

        <h2>3. Your content and responsibilities</h2>
        <p>Only submit prompts and upload documents you are authorized to use. Avoid sending passwords, payment details, confidential records, or sensitive personal information. Your prompts, extracted document text, and selected context may be sent to Google Gemini or Cloudflare Workers AI to generate an answer, including through the configured provider fallback.</p>
        <p>Documents and instructions inside documents are treated as reference material. They do not grant the document authority to control Stitch or override your request. You remain responsible for reviewing the output and for how you use it.</p>

        <h2>4. Accounts, availability, and acceptable use</h2>
        <p>Keep your sign-in credentials private. Do not abuse the service, bypass rate limits, attempt to access another person’s data, or use Stitch unlawfully. We may limit or suspend access to protect the service or its users. Stitch is provided as available and may change or be unavailable.</p>

        <h2>5. Privacy and changes</h2>
        <p>The <Link href="/privacy">Privacy Notice</Link> describes the information Stitch stores and the AI providers that may process it. You can revoke this browser’s consent from that notice. If these terms materially change, Stitch will ask you to review and accept the updated version before continuing.</p>
        <p>These terms are an operational draft for this application and do not replace advice from a lawyer about the laws that apply to your service.</p>
      </article>
    </main>
  );
}
