# 墨迹

一个用 **Astro 5 + Tailwind CSS 4** 构建的个人博客。全站静态生成，内容以 Markdown 编写，写技术笔记，也写生活随笔。

视觉上是**水墨风**：宣纸底、墨分五色、朱红点睛，全屏背景视频，深浅两套主题。

**线上地址：<https://evae-al.github.io/>**（GitHub Pages，推送到 `main` 自动部署）

站点名与作者名是占位（`墨迹` / `EVIL DEMON`），改 [`src/config.ts`](src/config.ts) 一个文件即可换成你自己的。

---

## 快速开始

```bash
# 安装依赖
npm install

# 开发服务器（热更新）→ http://localhost:4321
npm run dev

# 构建生产版本到 dist/
npm run build

# 预览构建结果 → http://localhost:4321
npm run preview
```

> **首次 `npm install` 报 `EPERM`** 时改用：
> `npm install --ignore-scripts --cache ./.npm-cache`

**依赖只有 6 个**，故意保持精简：`astro`、`tailwindcss`、`@tailwindcss/vite`、`@astrojs/rss`、`@astrojs/sitemap`、`ogl`。
没有引入 React / Vue —— 作品页的环形画廊是用原生 JS 直接调 `ogl` 写的。

> ⚠️ `npm run check` 需要**额外安装** `@astrojs/check`（目前未装，直接跑会报错）。
> 如果不想加依赖，就忽略这个脚本，用 `npm run build` 来保证类型与构建正确。

---

## 目录结构

```
.
├── astro.config.mjs              # Astro 配置（站点地址、base、代码高亮主题）
├── HANDOVER.md                   # ⭐ 工程交接文档：每个视觉决策的原因、踩过的坑、测量方法
├── src/
│   ├── config.ts                 # ⭐ 站点全局配置：标题、作者、导航、社交链接
│   ├── content.config.ts         # 文章与作品的字段定义与校验（zod）
│   ├── content/blog/             # ⭐ 所有文章（Markdown）
│   ├── content/projects/         # ⭐ 所有作品（Markdown）
│   ├── layouts/
│   │   └── BaseLayout.astro      # 全站骨架：SEO、OG、主题脚本、背景视频、页头页脚
│   ├── components/
│   │   ├── Header.astro          # 顶部导航（移动端菜单 + 滚动后渐隐纸色底）
│   │   ├── Footer.astro          # 页脚
│   │   ├── Hero.astro            # 首页头图区（标题/描述/统计各自带纸色底）
│   │   ├── BackgroundVideo.astro # ⭐ 全屏背景视频：交叉淡化 + poster 兜底 + 失败重试
│   │   ├── LoadingScreen.astro   # 加载遮罩（纯 CSS 降级，禁 JS 时完全不出现）
│   │   ├── LoadingScript.astro   # 加载遮罩的早期内联脚本
│   │   ├── PostCard.astro        # 文章卡片（默认／精选／紧凑 三种形态）
│   │   ├── PostList.astro        # 首页文章列表 + 分类/标签筛选面板
│   │   ├── InkGallery.astro      # 水墨环形画廊（WebGL，按需加载 + 降级）
│   │   ├── ThemeToggle.astro     # 深浅色切换按钮
│   │   ├── ThemeScript.astro     # 主题初始化（内联，防首屏闪白）
│   │   └── Icon.astro            # 内联 SVG 图标集
│   ├── lib/
│   │   ├── site.ts               # 配置读取、日期格式化、阅读时长、base 路径处理
│   │   ├── posts.ts              # 文章查询：排序、标签、归档、相关文章
│   │   ├── projects.ts           # 作品查询：排序、技术栈统计、状态元数据
│   │   └── categories.ts         # 分类元数据
│   ├── scripts/
│   │   ├── ink-gallery.ts        # 环形画廊的 WebGL 实现（ogl 着色器与交互）
│   │   └── loading-screen.ts     # 加载遮罩的进度动画
│   ├── pages/
│   │   ├── index.astro           # 首页
│   │   ├── about.astro           # 关于
│   │   ├── archive.astro         # 归档（年份时间线）
│   │   ├── 404.astro             # 404
│   │   ├── blog/[id].astro       # 文章详情（目录、进度条、上下篇、相关文章）
│   │   ├── works/index.astro     # 作品列表（环形画廊 + 卡片网格 + 技术栈汇总）
│   │   ├── works/[id].astro      # 作品详情（外链、技术栈、正文、上下导航）
│   │   ├── tags/index.astro      # 标签云
│   │   ├── tags/[tag].astro      # 单个标签下的文章
│   │   ├── rss.xml.ts            # RSS 订阅
│   │   └── robots.txt.ts         # robots.txt
│   └── styles/global.css         # ⭐ 设计系统：配色、组件类、正文排版
├── scripts/
│   └── generate-og.py            # 生成分享卡片 public/og-default.jpg
├── public/
│   ├── bg-video.mp4              # ⭐ 背景视频（7.05 MB，自托管）
│   ├── bg-poster.jpg             # 背景视频兜底静帧（1920×1080 / 342 KB，从视频抽的 t=0 帧）
│   ├── favicon.svg
│   └── og-default.jpg            # 社交分享卡片
└── .github/workflows/deploy.yml  # GitHub Pages 自动部署
```

