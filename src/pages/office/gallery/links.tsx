import type { GetServerSideProps } from 'next';
import React, { useCallback, useState } from 'react';
import OfficeLayout from '@/components/office/OfficeLayout';
import { ConfirmDelete, GalleryTabs, Notice, sendJson } from '@/components/office/gallery/shared';
import { requireOfficePage, type OfficeArea } from '@/lib/office/auth';
import type { PhotoLink } from '@/lib/gallery/links';
import { LINK_DAYS_DEFAULT, LINK_PHOTOS, LINK_PHOTOS_DEFAULT, linkLastDay } from '@/lib/gallery/types';

interface Props {
  email: string;
  areas: OfficeArea[];
  links: PhotoLink[];
  events: { id: string; name: string }[];
  /** e.g. https://www.stmaryarmenianchurch.com, to show whole links. */
  origin: string;
  /** How long a link can work, with the last day it would work if made today. */
  dayOptions: { days: number; label: string }[];
}

const dayFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' });
const day = (iso: string) => dayFormat.format(new Date(iso));

const STATE: Record<PhotoLink['state'], { label: string; className: string }> = {
  open: { label: 'Working', className: 'bg-green-100 text-green-800' },
  full: { label: 'Full', className: 'bg-yellow-100 text-yellow-900' },
  expired: { label: 'Expired', className: 'bg-gray-100 text-gray-700' },
  ended: { label: 'Ended', className: 'bg-gray-100 text-gray-700' },
};

