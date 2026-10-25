import { getCloudflareContext } from '@opennextjs/cloudflare';

export type D1Value = string | number | null;

/** Use the Worker binding so Next dev, Wrangler preview, and production share one API. */
function database() {
  return getCloudflareContext().env.DB;
}

export async function d1Query<T>(sql: string, params: D1Value[] = []): Promise<T[]> {
  const result = await database().prepare(sql).bind(...params).all<T>();
  return result.results;
}

export async function d1First<T>(sql: string, params: D1Value[] = []): Promise<T | null> {
  return database().prepare(sql).bind(...params).first<T>();
}

export async function d1Run(sql: string, params: D1Value[] = []) {
  const result = await database().prepare(sql).bind(...params).run();
  return { changes: result.meta.changes, success: result.success, meta: result.meta };
}

export async function d1Batch(queries: { sql: string; params?: D1Value[] }[]) {
  const db = database();
  return db.batch(queries.map(({ sql, params = [] }) => db.prepare(sql).bind(...params)));
}

export function isChatId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function dateFromMillis(value: number | string) {
  return new Date(Number(value)).toISOString();
}
