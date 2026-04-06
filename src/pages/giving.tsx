import { GetServerSideProps } from 'next';

// Redirect /giving to /give
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: { destination: '/give', permanent: true },
  };
};

export default function GivingRedirect() {
  return null;
}
