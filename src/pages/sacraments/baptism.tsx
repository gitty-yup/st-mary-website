import AppLayout from '@/components/layout/AppLayout';
import Button from '@/common/Button';
import Link from 'next/link';
import React from 'react';

export default function BaptismPage() {
  return (
    <AppLayout>
      <header className='worship-header-bg px-primary h-[205px] md:h-[305px] flex flex-col items-center justify-center text-center gap-3 text-white'>
        <p className='font-cursive text-secondary text-2xl'>The Sacred Mysteries</p>
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>
          Holy Baptism
        </h1>
        <p className='font-normal text-lg max-w-2xl'>
          The sacrament of initiation into the Body of Christ
        </p>
      </header>

      {/* Intro */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto text-gray-700 leading-relaxed space-y-4'>
          <p>
            <strong>The Sacrament of Holy Baptism in the Armenian Apostolic Church</strong> is the
            foundational rite of initiation into the Christian faith. It marks the beginning of a
            new life in Christ and full membership in the Church.
          </p>
        </div>
      </section>

      {/* What Is Baptism? */}
      <section className='px-primary py-12 bg-[#FFF5F2]'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>What Is Baptism?</h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              Baptism (Armenian: <em>Mkrtut&apos;iun</em> or <em>Mkrtel</em>) comes from the Greek
              word meaning &ldquo;to wash&rdquo; or immerse in water. It is the sacrament through
              which a person is cleansed of original sin, reborn spiritually, and adopted as a child
              of God.
            </p>
            <p>
              Jesus Christ Himself was baptized by St. John the Baptist in the River Jordan, setting
              the example for all believers. He commanded His disciples: &ldquo;Go therefore and make
              disciples of all nations, baptizing them in the name of the Father and of the Son and
              of the Holy Spirit&rdquo; (Matthew 28:19).
            </p>
            <p>
              In the Armenian Apostolic Church, <strong>Baptism, Chrismation (Confirmation), and
              First Holy Communion</strong> are celebrated together as the Sacraments of Initiation.
              This unified rite brings the person fully into the life of the Church.
            </p>
          </div>
        </div>
      </section>

      {/* Why Do We Baptize? */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>Why Do We Baptize?</h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <ul className='list-disc pl-5 space-y-3'>
              <li>
                <strong>Cleansing and Rebirth:</strong> Through immersion in blessed water, the
                person is washed from original sin (inherited from Adam and Eve) and enters a new
                life as a member of the Body of Christ.
              </li>
              <li>
                <strong>Salvation:</strong> Jesus taught, &ldquo;Unless one is born of water and
                the Spirit, he cannot enter the kingdom of God&rdquo; (John 3:5). Baptism is
                essential for salvation.
              </li>
              <li>
                <strong>Sealing with the Holy Spirit:</strong> Chrismation immediately follows,
                anointing the newly baptized with holy <em>Muron</em> (chrism) to receive the
                gifts of the Holy Spirit.
              </li>
              <li>
                <strong>Union with Christ:</strong> First Communion nourishes the new Christian
                with the Body and Blood of Christ.
              </li>
            </ul>
            <p>
              Baptism is performed <strong>only once</strong> in a lifetime, provided it was done
              with water in the name of the Holy Trinity. The Armenian Church recognizes valid
              Trinitarian baptisms from other Christian traditions.
            </p>
          </div>
        </div>
      </section>

      {/* The Rite of Baptism */}
      <section className='px-primary py-12 bg-[#FFF5F2]'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>The Rite of Baptism</h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              The Armenian baptismal service is rich in symbolism and follows ancient traditions:
            </p>
            <ul className='list-disc pl-5 space-y-3'>
              <li>
                It begins at the church entrance, where the priest welcomes the candidate (often an
                infant) and family.
              </li>
              <li>
                The godfather renounces Satan on the child&apos;s behalf, professes the Nicene
                Creed, and makes the sacred threefold request for &ldquo;faith, hope, love, and
                baptism.&rdquo;
              </li>
              <li>
                The water is blessed and the candidate is immersed <strong>three times</strong> in
                the name of the Father, the Son, and the Holy Spirit — symbolizing Christ&apos;s
                three days in the tomb and His resurrection.
              </li>
              <li>
                The newly baptized is anointed with holy <em>Muron</em> on key parts of the body
                (forehead, eyes, ears, nose, mouth, hands, feet, etc.).
              </li>
              <li>They receive First Holy Communion.</li>
              <li>
                A white garment (&ldquo;Robe of Gladness&rdquo;) may be placed on the child,
                symbolizing purity and new life.
              </li>
            </ul>

            <div className='bg-white rounded-xl p-5 border-l-4 border-secondary'>
              <p className='font-secondary font-bold text-primary mb-2'>
                &ldquo;Faith, Hope, Love, and Baptism&rdquo;
              </p>
              <p className='mb-3'>
                After the Creed is professed, the priest asks the godfather three times:{' '}
                <em>&ldquo;What does this child request?&rdquo;</em>
              </p>
              <p className='italic mb-2'>
                &ldquo;Faith, hope, love, and baptism — to be baptized and justified, to be cleansed
                of sins, to be freed from demons, and to serve God.&rdquo;
              </p>
              <p className='text-sm text-gray-500 mb-3'>
                Armenian: <em>Havadk, hooys, ser, yev mgurdutyun</em>
              </p>
              <p>
                This echoes 1 Corinthians 13:13 — the three theological virtues of faith, hope, and
                love — joined with the explicit request for the sacrament itself. The priest responds:{' '}
                <em>&ldquo;Be it unto thee according to thy faith.&rdquo;</em>
              </p>
            </div>

            <p>
              The service is a <strong>public act</strong> of the community, welcoming the new
              member into the parish family.
            </p>
            <p>
              <strong>Timing:</strong> Traditionally, infants are baptized between the 8th and
              40th day after birth, though it can occur at any age. Adult baptisms are also
              performed.
            </p>
          </div>
        </div>
      </section>

      {/* The Role of Godparents */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            The Role of Godparents
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              The godfather — known in Armenian as the <strong>Kavor</strong> (<em>Gnkahayr</em>)
              — holds a central role in the rite, speaking on behalf of the child who cannot yet
              speak for themselves. Many parishes today welcome both a godfather and a godmother.
            </p>
            <p>
              For the ceremony, godparents typically provide ritual items: a cross and chain
              (blessed during the service), white towels, and a candle.
            </p>
            <p>
              Their commitment extends far beyond the day of baptism. Godparents pledge to support
              the child&apos;s faith throughout life — offering spiritual guidance, Christian
              example, and ongoing involvement in Church life. Godparenthood creates a lasting
              bond, akin to a second set of parents devoted to the child&apos;s spiritual
              formation.
            </p>
            <p>
              At least one godparent must be a baptized and chrismated member of the Armenian
              Apostolic Church; a second godparent, if named, should be a baptized Christian.
            </p>
          </div>
        </div>
      </section>

      {/* Practical Information */}
      <section className='px-primary py-12 bg-[#FFF5F2]'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            Practical Information for Families at St. Mary
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <ul className='list-disc pl-5 space-y-3'>
              <li>Schedule the baptism with the Pastor well in advance.</li>
              <li>
                Prepare items such as an Armenian-style cross and chain, white towels, and
                appropriate clothing.
              </li>
              <li>
                The ceremony is joyful and communal — family and friends are encouraged to
                participate.
              </li>
              <li>
                Post-baptism traditions include a special washing at home (often on the third day)
                with godparents present, where blessed water is respectfully returned to the earth.
              </li>
            </ul>
            <p>
              Baptism is not just a one-day event but the start of a lifelong journey of faith,
              supported by the parish community at St. Mary.
            </p>
          </div>
        </div>
      </section>

      {/* Why Baptism Matters */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            Why Baptism Matters for Our Parish
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              Through Baptism, we are united as one Body in Christ — past, present, and future
              members of the Armenian Apostolic Church. It connects us to the ancient faith of our
              forefathers, who first adopted Christianity as a nation in 301 AD, and to the
              universal Church.
            </p>
            <p>
              If you are expecting a child, considering baptism for yourself or a loved one, or
              simply want to learn more, please contact the Pastor at St. Mary. He will be happy to
              explain the sacrament in detail and guide you through the process.
            </p>
            <p className='italic text-center text-lg border-l-4 border-secondary pl-4'>
              &ldquo;As many of you as were baptized into Christ have clothed yourselves with
              Christ.&rdquo; (Galatians 3:27)
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className='px-primary py-12 bg-primary text-white text-center'>
        <h2 className='font-secondary font-bold text-2xl mb-4'>Ready to schedule a Baptism?</h2>
        <p className='text-gray-200 max-w-xl mx-auto mb-6'>
          Contact the parish office to speak with our Pastor and begin the process.
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
