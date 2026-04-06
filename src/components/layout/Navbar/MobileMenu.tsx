import { useState, useRef, useEffect } from 'react';
import ClickAwayListener from 'react-click-away-listener';
import MenuIcon from '@/assets/svgs/layout/menu.svg';
import autoAnimate from '@formkit/auto-animate';
import Image from 'next/image';
import links from './links';
import Link from 'next/link';

function MobileMenu() {
  const [open, setOpen] = useState(false);
  const parentRef = useRef(null);

  useEffect(() => {
    if (parentRef.current) {
      autoAnimate(parentRef.current);
    }
  }, [parentRef]);

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <div className='relative' ref={parentRef}>
        <button onClick={() => setOpen(true)} className='flex items-center relative'>
          <Image src={MenuIcon} alt='Menu' />
        </button>
        {open && (
          <nav
            className='rounded absolute right-0 top-14 bg-white w-48 z-30'
            style={{ boxShadow: '12px 12px 24px rgba(0, 0, 0, 0.1)' }}
          >
            <ul className='flex flex-col'>
              {links.map((item) => (
                <Link href={item.destination} key={item.destination} onClick={() => setOpen(false)}>
                  <li className='px-5 py-3 hover:bg-primary hover:text-white text-sm'>
                    {item.title}
                  </li>
                </Link>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </ClickAwayListener>
  );
}

export default MobileMenu;
