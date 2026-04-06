import dynamic from 'next/dynamic';
import React from 'react';
import IntroSection from './IntroSection';
import LoadingIndicator from '@/common/LoadingIndicator/LoadingIndicator';

const DynamicGallery = dynamic(() => import('./GallerySection'), {
  loading: () => (
    <div className='flex items-center justify-center'>
      <LoadingIndicator />
    </div>
  ),
});

function HeroSection() {
  return (
    <header className='bg-[#FFF2EE] h-full lg:h-[calc(100vh-96px)]'>
      <div className='flex justify-between h-full overflow-hidden lg:flex-row flex-col-reverse items-center'>
        <div className='hidden lg:block'>
          <IntroSection />
        </div>
        <DynamicGallery />
      </div>
      <div className='lg:hidden flex justify-center mt-4'>
        <IntroSection />
      </div>
    </header>
  );
}

export default HeroSection;
