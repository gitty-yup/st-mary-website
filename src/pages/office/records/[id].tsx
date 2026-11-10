import type { GetServerSideProps } from 'next';
import React from 'react';
import CertificateEditor from '@/components/office/CertificateEditor';
import OfficeLayout from '@/components/office/OfficeLayout';
import { displayName, emptyOfficeData } from '@/certificates/fields';
import { requireOfficePage } from '@/lib/office/auth';
import { getAudit, getRecord, type AuditEntry, type CertificateRecord } from '@/lib/office/records';

interface Props {
  email: string;
  record: CertificateRecord;
  audit: AuditEntry[];
}

export default function RecordPage({ email, record, audit }: Props) {
  const name = displayName(record.type, record.officeData);
  const kind = record.type === 'marriage' ? 'Marriage' : 'Baptism';
  return (
    <OfficeLayout title={`${kind}: ${name}`} email={email}>
      <h1 className='font-secondary text-2xl font-semibold text-primary mb-4'>
        {kind}: {name}
      </h1>
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
  return { props: { email: auth.session.email, record, audit: await getAudit(id) } };
};
