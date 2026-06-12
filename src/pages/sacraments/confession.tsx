import AppLayout from '@/components/layout/AppLayout';
import Button from '@/common/Button';
import Link from 'next/link';
import React from 'react';

export default function ConfessionPage() {
  return (
    <AppLayout>
      <header className='worship-header-bg px-primary h-[205px] md:h-[305px] flex flex-col items-center justify-center text-center gap-3 text-white'>
        <p className='font-cursive text-secondary text-2xl'>The Sacred Mysteries</p>
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>
          Confession
        </h1>
        <p className='font-normal text-lg max-w-2xl'>The Mystery of Penance</p>
      </header>

      {/* Intro */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto text-gray-700 leading-relaxed space-y-4'>
          <blockquote className='border-l-4 border-secondary pl-5 italic text-gray-600 mb-6'>
            &ldquo;Let us search out and examine our ways, and turn back to the Lord.&rdquo;
            <footer className='mt-2 not-italic text-sm text-gray-500'>Lamentations 3:40</footer>
          </blockquote>
          <p>
            Most of us carry a weight of regret — errors made, relationships strained, the quiet
            hum of guilt that follows us through daily life. The longing for a clean slate, a true
            fresh start, is universal. In the Armenian Apostolic Church, this path to restoration is
            found in the <strong>Mystery of Confession</strong>, or Penance (
            <em>Abashkharootiun</em>).
          </p>
          <p>
            Far from being a ritual of shame, the Armenian tradition understands Confession as a
            Sacred Mystery of healing — an invitation from alienation back into communion. It is
            designed not for condemnation, but for the reclamation of the soul.
          </p>
        </div>
      </section>

      {/* You Never Lose Your Status */}
      <section className='px-primary py-12 bg-[#FFF5F2]'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            You Never Lose Your Status as a Child of God
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              A common spiritual anxiety holds that our failures can sever our relationship with
              God — that sin demotes us to a lesser standing before Him. The Armenian tradition,
              through its reading of the Parable of the Prodigal Son, reveals a different truth:
              your identity as a child of God is immutable.
            </p>
            <p>
              In the parable, the returning son has rehearsed a plea to be accepted back as a
              &ldquo;hired servant,&rdquo; believing his sins have stripped him of his sonship. But
              the father cuts him off before he can finish. He refuses to entertain the idea of a
              lower status — instead falling on his son&apos;s neck with an embrace that silences
              all self-deprecation.
            </p>
            <p>
              When the son sinned, he did not lose the essence of his identity. He remained his
              father&apos;s child. Confession, therefore, is not a negotiation for a lower rank. It
              is the courageous act of returning to the identity you never truly lost.
            </p>
          </div>
        </div>
      </section>

      {/* Apostolic Succession */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            The Breath of Apostolic Succession
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              The authority of an Armenian priest to grant absolution is not a mere administrative
              function. It is a living transmission known as Apostolic Succession — a power that
              traces directly to the Upper Room following the Resurrection, where the risen Christ
              appeared to His Apostles, breathed on them, and said:
            </p>
            <blockquote className='border-l-4 border-secondary pl-5 italic text-gray-600'>
              &ldquo;Receive the Holy Spirit. If you forgive the sins of any, they are
              forgiven.&rdquo;
              <footer className='mt-2 not-italic text-sm text-gray-500'>John 20:22–23</footer>
            </blockquote>
            <p>
              In the Armenian Church, this is an unbroken, living lineage. Every priest was ordained
              by a bishop who received the same transmission from his predecessor, in a chain
              reaching back to the Holy Apostles Thaddeus and Bartholomew — the first to illuminate
              the Armenian land. When a priest offers the prayer of absolution, he exercises the
              same authority granted by Christ in that Upper Room. It is a tangible link to the
              primordial moment of Christian forgiveness.
            </p>
          </div>
        </div>
      </section>

      {/* History and the Genocide */}
      <section className='px-primary py-12 bg-[#FFF5F2]'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            How History Shaped Our Practice
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              To most Armenian faithful today, &ldquo;confession&rdquo; means the collective prayer
              of <em>Megha Asdoodzoh</em> — recited publicly before receiving Holy Communion. But
              this is actually an abbreviated form of a much deeper tradition. Historically, the
              Armenian Church practiced <strong>private confession</strong> as the primary vehicle
              for spiritual healing and direction.
            </p>
            <p>
              The shift toward the public form was a consequence of the Armenian Genocide. The
              catastrophic loss of clergy during the massacres left surviving priests with the
              impossible task of ministering to vast, displaced populations. To ensure the spiritual
              survival of the people, the Church came to rely on the public, shortened version based
              on St. Ephraim the Syrian&apos;s ten confessional statements.
            </p>
            <p>
              Today, there is a growing rediscovery of private confession — the fuller, richer form
              of this Mystery — as a necessary response to the complex spiritual and psychological
              needs of a resilient people returning to their roots.
            </p>
          </div>
        </div>
      </section>

      {/* The Priest as Mountain Guide */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            The Priest as Guide, Not Judge
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              To understand the priest&apos;s role in Confession, think of a mountain guide on a
              difficult ascent. The summit — <em>theosis</em>, or union with Christ — is the
              destination, and the path is treacherous to navigate alone. The priest is a spiritual
              director who has traversed this terrain before.
            </p>
            <p>
              Crucially, in the Armenian tradition, the priest is bound by an absolute vow of
              confidentiality. His role is to be a witness and a vessel, not a judge. He acts{' '}
              <em>in persona Christi</em> — in the person of Christ — representing the forgiveness
              that has already been won. He provides the sacred space for the penitent to bring
              their inner darkness into the light of God&apos;s mercy, without fear of human
              reprisal.
            </p>
            <div className='bg-[#FFF5F2] rounded-xl p-5 border-l-4 border-secondary'>
              <p className='italic text-gray-600'>
                &ldquo;The priest is acting in his capacity as a witness to the forgiveness Christ
                has given. He stands in that place to give the penitent the opportunity to express
                themselves, acting as a guide toward the peak of spiritual health.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Eschatological Reset */}
      <section className='px-primary py-12 bg-[#FFF5F2]'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            Confession as a Preemptive Reset
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              One of the most striking insights of Armenian theology is the concept of
              &ldquo;judging oneself&rdquo; in the present to preempt the judgment of the future.
              The Church teaches that at the Second Coming, all things will be revealed in the light
              of Truth. But the Mystery of Confession acts as a temporal reset.
            </p>
            <p>
              By looking into the &ldquo;mirror of the commandments&rdquo; today and confessing our
              sins, we essentially erase them from the final record. Sins confessed and absolved in
              the present cease to exist — they will not be there to be judged when Christ returns.
              It is a proactive, life-giving way to ensure that when we stand before the Creator, He
              finds a soul already reconciled and a heart already made clean.
            </p>
          </div>
        </div>
      </section>

      {/* How to Prepare */}
      <section className='px-primary py-12 bg-white'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>How to Prepare</h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              Confession requires no spiritual perfection beforehand — only honesty and the
              willingness to turn. Here is how to prepare:
            </p>
            <ul className='list-disc pl-5 space-y-3'>
              <li>
                <strong>Self-examination</strong> — Reflect quietly on your conscience, using the
                Ten Commandments as a mirror. Ask honestly: where have I fallen short in my
                relationship with God and with others?
              </li>
              <li>
                <strong>Repentance</strong> — Approach with a sincere desire to change, not merely
                to feel better. True repentance is <em>Abashkharel</em> — a U-turn of the soul away
                from sin and toward the Light.
              </li>
              <li>
                <strong>Honest confession</strong> — Speak freely and without fear. The priest is
                bound by absolute confidentiality, and his only purpose is to be a witness to
                God&apos;s mercy.
              </li>
              <li>
                <strong>Commitment to growth</strong> — Resolve, with God&apos;s help, to turn away
                from what has separated you from Him. Confession restores the grace of Baptism;
                growth in holiness is the fruit of that restoration.
              </li>
            </ul>
            <blockquote className='border-l-4 border-secondary pl-5 italic text-gray-600 mt-2'>
              &ldquo;As you look into the mirror of the commandments, do not search for reasons to
              feel shame. Search instead for the Child of God waiting to be revealed. The Father is
              not waiting to judge you — He is already running down the road to meet you, eager to
              begin the celebration of your return.&rdquo;
            </blockquote>
          </div>
        </div>
      </section>

      {/* Confession at St. Mary */}
      <section className='px-primary py-12 bg-[#FFF5F2]'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
            Confession at St. Mary
          </h2>
          <div className='text-gray-700 leading-relaxed space-y-4'>
            <p>
              Confession is available at St. Mary Armenian Apostolic Church in two forms:
            </p>
            <ul className='list-disc pl-5 space-y-3'>
              <li>
                <strong>Public Confession</strong> (<em>Megha Asdoodzoh</em>) is offered before
                every Sunday Badarak as part of the regular liturgy.
              </li>
              <li>
                <strong>Private Confession</strong> is available by appointment with the Pastor.
                This is the fuller, more personal form of the sacrament, offering an opportunity for
                spiritual direction, deeper reflection, and individual absolution.
              </li>
            </ul>
            <p>
              To schedule a private confession, please contact the parish office. All confessions
              are held in strict confidence.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className='px-primary py-12 bg-primary text-white text-center'>
        <h2 className='font-secondary font-bold text-2xl mb-4'>
          The Father is already running to meet you.
        </h2>
        <p className='text-gray-200 max-w-xl mx-auto mb-6'>
          Contact the parish office to speak with our Pastor or to arrange a private confession.
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
