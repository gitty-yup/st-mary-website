/**
 * Event links (gallery step 2c). The office makes a link for one event on Photos → Links;
 * anyone who has it can send photos of that event at /event-photos/<code> without
 * signing in, until it expires, the office ends it, or it has taken its number of
 * photos. Every photo sent with a link waits for review.
 *
 * Someone opening a link gives their name and passes the "verify you're human" check;
 * they then get a pass (a cookie, stored only as a hash) that lets them send photos for
 * a few hours.
 */
import crypto from 'crypto';
import { query } from '@/lib/db';
import { recordAudit } from '@/lib/office/audit';
import { RecordError, parishToday } from '@/lib/office/records';
import { LINK_DAYS, LINK_DAYS_DEFAULT, LINK_PHOTOS, LINK_PHOTOS_DEFAULT, eventName, linkLastDay } from '@/lib/gallery/types';
import type { Sender } from '@/lib/gallery/sharing';

const MAX_DAYS = Math.max(...LINK_DAYS);
const MAX_PHOTOS = Math.max(...LINK_PHOTOS);
/** A pass lasts this long (or until an hour after the link expires); then they give their name again. */
const PASS_HOURS = 12;
/** When the office ends a link, photos already on their way can still finish for this long. */
const ENDED_GRACE_MINUTES = 15;

const CODE_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789';
const CODE = /^[abcdefghjkmnpqrstuvwxyz23456789]{10}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COOKIE = 'stm_photo_pass';
const MAX_NAME = 80;

export type LinkState = 'open' | 'expired' | 'ended' | 'full';

export interface PhotoLink {
  id: string;
  code: string;
  /** Where it opens on the website: /event-photos/<code>. */
  path: string;
  eventId: string;
  /** The event's name with its year, as lists show it. */
  eventName: string;
  maxPhotos: number;
  /** Photos sent with it so far (waiting, approved or turned down). */
  photos: number;
  expiresAt: string;
  createdBy: string;
  createdAt: string;
  endedAt: string | null;
  endedBy: string | null;
  state: LinkState;
}

const SELECT = `
  select l.id, l.code, l.event_id, l.max_photos, l.expires_at, l.created_by, l.created_at, l.ended_at, l.ended_by,
         e.title as event_title, e.event_date::text as event_date,
         (select count(*)::int from gallery_photos p where p.link_id = l.id) as photos
  from gallery_links l join gallery_events e on e.id = l.event_id`;

const iso = (d: Date | string | null) => (d ? new Date(d).toISOString() : null);

function toLink(r: Record<string, any>): PhotoLink {
  const state: LinkState = r.ended_at
    ? 'ended'
    : new Date(r.expires_at).getTime() <= Date.now()
      ? 'expired'
      : r.photos >= r.max_photos
        ? 'full'
        : 'open';
  return {
    id: r.id,
    code: r.code,
    path: `/event-photos/${r.code}`,
    eventId: r.event_id,
    eventName: eventName({ title: r.event_title, eventDate: r.event_date }),
    maxPhotos: r.max_photos,
    photos: r.photos,
    expiresAt: iso(r.expires_at)!,
    createdBy: r.created_by,
    createdAt: iso(r.created_at)!,
    endedAt: iso(r.ended_at),
    endedBy: r.ended_by ?? null,
    state,
  };
}

/** What someone opening a link that no longer works is told. */
export function closedMessage(link: PhotoLink): string {
  if (link.state === 'expired') return `This link stopped working after ${linkLastDay(link.expiresAt)}.`;
  if (link.state === 'ended') return 'This link has been switched off.';
  if (link.state === 'full') return 'This link has received all the photos it can take. Thank you!';
  return '';
}

// --- The office: making and ending links -----------------------------------------------

/** Open links first (soonest to expire), then the rest, newest first. */
export async function listLinks(): Promise<PhotoLink[]> {
  const rows = await query(
    `${SELECT} order by (l.ended_at is null and l.expires_at > now()) desc,
       case when l.ended_at is null and l.expires_at > now() then l.expires_at end, l.created_at desc limit 100`,
  );
  return rows.map(toLink);
}

async function linkById(id: string): Promise<PhotoLink> {
  const [row] = await query(`${SELECT} where l.id = $1`, [id]);
  if (!row) throw new RecordError('That link no longer exists. Reload the page.', 404);
  return toLink(row);
}

function newCode(): string {
  return Array.from({ length: 10 }, () => CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]).join('');
}

