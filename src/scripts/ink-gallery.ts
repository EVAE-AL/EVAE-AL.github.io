/**
 * 水墨环形画廊 —— 原生 WebGL 实现（依赖 ogl）
 *
 * 效果来源：Codrops 的 Infinite Circular Gallery（Luis Bizarro），
 * React Bits 把它包装成了 React 组件。这里用原生 JS 重写，
 * 好处是不必为一个画廊引入整个 React 运行时。
 *
 * 交互：滚轮 / 拖拽水平浏览，点击卡片跳转。
 * 降级：WebGL 不可用或初始化失败时保留根元素里的 <ul> 列表。
 */

export interface GalleryItem {
  id: string;
  title: string;
  /** 封面大字 */
  char: string;
  /** 角标文字，如「已完成」 */
  meta: string;
  href: string;
}

export interface GalleryOptions {
  /** 弯曲程度：0 为直线排列 */
  bend: number;
  /** 滚轮灵敏度 */
  speed: number;
  /** 跟随缓动，越小越慢 */
  ease: number;
  /** 卡片配色：ink 墨色底 | paper 宣纸底 | auto 跟随站点主题 */
  theme: 'ink' | 'paper' | 'auto';
}

/** 卡片纹理尺寸（竖向 4:5） */
const TEX_W = 640;
const TEX_H = 800;

type ThemeName = 'ink' | 'paper';

interface Palette {
  /** 底色渐变，从亮到暗 */
  stops: readonly string[];
  glow: string;
  /** 边缘内描边：浅色卡压在浅色面板上时靠它托出卡片轮廓 */
  edge: string;
  char: string;
  title: string;
  meta: string;
  rule: string;
}

/**
 * 装饰性颜色（底色渐变 / 晕染 / 描边 / 分隔线）写在这里；
 * 文字色则从设计系统的 CSS 变量实时读取，让画廊和站点卡片共用同一套色阶。
 */
const DECOR: Record<ThemeName, Omit<Palette, 'char' | 'title' | 'meta'>> = {
  ink: {
    // 深色主题的卡片底色（从亮到暗）。
    // 曾按「调淡卡片」的误读把它整体提亮过，用户随后澄清要调的是外层大面板，
    // 所以这里已还原。想单独调卡片深浅，改这三个值即可。
    stops: ['#332e29', '#221e1b', '#14110f'],
    glow: 'rgba(250,248,244,0.20)',
    edge: 'rgba(235,230,221,0.16)',
    rule: 'rgba(250,248,244,0.22)',
  },
  paper: {
    // 容器本身是 86% 宣纸（--panel-alpha），所以卡片必须比容器【更深一点】才有轮廓：
    // 实测原来那组（#fdfbf7→#efe9de）只比容器暗 7.1，几乎糊成一片；
    // 把顶端压到容器色之下、底端再深一档，卡片才读得出来。
    stops: ['#fbf8f2', '#f2eee4', '#e7e1d4'],
    glow: 'rgba(28,25,23,0.08)',
    edge: 'rgba(28,25,23,0.20)',
    rule: 'rgba(28,25,23,0.18)',
  },
};

/**
 * 把 CSS 变量解析成 canvas 能用的具体颜色。
 *
 * 不能直接对自定义属性取 getComputedStyle：那样拿到的是原样的 token
 * （例如 `var(--color-seal-600)`），canvas 不认识。必须让浏览器真的解析一次，
 * 所以用一个不可见的探针元素把 var() 赋给 color，再读回计算值。
 * fallback 写进 var() 的第二个参数，这样变量被改名也不会退化成继承色。
 */
function readVar(el: HTMLElement, name: string, fallback: string): string {
  const probe = document.createElement('span');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText =
    'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none';
  probe.style.color = `var(${name}, ${fallback})`;
  el.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved || fallback;
}

function buildPalette(el: HTMLElement, theme: ThemeName): Palette {
  const dark = theme === 'ink';
  return {
    ...DECOR[theme],
    char: readVar(el, '--card-ink', dark ? '#faf7f2' : '#1c1917'),
    title: readVar(el, '--card-ink-soft', dark ? '#f0ece4' : '#2b2620'),
    meta: readVar(el, '--card-ink-mute', dark ? '#e4ded2' : '#3b342d'),
  };
}

/** `auto` 按站点当前主题解析；显式传入 ink/paper 时优先级更高 */
function resolveTheme(option: GalleryOptions['theme']): ThemeName {
  if (option === 'ink' || option === 'paper') return option;
  return document.documentElement.classList.contains('dark') ? 'ink' : 'paper';
}

