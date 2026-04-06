import Button from '@/common/Button';
import Link from 'next/link';
import React from 'react';

const WelcomeSection = () => {
  return (
    <section id='welcome' className='px-primary py-16 bg-white'>
      <div className='lg:grid lg:grid-cols-2 items-center gap-12 flex flex-col'>
        <div className='flex flex-col items-center lg:items-start text-center lg:text-left'>
          <p className='text-secondary font-cursive text-2xl mb-2'>A Message from Our Pastor</p>
          <h2 className='text-primary lg:text-4xl text-[26px] font-secondary font-semibold mb-6'>
            Welcome to St. Mary Armenian Apostolic Church
          </h2>
          <p className='font-normal mb-4 text-gray-700 leading-relaxed'>
            On behalf of our parish family, it is my joy to welcome you to St. Mary Armenian
            Apostolic Church in Costa Mesa. Whether you are Armenian by heritage or simply
            drawn to the ancient beauty of the Armenian Apostolic faith, you will find a warm
            and prayerful home here.
          </p>
          <p className='font-normal mb-6 text-gray-700 leading-relaxed'>
            Our doors are open to all who seek God&apos;s presence. Join us for Sunday Badarak
            at 10:30 AM and experience the rich liturgical tradition of one of the oldest
            Christian churches in the world.
          </p>
          <p className='font-bold text-primary mb-8'>
            — Very Rev. Fr. Eremia Abgaryan, Parish Priest
          </p>
          <Link href='/about'>
            <Button className='!w-[230px]'>More About Us</Button>
          </Link>
        </div>
        <div className='bg-[#FFF2EE] rounded-2xl p-8 flex flex-col gap-4'>
          <h3 className='font-secondary font-bold text-primary text-xl mb-2'>Service Times</h3>
          <div className='border-l-4 border-secondary pl-4'>
            <p className='font-semibold text-primary'>Sunday Badarak (Divine Liturgy)</p>
            <p className='text-gray-600'>Every Sunday at 10:30 AM</p>
          </div>
          <div className='border-l-4 border-secondary pl-4'>
            <p className='font-semibold text-primary'>Confession</p>
            <p className='text-gray-600'>Available before Badarak &mdash; contact the church to arrange</p>
          </div>
          <div className='border-l-4 border-secondary pl-4'>
            <p className='font-semibold text-primary'>Feast Days & Seasonal Services</p>
            <p className='text-gray-600'>See our events calendar for special observances</p>
          </div>
          <Link href='/worship' className='mt-2'>
            <Button className='!w-full !bg-transparent !text-primary !border-primary !border-2 hover:!bg-primary hover:!text-white'>
              Full Worship Guide
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default WelcomeSection;
