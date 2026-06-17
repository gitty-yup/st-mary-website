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
          title: 'In Memoriam: Dn. Rupen Ozsogomonyan',
          content: (
            <>
              <p>
                The Hovsepian Choir owes much of its life and character to the late Deacon Rupen
                Ozsogomonyan, who served as Choir Master (Դպրապետ), director, and organist for over
                thirty years. A founding member of St. Mary Armenian Apostolic Church, Dn. Rupen
                offered his musical and liturgical gifts in service to the Holy Altar and to the
                sacred music of the Divine Liturgy with quiet dedication and deep reverence.
              </p>
              <p>
                Under his leadership, the choir participated in the regular worship life of the parish
                as well as in major liturgical milestones — including visitations of the Catholicos of
                All Armenians and the Patriarch of Constantinople, and the 25th Anniversary of the
                Consecration of St. Mary Church in 2017. He possessed a profound knowledge of the
                Armenian Church&apos;s liturgical life, having mastered not only the various forms of
                the Divine Liturgy but also the daily offices, the observances of the major feasts,
                and the sacramental rites that define our liturgical cycle.
              </p>
              <p>
                In recognition of his decades of dedicated and selfless service to the Armenian
                Church, Dn. Rupen was awarded the <strong>St. Nerses Shnorhali Medal in 2014</strong>{' '}
                — one of the highest honors bestowed by the Church upon those who have given
                exemplary service.
              </p>
              <p className='italic'>
                May the Lord grant him rest in the light of His eternal presence. Աստուած հոգին
                լուսաւորէ.
              </p>
            </>
          ),
        },
        {
          title: 'Our Organist: Ms. Angèle Nalbandian',
          content: (
            <>
              <p>
                The Hovsepian Choir is deeply grateful to have <strong>Ms. Angèle Nalbandian</strong>
                {' '}as our organist. Daughter of Armenian Apostolic priest Der Zenob Nalbandian,
                Angèle was raised within the rich liturgical and musical heritage of our Church, and
                she now offers those gifts in faithful service to our parish.
              </p>
              <p>
                Following the passing of Dn. Rupen, Angèle stepped graciously into a leadership role,
                guiding the choir with warmth, skill, and a steady devotion to the sacred music that
                shapes our worship. Her presence at the organ each Sunday is a blessing to the
                congregation and to all who lift their voices in song.
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
              <p>
                Rehearsals are held <strong>every other Thursday, 7:00–9:00 PM</strong>. The 2026
                schedule is as follows:
              </p>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm border-collapse'>
                  <tbody>
                    {[
                      ['January', 'Jan 1, 15, 29'],
                      ['February', 'Feb 12, 26'],
                      ['March', 'Mar 12, 26'],
                      ['April', 'Apr 9, 23'],
                      ['May', 'May 7, 21'],
                      ['June', 'Jun 4, 18'],
                      ['July', 'Jul 2, 16, 30'],
                      ['August', 'Aug 13, 27'],
                      ['September', 'Sep 10, 24'],
                      ['October', 'Oct 8, 22'],
                      ['November', 'Nov 5, 19'],
                      ['December', 'Dec 3, 17, 31'],
                    ].map(([month, dates], i) => (
                      <tr key={month} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className='py-1.5 px-3 font-semibold text-primary w-32'>{month}</td>
                        <td className='py-1.5 px-3 text-gray-600'>{dates}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className='text-sm text-gray-500 italic'>
                For changes or confirmation, please contact the choir director or check the church
                calendar.
              </p>
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
