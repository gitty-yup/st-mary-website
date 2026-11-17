/**
 * Photos people share (gallery step 2b):
 * - the list of people who may share photos, or also review them (Photos → People);
 * - uploads: the phone sends each photo straight to R2 (startUpload gives it a link),
 *   then finishUpload makes the web copy and thumbnail (turned upright, location and
 *   other camera details removed) and adds the photo, waiting for review unless the
 *   sender can review;
 * - review: approve, or turn down (removes its files);
 * - the daily job: removes the files of photos deleted more than 30 days ago, clears
 *   uploads that never finished, and emails reviewers when photos are waiting.
 * Changes are logged in audit_events as action 'gallery'.
 */
import crypto from 'crypto';
import sharp from 'sharp';
import { query, withTransaction } from '@/lib/db';
import { recordAudit } from '@/lib/office/audit';
import { endSessionsFor, galleryEditorEmails, officeEmails, type OfficeSession } from '@/lib/office/auth';
import { RecordError } from '@/lib/office/records';
import { MAX_CAPTION } from '@/lib/gallery/types';
import { deleteObject, getObject, putObject, storageReady, storedSize, uploadLink, uploadPrefix } from '@/lib/storage/r2';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;

export const MAX_PHOTO_MB = 30;
const MAX_PHOTO_BYTES = MAX_PHOTO_MB * 1024 * 1024;
/** Photos one person can send in a day. */
const MAX_PER_DAY = 300;
/** Deleted shared photos can be brought back for this long; then their files are removed. */
export const DELETED_KEEP_DAYS = 30;
const WEB_MAX = 2000; // longest side, px (same as the site's own photos)
const WEB_QUALITY = 80;
const THUMB_SIZE = 480; // shortest side, px (same as scripts/gallery-sync.js)

const EXTENSIONS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const TYPE_BY_EXTENSION: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

function clean(value: unknown, max: number, what: string, required = false): string {
  const s = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  if (required && !s) throw new RecordError(`Enter ${what}.`, 400);
  if (s.length > max) throw new RecordError(`${what[0].toUpperCase()}${what.slice(1)} is too long (at most ${max} characters).`, 400);
  return s;
}

function uuid(value: unknown, what: string): string {
  const s = typeof value === 'string' ? value : '';
  if (!UUID.test(s)) throw new RecordError(`Unknown ${what}.`, 400);
  return s;
}

const iso = (d: Date | null) => (d ? new Date(d).toISOString() : null);

// --- People -----------------------------------------------------------------------------

export type SharingRole = 'uploader' | 'leader';

export interface SharingPerson {
  id: string;
  email: string;
  name: string;
  role: SharingRole;
  addedAt: string;
  invitedAt: string | null;
  /** Photos they've shared that are in the gallery or waiting for review. */
  photos: number;
  lastShared: string | null;
}

export async function listPeople(): Promise<SharingPerson[]> {
  const rows = await query(
    `select p.id, p.email, p.name, p.role, p.added_at, p.invited_at,
            (select count(*)::int from gallery_photos g
              where g.source = 'upload' and g.uploaded_by = p.email and g.status in ('pending', 'published', 'hidden') and g.deleted_at is null) as photos,
            (select max(g.created_at) from gallery_photos g where g.source = 'upload' and g.uploaded_by = p.email) as last_shared
     from gallery_people p where p.removed_at is null order by lower(p.name), p.email`,
  );
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role,
    addedAt: iso(r.added_at)!,
    invitedAt: iso(r.invited_at),
    photos: r.photos,
    lastShared: iso(r.last_shared),
  }));
}

function role(value: unknown): SharingRole {
  if (value !== 'uploader' && value !== 'leader') throw new RecordError('Choose what they can do.', 400);
  return value;
}

/** Adds someone to the list. The caller sends the invitation. */
export async function addPerson(input: Record<string, unknown>, actor: string): Promise<SharingPerson> {
  const name = clean(input.name, 80, 'a name', true);
  const email = clean(input.email, 200, 'an email address', true).toLowerCase();
  if (!EMAIL.test(email)) throw new RecordError('Enter a valid email address.', 400);
  const r = role(input.role);
  if (officeEmails().includes(email) || galleryEditorEmails().includes(email)) {
    throw new RecordError('That address already uses the office, so it can share and review photos already.', 409);
  }
  let id: string;
  try {
    [{ id }] = await query<{ id: string }>('insert into gallery_people (email, name, role, added_by) values ($1, $2, $3, $4) returning id', [email, name, r, actor]);
  } catch (err) {
    if ((err as { code?: string }).code === '23505') throw new RecordError('That address is already on the list.', 409);
    throw err;
  }
  await recordAudit(null, actor, 'gallery', { what: 'person', id, email, role: r, added: true });
  return (await listPeople()).find((p) => p.id === id)!;
}

