import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import HeadElement from '@/components/layout/HeadElement';
import { homeFor, type OfficeArea } from '@/lib/office/nav';

/** The office's name for this person: what they can mainly do. */
function brandFor(areas: OfficeArea[]): string {
  if (areas.includes('certificates')) return 'Certificate Office';
  if (areas.includes('gallery')) return 'Photo Gallery';
  if (areas.includes('review')) return 'Photo Review';
  return 'Share Photos';
}

export default function OfficeLayout({
  title,
  email,
  areas = ['certificates', 'gallery', 'people', 'review', 'share'],
  brand,
  children,
}: {
  title: string;
  /** Signed-in address; without it (sign-in pages) no menu is shown. */
  email?: string;
  /** Parts of the office this person can use. */
  areas?: OfficeArea[];
  /** Overrides the name in the header (e.g. on the photo sharing page before sign-in). */
  brand?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const certificates = areas.includes('certificates');
  const name = brand ?? (!email ? 'St. Mary Office' : brandFor(areas));
  const signInPage = router.pathname === '/share-photos' ? '/share-photos' : '/office/login';

  async function signOut() {
    await fetch('/api/office/logout', { method: 'POST' }).catch(() => {});
    router.push(signInPage);
  }

  return (
    <div className='min-h-screen bg-gray-50 font-primary text-gray-800'>
      <HeadElement pageTitle={`${title} · St. Mary ${name}`} noIndex />
      <header className='bg-primary text-white'>
        <div className='max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2'>
          <Link href={email ? homeFor(areas) : signInPage} className='font-secondary font-semibold text-lg whitespace-nowrap'>
            {name}
          </Link>
          {email && (
            <nav className='flex flex-wrap gap-4 text-sm'>
              {certificates && (
                <>
                  <Link href='/office' className='hover:underline'>Records</Link>
                  <Link href='/office/new?type=baptism' className='hover:underline'>New baptism</Link>
                  <Link href='/office/new?type=marriage' className='hover:underline'>New marriage</Link>
                  <Link href='/office/backup' className='hover:underline'>Export &amp; backup</Link>
                </>
              )}
              {areas.includes('gallery') && (
                <Link href='/office/gallery' className='hover:underline'>Photos</Link>
              )}
              {areas.includes('review') && !areas.includes('gallery') && (
                <Link href='/office/gallery/review' className='hover:underline'>Review</Link>
              )}
              {areas.includes('share') && (areas.length > 1) && (
                <Link href='/share-photos' className='hover:underline'>Share photos</Link>
              )}
            </nav>
          )}
          {email && (
            <div className='ml-auto flex items-center gap-3 text-sm'>
              <span className='opacity-80 hidden sm:inline'>{email}</span>
              <button onClick={signOut} className='border border-white/50 rounded-lg px-3 py-1 hover:bg-white/10'>
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className='max-w-6xl mx-auto px-4 py-6'>{children}</main>
    </div>
  );
}
