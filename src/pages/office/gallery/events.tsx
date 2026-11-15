import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import React, { useCallback, useState } from 'react';
import OfficeLayout from '@/components/office/OfficeLayout';
import { ConfirmDelete, GalleryTabs, Notice, sendJson } from '@/components/office/gallery/shared';
import { requireOfficePage, type OfficeArea } from '@/lib/office/auth';
import { MAX_DESCRIPTION, MAX_TITLE, monthYear, type CountedEvent, type GalleryEvent } from '@/lib/gallery/types';

interface Props {
  email: string;
  areas: OfficeArea[];
  events: CountedEvent[];
  /** Event ID → thumbnail of its cover (the chosen one, or its newest photo). */
  covers: Record<string, string>;
}

const BLANK = { title: '', eventDate: '', description: '' };

export default function GalleryEvents(props: Props) {
  const [events, setEvents] = useState(props.events);
  const [editing, setEditing] = useState<string | null>(null); // event ID, or 'new'
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ message: '', error: false });
  const clearNotice = useCallback(() => setNotice({ message: '', error: false }), []);

  function edit(e: GalleryEvent | null) {
    setEditing(e ? e.id : 'new');
    setForm(e ? { title: e.title, eventDate: e.eventDate ?? '', description: e.description } : BLANK);
  }

  async function save() {
    setBusy(true);
    try {
      const id = editing === 'new' ? undefined : editing;
      const { event } = await sendJson<{ event: GalleryEvent }>('/api/office/gallery/events', { id, ...form, eventDate: form.eventDate || null });
      setEvents((all) => {
        const rest = all.filter((e) => e.id !== event.id);
        const photos = all.find((e) => e.id === event.id)?.photos ?? 0;
        return [...rest, { ...event, photos }].sort(
          (a, b) => (b.eventDate ?? '').localeCompare(a.eventDate ?? '') || a.title.localeCompare(b.title),
        );
      });
      setEditing(null);
      setNotice({ message: id ? 'Event saved.' : `Added ${event.title}. Add photos to it on the Photos tab.`, error: false });
    } catch (err) {
      setNotice({ message: (err as Error).message, error: true });
    } finally {
      setBusy(false);
    }
  }

  async function remove(e: CountedEvent) {
    setBusy(true);
    try {
      await sendJson(`/api/office/gallery/events?id=${e.id}`, undefined, 'DELETE');
      setEvents((all) => all.filter((x) => x.id !== e.id));
      setNotice({ message: `Deleted ${e.title}. Its photos are still in the gallery.`, error: false });
    } catch (err) {
      setNotice({ message: (err as Error).message, error: true });
    } finally {
      setBusy(false);
    }
  }

  const formView = (
    <div className='bg-white border border-gray-200 rounded-xl p-4 space-y-3 mb-4'>
      <label className='block text-sm'>
        <span className='text-gray-600'>Title</span>
        <input value={form.title} maxLength={MAX_TITLE} onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder='e.g. Food Festival 2026' className='mt-1 w-full border border-gray-300 rounded-lg px-3 py-2' />
      </label>
      <label className='block text-sm max-w-xs'>
        <span className='text-gray-600'>Date</span>
        <input type='date' value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
          className='mt-1 w-full border border-gray-300 rounded-lg px-3 py-2' />
      </label>
      <label className='block text-sm'>
        <span className='text-gray-600'>Description (optional, shown above the event’s photos)</span>
        <textarea value={form.description} maxLength={MAX_DESCRIPTION} rows={3} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className='mt-1 w-full border border-gray-300 rounded-lg px-3 py-2' />
      </label>
      <div className='flex gap-3'>
        <button onClick={save} disabled={busy || !form.title.trim()} className='bg-primary text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50'>
          {editing === 'new' ? 'Add event' : 'Save'}
        </button>
        <button onClick={() => setEditing(null)} className='text-sm text-gray-600 hover:underline'>Cancel</button>
      </div>
    </div>
  );

  return (
    <OfficeLayout title='Photo events' email={props.email} areas={props.areas}>
      <GalleryTabs current='/office/gallery/events' />
      <p className='text-sm text-gray-600 mb-4 max-w-3xl'>
        An event groups photos into an album in the public gallery, such as “Madagh 2026”. Events with no photos don’t
        appear publicly. To add photos to an event, select them on the Photos tab and choose the event.
      </p>
      {editing === 'new' ? formView : (
        <button onClick={() => edit(null)} className='bg-primary text-white rounded-lg px-4 py-2 text-sm mb-4'>New event</button>
      )}

      <ul className='space-y-2'>
        {events.map((e) => (
          <li key={e.id}>
            {editing === e.id ? formView : (
              <div className='bg-white border border-gray-200 rounded-xl p-3 flex flex-wrap items-center gap-4'>
                <div className='w-20 h-14 rounded bg-gray-100 overflow-hidden shrink-0'>
                  {props.covers[e.id] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={props.covers[e.id]} alt='' className='object-cover w-full h-full' />
                  )}
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='font-medium text-gray-800'>{e.title}</p>
                  <p className='text-xs text-gray-500'>
                    {[monthYear(e.eventDate), `${e.photos} ${e.photos === 1 ? 'photo' : 'photos'}`].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className='flex flex-wrap gap-4 text-sm items-center'>
                  <Link href={`/office/gallery?event=${e.id}`} className='text-primary hover:underline'>Photos</Link>
                  {e.photos > 0 && (
                    <a href={`/gallery?event=${e.slug}`} target='_blank' rel='noreferrer' className='text-primary hover:underline'>Public page ↗</a>
                  )}
                  <button onClick={() => edit(e)} className='text-primary hover:underline'>Edit</button>
                  <ConfirmDelete question={e.photos ? `Delete? Its ${e.photos} photos stay in the gallery.` : 'Delete?'} busy={busy} onConfirm={() => remove(e)} />
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {!events.length && editing !== 'new' && <p className='text-gray-600'>No events yet.</p>}
      <Notice message={notice.message} error={notice.error} onDone={clearNotice} />
    </OfficeLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const auth = await requireOfficePage(ctx, 'gallery');
  if ('redirect' in auth) return auth;
  const { officeGallery } = await import('@/lib/gallery/store');
  const data = await officeGallery();
  const photos = data.photos.filter((p) => !p.deleted);
  const events = data.events;
  const covers: Record<string, string> = {};
  for (const e of events) {
    const cover = photos.find((p) => p.id === e.coverPhotoId) ?? photos.find((p) => p.eventId === e.id);
    if (cover) covers[e.id] = cover.thumb;
  }
  return { props: { email: auth.session.email, areas: auth.session.areas, events, covers } };
};
