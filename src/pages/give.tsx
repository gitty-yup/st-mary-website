import AppLayout from '@/components/layout/AppLayout';
import Button from '@/common/Button';
import React from 'react';

export default function Give() {
  return (
    <AppLayout>
      <header className='giving-header-bg px-primary h-[205px] md:h-[305px] flex flex-col items-center justify-center text-center gap-3 text-white'>
        <p className='font-cursive text-secondary text-2xl'>Support Our Parish</p>
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>
          Give to St. Mary
        </h1>
        <p className='font-normal text-lg max-w-xl'>
          Your generosity sustains our spiritual mission and Armenian heritage
        </p>
      </header>

      {/* Overview */}
      <section className='px-primary py-16 bg-white'>
        <div className='max-w-4xl mx-auto text-center'>
          <p className='text-secondary font-cursive text-2xl mb-2'>Why We Give</p>
          <h2 className='text-primary font-secondary font-bold text-3xl mb-6'>Stewardship &amp; Giving</h2>
          <p className='text-gray-700 max-w-2xl mx-auto leading-relaxed mb-4'>
            The Armenian word for stewardship is <em>khanamardoutyoun</em> — the faithful care of the
            gifts God has entrusted to us. At St. Mary, your giving supports the Divine Liturgy, our
            ministries, our youth programs, our newly built campus, and charitable outreach in our community.
          </p>
          <p className='text-gray-700 max-w-2xl mx-auto leading-relaxed'>
            Every gift — large or small — is a blessing to our parish family and to the Armenian community
            of Orange County. We are deeply grateful for your generosity.
          </p>
        </div>
      </section>

      {/* Give Online */}
      <section className='px-primary py-16 bg-[#FFF5F2]'>
        <div className='max-w-4xl mx-auto'>
          <p className='text-secondary font-cursive text-2xl mb-2 text-center'>Give Online</p>
          <h2 className='text-primary font-secondary font-bold text-3xl mb-8 text-center'>Ways to Give</h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='bg-white rounded-2xl p-8 shadow-sm text-center'>
              <div className='text-4xl mb-4'>💳</div>
              <h3 className='font-secondary font-bold text-primary text-xl mb-3'>Tithe.ly</h3>
              <p className='text-gray-600 text-sm leading-relaxed mb-6'>
                Give securely online via credit card, debit card, or bank transfer. Set up a one-time
                or recurring gift — it takes less than 2 minutes.
              </p>
              <a
                href='https://give.tithe.ly/?formId=2b4b2f59-428d-46ab-9cd4-b151b1f12dab'
                target='_blank'
                rel='noreferrer'
              >
                <Button className='!w-full'>Give via Tithe.ly</Button>
              </a>
            </div>
            <div className='bg-white rounded-2xl p-8 shadow-sm text-center'>
              <div className='text-4xl mb-4'>📱</div>
              <h3 className='font-secondary font-bold text-primary text-xl mb-3'>Zelle</h3>
              <p className='text-gray-600 text-sm leading-relaxed mb-4'>
                Send your gift directly to the parish via Zelle.
              </p>
              <div className='text-sm text-gray-600 mb-4'>
                <p><strong>Zelle:</strong> info@stmaryarmenianchurch.com</p>
              </div>
              <img
                src='/images/zelle-qr.png'
                alt='Zelle QR Code'
                className='w-full max-w-[160px] mx-auto object-contain'
              />
            </div>
            <div className='bg-white rounded-2xl p-8 shadow-sm text-center'>
              <div className='text-4xl mb-4'>✉️</div>
              <h3 className='font-secondary font-bold text-primary text-xl mb-3'>By Mail</h3>
              <p className='text-gray-600 text-sm leading-relaxed mb-4'>
                Make checks payable to <strong>St. Mary Armenian Apostolic Church</strong> and mail to:
              </p>
              <address className='text-sm text-gray-700 not-italic'>
                148 22nd Street<br />
                Costa Mesa, CA 92627
              </address>
            </div>
          </div>
        </div>
      </section>

      {/* Giving Programs */}
      <section className='px-primary py-16 bg-white'>
        <div className='max-w-4xl mx-auto'>
          <p className='text-secondary font-cursive text-2xl mb-2'>Ways to Support</p>
          <h2 className='text-primary font-secondary font-bold text-3xl mb-8'>Giving Programs</h2>
          <div className='space-y-6'>
            {[
              {
                name: 'Stewardship',
                desc: 'Annual stewardship is the primary means by which parishioners support the ongoing life and ministries of the parish. We encourage you to set up a recurring gift — monthly or weekly — to make stewardship a consistent spiritual practice.',
              },
              {
                name: 'Angel Fund',
                desc: 'The Angel Fund supports charitable outreach to individuals and families in need within our parish community and the broader Armenian community. Your gift to the Angel Fund helps neighbors in crisis.',
              },
              {
                name: 'Memorial Donations',
                desc: 'Honor the memory of a loved one with a gift to St. Mary. Memorial donations may be designated for a specific purpose — the church, a ministry, or the Angel Fund.',
              },
              {
                name: 'Special Appeals',
                desc: 'Throughout the year, the parish issues special appeals for campus needs, mission projects, and Diocesan programs. Watch for announcements in the bulletin.',
              },
              {
                name: 'Parish Dues',
                desc: 'Parishioners in good standing are encouraged to maintain their annual membership through parish dues. Contact the office for information on rates and enrollment.',
              },
            ].map((item) => (
              <div key={item.name} className='border-l-4 border-secondary pl-6 py-2'>
                <h3 className='font-secondary font-bold text-primary text-lg mb-1'>{item.name}</h3>
                <p className='text-gray-700 leading-relaxed'>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact for Giving Questions */}
      <section className='px-primary py-12 bg-[#FFF5F2] text-center'>
        <p className='text-gray-700 mb-4'>
          Questions about giving, stewardship enrollment, or memorial gifts?
        </p>
        <a href='mailto:info@stmaryarmenianchurch.com'>
          <Button className='!w-[280px]'>Contact the Parish Office</Button>
        </a>
      </section>
    </AppLayout>
  );
}
