import Link from 'next/link';
import React from 'react';
import type { OfficeArea } from '@/lib/office/nav';

/** Sends JSON to an office API. Resolves to the response data, or throws with the server's message. */
export async function sendJson<T = any>(url: string, body?: unknown, method = 'POST'): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Couldn’t reach the website. Check the connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error('Your session has ended. Reload the page to sign in again.');
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data as T;
}

const TABS: { href: string; label: string; area: OfficeArea }[] = [
  { href: '/office/gallery', label: 'Photos', area: 'gallery' },
  { href: '/office/gallery/review', label: 'Review', area: 'review' },
  { href: '/office/gallery/events', label: 'Events', area: 'gallery' },
  { href: '/office/gallery/tags', label: 'Tags', area: 'gallery' },
  { href: '/office/gallery/people', label: 'People', area: 'people' },
];

/**
 * The photo office's tabs, those this person can use. Review shows how many shared
 * photos are waiting (`waiting`, or asked of the server).
 */
export function GalleryTabs({ current, areas, waiting }: { current: string; areas: OfficeArea[]; waiting?: number }) {
  const [count, setCount] = React.useState<number | null>(waiting ?? null);
  const canReview = areas.includes('review');
  React.useEffect(() => {
    if (waiting !== undefined) return setCount(waiting);
    if (!canReview) return;
    let live = true;
    fetch('/api/office/gallery/review')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && d && setCount(d.waiting))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [waiting, canReview]);
  return (
    <div className='flex flex-wrap items-center gap-x-1 gap-y-2 mb-6 border-b border-gray-200'>
      {TABS.filter((t) => areas.includes(t.area)).map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={current === t.href ? 'page' : undefined}
          className={`px-3 sm:px-4 py-2 -mb-px border-b-2 text-sm font-medium ${
            current === t.href ? 'border-primary text-primary' : 'border-transparent text-gray-600 hover:text-primary'
          }`}
        >
          {t.label}
          {t.href === '/office/gallery/review' && !!count && (
            <span className='ml-1.5 inline-block min-w-[1.25rem] rounded-full bg-secondary px-1.5 text-center text-xs leading-5 text-white'>{count}</span>
          )}
        </Link>
      ))}
      <a href='/gallery' target='_blank' rel='noreferrer' className='ml-auto text-sm text-primary underline hover:no-underline pb-2'>
        View the public gallery ↗
      </a>
    </div>
  );
}

/** A short-lived message at the bottom of the screen. */
export function Notice({ message, error, onDone }: { message: string; error?: boolean; onDone: () => void }) {
  React.useEffect(() => {
    if (!message || error) return;
    const t = setTimeout(onDone, Math.max(3000, message.length * 60)); // long messages stay long enough to read
    return () => clearTimeout(t);
  }, [message, error, onDone]);
  if (!message) return null;
  return (
    <div role={error ? 'alert' : 'status'} className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 rounded-lg px-4 py-2 shadow-lg text-sm ${error ? 'bg-red-700 text-white' : 'bg-gray-900 text-white'}`}>
      {message}
      {error && (
        <button onClick={onDone} className='ml-3 underline'>
          Dismiss
        </button>
      )}
    </div>
  );
}

/** Taps on the dialog's Delete button this soon after it opens are ignored (a double tap on the button that opened it). */
const CONFIRM_DELAY_MS = 500;

/**
 * A delete button that always asks first, in a dialog (not a browser pop-up):
 * a short question, what will happen, and two large, separate buttons. Cancel
 * is focused, so Enter, Escape or a tap outside the dialog deletes nothing; the
 * red button says exactly what it deletes. On phones the dialog sits at the
 * bottom of the screen with Cancel last, nearest the thumb.
 */
export function ConfirmDelete({
  label = 'Delete',
  title,
  message,
  confirmLabel,
  onConfirm,
  busy,
  className = 'text-sm text-red-700 hover:underline disabled:opacity-50',
  workingLabel = 'Deleting…',
}: {
  /** The button that opens the dialog. */
  label?: string;
  /** The question, e.g. "Delete 3 photos?" */
  title: string;
  /** What happens, a sentence or two (or more, e.g. thumbnails). */
  message?: React.ReactNode;
  /** The red button, naming what it deletes, e.g. "Delete 3 photos". */
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  busy?: boolean;
  className?: string;
  /** The red button's words while it works. */
  workingLabel?: string;
}) {
  const dialog = React.useRef<HTMLDialogElement>(null);
  const cancel = React.useRef<HTMLButtonElement>(null);
  const openedAt = React.useRef(0);
  const [working, setWorking] = React.useState(false);
  const titleId = React.useId();

  function open() {
    openedAt.current = Date.now();
    dialog.current?.showModal();
    cancel.current?.focus();
  }

  function close() {
    dialog.current?.close();
  }

  async function confirm() {
    if (working || Date.now() - openedAt.current < CONFIRM_DELAY_MS) return;
    setWorking(true);
    try {
      await onConfirm();
    } finally {
      setWorking(false);
      close();
    }
  }

  return (
    <>
      <button type='button' onClick={open} disabled={busy} className={className}>
        {label}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        // A tap on the dimmed background (the dialog element itself, outside its card) cancels.
        onClick={(e) => e.target === dialog.current && !working && close()}
        onCancel={(e) => working && e.preventDefault()}
        className='w-[calc(100%-2rem)] max-w-md mb-4 mt-auto sm:my-auto rounded-2xl p-0 bg-white text-left shadow-2xl backdrop:bg-black/50'
      >
        <div className='p-5 sm:p-6'>
          <h2 id={titleId} className='text-lg font-semibold text-gray-900'>
            {title}
          </h2>
          {message && <div className='mt-2 text-sm text-gray-600 space-y-2'>{message}</div>}
          <div className='mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end'>
            <button
              ref={cancel}
              type='button'
              onClick={close}
              disabled={working}
              className='min-h-[44px] rounded-lg border border-gray-300 bg-white px-5 text-base sm:text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={confirm}
              disabled={working}
              className='min-h-[44px] rounded-lg bg-red-700 px-5 text-base sm:text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60'
            >
              {working ? workingLabel : confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
