import Button from '@/common/Button';
import Link from 'next/link';
import React from 'react';

interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

const LatestNews = ({ posts }: { posts: Post[] }) => {
  if (posts.length === 0) return null;

  return (
    <section className='px-primary py-16 bg-[#FFF5F2]'>
      <div className='text-center mb-12'>
        <p className='text-secondary font-cursive text-2xl mb-2'>Stay Connected</p>
        <h2 className='text-primary font-secondary font-bold text-3xl lg:text-4xl'>
          Latest News &amp; Announcements
        </h2>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-10'>
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`}>
            <article className='bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full'>
              <p className='text-sm text-secondary mb-2'>
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
              <h3 className='font-secondary font-bold text-primary text-lg mb-3 leading-snug'>
                {post.title}
              </h3>
              <p className='text-gray-600 text-sm leading-relaxed'>{post.excerpt}</p>
            </article>
          </Link>
        ))}
      </div>
      <div className='text-center'>
        <Link href='/blog'>
          <Button className='!w-[220px]'>All News &amp; Posts</Button>
        </Link>
      </div>
    </section>
  );
};

export default LatestNews;
