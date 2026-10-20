/** 分类元数据：中文名与题字（char 用于卡片封面的大字） */
export const categories = {
  tech: { label: '技术', char: '技' },
  life: { label: '生活', char: '生' },
  note: { label: '随笔', char: '笔' },
} as const;

export type CategoryKey = keyof typeof categories;

export function categoryOf(key: string) {
  return categories[key as CategoryKey] ?? categories.note;
}
