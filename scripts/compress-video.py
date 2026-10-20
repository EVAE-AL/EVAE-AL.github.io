#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""压缩全站背景视频 public/bg-video.mp4。

为什么用 PyAV 而不是 ffmpeg 命令行
----------------------------------
本机没有装 ffmpeg，但系统 Python 里已经有 PyAV（内置 libav + libx264）。
转一个 5 秒的 1080p 视频只需要约 2 秒，完全没必要为了这一步去改系统环境。

参数是怎么定下来的（实测数据，见 .probe-frames/tier-scan.py）
--------------------------------------------------------------
原片：1920x1080 / 24fps / 5.042s / 121 帧 / 7.05 MB，`moov` 在文件末尾。

关键结论：**降分辨率比提高压缩率损失大得多**。
  - 720p-crf30   398 KB  PSNR 28.06 dB   ← 曾经的错误推荐
  - 1080p-crf32  798 KB  PSNR 32.86 dB
  - 1080p-crf36  486 KB  PSNR 30.36 dB   ← 当前选择
  - 1080p-crf40  309 KB  PSNR 28.01 dB
体积只差 2 倍，画质差 4.8 dB。所以**保持 1080p，只动 CRF**。

选 crf36 的理由：486 KB（小 14.9 倍）比一张图还小，而误差放大 8 倍后
仍然只是均匀的细颗粒噪声，没有块效应、没有色带；crf40 的误差 >8 像素占比
升到 19.3%，没必要冒这个险。

饱和度实测反而略升（+2.10%），亮度和动态范围几乎不变（-0.09% / -0.82%），
所以「背景要鲜亮」这个既有要求没有被压缩破坏。

顺带修掉一个真问题：原片 `moov` 在 mdat 之后（非 fast-start），
播放器必须先拿到文件尾部才能起播。这里加 `+faststart` 把它挪到文件头。

用法
----
    python scripts/compress-video.py                # 用默认 crf=36
    python scripts/compress-video.py --crf 32       # 画质优先
    python scripts/compress-video.py --dry-run      # 只报告，不覆盖

