import AppLayout from '@/components/layout/AppLayout';
import Link from 'next/link';
import React from 'react';

export default function SentPage() {
  return (
    <AppLayout>
      <header className='worship-header-bg px-primary h-[205px] md:h-[265px] flex flex-col items-center justify-center text-center gap-3 text-white'>
        <p className='font-cursive text-secondary text-2xl'>Parish Records</p>
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>
          Check Your Email
        </h1>
      </header>

      <section className='px-primary py-16 bg-white'>
        <div className='max-w-lg mx-auto text-center'>
          <div className='text-5xl mb-6'>✉️</div>
          <p className='text-gray-700 leading-relaxed mb-4'>
            If your email address is in our parish records, you will receive a secure link
            within the next few minutes.
          </p>
          <p className='text-gray-500 text-sm mb-8'>
            The link expires in <strong>15 minutes</strong>. Check your spam folder if you
            don&apos;t see it.
          </p>
          <Link href='/' className='text-secondary font-semibold text-sm hover:underline'>
            ← Return to homepage
          </Link>
        </div>
      </section>
    </AppLayout>
  );
}
