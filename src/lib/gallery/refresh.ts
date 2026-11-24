import type { NextApiResponse } from 'next';
import { ORG_PAGES } from '@/lib/gallery/types';

/**
 * Rebuilds the public /gallery page after an office change, so it shows straight away,
 * and the pages that show gallery photos too (Parish Life and the organizations' pages).
 * One page at a time: on Vercel, rebuilds started all at once didn't all take. Those
 * pages also refresh themselves every minute, in case one is still missed.
 * Returns whether /gallery itself was refreshed.
 */
export async function refreshGallery(res: NextApiResponse): Promise<boolean> {
  const pages = ['/gallery', '/parish-life', ...Object.values(ORG_PAGES)];
  let gallery = false;
  for (const page of pages) {
    try {
      await res.revalidate(page);
      if (page === '/gallery') gallery = true;
    } catch (err) {
      // The page still refreshes on its own (the gallery within the hour, the others within a minute).
      console.error(`[gallery] refresh of ${page} failed:`, err instanceof Error ? err.message : err);
    }
  }
  return gallery;
}
