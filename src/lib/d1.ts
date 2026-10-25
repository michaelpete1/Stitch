/** Small server-only client for Cloudflare D1's HTTPS query API.
 * This keeps the existing Next.js hosting/runtime; only the D1 credentials are needed.
 */
export type D1Value = string | number | null;

type D1Response<T> = {
  success: boolean;
  errors?: { message?: string }[];
  result?: { success?: boolean; results?: T[]; meta?: { changes?: number; last_row_id?: number } }[];
};

export async function d1Query<T>(sql: string, params: D1Value[] = []): Promise<T[]> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const token = process.env.CLOUDFLARE_D1_DATABASE_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !databaseId || !token) {
    throw new Error('Cloudflare D1 is not configured. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, and CLOUDFLARE_D1_DATABASE_TOKEN.');
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/d1/database/${encodeURIComponent(databaseId)}/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, params }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    },
  );
  const payload = await response.json() as D1Response<T>;
  if (!response.ok || !payload.success || payload.result?.some((result) => result.success === false)) {
    const reason = payload.errors?.map((error) => error.message).filter(Boolean).join('; ');
    throw new Error(reason || `Cloudflare D1 query failed (${response.status})`);
  }
  return payload.result?.[0]?.results ?? [];
}

export async function d1Run(sql: string, params: D1Value[] = []) {
  return d1Query<{ changes?: number; last_row_id?: number }>(sql, params);
}

export function isChatId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function dateFromMillis(value: number | string) {
  return new Date(Number(value)).toISOString();
}
