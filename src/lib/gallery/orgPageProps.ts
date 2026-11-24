import type { GetStaticProps } from 'next';
import type { OrgPhotos } from '@/lib/gallery/types';

/** Local development without a database: pages show no photos rather than an error. */
export const noDatabase = () => !process.env.DATABASE_URL && !process.env.POSTGRES_URL && process.env.VERCEL_ENV !== 'production';

export interface OrgPageProps {
  orgPhotos: OrgPhotos | null;
}

/**
 * Pages that show gallery photos outside the gallery (organization pages, Parish Life)
 * rebuild themselves at most once a minute when visited. Office changes also refresh
 * them straight away, but on Vercel that didn't always take; this is the backstop. Each
 * rebuild is one small database query.
 */
export const ORG_PAGE_REFRESH_SECONDS = 60;

/**
 * getStaticProps for an organization's page: its newest gallery photos (by its
 * Organization tag's web name). If the database can't be reached, the page is still
 * built, without photos, and tries again in a few minutes.
 */
export function orgPageProps(slug: string): GetStaticProps<OrgPageProps> {
  return async () => {
    if (noDatabase()) return { props: { orgPhotos: null }, revalidate: 60 };
    try {
      const { orgPhotos } = await import('@/lib/gallery/store');
      return { props: { orgPhotos: await orgPhotos(slug) }, revalidate: ORG_PAGE_REFRESH_SECONDS };
    } catch (err) {
      console.error(`[gallery] photos for ${slug}:`, err instanceof Error ? err.message : err);
      return { props: { orgPhotos: null }, revalidate: 300 };
    }
  };
}
