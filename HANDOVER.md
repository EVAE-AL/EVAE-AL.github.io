# 交接文档 —— 个人博客（Astro + 水墨风）

> 生成时间：2026-10-13
> 用途：把当前进度、已知问题、下一步完整交接出去。任何人（包括下一个会话的我）读完就能接手。

---

## 一、这是什么

一个用 **Astro 5** 搭建的静态个人博客，主题为 **水墨风**（宣纸底 + 墨色阶 + 朱红印章），
全站背景铺了一段 **自托管 MP4 视频**，站点正在从「实底宣纸卡」往「能透出背景视频的玻璃卡」演进。

- 工作目录：`D:\个人博客`
- **线上地址**：<https://evae-al.github.io/>（2026-10-20 上线，仓库 `EVAE-AL/EVAE-AL.github.io`）
- 本地预览：`http://127.0.0.1:4321`（服务可能已停，见第五节）
- git 仓库：`main` 分支，`origin` = 上述仓库；回滚可用 `git revert` 或备份 zip（见第五节）

---

## 二、当前状态一览

### 已完成且可用

| 功能 | 位置 | 状态 |
|---|---|---|
| 全站骨架（首页/归档/标签/关于/作品/404/RSS/sitemap） | `src/pages/` | ✅ 20 页构建通过 |
| 水墨风设计系统（墨分五色 + 朱红） | `src/styles/global.css` | ✅ |
| 亮/暗双主题（无闪烁） | `ThemeScript.astro` | ✅ |
| 内容集合（blog + projects） | `src/content/` | ✅ 3 篇示例文章 + 3 个作品 |
| 环形作品画廊（WebGL / ogl） | `InkGallery.astro` + `src/scripts/ink-gallery.ts` | ✅ |
| 全站背景视频 | `BackgroundVideo.astro` | ✅ 蒙层 `scrim = 0`（视频原样） |
| 加载动画（彗星表盘） | `LoadingScreen.astro` + `src/scripts/loading-screen.ts` | ✅ |
| 长文宣纸面板 | `.paper-panel`（`--panel-alpha: 86%`） | ✅ 用在文章页/关于页/作品详情 |
| 首页 Hero 居中版式 | `Hero.astro` | ✅ |
| GitHub Pages 部署配置 | `.github/workflows/deploy.yml` | ✅ **已上线** <https://evae-al.github.io/> |

### 进行中（本次会话的核心）

**任务：只改卡片，让背景视频的鲜亮透出来，同时文字必须看得清、且不违和。**

用户原话：
> 「我想背景不变，只改卡片，我想要的是背景的鲜亮，但字体不能看不见，又不能违和」

**当前进度：**

| 事项 | 状态 |
|---|---|
| 卡片玻璃化改造（`.card` + `--card-*` 变量） | ✅ 已落地 |
| cascade layer 导致卡内文字色不生效的 bug | ✅ 已修（见第三节） |
| 浅色主题卡片文字对比度 | ✅ 通过，跨 12 帧最坏 **5.26:1** |
| 深色主题卡片文字对比度 | ✅ **已落地「方案 D」**，跨 12 帧最坏 **6.39:1**（原 2.78:1） |
| 头部因视频背景不可读 | ✅ 已修，跨 12 帧最坏 5.82:1（见第三节） |
| 用户最终选定卡片配方 | ✅ **已选：深色用 D**（无滤镜 + 78% 半透明） |
| 环形画廊与站点卡片统一 | ✅ 已改为跟随主题 + 半透明面板（见第三节） |
| 背景「断」之一：头部 1px 亮线 | ✅ 已修（cascade layer 根因，见第三节） |
| Hero 纸色底：硬边 + 过浓 | ✅ 已修（mask 生效 + 74%→62%，见第三节） |
| 背景「断」之二：视频循环接缝 | ⚠️ 已实现交叉淡化，但**未能端到端验证**（CDN 限流），见第三节 |
| 按钮三档（大/中/小） | ✅ 已落地，圆角按比例缩放（见第三节） |
| 「精选」徽章 4.07:1 | ⚠️ 遗留缺陷，与卡片无关，**待用户决定是否修** |

**深色主题为什么曾经失败（根因）：** `contrast(<1)` 的公式是 `out=(in-0.5)*c+0.5`，
会把纯黑**抬到中灰**（c=0.65 时纯黑→0.24）。浅色卡需要「提亮黑」，深色卡需要「压暗」，
**方向完全相反**——深色卡一直用错了方向。最终采纳的方案干脆不用滤镜，只靠 78% 半透明墨底压暗。

**一个诚实的测量保留：** 用无头 Chrome 在同一帧视频上做对照，给卡片加极端滤镜
`brightness(3) hue-rotate(90deg) saturate(5)` 与完全关闭滤镜，卡片区域像素**逐像素均差 0.00**；
而把视频隐藏掉差异是 **25.16**。即「卡片透出视频」确实生效，但 `backdrop-filter` 的调色
在测量环境里没有体现。可能无头合成限制，也可能是真实行为。
**注意：浅色主题仍依赖 backdrop-filter**，若上述现象在真实浏览器中成立，浅色卡的实际观感
会与「无滤镜」接近——这一点仍**待用户目视确认**。

**方案 D 实测（`.probe-frames/multiframe-contrast-D.txt`）**

| 组合 | 文字条数 | 跨 12 帧最坏 | 不达标 |
|---|---|---|---|
| dark / 首页 | 20 | 7.77:1 | 1（仅「精选」徽章） |
| dark / works/ | 23 | 6.39:1 | 1（仅「精选」徽章） |
| light / 首页 | 20 | 5.26:1 | 0 |

---

## 三、当前生效的关键配置（改动前请先读）

### 背景视频层

`src/components/BackgroundVideo.astro`

```astro
const { src = 'https://motionsites.org/assets/prompt-media/6fb049e38e9593f9699c.mp4',
        scrim = 0 } = Astro.props;
```

层级（自下而上）：canvas 底色 → `.bg-video`（`z-index:-2`）→ `body::before/::after`（`z-index:-1`）→ 内容。

**关键规则：`html` 必须没有背景。** 否则 `body` 的 `background-color` 会传播成画布背景，层级关系改变。

### 卡片与面板

`src/styles/global.css`

```css
/* 玻璃卡：透出背景视频，靠 backdrop-filter 调色，卡内文字用独立变量层级 */
.card {
  position: relative;
  background-color: color-mix(in srgb, var(--card-tint) var(--card-alpha), transparent);
  -webkit-backdrop-filter: blur(var(--card-blur)) brightness(var(--card-bright))
                          saturate(var(--card-sat)) contrast(var(--card-contrast));
  backdrop-filter:         blur(var(--card-blur)) brightness(var(--card-bright))
                          saturate(var(--card-sat)) contrast(var(--card-contrast));
  color: var(--card-ink);
}
/* 关键：在 .card 内重定义语义变量，让卡内工具类解析到卡专用色阶 */
.card {
  --text: var(--card-ink);
  --text-soft: var(--card-ink-soft);
  --text-mute: var(--card-ink-mute);
  --brand-text: var(--card-link);
}

.paper-panel {
  background-color: color-mix(in srgb, var(--surface) var(--panel-alpha), transparent);
  /* --panel-alpha: 86%；刻意不加 backdrop-filter（长面板 + 播放中的视频，性能热点） */
}
```

**踩过的坑（务必记住）：Tailwind 4 用原生 cascade layers。**
`@layer utilities` 排在 `@layer components` **之后**，而**层序优先于特异性**。
所以任何写在 `@layer components` 里的卡内覆盖（哪怕用 `:where()` 或同等特异性）都会被工具类打败。
正确做法是上面那样：**重定义变量**，让工具类的 `var()` 解析到卡专用值。

第二处同类坑：`.chip` / `.btn-ghost` 的卡内覆盖。
原写法 `:where(.card) :where(.chip)` 特异性为 0，永远不生效；已改成 `.card .chip`（0,2,0）。

### 头部渐隐底（解决视频背景导致的头部不可读）

`src/components/Header.astro`

背景换成全屏视频后暴露出的**独立缺陷**（与卡片无关）：

| 状态 | 导航文字背景 | 对比度 |
|---|---|---|
| 页面顶部（头部原本透明） | 就是视频 `#1560a6` | **1.29:1** ❌ |
| 滚动之后（头部有纸底） | `#ffffff` | 8.70:1 ✅ |

头部原本只在 `scrollY > 8` 后才加纸底，页面顶部是透明的——以前压宣纸色没问题，压视频上就废了。

修法：给 `#site-header::before` 加一层**只属于头部**的纸色渐隐层，向下渐隐到完全透明
（`opacity` 由 `.is-scrolled` 控制，滚动后退场）。**不碰视频本身。**

浓度是按最坏帧反解的：朱红 `#8c2620` 相对亮度仅 0.069，视频最亮和最暗两端都需要
纸色覆盖率 ≥ 80% 才够 4.5:1，所以文字所在高度区间保持 86%~93%，最后一段渐隐归零（避免硬接缝）。

**修复后实测（跨 12 帧完整视频循环）**：

| 状态 | 激活导航项（朱红） | 非激活导航项 | 站名 |
|---|---|---|---|
| 浅色·顶部 | **5.82:1** ✅ | 6.44:1 ✅ | 12.79:1 ✅ |
| 深色·顶部 | **5.89:1** ✅ | — | — |

### 环形画廊（WebGL）与站点卡片统一

`src/scripts/ink-gallery.ts` + `src/components/InkGallery.astro` + `src/pages/works/index.astro`

**改造前有三处真实的不一致**：

1. `works/index.astro` 写死 `theme="ink"`，而 `ink-gallery.ts` 在初始化时把配色**烤进 canvas 纹理**，
   之后再不更新 —— 所以浅色主题下别处是宣纸卡，唯独画廊是墨卡，**完全不响应主题切换**。
