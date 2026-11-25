import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import React, { useCallback, useState } from 'react';
import { QrCode } from '@/components/gallery/QrCode';
import OfficeLayout from '@/components/office/OfficeLayout';
import { ConfirmDelete, Notice } from '@/components/office/gallery/shared';
import { requireOfficePage, type OfficeArea } from '@/lib/office/auth';
import { SAME_DAY_CUTOFF_LABEL, longDate, offeringLabel, parishToday, remembranceLabel, serviceDateLabel } from '@/lib/requiem/rules';
import type { RequiemRequest } from '@/lib/requiem/store';

interface Props {
  email: string;
  areas: OfficeArea[];
  requests: RequiemRequest[];
  today: string;
  /** ?print=YYYY-MM-DD: just that day's names, for reading at the service. */
  print: string | null;
  /** When each day's names sheet was last opened for printing. */
  printed: Record<string, string>;
  /** The permanent same-day QR code's link. */
  sameDayUrl: string;
}

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' }).toLowerCase();

/** Requests grouped by Sunday: upcoming (soonest first), then past (most recent first). */
function bySunday(requests: RequiemRequest[], today: string) {
  const map = new Map<string, RequiemRequest[]>();
  for (const r of requests) map.set(r.serviceDate, [...(map.get(r.serviceDate) ?? []), r]);
  const dates = Array.from(map.keys());
  return {
    upcoming: dates.filter((d) => d >= today).sort().map((d) => ({ date: d, items: map.get(d)! })),
    past: dates.filter((d) => d < today).sort().reverse().map((d) => ({ date: d, items: map.get(d)! })),
  };
}