`.probe-frames/` 是排查问题时生成的截图与分析脚本（体量可达数百 MB），
**已写进 `.gitignore`，不要提交**。

---

## 写一篇新文章

在 `src/content/blog/` 下新建 `.md` 文件，文件名会成为 URL 的一部分（如 `hello-world.md` → `/blog/hello-world/`）。

```markdown
---
title: '文章标题'
description: '一句话摘要，显示在卡片和搜索结果里'
pubDate: 2026-10-08
tags: ['标签一', '标签二']
category: tech          # tech 技术 | life 生活 | note 随笔
featured: false         # 设为 true 会在首页「精选推荐」大卡片展示
draft: false            # 设为 true 则构建时不显示
# cover: '/images/xxx.jpg'   # 可选封面图，放 public/ 目录下
# updatedDate: 2026-10-10    # 可选更新时间
---

正文用 Markdown 写。

## 二级标题会成为目录项

支持代码块、表格、引用、图片等常用语法。
```

保存后开发服务器会自动刷新，无需重启。

**字段说明**

| 字段 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | ✅ | — | 文章标题 |
| `pubDate` | ✅ | — | 发布日期，决定排序 |
| `description` | | `''` | 摘要，用于卡片与 SEO |
| `tags` | | `[]` | 标签数组 |
| `category` | | `note` | `tech` / `life` / `note` |
| `featured` | | `false` | 是否在首页精选区展示 |
| `draft` | | `false` | 草稿不参与构建 |
| `updatedDate` | | — | 更新时间 |
| `cover` | | — | 封面图路径 |

> 字段写错或缺失必填项时，**构建会直接报错并指出位置**，不会静默生成空页面。

---

## 写一个作品

在 `src/content/projects/` 下新建 `.md` 文件（文件名即 URL，如 `my-app.md` → `/works/my-app/`）：

```markdown
---
title: '作品名称'
description: '一句话说明它是什么、解决什么问题'
role: '独立开发'              # 你在其中的角色
date: 2026-06-15              # 完成时间
stack: ['Astro', 'TypeScript']# 技术栈
status: done                  # active 进行中 | done 已完成 | archived 已归档
featured: false               # true 会排到最前并显示「精选」标记
order: 0                      # 数字小的排在前，相同则按日期倒序
link: 'https://demo.example.com'   # 在线预览（可选）
repo: 'https://github.com/...'     # 源码地址（可选）
# cover: '/images/project.png'     # 封面图（可选，留空用墨色占位）
# draft: false                     # true 则不显示
---

正文写这个作品的来龙去脉，支持所有 Markdown 语法。
```

