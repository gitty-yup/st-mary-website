import Location from '@/assets/svgs/contact/location.svg';
import Email from '@/assets/svgs/contact/email.svg';
import Phone from '@/assets/svgs/contact/phone.svg';

interface Info {
  icon: string;
  text: string;
  type?: 'email' | 'phone';
  alt: string;
}

const contactInfo: Info[] = [
  {
    icon: Location,
    text: '148 22nd Street, Costa Mesa, CA 92627',
    alt: 'Address',
  },
  {
    icon: Email,
    text: 'info@stmaryarmenianchurch.com',
    type: 'email',
    alt: 'Email',
  },
  {
    icon: Phone,
    text: '(949) 650-8367',
    type: 'phone',
    alt: 'Phone',
  },
];

export default contactInfo;
