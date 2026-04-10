import AppLayout from '@/components/layout/AppLayout';
import Button from '@/common/Button';
import Link from 'next/link';
import React from 'react';
import { GetServerSideProps } from 'next';

const ICS_URL =
  'https://calendar.google.com/calendar/ical/9fc5d5aa1fb010d8d6bf5418e567cccb49a4219671af6250e57088f3452af9c4%40group.calendar.google.com/private-5e7d03e75f60dfe8f51dbe6a021c3cb3/basic.ics';

function parseICS(text: string): CalEvent[] {
  // Unfold lines: ICS wraps long lines with \r\n followed by a space/tab
  const unfolded = text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  const events: CalEvent[] = [];
  const blocks = unfolded.split('BEGIN:VEVENT');
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const get = (key: string) => {
      const m = block.match(new RegExp(`${key}[^:]*:([^\r\n]+)`));
      return m ? m[1].trim() : '';
    };
    const rawStart = get('DTSTART');
    const rawEnd = get('DTEND');
    const allDay = !rawStart.includes('T');
    const parseDate = (s: string) => {
      if (!s) return null;
      if (s.includes('T')) {
        // e.g. 20260419T100000Z or 20260419T100000
        return new Date(
          `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}${s.endsWith('Z') ? 'Z' : ''}`
        );
      }
      // all-day: 20260419
      return new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T12:00:00`);
    };
    const start = parseDate(rawStart);
    if (!start) continue;
    const summary = get('SUMMARY').replace(/\\,/g, ',').replace(/\\n/g, ' ');
    const description = get('DESCRIPTION').replace(/\\,/g, ',').replace(/\\n/g, '\n').trim();
    const location = get('LOCATION').replace(/\\,/g, ',').trim();
    events.push({
      title: summary || 'Untitled Event',
      start: start.toISOString(),
      end: parseDate(rawEnd)?.toISOString() ?? null,
      allDay,
      location,
      description,
    });
  }
  return events;
}

interface CalEvent {
  title: string;
  start: string;
  end: string | null;
  allDay: boolean;
  location: string;
  description: string;
}

const annualEvents: { name: string; month: string; description: React.ReactNode }[] = [
  {
    name: 'St. Mary Armenian Food Festival',
    month: 'October 10–11',
    description: (
      <>
        Our beloved annual festival celebrates Armenian food, music, dance, and culture. Thousands of guests enjoy shish
        kebab, lahmajoun, baklava, live music, folk dancing, and more. Admission: $3.{' '}
        <a href='https://www.stmaryarmenianfestival.com' target='_blank' rel='noreferrer' className='text-secondary underline'>
          Visit the festival website
        </a>
        .
      </>
    ),
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

function formatDate(isoStart: string, isoEnd: string | null, allDay: boolean): string {
  const start = new Date(isoStart);
  const dateStr = start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  if (allDay) return dateStr;
  const timeStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (isoEnd) {
    const end = new Date(isoEnd);
    const endTimeStr = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${dateStr} · ${timeStr} – ${endTimeStr}`;
  }
  return `${dateStr} · ${timeStr}`;
}

export default function Events({ upcomingEvents }: { upcomingEvents: CalEvent[] }) {
  return (
    <AppLayout>
      <header className='event-header-bg px-primary h-[205px] md:h-[305px] flex flex-col items-center justify-center text-center gap-3 text-white'>
        <p className='font-cursive text-secondary text-2xl'>Join Our Community</p>
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>
          Events &amp; Calendar
        </h1>
      </header>

      {/* Upcoming Events from Google Calendar */}
      <section className='px-primary py-16 bg-white'>
        <div className='max-w-4xl mx-auto'>
          <p className='text-secondary font-cursive text-2xl mb-2'>What&apos;s Coming Up</p>
          <h2 className='text-primary font-secondary font-bold text-3xl mb-8'>Upcoming Events</h2>

          {upcomingEvents.length === 0 ? (
            <div className='bg-[#FFF2EE] rounded-2xl p-8 text-center text-gray-600'>
              No upcoming events at this time. Check back soon or follow us on Facebook.
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {upcomingEvents.map((event, i) => (
                <div key={i} className='flex gap-4 bg-[#FFF5F2] rounded-2xl p-5 items-start'>
                  {/* Date block */}
                  <div className='flex-shrink-0 bg-primary text-white rounded-xl w-14 text-center py-2'>
                    <p className='text-xs uppercase tracking-wide'>
                      {new Date(event.start).toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                    <p className='text-2xl font-bold leading-none'>
                      {new Date(event.start).getDate()}
                    </p>
                  </div>
                  {/* Details */}
                  <div className='flex-1 min-w-0'>
                    <h3 className='font-secondary font-bold text-primary text-lg leading-tight mb-1'>
                      {event.title}
                    </h3>
                    <p className='text-secondary text-sm font-medium mb-1'>
                      {formatDate(event.start, event.end, event.allDay)}
                    </p>
                    {event.location && (
                      <p className='text-gray-500 text-sm'>📍 {event.location}</p>
                    )}
                    {event.description && (
                      <p className='text-gray-600 text-sm mt-2 leading-relaxed whitespace-pre-line'>{event.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Parish Calendar Note */}
      <section className='px-primary py-16 bg-[#FFF5F2]'>
        <div className='max-w-4xl mx-auto'>
          <div className='bg-white rounded-2xl p-8 text-center'>
            <h2 className='text-primary font-secondary font-bold text-2xl mb-3'>Stay Connected</h2>
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
        </div>
      </section>

      {/* Annual Events */}
      <section className='px-primary py-16 bg-white'>
        <div className='max-w-4xl mx-auto'>
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
        <div className='flex flex-wrap gap-4 justify-center'>
          <Link href='/gallery'>
            <Button className='!w-[220px]'>View Gallery</Button>
          </Link>
          <a
            href='https://m.facebook.com/profile.php?id=100064722127342'
            target='_blank'
            rel='noreferrer'
          >
            <Button className='!w-[220px] !bg-transparent !text-primary !border-primary !border-2 hover:!bg-primary hover:!text-white'>
              View on Facebook
            </Button>
          </a>
        </div>
      </section>
    </AppLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const res = await fetch(ICS_URL, { headers: { 'User-Agent': 'StMaryWebsite/1.0' } });
    const text = await res.text();
    const now = new Date();
    const sixMonthsOut = new Date();
    sixMonthsOut.setMonth(sixMonthsOut.getMonth() + 6);

    const upcomingEvents = parseICS(text)
      .filter((e) => new Date(e.start) >= now && new Date(e.start) <= sixMonthsOut)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return { props: { upcomingEvents } };
  } catch {
    return { props: { upcomingEvents: [] } };
  }
};
