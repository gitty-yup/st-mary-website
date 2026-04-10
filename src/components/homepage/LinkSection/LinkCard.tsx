import React from 'react';
import { LinkType } from './links';
import styles from './styles.module.css';
import Button from '@/common/Button';
import Link from 'next/link';

function LinkCard({ link }: { link: LinkType }) {
  return (
    <div className={'h-[661px] w-full relative ' + styles.img}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={'w-full h-full object-cover'} alt='' src={link.image} loading='lazy' />
      <div className='absolute lg:bottom-[26px] bottom-[52px]  left-1/2 -translate-x-1/2 text-white z-10'>
        <div className='flex flex-col lg:gap-[35px] items-center gap-5'>
          <span className='text-[28px] text-white lg:text-[40px] font-bold'>
            {link.label}
          </span>
          <Link href={link.href}>
            <Button className='!min-w-[150px] lg:!min-w-[230px] h-[40px] lg:!min-h-[60px]'>
              {link.buttonLabel}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LinkCard;
