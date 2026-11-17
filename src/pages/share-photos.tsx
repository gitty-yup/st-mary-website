import type { GetServerSideProps } from 'next';
import React, { useEffect, useRef, useState } from 'react';
import OfficeLayout from '@/components/office/OfficeLayout';
import type { OfficeArea } from '@/lib/office/nav';

/**
 * /share-photos: where invited people (and the office and leaders) send photos for the
 * gallery, from a phone or computer. Each photo goes straight to storage, then the
 * website prepares it; photos from people who can't review wait for review.
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

const MAX_MB = 30;
const MAX_FILES = 100;

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

type ItemState = 'waiting' | 'sending' | 'preparing' | 'done' | 'failed';

interface Item {
  key: string;
  file: File;
  preview: string;
  state: ItemState;
  progress: number;
  note?: string;
}

class UploadError extends Error {
  constructor(message: string, public retry: boolean) {
    super(message);
    Object.setPrototypeOf(this, UploadError.prototype);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  const b = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = b.map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

async function api(body: Record<string, unknown>) {
  let res: Response;
  try {
    res = await fetch('/api/office/gallery/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new UploadError('The connection dropped.', true);
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new UploadError('Your sign-in has ended. Reload the page and sign in again.', false);
  if (!res.ok) throw new UploadError(data.error || 'Something went wrong.', res.status >= 500 || res.status === 409);
  return data;
}

/** Sends the file straight to storage, reporting progress (0–1). */
function putFile(url: string, file: File, contentType: string, onProgress: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new UploadError(`The upload was refused (${xhr.status}).`, true)));
    xhr.onerror = () => reject(new UploadError('The connection dropped.', true));
    xhr.ontimeout = () => reject(new UploadError('The connection timed out.', true));
    xhr.send(file);
  });
}

