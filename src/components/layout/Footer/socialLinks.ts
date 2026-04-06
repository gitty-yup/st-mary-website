import FacebookIcon from '@/assets/svgs/social/facebook.svg';
import InstagramIcon from '@/assets/svgs/social/instagram.svg';

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
  {
    alt: 'Instagram Profile',
    src: InstagramIcon,
    destination: 'https://www.instagram.com/stmaryarmenianchurch/',
  },
];

export default socialLinks;
