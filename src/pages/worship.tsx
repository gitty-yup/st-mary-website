import AppLayout from '@/components/layout/AppLayout';
import Button from '@/common/Button';
import Link from 'next/link';
import React from 'react';

const sacraments = [
  {
    name: 'Baptism',
    description:
      'The sacrament of initiation into the Body of Christ. Infants and adults are welcomed into the Armenian Apostolic Church through Holy Baptism.',
  },
  {
    name: 'Chrismation',
    description:
      'Immediately following Baptism, the newly baptized is anointed with the Holy Myron (chrism), receiving the gift of the Holy Spirit.',
  },
  {
    name: 'Holy Communion',
    description:
      'The Eucharist is the central act of Christian worship. Communion is offered to baptized and chrismated members of the Armenian Apostolic Church.',
  },
  {
    name: 'Confession',
    description:
      'The sacrament of reconciliation, restoring the faithful to a right relationship with God. Available before Sunday Badarak.',
  },
  {
    name: 'Marriage',
    description:
      'The holy union of a man and woman in Christ. Our parish is happy to assist couples wishing to be married in the Armenian Apostolic tradition.',
  },
  {
    name: 'Ordination',
    description:
      'The setting apart of clergy for sacred ministry. Several of our parish deacons and acolytes have been ordained at St. Mary.',
  },
  {
    name: 'Prayer for the Sick / Last Rites',
    description:
      'The Church ministers to the sick and dying through prayer, anointing, and the sacraments. Contact the parish office to arrange a pastoral visit.',
  },
];

