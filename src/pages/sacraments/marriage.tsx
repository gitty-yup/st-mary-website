import AppLayout from '@/components/layout/AppLayout';
import Button from '@/common/Button';
import Link from 'next/link';
import React from 'react';

export default function MarriagePage() {
  return (
    <AppLayout>
      <header className='worship-header-bg px-primary h-[205px] md:h-[305px] flex flex-col items-center justify-center text-center gap-3 text-white'>
        <p className='font-cursive text-secondary text-2xl'>The Sacred Mysteries</p>
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>
          Holy Matrimony
        </h1>
        <p className='font-normal text-lg max-w-2xl'>The Sacrament of Crowning</p>
      </header>

      {/* Intro */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto text-gray-700 leading-relaxed space-y-4'>
          <p>
            <strong>Holy Matrimony</strong> — known in the Armenian tradition as the{' '}
            <strong>Sacrament of Crowning</strong> — is one of the seven sacraments of the Armenian
            Apostolic Church. Like all sacraments, it is not merely a ceremony but an action of
            Christ Himself, performed through the hands of an ordained priest within the life of the
            Church. Through it, the Holy Spirit bestows divine gifts upon the couple — love,
            righteousness, patience, and endurance — as they begin their life together.
          </p>
        </div>
      </section>

      {/* Marriage Is Holy */}
      <section className='px-primary py-12 bg-[#FFF5F2]'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>Marriage Is Holy</h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              From the very beginning, God ordained the union of man and woman: &ldquo;Be fruitful
              and multiply and fill the earth&rdquo; (Genesis 1:28). Holy Matrimony is therefore a
              divine order with a sacred purpose — the procreation of children and the formation of
              a family: a little kingdom within the larger Kingdom of God.
            </p>
            <p>
              God&apos;s initiative is always holy. Marriage carried out in accordance with His will
              carries with it the promise of virtuous life, moral uprightness, and a home ordered
              toward His glory.
            </p>
          </div>
        </div>
      </section>

      {/* Matrimony Is a Sacrament */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            Matrimony Is a Sacrament
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              Jesus Christ did not merely acknowledge marriage — He sanctified it. Following His
              Father&apos;s creation, He granted it His endorsement and blessing, emphasizing the
              inseparable unity between husband and wife. The divine initiative and the moral
              foundation set by Christ make marriage a Holy Sacrament.
            </p>
            <p>
              Marriage is not only a covenant before God; it demands a life commitment of the
              husband and wife toward each other. It is this combination — Christ&apos;s
              sanctification and the couple&apos;s total, lifelong self-giving — that constitutes
              the sacramental nature of Christian marriage.
            </p>
          </div>
        </div>
      </section>

      {/* The Meaning of Christian Marriage */}
      <section className='px-primary py-12 bg-[#FFF5F2]'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            The Meaning of Christian Marriage
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              St. Paul drew a profound parallel between marriage and the relationship of Christ and
              His Church. As the Church is united to Christ and obedient to Him, so the wife is
              united to her husband; and as Christ cherishes and nourishes His Church, so the
              husband is called to love his wife — with bond of love, respect, and mutual devotion,
              all ultimately rendered to Christ our Lord.
            </p>
            <p>
              The unity between husband and wife is therefore a holy unity: an image of
              Christ&apos;s own love for His people.
            </p>
            <p>
              Central to this unity is permanence. Jesus declared: &ldquo;Therefore what God has
              joined together, let no man separate.&rdquo; The Armenian Church offers lengthy prayers
              for the sanctity and lasting unity of the couple, recognizing that understanding,
              patience, and mutual responsibility are the safeguards of a holy marriage.
            </p>
          </div>
        </div>
      </section>

      {/* Why Do We Call It Crowning? */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            Why Do We Call It Crowning?
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              The Armenian Church crowns the bride and groom as king and queen — either by placing
              actual crowns on their heads, or by circling the forehead with a traditional tricolor
              braid (white, green, and red) bearing a small cross at the front. This act of
              crowning symbolizes the establishment of a new household: a kingdom within the Kingdom
              of God.
            </p>

            <div className='bg-[#FFF5F2] rounded-xl p-5 border-l-4 border-secondary'>
              <p className='font-secondary font-bold text-primary mb-2'>
                A Distinctly Armenian Tradition
              </p>
              <p>
                At the moment of crowning, a special hymn is sung dedicated to King Trdat and Queen
                Ashkhen — the first king and queen of Armenia, who embraced Christianity as the
                state religion in 301 AD. The central prayer of the service calls for the
                &ldquo;placing of crowns with precious gems on their heads,&rdquo; invoking both
                royal dignity and sacred blessing.
              </p>
            </div>

            <p>
              The crowns are later removed with a special prayer. In this way, the Church teaches
              that true royalty is not dominion but humility — a life of service, dignity, and
              dedication under the banner of the Cross.
            </p>
          </div>
        </div>
      </section>

      {/* The Rite */}
      <section className='px-primary py-12 bg-[#FFF5F2]'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            The Rite of Holy Matrimony
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              The rite of Holy Matrimony is performed exclusively by an ordained priest and must
              take place within a church. It is the Church alone that unites the betrothed on behalf
              of the Lord Jesus Christ — the sanctity of the union is sealed by His hands. Where
              there is no Armenian church, a sister church in the community may be used.
            </p>
            <p>
              The ceremony includes the exchange of vows and the blessing of the wedding rings,
              which the priest presents individually for each spouse to wear on the left hand. It is
              the Holy Spirit acting through the sacrament that bestows upon the couple the divine
              gifts of love, righteousness, patience, and endurance needed for a holy marriage.
            </p>
          </div>
        </div>
      </section>

      {/* Arranging Your Wedding */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            Arranging Your Wedding at St. Mary
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              Couples wishing to be married at St. Mary should contact the parish office as early as
              possible. At least two meetings with the officiating priest are required in the months
              before the wedding, covering pastoral counseling, practical preparation, and scheduling.
            </p>
            <ul className='list-disc pl-5 space-y-3'>
              <li>
                <strong>Dates:</strong> There are periods in the church calendar — including the
                forty days of Great Lent — during which marriages may not be blessed. The priest
                will advise the couple on available dates.
              </li>
              <li>
                <strong>Certificates:</strong> Both parties must provide certificates of Baptism and
                Chrismation. If either has not received these sacraments, they must do so prior to
                the wedding.
              </li>
              <li>
                <strong>Application:</strong> An application form is completed to provide the
                couple&apos;s identity, age, and marital status for church records and the issuance
                of a church marriage certificate.
              </li>
              <li>
                <strong>Divorced individuals</strong> must provide the appropriate civil documents.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className='px-primary py-12 bg-primary text-white text-center'>
        <h2 className='font-secondary font-bold text-2xl mb-4'>
          Planning a wedding at St. Mary?
        </h2>
        <p className='text-gray-200 max-w-xl mx-auto mb-6'>
          Reach out to the parish office to begin the conversation with our Pastor.
        </p>
        <div className='flex gap-3 justify-center flex-wrap'>
          <Link href='/contact'>
            <Button className='!w-[200px] !bg-secondary !border-secondary hover:!brightness-90'>
              Contact Us
            </Button>
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