export default function GalleryLinks(props: Props) {
  const [links, setLinks] = useState(props.links);
  const [form, setForm] = useState({ eventId: '', days: LINK_DAYS_DEFAULT, maxPhotos: LINK_PHOTOS_DEFAULT });
  const [fresh, setFresh] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ message: '', error: false });
  const clearNotice = useCallback(() => setNotice({ message: '', error: false }), []);
  const url = (l: PhotoLink) => `${props.origin}${l.path}`;

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { link } = await sendJson<{ link: PhotoLink }>('/api/office/gallery/links', { action: 'create', ...form });
      setLinks((all) => [link, ...all]);
      setFresh(link.id);
      setForm({ ...form, eventId: '' });
      setNotice({ message: `Made a link for ${link.eventName}. Copy it below and share it.`, error: false });
    } catch (err) {
      setNotice({ message: (err as Error).message, error: true });
    } finally {
      setBusy(false);
    }
  }

  async function copy(l: PhotoLink) {
    try {
      await navigator.clipboard.writeText(url(l));
      setNotice({ message: 'Copied the link.', error: false });
    } catch {
      setNotice({ message: 'Couldn’t copy it here. Select the link and copy it instead.', error: true });
    }
  }

  async function end(l: PhotoLink) {
    setBusy(true);
    try {
      const { link } = await sendJson<{ link: PhotoLink }>('/api/office/gallery/links', { action: 'end', id: l.id });
      setLinks((all) => all.map((x) => (x.id === link.id ? link : x)));
      setNotice({ message: `Ended the link for ${link.eventName}.`, error: false });
    } catch (err) {
      setNotice({ message: (err as Error).message, error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <OfficeLayout title='Event links' email={props.email} areas={props.areas}>
      <GalleryTabs current='/office/gallery/links' areas={props.areas} />
      <div className='max-w-3xl space-y-2 text-sm text-gray-600 mb-6'>
        <p>
          An event link lets <strong>anyone who has it</strong> send photos of one event from their phone or computer,
          without being invited or signing in. They give their name and pass a “verify you are human” check. Every photo
          sent with a link waits on <strong>Review</strong>.
        </p>
        <p>
          Share it by email, in an announcement, or at the event. Anyone can pass it on, so it stops after the last day you
          choose or when it has taken its number of photos, and you can end it sooner.
        </p>
      </div>

      <form onSubmit={create} className='bg-white border border-gray-200 rounded-xl p-4 mb-8 max-w-3xl grid gap-3 sm:grid-cols-3'>
        <h2 className='sm:col-span-3 font-semibold text-gray-900'>Make a link</h2>
        <label className='block text-sm sm:col-span-3'>
          <span className='text-gray-600'>Event</span>
          <select
            required
            value={form.eventId}
            onChange={(e) => setForm({ ...form, eventId: e.target.value })}
            className='mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 bg-white'
          >
            <option value=''>Choose the event…</option>
            {props.events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
          <span className='mt-1 block text-gray-500'>Not listed? Add it on Events first.</span>
        </label>
        <label className='block text-sm'>
          <span className='text-gray-600'>Works for</span>
          <select
            value={form.days}
            onChange={(e) => setForm({ ...form, days: Number(e.target.value) })}
            className='mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 bg-white'
          >
            {props.dayOptions.map((o) => (
              <option key={o.days} value={o.days}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className='block text-sm'>
          <span className='text-gray-600'>Takes up to</span>
          <select
            value={form.maxPhotos}
            onChange={(e) => setForm({ ...form, maxPhotos: Number(e.target.value) })}
            className='mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 bg-white'
          >
            {LINK_PHOTOS.map((n) => (
              <option key={n} value={n}>{n} photos</option>
            ))}
          </select>
        </label>
        <div className='flex items-end'>
          <button type='submit' disabled={busy} className='w-full bg-primary text-white rounded-lg px-4 py-2 font-semibold disabled:opacity-50'>
            Make the link
          </button>
        </div>
      </form>

      <h2 className='font-semibold text-gray-900 mb-3'>{links.length ? 'Links' : 'No links yet'}</h2>
      <ul className='space-y-3 max-w-3xl'>
        {links.map((l) => {
          const live = l.state === 'open' || l.state === 'full';
          return (
            <li key={l.id} className={`bg-white border rounded-xl p-4 ${l.id === fresh ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'}`}>
              <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
                <span className='font-semibold text-gray-900'>{l.eventName}</span>
                <span className={`rounded px-1.5 text-xs font-medium ${STATE[l.state].className}`}>{STATE[l.state].label}</span>
              </div>
              {live && (
                <div className='mt-2 flex flex-wrap items-center gap-2'>
                  <input
                    readOnly
                    value={url(l)}
                    onFocus={(e) => e.target.select()}
                    aria-label={`Link for ${l.eventName}`}
                    className='min-w-0 basis-full sm:basis-0 sm:flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-gray-50'
                  />
                  <button onClick={() => copy(l)} className='rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white'>
                    Copy link
                  </button>
                  <a href={l.path} target='_blank' rel='noreferrer' className='text-sm text-primary underline hover:no-underline'>
                    Open ↗
                  </a>
                </div>
              )}
              <p className='text-xs text-gray-500 mt-2'>
                {l.state === 'ended' && l.endedAt
                  ? `Ended ${day(l.endedAt)}${l.endedBy ? ` by ${l.endedBy}` : ''}`
                  : l.state === 'expired'
                    ? `Worked through ${linkLastDay(l.expiresAt)}`
                    : `Works through ${linkLastDay(l.expiresAt)}`}
                {` · ${l.photos} of ${l.maxPhotos} photos sent`}
                {` · made ${day(l.createdAt)} by ${l.createdBy}`}
              </p>
              {live && (
                <div className='mt-2 text-right'>
                  <ConfirmDelete
                    label='End now'
                    title={`End the link for ${l.eventName}?`}
                    confirmLabel='End the link'
                    workingLabel='Ending…'
                    busy={busy}
                    message={
                      <p>
                        People who have it can no longer send photos with it. Photos already sent stay on Review or in the
                        gallery. You can make a new link at any time.
                      </p>
                    }
                    onConfirm={() => end(l)}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <Notice message={notice.message} error={notice.error} onDone={clearNotice} />
    </OfficeLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const auth = await requireOfficePage(ctx, 'people');
  if ('redirect' in auth) return auth;
  const { listLinks } = await import('@/lib/gallery/links');
  const { query } = await import('@/lib/db');
  const { parishToday } = await import('@/lib/office/records');
  const { LINK_DAYS, eventName } = await import('@/lib/gallery/types');
  const events = await query('select id, title, event_date::text as event_date from gallery_events order by event_date desc nulls last, title');
  const host = String(ctx.req.headers['x-forwarded-host'] ?? ctx.req.headers.host ?? '').split(',')[0].trim();
  const proto = String(ctx.req.headers['x-forwarded-proto'] ?? '').split(',')[0].trim() || (/^(localhost|127\.)/.test(host) ? 'http' : 'https');
  const [y, m, d] = parishToday().split('-').map(Number);
  const lastDay = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  return {
    props: {
      email: auth.session.email,
      areas: auth.session.areas,
      links: await listLinks(),
      events: events.map((e) => ({ id: e.id, name: eventName({ title: e.title, eventDate: e.event_date }) })),
      origin: `${proto}://${host}`,
      dayOptions: LINK_DAYS.map((days) => ({
        days,
        label: `${days === 1 ? '1 day' : `${days} days`}, through ${lastDay.format(new Date(Date.UTC(y, m - 1, d + days)))}`,
      })),
    },
  };
};
