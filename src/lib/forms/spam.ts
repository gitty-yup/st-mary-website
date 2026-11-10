import crypto from 'crypto';
import type { NextApiRequest } from 'next';

/**
 * Salted hash of the client's IP, for rate limiting without storing the IP.
 * On Vercel, x-forwarded-for is set by the platform.
 */
export function clientIpHash(req: NextApiRequest): string | null {
  const forwarded = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim();
  const ip = forwarded || String(req.headers['x-real-ip'] ?? '') || req.socket.remoteAddress || '';
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT || process.env.MAGIC_LINK_SECRET || 'st-mary-forms';
  return crypto.createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

/**
 * Cloudflare Turnstile check. Enabled when TURNSTILE_SECRET_KEY is set (with
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY for the widget); until then forms rely on
 * the honeypot field and the per-IP limit.
 */
export async function verifyTurnstile(token: unknown, req: NextApiRequest): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== 'string' || !token || token.length > 2048) return false;
  const body = new URLSearchParams({ secret, response: token });
  const ip = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim();
  if (ip) body.set('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const result = (await res.json()) as { success?: boolean };
    return result.success === true;
  } catch (err) {
    console.error('[turnstile]', err instanceof Error ? err.message : err);
    return false;
  }
}