2. 代码里已经写好一套 `paper` 调色板，但全站没有任何地方用它（死代码）。
3. 画廊容器是不透明的 `bg-surface-2`，把背景视频整块挡住，与「让背景鲜亮透出来」的方向相反。

**改造内容**：

- `GalleryOptions.theme` 增加 `'auto'`，默认跟随站点主题（`html.dark` → ink，否则 paper）。
- 文字色不再写死，改为**从设计系统的 CSS 变量实时读取**
  （`--card-ink` / `--card-ink-soft` / `--card-ink-mute`），画廊与站点卡片共用同一套色阶。
  注意：不能直接对自定义属性取 `getComputedStyle`，那样拿到的是原样 token
  （如 `var(--color-seal-600)`），canvas 不认识；必须用一个不可见探针把 `var()` 赋给 `color` 再读回计算值。
- 监听 `theme-change` 事件（由 `ThemeScript.astro` 派发），**就地重绘纹理并标记重传**，
  不重建 WebGL 资源、不丢浏览位置。
  **关键坑**：ogl 的 `Texture` 只在 `image` 引用变化或 `needsUpdate` 为真时才重传
  （见 `ogl/src/core/Texture.js` 的 `bind()`）；复用同一块 canvas 必须显式置 `needsUpdate`，
  否则画面根本不会更新。
- 容器底色改为 `color-mix(in srgb, var(--surface) var(--panel-alpha), transparent)`，
  与 `.paper-panel` 一致（原来的 `bg-surface-2` 是不透明块）。
- 纹理里新增**边缘内描边**，因为宣纸卡压在宣纸容器上需要一圈淡边托出轮廓。

**实测（`.probe-frames/gallery-compare.png`、`gvstats*.py`）**：

| 检查项 | 结果 |
|---|---|
| 浅色画廊均色 / 亮度 | `#e9eae9` / 233.7 |
| 深色画廊均色 / 亮度 | `#313030` / 48.9 |
| 浅色 vs 深色 逐像素均差 | **193.96**（证明卡片纹理确实重绘了） |
| 切回浅色 vs 原浅色 | **0.00**（可逆且确定） |
| 卡片主体改变量（浅 / 深） | 22.3 / 27.8 |
| 运行时异常 | 无 |

**纸卡渐变是量过才定的**：最初那组（`#fdfbf7→#efe9de`）只比容器暗 7.1，
几乎糊成一片；改成 `#fbf8f2→#e7e1d4` 后卡片主体改变量升到 22.3。
**浅色主题的卡片/容器分离度仍低于深色主题**（22.3 vs 27.8），
如果觉得浅色卡"平"，优先调 `DECOR.paper.stops`。

### 背景的「断」——两个独立根因（都已定位）

用户反馈「背景有明显的断的感觉，让它变得连贯一点」。实测发现**两个互不相干的成因**。

#### 成因一：头部底边一条横贯全屏的 1px 实线

`src/styles/global.css` 里有一条**未分层**的默认边框色规则：

```css
/* 错误写法（原来）：未分层 → 优先于所有 @layer 样式 */
* { border-color: var(--border); }
```

**cascade layers 的规则是：未分层样式优先于所有分层样式。**
所以这条规则压掉了 `@layer utilities` 里的 `.border-transparent`，
也压掉了 `@layer components` 里 `.card` / `.chip` / `.paper-panel` / `.card-gradient-border`
写的半透明边框 —— 它们**全部**被变成了不透明的 `var(--border)`，从来没生效过。

实测症状：头部 `border-b border-transparent` 的 `border-bottom-color` 计算值是
`rgb(221,213,200)`（= `--border`），于是每个页面顶部 y=64px 处有一条
**全宽、逐像素标准差 0.0、亮度 211（邻居只有 ~110）** 的硬线。
它正好落在头部渐隐底的末端，看起来就是背景被「切断」了。

修法：放进 `@layer base`。默认值依然生效，但工具类与组件规则能正常覆盖它。

```css
@layer base {
  * { border-color: var(--border); }
}
```

**连带坑**：修好之后，`border-transparent` 和 `border-line` 都落在 `@layer utilities` 里，
同时挂在元素上时胜负只由 CSS 生成顺序决定 —— 实测滚动后边框仍然是透明的。
所以 `Header.astro` 里改成**二者互斥**：任一时刻只保留一个类。

**验证**（`.probe-frames/line-compare.png`、`lba.py`）：

| 位置 | 修复前跳变 | 修复后跳变 |
|---|---|---|
| y=63 | 98.79 | 3.00 |
| y=64 | **101.74** | **0.04** |

顶部透明、滚动后恢复 `--border` 分隔线，两个状态都实测确认。

#### 成因二：视频循环接缝（每 5.04 秒硬跳一次）

**用自然播放采样**（99 帧 / 9 秒，跨两个完整循环；`play-sample.mjs` + `plays-report.txt`）：

| | 帧差 |
|---|---|
| 相邻帧中位 | **0.90** |
| 循环回绕（t=4.97s → t=0） | **18.13** |
| 倍数 | **约 20×** |
| 其余内部最大跳变 | 2.08 |

**⚠️ 测量方法的坑**：不要用「暂停 + 逐帧 seek」来测视频。
实测 Chrome 会把 seek 合并、画面冻住（48 帧里 44 帧像素完全相同，均值都是 `#40637e`），
得出「相邻帧差 0.00」的假结论。**必须让视频自然播放再连拍。**
另外：不要在页面里跑长 `await` 循环去等视频加载（实测那样视频根本不加载），
要在 node 端多次独立 `evaluate` 轮询。还有，重复使用同一个 `--user-data-dir`
会命中 HTTP 缓存，换新目录要重新拉 7MB —— 调试时容易误判成「加载失败」。

**已实现**：`BackgroundVideo.astro` 改为**双视频交叉淡化**（同 src，第二条 `preload="none"`
顺序加载，临近接缝前 LEAD 秒预热，`opacity` 过渡叠化）。

```astro
<BackgroundVideo scrim={0} fade={0.7} />   <!-- fade=0 可退回原来的硬切 -->
```

两个必须注意的点（都是实现时踩到的）：
1. **两个 `<video>` 都要保留 `loop`**。否则某轮兜底跳过切换时，视频播到结尾会**停住**，
   背景直接冻结——比硬切糟糕得多。
2. **`swap()` 里不要再重置 `nxt.currentTime`**。预热阶段它已经从 0 开始播了，
   再重置会让入画视频倒退，叠化中途出现顿挫。
3. 有**安全兜底**：`nxt.readyState < 2` 就本轮不切换，宁可保持硬切也绝不出现背景空白。

**⚠️ 未能端到端验证**：实现完成后，CDN 开始对本机限流，
`motionsites.org` 不再供流（同页对照实验里单个 video 也拿不到数据），
因此叠化是否真的消除了跳变**没有测到**。已验证的部分是：
脚本内联进全部 20 个页面、视频不可用时全站零 JS 报错、兜底正确。

**根治建议**：把视频重压一遍，把叠化直接烤进文件（需要 ffmpeg，本机没有）。
顺带能解决下面第三节列出的三个问题。

#### 附带发现：远程视频本身很不稳

- 首次加载实测需 **6~13 秒**（7.05 MB，走第三方 CDN）。
- 连续访问数十次后**停止供流**（本机已复现）。
- 页面上有 `<link rel="preconnect">` 但仍是单点依赖。

建议自托管一份压缩版（720p CRF30 约 0.43 MB，小 16 倍）。
自托管之后 `fade` 的「双份下载」顾虑也会随之消失（0.43 MB × 2 可忽略）。

### 按钮三档（大 / 中 / 小）

`src/styles/global.css`（`.btn` 相关规则）+ `Hero.astro` / `PostList.astro`

**改动前**：只有 `.btn` 一个尺寸，没有体系。于是各处用
`class="chip !px-3.5 !py-1.5 !text-[0.8rem]"` 这类 `!important` 内联覆盖硬改尺寸
（PostList / Hero / about / archive 共 6 处）——那正是「没有尺寸体系」逼出来的补丁。

**三档定义**（`.btn` 本身即中号默认值，所以原来只写 `.btn` 的地方行为不变）：

| 层级 | 类名 | 内边距 | 圆角 | 字号 | 实测高度 |
|---|---|---|---|---|---|
| 小 | `.btn.btn-sm` | `.32rem .85rem` | `0.25rem` | `0.8rem` | 31.4px |
| 中 | `.btn` / `.btn.btn-md` | `.6rem 1.25rem` | `0.375rem` | `0.9rem` | 42.8px |
| 大 | `.btn.btn-lg` | `.8rem 1.6rem` | `0.5rem` | `1rem` | 49.6px |

**为什么用不同圆角（而不是三档同一个值）**：
人眼读的是「圆角占高度的比例」，不是像素值。实测比值：

| | 圆角/高度 |
|---|---|
| 小 | 0.127 |
| 中 | 0.140 |
| 大 | 0.161 |

⚠️ **注意**：这个比值**不是恒定的**，而是随尺寸**单调轻微上升**（0.127→0.161）。
我原先预期「恒定 ~0.16」，实测推翻了这个说法——如实记录。
但仍然比「三档都用 6px」好得多：那样比值会是 0.191 / 0.140 / 0.121，
**跨度 58% 且非单调**（小按钮显得更圆、大按钮显得更方）；现在是 27% 跨度、单调递增，
读起来像刻意的设计而不是失误。

三个圆角值都复用系统里已有的 token（`0.25` / `0.375` / `0.5rem`），没有发明新数字；
大号的 `0.5rem` 正好等于卡片圆角，最大的行动按钮与卡片共享同一套语言。