**字段说明**

| 字段 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | ✅ | — | 作品名称 |
| `description` | | `''` | 一句话简介，显示在卡片上 |
| `stack` | | `[]` | 技术栈标签 |
| `status` | | `done` | `active` / `done` / `archived` |
| `date` | | — | 完成时间 |
| `role` | | — | 你的角色，如「独立开发」 |
| `link` / `repo` | | — | 在线预览 / 源码地址 |
| `featured` | | `false` | 精选，排到最前 |
| `order` | | `0` | 排序权重，小的在前 |
| `cover` | | — | 封面图路径 |
| `draft` | | `false` | 草稿不参与构建 |

**关于布局**

- 作品卡片的封面默认用**作品名首字**做墨色题字；提供 `cover` 就用图片
- 整张卡片可点击进入详情页；右下角的源码／预览图标是独立外链，不会误触
- 详情页在正文为空时会显示一句提示，不会渲染出一片空白

---

## 作品页的环形画廊

作品列表页顶部是一个 WebGL 环形画廊（滚轮 / 拖拽浏览，点击卡片进入详情），下面是常规卡片网格。

参数在 [`src/pages/works/index.astro`](src/pages/works/index.astro) 里传入：

```astro
<InkGallery
  items={galleryItems}
  height={600}
  bend={0}
  speed={2}
  ease={0.06}
/>
```

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `height` | 560 | 画布高度（px） |
| `bend` | 0 | 弯曲程度。`0` 是水平排列；`0.3`~`0.6` 会形成弧形 |
| `speed` | 2 | 滚轮灵敏度 |
| `ease` | 0.06 | 缓动系数，越小跟随越慢 |
| `theme` | `auto` | 卡片配色：`auto` 跟随站点主题 / `ink` 墨色底 / `paper` 宣纸底 |
| `hint` | 见代码 | 底部操作提示文案 |

**卡片图案是现画的**：用 Canvas 2D 生成（墨色/宣纸底 + 作品名首字 + 状态角标），所以你不必为每个作品准备封面图。切换深浅色主题时会**重绘**卡片纹理。

**降级行为**（重要）

- 画廊**进入视口才初始化**，`ogl` 是动态 `import()` 的——首页与文章页完全不会加载它
- 禁用 JavaScript 或浏览器不支持 WebGL 时，显示一份纯 HTML 的作品链接列表
- 初始化失败只影响画廊本身，页面其余部分照常

