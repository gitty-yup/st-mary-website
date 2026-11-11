import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import React, { useState } from 'react';
import OfficeLayout from '@/components/office/OfficeLayout';
import { formatCertificateDate } from '@/certificates/fields';
import { requireOfficePage } from '@/lib/office/auth';
import { listRecords, type RecordSummary } from '@/lib/office/records';
import { STATUS_LABELS } from '@/lib/office/status';

interface Props {
  email: string;
  records: RecordSummary[];
}

const STATUS_STYLE: Record<string, string> = {
  submitted: 'bg-orange-100 text-orange-800',
  needs_info: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  issued: 'bg-green-100 text-green-800',
  declined: 'bg-gray-200 text-gray-700',
  voided: 'bg-gray-200 text-gray-700',
};

const VIEWS = [
  { id: 'todo', label: 'To do', statuses: ['submitted', 'needs_info', 'approved'] },
  { id: 'issued', label: 'Issued', statuses: ['issued'] },
  { id: 'closed', label: 'Declined / voided', statuses: ['declined', 'voided'] },
  { id: 'all', label: 'All', statuses: [] as string[] },
];

export default function OfficeHome({ email, records }: Props) {
  const [filter, setFilter] = useState('');
  const [view, setView] = useState('all');
  const q = filter.trim().toLowerCase();
  const inView = (id: string) => {
    const v = VIEWS.find((x) => x.id === id)!;
    return v.statuses.length ? records.filter((r) => v.statuses.includes(r.status)) : records;
  };
  // Searching looks across every status.
  const shown = q
    ? records.filter((r) => `${r.name} ${r.registryNumber ?? ''}`.toLowerCase().includes(q))
    : inView(view);

  return (
    <OfficeLayout title='Records' email={email}>
      <div className='flex flex-wrap items-center gap-3 mb-4'>
        <h1 className='font-secondary text-2xl font-semibold text-primary mr-auto'>Certificate records</h1>
        <Link href='/office/new?type=baptism' className='bg-primary text-white rounded-lg px-4 py-2 font-semibold text-sm'>
          New baptism
        </Link>
        <Link href='/office/new?type=marriage' className='bg-primary text-white rounded-lg px-4 py-2 font-semibold text-sm'>
          New marriage
        </Link>
      </div>

      {records.length === 0 ? (
        <div className='bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-600'>
          No records yet. Start with “New baptism” or “New marriage”.
        </div>
      ) : (
        <>
          <input
            type='search'
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder='Search by name or registry number'
            className='w-full sm:w-80 border border-gray-300 rounded-lg px-3 py-2 mb-3'
          />
          <div className='flex flex-wrap gap-2 mb-3' role='group' aria-label='Show'>
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                aria-pressed={!q && view === v.id}
                className={`rounded-full px-3 py-1 text-sm border ${
                  !q && view === v.id ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                {v.label} <span className='opacity-70'>{inView(v.id).length}</span>
              </button>
            ))}
          </div>
          <div className='bg-white rounded-xl border border-gray-200 overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='text-left text-gray-500 border-b'>
                <tr>
                  <th className='px-4 py-2 font-medium'>Name</th>
                  <th className='px-4 py-2 font-medium'>Type</th>
                  <th className='px-4 py-2 font-medium'>Sacrament date</th>
                  <th className='px-4 py-2 font-medium'>Status</th>
                  <th className='px-4 py-2 font-medium'>Registry no.</th>
                  <th className='px-4 py-2 font-medium'>Updated</th>
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={6} className='px-4 py-6 text-center text-gray-500'>
                      Nothing here.
                    </td>
                  </tr>
                )}
                {shown.map((r) => (
                  <tr key={r.id} className='border-b last:border-0 hover:bg-gray-50'>
                    <td className='px-4 py-2'>
                      <Link href={`/office/records/${r.id}`} className='text-primary font-semibold hover:underline'>
                        {r.name}
                      </Link>
                    </td>
                    <td className='px-4 py-2'>{r.type === 'marriage' ? 'Marriage' : 'Baptism'}</td>
                    <td className='px-4 py-2 whitespace-nowrap'>{formatCertificateDate(r.sacramentDate) || '—'}</td>
                    <td className='px-4 py-2'>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${STATUS_STYLE[r.status]}`}>
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className='px-4 py-2 whitespace-nowrap'>{r.registryNumber ?? '—'}</td>
                    <td className='px-4 py-2 whitespace-nowrap text-gray-500'>
                      {new Date(r.updatedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </OfficeLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const auth = await requireOfficePage(ctx);
  if ('redirect' in auth) return auth;
  return { props: { email: auth.session.email, records: await listRecords() } };
};
