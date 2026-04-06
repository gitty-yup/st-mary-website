import { StaticImageData } from 'next/image';
import Giving from '../../../assets/images/home/links/giving.webp';
import Message from '../../../assets/images/home/links/message.webp';
import Testimony from '../../../assets/images/home/links/testimony.webp';

export interface LinkType {
  image: StaticImageData;
  label: string;
  description: string;
  buttonLabel: string;
  href: string;
}

const links: LinkType[] = [
  {
    label: 'Worship',
    image: Message,
    description: 'Join us for the Divine Liturgy (Badarak) every Sunday at 10:30 AM.',
    buttonLabel: 'Plan Your Visit',
    href: '/worship',
  },
  {
    label: 'Parish Life',
    image: Testimony,
    description: 'Explore our ministries, youth programs, and parish organizations.',
    buttonLabel: 'Get Involved',
    href: '/parish-life',
  },
  {
    label: 'Give',
    image: Giving,
    description: 'Support St. Mary through stewardship, Tithe.ly, or the Angel Fund.',
    buttonLabel: 'Support Our Parish',
    href: '/give',
  },
];

export default links;
