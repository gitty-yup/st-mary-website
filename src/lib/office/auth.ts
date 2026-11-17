/**
 * Office sign-in: one-time email links for an allowlist of addresses, then an
 * HttpOnly session cookie backed by the office_sessions table (so sessions can
 * be listed and revoked). Only SHA-256 hashes of tokens are stored.
 */
import crypto from 'crypto';
import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { recordAudit } from '@/lib/office/audit';
import { homeFor, safeOfficePath, type OfficeArea } from '@/lib/office/nav';

export type { OfficeArea } from '@/lib/office/nav';

const DEFAULT_OFFICE_EMAILS = 'freremia@gmail.com,info@stmaryarmenianchurch.com';
const COOKIE = 'stm_office';
export const LOGIN_LINK_MINUTES = 20;
const SESSION_DAYS = 14;
const MAX_LINKS_PER_HOUR = 5;

export interface OfficeSession {
  email: string;
  areas: OfficeArea[];
}

function emailList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function officeEmails(): string[] {
  return emailList(process.env.OFFICE_EMAILS || DEFAULT_OFFICE_EMAILS);
}

/** Addresses that manage photos (GALLERY_EDITORS) but never see certificate records. */
export function galleryEditorEmails(): string[] {
  return emailList(process.env.GALLERY_EDITORS);
}

/**
 * OFFICE_EMAILS can use the whole office. GALLERY_EDITORS can only manage photos:
 * they never see certificate records. People the office added on Photos → People
 * can share photos, and leaders among them can also review what others share.
 */
export async function officeAreas(email: string): Promise<OfficeArea[]> {
  const e = email.trim().toLowerCase();
  if (officeEmails().includes(e)) return ['certificates', 'gallery', 'people', 'review', 'share'];
  if (galleryEditorEmails().includes(e)) return ['gallery', 'review', 'share'];
  const rows = await query<{ role: string }>('select role from gallery_people where email = $1 and removed_at is null', [e]);
  if (rows[0]?.role === 'leader') return ['review', 'share'];
  if (rows[0]?.role === 'uploader') return ['share'];
  return [];
}

/** May this address sign in at all? */
export async function isOfficeEmail(email: string): Promise<boolean> {
  return (await officeAreas(email)).length > 0;
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
export async function createLoginLink(email: string, next?: string | null): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  if (!(await isOfficeEmail(normalized))) return null;
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
  const dest = safeOfficePath(next);
  return `${siteBaseUrl()}/office/verify?token=${encodeURIComponent(token)}${dest ? `&next=${encodeURIComponent(dest)}` : ''}`;
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
  const areas = email ? await officeAreas(email) : [];
  if (!email || !areas.length) return null;
  const session = newToken();
  await query(
    `insert into office_sessions (token_hash, email, expires_at)
     values ($1, $2, now() + make_interval(days => $3))`,
    [session.hash, email, SESSION_DAYS],
  );
  res.setHeader('Set-Cookie', cookieHeader(session.token, SESSION_DAYS * 86400));
  await recordAudit(null, email, 'sign_in');
  return { email, areas };
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

/** The signed-in person (and what they can use), or null. */
export async function sessionFromCookie(cookieHeaderValue: string | undefined): Promise<OfficeSession | null> {
  const token = readCookie(cookieHeaderValue);
  if (!token || token.length > 100) return null;
  const rows = await query<{ email: string }>(
    `update office_sessions set last_seen_at = now()
     where token_hash = $1 and revoked_at is null and expires_at > now()
     returning email`,
    [hashToken(token)],
  );
  const email = rows[0]?.email;
  // Removing an address from OFFICE_EMAILS / GALLERY_EDITORS, or someone from
  // Photos → People, locks them out immediately.
  const areas = email ? await officeAreas(email) : [];
  return email && areas.length ? { email, areas } : null;
}

/** Signs someone out everywhere (when the office removes them from Photos → People). */
export async function endSessionsFor(email: string): Promise<void> {
  await query('update office_sessions set revoked_at = now() where email = $1 and revoked_at is null', [email.trim().toLowerCase()]);
}

/**
 * For office pages: returns the session, or a redirect to the sign-in page
 * (not signed in) or to the part of the office this person can use.
 */
export async function requireOfficePage(
  ctx: GetServerSidePropsContext,
  area: OfficeArea = 'certificates',
): Promise<{ session: OfficeSession } | { redirect: { destination: string; permanent: false } }> {
  ctx.res.setHeader('Cache-Control', 'private, no-store');
  const session = await sessionFromCookie(ctx.req.headers.cookie);
  if (session?.areas.includes(area)) return { session };
  if (session) return { redirect: { destination: homeFor(session.areas), permanent: false } };
  const next = encodeURIComponent(ctx.resolvedUrl);
  return { redirect: { destination: `/office/login?next=${next}`, permanent: false } };
}

/**
 * For office API routes: returns the session, or sends 401/403 and returns
 * null. State-changing requests must come from this site (Origin check), on
 * top of the SameSite=Lax cookie.
 */
export async function requireOfficeApi(
  req: NextApiRequest,
  res: NextApiResponse,
  area: OfficeArea = 'certificates',
): Promise<OfficeSession | null> {
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
  if (!session.areas.includes(area)) {
    res.status(403).json({ error: 'Your sign-in doesn’t include this part of the office.' });
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
