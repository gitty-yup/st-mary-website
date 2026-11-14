import type { NextApiResponse } from 'next';

/** Rebuilds the public /gallery page after an office change, so it shows straight away. */
export async function refreshGallery(res: NextApiResponse): Promise<boolean> {
  try {
    await res.revalidate('/gallery');
    return true;
  } catch (err) {
    // The page still refreshes on its own within the hour.
    console.error('[gallery] refresh failed:', err instanceof Error ? err.message : err);
    return false;
  }
}