**特异性写法**：三档写成 `.btn.btn-sm`（0,2,0）而不是 `.btn-sm`（0,1,0），
这样不依赖源码顺序，避免再出现「`.border-line` 与 `.border-transparent` 谁在后面谁赢」那类问题。

**chip 拆分**：`.chip` 从此只做**不可点的标签**；筛选按钮改用
`.filter-btn.btn.btn-sm` + `.is-active`（原来的 `chip chip-brand` + 内联覆盖已删，
JS 里切换的类名也从 `chip-brand` 改成 `is-active`）。

**尚未处理**：`.chip` 作为标签仍残留 5 处内联尺寸覆盖
（`!px-3 !py-1.5 !text-[0.8rem]` 在 Hero / about / archive，`!text-[0.7rem]` 在 PostCard / archive）。
它们属于「标签尺寸」问题，不在按钮三档范围内，要做的话应另开一套 label 尺寸。

#### ⚠️ 筛选按钮浓度踩过的坑（我改坏又修回）

第一版 `.filter-btn` 我随手写成 `color-mix(in srgb, var(--surface) 55%, transparent)`
（因为 `.card .chip` 是半透明的，就照抄了）——**但筛选按钮不在卡片里**，
原来用的是**完全不透明**的 `--surface-2`。这些按钮直接压在播放中的视频上，
而视频平均亮度只有 34%、大部分是暗部，于是文字长期压在暗色上。

**实测对照**（注入视频暗部底色 `#0f1a20` 复现最坏情况，`filter-contrast.mjs`）：

| | 激活项（朱红） | 非激活项 |
|---|---|---|
| 55% 半透明（写错的那版） | 4.74:1 | **3.25:1 ❌** |
| 92%（现在） | **6.17:1 ✅** | **7.29:1 ✅** |

**结论**：直接压在视频上的按钮，浓度必须接近不透明（≥90%）。
只有**卡片内**的元素才适合半透明，因为卡片本身已经提供了一层底。

**测量细节**：量这类按钮的对比度时，检测框必须**内缩 3px 排除 1px 边框**。
否则边框像素会被当成「文字背景」，把 P5 拉出假低值
（实测「全部」这项：含边框 3.24:1，排除边框 6.17:1——文字并不压在边框上）。

#### 筛选器的语义问题（已按用户要求改为两行）

原来分类与标签**挤成一行**，只有前缀 `#` 区分，用户读不懂（原话「这个是什么意思」）。
用户要求「把分类和标签分两行显示」，已实施：

```
┌──────────────────────────────────┐
│ 分类   全部  生活  技术           │   ← .filter-panel > .filter-row ×2
│ 标签   #生活  #习惯  #城市  #前端  │
└──────────────────────────────────┘
```

- `.filter-panel`：工具栏面板，`90% --surface-2` + 圆角 0.5rem。
  **必须有这层底**：行首的组名是纯文字，直接压在视频上时暗部对比度只有约 3:1
  （与筛选按钮踩过的坑同源）。
- `.filter-label`：刻意做成**无底、无边框的纯文字**（0.7rem / 600 / 字距 0.08em），
  与旁边带底带框的按钮区分开，一眼能看出是组名而不是可点项。
- 按钮本身不变（`.filter-btn.btn.btn-sm` + `.is-active`）。

**实测（注入视频暗部 `#0f1a20`，`filter-contrast.mjs` + `fil-panel.py`）**：

| 元素 | 最坏 P5 |
|---|---|
| 组名「分类」「标签」 | **6.95:1** ✅ |
| 激活项「全部」 | 7.14:1 ✅ |
| 非激活项 | 8.40:1 ✅ |

**仍然存在的数据问题（未动）**：当前示例数据下「生活」与「#生活」筛出同一篇、
「技术」与「#前端」筛出同样两篇，看起来仍像重复项。这是**内容层面**的问题，
不是布局问题——要彻底解决需要调整文章的分类/标签数据，或过滤掉与分类同名的标签。
（注意：不能简单地按名字去重，因为将来若有文章「分类=技术、标签=生活」，
两个筛选项就会筛出不同的集合，去重会丢掉真实功能。）

**布局（用户要求从右侧移到标题下方）**：原来是
`mb-8 flex items-end justify-between` —— 标题在左、筛选器在右，用户反馈「不和谐」。
现改为标题与筛选器**上下排列、左对齐**。

实测几何（注入视频暗部 `#0f1a20`，`layout-check.mjs`）：

| 元素 | y 范围 | left |
|---|---|---|
| `h2`「最新文章」 | 372–408 | 132 |
| `p`「共 N 篇…」 | 414–434 | 132 |
| `.filter-panel` | 454–542 | 132（与标题左对齐，差 0px）|

面板确实落在副标题下方，且左对齐。

#### ⚠️ 由此量出的系统性问题：`--text-mute` 直接压在视频上不达标

同一批测量顺带发现，「最新文章」这个区块里**没有任何底的文字**在视频暗部上很差：

| 元素 | 文字色 | 背景 | 最坏 P5 | 要求 |
|---|---|---|---|---|
| `h2`「最新文章」 | `#1c1917`（焦墨）| 视频暗部 `#132127` | **1.02:1** | 3.0（大字）|
| `p`「共 N 篇…」 | `#736a62`（淡墨）| 视频暗部 | **2.94:1** | 4.5 |

原因：`--text-mute`（`#736a62`）是**为宣纸底校准的中灰**，它的对比度同时依赖
「底足够亮」和「底足够暗」两个方向都不成立——放在播放中的视频上，
既不保底也不保顶。深色标题则只在视频亮部可读，暗部直接消失。

**波及范围**：全站 `text-ink-mute` 共 **50 处**。
（⚠️ 早前这里写的是「23 处」，是错的——见下文「grep 盲区」。）
其中在 `.card` 内的部分**是安全的**——`.card` 会重定义 `--text-mute` 为
`--card-ink-mute`，而且卡片自己提供了一层底；**裸露在页面上的部分才是问题**。

#### 标签字号统一（用户反馈「大小不一」）

`/tags/` 与 `/` 两处标签云都有一行**按文章数缩放字号**的内联样式：

```js
// /tags/：  0.8rem  + (count/maxCount) * 0.55rem   → 1.08rem ~ 1.35rem
// /：       0.75rem + (count/maxCount) * 0.3rem    → 0.90rem ~ 1.05rem
```

同一组标签里出现两种明显不同的大小，会被读成「排版出错」，
而不是「这篇标签下文章更多」——文章数已经由标签里的数字直接表达了。
已全部删除，两处标签云改用 `.chip` 基准字号（0.75rem）；
`/tags/` 的说明文案（「字号越大代表该标签下的文章越多」）也同步改掉。

**全站 `.chip` 实测字号审计**（`chip-audit.mjs`，逐页读计算样式）：

| 字号 | 改前 | 改后 | 出处 |
|---|---|---|---|
| 11.2px | 18 | 18 | 卡片内标签（`!text-[0.7rem]`）|
| 12px | 22 | **38** | `.chip` 基准 0.75rem |
| 12.8px | 5 | 5 | 页首徽章（`!text-[0.8rem]`）|
| 14.4 / 16.8px | 7 / 1 | **0** | 首页标签云（计数缩放，已删）|
| 17.28 / 21.6px | 7 / 1 | **0** | 标签页标签云（计数缩放，已删）|
| **合计** | **7 种** | **3 种** | |

**剩下 3 种**来自 5 处内联 `!text-[…]` 覆盖（Hero / about / archive / tags / PostCard），
属于「标签尺寸没有体系」。要彻底统一需另开一套 label 尺寸
（如 `.chip-sm` / `.chip` / `.chip-lg`，与按钮三档同样按高度比例缩放）。**未实施，等用户决定。**

#### ⚠️ grep 盲区（本会话踩到，重要）

PowerShell 的 `Select-String -Path "src\**\*.astro"` **只匹配一层子目录**，
会漏掉 `src/pages/tags/`、`src/pages/works/`、`src/pages/blog/` 这些更深一层的文件。
本会话因此把 `text-ink-mute` 的数量误报成 23 处（实际 50 处）。
**查全站一律用 ripgrep（grep 工具），不要用 PowerShell 的 `**` glob。**

**这不是单个元素的 bug，而是「全屏视频背景」与「为纸面校准的文字色阶」的根本冲突。**
可行的修法（未实施，待用户决定）：
1. **给区块加底**：把标题 + 副标题 + 筛选器合成一个面板（筛选器已经有面板，扩展即可）；
2. **复用头部那套做法**：给区块加一层纸色渐隐底；
3. **换文字色**：裸露在视频上的元信息改用能同时压住亮暗两端的颜色
   （但视频亮暗跨度太大，单靠换色无法两端都达标）；
4. **全局轻蒙层**：给 `main` 加很淡的纸色（例如 15%），代价是背景鲜亮度下降。

**测量坑**：`Page.captureScreenshot` 的 `clip` 在页面滚动后会按页面坐标解释
（本会话第三次踩到），一律改用「截整屏 + 后处理裁剪」。

### Hero 文字区的局部纸色底

`src/components/Hero.astro`（加 `hero-content` 类）+ `src/styles/global.css`

**问题**：Hero 整块文字都是深墨色（焦墨标题 `#1c1917`、重墨描述、淡墨统计），
而视频里有大面积深色（拱桥、废墟）。实测焦墨压在视频最暗处只有 **1.02:1**，
文字在深色背景上直接消失。

**为什么不做全局蒙层**：算过，要让最难的那行描述达到 4.5:1，纸色覆盖率需要约 **70%**，
视频只剩 30% 可见，鲜亮度基本没了。局部做 74% 只挡文字后面，
Hero 的上下留白与两侧完全不受影响，符合既定的「Hero 保持通透」。

