import AppLayout from '@/components/layout/AppLayout';
import Button from '@/common/Button';
import { GetStaticProps } from 'next';
import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import React from 'react';

interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

interface BlogProps {
  posts: Post[];
}

export default function Blog({ posts }: BlogProps) {
  return (
    <AppLayout>
      <header className='blog-header-bg px-primary h-[205px] md:h-[305px] flex flex-col items-center justify-center text-center gap-3 text-white'>
        <p className='font-cursive text-secondary text-2xl'>Stay Connected</p>
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>
          News &amp; Announcements
        </h1>
        <p className='font-normal text-lg'>Parish news from 2010 to present</p>
      </header>

      <section className='px-primary py-16 bg-white'>
        <div className='max-w-4xl mx-auto'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <article className='bg-[#FFF5F2] rounded-2xl p-6 hover:shadow-md transition-shadow cursor-pointer h-full'>
                  <p className='text-sm text-secondary mb-2'>
                    {new Date(post.date + 'T12:00:00').toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <h2 className='font-secondary font-bold text-primary text-lg mb-3 leading-snug'>
                    {post.title}
                  </h2>
                  <p className='text-gray-600 text-sm leading-relaxed'>{post.excerpt}</p>
                  <span className='inline-block mt-4 text-secondary text-sm font-medium'>
                    Read more →
                  </span>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const postsDir = path.join(process.cwd(), 'content', 'blog');
  const files = fs.readdirSync(postsDir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .reverse();

  const posts: Post[] = files.map((filename) => {
    const raw = fs.readFileSync(path.join(postsDir, filename), 'utf-8');
    const { data, content } = matter(raw);
    const plainText = content.replace(/<[^>]+>/g, '').replace(/[#*[\]()]/g, '').trim();
    const excerpt = plainText.slice(0, 180) + (plainText.length > 180 ? '…' : '');
    return {
      slug: filename.replace('.md', ''),
      title: data.title || filename,
      date: data.date ? String(data.date).slice(0, 10) : '',
      excerpt,
    };
  });

  return { props: { posts } };
};
