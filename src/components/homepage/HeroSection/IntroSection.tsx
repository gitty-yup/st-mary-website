import Button from '@/common/Button';
import Link from 'next/link';
import React from 'react';

function IntroSection() {
  return (
    <div className='pr-primary pl-primary flex flex-col justify-center p-5 h-full lg:flex:[45%] text-center lg:text-left mb-[94px] lg:mb-0'>
      <p className='text-secondary font-cursive text-2xl mb-2'>Welcome to</p>
      <h1 className='text-primary text-2xl lg:text-[35px] max-w-[547px]'>
        <span className='font-secondary font-bold lg:text-[50px] text-[36px]'>
          St. Mary Armenian<br />Apostolic Church
        </span>
      </h1>
      <p className='text-primary font-secondary text-lg mt-1 mb-2'>Costa Mesa, California</p>
      <p className='lg:text-xl text-base font-normal mt-[7px] mb-[18px] lg:mb-[59px] text-gray-600 max-w-[480px]'>
        &ldquo;Come, let us tell of the LORD&apos;s Greatness; let us exalt his name together.&rdquo;
        <span className='block text-sm mt-1 text-gray-400'>— Psalm 34:3</span>
      </p>
      <div className='flex items-center flex-wrap lg:gap-6 gap-[22px] justify-center lg:justify-start'>
        <Link href='/worship'>
          <Button className='lg:!h-[60px] lg:!w-[230px] h-[45px] lg:!text-lg !font-semibold'>
            Plan Your Visit
          </Button>
        </Link>
        <Link href='/worship#schedule'>
          <Button className='lg:!h-[60px] h-[45px] lg:!w-[230px] lg:!text-lg !font-semibold !bg-transparent !text-primary !border-primary !border-2 hover:!bg-primary hover:!text-white'>
            Liturgy Schedule
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default IntroSection;