**为什么没用 React**：这个效果的原始出处是 Codrops 的 [Infinite Circular Gallery](https://tympanus.net/codrops/2021/02/23/creating-an-infinite-circular-gallery-using-webgl-with-ogl-and-glsl-shaders/)，React Bits 将其封装为 React 组件。本站用原生 JS 直接调用底层的 [ogl](https://github.com/oframe/ogl) 重写，避免为一个画廊引入约 140 KB 的 React 运行时。

---

## 全屏背景视频

全站背景是一段 **1920×1080 / 5.042 秒 / 7.05 MB** 的循环视频（`public/bg-video.mp4`），
在背景之上叠一层全透明蒙层（`scrim = 0`，即视频原样显示）。

### 为什么是自托管

视频最初直接引用第三方地址，但对方服务器会**间歇性挂起传输**：
`<video>` 的媒体加载器必定发 `Range: bytes=0-`，对方有时连响应头都不给、
有时给了 `200` 头之后 body 完全不动，35 秒后 `<video>` 报 `MEDIA_ELEMENT_ERROR: Format error`。
把它下载到 `public/` 后问题彻底消失——本地和 GitHub Pages 都支持 Range。

### 三层兜底

1. **poster 静帧**（`public/bg-poster.jpg`，1920×1080 / 342 KB，由 `.probe-frames/extract-poster.mjs`
   从 `bg-video.mp4` 里抽的 t=0 帧，**不要用页面截图裁**——那样会把页面 UI 一起烧进图里，
   刷新时视频没就绪就会闪出旧 UI 残影）
   —— 视频还没下载完 / 加载失败 / 浏览器禁止自动播放时，显示真实的拱桥画面，而不是一块空白纸色
2. **自动重试**：失败后 4s / 15s / 40s 各重试一次（给 src 加 `?r=N` 绕开挂起的连接）
3. **构建期自动切换**：`public/bg-video.mp4` 存在就用本地文件，不存在才退回远程地址

想换背景视频：直接把新文件覆盖成 `public/bg-video.mp4` 即可，**不用改代码**。
同时重跑一次 `.probe-frames/extract-poster.mjs` 生成配套 poster，否则兜底画面会和新视频对不上。

### 组件参数

[`src/components/BackgroundVideo.astro`](src/components/BackgroundVideo.astro)：

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `src` | 自动检测 | 视频地址；不传则按上面「构建期自动切换」决定 |
| `scrim` | `0` | 蒙层浓度 0~1，`0` = 视频原样，`1` = 完全遮住 |
| `fade` | `0.7` | 循环交叉淡化时长（秒），`0` = 退回硬切 |
| `poster` | `/bg-poster.jpg` | 兜底静态画面 |

**交叉淡化**：组件用两个 `<video>` 层做循环，在距结尾 `LEAD` 秒时预热另一层，
等它 `readyState >= 2` 才切换——**没真正就绪就不切换**，宁可这一轮不叠化，
也不会出现「淡出时另一层还是空的、背景整块消失」。

### 体积

`public/bg-video.mp4` 是 **7.05 MB**，这是目前仓库里最大的文件。
GitHub Pages 能接受，但首屏偏重；压到 720p 约 0.4 MB（需要 ffmpeg，本站未内置该步骤）。

另外这个 MP4 的 `moov` 在 `mdat` **之后**（不是 fast-start），播放器要先拿到文件尾部才能起播。
本地和 GitHub Pages 都支持 Range，所以只是多一个往返，不影响使用。
**线上实测**：`readyState=4`、`1920×1080`、`5.042s`，媒体请求返回 `206 Partial Content`，播放正常。

---

## 视觉系统：文字压在视频上必须有底

这是全站最重要的一条视觉约束，改样式前务必知道。

背景视频的亮度跨度极大（最亮接近纯白、最暗接近纯黑），
所以**任何单一文字颜色都无法在两端同时达标**——深墨字在暗部只剩约 1.02:1（等于消失）。

因此：**所有裸露在视频上的文字都必须自带一层纸色底**。为此提供了两个组件类：

```css
/* 紧贴文字的小底，宽度自适应 */
.paper-plate { width: fit-content; padding: 0.06em 0.34em; border-radius: 0.5rem; }

/* 列表行用：铺满整行，padding/圆角沿用行自己的 */
.paper-row { border-radius: 0.5rem; }
```

两者共同的三件事：
- 背景 `color-mix(in srgb, var(--bg) 58%, transparent)`
- 把 `--text` / `--text-soft` / `--text-mute` 重定义为**加深一档**的卡片色阶
  （半透明底上，为完整纸面校准的浅灰放不住）
- 深色主题下 `--bg` 和 `--card-ink-*` 自动变成夜墨与浅色，不用写两套

**用法要点**

- `.paper-plate` **刻意不设 `margin-inline`**：居中与否交给调用方。
  首页 Hero 是居中的（加 `mx-auto`），其它页面页头是左对齐的（不加）。
- **渐层文字（`.text-gradient`）不能和底放在同一个元素上**：
  它用 `background-clip: text`，会把该元素上的**所有背景（包括 `background-color`）一起裁进字形**。
  两种规避方式：底放**父元素**（行内渐层），或外面再套一层承载底色（整块渐层）。

### 圆角阶梯

改任何组件时**照着选，不要发明新值**：

| 圆角 | 用在哪 |
| --- | --- |
| `0.25rem` 4px | `.chip`（标签）、`.btn.btn-sm` |
| `0.375rem` 6px | `.btn` / `.btn-md`、代码块、画廊容器 |
| `0.5rem` 8px | `.paper-plate` / `.paper-row`、`.card`、`.btn-lg`、`.filter-panel` |
| `0.75rem` 12px | `.paper-panel`（文章正文）、部分大面板 |

> ⚠️ **Tailwind 的工具类压过组件类**。例如给元素写了 `rounded-xl`，
> 组件类里的 `border-radius` 就不会生效。要改圆角请**改工具类**。
> 同理 `.hero-content` 里那套 `--text-*` 重定义必须写在组件类内部，
> 用 `:where()` 会被 utilities 层压掉。

### 按钮三档

`.btn-sm` / `.btn`（= `.btn-md`） / `.btn-lg`，圆角分别 4 / 6 / 8px。
字号 0.8 / 0.9 / 1rem，内边距同比放大。三档的圆角**按高度等比递增**，
所以看起来是"同一种按钮的不同大小"，而不是三种按钮。

---

## 改成你自己的站点

**只需要编辑一个文件**：[`src/config.ts`](src/config.ts)

```ts
export const site = {
  title: '墨迹',                                      // 站点标题 / 浏览器标签 / 首页大标题
  tagline: '记录技术、生活，以及那些值得反复想起的瞬间',  // 副标题
  description: '一个用 Astro 搭建的个人博客……',        // SEO 描述
  lang: 'zh-CN',
};

export const author = {
  name: 'EVIL DEMON',       // 署名
  tagline: '写代码，也写生活',
  bio: ['第一段自我介绍', '第二段'],   // 关于页正文
  avatar: '',               // 头像，把图片放 public/ 后填 '/avatar.jpg'
};

export const nav = [ /* 导航项 */ ];
export const social = [ /* 社交链接，不需要的整项删掉 */ ];
export const footer = { copyright: 'EVIL DEMON', icp: '' };
```

### 换配色

在 [`src/styles/global.css`](src/styles/global.css) 顶部改 `@theme` 里的色阶即可，
深浅两套主题各有一组语义变量（`--bg`、`--surface`、`--text`、`--brand` …）。

```css
@theme {
  /* 墨色阶：宣纸 → 焦墨，--brand-* 即主色 */
  --color-brand-600: #4a443d;  /* 重墨，主色 */
  --color-brand-900: #14110f;  /* 焦墨 */

  /* 朱红：印章与强调色 */
  --color-seal-500: #a8322a;
}
```

**设计要点**

- **墨分五色**：`--brand-50` 到 `--brand-900` 是一组暖灰（不是冷灰），从宣纸白过渡到焦墨
- **朱红点睛**：`--seal-*` 是全站唯一的彩色，用于链接、印章、列表圆点、悬停强调
- **宣纸质感**：`body::after` 用 SVG 噪点模拟纸纹，亮色乘算加深、暗色滤色提亮
- **宋体**：标题与正文用 `--font-serif`（系统宋体栈），UI 元素用 `--font-sans`

改配色后记得重新生成分享卡片（见下方「技术要点」）。

---

## 部署到 GitHub Pages

### 当前状态：已就绪，目标地址 https://EVAE-AL.github.io

部署前必改项已全部处理完：

- [x] `astro.config.mjs` 的 `site` 已设为 `'https://EVAE-AL.github.io'`（用户主页仓库，部署在域名根路径，**不需要 `base`**）
- [x] 已删除 `public/lab-recipes.html`（开发期对比页）
- [x] `src/config.ts` 的站点名、作者名、GitHub 链接已核对；占位的 `mailto:hello@example.com` 已移除
- [x] 已移除指向 `motionsites.org` 的 `preconnect`（视频已自托管，不再依赖第三方域名）
- [x] `public/og-default.jpg` 已按最终站点信息重新生成

> 唯一保留的取舍：`public/bg-video.mp4` 仍是 7.05 MB 原文件（首屏偏重）。
> 压到 720p 约 0.4 MB，但需要 ffmpeg，本机未安装。

### 仓库与自动部署

- 仓库：`EVAE-AL/EVAE-AL.github.io`（用户主页仓库，Pages 自动发布到域名根路径）
- 分支：`main`（[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 只在 `main` 上触发）
- Pages 源：仓库 **Settings → Pages → Source** 选 **GitHub Actions**

推送到 `main` 后工作流自动执行 `npm ci` → `npm run build` → 发布 `dist`。

### 如果换成项目仓库（如 `my-blog`）

那就要同时加 `base`，否则所有绝对路径都会 404：

```js
site: 'https://<用户名>.github.io',
base: '/my-blog',
```

> 用 `base` 时不用手改任何链接：`src/lib/site.ts` 里的 `withBase()` 会处理前缀。
> 换成用户主页仓库（`<用户名>.github.io`）时则**不要**设 `base`。

**部署到 Cloudflare Pages / Vercel**：构建命令填 `npm run build`，输出目录填 `dist`。

---

## 技术要点

- **渐进增强**：默认输出纯 HTML。脚本只用于主题切换、筛选、目录高亮、画廊、背景视频、加载遮罩，
  且都能优雅降级——禁用 JavaScript 时内容依然完整可读。
- **暗色模式无闪白**：主题判断脚本内联在 `<head>` 中同步执行，优先读取用户选择，其次跟随系统。
- **代码高亮双主题**：Shiki 同时输出 `min-light` / `min-dark` 两套颜色变量，通过 CSS 切换。
- **宣纸纹理**：用 SVG `feTurbulence` 噪点配合 `mix-blend-mode: soft-light`。这里**必须用 soft-light**
  ——噪点均值是 50% 灰，soft-light 下整体亮度不变；换成 `multiply` 会把整页压暗约 25%。
- **分享卡片**：社交平台不支持 SVG 格式的 `og:image`，所以用 [`scripts/generate-og.py`](scripts/generate-og.py)
  渲染成 JPEG（1200×630）。改完站点名后重新跑一次即可：
  ```bash
  python scripts/generate-og.py
  ```
- **SEO**：自动生成 sitemap、RSS、robots.txt，每页带 canonical、Open Graph 与文章结构化数据（JSON-LD）。

---

## 已实现 / 待办

**已实现**

- [x] 首页（精选大卡片 + 文章网格 + 分类/标签筛选 + 标签云）
- [x] 文章页（目录、阅读进度、上下篇、相关文章、代码高亮）
- [x] 作品页（环形画廊、卡片网格、技术栈汇总、详情页、状态标记、整卡可点）
- [x] 归档页（年份时间线）
- [x] 标签页（标签云 + 单标签文章列表）
- [x] 关于页、404 页
- [x] 全屏背景视频（自托管 + poster 兜底 + 失败重试 + 交叉淡化）
- [x] 水墨纸色底系统（保证文字在视频上可读）
- [x] 暗色 / 亮色模式
- [x] RSS、sitemap、robots.txt、OG 分享卡片
- [x] 响应式（移动端菜单、自适应网格）
- [x] 加载遮罩
- [x] GitHub Pages 自动部署配置

**待办（按需逐个添加）**

- [ ] 部署前必改项（见上方「部署到 GitHub Pages」）
- [ ] 压缩背景视频（需 ffmpeg）
- [ ] 全文搜索（Pagefind）
- [ ] 评论系统（Giscus）
- [ ] 相册页
- [ ] 多语言

---

## 补充：`HANDOVER.md`

[`HANDOVER.md`](HANDOVER.md) 是这份项目的**工程交接文档**，记录的是 README 不涵盖的内容：

- 每个视觉决策**为什么**这么做（以及被推翻的方案）
- 踩过的坑与根因（例如「CSS 层序压过特异性」这一条在本项目里出现过三次）
- 对比度、图层、播放等问题的**测量方法**与实测数据

改样式或调背景之前建议先翻一翻，能省掉大量重复排查。
