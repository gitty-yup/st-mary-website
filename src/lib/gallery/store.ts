/**
 * Gallery data: what the public gallery shows, and the office's edits (tags,
 * events, captions, hide/publish). Every office change is logged in
 * audit_events as action 'gallery'.
 */
import type { PoolClient } from 'pg';
import { query, withTransaction } from '@/lib/db';
import { recordAudit } from '@/lib/office/audit';
import { RecordError } from '@/lib/office/records';
import { isIsoDate } from '@/certificates/fields';
import {
  MAX_CAPTION,
  MAX_DESCRIPTION,
  MAX_LABEL,
  MAX_TITLE,
  TAG_GROUPS,
  slugify,
  type CountedEvent,
  type CountedTag,
  type GalleryEvent,
  type GalleryPhoto,
  type GalleryTag,
  type OfficePhoto,
  type PhotoChange,
  type TagGroup,
} from '@/lib/gallery/types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BATCH = 1000;

const PHOTO_SQL = `
  select p.id, p.src, p.thumb_src, p.width, p.height, p.taken_on::text as taken_on, p.caption, p.event_id,
         p.status, p.source, p.file_missing,
         coalesce(array_agg(pt.tag_id::text order by pt.tag_id) filter (where pt.tag_id is not null), '{}') as tag_ids
  from gallery_photos p left join gallery_photo_tags pt on pt.photo_id = p.id`;

function toPhoto(r: any): GalleryPhoto {
  return {
    id: r.id,
    src: r.src,
    thumb: r.thumb_src,
    width: r.width,
    height: r.height,
    takenOn: r.taken_on,
    caption: r.caption,
    eventId: r.event_id,
    tagIds: r.tag_ids,
  };
}

function toEvent(r: any): GalleryEvent {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    eventDate: r.event_date,
    description: r.description,
    coverPhotoId: r.cover_photo_id,
  };
}

function toTag(r: any): GalleryTag {
  return { id: r.id, group: r.tag_group, slug: r.slug, label: r.label };
}

/** Published photos (newest first), and the events and tags they use. */
export async function publicGallery(): Promise<{ photos: GalleryPhoto[]; events: GalleryEvent[]; tags: GalleryTag[] }> {
  const photos = (
    await query(`${PHOTO_SQL} where p.status = 'published' and not p.file_missing group by p.id order by p.taken_on desc, p.src`)
  ).map(toPhoto);
  const eventIds = new Set(photos.map((p) => p.eventId).filter(Boolean));
  const tagIds = new Set(photos.flatMap((p) => p.tagIds));
  const events = (
    await query('select id, slug, title, event_date::text as event_date, description, cover_photo_id from gallery_events order by event_date desc nulls last, title')
  )
    .map(toEvent)
    .filter((e) => eventIds.has(e.id));
  const tags = (await query('select id, tag_group, slug, label from gallery_tags order by label')).map(toTag).filter((t) => tagIds.has(t.id));
  return { photos, events, tags };
}

/** Everything, for the office: all photos (hidden too), all events and tags with their photo counts. */
export async function officeGallery(): Promise<{ photos: OfficePhoto[]; events: CountedEvent[]; tags: CountedTag[] }> {
  const photos = (await query(`${PHOTO_SQL} group by p.id order by p.taken_on desc, p.src`)).map((r) => ({
    ...toPhoto(r),
    status: r.status,
    source: r.source,
    fileMissing: r.file_missing,
  }));
  const events = (
    await query(
      `select e.id, e.slug, e.title, e.event_date::text as event_date, e.description, e.cover_photo_id,
              (select count(*)::int from gallery_photos p where p.event_id = e.id) as photos
       from gallery_events e order by e.event_date desc nulls last, e.title`,
    )
  ).map((r) => ({ ...toEvent(r), photos: r.photos }));
  const tags = (
    await query(
      `select t.id, t.tag_group, t.slug, t.label, (select count(*)::int from gallery_photo_tags pt where pt.tag_id = t.id) as photos
       from gallery_tags t order by t.label`,
    )
  ).map((r) => ({ ...toTag(r), photos: r.photos }));
  return { photos, events, tags };
}

// --- Office edits -------------------------------------------------------------------

function uuids(value: unknown, what: string, max = MAX_BATCH): string[] {
  if (!Array.isArray(value)) return [];
  const ids = Array.from(new Set(value.map(String)));
  if (ids.length > max) throw new RecordError(`Too many ${what} at once (at most ${max}).`, 400);
  if (ids.some((id) => !UUID.test(id))) throw new RecordError(`Unknown ${what}.`, 400);
  return ids;
}

function text(value: unknown, max: number, what: string, required = false): string {
  const s = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  if (required && !s) throw new RecordError(`Enter ${what}.`, 400);
  if (s.length > max) throw new RecordError(`${what[0].toUpperCase()}${what.slice(1)} is too long (at most ${max} characters).`, 400);
  return s;
}

