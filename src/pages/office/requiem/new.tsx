import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import React from 'react';
import RequiemForm from '@/components/forms/RequiemForm';
import OfficeLayout from '@/components/office/OfficeLayout';
import { requireOfficePage, type OfficeArea } from '@/lib/office/auth';

interface Props {
  email: string;
  areas: OfficeArea[];
}

/** The parish office types in a paper Hokihankist request form. */
export default function NewPaperRequiemRequest(props: Props) {
  return (
    <OfficeLayout title='Add a paper request' email={props.email} areas={props.areas}>
      <p className='text-sm mb-2'>
        <Link href='/office/requiem' className='text-primary hover:underline'>
          ← Hokihankist requests
        </Link>
      </p>
      <h1 className='font-secondary text-2xl font-bold text-primary mb-1'>Add a paper request</h1>
      <p className='text-sm text-gray-600 mb-6'>
        Type in a paper request form. Today can be chosen. Only a phone number or an email address is needed to reach the
        family; fill in anything else they wrote.
      </p>
      <div className='bg-[#FFF5F2] rounded-2xl p-4 sm:p-6'>
        <RequiemForm mode='office' />
      </div>
    </OfficeLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const gate = await requireOfficePage(ctx, 'certificates');
  if ('redirect' in gate) return gate;
  return { props: { email: gate.session.email, areas: gate.session.areas } };
};
