// Browser-safe gallery types and helpers.

export type TagGroup = 'organization' | 'occasion' | 'people';

/** Tag groups in display order, with the gallery URL parameter each one uses (/gallery?org=acyo). */
export const TAG_GROUPS: { key: TagGroup; label: string; param: string }[] = [
  { key: 'organization', label: 'Organization', param: 'org' },
  { key: 'occasion', label: 'Occasion', param: 'occasion' },
  { key: 'people', label: 'People', param: 'people' },
];

export type PhotoStatus = 'pending' | 'published' | 'hidden' | 'rejected';

export interface GalleryTag {
  id: string;
  group: TagGroup;
  slug: string;
  label: string;
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

export interface OfficePhoto extends GalleryPhoto {
  status: PhotoStatus;
  source: 'site' | 'upload';
  fileMissing: boolean;
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

/** Lower-case ASCII words joined by hyphens ("Mommy & Me" → "mommy-and-me"); empty if nothing is left. */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Text a screen reader can use for a photo. */
export function photoAlt(photo: GalleryPhoto, event?: GalleryEvent | null): string {
  if (photo.caption) return photo.caption;
  const when = monthYear(photo.takenOn);
  return event ? `Photo from ${event.title}, ${when}` : `Photo from ${when}`;
}
