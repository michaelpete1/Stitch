'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/consent-versions';

type Status = 'loading' | 'required' | 'accepted' | 'error';

export default function ConsentGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLegalPage = pathname === '/terms' || pathname === '/privacy';
  const [status, setStatus] = useState<Status>('loading');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLegalPage) return;
    let active = true;
    fetch('/api/consent', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Could not check consent status.');
        if (active) setStatus(payload.accepted ? 'accepted' : 'required');
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : 'Could not check consent status.');
        setStatus('error');
      });
    return () => { active = false; };
  }, [isLegalPage]);

  const accept = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/consent', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acceptTerms: true,
          acknowledgePrivacy: true,
          adultConfirmed: true,
          termsVersion: TERMS_VERSION,
          privacyVersion: PRIVACY_VERSION,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Could not save consent.');
      setStatus('accepted');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save consent.');
    } finally {
      setSaving(false);
    }
  };

  if (isLegalPage || status === 'accepted') return children;
  if (status === 'loading') {
    return (
      <main className="consent-screen consent-screen-loading" aria-busy="true">
        <div className="consent-loading-mark"><Image src="/stitch-mark.png" alt="" width={54} height={54} priority /></div>
        <p>Preparing your Stitch workspace?</p>
      </main>
    );
  }

  return (
    <main className="consent-screen">
      <section className="consent-card" role="dialog" aria-modal="true" aria-labelledby="consent-title" aria-describedby="consent-description">
        <header className="consent-brand">
          <Image src="/stitch-mark.png" alt="" width={48} height={48} priority />
          <span className="consent-brand-wordmark">Stitch<small>YOUR AI WORKSPACE</small></span>
          <span className="consent-brand-step">WELCOME</span>
        </header>
        <div className="consent-divider" />
        <p className="consent-eyebrow"><span className="consent-eyebrow-dot" /> A quick privacy check</p>
        <h1 id="consent-title">Your ideas stay in your hands.</h1>
        <p className="consent-intro" id="consent-description">Before you get started, here is what Stitch does with the things you share.</p>
        <div className="consent-details">
          <div className="consent-detail-icon" aria-hidden="true"><span>?</span></div>
          <p><strong>AI helps with your requests.</strong> Prompts and attached document text may be sent to Gemini or Cloudflare Workers AI, including the configured fallback.</p>
        </div>
        <div className="consent-details">
          <div className="consent-detail-icon consent-detail-icon-safe" aria-hidden="true"><span>?</span></div>
          <p><strong>No phone access in this version.</strong> Stitch does not record microphone audio, speak replies, access contacts, make calls, send texts, or control your phone.</p>
        </div>
        <form onSubmit={accept}>
          <p className="consent-assent">By continuing, you confirm you are at least 18, agree to our <Link href="/terms" target="_blank" rel="noreferrer">Terms</Link>, and acknowledge our <Link href="/privacy" target="_blank" rel="noreferrer">Privacy Notice</Link>.</p>
          {error && <p className="consent-error" role="alert">{error}</p>}
          <button className="consent-submit" type="submit" disabled={saving}>
            <span>{saving ? 'Saving your choice?' : 'Continue to Stitch'}</span>
            {!saving && <span className="consent-submit-arrow" aria-hidden="true">?</span>}
          </button>
          <p className="consent-footnote"><span aria-hidden="true">??</span> Your choice is saved securely in this browser. You can change it from the Privacy Notice.</p>
        </form>
      </section>
    </main>
  );
}
