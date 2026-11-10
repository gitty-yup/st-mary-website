/**
 * Office sign-in: one-time email links for an allowlist of addresses, then an
 * HttpOnly session cookie backed by the office_sessions table (so sessions can
 * be listed and revoked). Only SHA-256 hashes of tokens are stored.
 */
import crypto from 'crypto';
import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { recordAudit } from '@/lib/office/audit';

const DEFAULT_OFFICE_EMAILS = 'freremia@gmail.com,info@stmaryarmenianchurch.com';
const COOKIE = 'stm_office';
export const LOGIN_LINK_MINUTES = 20;
const SESSION_DAYS = 14;
const MAX_LINKS_PER_HOUR = 5;

export interface OfficeSession {
  email: string;
}

export function officeEmails(): string[] {
  return (process.env.OFFICE_EMAILS || DEFAULT_OFFICE_EMAILS)
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isOfficeEmail(email: string): boolean {
  return officeEmails().includes(email.trim().toLowerCase());
}

function newToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token) };
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Base URL for links in emails: production domain, the preview's own URL, or localhost. */
export function siteBaseUrl(): string {
  if (process.env.VERCEL_ENV === 'production') {
    return process.env.SITE_URL ?? 'https://www.stmaryarmenianchurch.com';
  }
  const host = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
  if (host) return `https://${host}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * Creates a sign-in link for an allowlisted email, or returns null if the
 * email isn't allowed or has requested too many links in the last hour.
 */
export async function createLoginLink(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  if (!isOfficeEmail(normalized)) return null;
  const [{ count }] = await query<{ count: string }>(
    "select count(*) from office_login_tokens where email = $1 and created_at > now() - interval '1 hour'",
    [normalized],
  );
  if (Number(count) >= MAX_LINKS_PER_HOUR) return null;
  const { token, hash } = newToken();
  await query(
    `insert into office_login_tokens (token_hash, email, expires_at)
     values ($1, $2, now() + make_interval(mins => $3))`,
    [hash, normalized, LOGIN_LINK_MINUTES],
  );
  return `${siteBaseUrl()}/office/verify?token=${encodeURIComponent(token)}`;
}

/** Consumes a sign-in link token (single use) and starts a session. */
export async function redeemLoginToken(token: string, res: NextApiResponse): Promise<OfficeSession | null> {
  if (!token || token.length > 100) return null;
  const rows = await query<{ email: string }>(
    `update office_login_tokens set used_at = now()
     where token_hash = $1 and used_at is null and expires_at > now()
     returning email`,
    [hashToken(token)],
  );
  const email = rows[0]?.email;
  if (!email || !isOfficeEmail(email)) return null;
  const session = newToken();
  await query(
    `insert into office_sessions (token_hash, email, expires_at)
     values ($1, $2, now() + make_interval(days => $3))`,
    [session.hash, email, SESSION_DAYS],
  );
  res.setHeader('Set-Cookie', cookieHeader(session.token, SESSION_DAYS * 86400));
  await recordAudit(null, email, 'sign_in');
  return { email };
}

export async function endSession(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const token = readCookie(req.headers.cookie);
  if (token) {
    const rows = await query<{ email: string }>(
      'update office_sessions set revoked_at = now() where token_hash = $1 and revoked_at is null returning email',
      [hashToken(token)],
    );
    if (rows[0]) await recordAudit(null, rows[0].email, 'sign_out');
  }
  res.setHeader('Set-Cookie', cookieHeader('', 0));
}

async function sessionFromCookie(cookieHeaderValue: string | undefined): Promise<OfficeSession | null> {
  const token = readCookie(cookieHeaderValue);
  if (!token || token.length > 100) return null;
  const rows = await query<{ email: string }>(
    `update office_sessions set last_seen_at = now()
     where token_hash = $1 and revoked_at is null and expires_at > now()
     returning email`,
    [hashToken(token)],
  );
  const email = rows[0]?.email;
  // Removing an address from OFFICE_EMAILS locks it out immediately.
  return email && isOfficeEmail(email) ? { email } : null;
}

/** For office pages: returns the session, or a redirect to the sign-in page. */
export async function requireOfficePage(
  ctx: GetServerSidePropsContext,
): Promise<{ session: OfficeSession } | { redirect: { destination: string; permanent: false } }> {
  ctx.res.setHeader('Cache-Control', 'private, no-store');
  const session = await sessionFromCookie(ctx.req.headers.cookie);
  if (session) return { session };
  const next = encodeURIComponent(ctx.resolvedUrl);
  return { redirect: { destination: `/office/login?next=${next}`, permanent: false } };
}

/**
 * For office API routes: returns the session, or sends 401/403 and returns
 * null. State-changing requests must come from this site (Origin check), on
 * top of the SameSite=Lax cookie.
 */
export async function requireOfficeApi(req: NextApiRequest, res: NextApiResponse): Promise<OfficeSession | null> {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET' && req.method !== 'HEAD' && !sameOrigin(req)) {
    res.status(403).json({ error: 'Cross-site request refused.' });
    return null;
  }
  const session = await sessionFromCookie(req.headers.cookie);
  if (!session) {
    res.status(401).json({ error: 'Your session has ended. Please sign in again.' });
    return null;
  }
  return session;
}

export function sameOrigin(req: NextApiRequest): boolean {
  const origin = req.headers.origin;
  if (!origin) return true; // same-origin fetches from older browsers may omit it
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

function readCookie(header: string | undefined): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === COOKIE) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function cookieHeader(value: string, maxAgeSeconds: number): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}
