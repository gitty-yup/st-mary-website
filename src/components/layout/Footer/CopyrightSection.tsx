import React from 'react';

function CopyrightSection() {
  return (
    <div className='bg-[#272727] p-5 text-center text-white text-sm font-normal mt-[71px]'>
      &copy; {new Date().getFullYear()} St. Mary Armenian Apostolic Church &mdash; Costa Mesa, CA
    </div>
  );
}

export default CopyrightSection;
