import AppLayout from '@/components/layout/AppLayout';
import Button from '@/common/Button';
import Link from 'next/link';
import React from 'react';

const ministries = [
  {
    name: 'Hovsepian Choir',
    description:
      'The St. Mary Hovsepian Choir leads the congregation in the sacred hymns of the Badarak each Sunday. Named in honor of Archbishop Vatche Hovsepian, founding Primate of the Western Diocese, the choir continues a rich tradition of Armenian liturgical music.',
  },
  {
    name: 'ACYO (Armenian Church Youth Organization)',
    description:
      'The ACYO is the youth arm of the Western Diocese, engaging teens and young adults in faith, fellowship, sports, and service. St. Mary ACYO has been an active part of parish life since Fr. Moushegh established it in 1992.',
  },
  {
    name: 'Ladies Society',
    description:
      'The St. Mary Ladies Society is a cornerstone of parish life. Their mission is to study and propagate the teachings of the Armenian Apostolic Church, cultivate Christian virtues, and support the parish through events, charitable work, and beautification of the church. Annual events include the Armenian Christmas Banquet, Mother\'s Day Luncheon, April 24th Walkathon, and the Church Food Festival.',
  },
  {
    name: 'Men\'s Fellowship',
    description:
      'The men of St. Mary support parish life through service, fellowship, and stewardship. Contact the parish office to learn how to get involved.',
  },
];

const youthPrograms = [
  {
    name: 'Sunday School',
    description:
      'St. Mary Sunday School offers faith formation for children and youth during the Sunday Badarak season. Students learn the tenets of the Armenian Apostolic faith, Armenian Church history, and the Nicene Creed. A nursery class is available for 3–4 year olds. Contact: sundayschool@stmaryarmenianchurch.com',
  },
  {
    name: 'Zvartnots Youth Choir & Dance Ensemble',
    description:
      'Founded in 1997, Zvartnots is a beloved youth program that nurtures Armenian cultural identity through choir singing and traditional folk dance. The ensemble performs at the church festival and community events throughout the year.',
  },
  {
    name: 'AGBU Saturday Armenian School',
    description:
      'The AGBU Saturday Armenian School meets at St. Mary Church and offers instruction in the Armenian language (Eastern and Western dialects), history, religion, music, and arts and crafts. Classes run from 10:00 AM to 1:00 PM. Contact: 714-898-9053.',
  },
  {
    name: 'Hye Camp & Diocesan Retreats',
    description:
      'St. Mary youth participate in the Western Diocese\'s annual Hye Camp and other retreats, building friendships and deepening their faith in a camp setting.',
  },
];

const organizations = [
  {
    name: 'Parish Assembly',
    description:
      'The governing body of voting parish members, meeting annually to review the parish budget, elect council members, and vote on major decisions.',
  },
  {
    name: 'St. Mary Trust Fund',
    description:
      'Established in 2000, the Trust Fund is responsible for the financial stability and long-term investment of parish assets, reporting to the Parish Assembly.',
  },
  {
    name: 'Cultural Committee',
    description:
      'Promotes Armenian culture through lectures, musical programs, art exhibitions, and a book fair at the annual Food Festival. Contact through the church office.',
  },
  {
    name: 'Mommy & Me',
    description:
      'A program for young mothers and their toddlers to connect in a church atmosphere, with outings and monthly gatherings throughout the year.',
  },
  {
    name: 'Mr. & Mrs. Club',
    description:
      'A social and fellowship group for young married couples, offering retreats, dinners, and seasonal events to help families connect with parish life.',
  },
];

export default function ParishLife() {
  return (
    <AppLayout>
      <header className='about-header-bg px-primary h-[205px] md:h-[305px] flex flex-col items-center justify-center text-center gap-3 text-white'>
        <p className='font-cursive text-secondary text-2xl'>Community &amp; Ministry</p>
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>
          Parish Life
        </h1>
        <p className='font-normal text-lg'>There is a place here for you.</p>
      </header>

      {/* Ministries */}
      <section id='ministries' className='px-primary py-16 bg-white'>
        <div className='max-w-4xl mx-auto'>
          <p className='text-secondary font-cursive text-2xl mb-2'>Serving Together</p>
          <h2 className='text-primary font-secondary font-bold text-3xl mb-8'>Ministries</h2>
          <div className='space-y-6'>
            {ministries.map((m) => (
              <div key={m.name} className='bg-[#FFF5F2] rounded-2xl p-6'>
                <h3 className='font-secondary font-bold text-primary text-lg mb-2'>{m.name}</h3>
                <p className='text-gray-700 leading-relaxed'>{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Youth Programs */}
      <section id='youth' className='px-primary py-16 bg-[#FFF5F2]'>
        <div className='max-w-4xl mx-auto'>
          <p className='text-secondary font-cursive text-2xl mb-2'>Raising the Next Generation</p>
          <h2 className='text-primary font-secondary font-bold text-3xl mb-8'>Youth Programs</h2>
          <div className='space-y-6'>
            {youthPrograms.map((p) => (
              <div key={p.name} className='bg-white rounded-2xl p-6 shadow-sm'>
                <h3 className='font-secondary font-bold text-primary text-lg mb-2'>{p.name}</h3>
                <p className='text-gray-700 leading-relaxed'>{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Parish Organizations */}
      <section id='organizations' className='px-primary py-16 bg-white'>
        <div className='max-w-4xl mx-auto'>
          <p className='text-secondary font-cursive text-2xl mb-2'>Our Community</p>
          <h2 className='text-primary font-secondary font-bold text-3xl mb-8'>Parish Organizations</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {organizations.map((o) => (
              <div key={o.name} className='bg-[#FFF5F2] rounded-2xl p-6'>
                <h3 className='font-secondary font-bold text-primary text-lg mb-2'>{o.name}</h3>
                <p className='text-gray-700 text-sm leading-relaxed'>{o.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Get Involved CTA */}
      <section className='px-primary py-16 bg-primary text-white text-center'>
        <h2 className='font-secondary font-bold text-3xl mb-4'>Get Involved</h2>
        <p className='text-gray-200 max-w-xl mx-auto mb-8'>
          Whether you&apos;re a lifelong parishioner or visiting for the first time, there&apos;s a ministry,
          program, or organization that needs your gifts and your presence.
        </p>
        <Link href='/contact'>
          <Button className='!w-[230px] !bg-secondary !border-secondary hover:!brightness-90'>
            Contact Us to Get Started
          </Button>
        </Link>
      </section>
    </AppLayout>
  );
}
