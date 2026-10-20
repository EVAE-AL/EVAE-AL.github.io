import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    /** 分类：tech | life | note，用于首页筛选与卡片配色 */
    category: z.enum(['tech', 'life', 'note']).default('note'),
    /** 封面图：放 public/ 下或外部链接；留空则使用渐变占位 */
    cover: z.string().optional(),
    /** 设为 true 则构建时不显示 */
    draft: z.boolean().default(false),
    /** 置顶 */
    featured: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    /** 一句话定位，如「静态博客主题」 */
    role: z.string().optional(),
    /** 完成时间，用于排序与展示 */
    date: z.coerce.date().optional(),
    /** 技术栈标签 */
    stack: z.array(z.string()).default([]),
    /** 封面图：放 public/ 下或外部链接；留空则用墨色占位 */
    cover: z.string().optional(),
    /** 在线预览地址 */
    link: z.string().optional(),
    /** 源码地址 */
    repo: z.string().optional(),
    /** 状态：active 进行中 | done 已完成 | archived 已归档 */
    status: z.enum(['active', 'done', 'archived']).default('done'),
    /** 设为 true 会排到最前并在首页精选区展示 */
    featured: z.boolean().default(false),
    /** 排序权重，数字小的在前；相同则按日期倒序 */
    order: z.number().default(0),
    /** 设为 true 则构建时不显示 */
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, projects };
