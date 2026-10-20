import { getCollection, type CollectionEntry } from 'astro:content';
import { readingTime } from './site';

export interface PreparedPost {
  id: string;
  data: CollectionEntry<'blog'>['data'];
  body: string;
  readingMinutes: number;
  /** 原始集合条目，供 render() 使用 */
  entry: CollectionEntry<'blog'>;
}

/** 取全部已发布文章，按时间倒序，并计算阅读时长 */
export async function getSortedPosts(): Promise<PreparedPost[]> {
  const entries = await getCollection('blog', ({ data }) => !data.draft);

  return entries
    .map((entry) => ({
      id: entry.id,
      data: entry.data,
      body: entry.body ?? '',
      readingMinutes: readingTime(entry.body ?? ''),
      entry,
    }))
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

/** 收集全部标签及文章数，按文章数倒序 */
export function collectTags(posts: PreparedPost[]) {
  const map = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags ?? []) {
      map.set(tag, (map.get(tag) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
}

/** 按年份分组，用于归档页 */
export function groupByYear(posts: PreparedPost[]) {
  const map = new Map<number, PreparedPost[]>();
  for (const post of posts) {
    const year = post.data.pubDate.getFullYear();
    if (!map.has(year)) map.set(year, []);
    map.get(year)!.push(post);
  }
  return [...map.entries()]
    .map(([year, items]) => ({ year, posts: items }))
    .sort((a, b) => b.year - a.year);
}

/** 找到上下篇（基于已排序列表） */
export function findNeighbors(posts: PreparedPost[], id: string) {
  const index = posts.findIndex((p) => p.id === id);
  return {
    prev: index > 0 ? posts[index - 1] : undefined,
    next: index >= 0 && index < posts.length - 1 ? posts[index + 1] : undefined,
  };
}

/** 简单相关文章：标签重合度优先，不足则用同分类补齐 */
export function findRelated(posts: PreparedPost[], current: PreparedPost, limit = 3) {
  const currentTags = new Set(current.data.tags ?? []);

  return posts
    .filter((p) => p.id !== current.id)
    .map((p) => {
      const shared = (p.data.tags ?? []).filter((t) => currentTags.has(t)).length;
      const sameCategory = p.data.category === current.data.category ? 1 : 0;
      return { post: p, score: shared * 2 + sameCategory };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.post.data.pubDate.getTime() - a.post.data.pubDate.getTime())
    .slice(0, limit)
    .map((item) => item.post);
}
