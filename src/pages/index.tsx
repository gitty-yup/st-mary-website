import AppLayout from '@/components/layout/AppLayout';
import DirectionSection from '@/components/homepage/DirectionSection';
import HeroSection from '@/components/homepage/HeroSection';
import WelcomeSection from '@/components/homepage/WelcomeSection';
import LinkSection from '@/components/homepage/LinkSection';
import ParishLifeHighlights from '@/components/homepage/ParishLifeHighlights';
import FacilitiesPromo from '@/components/homepage/FacilitiesPromo';
import GivingSection from '@/components/homepage/GivingSection';
import LatestNews from '@/components/homepage/LatestNews';
import { GetStaticProps } from 'next';
import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';

interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

interface HomeProps {
  latestPosts: Post[];
}

export default function Home({ latestPosts }: HomeProps) {
  return (
    <AppLayout>
      <HeroSection />
      <WelcomeSection />
      <LinkSection />
      <ParishLifeHighlights />
      <FacilitiesPromo />
      <GivingSection />
      <LatestNews posts={latestPosts} />
      <DirectionSection />
    </AppLayout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const postsDir = path.join(process.cwd(), 'content', 'blog');
  let latestPosts: Post[] = [];

  if (fs.existsSync(postsDir)) {
    const files = fs.readdirSync(postsDir)
      .filter(f => f.endsWith('.md'))
      .sort()
      .reverse()
      .slice(0, 3);

    latestPosts = files.map((filename) => {
      const raw = fs.readFileSync(path.join(postsDir, filename), 'utf-8');
      const { data, content } = matter(raw);
      const excerpt = content.replace(/[#*[\]()]/g, '').trim().slice(0, 150) + '…';
      return {
        slug: filename.replace('.md', ''),
        title: data.title || filename,
        date: data.date instanceof Date ? data.date.toISOString().slice(0, 10) : (data.date ? String(data.date) : ''),
        excerpt,
      };
    });
  }

  return { props: { latestPosts } };
};
