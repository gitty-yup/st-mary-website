import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import HeadElement from '@/components/layout/HeadElement';
import type { OfficeArea } from '@/lib/office/auth';

export default function OfficeLayout({
  title,
  email,
  areas = ['certificates', 'gallery'],
  children,
}: {
  title: string;
  /** Signed-in address; without it (sign-in pages) no menu is shown. */
  email?: string;
  /** Parts of the office this person can use. Certificate pages are only open to people who have both. */
  areas?: OfficeArea[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const certificates = areas.includes('certificates');
  const brand = !email ? 'St. Mary Office' : certificates ? 'Certificate Office' : 'Photo Gallery';

  async function signOut() {
    await fetch('/api/office/logout', { method: 'POST' }).catch(() => {});
    router.push('/office/login');
  }

  return (
    <div className='min-h-screen bg-gray-50 font-primary text-gray-800'>
      <HeadElement pageTitle={`${title} · St. Mary ${brand}`} noIndex />
      <header className='bg-primary text-white'>
        <div className='max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2'>
          <Link href={certificates ? '/office' : '/office/gallery'} className='font-secondary font-semibold text-lg whitespace-nowrap'>
            {brand}
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
