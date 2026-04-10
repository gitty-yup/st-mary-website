import React from 'react';

function LogoSection() {
  return (
    <div className="text-white flex-col">
      <p className="font-secondary font-bold text-2xl mb-2 text-secondary">St. Mary</p>
      <p className="font-secondary font-semibold text-lg mb-4">Armenian Apostolic Church</p>
      <p className="font-normal mt-2 mb-[27px] text-sm leading-relaxed">
        A community of faith rooted in the ancient Armenian Apostolic tradition,
        worshipping and serving the Armenian community of Orange County since 1985.
      </p>
      <p className="text-sm text-gray-400 mt-2">Sunday Badarak: 10:30 AM</p>
      <p className="text-sm text-gray-400">148 22nd Street, Costa Mesa, CA</p>
    </div>
  );
}

export default LogoSection;
