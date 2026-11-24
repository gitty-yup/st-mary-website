import type { NextApiResponse } from 'next';
import { ORG_PAGES } from '@/lib/gallery/types';

/**
 * Rebuilds the public /gallery page after an office change, so it shows straight away,
 * and the pages that show gallery photos too (Parish Life and the organizations' pages).
 * Returns whether /gallery itself was refreshed.
 */
export async function refreshGallery(res: NextApiResponse): Promise<boolean> {
  const pages = ['/gallery', '/parish-life', ...Object.values(ORG_PAGES)];
  const done = await Promise.all(
    pages.map(async (page) => {
      try {
        await res.revalidate(page);
        return true;
      } catch (err) {
        // The page still refreshes on its own within the hour.
        console.error(`[gallery] refresh of ${page} failed:`, err instanceof Error ? err.message : err);
        return false;
      }
    }),
  );
  return done[0];
}