export default function RequiemRequests(props: Props) {
  const [requests, setRequests] = useState(props.requests);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ message: '', error: false });
  const clearNotice = useCallback(() => setNotice({ message: '', error: false }), []);
  const [showPast, setShowPast] = useState(false);

  if (props.print) return <PrintSunday date={props.print} requests={requests.filter((r) => r.serviceDate === props.print)} />;

  async function remove(r: RequiemRequest) {
    setBusy(true);
    try {
      const res = await fetch(`/api/office/requiem?id=${encodeURIComponent(r.id)}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Something went wrong. Please try again.');
      setRequests((list) => list.filter((x) => x.id !== r.id));
      setNotice({ message: `Deleted the request from ${r.name}.`, error: false });
    } catch (err) {
      setNotice({ message: (err as Error).message, error: true });
    } finally {
      setBusy(false);
    }
  }

  const { upcoming, past } = bySunday(requests, props.today);
  return (
    <OfficeLayout title='Requiem requests' email={props.email} areas={props.areas}>
      <h1 className='font-secondary text-2xl font-bold text-primary mb-1'>Hokihankist requests</h1>
      <p className='text-sm text-gray-600 mb-4'>
        Requests from the website and from paper forms, by service day. Each one was also emailed to Hayr Eremia and the
        office.
      </p>
      <div className='flex flex-wrap gap-3 mb-6'>
        <Link href='/office/requiem/new' className='bg-secondary text-white rounded-lg px-4 py-2 font-semibold text-sm'>
          Add a paper request
        </Link>
        <a href='/api/office/requiem/blank-form' target='_blank' rel='noreferrer' className='border border-primary text-primary rounded-lg px-4 py-2 font-semibold text-sm'>
          Print blank form ↗
        </a>
      </div>
      <SameDayPanel initialUrl={props.sameDayUrl} onNotice={setNotice} />
      {upcoming.length === 0 && <p className='text-gray-600 mb-6'>No requests for upcoming days.</p>}
      {upcoming.map((g) => (
        <SundayGroup key={g.date} date={g.date} items={g.items} printedAt={props.printed[g.date]} busy={busy} onDelete={remove} />
      ))}
      {past.length > 0 && (
        <div className='mt-8'>
          <button onClick={() => setShowPast((v) => !v)} className='text-primary hover:underline text-sm' aria-expanded={showPast}>
            {showPast ? 'Hide' : 'Show'} past days ({past.reduce((n, g) => n + g.items.length, 0)} requests)
          </button>
          {showPast && (
            <div className='mt-4 opacity-90'>
              {past.map((g) => (
                <SundayGroup key={g.date} date={g.date} items={g.items} printedAt={props.printed[g.date]} busy={busy} onDelete={remove} />
              ))}
            </div>
          )}
        </div>
      )}
      <Notice message={notice.message} error={notice.error} onDone={clearNotice} />
    </OfficeLayout>
  );
}

/** The permanent same-day QR code: show it, open it here (kiosk), copy it, print the sign, or replace it. */
function SameDayPanel({ initialUrl, onNotice }: { initialUrl: string; onNotice: (n: { message: string; error: boolean }) => void }) {
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      onNotice({ message: 'Link copied. Paste it into a text or email.', error: false });
    } catch {
      onNotice({ message: 'Could not copy. Select the link below and copy it.', error: true });
    }
  }
  async function replace() {
    setBusy(true);
    try {
      const res = await fetch('/api/office/requiem/same-day', { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Something went wrong. Please try again.');
      setUrl(body.url);
      onNotice({ message: 'Replaced. Old signs and links no longer work; print the new sign.', error: false });
    } catch (err) {
      onNotice({ message: (err as Error).message, error: true });
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className='bg-white rounded-xl border border-gray-200 p-4 mb-8 flex flex-col sm:flex-row gap-5' aria-labelledby='same-day-heading'>
      <QrCode text={url} className='w-36 h-36 shrink-0 self-center sm:self-start' title='Same-day request QR code' />
      <div className='flex-1 min-w-0'>
        <h2 id='same-day-heading' className='font-semibold text-primary text-lg'>
          Same-day requests
        </h2>
        <p className='text-sm text-gray-700 mt-1'>
          For someone at the office who wants a Hokihankist today: they scan this code (or use the kiosk) and can choose
          today on Sundays and Merelots days until {SAME_DAY_CUTOFF_LABEL}. On other days it opens the regular form. The
          code doesn&apos;t change, so a printed sign keeps working.
        </p>
        <div className='flex flex-wrap gap-x-4 gap-y-2 mt-3 text-sm'>
          <a href={url} target='_blank' rel='noreferrer' className='text-primary font-semibold hover:underline'>
            Open on this device ↗
          </a>
          <button type='button' onClick={copy} className='text-primary font-semibold hover:underline'>
            Copy link
          </button>
          <a href='/api/office/requiem/qr-sign' target='_blank' rel='noreferrer' className='text-primary font-semibold hover:underline'>
            Print QR sign ↗
          </a>
          <ConfirmDelete
            label='Replace QR code'
            title='Replace the same-day QR code?'
            confirmLabel='Replace QR code'
            workingLabel='Replacing…'
            busy={busy}
            className='text-gray-600 hover:underline disabled:opacity-50'
            message={
              <p>
                Every printed sign and every link already shared will stop working right away. Only do this if the link
                is being misused. Afterwards, print the new sign.
              </p>
            }
            onConfirm={replace}
          />
        </div>
        <p className='text-xs text-gray-500 mt-2 break-all select-all' data-testid='same-day-url'>
          {url}
        </p>
      </div>
    </section>
  );
}

function SundayGroup({
  date,
  items,
  printedAt,
  busy,
  onDelete,
}: {
  date: string;
  items: RequiemRequest[];
  printedAt?: string;
  busy: boolean;
  onDelete: (r: RequiemRequest) => void;
}) {
  const count = items.reduce((n, r) => n + r.names.length, 0);
  const arrange = items.filter((r) => r.hokijash || r.fellowship).length;
  return (
    <section className='mb-8'>
      <div className='flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-3'>
        <h2 className='font-secondary text-xl font-bold text-primary'>{serviceDateLabel(date)}</h2>
        <span className='text-sm text-gray-600'>
          {count} {count === 1 ? 'name' : 'names'} · {items.length} {items.length === 1 ? 'request' : 'requests'}
          {arrange > 0 && <strong className='text-secondary'> · {arrange} to arrange</strong>}
        </span>
        <a href={`/office/requiem?print=${date}`} target='_blank' rel='noreferrer' className='text-sm text-primary hover:underline'>
          Print names ↗
        </a>
        {printedAt && <span className='text-xs text-gray-500'>names sheet opened at {time(printedAt)}</span>}
      </div>
      <div className='space-y-3'>
        {items.map((r) => (
          <article key={r.id} className='bg-white rounded-xl border border-gray-200 p-4'>
            {(r.source === 'paper' || r.sameDay || (printedAt && r.createdAt > printedAt)) && (
              <div className='flex flex-wrap gap-2 mb-2 text-xs font-semibold'>
                {r.source === 'paper' && <span className='rounded-full bg-gray-100 text-gray-700 px-2 py-0.5'>Paper</span>}
                {r.sameDay && <span className='rounded-full bg-amber-100 text-amber-900 px-2 py-0.5'>Same day</span>}
                {printedAt && r.createdAt > printedAt && (
                  <span className='rounded-full bg-red-50 text-red-800 px-2 py-0.5'>Added after the names sheet was opened at {time(printedAt)}</span>
                )}
              </div>
            )}
            <ul className='space-y-1 mb-3'>
              {r.names.map((n, i) => (
                <li key={i}>
                  <strong className='text-gray-900'>{n.name}</strong>
                  <span className='text-gray-600'> · {n.relationship} · {remembranceLabel(n)}</span>
                </li>
              ))}
            </ul>
            {(r.hokijash || r.fellowship) && (
              <div className='mb-3 rounded-lg bg-[#FFF5F2] border-l-4 border-secondary px-3 py-2 text-sm'>
                <p>
                  <strong>Contact the family to arrange:</strong>{' '}
                  {[r.hokijash && 'Hokijash (memorial meal)', r.fellowship && 'fellowship hour sponsorship'].filter(Boolean).join(' and ')}
                </p>
                {r.arrangements && <p className='text-gray-700 mt-1'>“{r.arrangements}”</p>}
              </div>
            )}
            <div className='text-sm text-gray-700 grid sm:grid-cols-2 gap-x-6 gap-y-1'>
              <p>
                <span className='text-gray-500'>Requested by</span> {r.name}
              </p>
              <p>
                {r.phone && (
                  <a href={`tel:${r.phone.replace(/[^\d+]/g, '')}`} className='text-primary hover:underline'>
                    {r.phone}
                  </a>
                )}
                {r.phone && r.email && ' · '}
                {r.email ? (
                  <a href={`mailto:${r.email}`} className='text-primary hover:underline break-all'>
                    {r.email}
                  </a>
                ) : (
                  <span className='text-gray-500'>{r.phone ? ' · no email' : 'no email'}</span>
                )}
              </p>
              <p>{[r.address, r.city, [r.state, r.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ') || <span className='text-gray-500'>No address given</span>}</p>
              <p className='text-gray-500'>
                {r.source === 'paper' ? 'Entered' : 'Sent'}{' '}
                {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' })}{' '}
                at {time(r.createdAt)}
                {r.newsletter && ' · wants the newsletter'}
                {r.offering && ` · offering: ${offeringLabel(r.offering).toLowerCase()}`}
              </p>
              {r.others && (
                <p className='sm:col-span-2'>
                  <span className='text-gray-500'>Others requesting:</span> {r.others}
                </p>
              )}
            </div>
            <div className='mt-3 text-right'>
              <ConfirmDelete
                title='Delete this request?'
                confirmLabel='Delete request'
                busy={busy}
                message={
                  <p>
                    The request from {r.name} for {r.names.map((n) => n.name).join(', ')} on {longDate(r.serviceDate)} will be removed
                    from this list. This can&apos;t be undone (the emails already sent stay in your inbox).
                  </p>
                }
                onConfirm={() => onDelete(r)}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/** A plain page of one Sunday's names, to print and read at the service. */
function PrintSunday({ date, requests }: { date: string; requests: RequiemRequest[] }) {
  const names = requests.flatMap((r) => r.names);
  return (
    <main className='max-w-2xl mx-auto p-8 font-primary text-gray-900'>
      <style>{'@media print { .no-print { display: none } @page { margin: 0.75in } }'}</style>
      <p className='text-sm text-gray-600'>St. Mary Armenian Apostolic Church</p>
      <h1 className='text-2xl font-bold mb-1'>Hokihankist</h1>
      <p className='mb-6'>{serviceDateLabel(date)}</p>
      {names.length === 0 ? (
        <p>No names for this day.</p>
      ) : (
        <ol className='list-decimal pl-6 space-y-2 text-lg'>
          {names.map((n, i) => (
            <li key={i}>
              {n.name} <span className='text-gray-600 text-base'>({remembranceLabel(n).split(' – ')[1] ?? remembranceLabel(n)})</span>
            </li>
          ))}
        </ol>
      )}
      <button onClick={() => window.print()} className='no-print mt-8 bg-primary text-white rounded-lg px-4 py-2'>
        Print
      </button>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const gate = await requireOfficePage(ctx, 'certificates');
  if ('redirect' in gate) return gate;
  const { listRequiemRequests, markNamesPrinted, namesPrintedTimes } = await import('@/lib/requiem/store');
  const { requiemNow, sameDayToken, sameDayUrl } = await import('@/lib/requiem/sameDay');
  const print = typeof ctx.query.print === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(ctx.query.print) ? ctx.query.print : null;
  if (print) await markNamesPrinted(print);
  return {
    props: {
      email: gate.session.email,
      areas: gate.session.areas,
      requests: await listRequiemRequests(),
      today: parishToday(requiemNow(ctx.req)),
      print,
      printed: print ? {} : await namesPrintedTimes(),
      sameDayUrl: print ? '' : sameDayUrl(await sameDayToken()),
    },
  };
};
