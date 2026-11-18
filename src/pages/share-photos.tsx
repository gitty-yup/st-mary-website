import type { GetServerSideProps } from 'next';
import React, { useState } from 'react';
import PhotoUploader from '@/components/gallery/PhotoUploader';
import OfficeLayout from '@/components/office/OfficeLayout';
import type { OfficeArea } from '@/lib/office/nav';

/**
 * /share-photos: where invited people (and the office and leaders) send photos for the
 * gallery, from a phone or computer. Each photo goes straight to storage, then the
 * website prepares it; photos from people who can't review wait for review.
 * (Anyone with an event link uses /event-photos/<code> instead.)
 */

interface SignedIn {
  signedIn: true;
  email: string;
  areas: OfficeArea[];
  name: string;
  /** Photos from this person wait for review. */
  reviewed: boolean;
  events: { id: string; name: string }[];
  ready: boolean;
}

type Props = SignedIn | { signedIn: false };

export default function SharePhotos(props: Props) {
  return props.signedIn ? <Uploader {...props} /> : <SignIn />;
}

function SignIn() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    setError('');
    try {
      const res = await fetch('/api/office/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, next: '/share-photos' }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? 'Something went wrong. Please try again.');
        setState('idle');
        return;
      }
      setState('sent');
    } catch {
      setError('Couldn’t reach the website. Check your connection and try again.');
      setState('idle');
    }
  }

  return (
    <OfficeLayout title='Sign in' brand='Share Photos'>
      <div className='max-w-md mx-auto bg-white rounded-xl border border-gray-200 p-6 mt-4 sm:mt-8'>
        <h1 className='font-secondary text-2xl font-semibold text-primary mb-2'>Share photos with St. Mary</h1>
        {state === 'sent' ? (
          <p className='text-gray-700'>
            If that address is on the parish’s list, a sign-in link is on its way. It works once and expires in 20 minutes;
            open it on this phone or computer.
          </p>
        ) : (
          <form onSubmit={submit} className='space-y-4'>
            <p className='text-gray-700'>
              If the parish has invited you to share photos for its website, enter your email address and we’ll email you a
              link to sign in. There’s no password.
            </p>
            <input
              type='email'
              required
              autoComplete='email'
              inputMode='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-secondary'
              placeholder='name@example.com'
              aria-label='Email address'
            />
            {error && <p className='text-sm text-error'>{error}</p>}
            <button type='submit' disabled={state === 'sending'} className='w-full min-h-[48px] bg-primary text-white rounded-lg px-4 font-semibold disabled:opacity-50'>
              {state === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
            </button>
            <p className='text-sm text-gray-500'>
              Not invited yet? Ask the parish office at <a href='mailto:info@stmaryarmenianchurch.com' className='underline'>info@stmaryarmenianchurch.com</a>.
            </p>
          </form>
        )}
      </div>
    </OfficeLayout>
  );
}

function Uploader(props: SignedIn) {
  const firstName = props.name.split(' ')[0];
  return (
    <OfficeLayout title='Share photos' email={props.email} areas={props.areas}>
      <div className='max-w-2xl mx-auto'>
        <h1 className='font-secondary text-2xl font-semibold text-primary mb-2'>
          {firstName ? `Welcome, ${firstName}` : 'Share photos with St. Mary'}
        </h1>
        <p className='text-gray-700 mb-6'>
          Send photos of parish life for the gallery on the website.{' '}
          {props.reviewed
            ? 'The parish office or a leader looks at each photo before it appears.'
            : 'Your photos go straight into the gallery.'}
        </p>
        <PhotoUploader
          endpoint='/api/office/gallery/upload'
          reviewed={props.reviewed}
          ready={props.ready}
          events={props.events}
          signedOutMessage='Your sign-in has ended. Reload the page and sign in again.'
        />
      </div>
    </OfficeLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  ctx.res.setHeader('Cache-Control', 'private, no-store');
  const { sessionFromCookie } = await import('@/lib/office/auth');
  const session = await sessionFromCookie(ctx.req.headers.cookie);
  if (!session?.areas.includes('share')) return { props: { signedIn: false } };
  const { query } = await import('@/lib/db');
  const { storageReady } = await import('@/lib/storage/r2');
  const { eventName } = await import('@/lib/gallery/types');
  const [person] = await query<{ name: string }>('select name from gallery_people where email = $1 and removed_at is null', [session.email]);
  const events = await query('select id, title, event_date::text as event_date from gallery_events order by event_date desc nulls last, title');
  return {
    props: {
      signedIn: true,
      email: session.email,
      areas: session.areas,
      name: person?.name ?? '',
      reviewed: !session.areas.includes('review') && !session.areas.includes('gallery'),
      events: events.map((e) => ({ id: e.id, name: eventName({ title: e.title, eventDate: e.event_date }) })),
      ready: storageReady(),
    },
  };
};
