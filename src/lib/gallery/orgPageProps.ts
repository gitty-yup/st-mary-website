import type { GetStaticProps } from 'next';
import type { OrgPhotos } from '@/lib/gallery/types';

/** Local development without a database: pages show no photos rather than an error. */
export const noDatabase = () => !process.env.DATABASE_URL && !process.env.POSTGRES_URL && process.env.VERCEL_ENV !== 'production';

export interface OrgPageProps {
  orgPhotos: OrgPhotos | null;
}

/**
 * getStaticProps for an organization's page: its newest gallery photos (by its
 * Organization tag's web name). Office changes refresh the page straight away; the
 * hour is only a fallback. If the database can't be reached, the page is still built,
 * without photos, and tries again in a few minutes.
 */
export function orgPageProps(slug: string): GetStaticProps<OrgPageProps> {
  return async () => {
    if (noDatabase()) return { props: { orgPhotos: null }, revalidate: 60 };
    try {
      const { orgPhotos } = await import('@/lib/gallery/store');
      return { props: { orgPhotos: await orgPhotos(slug) }, revalidate: 3600 };
    } catch (err) {
      console.error(`[gallery] photos for ${slug}:`, err instanceof Error ? err.message : err);
      return { props: { orgPhotos: null }, revalidate: 300 };
    }
  };
}
