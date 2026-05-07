import OrganizationPage from '@/components/OrganizationPage';
import React from 'react';

const officers = [
  { role: 'Chairman', name: 'Talia Saharyildizi' },
  { role: 'Vice-Chairman', name: 'Diana Karapetyan' },
  { role: 'Treasurer', name: 'Roubeena Akmakjian' },
  { role: 'Recording Secretary', name: 'Ellen Shahinyan' },
  { role: 'Publicist Director', name: 'Terra Saharyildizi' },
  { role: 'Corresponding Secretary', name: 'Ani Karapetyan' },
  { role: 'Advisor', name: 'Sergey Khachatryan' },
  { role: 'Youth Director', name: 'Alen Ashikian' },
];

export default function AcyoPage() {
  return (
    <OrganizationPage
      name='ACYO'
      fullName='Armenian Church Youth Organization'
      tagline='Love One Another. — John 15:17'
      headerBgClass='acyo-header-bg'
      sections={[
        {
          title: 'About Our Chapter',
          content: (
            <>
              <p>
                Our ACYO chapter at St. Mary&apos;s brings together youth ages 12 and up. We host events
                once or twice a month for our youth and the church community. Our purpose is to bring our
                youth closer to Jesus Christ and the Armenian Apostolic faith, while helping them feel a
                sense of belonging in a community where they can express their faith and form lasting
                friendships.
              </p>
              <p>
                Our theme is <strong>John 15:17 — &ldquo;Love one another.&rdquo;</strong>{' '}
                <em>«&nbsp;Սիրեցէ՛ք միմեանց&nbsp;» — Յովհաննէս 15:17</em>. We chose this theme to remind
                our youth to love one another as Christ taught us. Love is the foundation of a strong,
                supportive community; it brings friends and family together and encourages us to be
                compassionate and kind toward one another. By living out this message, our youth grow
                closer to Christ while building a loving and united ACYO family.
              </p>
            </>
          ),
        },
        {
          title: 'Our Mission',
          content: (
            <p className='italic'>
              The Armenian Church Youth Organization actively integrates its members into the life of the
              church by providing opportunities for worship, service, education, and fellowship in Christ,
              in accordance with the doctrines and traditions of the Armenian Apostolic Church.
            </p>
          ),
        },
        {
          title: 'Officers & Leadership',
          content: (
            <ul className='space-y-1'>
              {officers.map((o) => (
                <li key={o.role}>
                  <strong>{o.role}:</strong> {o.name}
                </li>
              ))}
            </ul>
          ),
        },
        {
          title: 'Weekly Bible Study & Prayer Service',
          content: (
            <>
              <p>
                Every <strong>Wednesday night</strong>, we host Bible Studies and{' '}
                <em>Zhamerkutyun</em> (prayer service) at the church, led by Sargavak Emin Matevosyan.
              </p>
              <ul className='list-disc list-inside space-y-1'>
                <li>7:30 PM — Gather at the church</li>
                <li>8:00 PM — Bible study discussion</li>
                <li>9:30 PM — Zhamerkutyun (prayer service)</li>
              </ul>
            </>
          ),
        },
        {
          title: 'Events & Activities',
          content: (
            <>
              <p>Our chapter hosts a variety of events throughout the year, including:</p>
              <ul className='list-disc list-inside space-y-1'>
                <li>Movie nights</li>
                <li>Morning and sunset hikes</li>
                <li>Lock-in sleepovers at the church</li>
                <li>Sports Weekend practices</li>
                <li>Fundraisers and potlucks</li>
                <li>Beach bonfires</li>
                <li>Our annual ACYO beach party</li>
              </ul>
            </>
          ),
        },
        {
          title: 'Diocesan Involvement',
          content: (
            <>
              <p>
                St. Mary ACYO is part of the{' '}
                <a
                  href='https://acyowd.com/about-us'
                  target='_blank'
                  rel='noreferrer'
                  className='text-secondary underline'
                >
                  Armenian Church Youth Organization of the Western Diocese (ACYO-WD)
                </a>
                , the youth ministry of the Armenian Apostolic Church serving North America. ACYO-WD was
                established in September 1946 in Fresno, California, and integrates its members into
                church life through four pillars: <strong>Worship, Service, Education, and Fellowship.</strong>
              </p>
              <p>Our chapter participates in ACYO-WD events such as:</p>
              <ul className='list-disc list-inside space-y-1'>
                <li>Sports Weekends</li>
                <li>Fall and Spring Retreats</li>
                <li>ACYO Convention</li>
                <li>Srpazan&apos;s Christmas Fellowship</li>
                <li>
                  <a
                    href='https://www.hyecamp.com/'
                    target='_blank'
                    rel='noreferrer'
                    className='text-secondary underline'
                  >
                    Hye Camp
                  </a>{' '}
                  every summer
                </li>
              </ul>
            </>
          ),
        },
        {
          title: 'Stay Connected',
          content: (
            <p>
              Our ACYO has a large WhatsApp group — please be sure to download the WhatsApp app to receive
              updates on meetings, events, and more!
            </p>
          ),
        },
      ]}
      contact={{
        email: 'st.mary.cm.acyo@gmail.com',
        phone: '(949) 826-4429',
        whatsapp: 'https://ACYOchat.whatsapp.com/',
        signupForm: 'https://forms.gle/e3Rrmz4nmSmRKu268',
      }}
      social={{
        facebook: 'https://www.facebook.com/profile.php?id=61579187077066',
        instagram: 'https://www.instagram.com/st.mary.cm.acyo',
      }}
    />
  );
}
