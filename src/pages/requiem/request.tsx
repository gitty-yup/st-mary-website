import Link from 'next/link';
import React from 'react';
import RequiemForm from '@/components/forms/RequiemForm';
import AppLayout from '@/components/layout/AppLayout';
import HeadElement from '@/components/layout/HeadElement';

export default function RequiemRequestPage() {
  return (
    <AppLayout>
      <HeadElement
        pageTitle='Request a Hokihankist (Requiem Service) — St. Mary Armenian Apostolic Church'
        description='Request a Hokihankist (Requiem Service) at St. Mary Armenian Apostolic Church in Costa Mesa, offered on Sundays and Merelots days at the conclusion of the Divine Liturgy.'
      />
      <header className='worship-header-bg px-primary h-[205px] md:h-[255px] flex flex-col items-center justify-center text-center gap-3 text-white'>
        <p className='font-cursive text-secondary text-2xl'>Faith &amp; Traditions</p>
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>Request a Hokihankist</h1>
        <p className='font-normal text-lg'>Requiem Service</p>
      </header>
      <section className='px-4 sm:px-primary py-10 bg-[#FFF5F2]'>
        <div className='max-w-3xl mx-auto space-y-6'>
          <p className='text-gray-700 leading-relaxed'>
            Hokihankist is offered on Sundays and on Merelots days at the conclusion of the Divine Liturgy (Soorp
            Badarak). Please send your request at least one day before the service. Fields marked <span className='text-secondary'>*</span> are
            required.
          </p>
          <RequiemForm />
          <p className='text-sm text-gray-600'>
            Questions? Call the parish office at 949.650.8367 or{' '}
            <Link href='/contact' className='text-primary underline'>
              contact us
            </Link>
            .{' '}
            <Link href='/requiem' className='text-primary underline'>
              About Hokihankist
            </Link>
          </p>
        </div>
      </section>
    </AppLayout>
  );
}