const SEAL = '#a8322a';
const SERIF = '"Songti SC","Source Han Serif SC","Noto Serif SC","STSong","SimSun",serif';

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** 用 Canvas 2D 画一张卡片，作为 WebGL 纹理。
 *  传入 reuse 时会重绘到同一块 canvas 上（主题切换用），
 *  注意重设 width 会顺带清空画布，所以每次都是干净重画。 */
function drawCardTexture(
  item: GalleryItem,
  palette: Palette,
  reuse?: HTMLCanvasElement
): HTMLCanvasElement {
  const canvas = reuse ?? document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 底色渐变
  const bg = ctx.createLinearGradient(0, 0, TEX_W * 0.7, TEX_H);
  palette.stops.forEach((color, i) => bg.addColorStop(i / (palette.stops.length - 1), color));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  // 墨晕
  const glow = ctx.createRadialGradient(
    TEX_W * 0.3, TEX_H * 0.24, 0,
    TEX_W * 0.3, TEX_H * 0.24, TEX_W * 0.78
  );
  glow.addColorStop(0, palette.glow);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  // 边缘内描边：宣纸卡压在浅色面板上时，靠这圈淡边把轮廓托出来。
  // 圆角由片元着色器的 SDF 负责裁切，这里只管画在纹理边缘。
  ctx.strokeStyle = palette.edge;
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, TEX_W - 6, TEX_H - 6);

  // 顶部朱红细线。纹理高 800px，4px 缩放到卡片上约 2px，
  // 与作品网格卡片顶部的红条粗细保持一致。
  ctx.fillStyle = SEAL;
  ctx.fillRect(0, 0, TEX_W, 4);

  // 封面大字
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = palette.char;
  ctx.font = `bold 240px ${SERIF}`;
  ctx.fillText(item.char, TEX_W / 2, TEX_H * 0.44);

  // 分隔线
  ctx.strokeStyle = palette.rule;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(TEX_W * 0.18, TEX_H * 0.72);
  ctx.lineTo(TEX_W * 0.82, TEX_H * 0.72);
  ctx.stroke();

  // 标题
  ctx.fillStyle = palette.title;
  ctx.font = `bold 42px ${SERIF}`;
  ctx.fillText(truncate(item.title, 11), TEX_W / 2, TEX_H * 0.79);

  // 角标
  ctx.fillStyle = palette.meta;
  ctx.font = `26px ${SERIF}`;
  ctx.fillText(item.meta, TEX_W / 2, TEX_H * 0.87);

  return canvas;
}

/** 圆角 + 透明度，让卡片边缘不是硬切 */
const FRAGMENT = /* glsl */ `
  precision highp float;

  uniform sampler2D tMap;
  uniform float uAlpha;
  uniform float uRadius;
  uniform vec2 uSize;

  varying vec2 vUv;

  // 标准圆角矩形 SDF：内部为负、外部为正
  float roundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }

  void main() {
    vec4 tex = texture2D(tMap, vUv);

    // 把 uv 换算到卡片的世界尺寸，否则 SDF 会被非等比拉伸
    vec2 p = (vUv - 0.5) * uSize;
    float dist = roundedBox(p, uSize * 0.5, uRadius);

    // 羽化宽度也必须是世界单位（约合 2px），不能按像素写
    float mask = 1.0 - smoothstep(-0.003, 0.003, dist);

    gl_FragColor = vec4(tex.rgb, tex.a * mask * uAlpha);
  }
`;