/** Applies one change to one or more photos. Returns how many photos it touched. */
export async function updatePhotos(photoIds: unknown, input: Record<string, unknown>, actor: string): Promise<number> {
  const ids = uuids(photoIds, 'photos');
  if (!ids.length) throw new RecordError('Choose at least one photo.', 400);
  const change: PhotoChange = {};
  const add = uuids(input.addTagIds, 'tags', 100);
  const remove = uuids(input.removeTagIds, 'tags', 100);
  if (add.length) change.addTagIds = add;
  if (remove.length) change.removeTagIds = remove;
  if (input.eventId !== undefined) {
    if (input.eventId !== null && !UUID.test(String(input.eventId))) throw new RecordError('Unknown event.', 400);
    change.eventId = input.eventId === null ? null : String(input.eventId);
  }
  if (input.status !== undefined) {
    if (input.status !== 'published' && input.status !== 'hidden') throw new RecordError('Unknown status.', 400);
    change.status = input.status;
  }
  if (input.caption !== undefined) {
    if (ids.length !== 1) throw new RecordError('Captions are set one photo at a time.', 400);
    change.caption = text(input.caption, MAX_CAPTION, 'the caption');
  }
  if (!Object.keys(change).length) throw new RecordError('Nothing to change.', 400);

  return withTransaction(async (client) => {
    const found = await client.query('select id from gallery_photos where id = any($1::uuid[])', [ids]);
    if (found.rowCount !== ids.length) throw new RecordError('Some of those photos no longer exist. Reload the page.', 409);
    const tagCheck = [...add, ...remove];
    if (tagCheck.length) {
      const t = await client.query('select count(*)::int as n from gallery_tags where id = any($1::uuid[])', [tagCheck]);
      if (t.rows[0].n !== new Set(tagCheck).size) throw new RecordError('A tag no longer exists. Reload the page.', 409);
    }
    if (change.eventId) {
      const e = await client.query('select 1 from gallery_events where id = $1', [change.eventId]);
      if (!e.rowCount) throw new RecordError('That event no longer exists. Reload the page.', 409);
    }
    if (add.length) {
      await client.query(
        `insert into gallery_photo_tags (photo_id, tag_id)
         select p, t from unnest($1::uuid[]) p cross join unnest($2::uuid[]) t on conflict do nothing`,
        [ids, add],
      );
    }
    if (remove.length) {
      await client.query('delete from gallery_photo_tags where photo_id = any($1::uuid[]) and tag_id = any($2::uuid[])', [ids, remove]);
    }
    const sets: string[] = ['updated_at = now()'];
    const params: unknown[] = [ids];
    if (change.eventId !== undefined) sets.push(`event_id = $${params.push(change.eventId)}`);
    if (change.status) sets.push(`status = $${params.push(change.status)}`);
    if (change.caption !== undefined) sets.push(`caption = $${params.push(change.caption)}`);
    await client.query(`update gallery_photos set ${sets.join(', ')} where id = any($1::uuid[])`, params);
    await recordAudit(null, actor, 'gallery', { what: 'photos', count: ids.length, ids: ids.slice(0, 50), ...change }, client);
    return ids.length;
  });
}

/** `base`, or `base-2`, `base-3`… if taken. */
function nextSlug(base: string, taken: string[]): string {
  const start = base || 'item';
  if (!taken.includes(start)) return start;
  for (let n = 2; ; n++) if (!taken.includes(`${start}-${n}`)) return `${start}-${n}`;
}

async function slugsIn(client: PoolClient, sql: string, params: unknown[] = []): Promise<string[]> {
  return (await client.query(sql, params)).rows.map((r) => r.slug as string);
}

/** Adds a tag (with `group`) or renames one (with `id`). Renaming keeps its web address. */
export async function saveTag(input: Record<string, unknown>, actor: string): Promise<GalleryTag> {
  const label = text(input.label, MAX_LABEL, 'a name', true);
  return withTransaction(async (client) => {
    let row;
    if (input.id) {
      if (!UUID.test(String(input.id))) throw new RecordError('Unknown tag.', 400);
      const cur = (await client.query('select tag_group from gallery_tags where id = $1', [input.id])).rows[0];
      if (!cur) throw new RecordError('That tag no longer exists. Reload the page.', 409);
      await sameLabel(client, cur.tag_group, label, String(input.id));
      row = (await client.query('update gallery_tags set label = $2 where id = $1 returning *', [input.id, label])).rows[0];
    } else {
      const group = input.group as TagGroup;
      if (!TAG_GROUPS.some((g) => g.key === group)) throw new RecordError('Unknown tag group.', 400);
      await sameLabel(client, group, label);
      const slug = nextSlug(slugify(label), await slugsIn(client, 'select slug from gallery_tags where tag_group = $1', [group]));
      row = (await client.query('insert into gallery_tags (tag_group, slug, label) values ($1, $2, $3) returning *', [group, slug, label])).rows[0];
    }
    await recordAudit(null, actor, 'gallery', { what: 'tag', id: row.id, group: row.tag_group, label, created: !input.id }, client);
    return toTag(row);
  });
}

