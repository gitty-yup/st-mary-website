import Link from 'next/link';
import React from 'react';

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

const TABS = [
  { href: '/office/gallery', label: 'Photos' },
  { href: '/office/gallery/events', label: 'Events' },
  { href: '/office/gallery/tags', label: 'Tags' },
];

export function GalleryTabs({ current }: { current: string }) {
  return (
    <div className='flex flex-wrap items-center gap-2 mb-6 border-b border-gray-200'>
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={current === t.href ? 'page' : undefined}
          className={`px-4 py-2 -mb-px border-b-2 text-sm font-medium ${
            current === t.href ? 'border-primary text-primary' : 'border-transparent text-gray-600 hover:text-primary'
          }`}
        >
          {t.label}
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
    const t = setTimeout(onDone, 3000);
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

/** A delete button that asks "Delete? Yes / No" in place (no browser pop-up). */
export function ConfirmDelete({ label = 'Delete', question, onConfirm, busy }: { label?: string; question: string; onConfirm: () => void; busy?: boolean }) {
  const [asking, setAsking] = React.useState(false);
  if (!asking) {
    return (
      <button onClick={() => setAsking(true)} className='text-sm text-red-700 hover:underline'>
        {label}
      </button>
    );
  }
  return (
    <span className='text-sm'>
      <span className='text-gray-700'>{question} </span>
      <button onClick={onConfirm} disabled={busy} className='text-red-700 font-medium hover:underline'>
        Yes, delete
      </button>
      {' · '}
      <button onClick={() => setAsking(false)} className='text-gray-600 hover:underline'>
        No
      </button>
    </span>
  );
}
