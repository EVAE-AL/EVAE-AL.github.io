import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// 部署到 GitHub Pages 时，把 site 改成你的实际地址：
//   用户主页仓库（<用户名>.github.io）  -> https://<用户名>.github.io
//   项目仓库（如 my-blog）              -> https://<用户名>.github.io/my-blog
// 项目仓库时还需要同时设置 base: '/my-blog'。
export default defineConfig({
  // 用户主页仓库（EVAE-AL.github.io）部署在域名根路径，不需要 base。
  site: 'https://EVAE-AL.github.io',
  // base: '/my-blog',

  integrations: [sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },

  markdown: {
    shikiConfig: {
      // 代码高亮：选素净的主题以贴合水墨风，深浅色模式各一套。
      // 换主题可参考 https://shiki.style/themes
      themes: {
        light: 'min-light',
        dark: 'min-dark',
      },
      wrap: true,
    },
  },
});