**实现**：`.hero-content::before` —— `--bg` 74% 的绝对定位层，
用 `mask-image: radial-gradient(100% 100%, #000 78%, transparent)` 羽化边缘，
避免在视频上贴出一块边缘生硬的矩形。负 `inset` 是安全的，
因为 Hero 的 `<section>` 有 `overflow-hidden`，不会撑出滚动条。
用 `--bg` 而非写死颜色，深浅主题自动配对。

**关键的第二处修正**：只加底还不够。实测统计标签用的 `--text-mute`（`#736a62`）
在 74% 纸底上只有 **2.77:1**（它在完整纸底上是 4.82:1，差值全被半透明吃掉）。
解法与 `.card` 完全一致——**重定义色阶**：

```css
.hero-content {
  --text: var(--card-ink);
  --text-soft: var(--card-ink-soft);
  --text-mute: var(--card-ink-mute);
}
```

**实测（`hero-contrast.mjs` + `hero-analyze2.py`，暗/亮两端都测）**：

| 元素 | 视频暗部 `#0f1a20` | 视频亮部 `#cfe0ee` |
|---|---|---|
| 大标题（取渐层最亮一档作最坏）| 5.04:1 ✅ | 8.32:1 ✅ |
| 描述 | 7.86:1 ✅ | 12.98:1 ✅ |
| 统计数字 | 9.17:1 ✅ | 15.14:1 ✅ |
| 统计标签 | **6.42:1** ✅（修正前 2.77）| 10.60:1 ✅ |
| 顶部徽章 | 7.20:1 ✅ | 7.20:1 ✅ |

**⚠️ 测量教训（本轮踩到）**：分析脚本里**不要把前景色写死**。
我第一版把 `dt` 的前景色硬编码成 `#736a62`，页面已经改了色阶、脚本还在用旧值，
于是得出「改了没生效」的假结论，白跑一轮。**前景色一律从页面读实测的计算色**；
只有渐层文字例外（它的计算色是 `transparent`），要用渐层里最亮的一档作最坏值。

**仍未处理**：`text-ink-mute` 全站还有 50 处，其中裸露在视频上的部分同样不达标
（详见上一节）。这需要逐处判断是「收进面板」还是「复用 Hero 这套局部渐隐」。

#### ⚠️ Hero 的底：一次真实的 CSS 错误 + 浓度定值

用户反馈「首页的字体背景太大了，看看能不能改成作品页那样」。

**第一件事：作品页那处根本没有底。** 用 CDP 逐元素查两页页头区所有非透明背景：
`/works/` 页头只有「作品集」徽章（`rgb(239,233,222)`）与 `text-gradient` 文字本身带背景，
**标题和正文都没有底**；只有首页 `.hero-content` 有 `::before`。
用户截图里作品页「看起来有浅色块」，是因为**背景视频加载失败、整页都是兜底宣纸色**。
所以「照作品页改」等于取消底 —— 而那一类元素在真实视频暗部只有 1.02:1。

**第二件事（重要）：我写的 mask 完全没生效，那层底其实是硬边矩形。**

```css
/* 错误写法 */
-webkit-mask-image: radial-gradient(ellipse 100% 100% at 50% 50%, #000 78%, transparent 100%);
```

`ellipse 100% 100%` 是把椭圆**半径**设成整个盒子的宽高 —— 椭圆远大于盒子，
盒子完全落在 78% 平台区内，**mask 恒为 1**。
实测边缘：x=271 处 1 像素内亮度 30 → 188.7（梯度 **158.67**），
x=1167 处 188.3 → 27（梯度 **161.33**）；纵向 y=104 / y=612 同样是硬台阶。
渲染出来就是一块 896×508 的硬边矩形（只有 3rem 圆角）—— 这才是用户说的「太大」。

修正后（`closest-side` = 内切椭圆，淡出正好从盒子内缘开始）：
**最大逐像素梯度 158.67 → 10.33，过渡带约 90px，边界消失。**

**浓度 62% 是实测下限**（`veil-synthetic.mjs` + `glyph-contrast.py`）：

| 浓度 | h1(需3.0) | 描述(需4.5) | 统计数字 | 统计标签(需4.5) |
|---|---|---|---|---|
| 74% | 5.04 ✅ | 7.86 ✅ | 9.17 ✅ | 6.42 ✅ |
| 68% | 4.35 ✅ | 6.78 ✅ | 7.92 ✅ | 5.54 ✅ |
| **62%** | 3.73 ✅ | 5.82 ✅ | 6.79 ✅ | **4.75 ✅** |
| 56% | 3.18 ✅ | 4.96 ✅ | 5.79 ✅ | **4.05 ❌** |

**关键前提：必须按「整帧最暗处」定值，不能按首屏位置。**
视频是 `position: fixed`，Hero 会**随滚动移动到视频的不同部位上方**，
所以最坏情况是整个视频帧里最暗的地方，而不是滚动位置 0 处那块背景。
只按首屏测会得出「62% 就够」，但滚到暗处就不够。

#### ⚠️ 测量教训：按【字形像素】量，不要按元素包围盒

mask 让底在边缘变淡，而元素包围盒往往比文字宽得多
（h1 盒子 768px、实际文字只有约 430px 居中）。
按包围盒取 P5 会量到**没有文字的角落上的弱底**，得出虚低的假值：
同一个 62% 浓度，包围盒量出 h1 = **2.88（不达标）**，字形像素量出 **3.73（达标）**。
正确做法：用 `|带文字图 − 隐藏文字图|` 定位字形像素，只在这些像素上算对比度
（见 `glyph-contrast.py`）。

#### Hero 的底：最终形态 —— 逐块紧贴（"马克笔"效果）

用户明确提供了想要的效果图：**每行文字各自一块紧贴字形的纸色矩形**，而不是一整块面板。

**最终实现**（`global.css` 的 `.hero-plate` + `Hero.astro`）：

```css
.hero-plate {
  width: fit-content;        /* 底只包住自己的文字 */
  margin-inline: auto;       /* 各自居中 */
  background-color: color-mix(in srgb, var(--bg) 62%, transparent);
  padding: 0.05em 0.32em;
  border-radius: 0.08em;
}
```

应用到四处：h1 的两行（各自一个 `block` 的 `.hero-plate`）、描述 `<p>`、统计 `<dl>`。

**踩到的坑：`.text-gradient` 与底色冲突。**
`.text-gradient` 用 `background-clip: text`，它会把该元素上的**所有背景（含 background-color）
一起裁进字形里**。所以第二行标题不能直接把 `.hero-plate` 加在渐变元素上，
必须套一层：外层 `.hero-plate` 负责画底，内层 `.text-gradient` 负责渐变文字。

**圆角：必须用固定 rem，不能用 em。**
第一版写的是 `border-radius: 0.08em`，而 `em` 会随字号缩放，
实测四块底的实际圆角是 **4.8 / 4.8 / 1.44 / 1.28px**——差了近 4 倍，看起来就是没对齐。
已统一为 `0.5rem`（8px），与站点的「块级」圆角一致。

站点圆角词汇（改任何组件时照着选，不要发明新值）：

| 圆角 | 用在哪 |
|---|---|
| `0.25rem` 4px | `.chip`（标签）、`.btn.btn-sm` |
| `0.375rem` 6px | `.btn` / `.btn-md`、代码块、画廊容器 |
| **`0.5rem` 8px** | **`.hero-plate`**、`.card`、`.btn-lg`、`.filter-panel` |
| `0.75rem` 12px | `.paper-panel`、部分大面板 |

**实测（`plate-check.mjs` + `plate-analyze4.py`，背景取视频最暗处）**：

| 内容 | 底尺寸 | 字形尺寸 | 余量 左/右/上/下 | 完全覆盖 |
|---|---|---|---|---|
| 我的博客 | 272×75 | 233×57 | 20 / 20 / 12 / 7 | ✅ |
| 记录技术、生活 | 448×75 | 408×57 | 21 / 20 / 12 / 7 | ✅ |
| 描述 | 504×31 | 480×20 | 6 / 19 / 7 / 5 | ✅ |
| 统计 | 377×46 | 355×39 | 16 / 7 / 4 / 4 | ✅ |

四块的计算圆角均为 **8px**（`hug-check.mjs` 读 `borderTopLeftRadius` 验证）。

覆盖面积 **455k px² → 87k px²（减少 81%）**，而浓度仍是 62%，
所以对比度一点没损失（h1 3.73 / 描述 5.82 / 统计数字 6.79 / 统计标签 4.75，与整块底时完全一致）。

**被弃用的两个中间方案（都实测过，记下来免得重走）**：

1. **一整块 896×508 的局部底**——用户反馈「太大」，视觉上就是贴了一张大卡片。
2. **带 mask 羽化的柔边底**——本来想用它把边缘化开，但第一版的 mask 写法是错的
   （`radial-gradient(ellipse 100% 100% ...)` 把椭圆半径设成盒子宽高，椭圆远大于盒子，
   盒子落在平台区内 → mask 恒为 1，边缘照旧是硬的，实测 1px 内亮度跳 160）。
   改成 `closest-side` 后边缘确实变柔和了（梯度 158.67 → 10.33），
   但整块面积仍然大，最终还是换成了逐块紧贴。

#### ⚠️ 测量方法教训（本会话第二次踩到同类问题）

1. **按【字形像素】量，不要按元素包围盒。** mask/底的边缘会让包围盒里
   「没有文字的角落」带上弱底，得出虚低的假值：同一个 62%，
   包围盒量出 h1 = 2.88（不达标），字形像素量出 3.73（达标）。
   做法：`|带文字图 − 隐藏文字图| > 阈值` 定位字形像素。
2. **逐块判定时，分析区必须排除相邻块。** 两块底的间距只有 4px，
   用 ±14px 的分析区会吃进上一行的字，误报「露出 14px」。
   正确做法：分析区 = 本块外扩 M，再挖掉其它块（各外扩 6px）。
