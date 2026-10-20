import { site as siteInfo, author, nav, social, footer } from '../config';

/** 站点全局配置的统一访问入口 */
const config = {
  site: siteInfo,
  author,
  nav,
  social,
  footer,
};

export default config;

export interface SiteConfig {
  site: typeof siteInfo;
  author: typeof author;
  nav: typeof nav;
  social: typeof social;
  footer: typeof footer;
}

/** 相对路径拼接（适配 GitHub Pages 的 base） */
export function withBase(path: string): string {
  if (/^(https?:)?\/\//.test(path) || path.startsWith('mailto:') || path.startsWith('#')) {
    return path;
  }
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** 格式化日期为 2026 年 10 月 8 日 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Shanghai',
  }).format(date);
}

/** 机器可读日期 2026-10-08 */
export function isoDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Shanghai',
  }).format(date);
}

/** 中文阅读时长估算：约 350 字/分钟 */
export function readingTime(text: string): number {
  const chars = text.replace(/\s+/g, '').length;
  return Math.max(1, Math.round(chars / 350));
}
