import AppLayout from '@/components/layout/AppLayout';
import Button from '@/common/Button';
import Link from 'next/link';
import React from 'react';

export default function OrdinationPage() {
  return (
    <AppLayout>
      <header className='worship-header-bg px-primary h-[205px] md:h-[305px] flex flex-col items-center justify-center text-center gap-3 text-white'>
        <p className='font-cursive text-secondary text-2xl'>The Sacred Mysteries</p>
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>
          Ordination
        </h1>
        <p className='font-normal text-lg max-w-2xl'>Holy Orders</p>
      </header>

      {/* Intro */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto text-gray-700 leading-relaxed space-y-4'>
          <p>
            In Holy Orders — also called Ordination — the Church continues its God-given mission
            of proclaiming the Kingdom of God and the Lordship of Jesus Christ. Fallible human
            beings are given this task. Through the reception of this sacrament, the ordained is
            enabled to function as preacher, teacher, and celebrant of the supreme act of worship
            for an Orthodox Christian: the Eucharist, that is the Divine Liturgy.
          </p>
        </div>
      </section>

      {/* The Three Orders */}
      <section className='px-primary py-12 bg-[#FFF5F2]'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            The Three Orders of Clergy
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              In the Armenian Apostolic Church, there is a three-fold ministry. The three major
              orders of ordained clergy are the deacon, the priest, and the bishop.
            </p>
            <div className='space-y-4'>
              <div className='bg-white rounded-xl p-5 border-l-4 border-secondary'>
                <h3 className='font-secondary font-bold text-primary text-lg mb-2'>Deacon</h3>
                <p className='text-sm leading-relaxed'>
                  The diaconate traces to Acts 6, where the Apostles prayed over and laid their
                  hands on the first deacons as a symbol of authority. Deacons were instructed to
                  assist the Apostles in serving the people. Today, deacons continue that role —
                  assisting at liturgical services and supporting the administrative, charitable,
                  and mission programs of the Church.
                </p>
              </div>
              <div className='bg-white rounded-xl p-5 border-l-4 border-secondary'>
                <h3 className='font-secondary font-bold text-primary text-lg mb-2'>Priest</h3>
                <p className='text-sm leading-relaxed'>
                  This order evolved fully by the second century, when the growing number of
                  Christian converts made it necessary to expand the ordained ranks. The
                  priest&apos;s task — then as now — is to preach, to sanctify, to celebrate the
                  Divine Liturgy, and to serve as the leader of his flock in the name of the
                  bishop.
                </p>
              </div>
              <div className='bg-white rounded-xl p-5 border-l-4 border-secondary'>
                <h3 className='font-secondary font-bold text-primary text-lg mb-2'>Bishop</h3>
                <p className='text-sm leading-relaxed'>
                  The office of bishop can be traced directly to Christ, who instituted it through
                  the Holy Apostles. Originally, bishops served as heads of individual parishes;
                  as the Church grew, bishops came to oversee groups of parishes, with priests
                  serving as local parish leaders in their name.
                </p>
              </div>
            </div>
            <p className='text-sm text-gray-500 mt-2'>
              There are also minor orders, including the <em>clerk</em> (<em>tbir</em>) — which
              encompasses four ranks: doorkeeper, reader, exorcist, and acolyte — and the
              sub-diaconate (<em>gisasargavak</em>).
            </p>
          </div>
        </div>
      </section>

      {/* The Priest: Human and Yet Called */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            Human, and Yet Called
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              Everything a priest does, he does with the authorization and seal of the Holy
              Spirit. As a mere human being, he is just that — a mere human being. But as a
              priest, he functions as an officer of the Church, deriving all of his authority
              from our Lord Himself. It is for this reason that he is ordained, and it is in
              this fashion that he is to serve.
            </p>
            <p>
              This dual reality is captured in the words of Christ in John 15:16–17:
            </p>
            <blockquote className='border-l-4 border-secondary pl-5 italic text-gray-600'>
              &ldquo;You did not choose me but I chose you. And I appointed you to go and bear
              fruit, fruit that will last, so that the Father will give you whatever you ask in
              my name.&rdquo;
              <footer className='mt-2 not-italic text-sm text-gray-500'>John 15:16–17</footer>
            </blockquote>
            <p>
              The priesthood is not something one can choose. It is something for which one is
              chosen — by the Lord.
            </p>
          </div>
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
              It was clearly our Lord&apos;s intention that His work and ministry be continued —
              not ending with the Apostles, but carrying forward until the end of time. In the
              closing lines of Matthew&apos;s Gospel, Christ commands His Apostles:
            </p>
            <blockquote className='border-l-4 border-secondary pl-5 italic text-gray-600'>
              &ldquo;All authority in heaven and on earth has been given to me. Go therefore and
              make disciples of all nations, baptizing them in the name of the Father and of the
              Son and of the Holy Spirit and teaching them to obey everything that I have
              commanded you. And remember, I am with you always, to the end of the age.&rdquo;
              <footer className='mt-2 not-italic text-sm text-gray-500'>Matthew 28:18–20</footer>
            </blockquote>
            <p>
              The simple yet profound mechanism by which the Apostles ensured this continuation is
              what we call Ordination — Holy Orders, the Laying on of Hands. In Acts 6:1–6, when
              the Apostles needed help in their mission, they chose Stephen, Philip, Prochorus,
              Nicanor, Timon, Parmenas, and Nicolaus:
            </p>
            <blockquote className='border-l-4 border-secondary pl-5 italic text-gray-600'>
              &ldquo;They had these men stand before the apostles, who prayed and laid their hands
              upon them.&rdquo;
              <footer className='mt-2 not-italic text-sm text-gray-500'>Acts 6:6</footer>
            </blockquote>
            <p>
              Later, in Acts 14:23: &ldquo;So when they had appointed elders in every church, and
              prayed with fasting, they commended them to the Lord in whom they had believed.&rdquo;
              These passages are Apostolic Succession in action.
            </p>
          </div>
        </div>
      </section>

      {/* Apostolic Succession */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            Apostolic Succession
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              The continuation of ordinations from generation to generation is the assurance that
              the Holy Spirit is operating in the Church — a present and active participant at
              each and every ordination. For the Orthodox Christian, ordination is not simply the
              authorization of someone by a group of representatives. It is the very seal of the
              Holy Spirit upon the individual and upon his calling to service.
            </p>
            <p>
              This unbroken chain, passed from one generation to the next, is what we call{' '}
              <strong>Apostolic Succession</strong>. It ensures the fidelity of the Church to her
              Lord and Savior Jesus Christ — and it is the foundation upon which the validity of
              every sacrament rests.
            </p>
            <div className='bg-[#FFF5F2] rounded-xl p-5 border-l-4 border-secondary'>
              <p className='text-gray-700 leading-relaxed'>
                Apostolic Succession is not something that simply looks backward. It is something
                which impels the Church <em>forward</em> — to continue the very mission initiated
                by our Lord and carried on to our own day. Through this process, the authority of
                the Church can be traced back to Christ Himself, and forward until He comes again
                at the end of time. It is a solemn proclamation that Jesus Christ is the Lord of
                the Church, and that it is ultimately He who gives legitimacy to all aspects of
                authority within it.

              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className='px-primary py-12 bg-primary text-white text-center'>
        <h2 className='font-secondary font-bold text-2xl mb-4'>
          Questions about Holy Orders?
        </h2>
        <p className='text-gray-200 max-w-xl mx-auto mb-6'>
          Contact the parish office to speak with our Pastor about the ordained ministry of the
          Armenian Apostolic Church.
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