覆盖前会自动把原片备份到 .probe-frames/video-original-backup.mp4（若不存在）。
"""
from __future__ import annotations

import argparse
import shutil
import sys
import time
from pathlib import Path

try:
    import av
except ImportError:
    print("[fatal] 需要 PyAV：pip install av", file=sys.stderr)
    print("        本机系统 Python 已自带（Python313），用它的 python.exe 跑即可。", file=sys.stderr)
    raise SystemExit(1)

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "bg-video.mp4"
BACKUP = ROOT / ".probe-frames" / "video-original-backup.mp4"
TMP_OUT = ROOT / ".probe-frames" / "video-compressed.tmp.mp4"


def probe(path: Path) -> dict:
    """读视频元信息。"""
    c = av.open(str(path))
    s = c.streams.video[0]
    info = {
        "width": s.codec_context.width,
        "height": s.codec_context.height,
        "fps": float(s.average_rate) if s.average_rate else None,
        "frames": s.frames,
        "duration": float(c.duration) / 1e6 if c.duration else None,
        "codec": s.codec_context.name,
        "audio_streams": len(c.streams.audio),
        "bytes": path.stat().st_size,
    }
    c.close()
    return info


def is_faststart(path: Path) -> bool:
    """moov 是否在 mdat 之前。"""
    data = path.read_bytes()
    moov, mdat = data.find(b"moov"), data.find(b"mdat")
    return moov != -1 and (mdat == -1 or moov < mdat)


def compress(src: Path, dst: Path, crf: int, preset: str) -> float:
    """转码。返回耗时（秒）。"""
    t0 = time.time()
    inc = av.open(str(src))
    ivs = inc.streams.video[0]

    # 注意：movflags 必须作为【muxer】选项传，放进 encoder options 是无效的
    outs = av.open(str(dst), "w", options={"movflags": "+faststart"})
    ovs = outs.add_stream("libx264", rate=ivs.average_rate)
    ovs.width = ivs.codec_context.width
    ovs.height = ivs.codec_context.height
    ovs.pix_fmt = "yuv420p"
    ovs.options = {"crf": str(crf), "preset": preset}

    n = 0
    for frame in inc.decode(ivs):
        # 显式 reformat：源是 yuv420p，这里主要是保证宽高与像素格式一致
        frame = frame.reformat(
            width=ovs.width, height=ovs.height, format="yuv420p"
        )
        for pkt in ovs.encode(frame):
            outs.mux(pkt)
        n += 1

    for pkt in ovs.encode():
        outs.mux(pkt)

    outs.close()
    inc.close()
    print(f"  编码 {n} 帧完成")
    return time.time() - t0


def main() -> int:
    ap = argparse.ArgumentParser(description="压缩背景视频（保持 1080p，只调 CRF）")
    ap.add_argument("--crf", type=int, default=36, help="CRF，越大越小越糊（默认 36）")
    ap.add_argument("--preset", default="medium", help="x264 preset（默认 medium）")
    ap.add_argument("--dry-run", action="store_true", help="只报告，不覆盖原文件")
    args = ap.parse_args()

    if not SRC.exists():
        print(f"[fatal] 找不到源视频：{SRC}", file=sys.stderr)
        return 1

    before = probe(SRC)
    print("=== 源视频 ===")
    print(f"  {before['width']}x{before['height']}  {before['fps']}fps  "
          f"{before['duration']:.3f}s  {before['frames']} 帧  "
          f"{before['bytes']/1024/1024:.2f} MB")
    print(f"  codec={before['codec']}  音轨={before['audio_streams']}  "
          f"faststart={is_faststart(SRC)}")

    if args.dry_run:
        print("\n[dry-run] 不做任何修改")
        return 0

    # 备份原片（只备份一次，避免重复运行时用压缩版覆盖掉真正的原片）
    if not BACKUP.exists():
        BACKUP.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(SRC, BACKUP)
        print(f"\n原片已备份 -> {BACKUP.relative_to(ROOT)}")
    else:
        print(f"\n原片备份已存在，跳过 -> {BACKUP.relative_to(ROOT)}")

    print(f"\n=== 开始压缩（CRF {args.crf}, preset {args.preset}）===")
    elapsed = compress(SRC, TMP_OUT, args.crf, args.preset)

    after = probe(TMP_OUT)
    ratio = before["bytes"] / after["bytes"]

    print(f"\n=== 结果 ===")
    print(f"  分辨率  {after['width']}x{after['height']}（与源一致："
          f"{'是' if (after['width'], after['height']) == (before['width'], before['height']) else '否'}）")
    print(f"  时长    {after['duration']:.3f}s（源 {before['duration']:.3f}s）")
    print(f"  帧数    {after['frames']}（源 {before['frames']}）")
    print(f"  体积    {before['bytes']/1024/1024:.2f} MB -> {after['bytes']/1024:.0f} KB"
          f"（小 {ratio:.1f} 倍）")
    print(f"  faststart  {is_faststart(TMP_OUT)}")
    print(f"  耗时    {elapsed:.1f}s")

    # 硬性检查：尺寸、时长、帧数、可解码性
    problems = []
    if (after["width"], after["height"]) != (before["width"], before["height"]):
        problems.append("分辨率变了")
    if after["frames"] != before["frames"]:
        problems.append(f"帧数不一致（{after['frames']} vs {before['frames']}）")
    if after["duration"] and before["duration"] and abs(after["duration"] - before["duration"]) > 0.1:
        problems.append("时长偏差超过 0.1s")
    if not is_faststart(TMP_OUT):
        problems.append("faststart 未生效")

    if problems:
        print("\n[FAIL] 校验不通过，未覆盖原文件：")
        for p in problems:
            print("   -", p)
        TMP_OUT.unlink(missing_ok=True)
        return 1

    # 覆盖
    shutil.move(str(TMP_OUT), str(SRC))
    print(f"\n[OK] 已覆盖 {SRC.relative_to(ROOT)}")
    print("\n下一步：重抽 poster（尺寸/构图要对齐新视频）")
    print("   node .probe-frames/extract-poster.mjs http://127.0.0.1:4321")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
