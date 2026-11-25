import type { GetServerSideProps } from 'next';
import React, { useCallback, useState } from 'react';
import OfficeLayout from '@/components/office/OfficeLayout';
import { ConfirmDelete, Notice } from '@/components/office/gallery/shared';
import { requireOfficePage, type OfficeArea } from '@/lib/office/auth';
import { longDate, occasionLabel, parishToday } from '@/lib/requiem/rules';
import type { RequiemRequest } from '@/lib/requiem/store';

interface Props {
  email: string;
  areas: OfficeArea[];
  requests: RequiemRequest[];
  today: string;
  /** ?print=YYYY-MM-DD: just that Sunday's names, for reading at the service. */
  print: string | null;
}

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
      <p className='text-sm text-gray-600 mb-6'>
        Requests sent through the website&apos;s form, by Sunday. Each one was also emailed to Hayr Eremia and the office.
      </p>
      {upcoming.length === 0 && <p className='text-gray-600 mb-6'>No requests for upcoming Sundays.</p>}
      {upcoming.map((g) => (
        <SundayGroup key={g.date} date={g.date} items={g.items} busy={busy} onDelete={remove} />
      ))}
      {past.length > 0 && (
        <div className='mt-8'>
          <button onClick={() => setShowPast((v) => !v)} className='text-primary hover:underline text-sm' aria-expanded={showPast}>
            {showPast ? 'Hide' : 'Show'} past Sundays ({past.reduce((n, g) => n + g.items.length, 0)} requests)
          </button>
          {showPast && (
            <div className='mt-4 opacity-90'>
              {past.map((g) => (
                <SundayGroup key={g.date} date={g.date} items={g.items} busy={busy} onDelete={remove} />
              ))}
            </div>
          )}
        </div>
      )}
      <Notice message={notice.message} error={notice.error} onDone={clearNotice} />
    </OfficeLayout>
  );
}

function SundayGroup({ date, items, busy, onDelete }: { date: string; items: RequiemRequest[]; busy: boolean; onDelete: (r: RequiemRequest) => void }) {
  const count = items.reduce((n, r) => n + r.names.length, 0);
  return (
    <section className='mb-8'>
      <div className='flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-3'>
        <h2 className='font-secondary text-xl font-bold text-primary'>{longDate(date)}</h2>
        <span className='text-sm text-gray-600'>
          {count} {count === 1 ? 'name' : 'names'} · {items.length} {items.length === 1 ? 'request' : 'requests'}
        </span>
        <a href={`/office/requiem?print=${date}`} target='_blank' rel='noreferrer' className='text-sm text-primary hover:underline'>
          Print names ↗
        </a>
      </div>
      <div className='space-y-3'>
        {items.map((r) => (
          <article key={r.id} className='bg-white rounded-xl border border-gray-200 p-4'>
            <ul className='space-y-1 mb-3'>
              {r.names.map((n, i) => (
                <li key={i}>
                  <strong className='text-gray-900'>{n.name}</strong>
                  <span className='text-gray-600'> · {n.relationship} · {occasionLabel(n.occasion)}</span>
                </li>
              ))}
            </ul>
            <div className='text-sm text-gray-700 grid sm:grid-cols-2 gap-x-6 gap-y-1'>
              <p>
                <span className='text-gray-500'>Requested by</span> {r.name}
              </p>
              <p>
                <a href={`tel:${r.phone.replace(/[^\d+]/g, '')}`} className='text-primary hover:underline'>
                  {r.phone}
                </a>{' '}
                ·{' '}
                <a href={`mailto:${r.email}`} className='text-primary hover:underline break-all'>
                  {r.email}
                </a>
              </p>
              <p>
                {r.address}, {r.city}, {r.state} {r.zip}
              </p>
              <p className='text-gray-500'>
                Sent {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' })}
                {r.newsletter && ' · wants the newsletter'}
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
      <p className='mb-6'>{longDate(date)}</p>
      {names.length === 0 ? (
        <p>No names for this Sunday.</p>
      ) : (
        <ol className='list-decimal pl-6 space-y-2 text-lg'>
          {names.map((n, i) => (
            <li key={i}>
              {n.name} <span className='text-gray-600 text-base'>({occasionLabel(n.occasion).split(' – ')[1] ?? occasionLabel(n.occasion)})</span>
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
  const { listRequiemRequests } = await import('@/lib/requiem/store');
  const print = typeof ctx.query.print === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(ctx.query.print) ? ctx.query.print : null;
  return {
    props: {
      email: gate.session.email,
      areas: gate.session.areas,
      requests: await listRequiemRequests(),
      today: parishToday(),
      print,
    },
  };
};
