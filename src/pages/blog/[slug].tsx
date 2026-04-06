import AppLayout from '@/components/layout/AppLayout';
import Button from '@/common/Button';
import { GetStaticPaths, GetStaticProps } from 'next';
import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import React from 'react';

interface PostProps {
  title: string;
  date: string;
  author: string;
  content: string;
}

export default function BlogPost({ title, date, author, content }: PostProps) {
  const formattedDate = date
    ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <AppLayout>
      <header className='about-header-bg px-primary h-[180px] md:h-[240px] flex flex-col items-center justify-center text-center gap-2 text-white'>
        <p className='text-sm text-secondary'>{formattedDate}</p>
        <h1 className='font-secondary font-bold text-xl md:text-[28px] lg:text-[36px] max-w-3xl'>
          {title}
        </h1>
        {author && author !== 'St. Mary' && (
          <p className='text-sm text-gray-300'>By {author}</p>
        )}
      </header>

      <section className='px-primary py-16 bg-white'>
        <div className='max-w-3xl mx-auto'>
          <article
            className='prose prose-lg max-w-none text-gray-700 leading-relaxed
              [&_img]:rounded-xl [&_img]:my-4 [&_img]:max-w-full
              [&_a]:text-secondary [&_a]:underline
              [&_h2]:text-primary [&_h2]:font-secondary
              [&_h3]:text-primary [&_h3]:font-secondary
              [&_iframe]:w-full [&_iframe]:rounded-xl [&_iframe]:my-4'
            dangerouslySetInnerHTML={{ __html: content }}
          />

          <div className='mt-12 pt-8 border-t border-gray-200 flex justify-between items-center'>
            <Link href='/blog'>
              <Button className='!w-[180px] !bg-transparent !text-primary !border-primary !border-2 hover:!bg-primary hover:!text-white'>
                ← All Posts
              </Button>
            </Link>
            <Link href='/contact'>
              <Button className='!w-[180px]'>Contact Us</Button>
            </Link>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const postsDir = path.join(process.cwd(), 'content', 'blog');
  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md'));
  const paths = files.map((f) => ({ params: { slug: f.replace('.md', '') } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const filePath = path.join(process.cwd(), 'content', 'blog', `${slug}.md`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  return {
    props: {
      title: data.title || slug,
      date: data.date || '',
      author: data.author || '',
      content,
    },
  };
};
