import type { GetServerSideProps } from 'next';
import React from 'react';
import CertificateEditor from '@/components/office/CertificateEditor';
import OfficeLayout from '@/components/office/OfficeLayout';
import { emptyOfficeData, type OfficeData } from '@/certificates/fields';
import type { CertificateType } from '@/certificates/types';
import { requireOfficePage } from '@/lib/office/auth';

interface Props {
  email: string;
  type: CertificateType;
  initialData: OfficeData;
}

export default function NewCertificate({ email, type, initialData }: Props) {
  const title = type === 'marriage' ? 'New marriage certificate' : 'New baptism certificate';
  return (
    <OfficeLayout title={title} email={email}>
      <h1 className='font-secondary text-2xl font-semibold text-primary mb-4'>{title}</h1>
      <CertificateEditor key={type} type={type} record={null} audit={[]} initialData={initialData} />
    </OfficeLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const auth = await requireOfficePage(ctx);
  if ('redirect' in auth) return auth;
  const type: CertificateType = ctx.query.type === 'marriage' ? 'marriage' : 'baptism';
  return { props: { email: auth.session.email, type, initialData: emptyOfficeData(type) } };
};
