"""在 GPU 机器上直接测 klein 的纯模型耗时（不含网络）。

  python bench.py --model 9b             # bf16
  python bench.py --model 9b --fp8       # FP8 量化
  python bench.py --model 9b --fp8 --compile
  python bench.py --model 9b --img 拼接图.jpg --ref 角色.png   # 用真实图测
"""
import argparse
import os
import statistics
import time

import torch
from PIL import Image, ImageDraw

from fuser import Fuser

HERE = os.path.dirname(os.path.abspath(__file__))

# 和网页融合时的提示词长度差不多
PROMPT = ("Seamlessly blend the pasted characters into the scene of image 1: match lighting, shadows, "
          "perspective and film grain so they look painted in the same 1937 noir comic style. Keep the "
          "camera, framing, background and every character's position, size and pose exactly as in image 1. "
          "Keep each character's face, hair and outfit identical to their reference image; do not change "
          "clothing colours. Keep the warm amber colour grading of the background unchanged; do not cool or "
          "desaturate the image. No borders, no text, no extra people.")


def fake_scene(w, h):
    im = Image.new("RGB", (w, h), (70, 55, 45))
    d = ImageDraw.Draw(im)
    for i in range(0, h, 24):
        d.line([(0, i), (w, i + 40)], fill=(90 + i % 60, 70, 50), width=6)
    d.rectangle([w * 0.35, h * 0.3, w * 0.62, h * 0.95], fill=(150, 40, 45))
    d.ellipse([w * 0.42, h * 0.18, w * 0.55, h * 0.32], fill=(220, 180, 150))
    return im


def fake_ref(side):
    im = Image.new("RGB", (side, side), (235, 230, 220))
    d = ImageDraw.Draw(im)
    d.rectangle([side * 0.3, side * 0.3, side * 0.7, side], fill=(150, 40, 45))
    d.ellipse([side * 0.38, side * 0.08, side * 0.62, side * 0.32], fill=(220, 180, 150))
    return im


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="9b")
    ap.add_argument("--fp8", action="store_true")
    ap.add_argument("--compile", action="store_true")
    ap.add_argument("--full-text", action="store_true")
    ap.add_argument("--n", type=int, default=8, help="每种情况跑几次")
    ap.add_argument("--w", type=int, default=576)
    ap.add_argument("--h", type=int, default=720)
    ap.add_argument("--steps", type=int, default=4)
    ap.add_argument("--img", help="真实拼接图")
    ap.add_argument("--ref", action="append", default=[], help="真实角色参考图，可多次")
    ap.add_argument("--strength", default="", help="低强度重绘对比，如 0.7,0.5,0.4（拼接图 + 全部参考图）")
    a = ap.parse_args()

    print(f"显卡：{torch.cuda.get_device_name(0)}")
    F = Fuser(os.path.join(HERE, "models", a.model), fp8=a.fp8, compile=a.compile, trim_text=not a.full_text)
    print(f"模型 {a.model}（{F.kind}，fp8={F.fp8}，compile={a.compile}）加载 {F.load_s}s，"
          f"显存 {torch.cuda.memory_allocated() / 2**30:.1f} GB")

    scene = Image.open(a.img).convert("RGB") if a.img else fake_scene(512, 640)
    refs = [Image.open(p).convert("RGB") for p in a.ref] or [fake_ref(256), fake_ref(256)]
    t = time.time()
    F.warmup(a.w, a.h, refs=len(refs), n=3 if a.compile else 2)
    print(f"预热 {time.time() - t:.1f}s，cuDNN {'开' if torch.backends.cudnn.enabled else '关'}\n")

    os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
    rows = []
    for k in range(len(refs) + 1):
        imgs = [scene] + refs[:k]
        ts, tx = [], []
        for i in range(a.n):
            out, tm = F.run(PROMPT, imgs, a.w, a.h, seed=i, steps=a.steps)
            ts.append(tm["model"])
            if not tm["text_cached"]:
                tx.append(tm["text"])
        out.save(os.path.join(HERE, "out", f"{a.model}_refs{k}.jpg"), quality=90)
        ts.sort()
        rows.append((k, statistics.median(ts), ts[int(len(ts) * 0.9) - 1 if len(ts) > 1 else 0], tx))
        print(f"拼接图 + {k} 张参考图：中位 {rows[-1][1]:.2f}s  慢的时候 {rows[-1][2]:.2f}s"
              + (f"  （首次文字编码 {tx[0]:.2f}s，之后走缓存）" if tx else ""), flush=True)

    if a.strength:
        imgs = [scene] + refs
        print("\n低强度重绘（拼接图 + %d 张参考图）：" % len(refs))
        for st in [None] + [float(x) for x in a.strength.split(",")]:
            ts = []
            for i in range(a.n):
                out, tm = F.run(PROMPT, imgs, a.w, a.h, seed=i, steps=a.steps, strength=st)
                ts.append(tm["model"])
            ts.sort()
            name = "full" if st is None else f"s{st}"
            out.save(os.path.join(HERE, "out", f"{a.model}_{name}.jpg"), quality=90)
            print(f"  {'整张重绘' if st is None else '力度 %s' % st}：{tm['steps']} 步，中位 {statistics.median(ts):.2f}s"
                  f"{'' if st is None else '（实际起始噪声 %s）' % tm['strength']}", flush=True)

    print(f"\n汇总 {a.model} fp8={F.fp8} compile={a.compile} cudnn={torch.backends.cudnn.enabled} {a.w}x{a.h} {a.steps}步")
    for k, med, p90, _ in rows:
        print(f"  参考图 {k} 张：{med:.2f}s（p90 {p90:.2f}s）")
    print(f"峰值显存 {torch.cuda.max_memory_allocated() / 2**30:.1f} GB；输出样图在 out/ 目录")


if __name__ == "__main__":
    main()
