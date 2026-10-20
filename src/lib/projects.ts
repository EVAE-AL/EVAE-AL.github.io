import { getCollection, type CollectionEntry } from 'astro:content';

export interface PreparedProject {
  id: string;
  data: CollectionEntry<'projects'>['data'];
  body: string;
  /** 原始集合条目，供 render() 使用 */
  entry: CollectionEntry<'projects'>;
}

/** 状态元数据：中文名与标记色 */
export const statusMeta = {
  active: { label: '进行中', dot: 'bg-seal' },
  done: { label: '已完成', dot: 'bg-brand-600' },
  archived: { label: '已归档', dot: 'bg-ink-mute' },
} as const;

/**
 * 取全部作品并排序：
 * 精选优先 → order 升序 → 日期倒序
 */
export async function getSortedProjects(): Promise<PreparedProject[]> {
  const entries = await getCollection('projects', ({ data }) => !data.draft);

  return entries
    .map((entry) => ({
      id: entry.id,
      data: entry.data,
      body: entry.body ?? '',
      entry,
    }))
    .sort((a, b) => {
      if (a.data.featured !== b.data.featured) return a.data.featured ? -1 : 1;
      if (a.data.order !== b.data.order) return a.data.order - b.data.order;
      const da = a.data.date?.getTime() ?? 0;
      const db = b.data.date?.getTime() ?? 0;
      return db - da;
    });
}

/** 收集全部技术栈及出现次数，按次数倒序 */
export function collectStack(projects: PreparedProject[]) {
  const map = new Map<string, number>();
  for (const project of projects) {
    for (const item of project.data.stack ?? []) {
      map.set(item, (map.get(item) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
}
