import AppLayout from '@/components/layout/AppLayout';
import Button from '@/common/Button';
import Link from 'next/link';
import React from 'react';

const annualEvents = [
  {
    name: 'St. Mary Armenian Food Festival',
    month: 'October',
    description:
      'Our beloved annual festival celebrates Armenian food, music, dance, and culture. Thousands of guests enjoy shish kebab, lahmajoun, baklava, live music, folk dancing, and more. Admission: $3.',
  },
  {
    name: 'Armenian Christmas (Surb Tznund)',
    month: 'January 6',
    description:
      'The Armenian Apostolic Church celebrates the Nativity and Baptism of Christ on January 6th. A solemn and joyful Badarak is followed by a parish banquet.',
  },
  {
    name: 'Easter (Surb Zatik)',
    month: 'Spring',
    description:
      'The Resurrection of Our Lord is the most sacred celebration of the Armenian Church. Holy Week services lead to the joyful Easter Badarak and parish fellowship.',
  },
  {
    name: 'Armenian Genocide Commemoration',
    month: 'April 24',
    description:
      'St. Mary commemorates the 1.5 million martyrs of the Armenian Genocide with a solemn service, Walkathon, and community program. Our Genocide Memorial Monument stands as a lasting tribute.',
  },
  {
    name: 'Grape & Madagh Blessing',
    month: 'August',
    description:
      'A beloved Armenian tradition — the Feast of the Assumption of the Holy Mother of God (Verapokhoum). Grapes are blessed, Madagh is prepared, and pilgrims join us for a day of worship and fellowship.',
  },
  {
    name: 'Diocesan Assemblies & ACYO Conventions',
    month: 'Various',
    description:
      'St. Mary has hosted multiple Western Diocese Assemblies and ACYO Conventions, welcoming Armenian faithful from across California.',
  },
];

export default function Events() {
  return (
    <AppLayout>
      <header className='event-header-bg px-primary h-[205px] md:h-[305px] flex flex-col items-center justify-center text-center gap-3 text-white'>
        <p className='font-cursive text-secondary text-2xl'>Join Our Community</p>
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>
          Events &amp; Calendar
        </h1>
      </header>

      {/* Parish Calendar Note */}
      <section className='px-primary py-16 bg-white'>
        <div className='max-w-4xl mx-auto'>
          <div className='bg-[#FFF2EE] rounded-2xl p-8 text-center mb-12'>
            <h2 className='text-primary font-secondary font-bold text-2xl mb-3'>Parish Calendar</h2>
            <p className='text-gray-700 max-w-xl mx-auto mb-6'>
              For the most current schedule of liturgical events, social gatherings, educational programs,
              and fundraisers, please contact the parish office or follow us on Facebook.
            </p>
            <div className='flex flex-wrap gap-4 justify-center'>
              <a
                href='https://m.facebook.com/profile.php?id=100064722127342'
                target='_blank'
                rel='noreferrer'
              >
                <Button className='!w-[200px]'>See Us on Facebook</Button>
              </a>
              <Link href='/contact'>
                <Button className='!w-[200px] !bg-transparent !text-primary !border-primary !border-2 hover:!bg-primary hover:!text-white'>
                  Contact the Office
                </Button>
              </Link>
            </div>
          </div>

          {/* Annual Events */}
          <p className='text-secondary font-cursive text-2xl mb-2'>Every Year</p>
          <h2 className='text-primary font-secondary font-bold text-3xl mb-8'>Annual Events</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {annualEvents.map((event) => (
              <div key={event.name} className='bg-[#FFF5F2] rounded-2xl p-6'>
                <div className='flex items-start justify-between mb-2'>
                  <h3 className='font-secondary font-bold text-primary text-lg leading-tight pr-4'>
                    {event.name}
                  </h3>
                  <span className='bg-secondary text-white text-xs px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0'>
                    {event.month}
                  </span>
                </div>
                <p className='text-gray-700 text-sm leading-relaxed'>{event.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Photo Gallery CTA */}
      <section className='px-primary py-16 bg-[#FFF5F2] text-center'>
        <h2 className='text-primary font-secondary font-bold text-3xl mb-4'>Photo Gallery</h2>
        <p className='text-gray-600 max-w-xl mx-auto mb-6'>
          Browse photos from past worship services, festivals, youth events, and community life at St. Mary.
        </p>
        <a
          href='https://m.facebook.com/profile.php?id=100064722127342'
          target='_blank'
          rel='noreferrer'
        >
          <Button className='!w-[220px]'>View on Facebook</Button>
        </a>
      </section>
    </AppLayout>
  );
}
