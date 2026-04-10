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
      'Guided by the mission to bring young people to Christ through the teachings and rich traditions of the Armenian Apostolic Church, St. Mary ACYO welcomes youth (12+) to grow in faith, build lasting friendships, and develop strong Christian Armenian identities. Through worship, service projects, educational events, leadership opportunities, sports, social gatherings, and retreats, St. Mary\'s ACYO helps teens and young adults deepen their relationship with God, serve their Church and community, and become committed leaders ready to live out their faith both inside and outside the parish. All youth are warmly invited to join our vibrant, welcoming chapter!',
  },
  {
    name: 'Ladies Society',
    description:
      'The St. Mary Ladies Society is a cornerstone of parish life. Their mission is to study and propagate the teachings of the Armenian Apostolic Church, cultivate Christian virtues, and support the parish through events, charitable work, and beautification of the church. Annual events include the Armenian Christmas Banquet, Mother\'s Day Luncheon, April 24th Walkathon, and the Church Food Festival.',
  },
];

const youthPrograms: { name: string; description: React.ReactNode }[] = [
  {
    name: 'Sunday School',
    description: (
      <>
        <p className='font-semibold text-primary mb-2'>Discover Faith, Grow in Christ at St. Mary Sunday School!</p>
        <p className='mb-3'>
          Join us every Sunday at 11:00 AM in the Meghrouni Education Center for an engaging, faith-filled experience
          using the trusted <em>We Believe</em> curriculum from the{' '}
          <a href='https://www.cecwd.org/' target='_blank' rel='noreferrer' className='text-secondary underline'>
            Christian Education Council of the Western Diocese
          </a>
          . Children ages 5–15 will explore the life of Jesus Christ — from the Annunciation and His miraculous birth
          to His teachings and miracles. They will also learn Bible stories, the meaning of our feasts and sacraments,
          and the rich traditions of the Armenian Apostolic Church, while discovering who they are as beloved children
          of God, the importance of family and community, and how to live out their faith daily.
        </p>
        <p className='mb-3'>
          Through dynamic lessons, activities, crafts, and discussions, kids build a deeper relationship with Our Lord
          and Savior Jesus Christ while making friends and growing spiritually in a warm, welcoming environment. All
          children ages 5–15 are welcome — no matter their background!
        </p>
        <p className='font-semibold text-primary'>
          St. Mary Sunday School: Where faith comes alive every Sunday morning. See you there! 🙏
        </p>
      </>
    ),
  },
  {
    name: 'AGBU Saturday Armenian School',
    description:
      'The AGBU Saturday Armenian School meets at St. Mary Church and offers instruction in the Armenian language (Eastern and Western dialects), history, religion, music, and arts and crafts. Classes run from 10:00 AM to 1:00 PM. Contact: 714-898-9053.',
  },
  {
    name: 'Hye Camp & Diocesan Retreats',
    description: (
      <>
        St. Mary youth participate in the Western Diocese&apos;s annual{' '}
        <a href='https://www.hyecamp.com/' target='_blank' rel='noreferrer' className='text-secondary underline'>
          Hye Camp
        </a>{' '}
        and other retreats, building friendships and deepening their faith in a camp setting.
      </>
    ),
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
];

export default function ParishLife() {
  return (
    <AppLayout>
      <header className='parish-life-header-bg px-primary h-[205px] md:h-[305px] flex flex-col items-center justify-center text-center gap-3 text-white'>
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
