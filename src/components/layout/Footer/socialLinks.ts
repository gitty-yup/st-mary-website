import FacebookIcon from '@/assets/svgs/social/facebook.svg';

interface Link {
  alt: string;
  src: string;
  destination: string;
}

const socialLinks: Link[] = [
  {
    alt: 'Facebook Page',
    src: FacebookIcon,
    destination: 'https://m.facebook.com/profile.php?id=100064722127342',
  },
];

export default socialLinks;