export async function createLink(input: Record<string, unknown>, actor: string): Promise<PhotoLink> {
  const eventId = typeof input.eventId === 'string' && UUID.test(input.eventId) ? input.eventId : '';
  if (!eventId) throw new RecordError('Choose the event.', 400);
  const days = Number(input.days ?? LINK_DAYS_DEFAULT);
  if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) throw new RecordError(`A link can work for 1 to ${MAX_DAYS} days.`, 400);
  const maxPhotos = Number(input.maxPhotos ?? LINK_PHOTOS_DEFAULT);
  if (!Number.isInteger(maxPhotos) || maxPhotos < 1 || maxPhotos > MAX_PHOTOS) {
    throw new RecordError(`A link can take 1 to ${MAX_PHOTOS} photos.`, 400);
  }
  if (!(await query('select 1 from gallery_events where id = $1', [eventId])).length) {
    throw new RecordError('That event no longer exists. Reload the page.', 409);
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    // Works through the end of the day `days` after today, Pacific time.
    const rows = await query<{ id: string }>(
      `insert into gallery_links (code, event_id, max_photos, expires_at, created_by)
       values ($1, $2, $3, (($4::date + $5::int + 1)::timestamp at time zone 'America/Los_Angeles'), $6)
       on conflict (code) do nothing returning id`,
      [newCode(), eventId, maxPhotos, parishToday(), days, actor],
    );
    if (rows[0]) {
      const link = await linkById(rows[0].id);
      await recordAudit(null, actor, 'gallery', { what: 'link', id: link.id, created: true, event: link.eventName, days, maxPhotos });
      return link;
    }
  }
  throw new Error('could not make a unique link code');
}

/** Stops a link working. Photos already sent stay; ones on their way can still finish. */
export async function endLink(idValue: unknown, actor: string): Promise<PhotoLink> {
  const id = typeof idValue === 'string' && UUID.test(idValue) ? idValue : '';
  if (!id) throw new RecordError('Unknown link.', 400);
  const ended = await query('update gallery_links set ended_at = now(), ended_by = $2 where id = $1 and ended_at is null returning id', [id, actor]);
  const link = await linkById(id);
  if (ended.length) {
    await query(
      `update gallery_link_passes set expires_at = least(expires_at, now() + make_interval(mins => $2)) where link_id = $1`,
      [id, ENDED_GRACE_MINUTES],
    );
    await recordAudit(null, actor, 'gallery', { what: 'link', id, ended: true, event: link.eventName, photos: link.photos });
  }
  return link;
}

// --- Someone with a link ---------------------------------------------------------------

export async function linkByCode(code: string): Promise<PhotoLink | null> {
  if (!CODE.test(code)) return null;
  const [row] = await query(`${SELECT} where l.code = $1`, [code]);
  return row ? toLink(row) : null;
}

const hash = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

/** Gives someone a pass to send photos with this link. */
export async function startPass(link: PhotoLink, nameValue: unknown): Promise<{ token: string; name: string; seconds: number }> {
  if (link.state !== 'open') throw new RecordError(closedMessage(link), 410);
  const name = typeof nameValue === 'string' ? nameValue.replace(/\s+/g, ' ').trim() : '';
  if (!name) throw new RecordError('Enter your name.', 400);
  if (name.length > MAX_NAME) throw new RecordError(`Your name is too long (at most ${MAX_NAME} characters).`, 400);
  const token = crypto.randomBytes(32).toString('base64url');
  const [row] = await query<{ seconds: number }>(
    `insert into gallery_link_passes (link_id, token_hash, name, expires_at)
     values ($1, $2, $3, least(now() + make_interval(hours => $4), $5::timestamptz + interval '1 hour'))
     returning greatest(1, extract(epoch from expires_at - now()))::int as seconds`,
    [link.id, hash(token), name, PASS_HOURS, link.expiresAt],
  );
  return { token, name, seconds: row.seconds };
}

function readCookie(header: string | undefined): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === COOKIE) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export function passCookie(token: string, maxAgeSeconds: number): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

/**
 * The person sending photos with this link (from their pass), or null if they have no
 * pass for it, or it has run out. `link.state` says whether it still takes new photos.
 */
export async function linkSender(code: string, cookieHeader: string | undefined): Promise<{ link: PhotoLink; sender: Sender } | null> {
  const token = readCookie(cookieHeader);
  if (!token || token.length > 100 || !CODE.test(code)) return null;
  const [pass] = await query<{ id: string; name: string; link_id: string }>(
    `select p.id, p.name, p.link_id from gallery_link_passes p join gallery_links l on l.id = p.link_id
     where p.token_hash = $1 and l.code = $2 and p.expires_at > now()`,
    [hash(token), code],
  );
  if (!pass) return null;
  const link = await linkById(pass.link_id);
  return {
    link,
    sender: {
      email: null,
      name: pass.name,
      publishes: false,
      actor: `${pass.name} (event link)`,
      link: { id: link.id, passId: pass.id, eventId: link.eventId, maxPhotos: link.maxPhotos },
    },
  };
}
