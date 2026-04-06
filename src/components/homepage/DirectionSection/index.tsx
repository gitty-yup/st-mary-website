import Button from '@/common/Button';
import TextChange from '@/common/TextChange';
import Link from 'next/link';
import React from 'react';
import { serviceTimelines } from './data';

const DirectionSection = () => {
  return (
    <section
      id='direction'
      className='direction-bg px-primary py-[120px] flex items-center justify-center flex-col text-white text-center'
    >
      <TextChange texts={serviceTimelines} time={10} />
      <p className='text-lg lg:text-xl font-normal mb-[34px] max-w-[752px] mt-[46px]'>
        St. Mary Armenian Apostolic Church is a community of faith rooted in the ancient traditions
        of the Armenian Apostolic Church. We welcome all who seek to worship, connect, and grow together.
      </p>
      <div className='flex gap-4 flex-wrap justify-center'>
        <Link href='/worship'>
          <Button className='!w-[230px] !max-w-full'>Plan Your Visit</Button>
        </Link>
        <Link href='/contact'>
          <Button className='!w-[230px] !max-w-full !bg-transparent !border-white !border-2 hover:!bg-white hover:!text-primary'>
            Get Directions
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default DirectionSection;
