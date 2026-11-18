import type { GetServerSideProps } from 'next';
import React, { useState } from 'react';
import { TURNSTILE_SITE_KEY, useTurnstile } from '@/components/forms/useTurnstile';
import PhotoUploader from '@/components/gallery/PhotoUploader';
import OfficeLayout from '@/components/office/OfficeLayout';

/**
 * /event-photos/<code>: anyone with an event link sends photos of that event, without
 * signing in. They give their name and pass the "verify you are human" check once;
 * every photo waits for review. The office makes links on Photos → Links.
 */

type Props =
  | { state: 'open'; code: string; eventName: string; lastDay: string; name: string | null; ready: boolean }
  | { state: 'closed'; eventName: string; message: string };

export default function EventPhotos(props: Props) {
  return (
    <OfficeLayout title={`Photos from ${props.eventName}`} brand='Share Photos' brandHref='/'>
      <div className='max-w-2xl mx-auto'>
        <h1 className='font-secondary text-2xl font-semibold text-primary mb-2'>Photos from {props.eventName}</h1>
        {props.state === 'closed' ? (
          <div className='bg-white border border-gray-200 rounded-xl p-5 mt-4'>
            <p className='text-gray-900 font-medium'>{props.message}</p>
            <p className='text-gray-700 mt-2'>
              Questions? Contact the parish office at{' '}
              <a href='mailto:info@stmaryarmenianchurch.com' className='underline'>info@stmaryarmenianchurch.com</a>.
            </p>
          </div>
        ) : (
          <Open {...props} />
        )}
      </div>
    </OfficeLayout>
  );
}

function Open(props: Extract<Props, { state: 'open' }>) {
  const [name, setName] = useState(props.name);
  if (name) {
    return (
      <>
        <p className='text-gray-700 mb-6'>
          Thank you, {name.split(' ')[0]}. Choose your photos of {props.eventName} and tap Send. Someone from the parish looks
          at each photo before it appears in the gallery.
        </p>
        <PhotoUploader
          endpoint={`/api/event-photos/${props.code}`}
          reviewed
          ready={props.ready}
          signedOutMessage='This page has been open a long time. Reload it to keep sending photos.'
        />
      </>
    );
  }
  return <Begin {...props} onBegun={setName} />;
}

function Begin({ code, eventName, lastDay, onBegun }: Extract<Props, { state: 'open' }> & { onBegun: (name: string) => void }) {
  const [name, setName] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const turnstile = useTurnstile();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (TURNSTILE_SITE_KEY && !turnstile.token) {
      setError('Please complete the “verify you are human” check first.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/event-photos/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'begin', name, website: honeypot, turnstileToken: turnstile.token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        turnstile.reset();
        return;
      }
      onBegun(data.name);
    } catch {
      setError('Couldn’t reach the website. Check your connection and try again.');
      turnstile.reset();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <p className='text-gray-700 mb-6'>
        Send your photos of {eventName} for the gallery on the St. Mary website. Someone from the parish looks at each photo
        before it appears. This link works until the end of {lastDay}.
      </p>
      <form onSubmit={submit} className='bg-white border border-gray-200 rounded-xl p-5 space-y-4'>
        <label className='block'>
          <span className='font-medium text-gray-900'>Your name</span>
          <input
            required
            maxLength={80}
            autoComplete='name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            className='mt-1 w-full border border-gray-300 rounded-lg px-3 py-3 text-base'
          />
          <span className='mt-1 block text-sm text-gray-500'>So the parish knows who sent the photos. It isn’t shown on the website.</span>
        </label>
        {/* People never see this field; bots fill it in. */}
        <input
          type='text'
          name='website'
          tabIndex={-1}
          autoComplete='off'
          aria-hidden='true'
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className='absolute -left-[9999px] h-px w-px opacity-0'
        />
        {TURNSTILE_SITE_KEY && <div ref={turnstile.ref} />}
        {error && <p className='text-sm text-red-700'>{error}</p>}
        <button type='submit' disabled={busy} className='w-full min-h-[52px] rounded-xl bg-primary px-4 text-lg font-semibold text-white disabled:opacity-60'>
          {busy ? 'One moment…' : 'Continue'}
        </button>
      </form>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  ctx.res.setHeader('Cache-Control', 'private, no-store');
  const code = String(ctx.params?.code ?? '');
  const { closedMessage, linkByCode, linkSender } = await import('@/lib/gallery/links');
  const link = await linkByCode(code);
  if (!link) return { notFound: true };
  if (link.state !== 'open') return { props: { state: 'closed', eventName: link.eventName, message: closedMessage(link) } };
  const { storageReady } = await import('@/lib/storage/r2');
  const { linkLastDay } = await import('@/lib/gallery/types');
  const found = await linkSender(code, ctx.req.headers.cookie);
  return {
    props: {
      state: 'open',
      code,
      eventName: link.eventName,
      lastDay: linkLastDay(link.expiresAt),
      name: found?.sender.name ?? null,
      ready: storageReady(),
    },
  };
};
