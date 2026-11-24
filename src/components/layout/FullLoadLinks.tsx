import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { PHOTO_PAGES } from '@/lib/gallery/types';

/**
 * Makes links to the pages that show gallery photos (PHOTO_PAGES) load the whole page,
 * like typing the address, instead of Next.js swapping the content in with its separate
 * data file. On Vercel, refreshing those pages after an office change reliably updates
 * the page but not always that data file, so an in-site click (the menu's Gallery link,
 * "See all … photos") could show old photos.
 *
 * Covers every link on the site at once (menu, footer, page links), and the Back and
 * Forward buttons. Links that open a new tab, modified clicks (Cmd/Ctrl/Shift), and
 * jumps within the same page are left alone.
 */
export default function FullLoadLinks() {
  const router = useRouter();

  useEffect(() => {
    const full = (url: URL) => url.origin === window.location.origin && PHOTO_PAGES.includes(url.pathname.replace(/\/$/, '') || '/');

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (!full(url)) return;
      // A jump to a heading on the same page stays a jump.
      if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;
      // Next.js links skip clicks that were already handled, so this one loads the page instead.
      e.preventDefault();
      window.location.assign(url.href);
    };
    // Capture phase: runs before Next.js's own link handling.
    document.addEventListener('click', onClick, true);

    router.beforePopState(({ as }) => {
      const url = new URL(as, window.location.href);
      if (!full(url)) return true;
      window.location.assign(url.href);
      return false;
    });

    return () => {
      document.removeEventListener('click', onClick, true);
      router.beforePopState(() => true);
    };
  }, [router]);

  return null;
}