3. **冻结动画要用 `animation-play-state: paused`，不要用 `animation: none`。**
   后者会让 `.reveal` 元素停在初始的 `opacity: 0`，整块变空白、测出 0 个字形。

### 纸色小底 .paper-plate / .paper-row（全站统一方案）

**问题**：全屏视频背景 + 大面积深浅变化，任何单一文字色都无法在两端都达标。
所有**裸露在视频上的文字**都必须自带一层底。头部、Hero、筛选器、以及
`/archive/`、`/works/`、`/tags/`、`/about/` 的页头都属于这一类。

**方案**（`global.css`）：

```css
.paper-plate,
.paper-row {
  /* 浓度 58%：用户要求「比卡片淡一点、但比卡片深一点」。
     卡片是 --card-alpha 55%，所以底取 58% —— 落在 (55%, 62%) 区间内。 */
  background-color: color-mix(in srgb, var(--bg) 58%, transparent);
  --text: var(--card-ink);
  --text-soft: var(--card-ink-soft);
  /* ⚠️ 这一档必须比卡片那套更深：底从 62% 降到 58% 后，
     最小号的元信息（12px，如日期、统计标签）在视频最暗处只有约 4.3:1 不达标。
     用已有的 --color-brand-700(#332e29) 代替 --card-ink-mute(#3b342d)，
     实测回到 4.72:1。层级仍保留（soft 比 mute 更深）。 */
  --text-mute: var(--color-brand-700);
}
/* 紧贴文字、宽度自适应。刻意【不设】margin-inline —— 居中与否交给调用方：
   Hero 是居中的（加 mx-auto），其它页面页头是左对齐的（不加）。 */
.paper-plate { width: fit-content; padding: 0.06em 0.34em; border-radius: 0.5rem; }
.paper-row   { border-radius: 0.5rem; }   /* 列表行铺满整行，padding/圆角沿用行自己的 */
```

**「比卡片深一点」是实测确认过的**，不是按数值推断：
同一暗背景下，底的渲染亮度 **153.6**，PostList 的 `.card` 是 **164.5** —— 底比卡片深 10.9。
（卡片带 `backdrop-filter: brightness(1.6)`，会把背后的视频整体提亮，所以
不能只比 alpha 数值，必须比实际渲染色。）

**58% 下的对比度实测**（字形像素判定，视频最暗处）：

| 文字档 | 用色 | 最坏 P5 | 门槛 |
|---|---|---|---|
| 大标题（焦墨 + 渐层最亮档） | `brand-600` | 3.37:1 | 3.0 ✅ |
| 描述正文 | `--card-ink-soft` | 5.26:1 | 4.5 ✅ |
| 小号元信息（12px） | `brand-700` | **4.72:1** | 4.5 ✅ |

最紧的一项余量 1.05 倍。**不要再往下调浓度**：56% 时最小号文字就掉到 4.05:1。

**应用位置**：
- `Hero.astro`：标题两行（各自一块）、描述、统计
- `archive.astro`：h1、副标题、年份 h2、「N 篇」、每条列表行（`.paper-row`）
- `works/index.astro`：h1、描述、统计
- `tags/index.astro`：h1、副标题
- `about.astro`：h1

**渐层文字（`.text-gradient`）不能和底放在同一个元素上**：
`background-clip: text` 会把该元素上的**所有背景（含 background-color）一起裁进字形**。
两种规避方式：
- 底在**父元素**上（`文章<span class="text-gradient">归档</span>` 这种行内渐层）→ 直接给 h1 加 `.paper-plate`；
- 渐层元素本身就是整块内容时 → 外面再套一层承载底色（Hero 第二行就是这种）。

**实测（`plates-pixel.mjs` + `pix-analyze.py`，背景取视频最暗处，字形像素判定）**：
5 个页面共 **17 块底，全部完整覆盖自己的文字**，四周余量均为正。

| 页面 | 块数 | 圆角集合 |
|---|---|---|
| 首页 | 4 | 8px |
| 归档 | 7 | 8px |
| 作品 | 3 | 8px |
| 标签 | 2 | 8px |
| 关于 | 1 | 8px |

#### ⚠️ 又踩到一次层序问题

`.paper-row` 里写的 `border-radius: 0.5rem` **是无效的**：
列表行自带 Tailwind 的 `rounded-xl`(12px)，而 **Tailwind 的 utilities 层压过 components 层**，
所以实际渲染是 12px，和 `.paper-plate` 的 8px 不一致。
修法是把行上的 `rounded-xl` 改成 `rounded-lg`(8px) —— 即**改工具类，不要指望组件类能覆盖它**。
（这是本会话第三次遇到「层序优先于特异性」：前两次是 `.card` 内文字色、以及头部那条 1px 亮线。）

#### 🔍 全站扫描工具 `.probe-frames/sweep-bare.mjs`（不要再一个个页面补）

用户第二次指出「这里漏掉了」（首页的「最新文章」）。**逐个页面补是不可靠的**，
所以写了自动扫描：从每个含文字的元素往上走到 `body`，
若途中没有任何一层提供背景，就判定为「裸露在视频上」。

```js
const hasOwnBg = (el) => {
  ... background-color 非透明        -> 有底
  ... background-image 且 clip ≠ text -> 有底
  ... backdrop-filter 非 none         -> 有底
  ... ::before 有背景                 -> 有底
  else null
};
```

**⚠️ 判据里的关键坑：`background-clip: text` 必须排除。**
`.text-gradient` 用 `background-image` + `background-clip: text`，
只把渐变画进字形里，**完全不提供底**。第一版判据把「有 background-image」
当成有底，于是所有渐变文字都被误判为安全而漏报
（例如标签详情页 h1 整个是 `<span class="text-gradient">#{tag}</span>`，实际是裸露的）。
加上 `clip !== 'text'` 的条件后又多找出 2 处。

**扫描结果（11 个页面）**：修复前共 **40 处**无底文字，修复后 **0 处**。
修复涉及 6 个文件：

| 文件 | 修的位置 |
|---|---|
| `pages/index.astro` | 「精选推荐」h2 |
| `components/PostList.astro` | 「最新文章」h2、「共 N 篇…」p |
| `pages/tags/[tag].astro` | 面包屑 nav、h1（渐变在子 span）、「共 N 篇相关文章。」p |
| `pages/works/[id].astro` | 面包屑 nav、日期 span、h1、描述 p、「技术栈」span |
| `pages/blog/[id].astro` | 面包屑 nav、「相关文章」h2 |
| `pages/404.astro` | 「404」大字、h1、描述 p |

**验证结果：35 块纸色底，全部完整覆盖自己的文字**（字形像素判定，余量为正）。
圆角全站统一 **8px**。

#### ⚠️ 又一个测量假失败：平滑滚动

文章页的「相关文章」标题在页面 y≈4000+，截图视口（1400px）够不到，
所以第一次扫描报 `NO-GLYPH(0)`——**不是失败，是没采到**。
单独滚动过去复测时又出现 `FAIL 余量 L-16 R-15 T-16`，看起来整块都露在底外。

真因：站点设了 `scroll-behavior: smooth`。我用 `scrollIntoView()` 之后只等了 900ms，
**两次截图之间页面还在平滑滚动**，整张图都不一样，差异图把满屏像素当成了字形。
修法：注入 `html{scroll-behavior:auto !important}` + 用 `window.scrollTo()` 直接定位 + 等 1.5s。
复测通过（余量 左5 右7 上5 下4）。

**教训**：截图对比法要求两次截图之间**渲染状态完全一致**。
已知会破坏它的因素：入场动画（用 `animation-play-state: paused` 冻结，
不能用 `animation: none`——那会让 `.reveal` 停在 `opacity:0`）、平滑滚动、懒加载。

### 背景视频加载不出来：诊断与 poster 兜底

**现象**：页面背景是纯平宣纸色，视频从不出现。

**诊断（不是代码 bug，是对方服务器挂起传输）**：

用 CDP `Network` 域抓到了媒体请求的完整生命周期，这是决定性证据：

| 请求 | 结果 |
|---|---|
| `<video>` 的媒体加载器：`GET` + **`Range: bytes=0-`**，`type=Media` | **`net::ERR_TIMED_OUT`**，35 秒后 `<video>` 报 `MEDIA_ELEMENT_ERROR: Format error`（code 4） |
| 同一地址 `fetch(HEAD)`（无 Range） | **`200`，`video/mp4`** ✅ |
| 同一地址普通 `fetch` GET（无 Range） | 拿到 `200` 响应头，但 **body 卡住 90 秒 0 字节** |

所以：**对方在挂起传输，不是网络不通、也不是 Range 单方面的问题**（普通 GET 的 body 同样卡死）。
TCP 443 是通的，DNS 正常，`fetch(HEAD)` 正常 —— 只有需要传 body 的请求会挂。

**这是间歇性的**：本会话早期该视频能下载、能播放（有真实视频帧为证，
`.probe-frames/seam-fullpage.png` 就是从播放中的视频截的），重试多次之后就彻底不响应了。

**为什么用户那边能播**：间歇性失败 + 用户的浏览器一旦成功过就有缓存和连接复用，
而我的诊断每次都用**全新 profile**、每次都要重新下载 7 MB，几乎必然撞上被挂的那次。
（顺带确认：用户用的是 **Edge**，不是 Chrome；Edge 的缓存里也没有这个视频的副本，
扫描了 324 个 >1MB 文件，`ftyp` 命中全是 JS 代码缓存的误报。）

**尝试过但失败的自托管路径**（免得重走）：
- `curl`（提权）：TLS 凭证错误 / 超时
- 页面内 `fetch()` → `blob()` → base64 分片拉回：拿到 200 头后 body 卡死，90 秒未完成
→ **本机取不到视频字节，自托管必须由用户提供文件。**

