import AppLayout from '@/components/layout/AppLayout';
import Button from '@/common/Button';
import Link from 'next/link';
import React from 'react';

export default function HolyCommunionPage() {
  return (
    <AppLayout>
      <header className='worship-header-bg px-primary h-[205px] md:h-[305px] flex flex-col items-center justify-center text-center gap-3 text-white'>
        <p className='font-cursive text-secondary text-2xl'>The Sacred Mysteries</p>
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>
          Holy Communion
        </h1>
        <p className='font-normal text-lg max-w-2xl'>The Eucharist</p>
      </header>

      {/* Intro */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto text-gray-700 leading-relaxed space-y-4'>
          <p>
            Holy Communion — also known as the Eucharist — stands at the heart of Armenian Christian
            worship and faith. It is far more than a symbol or a simple memorial of Christ&apos;s
            death. In the Armenian Apostolic Church, Holy Communion is the real, mysterious presence
            of our Lord and Savior Jesus Christ — His Body and Blood — offered to the faithful under
            the appearances of bread and wine for the forgiveness of sins, spiritual nourishment, and
            union with God.
          </p>
        </div>
      </section>

      {/* Biblical Foundation */}
      <section className='px-primary py-12 bg-[#FFF5F2]'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            Biblical Foundation
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              The institution of Holy Communion comes directly from the words of Christ at the Last
              Supper:
            </p>
            <blockquote className='border-l-4 border-secondary pl-5 italic text-gray-600'>
              &ldquo;While they were eating, Jesus took bread, and after blessing it he broke it,
              gave it to the disciples, and said, &lsquo;Take, eat; this is my body.&rsquo; Then he
              took a cup, and after giving thanks he gave it to them, saying, &lsquo;Drink of it,
              all of you, for this is my blood of the new covenant, which is poured out for many for
              the forgiveness of sins.&rsquo;&rdquo;
              <footer className='mt-2 not-italic text-sm text-gray-500'>
                Matthew 26:26–28; see also Mark 14:22–24 and Luke 22:17–20
              </footer>
            </blockquote>
            <p>
              Jesus does not say &ldquo;this represents&rdquo; or &ldquo;this symbolizes&rdquo; His
              body and blood — He declares it <em>is</em>. The account of the risen Christ revealed
              to the disciples on the road to Emmaus (Luke 24:13–31) further shows the early Church
              experiencing the Lord&apos;s living presence in the breaking of the bread.
            </p>
            <p>This teaching reaches its clearest expression in John 6, where Jesus declares:</p>
            <blockquote className='border-l-4 border-secondary pl-5 italic text-gray-600'>
              &ldquo;Very truly I tell you, unless you eat the flesh of the Son of Man and drink his
              blood, you have no life in you. Those who eat my flesh and drink my blood have eternal
              life, and I will raise them up on the last day.&rdquo;
              <footer className='mt-2 not-italic text-sm text-gray-500'>John 6:53–54</footer>
            </blockquote>
            <p>
              Our Lord makes this point some twelve times in the chapter, underscoring its
              centrality to the Christian life.
            </p>
          </div>
        </div>
      </section>

      {/* The Real Presence */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            The Real Presence of Christ
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              The Armenian Apostolic Church, in continuity with the ancient, undivided Church,
              believes that in Holy Communion the bread and wine are truly changed by the power of
              the Holy Spirit into the Body and Blood of Christ. This is not a mere symbolic act,
              but a profound mystery in which Christ is truly present and received by the faithful.
            </p>
            <div className='bg-[#FFF5F2] rounded-xl p-5 border-l-4 border-secondary'>
              <p className='font-secondary font-bold text-primary mb-2'>
                St. Basil the Great (4th century)
              </p>
              <p className='italic text-gray-600 mb-2'>
                &ldquo;Now the heavens open from above, and Christ, descending, rests on this holy
                altar… Do not contemplate only this visible bread and wine but… the great Mystery
                which is hidden from our bodily sight… For God has the power of converting It into
                flesh and blood… But do not look on it as bread, and do not you contemplate it as
                wine, for this is the Body and Blood of Christ.&rdquo;
              </p>
              <p className='text-sm text-gray-500'>
                Read from the altar in every Armenian Church on Holy Thursday
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Epiclesis */}
      <section className='px-primary py-12 bg-[#FFF5F2]'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            The Epiclesis — Invocation of the Holy Spirit
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              The transformation of the gifts occurs through the action of the Holy Spirit during
              the <em>Epiclesis</em> — the solemn invocation within the Divine Liturgy. The priest
              prays:
            </p>
            <div className='bg-white rounded-xl p-5 border-l-4 border-secondary'>
              <p className='italic text-gray-600'>
                &ldquo;We bow down and beseech and ask You, beneficent God, send upon us and upon
                these gifts set forth, Your co-eternal and consubstantial Holy Spirit, whereby
                blessing this bread, make it truly the body of our Lord and Savior Jesus Christ; and
                blessing this cup, make it truly the blood of our Lord and Savior Jesus Christ…
                changing them by Your Holy Spirit.&rdquo;
              </p>
            </div>
            <p>
              This prayer reflects the Church&apos;s faith that the same Holy Spirit who inspired
              the Scriptures, empowered the Apostles, and works miracles in the lives of believers
              is fully capable of sanctifying the bread and wine so that they become for us the
              life-giving Body and Blood of Christ.
            </p>
          </div>
        </div>
      </section>

      {/* Preparation and Worthiness */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            Preparation and Worthiness
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              Because Holy Communion is the real presence of Christ, the Armenian Church approaches
              it with deep reverence and humility. No one is truly &ldquo;worthy&rdquo; by their
              own merits — as the priest prays before the altar: <em>&ldquo;None of us who are
              bound by carnal passions and desires is worthy to approach Your table… Yet through
              Your immeasurable goodness…&rdquo;</em>
            </p>
            <p>
              For this reason, the Church requires preparation through the Sacrament of Penance
              (Confession). Before receiving Holy Communion, the faithful are encouraged to:
            </p>
            <ol className='list-decimal pl-5 space-y-3'>
              <li>Examine their conscience and acknowledge their sins.</li>
              <li>Repent with a sincere heart.</li>
              <li>Seek God&apos;s mercy and forgiveness.</li>
              <li>Resolve, with God&apos;s help, to turn away from sin.</li>
            </ol>
            <p>
              This spiritual preparation allows the believer to approach the Holy Gifts in faith and
              humility. Just prior to receiving, the faithful affirm:
            </p>
            <blockquote className='border-l-4 border-secondary pl-5 italic text-gray-600'>
              &ldquo;In faith do I believe in the all-holy Trinity… In faith do I taste of this,
              Your holy and life-giving and saving Body, O Christ my God… for the remission of my
              sins. Let Your incorruptible Body be to me for life and Your holy Blood for expiation
              and remission of sins.&rdquo;
            </blockquote>
          </div>
        </div>
      </section>

      {/* The Purpose */}
      <section className='px-primary py-12 bg-[#FFF5F2]'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            The Purpose of Holy Communion
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              Holy Communion is not a reward for an already &ldquo;saved&rdquo; life, but the
              primary means by which Christ nourishes, heals, forgives, and unites us to Himself and
              to His Church. It is the foretaste of the heavenly banquet and the source of grace
              that sustains the Christian life until the Lord&apos;s return.
            </p>
            <p>
              In the Armenian Apostolic Church, receiving the Body and Blood of Christ is central to
              our journey of salvation — a living encounter with the risen Lord who gives Himself to
              us completely.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className='px-primary py-12 bg-primary text-white text-center'>
        <h2 className='font-secondary font-bold text-2xl mb-4'>Come and receive.</h2>
        <p className='text-gray-200 max-w-xl mx-auto mb-6'>
          Holy Communion is offered at every Sunday Badarak. All baptized and chrismated members of
          the Armenian Apostolic Church are welcome to receive.
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
