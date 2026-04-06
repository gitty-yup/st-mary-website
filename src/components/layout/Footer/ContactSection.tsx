import Image from 'next/image';
import React from 'react';
import contactInfo from './contactInfo';

function ContactSection() {
  return (
    <div className='flex flex-col text-white'>
      <p className='font-secondary font-semibold text-lg mb-4'>Contact</p>
      <ul className='flex flex-col gap-4'>
        {contactInfo.map((info) => (
          <li key={info.text} className='flex gap-4 text-sm'>
            <Image src={info.icon} alt={info.alt} />
            {info.type === 'email' && (
              <a target='_blank' href={'mailto:' + info.text} rel='noreferrer'>
                {info.text}
              </a>
            )}
            {info.type === 'phone' && (
              <a target='_blank' href={'tel:' + info.text} rel='noreferrer'>
                {info.text}
              </a>
            )}
            {!info.type && <span>{info.text}</span>}
          </li>
        ))}
      </ul>
      <div className='mt-8'>
        <p className='text-sm text-gray-400'>Office Hours</p>
        <p className='text-sm mt-1'>Mon–Fri: 9:00 AM – 5:00 PM</p>
      </div>
    </div>
  );
}

export default ContactSection;
