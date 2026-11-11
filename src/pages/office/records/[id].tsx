import type { GetServerSideProps } from 'next';
import React from 'react';
import CertificateEditor from '@/components/office/CertificateEditor';
import OfficeLayout from '@/components/office/OfficeLayout';
import SubmissionPanel from '@/components/office/SubmissionPanel';
import { displayName, emptyOfficeData } from '@/certificates/fields';
import { requireOfficePage } from '@/lib/office/auth';
import Link from 'next/link';
import { formatCertificateDate } from '@/certificates/fields';
import {
  findPossibleDuplicates,
  getAudit,
  getRecord,
  type AuditEntry,
  type CertificateRecord,
  type RecordSummary,
} from '@/lib/office/records';
import { STATUS_LABELS } from '@/lib/office/status';

interface Props {
  email: string;
  record: CertificateRecord;
  audit: AuditEntry[];
  duplicates: RecordSummary[];
}

export default function RecordPage({ email, record, audit, duplicates }: Props) {
  const name = displayName(record.type, record.officeData);
  const kind = record.type === 'marriage' ? 'Marriage' : 'Baptism';
  return (
    <OfficeLayout title={`${kind}: ${name}`} email={email}>
      <h1 className='font-secondary text-2xl font-semibold text-primary mb-4'>
        {kind}: {name}
      </h1>
      {duplicates.length > 0 && (
        <div className='bg-yellow-50 border border-yellow-300 rounded-xl p-4 mb-4 text-sm'>
          <div className='font-semibold mb-1'>Possible duplicate: same name and date as</div>
          <ul className='list-disc pl-5'>
            {duplicates.map((d) => (
              <li key={d.id}>
                <Link href={`/office/records/${d.id}`} className='text-primary underline'>
                  {d.name}
                </Link>{' '}
                ({formatCertificateDate(d.sacramentDate)}, {STATUS_LABELS[d.status]}
                {d.registryNumber ? `, ${d.registryNumber}` : ''})
              </li>
            ))}
          </ul>
          <div className='text-gray-600 mt-1'>If this is the same family submitting twice, decline the extra one as a duplicate.</div>
        </div>
      )}
      {record.source === 'public' && (
        <SubmissionPanel
          type={record.type}
          submitted={record.submittedData}
          createdAt={record.createdAt}
          defaultOpen={record.status !== 'issued'}
        />
      )}
      <CertificateEditor
        key={record.id}
        type={record.type}
        record={record}
        audit={audit}
        initialData={{ ...emptyOfficeData(record.type), ...record.officeData }}
      />
    </OfficeLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const auth = await requireOfficePage(ctx);
  if ('redirect' in auth) return auth;
  const id = String(ctx.params?.id);
  const record = await getRecord(id);
  if (!record) return { notFound: true };
  const [audit, duplicates] = await Promise.all([getAudit(id), record.status === 'declined' || record.status === 'voided' ? [] : findPossibleDuplicates(record)]);
  return { props: { email: auth.session.email, record, audit, duplicates } };
};
