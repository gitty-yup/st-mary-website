import AppLayout from '@/components/layout/AppLayout';
import Button from '@/common/Button';
import Link from 'next/link';
import React from 'react';

export default function VartavarPage() {
  return (
    <AppLayout>
      <header className='worship-header-bg px-primary h-[205px] md:h-[305px] flex flex-col items-center justify-center text-center gap-3 text-white'>
        <p className='font-cursive text-secondary text-2xl'>Feast of the Transfiguration</p>
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>
          Vartavar
        </h1>
        <p className='font-normal text-lg max-w-2xl'>
          Վարդավառ — The Festival of Water &amp; Light
        </p>
      </header>

      {/* Intro */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto text-gray-700 leading-relaxed space-y-4'>
          <p>
            <strong>Vartavar</strong> (also spelled Vardavar in Eastern Armenian; Armenian: <strong>Վարդավառ</strong>)
            is one of Armenia&apos;s most beloved and joyful summer holidays — famously known as
            the &ldquo;Festival of Water,&rdquo; the day when people of all ages playfully drench
            each other in celebration. It is a feast that holds both ancient roots and deep
            Christian meaning, observed in the Armenian Apostolic Church as the{' '}
            <strong>Feast of the Transfiguration of the Lord</strong> — one of the major feasts of
            the liturgical year.
          </p>
        </div>
      </section>

      {/* Origins and History */}
      <section className='px-primary py-12 bg-[#FFF5F2]'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            Origins and History
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              Vartavar dates back to pre-Christian pagan times in Armenia. It was traditionally
              associated with <strong>Astghik</strong>, the goddess of water, beauty, love, and
              fertility. In these ancient celebrations, people honored her by offering roses —
              the Armenian word <em>vard</em> means &ldquo;rose&rdquo; — sprinkling rosewater,
              and performing water rituals to invoke blessings for fertility, good harvests, and
              renewal. The second part of the name, <em>var</em>, can relate to
              &ldquo;burning&rdquo; or &ldquo;flaming,&rdquo; evoking the brilliance of roses or
              the summer heat and harvest season.
            </p>
            <p>
              Some traditions also link Vartavar to the story of Noah and the Great Flood: after
              the waters receded and Noah&apos;s family found safety on Mount Ararat, he instructed
              his descendants to sprinkle water on each other in remembrance, and to release doves
              as a sign of peace and new beginning.
            </p>
            <p>
              When Armenia became the first nation to adopt Christianity as its state religion in
              301 AD, the Church transformed many pre-existing customs rather than erasing them.
              Vartavar was reinterpreted and aligned with the Feast of the Transfiguration — the
              water element coming to symbolize purification, renewal, and the Holy Spirit; the
              roses, once offered to Astghik, becoming associated with the radiant light and beauty
              of Christ&apos;s transfigured form.
            </p>
          </div>
        </div>
      </section>

      {/* The Feast of the Transfiguration */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            The Feast of the Transfiguration
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              At the heart of Vartavar is the commemoration of one of the most luminous moments in
              the Gospels — the Transfiguration of Christ on Mount Tabor, when Jesus revealed His
              divine glory to His closest disciples:
            </p>
            <blockquote className='border-l-4 border-secondary pl-5 italic text-gray-600'>
              &ldquo;After six days Jesus took with him Peter, James and John the brother of James,
              and led them up a high mountain by themselves. There he was transfigured before them.
              His face shone like the sun, and his clothes became as white as the light. Just then
              there appeared before them Moses and Elijah, talking with Jesus… a bright cloud
              covered them, and a voice from the cloud said, &lsquo;This is my Son, whom I love;
              with him I am well pleased. Listen to him!&rsquo;&rdquo;
              <footer className='mt-2 not-italic text-sm text-gray-500'>Matthew 17:1–5</footer>
            </blockquote>
            <p>
              This revelation of Christ&apos;s divine nature — His face shining like the sun, His
              garments blazing white — is what the water, the light, and the joy of Vartavar
              ultimately point toward. The feast invites the faithful to behold Christ not only as
              teacher and healer but as the eternal Son of God, radiant in glory.
            </p>
          </div>
        </div>
      </section>

      {/* When It Is Celebrated */}
      <section className='px-primary py-12 bg-[#FFF5F2]'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            When It Is Celebrated
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              Vartavar is a <strong>movable feast</strong>, observed{' '}
              <strong>98 days (14 weeks) after Easter Sunday</strong> in the Armenian Apostolic
              Church calendar. It typically falls between late June and early August, at the height
              of summer.
            </p>
            <div className='bg-white rounded-xl p-5 border-l-4 border-secondary'>
              <p className='font-secondary font-bold text-primary mb-1'>2026</p>
              <p>
                Easter falls on April 5, 2026 — placing Vartavar on{' '}
                <strong>Sunday, July 12, 2026</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Traditions and Celebrations */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            Traditions and Celebrations
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              The hallmark of Vartavar is the <strong>playful water fight</strong> that engulfs
              communities across Armenia and the diaspora. People of all ages — friends, family,
              strangers — splash, spray, and pour buckets of water on each other. Getting soaked is
              entirely the point, and no one takes offense. In Yerevan, crowds gather at fountains,
              parks, and the iconic Swan Lake for massive water battles.
            </p>
            <p>Other cherished customs include:</p>
            <ul className='list-disc pl-5 space-y-3'>
              <li>
                <strong>Roses and flowers</strong> — Decorating homes and churches with roses,
                echoing the ancient offerings to Astghik and the radiant beauty of the
                Transfiguration.
              </li>
              <li>
                <strong>Releasing doves</strong> — Symbolizing peace, the Holy Spirit, and
                Noah&apos;s dove sent out from the ark after the Flood.
              </li>
              <li>
                <strong>Church services</strong> — Special Divine Liturgies, blessings of grapes
                and new fruits, and processions marking the feast in the liturgical calendar.
              </li>
              <li>
                <strong>Pilgrimages and regional celebrations</strong> — Visits to holy sites,
                particularly those associated with St. John the Baptist, with local healing and
                purification rituals that vary by region.
              </li>
            </ul>
            <p>
              Among diaspora communities around the world, the water-splashing tradition continues
              in parishes, schools, and community gatherings — keeping the feast alive far from
              the Armenian homeland.
            </p>
          </div>
        </div>
      </section>

      {/* Cultural Significance */}
      <section className='px-primary py-12 bg-[#FFF5F2]'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            Cultural Significance
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              Vartavar is more than a water fight. It embodies themes of joy, renewal, community,
              love, and spiritual transformation. Recognized on Armenia&apos;s intangible cultural
              heritage list, it has preserved Armenian identity across centuries of history —
              through conquest, diaspora, and survival.
            </p>
            <p>
              For the faithful of St. Mary Armenian Apostolic Church, Vartavar is a vibrant
              opportunity to celebrate Christ&apos;s Transfiguration while embracing the lively
              traditions that connect us to our ancestors. In the heat of summer, it brings people
              together in laughter and shared delight — a reminder that joy, too, is a form of
              worship.
            </p>
            <blockquote className='border-l-4 border-secondary pl-5 italic text-gray-600'>
              &ldquo;His face shone like the sun.&rdquo; — Matthew 17:2
            </blockquote>
            <p>
              May your Vartavar be filled with blessings, joy, and plenty of water.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className='px-primary py-12 bg-primary text-white text-center'>
        <h2 className='font-secondary font-bold text-2xl mb-4'>
          Celebrate with us at St. Mary
        </h2>
        <p className='text-gray-200 max-w-xl mx-auto mb-6'>
          Join us for the Divine Liturgy on Sunday, July 12 as we observe the Feast of the
          Transfiguration together.
        </p>
        <div className='flex gap-3 justify-center flex-wrap'>
          <Link href='/contact'>
            <Button className='!w-[200px] !bg-secondary !border-secondary hover:!brightness-90'>
              Contact Us
            </Button>
          </Link>
          <Link href='/worship'>
            <Button className='!w-[200px] !bg-transparent !border-white !border-2 hover:!bg-white hover:!text-primary'>
              Worship at St. Mary
            </Button>
          </Link>
        </div>
      </section>
    </AppLayout>
  );
}
