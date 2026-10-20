/**
 * 全站加载动画：彗星轨迹 + 树木生长环。
 *
 * 视觉规格来自 CometDial（React + Canvas 2D 的拨盘组件）。这里只保留绘制部分：
 * 原组件本质是一个可拖拽的 slider（pointer/keyboard 交互、value/onChange、step 吸附），
 * 这些作为加载动画没有意义，所以全部去掉，改为由真实加载进度驱动 0 → 1。
 *
 * 没有引入 React：绘制逻辑本身就是 Canvas 2D，与框架无关，原生 JS 重写即可，
 * 避免为一个加载动画引入约 140 KB 的 React 运行时（与环形画廊同样的取舍）。
 *
 * 配色没有照搬规格里的青绿（#40ab8a / #49a86d）——那与本站水墨体系冲突。
 * 这里改用主题变量：墨色画弧与枝干、朱红作彗星与花点，像一幅红梅小品，
 * 并且自动跟随亮/暗色主题。
 */

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;
const degToRad = (degrees: number) => (degrees * Math.PI) / 180;

/** 给颜色加透明度。只处理 hex，其它格式原样返回（避免拼出非法颜色）。 */
const withAlpha = (color: string, alpha: number) => {
  const hex = color.trim();
  const a = Math.round(clamp(alpha, 0, 1) * 255)
    .toString(16)
    .padStart(2, '0');
  if (/^#[0-9a-f]{6}$/i.test(hex)) return `${hex}${a}`;
  if (/^#[0-9a-f]{3}$/i.test(hex)) {
    const [r, g, b] = hex.slice(1).split('');
    return `#${r}${r}${g}${g}${b}${b}${a}`;
  }
  return hex;
};

export interface LoadingScreenOptions {
  /** 最短显示时长（ms），避免一闪而过 */
  minDuration?: number;
  /** 硬上限（ms）：无论加载是否完成都会收尾 */
  maxDuration?: number;
  /** 淡出时长（ms），需与 CSS 里的 transition 一致 */
  fadeDuration?: number;
  /** 画布逻辑尺寸（CSS 像素），内部按 dpr 放大 */
  size?: number;
  /** 圆弧张角（度） */
  sweep?: number;
  /** 弧线粗细 */
  thickness?: number;
  /** 树的数量 */
  treeCount?: number;
}

export function initLoadingScreen(root: HTMLElement, options: LoadingScreenOptions = {}): void {
  const {
    minDuration = 650,
    maxDuration = 2600,
    fadeDuration = 520,
    size = 210,
    sweep = 300,
    thickness = 4,
    treeCount = 18,
  } = options;

  const canvas = root.querySelector<HTMLCanvasElement>('[data-loading-canvas]');
  const percentEl = root.querySelector<HTMLElement>('[data-loading-percent]');
  const ctx = canvas ? canvas.getContext('2d') : null;

  let raf = 0;
  let finished = false;

  /**
   * 收尾：先加 is-leaving 触发淡出，等过渡结束再解锁滚动并移除节点。
   * 顺序不能反——js-loading 一移除，CSS 的 display:none 会立刻生效，淡出就看不见了。
   */
  const finish = () => {
    if (finished) return;
    finished = true;
    if (raf) cancelAnimationFrame(raf);
    root.classList.add('is-leaving');
    window.setTimeout(() => {
      document.documentElement.classList.remove('js-loading');
      root.remove();
    }, fadeDuration + 60);
  };

  if (!canvas || !ctx) {
    finish();
    return;
  }

  // ---------- 画布尺寸 ----------
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // ---------- 几何 ----------
  // 从外向内推算，保证树冠画满时正好贴住画布边缘、不会被裁掉
  // （原规格按 size 的比例直接相加，满生长时树冠会超出画布被切掉）
  const center = size / 2;
  const crownMax = size * 0.07; // 树冠最大外扩
  const treeReach = size * 0.11; // 树向外生长的最大高度
  const gap = size * 0.05; // 树环与拨盘之间的间隔
  const treeRadius = center - crownMax - treeReach;
  const dialRadius = treeRadius - gap - thickness;
  const startAngle = degToRad(270 - sweep / 2);
  const sweepRad = degToRad(sweep);

  // ---------- 配色（跟随主题）----------
  const css = getComputedStyle(document.documentElement);
  const readVar = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  const inkColor = readVar('--text', '#1c1917');
  const softColor = readVar('--text-soft', '#4a443d');
  const muteColor = readVar('--text-mute', '#736a62');
  const accent = readVar('--seal', '#a8322a');

  const drawArc = (
    radius: number,
    start: number,
    end: number,
    color: string | CanvasGradient,
    width: number,
    alpha = 1
  ) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(center, center, radius, start, end);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.restore();
  };

  const drawTree = (angle: number, growth: number, index: number, time: number) => {
    const baseX = center + Math.cos(angle) * treeRadius;
    const baseY = center + Math.sin(angle) * treeRadius;
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    const tanX = -Math.sin(angle);
    const tanY = Math.cos(angle);
    const sway = Math.sin(time * 0.0012 + index * 1.7) * 1.3;
    const trunkLength = treeReach * growth * (0.28 + growth * 0.72);
    const trunkWidth = Math.max(1.1, size * 0.009) * (0.8 + growth * 0.35);
    const topX = baseX + dirX * trunkLength + tanX * sway;
    const topY = baseY + dirY * trunkLength + tanY * sway;

    ctx.save();
    ctx.globalAlpha = growth <= 0.01 ? 0 : 0.18 + growth * 0.82;

    // 主干
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.lineTo(topX, topY);
    ctx.strokeStyle = muteColor;
    ctx.lineWidth = trunkWidth;
    ctx.stroke();

    // 分枝
    if (growth > 0.08) {
      const branchCount = 2 + Math.floor(growth * 3);
      for (let branch = 0; branch < branchCount; branch += 1) {
        const progress = 0.45 + branch * 0.16;
        const bx = lerp(baseX, topX, progress);
        const by = lerp(baseY, topY, progress);
        const side = branch % 2 === 0 ? 1 : -1;
        const branchLength = trunkLength * (0.2 + growth * 0.18) * (1 - branch * 0.08);
        const branchAngle = angle + side * degToRad(34 + branch * 4);
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + Math.cos(branchAngle) * branchLength, by + Math.sin(branchAngle) * branchLength);
        ctx.strokeStyle = softColor;
        ctx.lineWidth = Math.max(0.7, trunkWidth * 0.58);
        ctx.stroke();
      }
    }

    // 花点：朱红为主、少量墨点，读起来像红梅
    const crownSize = Math.max(1.8, size * 0.011) * (1 + growth * 3.2);
    const crownCount = 3 + Math.floor(growth * 5);
    for (let leaf = 0; leaf < crownCount; leaf += 1) {
      const offset = leaf * 2.399 + index;
      const radius = crownSize * (0.3 + ((leaf * 13) % 10) / 16);
      ctx.beginPath();
      ctx.arc(
        topX + Math.cos(offset) * radius,
        topY + Math.sin(offset) * radius,
        crownSize * (0.42 + ((leaf + index) % 3) * 0.08),
        0,
        Math.PI * 2
      );
      ctx.fillStyle = leaf % 3 === 0 ? softColor : accent;
      ctx.fill();
    }
    ctx.restore();
  };

  const canConic = typeof ctx.createConicGradient === 'function';

  const drawFrame = (time: number, progress: number) => {
    ctx.clearRect(0, 0, size, size);

    // 底轨 + 进度弧
    drawArc(dialRadius, startAngle, startAngle + sweepRad, inkColor, thickness, 0.14);
    drawArc(dialRadius, startAngle, startAngle + sweepRad * progress, accent, thickness, 1);

    // 树环：树沿圆环由起点到终点逐棵生长
    const treeStart = startAngle + degToRad(8);
    const treeSweep = Math.max(0.1, sweepRad - degToRad(16));
    drawArc(
      treeRadius,
      treeStart,
      treeStart + treeSweep * progress,
      softColor,
      1.1,
      0.2 + progress * 0.4
    );

    const count = Math.max(1, Math.round(treeCount));
    for (let index = 0; index < count; index += 1) {
      const treeProgress = count === 1 ? 0.5 : index / (count - 1);
      const growth = clamp((progress - treeProgress * 0.74) / 0.26, 0, 1);
      drawTree(treeStart + treeSweep * treeProgress, growth, index, time);
    }

    // 彗星：拖尾用锥形渐变，头部带辉光
    const cometAngle = startAngle + sweepRad * progress;
    const tailStart = cometAngle - degToRad(90);
    let tail: string | CanvasGradient = accent;
    if (canConic) {
      const gradient = ctx.createConicGradient(tailStart, center, center);
      gradient.addColorStop(0, withAlpha(accent, 0));
      gradient.addColorStop(0.7, withAlpha(accent, 0.33));
      gradient.addColorStop(1, withAlpha(accent, 0.87));
      tail = gradient;
    }
    drawArc(dialRadius, tailStart, cometAngle, tail, thickness * 2.6, 0.9);

    ctx.save();
    ctx.shadowColor = accent;
    ctx.shadowBlur = 12;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(
      center + Math.cos(cometAngle) * dialRadius,
      center + Math.sin(cometAngle) * dialRadius,
      Math.max(2.5, thickness * 1.4),
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  };

  // ---------- 进度驱动 ----------
  let loadDone = document.readyState === 'complete';
  if (!loadDone) {
    window.addEventListener('load', () => {
      loadDone = true;
    }, { once: true });
  }

  const startTime = performance.now();
  let shown = 0;

  const tick = (time: number) => {
    if (finished) return;
    const elapsed = time - startTime;

    // 硬上限：即使 load 事件永不到来（媒体/字体卡住），也必须收尾
    if (elapsed >= maxDuration) loadDone = true;

    let target: number;
    if (loadDone && elapsed >= minDuration) {
      target = 1;
    } else {
      // 加载中：向 0.92 渐进逼近，保证进度一直在动
      const t = Math.min(1, elapsed / 1500);
      target = 0.92 * (1 - Math.pow(1 - t, 3));
    }

    shown = lerp(shown, target, 0.12);
    if (target >= 1 && shown > 0.994) shown = 1;

    drawFrame(time, shown);
    if (percentEl) percentEl.textContent = String(Math.round(shown * 100));

    if (shown >= 1 && loadDone) {
      finish();
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);

  // 兜底：标签页在后台时 rAF 不执行，这里保证页面最终一定会被放出来
  window.setTimeout(() => {
    if (!finished) finish();
  }, maxDuration + 1200);
}
