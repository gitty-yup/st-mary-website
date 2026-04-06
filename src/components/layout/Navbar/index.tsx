import React from 'react';
import NavLinks from './NavLinks';
import Link from 'next/link';
import MobileMenu from './MobileMenu';

function Navbar() {
  return (
    <nav className='pl-primary pr-primary h-24 bg-white shadow-sm'>
      <div className='flex justify-between items-center h-full'>
        <Link href='/' className='flex flex-col'>
          <span className='font-secondary font-bold text-primary text-xl leading-tight'>St. Mary</span>
          <span className='font-secondary text-sm text-secondary leading-tight'>Armenian Apostolic Church</span>
        </Link>
        <div className='hidden lg:block'>
          <NavLinks />
        </div>
        <div className='lg:hidden block'>
          <MobileMenu />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
