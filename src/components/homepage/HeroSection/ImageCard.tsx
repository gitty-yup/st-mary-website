import React from 'react';

function ImageCard({ image }: { image: string }) {
  return (
    <div className='w-[243px] min-h-[331px] relative overflow-hidden'>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt=''
        className='w-full h-full object-cover'
        loading='lazy'
      />
    </div>
  );
}

export default ImageCard;
