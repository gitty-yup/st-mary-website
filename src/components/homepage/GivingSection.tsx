import Button from '@/common/Button';
import Link from 'next/link';
import React from 'react';

const GivingSection = () => {
  return (
    <section className='px-primary py-16 bg-primary text-white text-center'>
      <p className='font-cursive text-secondary text-2xl mb-2'>Support Our Mission</p>
      <h2 className='font-secondary font-bold text-3xl lg:text-4xl mb-6'>
        Give to St. Mary
      </h2>
      <p className='text-gray-200 max-w-2xl mx-auto mb-10 leading-relaxed'>
        Your generosity sustains the spiritual, cultural, and charitable mission of our parish.
        Give through Tithe.ly, Venmo, Zelle, or by mail. Every gift &mdash; large or small &mdash;
        is a blessing to our community.
      </p>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-10'>
        <div className='bg-white/10 rounded-xl p-6'>
          <p className='font-secondary font-semibold text-lg mb-2'>Stewardship</p>
          <p className='text-sm text-gray-300'>Set up recurring giving to support all parish ministries.</p>
        </div>
        <div className='bg-white/10 rounded-xl p-6'>
          <p className='font-secondary font-semibold text-lg mb-2'>Angel Fund</p>
          <p className='text-sm text-gray-300'>Charitable outreach helping those in need in our community.</p>
        </div>
        <div className='bg-white/10 rounded-xl p-6'>
          <p className='font-secondary font-semibold text-lg mb-2'>Memorial Gifts</p>
          <p className='text-sm text-gray-300'>Honor a loved one with a meaningful donation to the parish.</p>
        </div>
      </div>
      <Link href='/give'>
        <Button className='!w-[250px] !bg-secondary !border-secondary hover:!brightness-90'>
          Give Online
        </Button>
      </Link>
    </section>
  );
};

export default GivingSection;
