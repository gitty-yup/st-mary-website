import React from 'react';

const timelines: { title: string; time: string }[] = [
  {
    title: 'Sunday Badarak (Divine Liturgy)',
    time: 'Every Sunday at 10:30 AM',
  },
  {
    title: 'Armenian Apostolic Faith Since 1985',
    time: '148 E. 22nd Street, Costa Mesa, CA 92627',
  },
  {
    title: 'All Are Welcome',
    time: 'Fellowship hour follows every service',
  },
];

export const serviceTimelines = timelines.map((timeline) => (
  <div key={timeline.title} className='h-[calc(8rem)] overflow-y-hidden'>
    <h2 className='text-[26px] md:text-[36px] lg:text-[46px] mb-[19px] font-normal font-secondary leading-tight'>
      {timeline.title}
    </h2>
    <p className='font-secondary text-lg md:text-xl lg:text-[26px] leading-4'>
      {timeline.time}
    </p>
  </div>
));
