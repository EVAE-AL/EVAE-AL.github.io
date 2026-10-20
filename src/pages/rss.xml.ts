import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getSortedPosts } from '../lib/posts';
import site from '../lib/site';

export async function GET(context: APIContext) {
  const posts = await getSortedPosts();

  return rss({
    title: site.site.title,
    description: site.site.description,
    site: context.site ?? 'https://EVAE-AL.github.io',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
      categories: post.data.tags ?? [],
      author: site.author.name,
    })),
    customData: `<language>${site.site.lang}</language>`,
  });
}
