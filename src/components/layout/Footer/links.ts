interface SubLinks {
  name: string;
  destination: string;
  external?: boolean;
}

interface Link {
  heading: { title: string; subLinks: SubLinks[] };
}

const links: Link[] = [
  {
    heading: {
      title: 'About',
      subLinks: [
        { name: 'Our History', destination: '/about#history' },
        { name: 'Parish Priest', destination: '/about#clergy' },
        { name: 'Parish Council', destination: '/about#council' },
        { name: 'Our Diocese', destination: 'https://www.westerndiocese.org', external: true },
      ],
    },
  },
  {
    heading: {
      title: 'Worship & Life',
      subLinks: [
        { name: 'Divine Liturgy', destination: '/worship' },
        { name: 'Parish Life', destination: '/parish-life' },
        { name: 'Events', destination: '/events' },
        { name: 'Facilities', destination: '/facilities' },
      ],
    },
  },
  {
    heading: {
      title: 'Connect',
      subLinks: [
        { name: 'Contact Us', destination: '/contact' },
        { name: 'Give Online', destination: '/give' },
        { name: 'Blog', destination: '/blog' },
      ],
    },
  },
];

export default links;