async function sameLabel(client: PoolClient, group: string, label: string, exceptId?: string) {
  const dup = await client.query(
    'select 1 from gallery_tags where tag_group = $1 and lower(label) = lower($2) and ($3::uuid is null or id <> $3::uuid)',
    [group, label, exceptId ?? null],
  );
  if (dup.rowCount) throw new RecordError(`There's already a tag called “${label}”.`, 409);
}

/** Deletes a tag and takes it off every photo. */
export async function deleteTag(id: unknown, actor: string): Promise<void> {
  if (!UUID.test(String(id))) throw new RecordError('Unknown tag.', 400);
  await withTransaction(async (client) => {
    const row = (await client.query('delete from gallery_tags where id = $1 returning *', [id])).rows[0];
    if (!row) throw new RecordError('That tag no longer exists. Reload the page.', 409);
    await recordAudit(null, actor, 'gallery', { what: 'tag', id, group: row.tag_group, label: row.label, deleted: true }, client);
  });
}

/** Adds an event (no `id`) or edits one. Editing keeps its web address. */
export async function saveEvent(input: Record<string, unknown>, actor: string): Promise<GalleryEvent> {
  const title = text(input.title, MAX_TITLE, 'a title', true);
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  if (description.length > MAX_DESCRIPTION) throw new RecordError(`The description is too long (at most ${MAX_DESCRIPTION} characters).`, 400);
  const eventDate = input.eventDate ? String(input.eventDate) : null;
  if (eventDate && !isIsoDate(eventDate)) throw new RecordError('Enter the date as YYYY-MM-DD.', 400);
  return withTransaction(async (client) => {
    const dup = await client.query(
      `select 1 from gallery_events where lower(title) = lower($1) and event_date is not distinct from $2::date
       and ($3::uuid is null or id <> $3::uuid)`,
      [title, eventDate, input.id && UUID.test(String(input.id)) ? input.id : null],
    );
    if (dup.rowCount) throw new RecordError(`There's already an event called “${title}” on that date.`, 409);
    let row;
    if (input.id) {
      if (!UUID.test(String(input.id))) throw new RecordError('Unknown event.', 400);
      row = (
        await client.query(
          `update gallery_events set title = $2, event_date = $3, description = $4, updated_at = now()
           where id = $1 returning id, slug, title, event_date::text as event_date, description, cover_photo_id`,
          [input.id, title, eventDate, description],
        )
      ).rows[0];
      if (!row) throw new RecordError('That event no longer exists. Reload the page.', 409);
    } else {
      const year = eventDate?.slice(0, 4);
      const base = slugify(year && !title.includes(year) ? `${title} ${year}` : title);
      const slug = nextSlug(base, await slugsIn(client, 'select slug from gallery_events'));
      row = (
        await client.query(
          `insert into gallery_events (slug, title, event_date, description) values ($1, $2, $3, $4)
           returning id, slug, title, event_date::text as event_date, description, cover_photo_id`,
          [slug, title, eventDate, description],
        )
      ).rows[0];
    }
    await recordAudit(null, actor, 'gallery', { what: 'event', id: row.id, title, eventDate, created: !input.id }, client);
    return toEvent(row);
  });
}

/** Sets (or clears, with null) the photo shown for an event. */
export async function setEventCover(eventId: unknown, photoId: unknown, actor: string): Promise<void> {
  if (!UUID.test(String(eventId))) throw new RecordError('Unknown event.', 400);
  if (photoId !== null && !UUID.test(String(photoId))) throw new RecordError('Unknown photo.', 400);
  await withTransaction(async (client) => {
    const r = await client.query('update gallery_events set cover_photo_id = $2, updated_at = now() where id = $1', [eventId, photoId]);
    if (!r.rowCount) throw new RecordError('That event no longer exists. Reload the page.', 409);
    await recordAudit(null, actor, 'gallery', { what: 'event', id: eventId, coverPhotoId: photoId }, client);
  });
}

/** Deletes an event. Its photos stay in the gallery, without an event. */
export async function deleteEvent(id: unknown, actor: string): Promise<void> {
  if (!UUID.test(String(id))) throw new RecordError('Unknown event.', 400);
  await withTransaction(async (client) => {
    const row = (await client.query('delete from gallery_events where id = $1 returning title', [id])).rows[0];
    if (!row) throw new RecordError('That event no longer exists. Reload the page.', 409);
    await recordAudit(null, actor, 'gallery', { what: 'event', id, title: row.title, deleted: true }, client);
  });
}
