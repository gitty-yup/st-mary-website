import AppLayout from '@/components/layout/AppLayout';
import Button from '@/common/Button';
import Link from 'next/link';
import React from 'react';

export default function About() {
  return (
    <AppLayout>
      {/* Page Header */}
      <header className='about-header-bg px-primary h-[205px] md:h-[305px] flex flex-col items-center justify-center text-center gap-3 text-white'>
        <p className='font-cursive text-secondary text-2xl'>Learn More</p>
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>
          About St. Mary Armenian Apostolic Church
        </h1>
        <p className='font-normal text-lg md:text-xl'>
          Serving Orange County since 1985
        </p>
      </header>

      {/* Our Parish History */}
      <section id='history' className='px-primary py-16 bg-white'>
        <div className='max-w-4xl mx-auto'>
          <p className='text-secondary font-cursive text-2xl mb-2'>Our Story</p>
          <h2 className='text-primary font-secondary font-bold text-3xl mb-8'>History of St. Mary</h2>

          <div className='text-gray-700 space-y-6 leading-relaxed'>
            <h3 className='text-primary font-secondary font-semibold text-xl'>Founding Years (1985–1989)</h3>
            <p>
              St. Mary Armenian Apostolic Church traces its beginning to April 1985, when His Eminence Archbishop
              Vatche Hovsepian, then Primate of the Western Diocese, celebrated the first Divine Liturgy for the
              Armenians of Orange County. This came in response to sustained appeals from community leaders,
              especially Mr. Antranik O. Zorayan. The Khatchadourian Choir sang, and more than five hundred
              faithful attended.
            </p>
            <p>
              Afterward, the Primate appointed the first Parish Council, which met at the home of Paul and Rose
              Hachigian; Mr. Hachigian was elected the first Parish Council Chairman. The parish was initially
              named the &ldquo;Armenian Apostolic Church of Newport Beach.&rdquo; In March 1989, the parish
              purchased the current property for over $1 million.
            </p>

            <h3 className='text-primary font-secondary font-semibold text-xl mt-8'>
              Consecration and Growth under Archpriest Fr. Moushegh Tashjian (1992–2020)
            </h3>
            <p>
              On June 13–14, 1992, the sanctuary was consecrated and officially named St. Mary Armenian Apostolic
              Church, with Mr. &amp; Mrs. Civan and Pina Kalfa serving as Godfathers. Fr. Moushegh Tashjian was
              appointed as St. Mary&apos;s first resident pastor and built enduring ministries including Sunday School,
              ACYO, the Zvartnots Youth Choir and Dance Ensemble, Mommy &amp; Me, and Mr. &amp; Mrs. Club.
            </p>
            <p>
              He guided major improvements: stained-glass icons of the saints, a traditional Armenian belltower
              with cupola (1997), and the beautification of the sanctuary. He promoted pilgrimages and organized
              large cultural events. For nearly three decades, Fr. Moushegh shepherded St. Mary with love,
              humility, and vision. He retired in January 2020, leaving a thriving parish and a lasting legacy.
            </p>

            <h3 className='text-primary font-secondary font-semibold text-xl mt-8'>Campus Redevelopment (2021–2023)</h3>
            <p>
              With land assembled and plans finalized, the parish carried out a three-phase redevelopment led by
              the Building Committee chaired by Mark Asdourian and built by parishioner Wayne Simonian of Premier
              Construction:
            </p>
            <ul className='list-disc pl-6 space-y-2'>
              <li><strong>Phase 1 (2021–2022):</strong> New Educational Building and courtyard</li>
              <li><strong>Phase 2 (2022):</strong> New parking lot with hardscape and landscaping</li>
              <li><strong>Phase 3 (2022–2023):</strong> The Stambolian Family Hall — a modern assembly hall</li>
            </ul>
            <p>
              This redevelopment was made possible by the generous lead gifts of the Meghrouni, Bassenian, and
              Stamboulian families, along with the ongoing support of parishioners throughout the parish.
            </p>

            <h3 className='text-primary font-secondary font-semibold text-xl mt-8'>Looking Ahead</h3>
            <p>
              With new facilities, dedicated clergy under Very Rev. Fr. Eremia Abgaryan, and strong ministries,
              St. Mary Armenian Apostolic Church remains a beacon of faith in Orange County — carrying forward
              its mission to glorify God, preserve Armenian heritage, and serve generations yet to come.
            </p>
          </div>
        </div>
      </section>

      {/* Clergy */}
      <section id='clergy' className='px-primary py-16 bg-[#FFF5F2]'>
        <div className='max-w-4xl mx-auto'>
          <p className='text-secondary font-cursive text-2xl mb-2'>Meet Our Clergy</p>
          <h2 className='text-primary font-secondary font-bold text-3xl mb-10'>Clergy &amp; Leadership</h2>

          <div className='bg-white rounded-2xl p-8 mb-8 shadow-sm'>
            <h3 className='font-secondary font-bold text-primary text-xl mb-1'>
              Very Rev. Fr. Eremia Abgaryan
            </h3>
            <p className='text-secondary text-sm mb-4'>Vicar General of the Western Diocese · Parish Priest</p>
            <div className='text-gray-700 space-y-4 leading-relaxed'>
              <p>
                Very Rev. Fr. Eremia Abgaryan was born on April 20, 1984, in the village of Aghavnatun,
                Armavir Province, Armenia. After completing his secondary education and compulsory military
                service, he entered the Gevorgian Theological Seminary at the Mother See of Holy Etchmiadzin
                in 2004, earning his Bachelor of Arts degree in 2008 and his Master of Arts degree in 2010.
              </p>
              <p>
                On October 31, 2010, he was ordained a celibate priest by Bishop Mkrtich Proshyan, receiving
                the priestly name <strong>Eremia</strong> (Jeremiah). He served in the Church and State Relations
                Department of the Mother See&apos;s Chancellery, and in 2016 was invited to serve in the Western
                Diocese. In 2018, he successfully defended his doctoral thesis and was elevated to the rank of
                Archimandrite (Very Reverend).
              </p>
              <p>
                Fr. Eremia served as parish priest of Holy Trinity Armenian Apostolic Church in Sydney, Australia,
                before returning to the Western Diocese where he now serves as Vicar General and as the beloved
                Parish Priest of St. Mary since 2025. Under his pastoral leadership, the parish has experienced
                renewed energy through inspiring liturgies, meaningful youth programs, and a deepened sense of
                fellowship among parishioners.
              </p>
              <p>
                In addition to his parish responsibilities, Fr. Eremia has served as Diocesan Youth Director for
                the ACYO and frequently represents the Primate at interfaith gatherings, ordinations, and diocesan
                events. We are deeply grateful for his spiritual guidance and warmly welcome all to join our
                growing parish family.
              </p>
            </div>
          </div>

          <div id='council' className='bg-white rounded-2xl p-8 shadow-sm'>
            <h3 className='font-secondary font-bold text-primary text-xl mb-4'>Parish Council 2026</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              {[
                { name: 'Very Rev. Fr. Eremia Abgaryan', role: 'Parish Priest (President)' },
                { name: 'Mike Hollis', role: 'Chairman' },
                { name: 'Bedig Cemcem', role: 'Vice Chairman' },
                { name: 'Haig Altunian', role: 'Treasurer' },
                { name: 'Harutiun Kassakhian', role: 'Recording Secretary' },
                { name: 'Vera Kabaklian', role: 'Member' },
                { name: 'Talar Karatas', role: 'Member' },
                { name: 'Charlene Asdourian', role: 'Member' },
                { name: 'Armond Mehrabian', role: 'Member' },
                { name: 'Artak Karapetyan', role: 'Member' },
              ].map((member) => (
                <div key={member.name} className='flex justify-between py-2 border-b border-gray-100'>
                  <span className='font-medium text-gray-800'>{member.name}</span>
                  {member.role && <span className='text-secondary text-sm'>{member.role}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Diocese */}
      <section className='px-primary py-16 bg-white'>
        <div className='max-w-4xl mx-auto text-center'>
          <p className='text-secondary font-cursive text-2xl mb-2'>Our Church</p>
          <h2 className='text-primary font-secondary font-bold text-3xl mb-6'>The Western Diocese</h2>
          <p className='text-gray-700 max-w-2xl mx-auto mb-8 leading-relaxed'>
            St. Mary Armenian Apostolic Church is a parish of the Western Diocese of the Armenian Church
            of North America, under the jurisdiction of His Eminence Archbishop Hovnan Derderian, Primate.
            The Armenian Apostolic Church is one of the oldest Christian churches in the world, with its
            spiritual center at the Mother See of Holy Etchmiadzin in Armenia.
          </p>
          <a href='https://www.westerndiocese.org' target='_blank' rel='noreferrer'>
            <Button className='!w-[280px]'>Visit the Western Diocese</Button>
          </a>
        </div>
      </section>
    </AppLayout>
  );
}