**已做的兜底（不依赖网络）**：
从早期抓到的真实视频帧 `seam-fullpage.png` 裁出静态画面
（**必须裁掉顶部 120px**，那里有残留的站点头部 UI：顶部 64px 平均亮度 207，是纸色渐变），
存成 `public/bg-poster.jpg`（1440×780，JPEG q82，**215 KB**），
接到 `.bg-video` 的 `background-image` 上：

> ⚠️ **这张 poster 后来被证实是错的**：它只裁掉了头部，页面主体（Hero 标题、按钮、
> 统计、卡片）其实全「烧」在图里，于是刷新时视频没就绪、它顶上来当兜底背景，
> 就会闪一下旧 UI 残影。已于 2026-10-18 换成从 `bg-video.mp4` 抽的 t=0 干净静帧，
> 原因与修复见第九节末尾「追加修复：刷新时背景闪出旧 UI」。

```css
.bg-video {
  background-color: var(--bg);
  background-image: var(--bg-video-poster, none);  /* 由组件内联变量注入 */
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
```

组件新增 `poster` prop，默认 `withBase('/bg-poster.jpg')`。
视频能播时它自己盖在这层上面，播不了就是这张真实画面。

**实测**：`bg-video` 计算样式 `background-image: url(http://127.0.0.1:4321/bg-poster.jpg)`、
`videoReadyState: 0`（确认视频没加载）；页面左右留白区亮度标准差 **51.6 / 53.5 / 70.2**，
纯平纸色的标准差是 **0** —— 确认画面真的渲染出来了。

**⚠️ 这只解决「看起来正常」，没有解决「视频能播」。**

#### 已加的自动重试（因为失败是间歇性的）

失败既然时好时坏，就值得重试。`BackgroundVideo.astro` 的脚本里：

```js
const RETRY_DELAYS = [4000, 15000, 40000];  // 最多 3 次，逐步拉长
// 触发条件：<video> 的 error 事件 / stalled 事件 / 45 秒仍无任一层 readyState>=2
// 重试方式：给 src 加 `?r=N` 强制重新发起请求，绕开浏览器里那条已挂起的连接
// 只【所有层都没数据】时才重试，避免打断正常播放与交叉淡化
```

重试期间由 poster 静态画面兜底，页面视觉不会塌。

#### ✅ 已解决：自托管（文件是早前自己下好的，之前忘了）

**解决过程值得记一笔**：用户反馈「链接打不开」之后，我全盘搜索，
在 **`D:\video-probe\bg.mp4`** 找到了这个视频 —— 同目录还有 `download.mjs`：

```js
const url = "https://motionsites.org/assets/prompt-media/6fb049e38e9593f9699c.mp4";
const r = await fetch(url);
await writeFile("D:\\video-probe\\bg.mp4", Buffer.from(await r.arrayBuffer()));
```

**这是本会话早期（上下文被压缩之前）我自己下载的**，压缩后忘了它的存在。
特征全部吻合：**7,390,977 字节 = 7.05 MB**、**1920×1080**、**5.042 秒**
（与浏览器里量到的 `videoWidth: 1920` 和循环分析得到的 5 秒一致）。
教训：**先把「我手上已经有什么」查清楚，再去解决「怎么拿到它」**——
全盘搜一遍（按大小 + MP4 `ftyp` 签名）比反复重试下载快得多。

**已完成**：
1. 复制到 `public/bg-video.mp4`（哈希与原文件一致）
2. 构建自动切换为 `/bg-video.mp4`
3. **实测播放成功**：`readyState` 4、`1920×1080`、`duration` 5.042、
   `error` null、两次媒体请求都是 **`206 Partial Content`**
   （本地服务器支持 Range —— 这正是远程服务器挂住的那一环）
4. **实测画面真的在动**（不是冻帧）：`currentTime` 序列
   `2.3 → 3.805 → 1.452 → 2.909 → 4.309`（回落是 5.042s 循环绕回）；
   相邻截图背景区像素差 **8.5–14.7**（>0.5 即说明在动）

**注意：`moov` 在 `mdat` 之后（不是 fast-start）**。
播放器需要先拿到文件尾部才能起播，HTTP 支持 Range 时没问题（本地和 GitHub Pages 都支持），
只是多一个往返。要做 faststart 需要 ffmpeg（当前未安装）。

**体积**：`public/bg-video.mp4` 7.05 MB，`dist` 总计 8.15 MB。
GitHub Pages 能接受，但首屏偏重；压缩到 720p CRF30 约 0.4 MB，同样需要 ffmpeg。

#### 保留的 poster 与重试（仍然有用）

远程地址已不再使用，但两层兜底继续保留 —— 换设备/换网络/文件出错时仍然救场：
- **poster**：`public/bg-poster.jpg`（1920×1080 / 342 KB，由 `.probe-frames/extract-poster.mjs`
  从 `bg-video.mp4` 抽 t=0 帧，**不要再用截图裁**），视频没数据时显示真实画面而不是空白纸色
- **自动重试**：`RETRY_DELAYS = [4000, 15000, 40000]`，只在该播却没数据时触发

#### 自托管切换逻辑（保留，用于将来换视频）

`BackgroundVideo.astro` 在**构建期**检测 `public/bg-video.mp4` 是否存在：

```ts
const LOCAL_VIDEO = fileURLToPath(new URL('../../public/bg-video.mp4', import.meta.url));
const hasLocalVideo = existsSync(LOCAL_VIDEO);
const src = srcProp ?? (hasLocalVideo ? withBase('/bg-video.mp4') : REMOTE_VIDEO);
```

- 文件存在 → 用 `/bg-video.mp4`
- 文件不存在 → 退回远程地址

**用 `import.meta.url` 而不是 `process.cwd()`**：后者依赖从哪里执行构建，不可靠。
切换逻辑已**双向验证**（放临时假文件→地址翻转；删掉→变回远程；临时文件已清理）。

### 文字层级

| 用途 | 变量 | 值 |
|---|---|---|
| 标题 | `--text` | `#1c1917` |
| 描述 | `--text-soft` | `#4a443d` |
| 日期/元信息 | `--text-mute` | `#736a62` |
| 链接 | `--brand-text` | `#8c2620` |
| 印章 | `--seal` | `#a8322a` |

深色主题对应 `#ebe6dd` / `#b8b0a4` / `#8a8078`。

---

## 四、本次量化分析的全部结论（重要）

分析素材：从背景视频抽取 **10 帧**（1920×1080 → 320×180），
脚本与报告都在 `.probe-frames/`。

### 4.1 视频的客观特征

| 指标 | 数值 | 含义 |
|---|---|---|
| 平均亮度 | **87/255（14.2%）** | **整体很暗** |
| 亮度中位数 | 83/255（10.1%） | 一半画面比这还暗 |
| <128 的像素占比 | **80.7%** | 绝大部分是暗部 |
| 平均彩度 | 0.454 | 不算低 |
| 平均色相 | **192°**（冷青蓝） | 与站点暖色（24~42°）几乎对立 |
| 主色 | `#1c65aa` 12.2%、`#1c282b` 11.3%、`#0a1416` 10.8% | 亮蓝 + 暗青黑 |
| 时长/体积 | 5.04s / **7.05 MB** | 首尾帧差异 20.55（相邻仅 4.50）→ **循环有跳变** |

### 4.2 三条被数据推翻的直觉

**① 「把卡片变透明就能透出鲜亮」——错的。**
视频平均亮度只有 14.2%，卡片透明后会被**压暗**，透出来的是灰闷，不是鲜亮。

**② 「只调透明度就够了」——不够。**
卡片区域背景亮度落差高达 **0.56**（P95−P5）。单一文字色不可能在这么大的落差上处处达标。

**③ 「保留现有文字色」——做不到。**
实测（`.probe-frames/moderate.txt`）：暖宣纸 62% + 提亮 1.35 时，
现有文字实际对比度为 标题 6.6 ✓ / 描述 **3.6 ✗** / 日期 **2.0 ✗**。
日期那级的淡墨 `#736a62` 是最弱环节——要让它达标，卡片地板亮度需 ≥ 0.84（几乎不透明），与「透出背景」直接矛盾。

### 4.3 唯一可行的方向

**卡片背后必须被「提亮 + 加饱和 + 抬黑」**，也就是 `backdrop-filter`。
它只作用于卡片背后的区域，**背景视频本身一个像素都不动**——完全符合「只改卡片」。

**关键：必须加 `contrast(<1)`，光靠 `brightness()` 不够。**
数学原因：`brightness(b)` 是乘法，纯黑 `0 × b = 0` 永远抬不起来；
而 `contrast(c)` 的公式是 `out = (in − 0.5) × c + 0.5`，
当 `c < 1` 时纯黑会被抬到 `(1−c)/2`（如 `c = 0.7` → 黑变 0.15）。
视频 **80.7% 像素在暗部**，抬黑 = 直接抬高卡片的亮度地板 = 文字得以保留。

滤镜顺序（与 CSS 一致）：

```css
backdrop-filter: blur(16px) brightness(1.35) saturate(1.8) contrast(0.7);
```

模糊半径换算：帧 320px 代表 1920px 视口，故 **CSS px = 帧 px × 6**。

### 4.4 可行边界（`.probe-frames/frontier.txt`、`best.txt`）

浅色主题（保留文字层级 标题≥7 / 描述≥5.5 / 元信息≥4.5）：

| 配方 | 透出彩度 | 色相偏移 | 备注 |
|---|---|---|---|
| `#dce8f0` 74% + blur64 + 提亮1.5 + 饱和3.0 | 45% | ~6° | 彩度最高，但 blur 过大、提亮过猛 |
| `#fdfbf7` 62% + blur16 + 提亮1.35 + 饱和1.8 | ~28% | 4.3° | **温和，视觉最稳** |
| `#fdfbf7` 55% + blur20 + 提亮1.45 + 饱和2.2 | ~40% | 7.4° | 更透，需把文字压到 `#232019` |

