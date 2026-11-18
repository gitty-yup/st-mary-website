import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import OfficeLayout from '@/components/office/OfficeLayout';
import { ConfirmDelete, GalleryTabs, Notice, sendJson } from '@/components/office/gallery/shared';
import { requireOfficePage, type OfficeArea } from '@/lib/office/auth';
import { monthYear } from '@/lib/gallery/types';
import type { PendingPhoto } from '@/lib/gallery/sharing';

interface Props {
  email: string;
  areas: OfficeArea[];
  photos: PendingPhoto[];
}

const sentFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Los_Angeles',
});

const photosWord = (n: number) => (n === 1 ? '1 photo' : `${n} photos`);

export default function ReviewPhotos(props: Props) {
  const [photos, setPhotos] = useState(props.photos);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ message: '', error: false });
  const clearNotice = useCallback(() => setNotice({ message: '', error: false }), []);
  const viewer = useRef<HTMLDialogElement>(null);
  const office = props.areas.includes('gallery');

  const batches = useMemo(() => {
    const out: { id: string; photos: PendingPhoto[] }[] = [];
    for (const p of photos) {
      const b = out.find((x) => x.id === p.batchId);
      if (b) b.photos.push(p);
      else out.push({ id: p.batchId, photos: [p] });
    }
    return out;
  }, [photos]);
  const chosen = photos.filter((p) => selected.has(p.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function open(index: number) {
    setViewing(index);
    viewer.current?.showModal();
  }

  function closeViewer() {
    viewer.current?.close();
    setViewing(null);
  }

  async function decide(ids: string[], decision: 'approve' | 'turn_down') {
    if (!ids.length) return;
    setBusy(true);
    try {
      const res = await sendJson<{ reviewed: number; events: string[] }>('/api/office/gallery/review', { ids, decision });
      const gone = new Set(ids);
      const left = photos.filter((p) => !gone.has(p.id));
      setPhotos(left);
      setSelected((prev) => new Set(Array.from(prev).filter((id) => !gone.has(id))));
      // Keep the viewer on the next photo, if any.
      if (viewing !== null) {
        if (!left.length) closeViewer();
        else setViewing(Math.min(viewing, left.length - 1));
      }
      setNotice({
        message:
          decision === 'approve'
            ? `${res.reviewed === 1 ? 'The photo is' : `${res.reviewed} photos are`} in the gallery now${
                res.events.length ? `, in ${res.events.map((e) => `“${e}”`).join(' and ')}` : ''
              }.`
            : `Turned down ${photosWord(res.reviewed)}.`,
        error: false,
      });
    } catch (err) {
      setNotice({ message: (err as Error).message, error: true });
    } finally {
      setBusy(false);
    }
  }

  const current = viewing !== null ? photos[viewing] : null;

  return (
    <OfficeLayout title='Review shared photos' email={props.email} areas={props.areas}>
      {office ? (
        <GalleryTabs current='/office/gallery/review' areas={props.areas} waiting={photos.length} />
      ) : (
        <h1 className='font-secondary text-2xl font-semibold text-primary mb-4'>Photos waiting for review</h1>
      )}
      <p className='text-sm text-gray-600 mb-6 max-w-3xl'>
        Photos people share wait here until someone approves them for the gallery or turns them down; any one reviewer is
        enough. Tap photos to select them, or <strong>View</strong> to see one large. Turning a photo down removes it for
        good; the person who sent it isn’t told.
      </p>

      {!photos.length && (
        <div className='bg-white border border-gray-200 rounded-xl p-6 text-gray-700 max-w-xl'>
          <p className='font-semibold mb-1'>Nothing is waiting for review.</p>
          <p className='text-sm text-gray-600'>
            New photos appear here as people share them.{' '}
            <Link href='/share-photos' className='text-primary underline'>Share your own photos</Link>
          </p>
        </div>
      )}

      <div className={chosen.length ? 'pb-40' : 'pb-8'}>
        {batches.map((b) => {
          const first = b.photos[0];
          return (
            <section key={b.id} className='mb-8'>
              <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2'>
                <h2 className='font-semibold text-gray-900'>{first.from}</h2>
                <span className='text-sm text-gray-600'>
                  {photosWord(b.photos.length)} · sent {sentFormat.format(new Date(first.sentAt))} ·{' '}
                  {first.eventName ? <>for <strong>{first.eventName}</strong></> : 'no event chosen'}
                  {first.newEvent && <NewEventBadge />}
                </span>
                <button onClick={() => setSelected((prev) => new Set([...Array.from(prev), ...b.photos.map((p) => p.id)]))} className='text-sm text-primary hover:underline'>
                  Select these {b.photos.length}
                </button>
              </div>
              {first.newEvent && (
                <p className='text-sm text-gray-600 mb-2'>
                  {first.from} named a new event. Approving creates it (or uses one with the same name and date)
                  {office ? '; you can rename it later on Events.' : '; the office can rename it later.'}
                </p>
              )}
              {first.caption && <p className='text-sm text-gray-700 mb-2'>Caption: “{first.caption}”</p>}
              <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5'>
                {b.photos.map((p) => {
                  const on = selected.has(p.id);
                  return (
                    <div key={p.id} className={`relative aspect-square overflow-hidden rounded bg-gray-200 ${on ? 'ring-4 ring-primary' : ''}`}>
                      <button onClick={() => toggle(p.id)} aria-pressed={on} aria-label={`Select ${p.fileName || 'photo'}`} className='w-full h-full focus:outline-none focus:ring-2 focus:ring-secondary'>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.thumb} alt='' loading='lazy' decoding='async' className='object-cover w-full h-full' />
                      </button>
                      {on && <span className='pointer-events-none absolute top-1 left-1 bg-primary text-white rounded-full w-6 h-6 text-sm leading-6 text-center'>✓</span>}
                      <button
                        onClick={() => open(photos.indexOf(p))}
                        className='absolute bottom-1 right-1 rounded bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80'
                      >
                        View
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {chosen.length > 0 && (
        <div className='fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-300 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]'>
          <div className='max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3'>
            <strong className='text-gray-800'>{chosen.length} selected</strong>
            <button onClick={() => setSelected(new Set())} className='text-sm text-primary hover:underline'>Clear selection</button>
            <span className='ml-auto flex flex-wrap items-center gap-3'>
              <ConfirmDelete
                label={`Turn down ${chosen.length}`}
                title={chosen.length === 1 ? 'Turn down this photo?' : `Turn down ${chosen.length} photos?`}
                confirmLabel={`Turn down ${photosWord(chosen.length)}`}
                workingLabel='Turning down…'
                busy={busy}
                className='min-h-[44px] border border-red-300 text-red-700 rounded-lg px-4 text-sm hover:bg-red-50 disabled:opacity-50'
                message={<TurnDownMessage photos={chosen} />}
                onConfirm={() => decide(chosen.map((p) => p.id), 'turn_down')}
              />
              <button
                disabled={busy}
                onClick={() => decide(chosen.map((p) => p.id), 'approve')}
                className='min-h-[44px] bg-green-700 text-white rounded-lg px-4 text-sm font-semibold hover:bg-green-800 disabled:opacity-50'
              >
                Approve {chosen.length}
              </button>
            </span>
          </div>
        </div>
      )}

      <dialog
        ref={viewer}
        onClose={() => setViewing(null)}
        onClick={(e) => e.target === viewer.current && closeViewer()}
        className='w-[calc(100%-1rem)] max-w-4xl rounded-2xl p-0 bg-white shadow-2xl backdrop:bg-black/70'
      >
        {current && (
          <div className='p-3 sm:p-5'>
            <div className='flex items-center gap-3 mb-3 text-sm'>
              <button disabled={viewing === 0} onClick={() => setViewing((v) => (v ? v - 1 : v))} className='rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40'>
                ‹ Previous
              </button>
              <span className='text-gray-600'>
                {(viewing ?? 0) + 1} of {photos.length}
              </span>
              <button
                disabled={viewing === photos.length - 1}
                onClick={() => setViewing((v) => (v !== null && v < photos.length - 1 ? v + 1 : v))}
                className='rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40'
              >
                Next ›
              </button>
              <button onClick={closeViewer} className='ml-auto rounded-lg border border-gray-300 px-3 py-1'>Close</button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.src} alt='' className='mx-auto max-h-[60vh] w-auto rounded bg-gray-100' />
            <p className='mt-3 text-sm text-gray-700'>
              From <strong>{current.from}</strong> · taken {monthYear(current.takenOn)} ·{' '}
              {current.eventName ? <>for {current.eventName}</> : 'no event chosen'}
              {current.newEvent && <NewEventBadge />}
              {current.fileName && <span className='text-gray-500'> · {current.fileName}</span>}
            </p>
            {current.caption && <p className='text-sm text-gray-700'>Caption: “{current.caption}”</p>}
            <div className='mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end'>
              <ConfirmDelete
                label='Turn down'
                title='Turn down this photo?'
                confirmLabel='Turn down 1 photo'
                workingLabel='Turning down…'
                busy={busy}
                className='min-h-[44px] border border-red-300 text-red-700 rounded-lg px-5 text-sm hover:bg-red-50 disabled:opacity-50'
                message={<TurnDownMessage photos={[current]} />}
                onConfirm={() => decide([current.id], 'turn_down')}
              />
              <button
                disabled={busy}
                onClick={() => decide([current.id], 'approve')}
                className='min-h-[44px] bg-green-700 text-white rounded-lg px-5 text-sm font-semibold hover:bg-green-800 disabled:opacity-50'
              >
                Approve
              </button>
            </div>
          </div>
        )}
      </dialog>
      <Notice message={notice.message} error={notice.error} onDone={clearNotice} />
    </OfficeLayout>
  );
}

function NewEventBadge() {
  return <span className='ml-1.5 inline-block rounded bg-secondary/15 px-1.5 text-xs font-medium text-secondary align-middle'>new event</span>;
}

function TurnDownMessage({ photos }: { photos: PendingPhoto[] }) {
  return (
    <>
      <span className='flex flex-wrap gap-1.5'>
        {photos.slice(0, 8).map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p.id} src={p.thumb} alt='' className='w-12 h-12 object-cover rounded' />
        ))}
        {photos.length > 8 && (
          <span className='w-12 h-12 rounded bg-gray-100 text-gray-600 text-xs flex items-center justify-center'>+{photos.length - 8}</span>
        )}
      </span>
      <p>
        {photos.length === 1 ? 'It won’t appear' : 'They won’t appear'} in the gallery, and{' '}
        {photos.length === 1 ? 'its files are' : 'their files are'} removed, originals included. This can’t be undone. The
        person who sent {photos.length === 1 ? 'it' : 'them'} isn’t told.
      </p>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const auth = await requireOfficePage(ctx, 'review');
  if ('redirect' in auth) return auth;
  const { pendingPhotos } = await import('@/lib/gallery/sharing');
  return { props: { email: auth.session.email, areas: auth.session.areas, photos: await pendingPhotos() } };
};
