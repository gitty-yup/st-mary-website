// Browser-safe.

/**
 * Parts of the office: certificate records; managing the photo gallery; the list
 * of people who share photos; reviewing shared photos; and sharing photos.
 */
export type OfficeArea = 'certificates' | 'gallery' | 'people' | 'review' | 'share';

/** Only same-site office paths (and the photo sharing page) are allowed as post-sign-in destinations (no open redirects). */
export function safeOfficePath(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 300) return null;
  return /^\/(office(\/[A-Za-z0-9\-/]*)?|share-photos)(\?[A-Za-z0-9=&%\-_.]*)?$/.test(value) && !value.includes('//') ? value : null;
}

/** Where someone lands: the first part of the office they can use. */
export function homeFor(areas: OfficeArea[]): string {
  if (areas.includes('certificates')) return '/office';
  if (areas.includes('gallery')) return '/office/gallery';
  if (areas.includes('review')) return '/office/gallery/review';
  return '/share-photos';
}