**注意**：透出彩度越高，色相偏移越大（越偏青），也越容易「违和」。
这是一条**单调权衡曲线**，没有免费的午餐。

### 4.5 朱红印章的问题（需要用户决策）

朱红 `#a8322a` 压在玻璃卡上只有 **2.5:1**（浅色主题）——远低于 4.5:1。
它目前用于：卡片顶部的 2px 红丝、`精选` 角标、列表项的朱点。
作为**纯装饰**（非文字）不违反 WCAG，但视觉上会发灰。
建议：**保留**（它是全站唯一点睛色，去掉会失去水墨味），或加深到 `#8c2620`。

---

## 五、环境与操作（踩过的坑）

### 必须知道的

| 事项 | 做法 |
|---|---|
| **构建/预览** | 必须用 `sandbox_permissions: danger-full-access`（Vite `optimizeSafeRealPathSync` → `spawn EPERM`） |
| **npm install** | `npm install --no-audit --no-fund --ignore-scripts --cache "D:\个人博客\.npm-cache"` |
| **Node** | `C:\Program Files\nodejs\node.exe` |
| **Python（分析脚本）** | `C:\Users\Eternity\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe`（含 PIL 12.3.0 / numpy 2.3.5） |
| **无头浏览器截图** | `C:\Program Files\Google\Chrome\Application\chrome.exe`，**必须加 `--no-sandbox --disable-crashpad` 且用 danger-full-access**，否则 crashpad 自终止 |
| **PowerShell 中文乱码** | 不要用管道看中文；脚本写文件（UTF-8）再 `read` 工具读 |

### 预览服务器会莫名死掉

`Start-Process` 起的独立进程也活不过几轮对话。重启：

```powershell
Start-Process -FilePath "C:\Program Files\nodejs\node.exe" `
  -ArgumentList @("D:\个人博客\node_modules\astro\astro.js","preview","--host","127.0.0.1") `
  -WorkingDirectory "D:\个人博客" -WindowStyle Hidden -PassThru
```

**必须带 `--host 127.0.0.1`**：Astro 默认 host 解析成 `::1`（仅 IPv6），用户浏览器打不开。

更省事的办法——让用户自己开一个终端跑，进程归终端管：

```
cd /d D:\个人博客
npm run preview -- --host 127.0.0.1
```

### 回滚

**没有 git 仓库。** 唯一回滚点：

```
D:\个人博客-backups\个人博客-backup-20261012-093557.zip   (233 KB, 47 个文件)
```

**建议下一步先 `git init` 并提交一次**，否则每次改动都只能靠这个 zip。

### 网络

**本机外网不可用**（`SEC_E_NO_CREDENTIALS` / `web_fetch` TypeError）。
背景视频 URL 与 Figma 字体**从未成功抓取过**，但视频在用户浏览器里能正常播放。
`.probe-frames/f0*.png` 是**之前**用 ffmpeg 从视频抽出的帧，是本次全部分析的数据源——
**这些帧要留着**，是唯一的视频像素证据。

---

## 六、下一步（按优先级）

### 1. 卡片配方已定稿（方案 D）

用户已选定：**深色主题 = 方案 D（不用 backdrop-filter，只靠 78% 半透明）**。
已写入 `src/styles/global.css`：

```css
html.dark {
  --card-alpha: 78%;
  --card-ink: #faf7f2;  --card-ink-soft: #f0ece4;
  --card-ink-mute: #e4ded2;  --card-link: #f5c9ba;
}
/* 深色刻意不用滤镜。单独立一条规则而不是把 --card-filter 设成 none，
   是为了避免 Lightning CSS 把两条取值相同的 backdrop-filter 声明去重合并 */
html.dark .card { -webkit-backdrop-filter: none; backdrop-filter: none; }
```

实测（跨 12 帧）：dark 首页 7.77:1、dark works 6.39:1、light 首页 5.26:1，全部 ≥4.5:1。

对比实验页：`public/lab-recipes.html`（构建后 `http://127.0.0.1:4321/lab-recipes.html`）。
**已于 2026-10-20 删除**（上线前清理，不属于站点内容）；要复现配方对照需从备份 zip 里取回。

**注意事项**：
- `.card` 用在 16 处（文章卡、作品卡、侧边栏、标签云、关于页等），改一处全站生效。
- **`.card-gradient-border` 的 `isolation: isolate`** 会创建新的层叠上下文，可能影响 `backdrop-filter`。
- 浅色主题仍使用 `backdrop-filter`，是**性能热点**（大面积视频上逐帧重算）。卡片多时要实测滚动帧率。
- 要给某些卡片保留实底（如代码块、侧边栏），用 `.card-solid` 覆盖类。

### 2. 背景视频：待用户确认交叉淡化 + 建议自托管

- **请用户目视确认**：`fade={0.7}` 的交叉淡化是否消除了每 5.04 秒的硬跳。
  若观感不好或想要原来的行为，把 `<BackgroundVideo>` 的 `fade` 设为 `0` 即可退回硬切。
- **建议自托管压缩视频**（`.probe-frames/` 里没有 ffmpeg，本机无法重压）：
  720p CRF30 约 0.43 MB，比现在小 16 倍；可一并解决「首访 6~13 秒」「CDN 限流后不供流」
  「淡化的双份下载」三个问题。若能重压，建议把叠化直接烤进文件，就不需要双视频方案了。

### 3. 「精选」徽章 4.07:1（唯一剩余的不达标项）

白字压朱红实底 `bg-seal`，在**深色主题**下是 4.07:1（浅色主题 6.66:1，达标）。
它是**实底徽章**，不受卡片透明度影响，任何卡片配方都改不动它。

两种修法（未实施，等用户发话）：
1. 深色主题下把徽章底色换成更浅的朱红，或文字改深色；
2. 把徽章字号提到「大字」标准（≥18.66px 粗体或 ≥24px），此时 AA 门槛降为 3:1。

### 4. 其他遗留（用户之前未答）

- **视频体积 7.05 MB → 可压到 0.43 MB**（720p CRF30，小 16 倍）。

### 5. 部署前必改（✅ 2026-10-20 已全部完成）

1. ~~`astro.config.mjs` 的 `site` 目前是 `https://example.com` 占位符。~~
   → 已改为 `https://EVAE-AL.github.io`（用户主页仓库，部署在域名根路径，**不设 `base`**）。
2. ~~**删掉 `public/lab-recipes.html`**（约 20 KB）——它是开发用的对比页，不该上线。~~
   → 已删除，`smoke.mjs` 的页面清单里也一并移除。
3. ~~`src/config.ts` 的站点名 / 作者名 / 社交链接仍是占位。~~
   → GitHub 链接已指向 `https://github.com/EVAE-AL`；占位的 `mailto:hello@example.com` 已移除
   （没有真实邮箱，留一个假地址比不显示更糟）。
4. 额外清理：`BaseLayout.astro` 里指向 `motionsites.org` 的 `preconnect` 已删——
   视频自托管后不再访问第三方域名，那条预连接纯属浪费。

**上线结果**：<https://evae-al.github.io/> —— 11 页全部 200、零 JS 异常、零横向溢出；
背景视频线上实测 `readyState=4` / 1920×1080 / 5.042s / 三个 `206 Partial Content`；
canonical、og:url、og:image、rss、robots、sitemap 全部指向新域名。

**踩到的网络坑（这台机器专属）**：`github.com` 解析到 `20.205.243.166` 被阻断（TCP 443 不通，
ping 也不通），而 `api.github.com`、`ssh.github.com:443`、`140.82.112.3` 都正常。
所以 `git push` 一开始报 `Recv failure: Connection was reset`。解法是把 IP 钉住：

```powershell
git -c http.curloptResolve=github.com:443:140.82.112.3 push -u origin main
```

（`gh` CLI 走 `api.github.com`，不受影响，所以建仓库、开 Pages 都正常。）
以后推不动先 `Test-NetConnection github.com -Port 443` 确认是不是这个原因，
不要盲目以为是凭据或代理问题。

### 6. 待用户决策的历史遗留

- `LoadingScript.astro` 的 `ONCE_PER_SESSION` 当前 `false`（每次加载都播）
- Hero 居中版式是否保留
- `/works/` 是否同时保留环形画廊和卡片网格
- 长文 `--panel-alpha: 86%` 是否随卡片一起调整

---

## 七、文件地图（本次相关）

```
D:\个人博客\
├─ astro.config.mjs              # site = https://EVAE-AL.github.io（无 base）
├─ package.json                  # 6 个依赖，无 React
├─ src\
│  ├─ config.ts                  # 站点/作者/导航配置（GitHub 已指向真实账号）
│  ├─ styles\global.css          # ★ 设计系统，卡片改动在此
│  ├─ components\
│  │  ├─ BackgroundVideo.astro   # 背景视频，scrim = 0
│  │  ├─ Header.astro            # ★ 内含页面顶部的纸色渐隐底（本次新增）
│  │  ├─ LoadingScreen.astro     # 加载动画
│  │  ├─ LoadingScript.astro     # 加载动画的 head 内联脚本
│  │  ├─ InkGallery.astro        # 环形画廊
│  │  ├─ PostCard.astro          # 文章卡（3 种变体）
│  │  └─ Footer.astro / Hero.astro
│  ├─ layouts\BaseLayout.astro
│  ├─ scripts\ink-gallery.ts / loading-screen.ts
│  └─ pages\                     # 9 个页面文件
├─ public\                       # bg-video.mp4 / bg-poster.jpg / og-default.jpg / favicon.svg
├─ .probe-frames\                # ★ 全部分析脚本与报告（见下）
└─ README.md
```

### `.probe-frames/` 里的东西

