import AppLayout from '@/components/layout/AppLayout';
import HeadElement from '@/components/layout/HeadElement';
import Button from '@/common/Button';
import Link from 'next/link';
import React from 'react';

/** Armenian words, marked so screen readers and translators know the language. */
function Hy({ children }: { children: React.ReactNode }) {
  return <span lang='hy'>{children}</span>;
}

function Section({ id, title, shaded, children }: { id?: string; title: string; shaded?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className={`px-primary py-12 ${shaded ? 'bg-[#FFF5F2]' : 'bg-white'}`}>
      <div className='max-w-3xl mx-auto'>
        <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>{title}</h2>
        <div className='text-gray-700 leading-relaxed space-y-4'>{children}</div>
      </div>
    </section>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <h3 className='font-secondary font-bold text-primary text-lg pt-2'>{children}</h3>;
}

function Quote({ children, source }: { children: React.ReactNode; source: string }) {
  return (
    <blockquote className='border-l-4 border-secondary pl-5 italic text-gray-600'>
      &ldquo;{children}&rdquo;
      <footer className='mt-2 not-italic text-sm text-gray-500'>{source}</footer>
    </blockquote>
  );
}

const ON_THIS_PAGE: [string, string][] = [
  ['why', 'Why we pray for the departed'],
  ['when', 'When it is observed'],
  ['service', 'The service'],
  ['feasts', 'The five major feast days'],
  ['merelots', 'Merelots'],
  ['customs', 'Customs'],
  ['request', 'Requesting a Hokihankist'],
];

export default function RequiemPage() {
  return (
    <AppLayout>
      <HeadElement
        pageTitle='Hokihankist (Requiem Service) — St. Mary Armenian Apostolic Church'
        description='Hokihankist, the Requiem Service of the Armenian Apostolic Church: why we pray for the departed, when it is observed, and how to request one at St. Mary in Costa Mesa.'
      />
      <header className='worship-header-bg px-primary h-[205px] md:h-[305px] flex flex-col items-center justify-center text-center gap-3 text-white'>
        <p className='font-cursive text-secondary text-2xl'>Prayers for the Departed</p>
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>
          Hokihankist <Hy>(Հոգեհանգիստ)</Hy>
        </h1>
        <p className='font-normal text-lg max-w-2xl'>The Requiem Service in the Armenian Apostolic Church</p>
      </header>

      {/* Intro */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto text-gray-700 leading-relaxed space-y-4'>
          <p className='italic text-gray-600'>Remembering our departed loved ones through faith, prayer, and the hope of eternal life.</p>
          <p>
            One of the most sacred and enduring traditions of the Armenian Apostolic Church is the{' '}
            <strong>
              Hokihankist (<Hy>Հոգեհանգիստ</Hy>)
            </strong>
            , also known as the Requiem Service or the Service for the Repose of Souls. Through this prayerful
            service, we remember our departed loved ones, petition God for the forgiveness of their sins and the
            repose of their souls, and reaffirm our faith in the Resurrection of Jesus Christ and the promise of
            eternal life.
          </p>
          <p>
            The Armenian word <em>Hokihankist</em> is derived from two words:
          </p>
          <ul className='list-disc pl-6 space-y-1'>
            <li>
              <strong>
                <Hy>Հոգի</Hy> (Hoki)
              </strong>{' '}
              – Soul or spirit
            </li>
            <li>
              <strong>
                <Hy>Հանգիստ</Hy> (Hankist)
              </strong>{' '}
              – Rest, peace, or repose
            </li>
          </ul>
          <p>
            Together, they express our prayer that the souls of the departed may find eternal rest and peace in the
            presence of our Heavenly Father.
          </p>
          <nav aria-label='On this page' className='bg-[#FFF5F2] rounded-xl p-5'>
            <p className='font-semibold text-primary mb-2'>On this page</p>
            <ul className='grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm'>
              {ON_THIS_PAGE.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`} className='text-secondary hover:underline'>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      <Section id='why' title='Why Do We Pray for the Departed?' shaded>
        <p>
          The Armenian Apostolic Church teaches that death is not the end of our existence, nor does it sever our
          spiritual relationship with those who have departed this earthly life. Through the death and Resurrection
          of Jesus Christ, we have been given the hope of resurrection and everlasting life.
        </p>
        <p>Our Lord Jesus Christ declares:</p>
        <Quote source='John 11:25'>I am the resurrection and the life. He who believes in Me, though he may die, he shall live.</Quote>
        <p>
          The Church understands the faithful, both living and departed, to be united in the Body of Christ. Just as
          we pray for one another during our earthly lives, we continue to pray for those who have fallen asleep in
          the Lord.
        </p>
        <p>St. Paul reminds us:</p>
        <Quote source='Romans 14:8'>
          For if we live, we live to the Lord; and if we die, we die to the Lord. Therefore, whether we live or die,
          we are the Lord&rsquo;s.
        </Quote>
        <p>
          The practice of praying for the departed also has roots in the Old Testament. In 2 Maccabees 12:43–46,
          prayers and offerings are made on behalf of the deceased in anticipation of the resurrection of the dead.
        </p>
        <p>
          Through Hokihankist, we entrust our departed loved ones to God&apos;s infinite mercy, asking Him to forgive
          their transgressions, grant them peace, and number them among the righteous.
        </p>
        <p>
          These prayers are not merely acts of remembrance. They are acts of Christian love and expressions of our
          continuing spiritual bond with those who have gone before us.
        </p>
      </Section>

      <Section id='when' title='When Is Hokihankist Observed?'>
        <p>The Armenian Apostolic Church has established several traditional occasions for remembering the departed.</p>
        <Sub>
          The Seventh Day – Yotnorek (<Hy>Եօթնօրէք</Hy>)
        </Sub>
        <p>
          Traditionally, a memorial prayer service is conducted on the seventh day following burial, often at the
          gravesite. It is an occasion for family members to gather in prayer during the early days of mourning.
        </p>
        <Sub>
          The Fortieth Day – Karasoonk (<Hy>Քառասունք</Hy>)
        </Sub>
        <p>The fortieth-day memorial is among the most significant observances following the death of a loved one.</p>
        <p>The number forty carries profound spiritual significance throughout Holy Scripture:</p>
        <ul className='list-disc pl-6 space-y-1'>
          <li>Moses spent forty days on Mount Sinai.</li>
          <li>The Israelites journeyed through the wilderness for forty years.</li>
          <li>Jesus Christ fasted for forty days in the wilderness.</li>
          <li>Following His Resurrection, Christ appeared to His disciples over a period of forty days before His Ascension.</li>
        </ul>
        <p>
          In the Armenian Church, the forty-day period also marks the traditional conclusion of the initial period
          of mourning. Family members gather to participate in the Divine Liturgy and offer prayers for the repose of
          their loved one&apos;s soul.
        </p>
        <p>
          The fortieth-day observance does not mark the end of grief or remembrance. Rather, it provides an
          opportunity for the bereaved to find consolation through prayer, faith, and the fellowship of the Church.
        </p>
        <Sub>
          The First Anniversary – Darelits (<Hy>Տարելից</Hy>)
        </Sub>
        <p>
          The first anniversary is another important occasion for prayer and remembrance. Family members
          traditionally request a Hokihankist service to commemorate their loved one and renew their prayers for the
          repose of his or her soul.
        </p>
        <Sub>Subsequent Anniversaries and Other Occasions</Sub>
        <p>
          Hokihankist may be requested on subsequent anniversaries, birthdays of departed loved ones, or other
          meaningful occasions throughout the year.
        </p>
        <p>
          There is no expiration to our prayers for the departed. Families are encouraged to continue remembering
          their loved ones through prayer, participation in the Divine Liturgy, and acts of Christian charity.
        </p>
      </Section>

      <Section id='service' title='The Hokihankist Service' shaded>
        <p>
          In most Armenian parishes, the Hokihankist service takes place toward the conclusion of the Sunday Divine
          Liturgy, known as the Holy Badarak (<Hy>Սուրբ Պատարագ</Hy>).
        </p>
        <p>
          The priest, assisted by the deacons and choir, offers special hymns and prayers for the departed. The names
          of those being commemorated are read aloud as the congregation joins together in prayer.
        </p>
        <p>During the service, the Church petitions God to:</p>
        <ul className='list-disc pl-6 space-y-1'>
          <li>Forgive the sins and transgressions of the departed.</li>
          <li>Grant their souls rest and eternal peace.</li>
          <li>Receive them among the righteous.</li>
          <li>Grant comfort and consolation to those who mourn.</li>
          <li>Strengthen our faith in the resurrection and eternal life.</li>
        </ul>
        <p>
          The service is solemn but not without hope. Its prayers reflect the fundamental Christian belief that Christ
          has conquered death and that those who have fallen asleep in Him await the resurrection.
        </p>
        <p>
          Families requesting Hokihankist are encouraged to attend the entire Divine Liturgy, rather than arriving
          solely for the Requiem Service. The Holy Badarak is central to the spiritual life of the Armenian Church,
          and our participation in it is itself a meaningful expression of prayer for our departed loved ones.
        </p>
      </Section>

      <Section id='feasts' title='The Five Major Feast Days'>
        <p>
          In accordance with the liturgical tradition of the Armenian Apostolic Church, Hokihankist services are not
          conducted on the five major Tabernacle Feast Days, known as <em>Daghavar Doner</em> (<Hy>Տաղաւար Տօներ</Hy>).
        </p>
        <p>These are:</p>
        <ol className='list-decimal pl-6 space-y-1'>
          <li>
            <strong>The Feast of the Nativity and Theophany of Jesus Christ</strong> – Armenian Christmas
          </li>
          <li>
            <strong>The Feast of the Glorious Resurrection of Jesus Christ</strong> – Easter, or Zadig
          </li>
          <li>
            <strong>The Feast of the Transfiguration of Jesus Christ</strong> – Vartavar
          </li>
          <li>
            <strong>The Feast of the Assumption of the Holy Mother of God</strong> – Asdvadzadzin
          </li>
          <li>
            <strong>The Feast of the Exaltation of the Holy Cross</strong> – Khatchverats
          </li>
        </ol>
        <p>These feast days are dedicated to the joyful celebration of central events in the life of Christ and the Church.</p>
        <p>
          Instead, the Armenian Church traditionally sets aside the day following each of these major feasts for the
          remembrance of the departed.
        </p>
      </Section>

      <Section id='merelots' title='Merelots – Remembrance of the Departed' shaded>
        <p>
          Merelots (<Hy>Մեռելոց</Hy>) is a special memorial day in the Armenian Church observed following each of the
          five major Tabernacle Feasts.
        </p>
        <p>
          On these occasions, the faithful gather for the celebration of the Divine Liturgy and prayers for all
          departed souls. Many families also visit cemeteries, where priests may offer blessings and memorial prayers
          at the graves of their loved ones.
        </p>
        <p>
          The observance of Merelots serves as a reminder that the joy of our Christian faith and the hope of eternal
          life extend beyond our earthly existence.
        </p>
      </Section>

      <Section id='customs' title='Customs Associated with Hokihankist'>
        <p>Over the centuries, several meaningful Armenian Christian customs have developed around the remembrance of the departed.</p>
        <Sub>
          Hokejash (<Hy>Հոգեճաշ</Hy>) – The Memorial Meal
        </Sub>
        <p>Following a funeral or memorial service, families often gather for a memorial meal known as <em>Hokejash</em>.</p>
        <p>
          This tradition has its roots in the Christian practice of feeding the poor and providing for those in need
          in memory of the departed. Today, it also provides an opportunity for relatives and friends to gather in
          fellowship, share memories, and offer comfort to one another.
        </p>
        <p>While the gathering is a meaningful tradition, it does not replace the prayers and worship of the Church.</p>
        <Sub>
          Madagh (<Hy>Մատաղ</Hy>) – An Offering of Charity
        </Sub>
        <p>
          Families may also make an offering of <em>Madagh</em> in memory of a departed loved one. Traditionally, this
          involves the blessing and distribution of food as an act of thanksgiving, mercy, and charity.
        </p>
        <p>
          The spiritual significance of Madagh is found in the act of giving and sharing with others, particularly
          those in need.
        </p>
        <Sub>Memorial Donations and Acts of Charity</Sub>
        <p>
          Making a donation to the Church, supporting charitable organizations, assisting those in need, or
          performing other acts of kindness in memory of a loved one are meaningful ways to honor the departed.
        </p>
        <p>
          Such offerings are expressions of Christian stewardship and love. They are not a payment for prayers or a
          means of purchasing God&apos;s forgiveness or salvation.
        </p>
        <Sub>Lighting Candles and Visiting Gravesites</Sub>
        <p>
          Lighting candles, visiting the graves of departed loved ones, and offering personal prayers are also
          cherished expressions of Armenian Christian devotion.
        </p>
        <p>
          Families may arrange for a priest to conduct memorial prayers at a gravesite, in addition to the Hokihankist
          offered in church.
        </p>
        <p>These customs are most meaningful when accompanied by sincere prayer and faith.</p>
      </Section>

      <Section title='A Tradition of Faith, Love, and Hope' shaded>
        <p>
          Hokihankist is far more than an Armenian cultural custom or a family obligation. It is a sacred expression
          of our Christian faith, rooted in the teachings of Holy Scripture and preserved through centuries of
          Armenian Apostolic tradition.
        </p>
        <p>
          In remembering our departed loved ones, we acknowledge the fragility of earthly life, give thanks for those
          whom God has placed in our lives, and renew our trust in His promise of eternal life.
        </p>
        <p>
          We mourn because we love, but we do not mourn without hope. As Christians, we place our trust in the mercy
          of God and the victory of Jesus Christ over death.
        </p>
      </Section>

      <Section id='request' title='Requesting a Hokihankist at St. Mary'>
        <p>
          Parishioners and friends of St. Mary Armenian Apostolic Church are welcome to request a Hokihankist service
          in memory of their departed loved ones.
        </p>
        <p>When requesting a service, please provide:</p>
        <ul className='list-disc pl-6 space-y-1'>
          <li>The full names of the departed to be remembered.</li>
          <li>The occasion for the remembrance, if applicable.</li>
          <li>The names of the family members requesting the service.</li>
          <li>The preferred Sunday for the service.</li>
        </ul>
        <p>
          Please contact the St. Mary Church Office in advance to make arrangements and confirm that your requested
          date is in accordance with the liturgical calendar of the Armenian Apostolic Church.
        </p>
      </Section>

      {/* Closing prayer and how to reach the office */}
      <section className='px-primary py-12 bg-primary text-white text-center'>
        <p className='font-secondary font-bold text-2xl mb-1'>
          <Hy>Աստուած հոգիները լուսաւորէ։</Hy>
        </p>
        <p className='italic text-gray-200 mb-4'>May God grant light to their souls.</p>
        <p className='text-gray-200 max-w-xl mx-auto mb-8'>
          May our Lord Jesus Christ grant eternal rest to all those who have fallen asleep in Him, and may He bring
          peace and consolation to all who mourn. Amen.
        </p>
        <p className='text-gray-200 max-w-xl mx-auto mb-6'>
          To request a Hokihankist, call the parish office at 949.650.8367 or get in touch through our contact page.
        </p>
        <div className='flex gap-3 justify-center flex-wrap'>
          <Link href='/contact'>
            <Button className='!w-[200px] !bg-secondary !border-secondary hover:!brightness-90'>Contact Us</Button>
          </Link>
          <Link href='/worship'>
            <Button className='!w-[200px] !bg-transparent !border-white !border-2 hover:!bg-white hover:!text-primary'>
              Back to Worship
            </Button>
          </Link>
        </div>
      </section>
    </AppLayout>
  );
}
