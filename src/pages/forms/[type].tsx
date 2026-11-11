import type { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import React from 'react';
import IntakeForm from '@/components/forms/IntakeForm';
import AppLayout from '@/components/layout/AppLayout';
import HeadElement from '@/components/layout/HeadElement';
import { INTAKE_TITLES } from '@/certificates/intake';
import type { CertificateType } from '@/certificates/types';

interface Props {
  type: CertificateType;
}

const INTRO: Record<CertificateType, React.ReactNode> = {
  baptism: (
    <>
      Once you have scheduled the baptism with Hayr Eremia, please fill out this form. The parish uses it for the
      church records and to prepare the Certificate of Baptism and Chrismation.
    </>
  ),
  marriage: (
    <>
      Once you have scheduled the wedding with Hayr Eremia, please fill out this form. The parish uses it for the
      church records and to prepare the Certificate of Marriage.
    </>
  ),
};

export default function IntakePage({ type }: Props) {
  const title = INTAKE_TITLES[type];
  const back = type === 'marriage' ? '/sacraments/marriage' : '/sacraments/baptism';
  return (
    <AppLayout>
      <HeadElement pageTitle={`${title} — St. Mary Armenian Apostolic Church`} noIndex />
      <header className='worship-header-bg px-primary h-[205px] md:h-[255px] flex flex-col items-center justify-center text-center gap-3 text-white'>
        <p className='font-cursive text-secondary text-2xl'>Sacramental Records</p>
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>{title}</h1>
      </header>
      <section className='px-4 sm:px-primary py-10'>
        <div className='max-w-3xl mx-auto space-y-6'>
          <p className='text-gray-700 leading-relaxed'>
            {INTRO[type]} Names should be spelled exactly as they should appear on the certificate. If you know how
            a name is spelled in Armenian, you can add it too. Fields marked <span className='text-secondary'>*</span>{' '}
            are required.
          </p>
          <IntakeForm type={type} />
          <p className='text-sm text-gray-600'>
            Questions? Call the parish office at 949.650.8367 or{' '}
            <Link href='/contact' className='text-primary underline'>
              contact us
            </Link>
            .{' '}
            <Link href={back} className='text-primary underline'>
              Back to {type === 'marriage' ? 'Holy Matrimony' : 'Holy Baptism'}
            </Link>
          </p>
        </div>
      </section>
    </AppLayout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: [{ params: { type: 'baptism' } }, { params: { type: 'marriage' } }],
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => ({
  props: { type: params?.type === 'marriage' ? 'marriage' : 'baptism' },
});
