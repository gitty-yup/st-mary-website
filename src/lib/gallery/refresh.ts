import type { NextApiResponse } from 'next';
import { PHOTO_PAGES } from '@/lib/gallery/types';

/**
 * Rebuilds the public /gallery page after an office change, so it shows straight away,
 * and the pages that show gallery photos too (Parish Life and the organizations' pages).
 * One page at a time: on Vercel, rebuilds started all at once didn't all take. The pages
 * also refresh themselves (the gallery every few minutes, the others every minute) in case
 * one is still missed, and links to them load the whole page (FullLoadLinks).
 * Returns whether /gallery itself was refreshed.
 */
export async function refreshGallery(res: NextApiResponse): Promise<boolean> {
  let gallery = false;
  for (const page of PHOTO_PAGES) {
    try {
      await res.revalidate(page);
      if (page === '/gallery') gallery = true;
    } catch (err) {
      // The page still refreshes on its own (the gallery within a few minutes, the others within a minute).
      console.error(`[gallery] refresh of ${page} failed:`, err instanceof Error ? err.message : err);
    }
  }
  return gallery;
}