function Uploader(props: SignedIn) {
  const [items, setItems] = useState<Item[]>([]);
  const [eventId, setEventId] = useState('');
  const [caption, setCaption] = useState('');
  const [phase, setPhase] = useState<'choose' | 'sending' | 'done'>('choose');
  const batchId = useRef(newId());
  const input = useRef<HTMLInputElement>(null);
  const previews = useRef<string[]>([]);

  useEffect(() => () => previews.current.forEach((u) => URL.revokeObjectURL(u)), []);
  useEffect(() => {
    if (phase !== 'sending') return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [phase]);

  const update = (key: string, patch: Partial<Item>) => setItems((all) => all.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  function choose(files: FileList | null) {
    if (!files) return;
    // Copy them now: the list empties when the input is cleared below (so the same photos can be picked again).
    const picked = Array.from(files);
    const seen = new Set(items.map((i) => `${i.file.name}|${i.file.size}|${i.file.lastModified}`));
    const added: Item[] = [];
    for (const file of picked) {
      const id = `${file.name}|${file.size}|${file.lastModified}`;
      if (seen.has(id) || items.length + added.length >= MAX_FILES) continue;
      seen.add(id);
      const preview = URL.createObjectURL(file);
      previews.current.push(preview);
      const tooBig = file.size > MAX_MB * 1024 * 1024;
      const notPhoto = file.type && !file.type.startsWith('image/');
      added.push({
        key: newId(),
        file,
        preview,
        state: tooBig || notPhoto ? 'failed' : 'waiting',
        progress: 0,
        note: tooBig ? `Larger than ${MAX_MB} MB, the most the website accepts.` : notPhoto ? 'Not a photo.' : undefined,
      });
    }
    setItems((all) => [...all, ...added]);
    if (input.current) input.current.value = '';
  }

  function remove(key: string) {
    setItems((all) => all.filter((i) => i.key !== key));
  }

  async function sendOne(item: Item) {
    for (let attempt = 1; ; attempt++) {
      try {
        update(item.key, { state: 'sending', progress: 0, note: undefined });
        const start = await api({
          action: 'start',
          name: item.file.name,
          size: item.file.size,
          type: item.file.type,
          batchId: batchId.current,
          eventId: eventId || null,
          caption,
        });
        await putFile(start.url, item.file, start.contentType, (p) => update(item.key, { progress: p }));
        update(item.key, { state: 'preparing', progress: 1 });
        for (let f = 1; ; f++) {
          try {
            await api({ action: 'finish', id: start.id });
            break;
          } catch (err) {
            if (!(err as UploadError).retry || f >= 3) throw err;
            await sleep(1500 * f);
          }
        }
        update(item.key, { state: 'done' });
        return;
      } catch (err) {
        const e = err instanceof UploadError ? err : new UploadError('Something went wrong.', true);
        if (!e.retry || attempt >= 3) {
          update(item.key, { state: 'failed', note: e.message });
          return;
        }
        update(item.key, { note: 'Connection trouble; trying again…' });
        await sleep(2000 * attempt);
      }
    }
  }

  async function send(list: Item[]) {
    if (!list.length) return;
    setPhase('sending');
    let next = 0;
    await Promise.all(
      Array.from({ length: Math.min(2, list.length) }, async () => {
        while (next < list.length) await sendOne(list[next++]);
      }),
    );
    setPhase('done');
  }

  function startOver() {
    previews.current.forEach((u) => URL.revokeObjectURL(u));
    previews.current = [];
    setItems([]);
    setCaption('');
    batchId.current = newId();
    setPhase('choose');
  }

  const ready = items.filter((i) => i.state === 'waiting');
  const done = items.filter((i) => i.state === 'done');
  const failed = items.filter((i) => i.state === 'failed');
  const sending = phase === 'sending';
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

        {!props.ready && (
          <p className='mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900'>
            Photo sharing isn’t switched on yet on this website. Please try again later.
          </p>
        )}

        {phase === 'done' ? (
          <div className='bg-white border border-gray-200 rounded-xl p-5 mb-6'>
            <p className='text-lg font-semibold text-gray-900'>
              {done.length ? `Sent ${done.length === 1 ? '1 photo' : `${done.length} photos`}. Thank you!` : 'No photos were sent.'}
            </p>
            {done.length > 0 && (
              <p className='text-gray-700 mt-1'>
                {props.reviewed ? 'They’ll appear in the gallery once someone from the parish has looked at them.' : 'They’re in the gallery now.'}
              </p>
            )}
            {failed.length > 0 && (
              <p className='text-red-700 mt-2'>
                {failed.length === 1 ? '1 photo' : `${failed.length} photos`} didn’t go through; see below.
              </p>
            )}
            <div className='mt-4 flex flex-wrap gap-3'>
              {failed.some((i) => !i.note?.startsWith('Larger') && i.note !== 'Not a photo.') && (
                <button onClick={() => send(failed)} className='min-h-[48px] rounded-lg bg-primary px-5 font-semibold text-white'>
                  Try the failed ones again
                </button>
              )}
              <button onClick={startOver} className='min-h-[48px] rounded-lg border border-primary px-5 font-semibold text-primary'>
                Share more photos
              </button>
            </div>
          </div>
        ) : (
          <div className='space-y-4 mb-6'>
            <label className='block'>
              <span className='font-medium text-gray-900'>Which event are these from?</span>
              <select
                value={eventId}
                disabled={sending}
                onChange={(e) => setEventId(e.target.value)}
                className='mt-1 w-full border border-gray-300 rounded-lg px-3 py-3 bg-white text-base'
              >
                <option value=''>Not sure, or no particular event</option>
                {props.events.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </label>
            <label className='block'>
              <span className='font-medium text-gray-900'>Caption</span>
              <span className='text-gray-500'> (optional; for all these photos; please don’t name children)</span>
              <input
                value={caption}
                disabled={sending}
                maxLength={300}
                onChange={(e) => setCaption(e.target.value)}
                className='mt-1 w-full border border-gray-300 rounded-lg px-3 py-3 text-base'
                placeholder='e.g. Blessing of the grapes after Badarak'
              />
            </label>
            <div>
              <input ref={input} id='photo-files' type='file' accept='image/*' multiple disabled={sending || !props.ready} className='sr-only' onChange={(e) => choose(e.target.files)} />
              <label
                htmlFor='photo-files'
                className={`flex min-h-[56px] w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-primary/60 bg-white px-4 text-lg font-semibold text-primary ${sending || !props.ready ? 'opacity-50 pointer-events-none' : 'hover:bg-primary/5'}`}
              >
                {items.length ? 'Add more photos' : 'Choose photos'}
              </label>
              <p className='mt-1 text-sm text-gray-500'>Up to {MAX_FILES} at a time, {MAX_MB} MB each.</p>
            </div>
          </div>
        )}

        {items.length > 0 && (
          <ul className='grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6'>
            {items.map((i) => (
              <li key={i.key} className='relative aspect-square overflow-hidden rounded-lg bg-gray-200'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.preview} alt={i.file.name} className={`h-full w-full object-cover ${i.state === 'failed' ? 'opacity-40' : ''}`} />
                {i.state === 'waiting' && !sending && (
                  <button onClick={() => remove(i.key)} aria-label={`Remove ${i.file.name}`} className='absolute top-1 right-1 h-8 w-8 rounded-full bg-black/60 text-white text-lg leading-8'>
                    ×
                  </button>
                )}
                {(i.state === 'sending' || i.state === 'preparing') && (
                  <span className='absolute inset-x-0 bottom-0 bg-black/60 px-1.5 py-1 text-xs text-white'>
                    {i.state === 'preparing' ? 'Preparing…' : `Sending ${Math.round(i.progress * 100)}%`}
                    <span className='mt-1 block h-1 rounded bg-white/30'>
                      <span className='block h-1 rounded bg-white' style={{ width: `${Math.round(i.progress * 100)}%` }} />
                    </span>
                  </span>
                )}
                {i.state === 'done' && (
                  <span className='absolute top-1 left-1 h-7 w-7 rounded-full bg-green-700 text-center text-white leading-7' aria-label='Sent'>✓</span>
                )}
                {i.state === 'failed' && (
                  <span className='absolute inset-x-0 bottom-0 bg-red-700/90 px-1.5 py-1 text-xs text-white'>{i.note ?? 'Didn’t go through.'}</span>
                )}
                {i.state === 'sending' && i.note && (
                  <span className='absolute inset-x-0 top-0 bg-yellow-500/90 px-1.5 py-0.5 text-[11px] text-black'>{i.note}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {phase !== 'done' && items.length > 0 && (
          <div className='sticky bottom-0 -mx-4 bg-gray-50/95 px-4 py-3 border-t border-gray-200'>
            <button
              onClick={() => send(ready)}
              disabled={sending || !ready.length}
              className='w-full min-h-[52px] rounded-xl bg-primary px-4 text-lg font-semibold text-white disabled:opacity-60'
            >
              {sending
                ? `Sending… ${done.length} of ${done.length + items.filter((i) => i.state === 'sending' || i.state === 'preparing' || i.state === 'waiting').length}`
                : `Send ${ready.length === 1 ? '1 photo' : `${ready.length} photos`}`}
            </button>
            {sending && <p className='mt-1 text-center text-sm text-gray-600'>Please keep this page open until it finishes.</p>}
          </div>
        )}

        <p className='text-sm text-gray-500 mt-6'>
          By sending photos, you confirm you took them or have permission to share them, and that St. Mary may show them
          on its website.
        </p>
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
