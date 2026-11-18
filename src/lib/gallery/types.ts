// Browser-safe gallery types and helpers.

export type TagGroup = 'organization' | 'occasion' | 'people' | 'collection';

/** Tag groups in display order, with the gallery URL parameter each one uses (/gallery?org=acyo). */
export const TAG_GROUPS: { key: TagGroup; label: string; param: string }[] = [
  { key: 'organization', label: 'Organization', param: 'org' },
  { key: 'occasion', label: 'Occasion', param: 'occasion' },
  { key: 'people', label: 'People', param: 'people' },
  { key: 'collection', label: 'Collection', param: 'collection' },
];

export type PhotoStatus = 'pending' | 'published' | 'hidden' | 'rejected';

export interface GalleryTag {
  id: string;
  group: TagGroup;
  slug: string;
  label: string;
  /** Photos with this tag stay out of the gallery's main view and appear only when the tag is chosen (e.g. flyers). */
  filterOnly: boolean;
}

export interface GalleryEvent {
  id: string;
  slug: string;
  title: string;
  eventDate: string | null;
  description: string;
  coverPhotoId: string | null;
}

export interface GalleryPhoto {
  id: string;
  src: string;
  thumb: string;
  width: number;
  height: number;
  /** YYYY-MM-DD; the day isn't reliable for older photos, so it's shown as month and year. */
  takenOn: string;
  caption: string;
  eventId: string | null;
  tagIds: string[];
}

/** A blog post or page of the website that shows a photo. */
export interface PhotoUse {
  title: string;
  /** The page's address, if it has one (blog posts do). */
  href: string | null;
}

export interface OfficePhoto extends GalleryPhoto {
  status: PhotoStatus;
  source: 'site' | 'upload';
  fileMissing: boolean;
  /**
   * Deleted in the office; can be undone until its files are removed (the website's own
   * photos: at the next site update; shared photos: after 30 days).
   */
  deleted: boolean;
  /** Blog posts and pages that show it (as of the last site update). */
  usedIn: PhotoUse[];
  /** For a shared photo, who sent it (name, else address). */
  sharedBy: string | null;
}

export interface CountedTag extends GalleryTag {
  photos: number;
}

export interface CountedEvent extends GalleryEvent {
  photos: number;
}

/** One change applied to the selected photos (office). */
export interface PhotoChange {
  addTagIds?: string[];
  removeTagIds?: string[];
  /** An event's ID, or null for none. Left out: unchanged. */
  eventId?: string | null;
  status?: 'published' | 'hidden';
  /** Only when changing one photo. */
  caption?: string;
  /** true deletes; false undoes a delete (only before the next site update). On its own, not with other changes. */
  deleted?: boolean;
}

/** Event links: how many days one can work (through the end of that day, Pacific time). */
export const LINK_DAYS = [1, 3, 7, 14, 30];
export const LINK_DAYS_DEFAULT = 7;
/** Event links: how many photos one can take. */
export const LINK_PHOTOS = [50, 100, 200, 500, 1000];
export const LINK_PHOTOS_DEFAULT = 200;

const linkDay = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' });

/** The last day an event link works, e.g. "Mon, Nov 24" (it stops at midnight after it). */
export function linkLastDay(expiresAt: string): string {
  return linkDay.format(new Date(new Date(expiresAt).getTime() - 1000));
}

export const MAX_CAPTION = 300;
export const MAX_LABEL = 60;
export const MAX_TITLE = 100;
export const MAX_DESCRIPTION = 1000;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2018-05-01" → "May 2018". */
export function monthYear(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})/.exec(iso ?? '');
  return m ? `${MONTHS[Number(m[2]) - 1] ?? ''} ${m[1]}`.trim() : '';
}

/**
 * An event's name for lists that show no date: the title, plus its year when the
 * title doesn't already say it ("Armenian Festival (2018)"), so events that share
 * a name can be told apart.
 */
export function eventName(event: Pick<GalleryEvent, 'title' | 'eventDate'>): string {
  const year = event.eventDate?.slice(0, 4);
  return year && !event.title.includes(year) ? `${event.title} (${year})` : event.title;
}

/**
 * Lower-case ASCII words joined by hyphens ("Mommy & Me" → "mommy-and-me",
 * "Children’s Class" → "childrens-class"); empty if nothing is left.
 */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * Is the photo in view? Photos with an "only when chosen" tag appear only while
 * one of those tags is chosen in the filters.
 */
export function inMainView(photo: GalleryPhoto, filterOnlyIds: Set<string>, chosenTagIds: string[]): boolean {
  const tucked = photo.tagIds.filter((id) => filterOnlyIds.has(id));
  return !tucked.length || tucked.some((id) => chosenTagIds.includes(id));
}

/** Text a screen reader can use for a photo. */
export function photoAlt(photo: GalleryPhoto, event?: GalleryEvent | null): string {
  if (photo.caption) return photo.caption;
  const when = monthYear(photo.takenOn);
  return event ? `Photo from ${event.title}, ${when}` : `Photo from ${when}`;
}