const VERTEX = /* glsl */ `
  attribute vec3 position;
  attribute vec2 uv;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;

  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

interface MediaEntry {
  item: GalleryItem;
  program: any;
  mesh: any;
  /** 保留纹理与它的画布，主题切换时原地重绘并标记重传 */
  texture: any;
  canvas: HTMLCanvasElement;
  /** 每帧写入，供点击命中判定使用（CSS 像素） */
  screenX: number;
  screenWidth: number;
}

export async function initInkGallery(root: HTMLElement, options: GalleryOptions): Promise<void> {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  if (!canvas) throw new Error('canvas missing');

  // 先探测 WebGL，避免在动态 import 之后才发现不支持
  const probe = document.createElement('canvas');
  if (!probe.getContext('webgl') && !probe.getContext('experimental-webgl')) {
    throw new Error('WebGL unsupported');
  }

  const { Renderer, Camera, Transform, Plane, Program, Mesh, Texture } = await import('ogl');

  // 注意：Renderer 构造函数会用默认尺寸（300×150）调用 setSize()，
  // 把 canvas 的 CSS 宽高直接写成像素值。所以必须在 new Renderer 之前
  // 量好容器尺寸，否则之后读 canvas.clientWidth 只会拿到 300。
  const initialW = Math.max(1, Math.round(root.clientWidth || 800));
  const initialH = Math.max(1, Math.round(root.clientHeight || 600));

  const renderer = new Renderer({
    canvas,
    width: initialW,
    height: initialH,
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
  });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);

  const camera = new Camera(gl, { near: 0.1, far: 100 });
  camera.position.z = 5;

  const scene = new Transform();

  const items: GalleryItem[] = JSON.parse(root.dataset.items ?? '[]');
  if (items.length === 0) throw new Error('no items');

  // 世界坐标：可视宽度固定为 2（x 从 -1 到 1），高度按画布比例推导
  let viewW = 2;
  let viewH = 2;

  // 纹理宽高比
  const ASPECT = TEX_W / TEX_H;

  /**
   * 卡片宽度取两个约束的较小值：
   *   - byHeight：不超出画布高度（宽屏时主要由它决定）
   *   - maxByWidth：占视野宽度的上限（窄屏时由它兜底，否则手机会算得过大）
   * 用「视野宽度」做基准，卡片在画面里的占比才稳定。
   */
  const cardW = () => {
    const byHeight = viewH * 0.78 * ASPECT;
    const maxByWidth = viewW * 0.55;
    return Math.max(0.12, Math.min(byHeight, maxByWidth));
  };
  const cardH = () => cardW() / ASPECT;

  /** 间距随卡片缩放，避免窄画布下空隙显得过大 */
  const gap = () => cardW() * 0.1;
  const step = () => cardW() + gap();

  const media: MediaEntry[] = [];

  // 无限循环靠「取模」实现：只有当内容总宽 ≥ 视野宽 + 一张卡片时，
  // 卡片才会在完全移出画面后才绕回。作品太少时达不到这个条件，
  // 卡片会在仍然可见的位置瞬移（看起来像画面跳动），所以先把列表
  // 重复到至少 MIN_CARDS 张。重复项指向同一个详情页，不会造成困惑。
  const MIN_CARDS = 6;
  const repeat = Math.max(1, Math.ceil(MIN_CARDS / items.length));
  const cards = repeat > 1 ? Array.from({ length: repeat }, () => items).flat() : items;

  let currentTheme = resolveTheme(options.theme);
  const initialPalette = buildPalette(root, currentTheme);

  cards.forEach((item) => {
    // flipY 必须保持默认的 true：canvas 第一行在顶部，而纹理坐标原点在左下，
    // 关掉它卡片上的文字会整片上下颠倒。
    // generateMipmaps 关掉是因为纹理尺寸（640×800）不是 2 的幂。
    const texCanvas = drawCardTexture(item, initialPalette);
    const texture = new Texture(gl, {
      image: texCanvas,
      generateMipmaps: false,
    });

    const program = new Program(gl, {
      vertex: VERTEX,
      fragment: FRAGMENT,
      transparent: true,
      depthTest: false,
      uniforms: {
        tMap: { value: texture },
        uAlpha: { value: 1 },
        // 圆角半径是「世界单位」，约为卡片宽度的 5.5%（resize 时同步）
        uRadius: { value: cardW() * 0.055 },
        uSize: { value: [cardW(), cardH()] },
      },
    });

    const mesh = new Mesh(gl, { geometry: new Plane(gl), program });
    mesh.setParent(scene);

    media.push({ item, program, mesh, texture, canvas: texCanvas, screenX: 0, screenWidth: 0 });
  });

  /* 主题切换：就地重绘纹理并标记重传，不重建 WebGL 资源、不丢浏览位置。
     注意 ogl 的 Texture 只有在 image 引用变化或 needsUpdate 为真时才重传
     （见 ogl/src/core/Texture.js 的 bind：image === store.image 且未标记就跳过），
     复用同一块 canvas 必须显式置 needsUpdate，否则画面不会更新。 */
  window.addEventListener('theme-change', () => {
    const next = resolveTheme(options.theme);
    if (next === currentTheme) return;
    currentTheme = next;
    const palette = buildPalette(root, next);
    for (const entry of media) {
      drawCardTexture(entry.item, palette, entry.canvas);
      entry.texture.needsUpdate = true;
    }
    /* 立刻同步渲染一帧。
       背景：主题切换用了 View Transitions（见 ThemeToggle.astro）——切换后的
       DOM 会被截成一张「新快照」再参与圆形揭示。纹理上传发生在每帧的
       renderer.render 里，如果等下一帧 rAF，新快照截到的还是旧配色，
       等揭示结束、真实页面回来时画廊会「啪」地跳一下。
       这里同步 render 一次，保证快照里就是新配色。 */
    try {
      renderer.render({ scene, camera });
    } catch {
      /* 上下文丢失等异常不该让主题切换本身失败 */
    }
  });

  // ---------- 交互状态 ----------
  const scroll = { current: 0, target: 0 };
  let dragging = false;
  let dragStartX = 0;
  let dragStartScroll = 0;
  let moved = 0;
  let canvasW = 800;
  let canvasH = 600;

  function resize() {
    // 量容器而不是 canvas：canvas 的 CSS 尺寸已被 setSize 写成固定像素，
    // 再读它只会得到上一次写入的值，不反映真实布局
    canvasW = root.clientWidth || 800;
    canvasH = root.clientHeight || 600;

    renderer.setSize(canvasW, canvasH);
    const aspect = canvasW / Math.max(1, canvasH);
    viewW = 2;
    viewH = viewW / aspect;

    camera.orthographic({
      left: -viewW / 2,
      right: viewW / 2,
      top: viewH / 2,
      bottom: -viewH / 2,
      near: 0.1,
      far: 100,
    });

    media.forEach((entry) => {
      entry.program.uniforms.uSize.value = [cardW(), cardH()];
      entry.program.uniforms.uRadius.value = cardW() * 0.055;
    });
  }

  // ---------- 每帧更新 ----------
  function update() {
    scroll.current += (scroll.target - scroll.current) * options.ease;

    const total = media.length * step();
    const halfView = viewW / 2;

    media.forEach((entry, index) => {
      // 基准位置 + 滚动偏移，然后循环到 [-total/2, total/2)
      let x = index * step() + scroll.current - total / 2;
      x = ((x % total) + total) % total;
      if (x > total / 2) x -= total;

      const nx = x / halfView; // 归一化距离，0 在正中
      const dist = Math.abs(nx);

      // 中间最大、两侧渐小
      const scale = Math.max(0.62, 1 - dist * 0.3);
      entry.mesh.scale.set(cardW() * scale, cardH() * scale, 1);
      entry.mesh.position.x = x;

      // 弯曲：抛物线位移 + 轻微倾斜（bend = 0 时为水平直线）
      entry.mesh.position.y = -options.bend * nx * nx * viewH * 0.18;
      entry.mesh.rotation.z = options.bend * nx * 0.16;

      // 越靠边越淡（衰减取缓一些，两侧卡片仍可辨认、可点击）
      entry.program.uniforms.uAlpha.value = Math.max(0, Math.min(1, 1.2 - dist * 0.8));

      // 记录屏幕位置，供点击判定
      const scaleX = canvasW / viewW;
      entry.screenX = canvasW / 2 + x * scaleX;
      entry.screenWidth = cardW() * scale * scaleX;
    });

    renderer.render({ scene, camera });
    requestAnimationFrame(update);
  }

  // ---------- 事件 ----------
  canvas.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      scroll.target += event.deltaY * options.speed * 0.0016;
    },
    { passive: false }
  );

  canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    moved = 0;
    dragStartX = event.clientX;
    dragStartScroll = scroll.target;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dx = event.clientX - dragStartX;
    moved = Math.max(moved, Math.abs(dx));
    // 加号：向右拖动时内容跟着向右走
    scroll.target = dragStartScroll + dx * (viewW / canvasW);
  });

  function endDrag(event: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    canvas.style.cursor = 'grab';
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);

    // 位移很小才算点击，避免拖拽结束误触跳转
    if (moved > 6) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;

    let hit: MediaEntry | null = null;
    let bestDist = Infinity;
    for (const entry of media) {
      if (entry.program.uniforms.uAlpha.value < 0.35) continue;
      const d = Math.abs(entry.screenX - clickX);
      if (d < entry.screenWidth / 2 && d < bestDist) {
        bestDist = d;
        hit = entry;
      }
    }

    if (hit) window.location.href = hit.item.href;
  }

  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', (event) => {
    dragging = false;
    canvas.style.cursor = 'grab';
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  });

  canvas.addEventListener('mouseenter', () => {
    if (!dragging) canvas.style.cursor = 'grab';
  });

  // 容器尺寸变化比 window.resize 更可靠（侧栏展开、字体载入等都会改变布局）
  const onResize = () => resize();
  window.addEventListener('resize', onResize);
  const resizeObserver =
    typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
  resizeObserver?.observe(root);

  // ---------- 启动 ----------
  resize();
  // 让第一张作品停在正中间（取模后 x = index*step + scroll - total/2）
  scroll.target = (media.length * step()) / 2;
  scroll.current = scroll.target;
  update();

  root.classList.add('is-ready');
}
