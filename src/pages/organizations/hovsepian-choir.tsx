import OrganizationPage from '@/components/OrganizationPage';
import React from 'react';

const officers = [
  { role: 'Chairman', name: 'Hirant Rakijian' },
  { role: 'Vice Chairman', name: 'Dr. Arshavir Andonian' },
  { role: 'Recording Secretary', name: 'Hirant Rakijian' },
  { role: 'Assistant Secretary', name: 'Nazeli Saharyildizi' },
  { role: 'Treasurer', name: 'Tamar Nahapetian' },
  { role: 'Assistant Treasurer', name: 'Talia Saharyildizi' },
];

const advisors = [
  'Vahan Cetinelian',
  'Karine Galustyan',
  'Elisa Guirgis',
  'Arsen Guleseryan',
  'Avedis Gulezian',
  'Talar Mastro',
  'Terra Saharyildizi',
  'Vartuhi Torikian',
  'Annie Vas',
];

export default function HovsepianChoirPage() {
  return (
    <OrganizationPage
      name='Hovsepian Choir'
      tagline='Sacred music of the Armenian Apostolic Church since 1992'
      sections={[
        {
          title: 'About Our Choir',
          content: (
            <>
              <p>
                Founded in <strong>1992</strong>, the Hovsepian Choir leads our congregation in the
                sacred music of the Armenian Apostolic Church. Our purpose is to teach, rehearse, and
                perform the hymns and melodies of the Divine Liturgy — including those specific to
                Sundays, vigils, Holy Tabernacles, Holy Weeks, and Resurrection Sundays — in
                accordance with the Armenian Apostolic Church liturgical calendar.
              </p>
              <p>
                We are always eager to welcome new voices. If you have a love for sacred music and a
                desire to serve through song, we invite you to join us.
              </p>
            </>
          ),
        },
        {
          title: 'Our Mission',
          content: (
            <p className='italic'>
              Rehearse like you perform during services.
            </p>
          ),
        },
        {
          title: 'Officers & Leadership',
          content: (
            <>
              <ul className='space-y-1'>
                {officers.map((o, idx) => (
                  <li key={`${o.role}-${idx}`}>
                    <strong>{o.role}:</strong> {o.name}
                  </li>
                ))}
              </ul>
              <p className='mt-4'>
                <strong>Advisors:</strong> {advisors.join(', ')}
              </p>
            </>
          ),
        },
        {
          title: 'Rehearsals & Services',
          content: (
            <>
              <p>
                The choir leads worship at every Sunday Badarak as well as at Tabernacle and Holy Week
                services throughout the liturgical year.
              </p>
              <p>We hold <strong>biweekly rehearsals</strong> to prepare the music for upcoming services.</p>
            </>
          ),
        },
        {
          title: 'Events & Activities',
          content: (
            <ul className='list-disc list-inside space-y-1'>
              <li>Sponsor one of the parish&apos;s annual Lenten Dinners each year</li>
              <li>Celebrate the combined Church and Choir anniversary together with the parish</li>
              <li>Provide annual activity and financial reports to the Parish Council</li>
            </ul>
          ),
        },
      ]}
    />
  );
}
