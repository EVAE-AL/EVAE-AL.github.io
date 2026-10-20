---
title: '把复杂藏在里面：一份渐进增强的实践笔记'
description: '默认零 JavaScript 的站点，怎么做筛选、目录高亮和暗色模式？答案不是"不用 JS"，而是让 JS 只负责锦上添花。'
pubDate: 2026-09-15
tags: ['前端', '性能', 'CSS']
category: tech
---

很多人听到"零 JavaScript"会理解成"这网站不能有任何交互"。这是一个误解——**真正的目标不是零 JS，而是让 JS 的缺失不造成功能损坏。**

这两者的区别很大。前者追求纯粹的指标，后者追求用户的体验下限。

## 一条判断标准

我现在用一条很简单的标准来决定某个功能要不要写 JS：

> 如果这段脚本加载失败，页面还能用吗？

按这条标准过一遍博客上的功能：

| 功能 | 没 JS 时的表现 | 判定 |
| --- | --- | --- |
| 暗色模式切换 | 跟随系统偏好，无法手动切换 | 可以接受 |
| 分类筛选 | 显示全部文章，无法筛选 | 可以接受 |
| 目录高亮 | 目录正常显示，不会滚动高亮 | 可以接受 |
| 卡片入场动画 | 直接显示，没有动画 | **必须保证** |
| 阅读进度条 | 不显示 | 可以接受 |
| 文章内容 | 完整可读 | **必须保证** |

关键是最后两行。**动画和增强效果可以丢，内容不能丢。**

## 踩过的坑：动画导致的空白页

我最初的入场动画写法是这样的：

```css
.reveal {
  opacity: 0;
  animation: fade-up 0.7s ease forwards;
}
```

看起来很标准，但它有一个致命问题：**动画依赖 CSS 加载完成，而 `opacity: 0` 是立即生效的。** 如果样式表加载慢，或者用户的浏览器设置了"减少动态效果"，或者 JS 加载失败导致后续的显隐逻辑没跑到，页面就会保持空白。

正确的做法是让"隐藏"这一步也需要 JS 的许可：

```css
.reveal {
  opacity: 1; /* 默认可见 */
}

html.js-reveal .reveal {
  opacity: 0;
  animation: fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
```

然后在 `<head>` 里同步加上这个类：

```html
<script is:inline>
  document.documentElement.classList.add('js-reveal');
</script>
```

这样做的好处有两层：

1. 脚本没跑，元素就是可见的，内容不受影响
2. 脚本在 `<head>` 里**同步**执行，不会出现"先显示再隐藏"的闪烁

同时别忘了 `prefers-reduced-motion`：

```css
@media (prefers-reduced-motion: reduce) {
  html.js-reveal .reveal {
    opacity: 1;
    animation: none;
  }
}
```

## 暗色模式：内联脚本是唯一解

暗色模式最容易踩的坑是**首屏闪白**。原因是主题判断通常写在页面底部的脚本里，而这时浏览器已经用亮色渲染过一遍了。

解决办法只有一个：把主题判断内联进 `<head>`，并且**同步执行**。

```html
<script is:inline>
  (() => {
    const saved = localStorage.getItem('blog-theme');
    const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved ?? (prefersDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  })();
</script>
```

几个细节值得注意：

- 用 `is:inline` 告诉 Astro 不要把这段脚本打包和延迟加载
- 用 `try/catch` 包住 `localStorage`，因为 Safari 隐私模式下访问它会抛异常
- 初始化时也要设置 `color-scheme`，这样原生滚动条和表单控件才会跟着变

## 主题切换用 CSS 变量，不要用类名堆砌

一开始我写的是 `.dark .card { background: #0e211d }` 这种按组件改色。写到第五个组件时我放弃了——每加一个样式就要写两遍。

改成变量之后，组件样式只需要写一遍：

```css
:root {
  --surface: #ffffff;
  --border: #e2ebe8;
  --text: #0d1a17;
}

html.dark {
  --surface: #0e211d;
  --border: #1c3a33;
  --text: #e8f5f1;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
}
```

代价是需要提前把颜色语义化。我最后整理出这几组：

- `--bg` / `--bg-soft`：页面底色
- `--surface` / `--surface-2`：卡片、面板
- `--border` / `--border-strong`：边框与分隔线
- `--text` / `--text-soft` / `--text-mute`：三级文字
- `--brand` / `--brand-soft` / `--brand-text`：品牌色及其浅底、深字

这个分类方式不一定通用，但**"按用途命名，而不是按颜色命名"**这条原则值得坚持。`--gray-200` 这种名字在换主题时毫无帮助。

## 目录高亮：IntersectionObserver 足够了

文章目录的滚动高亮，过去很多人会用 `scroll` 事件加 `getBoundingClientRect()` 计算。这样做的问题是**每一帧都要触发重排**，长文章下会明显掉帧。

`IntersectionObserver` 更合适：

```js
const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (visible[0]) setActive(visible[0].target.id);
  },
  { rootMargin: '-96px 0px -70% 0px', threshold: 0 }
);
```

`rootMargin` 是这里的关键。顶部留 96px 是因为有固定导航栏，底部收掉 70% 是为了让"当前小节"的判定集中在上半屏——否则一屏内可能有好几个标题同时可见，高亮会来回跳。

这段代码总共不到二十行，没有依赖，也不需要虚拟 DOM。

## 小结

渐进增强这个概念很老，但它在现代前端里反而更有价值了，因为框架默认的抽象层级越来越高，容易让人忘记最下面那层是什么。

我现在的习惯是：**每加一个交互，先用浏览器的"禁用 JavaScript"跑一遍页面。** 如果内容还在、导航还能走，那这个交互就写对了。
