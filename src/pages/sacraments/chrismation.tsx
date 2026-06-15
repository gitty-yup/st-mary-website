import AppLayout from '@/components/layout/AppLayout';
import Button from '@/common/Button';
import Link from 'next/link';
import React from 'react';

export default function ChrismationPage() {
  return (
    <AppLayout>
      <header className='worship-header-bg px-primary h-[205px] md:h-[305px] flex flex-col items-center justify-center text-center gap-3 text-white'>
        <p className='font-cursive text-secondary text-2xl'>The Sacred Mysteries</p>
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>
          Chrismation
        </h1>
        <p className='font-normal text-lg max-w-2xl'>The Completion of Baptism</p>
      </header>

      {/* Intro */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto text-gray-700 leading-relaxed space-y-4'>
          <p>
            Chrismation — known in the West as Confirmation — is the sacrament that completes
            Baptism. If Baptism is the new birth, Chrismation is the sealing of that new life:
            the moment the newly baptized is dedicated to God and marked as His own. In the
            Armenian Apostolic Church, the two sacraments are inseparable, administered together
            as one unified act of initiation into the Body of Christ.
          </p>
          <p>
            It is not an &ldquo;add on.&rdquo; It is the essence of who we are to be as
            Christians.
          </p>
        </div>
      </section>

      {/* The Meaning of Anointing */}
      <section className='px-primary py-12 bg-[#FFF5F2]'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            The Meaning of Anointing
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              In the Armenian Church, anything set apart for God&apos;s service is anointed —
              sealed to Him. A church building is anointed when it is consecrated as a house of
              worship. An icon to be used in the church is anointed. When a priest is ordained,
              his forehead and hands are anointed. In each case, the meaning is the same: this
              person or object is being dedicated and sealed to God, to be used in His service.
            </p>
            <p>
              When someone is baptized, the same logic applies. The new spiritual life born
              through Baptism is immediately given and dedicated to God through the anointing of
              Chrismation — on the forehead, eyes, ears, nostrils, mouth, hands, heart, back, and
              feet. The newly baptized is sealed as belonging entirely to Christ.
            </p>
          </div>
        </div>
      </section>

      {/* The Personal Pentecost */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            A Personal Pentecost
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              In Orthodox theology, Chrismation is understood as an extension — or continuing —
              of Pentecost, when the Holy Spirit descended upon the Apostles. In the sacrament,
              the Holy Spirit descends upon the newly baptized. In Armenian, this is called{' '}
              <em>guhnoonk</em> — sealing.
            </p>
            <blockquote className='border-l-4 border-secondary pl-5 italic text-gray-600'>
              &ldquo;…having believed you were sealed with the Holy Spirit of promise, who is the
              guarantee of our inheritance until the redemption of the purchased possession, to the
              praise of His glory.&rdquo;
              <footer className='mt-2 not-italic text-sm text-gray-500'>Ephesians 1:13</footer>
            </blockquote>
            <p>
              Each Chrismation is, in effect, the candidate&apos;s own private Pentecost. The
              Holy Spirit is imparted to the newly baptized, marking them as belonging to God in
              a singular way. This new Christian is now fully and completely a member of the Body
              of Christ, the Church — part of the priesthood of believers, called to bear continual
              witness to Jesus Christ.
            </p>
          </div>
        </div>
      </section>

      {/* The Prayers of Anointing */}
      <section className='px-primary py-12 bg-[#FFF5F2]'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            The Prayers of Anointing
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              To see the total Christ-centeredness of this sacrament, one need only look at the
              prayers spoken at each anointing. As the priest applies the holy <em>Muron</em>{' '}
              (chrism oil) to each part of the body, he prays:
            </p>
            <div className='bg-white rounded-xl p-6 space-y-4'>
              {[
                {
                  part: 'Forehead',
                  prayer:
                    'This sweet oil, which is poured upon you in the name of Jesus Christ, be a seal of incorruptible heavenly gifts.',
                },
                {
                  part: 'Eyes',
                  prayer:
                    'May this seal in the name of Jesus Christ enlighten your eyes, so that you may never sleep unto death.',
                },
                {
                  part: 'Ears',
                  prayer:
                    'May this holy anointing be to you for the hearing of the divine commandments.',
                },
                {
                  part: 'Nostrils',
                  prayer:
                    'May this seal in the name of Jesus Christ be a sweet smell to you for life unto life.',
                },
                {
                  part: 'Mouth',
                  prayer:
                    'May this seal in the name of Jesus Christ be a guard for your mouth and a strong door for your lips.',
                },
                {
                  part: 'Hands',
                  prayer:
                    'May this seal in the name of Jesus Christ be a cause for good works and for all virtuous deeds and conduct.',
                },
                {
                  part: 'Heart',
                  prayer:
                    'May this divine seal cleanse your heart and establish an upright spirit within you.',
                },
                {
                  part: 'Back',
                  prayer:
                    'May this seal in the name of Jesus Christ be for you a shield of strength, so that you may quench all the fiery darts of the evil one.',
                },
                {
                  part: 'Feet',
                  prayer:
                    'May this divine seal direct your steps toward eternal life, so that you may not be shaken.',
                },
              ].map(({ part, prayer }) => (
                <div key={part} className='flex gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0'>
                  <span className='font-secondary font-bold text-primary min-w-[80px]'>{part}</span>
                  <p className='italic text-gray-600 text-sm leading-relaxed'>{prayer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Peace of the Anointed */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            Peace to You, O Anointed of God
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              When the anointing is finished, the priest speaks these words over the newly
              chrismated:
            </p>
            <blockquote className='border-l-4 border-secondary pl-5 italic text-gray-600'>
              &ldquo;Peace to you, O saved of God. Peace to you, O anointed of God.&rdquo;
            </blockquote>
            <p>
              It is this sealing — this signing of the Holy Spirit — that is the heart of the
              sacrament. The newly chrismated is now marked as belonging to Christ in a complete
              and irrevocable way. Their relationship to our Lord and Savior is sealed and assured
              by the Holy Spirit.
            </p>
            <p>
              This is why, in the Armenian Church, Chrismation is administered immediately
              following Baptism and is required before the reception of Holy Communion or the
              Sacrament of Marriage. Together, the three sacraments — Baptism, Chrismation, and
              First Communion — constitute the full rite of Christian initiation.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className='px-primary py-12 bg-primary text-white text-center'>
        <h2 className='font-secondary font-bold text-2xl mb-4'>Questions about Chrismation?</h2>
        <p className='text-gray-200 max-w-xl mx-auto mb-6'>
          Contact the parish office to speak with our Pastor about the sacraments of initiation.
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