export async function personById(idValue: unknown): Promise<SharingPerson> {
  const id = uuid(idValue, 'person');
  const person = (await listPeople()).find((p) => p.id === id);
  if (!person) throw new RecordError('That person is no longer on the list. Reload the page.', 404);
  return person;
}

export async function markInvited(id: string): Promise<void> {
  await query('update gallery_people set invited_at = now() where id = $1', [id]);
}

export async function changeRole(idValue: unknown, roleValue: unknown, actor: string): Promise<SharingPerson> {
  const person = await personById(idValue);
  const r = role(roleValue);
  await query('update gallery_people set role = $2 where id = $1 and removed_at is null', [person.id, r]);
  await recordAudit(null, actor, 'gallery', { what: 'person', id: person.id, email: person.email, role: r });
  return { ...person, role: r };
}

/** Takes someone off the list and signs them out everywhere. Photos they shared stay. */
export async function removePerson(idValue: unknown, actor: string): Promise<void> {
  const person = await personById(idValue);
  await query('update gallery_people set removed_at = now(), removed_by = $2 where id = $1 and removed_at is null', [person.id, actor]);
  await endSessionsFor(person.email);
  await recordAudit(null, actor, 'gallery', { what: 'person', id: person.id, email: person.email, removed: true });
}

/** Everyone who can review: the office, gallery editors and leaders. */
export async function reviewerEmails(): Promise<string[]> {
  const leaders = await query<{ email: string }>("select email from gallery_people where role = 'leader' and removed_at is null order by email");
  return Array.from(new Set([...officeEmails(), ...galleryEditorEmails(), ...leaders.map((l) => l.email)]));
}

// --- Uploads ----------------------------------------------------------------------------

function contentTypeFor(name: string, type: string): string {
  const t = type.toLowerCase();
  if (EXTENSIONS[t]) return t;
  const ext = name.toLowerCase().split('.').pop() ?? '';
  if (TYPE_BY_EXTENSION[ext] && (!t || t === 'application/octet-stream')) return TYPE_BY_EXTENSION[ext];
  if (/hei[cf]/.test(t) || ext === 'heic' || ext === 'heif') {
    throw new RecordError(
      'This photo is in Apple’s HEIC format, which the website can’t use. Photos sent from an iPhone are converted automatically; on a Mac, open it in Photos, choose File → Export, and send the JPEG copy.',
      415,
    );
  }
  throw new RecordError('Only photos can be shared (JPEG, PNG or WebP files).', 415);
}

async function nameFor(email: string): Promise<string> {
  const rows = await query<{ name: string }>('select name from gallery_people where email = $1 and removed_at is null', [email]);
  return rows[0]?.name ?? '';
}

export interface UploadStart {
  id: string;
  /** PUT the file here, with this Content-Type. */
  url: string;
  contentType: string;
}

