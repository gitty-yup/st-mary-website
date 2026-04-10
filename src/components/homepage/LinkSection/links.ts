export interface LinkType {
  image: string;
  label: string;
  description: string;
  buttonLabel: string;
  href: string;
}

const links: LinkType[] = [
  {
    label: 'Worship',
    image: '/hero/worship.jpg',
    description: 'Join us for the Divine Liturgy (Badarak) every Sunday at 10:30 AM.',
    buttonLabel: 'Plan Your Visit',
    href: '/worship',
  },
  {
    label: 'Parish Life',
    image: '/hero/parish-life.jpg',
    description: 'Explore our ministries, youth programs, and parish organizations.',
    buttonLabel: 'Get Involved',
    href: '/parish-life',
  },
  {
    label: 'Give',
    image: '/hero/give.jpg',
    description: 'Support St. Mary through stewardship, Tithe.ly, or the Angel Fund.',
    buttonLabel: 'Support Our Parish',
    href: '/give',
  },
];

export default links;
