import AppLayout from '@/components/layout/AppLayout';
import Button from '@/common/Button';
import Link from 'next/link';
import React from 'react';

export default function PrayerForTheSickPage() {
  return (
    <AppLayout>
      <header className='worship-header-bg px-primary h-[205px] md:h-[305px] flex flex-col items-center justify-center text-center gap-3 text-white'>
        <p className='font-cursive text-secondary text-2xl'>The Sacred Mysteries</p>
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>
          Prayer for the Sick
        </h1>
        <p className='font-normal text-lg max-w-2xl'>Anointing and Last Rites</p>
      </header>

      {/* Intro */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto text-gray-700 leading-relaxed space-y-4'>
          <p>
            In times of illness, suffering, and the approach of death, the Church does not leave
            her members alone. Through the sacrament of Prayer for the Sick — which includes
            anointing with oil, prayer, and, where possible, the reception of the other
            sacraments — the Armenian Apostolic Church ministers to those in need of God&apos;s
            healing grace, forgiveness, and comfort.
          </p>
        </div>
      </section>

      {/* Biblical Foundation */}
      <section className='px-primary py-12 bg-[#FFF5F2]'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            The Scriptural Mandate
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              This sacrament is rooted directly in the apostolic practice commanded in the
              New Testament:
            </p>
            <blockquote className='border-l-4 border-secondary pl-5 italic text-gray-600'>
              &ldquo;Is any among you sick? Let him call for the elders of the church, and let
              them pray over him, anointing him with oil in the name of the Lord. And the prayer
              of faith will save the sick, and the Lord will raise him up. And if he has committed
              sins, he will be forgiven.&rdquo;
              <footer className='mt-2 not-italic text-sm text-gray-500'>James 5:14–15</footer>
            </blockquote>
            <p>
              Notice that the passage joins healing of the body with forgiveness of sins — the
              two are not separated. The prayer which is part of the conferring of this sacrament
              proclaims that it is Jesus Christ Himself who dispels and takes away the pain and
              suffering of the world.
            </p>
          </div>
        </div>
      </section>

      {/* The Prayer of Anointing */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            The Prayer of Anointing
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>The prayer spoken at the conferring of this sacrament reads:</p>
            <div className='bg-[#FFF5F2] rounded-xl p-6 border-l-4 border-secondary'>
              <p className='italic text-gray-600 leading-relaxed'>
                &ldquo;Alleviate the pain and heal the sickness of Your people, O Lord our God,
                and grant to all perfect health by the sign of Your all victorious cross by which
                You removed the human infirmities and condemned the enemy of our life and
                salvation. You are our life and salvation, O beneficent and most merciful God, who
                alone are able to forgive our sins and dispel disease and sickness from among us,
                and to Whom are made manifest our needs. O You Who bestow good things, bestow Your
                abundant mercy according to the needs of each of Your creatures, by whom the All
                Holy Trinity is always glorified and praised now and forever and ever. Amen.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Christ, Healer of Body and Soul */}
      <section className='px-primary py-12 bg-[#FFF5F2]'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            Christ, Healer of Body and Soul
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              All four of the Gospels are replete with accounts of our Lord both curing the
              individual and granting forgiveness of sin. Healing and forgiveness are never truly
              separate in His ministry — and they are not separate in this sacrament either.
            </p>
            <p>
              Looked at collectively, all of the sacraments, in one form or another, proclaim
              our Lord Jesus Christ as the Lord of all of life and of its various aspects. This
              final sacrament makes that proclamation in the most tender and intimate of
              circumstances: at the bedside of the suffering and the dying, where the Church
              carries Christ&apos;s own healing presence to those who need it most.
            </p>
          </div>
        </div>
      </section>

      {/* Arranging a Visit */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            Arranging a Pastoral Visit
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              If you or a loved one is ill, hospitalized, homebound, or nearing the end of life,
              please contact the parish office as soon as possible. Our Pastor is available to
              visit, pray, anoint, and administer the sacraments to those who are unable to
              attend services.
            </p>
            <p>
              Do not wait until the final moments. The Church&apos;s ministry to the sick is
              meant to bring comfort, healing, and spiritual strength throughout an illness — not
              only at its end.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className='px-primary py-12 bg-primary text-white text-center'>
        <h2 className='font-secondary font-bold text-2xl mb-4'>
          Need a pastoral visit?
        </h2>
        <p className='text-gray-200 max-w-xl mx-auto mb-6'>
          Contact the parish office to arrange for our Pastor to visit, pray with, and anoint
          someone who is ill or unable to attend services.
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
