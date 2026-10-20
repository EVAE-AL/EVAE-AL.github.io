/**
 * ============================================================
 *  站点全局配置 —— 你只需要改这一个文件
 * ============================================================
 */

export interface SocialLink {
  name: string;
  url: string;
  /** 可选图标：github | mail | rss | twitter | link */
  icon: string;
}

export const site = {
  /** 站点标题：显示在浏览器标签、首页大标题、页脚 */
  title: '墨迹',
  /** 首页副标题 / 一句话简介 */
  tagline: '记录技术、生活，以及那些值得反复想起的瞬间',
  /** 站点描述：用于 SEO 与社交分享 */
  description: '一个用 Astro 搭建的个人博客，写技术笔记，也写生活随笔。',
  /** 语言 */
  lang: 'zh-CN',
};

export const author = {
  /** 你的名字或昵称：署名、关于页 */
  name: 'EVIL DEMON',
  /** 短签名：作者卡片里的一句话 */
  tagline: '写代码，也写生活',
  /** 关于页的一段自我介绍：数组里每一项是一个段落 */
  bio: [
    '你好，我是 EVIL DEMON。',
    '这里是我的个人博客，用来存放一些想法、笔记和生活的切片。',
    '相信长期主义，也相信把一件事写清楚本身就是一种理解。',
  ],
  /** 头像：把图片放到 public/ 目录后填写文件名（如 "/avatar.jpg"）；留空则不显示 */
  avatar: '',
};

/** 导航栏 */
export const nav = [
  { name: '首页', url: '/' },
  { name: '作品', url: '/works' },
  { name: '归档', url: '/archive' },
  { name: '标签', url: '/tags' },
  { name: '关于', url: '/about' },
];

/** 社交链接：不需要的直接删掉整项 */
export const social: SocialLink[] = [
  { name: 'GitHub', url: 'https://github.com/', icon: 'github' },
  { name: 'Email', url: 'mailto:hello@example.com', icon: 'mail' },
  { name: 'RSS', url: '/rss.xml', icon: 'rss' },
];

export const footer = {
  copyright: 'EVIL DEMON',
  /** 备案号等，留空则不显示 */
  icp: '',
};
