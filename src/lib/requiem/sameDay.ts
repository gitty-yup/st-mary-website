import { randomBytes, timingSafeEqual } from 'crypto';
import type { IncomingMessage } from 'http';
import { query } from '@/lib/db';
import { siteBaseUrl } from '@/lib/office/auth';

/**
 * The parish office's permanent same-day QR code and link. The link carries a random secret;
 * with it, the request form also allows today (on a Sunday or Merelots day, until 1:00 pm).
 * The office can replace the secret, which stops every printed sign and shared link working.
 */

const KEY = 'same_day_token';
const newToken = () => randomBytes(18).toString('base64url');

/** The current secret, made the first time it's needed. */
export async function sameDayToken(): Promise<string> {
  await query('insert into requiem_settings (key, value) values ($1, $2) on conflict (key) do nothing', [KEY, newToken()]);
  const rows = await query('select value from requiem_settings where key = $1', [KEY]);
  return rows[0].value;
}

/** A new secret; old signs and links stop working. */
export async function replaceSameDayToken(): Promise<string> {
  const token = newToken();
  await query(
    'insert into requiem_settings (key, value) values ($1, $2) on conflict (key) do update set value = excluded.value, updated_at = now()',
    [KEY, token],
  );
  return token;
}

export async function isSameDayToken(candidate: unknown): Promise<boolean> {
  if (typeof candidate !== 'string' || !/^[A-Za-z0-9_-]{16,64}$/.test(candidate)) return false;
  const rows = await query('select value from requiem_settings where key = $1', [KEY]);
  if (!rows[0]) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(rows[0].value as string);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const sameDayUrl = (token: string) => `${siteBaseUrl()}/requiem/request?sameday=${token}`;

/**
 * "Now", for the same-day rules. Automated tests may pretend it's another time with an
 * `x-requiem-now` header, but only where REQUIEM_FAKE_NOW_ALLOWED=1 is set (never on Vercel).
 */
export function requiemNow(req: IncomingMessage): Date {
  if (process.env.REQUIEM_FAKE_NOW_ALLOWED === '1' && !process.env.VERCEL) {
    const h = req.headers['x-requiem-now'];
    const d = typeof h === 'string' ? new Date(h) : null;
    if (d && !Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}
