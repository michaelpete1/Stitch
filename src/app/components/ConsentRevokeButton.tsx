'use client';

import { useState } from 'react';

export default function ConsentRevokeButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const revoke = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/consent', { method: 'DELETE', credentials: 'include' });
      const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
      if (!response.ok) throw new Error(payload.error || 'Could not revoke consent.');
      window.location.assign('/');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not revoke consent.');
      setBusy(false);
    }
  };

  return <div className="consent-revoke"><button type="button" onClick={() => void revoke()} disabled={busy}>{busy ? 'Revoking…' : 'Revoke this browser’s consent'}</button>{error && <p role="alert">{error}</p>}</div>;
}
