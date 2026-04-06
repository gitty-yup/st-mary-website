import Button from '@/common/Button';
import Link from 'next/link';
import React from 'react';

const FacilitiesPromo = () => {
  return (
    <section className='px-primary py-16 bg-white'>
      <div className='text-center mb-10'>
        <p className='text-secondary font-cursive text-2xl mb-2'>Host Your Next Event</p>
        <h2 className='text-primary font-secondary font-bold text-3xl lg:text-4xl'>
          Our Facilities
        </h2>
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <div className='bg-[#FFF2EE] rounded-2xl p-8'>
          <h3 className='font-secondary font-bold text-primary text-xl mb-3'>
            Stambolian Family Hall
          </h3>
          <p className='text-gray-600 mb-4 leading-relaxed'>
            Our beautiful main hall accommodates up to 300 guests and features a stage,
            dance floor, full kitchen, and ample parking. Ideal for weddings, banquets,
            receptions, and community gatherings.
          </p>
          <ul className='text-sm text-gray-500 space-y-1 mb-6'>
            <li>✓ Capacity: ~300 guests</li>
            <li>✓ Stage &amp; dance floor</li>
            <li>✓ Full catering kitchen</li>
            <li>✓ On-site parking</li>
          </ul>
          <Link href='/facilities'>
            <Button className='!w-full'>View Details</Button>
          </Link>
        </div>
        <div className='bg-[#EEF2FF] rounded-2xl p-8'>
          <h3 className='font-secondary font-bold text-primary text-xl mb-3'>
            Small Hall
          </h3>
          <p className='text-gray-600 mb-4 leading-relaxed'>
            Our intimate smaller hall is perfect for meetings, classes, smaller celebrations,
            and community events. A versatile space with all the essentials.
          </p>
          <ul className='text-sm text-gray-500 space-y-1 mb-6'>
            <li>✓ Ideal for meetings &amp; small events</li>
            <li>✓ Flexible setup options</li>
            <li>✓ Parishioner priority booking</li>
          </ul>
          <Link href='/facilities#rental-inquiry'>
            <Button className='!w-full !bg-primary'>Rental Inquiry</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FacilitiesPromo;
