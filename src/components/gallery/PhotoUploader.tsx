import React, { useEffect, useRef, useState } from 'react';

/**
 * Choosing and sending photos, from a phone or computer: used by /share-photos (people
 * signed in) and /event-photos/<code> (anyone with an event link). Each photo goes
 * straight to storage with its own progress, tries again when the connection drops,
 * then the website prepares it.
 */

export interface PhotoUploaderProps {
  /** Where to ask: '/api/office/gallery/upload' or '/api/event-photos/<code>'. */
  endpoint: string;
  /** Photos from this person wait for review. */
  reviewed: boolean;
  /** Storage is set up on this website. */
  ready: boolean;
  /** Events to choose from. Without it (an event link) the photos go to the link's event. */
  events?: { id: string; name: string }[];
  /** Shown when their sign-in (or event-link pass) has run out. */
  signedOutMessage: string;
}

const MAX_MB = 30;
const MAX_FILES = 100;

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

/** Today on this phone or computer, YYYY-MM-DD. */
const today = () => new Date().toLocaleDateString('en-CA');

export default function PhotoUploader(props: PhotoUploaderProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [events, setEvents] = useState(props.events ?? []);
  /** '' no event, 'new' a new event (named below), or an event's ID. */
  const [eventId, setEventId] = useState('');
  const [newEvent, setNewEvent] = useState({ title: '', date: today() });
  const [caption, setCaption] = useState('');
  const [phase, setPhase] = useState<'choose' | 'sending' | 'done'>('choose');
  const batchId = useRef(newId());
  const input = useRef<HTMLInputElement>(null);
  const previews = useRef<string[]>([]);
  const choosesEvent = !!props.events;

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

  async function api(body: Record<string, unknown>) {
    let res: Response;
    try {
      res = await fetch(props.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } catch {
      throw new UploadError('The connection dropped.', true);
    }
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) throw new UploadError(props.signedOutMessage, false);
    if (!res.ok) throw new UploadError(data.error || 'Something went wrong.', res.status >= 500 || res.status === 409);
    return data;
  }

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
          ...(choosesEvent
            ? {
                eventId: eventId && eventId !== 'new' ? eventId : null,
                ...(eventId === 'new' ? { newEvent: { title: newEvent.title.trim(), date: newEvent.date } } : {}),
              }
            : {}),
          caption,
        });
        // The office and leaders: the new event now exists, so list it and choose it.
        if (start.event) {
          const created = start.event as { id: string; name: string };
          setEvents((all) => (all.some((e) => e.id === created.id) ? all : [created, ...all]));
          setEventId(created.id);
        }
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
  const eventMissing = choosesEvent && eventId === 'new' && (!newEvent.title.trim() || !newEvent.date);

  return (
    <>
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
          {choosesEvent && (
            <label className='block'>
              <span className='font-medium text-gray-900'>Which event are these from?</span>
              <select
                value={eventId}
                disabled={sending}
                onChange={(e) => setEventId(e.target.value)}
                className='mt-1 w-full border border-gray-300 rounded-lg px-3 py-3 bg-white text-base'
              >
                <option value=''>Not sure, or no particular event</option>
                <option value='new'>+ A new event (not in this list)</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </label>
          )}
          {choosesEvent && eventId === 'new' && (
            <div className='rounded-xl border border-gray-200 bg-white p-4 space-y-3'>
              <label className='block'>
                <span className='font-medium text-gray-900'>Event name</span>
                <span className='text-gray-500'> (no need to add the year)</span>
                <input
                  value={newEvent.title}
                  disabled={sending}
                  maxLength={100}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className='mt-1 w-full border border-gray-300 rounded-lg px-3 py-3 text-base'
                  placeholder='e.g. Vartavar Picnic'
                />
              </label>
              <label className='block'>
                <span className='font-medium text-gray-900'>Date of the event</span>
                <input
                  type='date'
                  value={newEvent.date}
                  max={today()}
                  disabled={sending}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className='mt-1 block w-full border border-gray-300 rounded-lg px-3 py-3 text-base bg-white'
                />
              </label>
              <p className='text-sm text-gray-600'>
                {props.reviewed
                  ? 'The parish adds this event to the gallery when they approve your photos.'
                  : 'This event is added to the gallery with your photos.'}
              </p>
            </div>
          )}
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
          {eventMissing && !sending && <p className='mb-2 text-center text-sm text-gray-600'>Enter the new event’s name and date first.</p>}
          <button
            onClick={() => send(ready)}
            disabled={sending || !ready.length || eventMissing}
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
        By sending photos, you confirm you took them or have permission to share them, and that St. Mary may show them on its
        website.
      </p>
    </>
  );
}
