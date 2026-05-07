import Button from '@/common/Button';
import Link from 'next/link';
import React from 'react';

interface Ministry {
  name: string;
  description: string;
  icon: string;
  href?: string;
}

const ministries: Ministry[] = [
  {
    name: 'Hovsepian Choir',
    description: 'Our adult choir leads the congregation in Armenian liturgical music during Sunday Badarak.',
    icon: '🎶',
  },
  {
    name: 'ACYO',
    description: 'The Armenian Church Youth Organization engages teens and young adults through faith and fellowship.',
    icon: '✝️',
    href: '/organizations/acyo',
  },
  {
    name: 'Ladies Society',
    description: 'A cornerstone of parish life — organizing events, supporting charitable causes, and beautifying our church.',
    icon: '🌸',
  },
  {
    name: 'Sunday School',
    description: 'Faith formation for children in a nurturing, Armenian-language-inclusive environment.',
    icon: '📖',
  },
  {
    name: 'Cultural and Entertainment Committees',
    description: 'The Cultural and Entertainment Committees bring Armenian culture to life through lectures, musical programs, art exhibitions, and fun social gatherings like Fishermen\'s Night and our annual New Year\'s Eve party!',
    icon: '🇦🇲💃',
  },
  {
    name: 'Saturday Armenian School',
    description: 'AGBU Saturday School offering Armenian language, history, and cultural education.',
    icon: '🏫',
  },
];

const ParishLifeHighlights = () => {
  return (
    <section className='px-primary py-16 bg-[#FFF5F2]'>
      <div className='text-center mb-12'>
        <p className='text-secondary font-cursive text-2xl mb-2'>Get Involved</p>
        <h2 className='text-primary font-secondary font-bold text-3xl lg:text-4xl'>
          Parish Life &amp; Ministries
        </h2>
        <p className='text-gray-600 mt-4 max-w-2xl mx-auto'>
          St. Mary is a vibrant community with organizations for all ages. There is a place here for you.
        </p>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {ministries.map((m) => {
          const card = (
            <div className={`bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow h-full ${m.href ? 'cursor-pointer' : ''}`}>
              <div className='text-3xl mb-3'>{m.icon}</div>
              <h3 className='font-secondary font-bold text-primary text-lg mb-2'>{m.name}</h3>
              <p className='text-gray-600 text-sm leading-relaxed'>{m.description}</p>
              {m.href && <p className='text-secondary text-sm mt-3 font-semibold'>Learn more →</p>}
            </div>
          );
          return m.href ? (
            <Link key={m.name} href={m.href}>
              {card}
            </Link>
          ) : (
            <div key={m.name}>{card}</div>
          );
        })}
      </div>
      <div className='text-center mt-10'>
        <Link href='/parish-life'>
          <Button className='!w-[250px]'>Explore Parish Life</Button>
        </Link>
      </div>
    </section>
  );
};

export default ParishLifeHighlights;