/** Step 1 of sending a photo: checks it and returns a link the phone sends the file to. */
export async function startUpload(session: OfficeSession, input: Record<string, unknown>): Promise<UploadStart> {
  const name = (typeof input.name === 'string' ? input.name : '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 200) || 'photo';
  const bytes = Number(input.size);
  if (!Number.isInteger(bytes) || bytes <= 0) throw new RecordError('That file is empty.', 400);
  if (bytes > MAX_PHOTO_BYTES) throw new RecordError(`That photo is larger than ${MAX_PHOTO_MB} MB, the most the website accepts.`, 413);
  const contentType = contentTypeFor(name, typeof input.type === 'string' ? input.type : '');
  const batchId = uuid(input.batchId, 'batch');
  const eventId = input.eventId ? uuid(input.eventId, 'event') : null;
  if (eventId && !(await query('select 1 from gallery_events where id = $1', [eventId])).length) {
    throw new RecordError('That event no longer exists. Reload the page.', 409);
  }
  const caption = clean(input.caption, MAX_CAPTION, 'the caption');
  if (!storageReady()) throw new RecordError('Photo sharing isn’t set up on this website yet.', 503);
  const [{ n }] = await query<{ n: number }>(
    `select (select count(*) from gallery_uploads where uploaded_by = $1 and created_at > now() - interval '1 day')
          + (select count(*) from gallery_photos where source = 'upload' and uploaded_by = $1 and created_at > now() - interval '1 day') as n`,
    [session.email],
  );
  if (Number(n) >= MAX_PER_DAY) {
    throw new RecordError(`You’ve sent ${MAX_PER_DAY} photos today, the most for one day. Please send the rest tomorrow.`, 429);
  }
  const id = crypto.randomUUID();
  const month = new Date().toISOString().slice(0, 7).replace('-', '/');
  const key = `${uploadPrefix()}originals/${month}/${id}.${EXTENSIONS[contentType]}`;
  await query(
    `insert into gallery_uploads (id, uploaded_by, uploader_name, batch_id, original_key, original_name, content_type, bytes, event_id, caption)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [id, session.email, await nameFor(session.email), batchId, key, name, contentType, bytes, eventId, caption],
  );
  return { id, url: await uploadLink(key, contentType), contentType };
}

/** DateTimeOriginal from a raw EXIF block ("YYYY:MM:DD HH:MM:SS") as YYYY-MM-DD, or null. Same as scripts/gallery-sync.js. */
export function dateTaken(exif: Buffer): string | null {
  try {
    const t = exif.indexOf('Exif\0\0') === 0 ? 6 : 0;
    const le = exif.toString('ascii', t, t + 2) === 'II';
    const u16 = (o: number) => (le ? exif.readUInt16LE(t + o) : exif.readUInt16BE(t + o));
    const u32 = (o: number) => (le ? exif.readUInt32LE(t + o) : exif.readUInt32BE(t + o));
    const find = (ifd: number, tag: number) => {
      for (let i = 0, n = u16(ifd); i < n; i++) {
        const e = ifd + 2 + i * 12;
        if (u16(e) === tag) return e;
      }
      return null;
    };
    const exifPtr = find(u32(4), 0x8769);
    const entry = exifPtr && find(u32(exifPtr + 8), 0x9003);
    if (!entry) return null;
    const count = u32(entry + 4);
    const at = count > 4 ? u32(entry + 8) : entry + 8;
    const m = /^(\d{4}):(\d{2}):(\d{2})/.exec(exif.toString('ascii', t + at, t + at + count));
    if (!m || Number(m[1]) < 1990 || m[2] === '00') return null;
    const date = `${m[1]}-${m[2]}-${m[3] === '00' ? '01' : m[3]}`;
    // A camera clock in the future is wrong; use the day it was sent instead.
    return date <= new Date(Date.now() + 86_400_000).toISOString().slice(0, 10) ? date : null;
  } catch {
    return null;
  }
}

/**
 * The web copy (JPEG, at most 2000 px) and thumbnail (WebP) of a photo, turned
 * upright, with the camera details (location included) left out; and the date it was
 * taken. Throws if it isn't a JPEG, PNG or WebP photo.
 */
export async function preparePhoto(original: Buffer) {
  const image = () => sharp(original, { limitInputPixels: 120_000_000, failOn: 'error' });
  const meta = await image().metadata();
  if (!meta.format || !['jpeg', 'png', 'webp'].includes(meta.format)) throw new Error(`not a photo (${meta.format ?? 'unknown'})`);
  const web = await image()
    .rotate()
    .flatten({ background: '#ffffff' })
    .resize({ width: WEB_MAX, height: WEB_MAX, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: WEB_QUALITY, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  const thumb = await image()
    .rotate()
    .resize({ width: THUMB_SIZE, height: THUMB_SIZE, fit: 'outside', withoutEnlargement: true })
    .webp({ quality: 70 })
    .toBuffer();
  return { web: web.data, width: web.info.width, height: web.info.height, thumb, takenOn: meta.exif ? dateTaken(meta.exif) : null };
}

export interface UploadedPhoto {
  id: string;
  status: 'pending' | 'published';
  thumb: string;
}

/**
 * Step 2, once the file has arrived in R2: prepares the photo and adds it to the
 * gallery, waiting for review unless the sender can review. Safe to call again.
 */
export async function finishUpload(session: OfficeSession, idValue: unknown): Promise<UploadedPhoto> {
  const id = uuid(idValue, 'upload');
  const done = await query('select status, thumb_src from gallery_photos where id = $1 and uploaded_by = $2', [id, session.email]);
  if (done[0]) return { id, status: done[0].status, thumb: done[0].thumb_src };
  const [up] = await query('select * from gallery_uploads where id = $1 and uploaded_by = $2', [id, session.email]);
  if (!up) throw new RecordError('That upload has expired. Please send the photo again.', 404);

  const discard = async () => {
    await deleteObject(up.original_key).catch(() => {});
    await query('delete from gallery_uploads where id = $1', [id]);
  };
  const size = await storedSize(up.original_key);
  if (size === null) throw new RecordError('The photo didn’t arrive. Please try again.', 409);
  if (size > MAX_PHOTO_BYTES) {
    await discard();
    throw new RecordError(`That photo is larger than ${MAX_PHOTO_MB} MB, the most the website accepts.`, 413);
  }
  const original = await getObject(up.original_key);
  if (!original) throw new RecordError('The photo didn’t arrive. Please try again.', 409);
  let prepared: Awaited<ReturnType<typeof preparePhoto>>;
  try {
    prepared = await preparePhoto(original);
  } catch (err) {
    console.error('[gallery upload] unreadable photo:', err instanceof Error ? err.message : err);
    await discard();
    throw new RecordError('That file couldn’t be read as a photo.', 422);
  }

  const folder = up.original_key.slice(0, up.original_key.indexOf('originals/'));
  const month = up.original_key.split('/').slice(-3, -1).join('/');
  const webKey = `${folder}web/${month}/${id}.jpg`;
  const thumbKey = `${folder}thumbs/${month}/${id}.webp`;
  await putObject(webKey, prepared.web, 'image/jpeg');
  await putObject(thumbKey, prepared.thumb, 'image/webp');

  const publish = session.areas.includes('review') || session.areas.includes('gallery');
  const status = publish ? 'published' : 'pending';
  const thumb = `/api/gallery-photos/${id}/thumb.webp`;
  await withTransaction(async (client) => {
    const added = await client.query(
      `insert into gallery_photos (id, source, src, thumb_src, width, height, taken_on, caption, status, event_id,
                                   original_key, web_key, thumb_key, original_name, original_bytes,
                                   uploaded_by, uploader_name, batch_id, reviewed_by, reviewed_at)
       values ($1, 'upload', $2, $3, $4, $5, coalesce($6::date, current_date), $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       on conflict (id) do nothing`,
      [
        id, `/api/gallery-photos/${id}/web.jpg`, thumb, prepared.width, prepared.height, prepared.takenOn, up.caption, status, up.event_id,
        up.original_key, webKey, thumbKey, up.original_name, size,
        session.email, up.uploader_name, up.batch_id, publish ? session.email : null, publish ? new Date() : null,
      ],
    );
    await client.query('delete from gallery_uploads where id = $1', [id]);
    if (added.rowCount) {
      await recordAudit(null, session.email, 'gallery', { what: 'upload', id, status, eventId: up.event_id, file: up.original_name, bytes: size }, client);
    }
  });
  return { id, status, thumb };
}

// --- Review -----------------------------------------------------------------------------

export interface PendingPhoto {
  id: string;
  src: string;
  thumb: string;
  width: number;
  height: number;
  takenOn: string;
  caption: string;
  eventId: string | null;
  /** The event's name with its year, as lists show it. */
  eventName: string | null;
  /** Who sent it: their name, else their address. */
  from: string;
  email: string;
  batchId: string;
  sentAt: string;
  fileName: string;
}

export async function pendingPhotos(): Promise<PendingPhoto[]> {
  const rows = await query(
    `select p.id, p.src, p.thumb_src, p.width, p.height, p.taken_on::text as taken_on, p.caption, p.event_id,
            e.title as event_title, e.event_date::text as event_date, p.uploaded_by, p.uploader_name, p.batch_id, p.created_at, p.original_name
     from gallery_photos p left join gallery_events e on e.id = p.event_id
     where p.status = 'pending' and p.deleted_at is null order by p.created_at, p.id`,
  );
  return rows.map((r) => {
    const year = r.event_date?.slice(0, 4);
    return {
      id: r.id,
      src: r.src,
      thumb: r.thumb_src,
      width: r.width,
      height: r.height,
      takenOn: r.taken_on,
      caption: r.caption,
      eventId: r.event_id,
      eventName: r.event_title ? (year && !r.event_title.includes(year) ? `${r.event_title} (${year})` : r.event_title) : null,
      from: r.uploader_name || r.uploaded_by,
      email: r.uploaded_by,
      batchId: r.batch_id,
      sentAt: iso(r.created_at)!,
      fileName: r.original_name ?? '',
    };
  });
}

export async function pendingCount(): Promise<number> {
  const [{ n }] = await query<{ n: number }>("select count(*)::int as n from gallery_photos where status = 'pending' and deleted_at is null");
  return n;
}

/** Removes a shared photo's three files (original, web copy, thumbnail) from storage. */
async function removeFiles(row: Record<string, unknown>): Promise<void> {
  for (const key of [row.original_key, row.web_key, row.thumb_key]) if (typeof key === 'string' && key) await deleteObject(key);
}

/**
 * Approves photos for the gallery, or turns them down (their files are removed, so
 * that can't be undone). Only photos still waiting are changed. Returns how many.
 */
export async function reviewPhotos(idsValue: unknown, decision: unknown, actor: string): Promise<number> {
  if (!Array.isArray(idsValue) || !idsValue.length) throw new RecordError('Choose at least one photo.', 400);
  if (idsValue.length > 1000) throw new RecordError('Too many photos at once (at most 1000).', 400);
  const ids = Array.from(new Set(idsValue.map((v) => uuid(v, 'photo'))));
  if (decision === 'approve') {
    const rows = await query<{ id: string }>(
      `update gallery_photos set status = 'published', reviewed_by = $2, reviewed_at = now(), updated_at = now()
       where id = any($1::uuid[]) and status = 'pending' and source = 'upload' and deleted_at is null returning id`,
      [ids, actor],
    );
    if (!rows.length) throw new RecordError('Those photos were already reviewed. Reload the page.', 409);
    await recordAudit(null, actor, 'gallery', { what: 'review', decision: 'approved', count: rows.length, ids: rows.map((r) => r.id).slice(0, 50) });
    return rows.length;
  }
  if (decision !== 'turn_down') throw new RecordError('Unknown decision.', 400);
  const rows = await query(
    `select id, original_key, web_key, thumb_key, original_name from gallery_photos
     where id = any($1::uuid[]) and status = 'pending' and source = 'upload' and deleted_at is null`,
    [ids],
  );
  if (!rows.length) throw new RecordError('Those photos were already reviewed. Reload the page.', 409);
  const removed: string[] = [];
  for (const r of rows) {
    try {
      await removeFiles(r);
      removed.push(r.id);
    } catch (err) {
      // The daily job tries again.
      console.error('[gallery review] could not remove files:', err instanceof Error ? err.message : err);
    }
  }
  await query(
    `update gallery_photos set status = 'rejected', reviewed_by = $2, reviewed_at = now(), updated_at = now(),
            files_removed_at = case when id = any($3::uuid[]) then now() end
     where id = any($1::uuid[]) and status = 'pending'`,
    [rows.map((r) => r.id), actor, removed],
  );
  await recordAudit(null, actor, 'gallery', {
    what: 'review',
    decision: 'turned down',
    count: rows.length,
    ids: rows.map((r) => r.id).slice(0, 50),
    files: rows.map((r) => r.original_name).slice(0, 50),
  });
  return rows.length;
}

// --- Daily job --------------------------------------------------------------------------

export interface DailyResult {
  /** Shared photos whose files were removed (deleted over 30 days ago, or turned down). */
  removed: number;
  /** Uploads that never finished, cleared. */
  cleared: number;
  waiting: { from: string; photos: number }[];
  reviewers: string[];
}

export async function dailyPhotoJob(): Promise<DailyResult> {
  let removed = 0;
  let cleared = 0;
  if (storageReady()) {
    const gone = await query(
      `select id, original_key, web_key, thumb_key from gallery_photos
       where source = 'upload' and files_removed_at is null
         and (status = 'rejected' or deleted_at < now() - make_interval(days => $1)) limit 500`,
      [DELETED_KEEP_DAYS],
    );
    for (const r of gone) {
      try {
        await removeFiles(r);
        await query('update gallery_photos set files_removed_at = now(), updated_at = now() where id = $1', [r.id]);
        removed++;
      } catch (err) {
        console.error('[photo job] could not remove files:', err instanceof Error ? err.message : err);
      }
    }
    const stale = await query("select id, original_key from gallery_uploads where created_at < now() - interval '1 day' limit 500");
    for (const u of stale) {
      try {
        await deleteObject(u.original_key);
        await query('delete from gallery_uploads where id = $1', [u.id]);
        cleared++;
      } catch (err) {
        console.error('[photo job] could not clear an upload:', err instanceof Error ? err.message : err);
      }
    }
    if (removed || cleared) await recordAudit(null, 'daily photo job', 'gallery', { what: 'cleanup', removedPhotos: removed, unfinishedUploads: cleared });
  }
  const waiting = await query<{ from: string; photos: number }>(
    `select coalesce(nullif(uploader_name, ''), uploaded_by) as from, count(*)::int as photos
     from gallery_photos where status = 'pending' and deleted_at is null group by 1 order by 2 desc, 1`,
  );
  return { removed, cleared, waiting, reviewers: waiting.length ? await reviewerEmails() : [] };
}