export default function Worship() {
  return (
    <AppLayout>
      {/* Header */}
      <header className='worship-header-bg px-primary h-[205px] md:h-[305px] flex flex-col items-center justify-center text-center gap-3 text-white'>
        <p className='font-cursive text-secondary text-2xl'>Come and Pray with Us</p>
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>
          Worship at St. Mary
        </h1>
      </header>

      {/* Divine Liturgy */}
      <section id='schedule' className='px-primary py-16 bg-white'>
        <div className='max-w-4xl mx-auto'>
          <p className='text-secondary font-cursive text-2xl mb-2'>The Heart of Our Faith</p>
          <h2 className='text-primary font-secondary font-bold text-3xl mb-6'>
            Divine Liturgy (Badarak)
          </h2>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10'>
            <div>
              <p className='text-gray-700 leading-relaxed mb-4'>
                The Armenian word for the Divine Liturgy is <strong>Badarak</strong> — meaning
                &ldquo;offering&rdquo; or &ldquo;sacrifice.&rdquo; It is one of the most ancient Christian
                liturgies in the world, dating to the 5th century. Every Sunday, our community gathers to
                offer our prayers, our hearts, and our lives to God.
              </p>
              <p className='text-gray-700 leading-relaxed mb-4'>
                The Badarak is celebrated in both Classical Armenian (Grabar) and English, so all may
                participate fully. A bilingual bulletin is provided. Holy Communion is offered to baptized
                and chrismated members of the Armenian Apostolic Church.
              </p>
              <p className='text-gray-700 leading-relaxed'>
                A Fellowship Hour follows each Sunday Liturgy — all are warmly invited to stay and share
                in our parish family.
              </p>
            </div>
            <div className='bg-[#FFF2EE] rounded-2xl p-8'>
              <h3 className='font-secondary font-bold text-primary text-xl mb-4'>Service Schedule</h3>
              <div className='space-y-4'>
                <div className='border-l-4 border-secondary pl-4'>
                  <p className='font-semibold text-primary'>Morning Service</p>
                  <p className='text-gray-600'>Every Sunday at 10:00 AM</p>
                </div>
                <div className='border-l-4 border-secondary pl-4'>
                  <p className='font-semibold text-primary'>Soorp Badarak</p>
                  <p className='text-gray-600'>Every Sunday at 10:30 AM</p>
                </div>
                <div className='border-l-4 border-secondary pl-4'>
                  <p className='font-semibold text-primary'>Feast Days &amp; Holy Week</p>
                  <p className='text-gray-600'>Special services throughout the year — see our Events calendar</p>
                </div>
                <div className='border-l-4 border-secondary pl-4'>
                  <p className='font-semibold text-primary'>Location</p>
                  <p className='text-gray-600'>148 22nd Street, Costa Mesa, CA 92627</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sacraments */}
      <section className='px-primary py-16 bg-[#FFF5F2]'>
        <div className='max-w-4xl mx-auto'>
          <p className='text-secondary font-cursive text-2xl mb-2'>The Sacred Mysteries</p>
          <h2 className='text-primary font-secondary font-bold text-3xl mb-8'>The Sacraments</h2>
          <p className='text-gray-700 mb-10 leading-relaxed'>
            The Armenian Apostolic Church recognizes seven sacraments (mysteries) through which God
            imparts His grace to the faithful. Contact the parish office to schedule any sacrament.
          </p>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {sacraments.map((s) => (
              <div key={s.name} className='bg-white rounded-2xl p-6 shadow-sm'>
                <h3 className='font-secondary font-bold text-primary text-lg mb-2'>{s.name}</h3>
                <p className='text-gray-600 text-sm leading-relaxed'>{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Liturgical Calendar */}
      <section className='px-primary py-16 bg-white'>
        <div className='max-w-4xl mx-auto'>
          <p className='text-secondary font-cursive text-2xl mb-2'>The Sacred Year</p>
          <h2 className='text-primary font-secondary font-bold text-3xl mb-8'>Liturgical Calendar</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {[
              { season: 'Great Lent', desc: 'A period of prayer, fasting, and repentance preceding Holy Week.', icon: '🕯️' },
              { season: 'Holy Week', desc: 'Palm Sunday, Holy Thursday, Good Friday, and Holy Saturday services leading to Easter.', icon: '✝️' },
              { season: 'Feast Days', desc: 'Celebrating the Nativity, Epiphany, Transfiguration, Assumption of Holy Mother of God, and more.', icon: '🌟' },
              { season: 'Fasting Periods', desc: 'The Armenian Church observes several fasting periods throughout the year as spiritual disciplines.', icon: '🙏' },
            ].map((item) => (
              <div key={item.season} className='bg-[#FFF2EE] rounded-2xl p-6 text-center'>
                <div className='text-3xl mb-3'>{item.icon}</div>
                <h3 className='font-secondary font-bold text-primary text-lg mb-2'>{item.season}</h3>
                <p className='text-gray-600 text-sm leading-relaxed'>{item.desc}</p>
              </div>
            ))}
          </div>
          <div className='text-center mt-10'>
            <Link href='/events'>
              <Button className='!w-[250px]'>View Events Calendar</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Plan Your Visit */}
      <section className='px-primary py-16 bg-[#FFF5F2]'>
        <div className='max-w-4xl mx-auto'>
          <p className='text-secondary font-cursive text-2xl mb-2'>First Time Visiting?</p>
          <h2 className='text-primary font-secondary font-bold text-3xl mb-8'>Plan Your Visit</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {[
              { q: 'What should I expect?', a: 'A reverent, joyful liturgy sung in Armenian and English. Services last approximately 90 minutes, followed by a warm fellowship hour.' },
              { q: 'Where do I park?', a: 'Ample parking is available on-site and along E. 22nd Street. Our new parking lot is adjacent to the church.' },
              { q: 'What should I wear?', a: 'Modest, respectful attire is appreciated. There is no strict dress code — come as you are.' },
              { q: 'Is the service in Armenian?', a: 'The Badarak is celebrated in Classical Armenian (Grabar) and English. Bilingual bulletins are available.' },
              { q: 'Are children welcome?', a: 'Absolutely. Children are a blessing to our parish family. Sunday School runs during the Liturgy season.' },
              { q: 'What happens after the service?', a: 'A fellowship hour (coffee hour) follows every Sunday Badarak. Everyone is invited to stay and connect.' },
            ].map((item) => (
              <div key={item.q} className='bg-white rounded-2xl p-6 shadow-sm'>
                <h3 className='font-secondary font-semibold text-primary text-base mb-2'>{item.q}</h3>
                <p className='text-gray-600 text-sm leading-relaxed'>{item.a}</p>
              </div>
            ))}
          </div>
          <div className='text-center mt-10'>
            <Link href='/contact'>
              <Button className='!w-[250px]'>Contact Us</Button>
            </Link>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
