import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import React from 'react';
import { QrCode } from '@/components/gallery/QrCode';
import HeadElement from '@/components/layout/HeadElement';
import { requireOfficePage } from '@/lib/office/auth';

/**
 * A sign to print for an event (from Photos → Links → QR code → Print a sign): the event,
 * a large QR code for its link, and three steps. One US Letter page.
 */

type Props =
  | { open: true; eventName: string; url: string; lastDay: string }
  | { open: false; eventName: string; message: string };

export default function LinkSign(props: Props) {
  return (
    <div className='min-h-screen bg-gray-100 print:bg-white font-primary text-gray-900'>
      <HeadElement pageTitle={`Sign: ${props.eventName} · St. Mary`} noIndex />
      <style>{'@page { size: letter; margin: 0.5in; }'}</style>
      <div className='print:hidden mx-auto flex max-w-[8.5in] flex-wrap items-center gap-3 px-4 py-4'>
        {props.open && (
          <button onClick={() => window.print()} className='rounded-lg bg-primary px-5 py-2 font-semibold text-white'>
            Print
          </button>
        )}
        <Link href='/office/gallery/links' className='text-primary underline hover:no-underline'>
          Back to Links
        </Link>
        {props.open && <span className='text-sm text-gray-600'>Prints on one letter-size page.</span>}
      </div>

      {props.open ? (
        <main className='mx-auto flex max-w-[7.5in] flex-col items-center bg-white px-8 py-10 text-center shadow print:max-w-none print:p-0 print:shadow-none'>
          <p className='font-secondary text-3xl font-bold text-secondary'>St. Mary</p>
          <p className='font-secondary text-lg font-semibold text-primary'>Armenian Apostolic Church</p>
          <h1 className='mt-8 font-secondary text-5xl font-bold text-primary'>Share your photos</h1>
          <p className='mt-3 font-secondary text-3xl font-semibold'>{props.eventName}</p>
          <QrCode text={props.url} className='mt-8 h-[4.25in] w-[4.25in]' title={`QR code for ${props.url}`} />
          <ol className='mt-8 space-y-2 text-left text-xl'>
            <li><strong>1.</strong> Point your phone’s camera at the code and tap the link.</li>
            <li><strong>2.</strong> Enter your name.</li>
            <li><strong>3.</strong> Choose your photos and tap <strong>Send</strong>.</li>
          </ol>
          <p className='mt-8 text-base text-gray-700'>The parish looks at each photo before it appears in the website’s gallery.</p>
          <p className='mt-4 text-sm text-gray-600'>
            Or type <span className='font-semibold'>{props.url.replace(/^https?:\/\//, '')}</span>
            <br />
            Works through {props.lastDay}
          </p>
        </main>
      ) : (
        <main className='mx-auto max-w-xl rounded-xl bg-white p-6 shadow'>
          <h1 className='font-secondary text-xl font-semibold text-primary'>{props.eventName}</h1>
          <p className='mt-2 text-gray-800'>{props.message} Make a new link on Links to print a sign.</p>
        </main>
      )}
    </div>
  );
}

const STOPPED: Record<string, string> = {
  ended: 'This link has been ended.',
  expired: 'This link has expired.',
  full: 'This link has taken all its photos.',
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const auth = await requireOfficePage(ctx, 'people');
  if ('redirect' in auth) return auth;
  const { linkById, siteOrigin } = await import('@/lib/gallery/links');
  const { RecordError } = await import('@/lib/office/records');
  const { linkLastDay } = await import('@/lib/gallery/types');
  try {
    const link = await linkById(String(ctx.query.id ?? ''));
    if (link.state !== 'open') return { props: { open: false, eventName: link.eventName, message: STOPPED[link.state] } };
    return { props: { open: true, eventName: link.eventName, url: `${siteOrigin(ctx.req.headers)}${link.path}`, lastDay: linkLastDay(link.expiresAt) } };
  } catch (err) {
    if (err instanceof RecordError) return { notFound: true };
    throw err;
  }
};
