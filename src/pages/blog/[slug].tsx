import AppLayout from '@/components/layout/AppLayout';
import Button from '@/common/Button';
import { GetStaticPaths, GetStaticProps } from 'next';
import matter from 'gray-matter';
import { marked } from 'marked';
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
      <header className='blog-header-bg px-primary h-[180px] md:h-[240px] flex flex-col items-center justify-center text-center gap-2 text-white'>
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
          <style>{`
            .photo-grid { display:grid; gap:8px; margin:24px 0; }
            .photo-grid-1 { grid-template-columns:1fr; max-width:640px; margin-left:auto; margin-right:auto; }
            .photo-grid-2 { grid-template-columns:repeat(2,1fr); }
            .photo-grid-3 { grid-template-columns:repeat(3,1fr); }
            .photo-grid-4 { grid-template-columns:repeat(4,1fr); }
            @media(max-width:640px){
              .photo-grid-3,.photo-grid-4 { grid-template-columns:repeat(2,1fr); }
            }
            .photo-grid a { display:block; aspect-ratio:1; overflow:hidden; border-radius:8px; }
            .photo-grid img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .2s; }
            .photo-grid a:hover img { transform:scale(1.04); }
          `}</style>
          <article
            className='prose prose-lg max-w-none text-gray-700 leading-relaxed
              [&_picture]:contents [&_img]:rounded-xl [&_img]:my-4 [&_img]:max-w-full
              [&_a.tap-to-open]:block [&_a.tap-to-open]:cursor-zoom-in
              [&_a]:text-secondary [&_a]:underline
              [&_h2]:text-primary [&_h2]:font-secondary [&_h2]:text-2xl [&_h2]:mt-8 [&_h2]:mb-4
              [&_h3]:text-primary [&_h3]:font-secondary
              [&_iframe]:w-full [&_iframe]:rounded-xl [&_iframe]:my-4
              [&_.photo-grid_a]:no-underline [&_.photo-grid_img]:my-0 [&_.photo-grid_img]:rounded-none'
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

/**
 * Images added through the blog editor or the newsletter import (/media/uploads) have a
 * smaller WebP copy made at build time (scripts/upload-webp.js): browsers are offered it,
 * with the original as the fallback. An image that isn't already a link opens the full
 * original when tapped (to read a flyer's small print). Images after the first load as
 * the reader scrolls to them.
 */
function smallerImages(html: string): string {
  let seen = 0;
  let inLink = 0;
  return html.replace(/<a\b[^>]*>|<\/a\s*>|<img\b[^>]*>/gi, (tag) => {
    if (/^<a\b/i.test(tag)) {
      inLink++;
      return tag;
    }
    if (/^<\/a/i.test(tag)) {
      inLink = Math.max(0, inLink - 1);
      return tag;
    }
    const first = seen++ === 0;
    let img = tag;
    if (!first && !/\sloading=/i.test(img)) img = img.replace(/^<img\b/i, '<img loading="lazy" decoding="async"');
    const original = /\ssrc=(["'])([^"']+)\1/i.exec(img)?.[2];
    const upload = original && /^\/media\/uploads\/[^?#]+\.(?:png|jpe?g)$/i.test(original) ? original : null;
    let shown = img;
    if (upload) {
      try {
        const file = decodeURI(upload);
        if (fs.existsSync(path.join(process.cwd(), 'public', `${file}.webp`))) {
          shown = `<picture><source type="image/webp" srcset="${encodeURI(file)}.webp">${img}</picture>`;
        }
      } catch {
        // A malformed address: show the image as it is.
      }
    }
    if (inLink || !original) return shown;
    return `<a href="${original.replace(/"/g, '&quot;')}" target="_blank" rel="noopener" class="tap-to-open">${shown}</a>`;
  });
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
  // If content looks like markdown (not HTML), run it through marked
  const isHtml = content.trimStart().startsWith('<');
  const renderedContent = isHtml ? content : await marked(content);

  return {
    props: {
      title: data.title || slug,
      date: data.date instanceof Date ? data.date.toISOString().slice(0, 10) : (data.date ? String(data.date) : ''),
      author: data.author || '',
      content: smallerImages(renderedContent),
    },
  };
};