| 文件 | 内容 |
|---|---|
| `f001.png` ~ `f010.png` | **从视频抽的 10 帧**（320×180），早期分析数据源，勿删 |
| `header-multiframe.mjs` + `hmf-contrast.py` | ★ **头部对比度跨 12 帧采样**（本轮新增，最可信） |
| `measure-header.mjs` / `measure-header2.mjs` | 早两版头部测量（`clip` 坐标口径有坑，已被上面取代） |
| `header-info.json` / `hmf-light.json` / `hmf-dark.json` | 头部元素几何与前景色 |
| `hmf-light.txt` / `hmf-dark.txt` | 头部对比度结论（浅色 5.82:1 / 深色 5.89:1） |
| `fin-contrast.py` + `fin-*.png` | 整屏截图版对比度验证（用于排除 `clip` 坐标歧义） |
| `smoke.mjs` + `smoke.json` | ★ **全站 11 页冒烟**（头部/溢出/JS 报错/导航数）；`smoke.json` 在 `.probe-frames/live/` 下是线上那轮的记录 |
| `lab-verify.mjs` / `lab-shot.mjs` | 对比页渲染验证与截图 |
| `tune-dark.mjs` + `tune-eval.py` | 深色卡片配方扫描（56 帧） |
| `cdp-multi.mjs` / `cdp-text.mjs` / `multiframe.mjs` | 卡片文字对比度回归（几何 + 跨帧） |
| `bf-test.mjs` / `bf-video-test.mjs` | `backdrop-filter` 在纯色 vs 视频图层上的对照 |
| `diag-lab-video.mjs` / `diag-smoke.mjs` | 视频加载与「服务器掉线」类假象的诊断 |
| `f001~f010` 之外的 `*.txt` | 早期视频配色/滤镜报告（`report.txt`、`frontier.txt`、`best.txt` 等） |

---

## 八、给接手者的一句话

**别再靠「调透明度」猜**，也别再信「改了 CSS 就一定生效」：
本项目已经两次被 **cascade layer（层序优先于特异性）** 坑到，
凡是「卡内覆盖样式不生效」，先怀疑层序，再看特异性。

方向是 **`backdrop-filter` 调色 + 卡内独立文字色阶**，
剩下的就是**用户的眼睛**决定取值。

**我看不到渲染结果**（本模型不接受图像输入），所有视觉结论都来自像素计算。
凡涉及「好不好看」的判断，必须交给用户。

**测量方法论的三条铁律**（本轮踩坑换来的）：

1. **先确认前提，再下结论。** `Page.navigate` 返回 `errorText` 时要立刻报错——
   预览服务器掉线时 Chrome 显示错误页，会被误读成「站点没有头部」。
2. **坐标口径要对齐。** `Page.captureScreenshot` 的 `clip` 在滚动状态下可能被解释成
   页面坐标而非视口坐标，导致测到完全无关的像素（曾因此得出「深色头部背景是纯白」的假结论）。
   稳妥做法：**截整屏，再按视口坐标自行裁剪**。
3. **视频要等，帧要扫全。** 远程 MP4 首次加载需 6~13 秒，`videoWidth == 0` 时测出的一切都无意义；
   且必须扫完整 12 帧循环，不能只取一两个时间点。

---

## 九、主题切换的圆形揭示（2026-10-18 追加）

### 做了什么

点右上角主题按钮时，**从点击那一点**用一个 `clip-path: circle()` 把新主题「擦」出来：
旧主题停在原地，新主题以点击点为圆心扩到刚好盖满视口。反向（暗→亮）同样适用。

| 文件 | 改动 |
|---|---|
| `src/components/ThemeToggle.astro` | 揭示动画本体（点击原点、半径、时长、缓动、降级、连点排队） |
| `src/components/ThemeScript.astro` | 把切换能力收敛成 `window.__theme.{current,set,toggle}`；首屏初始化不再写 localStorage |
| `src/styles/global.css` | `::view-transition-old/new(root)` 关掉默认交叉淡化并显式排层级 |
| `src/scripts/ink-gallery.ts` | `theme-change` 里补一次**同步** `renderer.render()`（原因见下） |

### 为什么用 View Transitions 而不是自己铺色块

本站整页背景是持续播放的视频，自己铺一层新主题色块只能盖住纯色，视频和页面内容会瞬间消失。
`document.startViewTransition()` 会把切换前后各截一张整屏快照，两帧内容严格对齐，
圆边扫过的每一处只是颜色变了 —— 观感是「擦开」，不是「盖住」。

```css
/* global.css：必须未分层（层序坑见第三节） */
::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }
::view-transition-old(root) { z-index: 1; }
::view-transition-new(root) { z-index: 2; }
```

```js
// ThemeToggle.astro
const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
const transition = document.startViewTransition(() => api.set(next));
transition.ready.then(() => document.documentElement.animate(
  { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
  { duration, easing: 'cubic-bezier(0.25,0.46,0.45,0.94)',
    pseudoElement: '::view-transition-new(root)', fill: 'both' }
));
```

- **缓动用 easeOutQuad，不是站点入场动画的 easeOutExpo**：半径 1500px 的圆在 expo 下
  前 13% 时间就扫掉 56% 半径、后面在角落蠕动；quad 下面积覆盖在 25/50/75% 时间点约
  14%/61%/89%，扩张更均匀。（第一版用 expo，实测曲线后才换掉。）
- **时长随半径变**：`clamp(400, r * 0.42, 820)`；1440×900、按钮在右上角时 r≈1548 → 约 650ms。
- **键盘触发**：`MouseEvent.detail === 0` 时没有真实坐标，圆心回退到按钮中心（否则从屏幕左上角冒出）。
- **降级**：不支持 `startViewTransition` 或 `prefers-reduced-motion: reduce` → 瞬时切换，功能不变。
- **连点**：动画期间再点会排到下一轮（两次点击 = 切回原主题，语义一致）。
- **画廊要同步渲染**：新快照是在 `theme-change` 回调之后截的，而 ogl 的纹理上传发生在每帧
  `renderer.render` 里；不补这一次同步 render，新快照里画廊还是旧配色，揭示结束后会「啪」地跳一下。

### 实测（`.probe-frames/theme-reveal/`）

- `getComputedStyle(el, '::view-transition-new(root)')` 逐帧采样：半径单调增长，圆心 = 点击坐标
  `(1285,35)`，终点 `1549.02px` = `hypot(1285, 865)`，恰好盖满视口；双向一致。
- **像素级交叉验证**：从录屏帧里量头部明暗分界反解半径，得到 371/585/717/896/1000/1135/1212，
  与 clip 采样 371.6/585.2/717.4/895.8/1000.1/1135.4/1211.8 逐个吻合 —— 画面上确实是这个圆。
- 回归：鼠标点击、连点回弹、键盘圆心、reduced-motion 降级、`/works/`（WebGL 画廊）全通过，
  控制台 **0 错误**。
- 对照图 `montage-light-to-dark.jpg` / `montage-dark-to-light.jpg`（红线标量到的边界）；
  动图 `reveal-light-to-dark.gif` / `reveal-dark-to-light.gif`。

### 踩到的两个测量坑（别再踩）

1. **`Page.startScreencast` 的 `metadata.timestamp` 不是呈现时刻**：实测比画面内容早约 130ms，
   拿它对齐 clip 采样会得出「半径对不上」的假结论。要么从画面自己量，要么别用它的时间轴。
2. **用头部明暗分界量半径时，窗口只取 x∈[40,1000]**：深色主题下头部渐隐底在 x>1098 处
   会透出视频亮部（实测亮到 138），阈值判定会把边界量错。

### 已知取舍

- 揭示期间整页是静态快照，**背景视频冻结约 650ms**，结束后从冻结处继续（约 0.65s 的跳进）。
  这是 View Transitions 的固有行为；本站视频是慢速环境镜头，实际观感可接受。
- 点击到圆开始扩张之间有快照采集延迟（无头 + 同步录屏负载下实测可达 150ms；真实浏览器一般 1~2 帧）。

### 追加修复：刷新时背景闪出旧 UI（poster 残影）

**用户反馈**：「背景有问题，再刷新的时候会闪出东西就像图片」，附一张背景截图，
上面能隐约看到「生活」「前端」「23」等旧页面元素。

**根因：`public/bg-poster.jpg` 本身就是一张「烧进了整页 UI」的截图。**
它当年是从早期整页截图 `seam-fullpage.png` 里裁的，只裁掉了顶部 120px 的头部，
页面主体（Hero 标题、按钮、统计、卡片）全都留在图里 —— 平时被播放中的视频盖着看不出来；
但**刷新时视频还没就绪，这张图会顶上来当背景**，那些半透明旧 UI 就「闪一下像图片」。

**修复**：改成从 `public/bg-video.mp4` 里抽 t=0 静帧（本机没有 ffmpeg，
用无头 Chrome 的 `<video>` + canvas `toDataURL` 抽帧）：
- 脚本：`.probe-frames/extract-poster.mjs`（**以后换视频就重跑它，别再用截图裁**）
- 产物：`public/bg-poster.jpg`，1920×1080 / 342 KB / JPEG q80
- 附带好处：新图是 16:9，和视频比例一致，`background-size: cover` 与
  `video` 的 `object-fit: cover` 裁切完全对齐，poster → video 的交接不再跳画面。

**复现与对照**（`.probe-frames/refresh/`，`refresh-probe.mjs`）：
用 CDP `Network.setBlockedURLs` 把 `bg-video.mp4` 屏蔽掉 = 把「视频未就绪」那一瞬拉长成几秒，
然后 `Page.reload` + `Page.startScreencast` 连拍，同一时间点新旧 poster 各取一张：
`refresh-before-after.jpg`（上排旧 poster 能清楚看到幽灵 UI，下排新 poster 干净）。


