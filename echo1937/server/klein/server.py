"""klein 融合服务（阿里云 GPU 机器上跑）。

接口和 fal 的返回格式一致，网页那边改动最小：
  GET  /health             模型、显卡、是否就绪（不需要口令）
  POST /ref   {data}       上传一张角色参考图（dataURL），返回 {id}；同一张图只传一次
  POST /edit  {prompt, image_urls, image_size:{width,height}, seed, output_format, num_inference_steps}
       image_urls 里每一项可以是 dataURL、"ref:<id>"、或 http(s) 链接（按链接缓存）
       返回 {images:[{url: dataURL}], timings:{inference, model, decode, encode, server}}
       用到的参考图服务端没有（比如重启过）→ 409 {missing:[id...]}，网页重传后再试

口令：每个请求带 X-Token 头。口令存在 token.txt，第一次启动时随机生成并打印在终端里。
"""
import argparse
import base64
import collections
import hashlib
import io
import os
import secrets
import threading
import time
import traceback
import urllib.request

# 每格的图尺寸不一样，显存容易碎；放在 import torch 之前才生效
os.environ.setdefault("PYTORCH_CUDA_ALLOC_CONF", "expandable_segments:True")

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

from fuser import Fuser, Superseded, to_bytes

HERE = os.path.dirname(os.path.abspath(__file__))
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
F = None
TOKEN = None
INFO = {}
ARGS = None


class NewestFirst:
    """显卡锁：同一时间只跑一件事（融合、切换精度）。空出来时交给最后到的请求——
    网页上正在看的总是最新那一格，旧格子排到后面补。等它的时间记成"排队"。"""

    def __init__(self):
        self.cv = threading.Condition()
        self.busy = False
        self.waiting = []
        self.n = 0

    def __call__(self, cancel=None):
        return _Hold(self, cancel)

    def __enter__(self):
        self.acquire()

    def __exit__(self, *exc):
        self.release()

    def acquire(self, cancel=None):
        with self.cv:
            self.n += 1
            me = self.n
            self.waiting.append(me)
            while self.busy or self.waiting[-1] != me:
                # 排队时被更新的一格顶掉：不用再等，直接放弃
                if cancel and cancel():
                    self.waiting.remove(me)
                    self.cv.notify_all()
                    raise Superseded()
                self.cv.wait()
            self.waiting.remove(me)
            self.busy = True

    def release(self):
        with self.cv:
            self.busy = False
            self.cv.notify_all()

    def poke(self):
        """有新请求进来：叫醒排队的，让被顶掉的自己退出。"""
        with self.cv:
            self.cv.notify_all()


class _Hold:
    def __init__(self, lock, cancel):
        self.lock, self.cancel = lock, cancel

    def __enter__(self):
        self.lock.acquire(self.cancel)

    def __exit__(self, *exc):
        self.lock.release()


GPU = NewestFirst()
# 带 supersede 的请求：新的一到，还没开始的旧请求直接放弃，正在算的在下一步结束处停下
LATEST = {"n": 0}
LATEST_LOCK = threading.Lock()
REFS = collections.OrderedDict()  # id -> PIL，最多留 200 张


def load_token():
    p = os.path.join(HERE, "token.txt")
    if not os.path.exists(p):
        with open(p, "w") as f:
            f.write(secrets.token_urlsafe(18))
        os.chmod(p, 0o600)
    return open(p).read().strip()


def check(req: Request):
    if req.headers.get("x-token") != TOKEN:
        raise HTTPException(401, "口令不对")


def decode_data_url(s):
    b64 = s.split(",", 1)[1] if s.startswith("data:") else s
    return Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGB")


def keep_ref(rid, img):
    REFS[rid] = img
    REFS.move_to_end(rid)
    while len(REFS) > 200:
        REFS.popitem(last=False)


@app.get("/health")
def health():
    return {"ok": F is not None, **INFO, "refs": len(REFS), "switching": INFO.get("switching", False)}


def load(fp8):
    """（重新）加载模型。显存放不下两份，切换精度时先整份释放再加载，约 15–20 秒（权重已在内存缓存里）。"""
    global F
    import gc
    import torch
    INFO["switching"] = True
    try:
        if F is not None:
            F = None
            gc.collect()
            torch.cuda.empty_cache()
        path = os.path.join(HERE, "models", ARGS.model)
        print(f"加载 {path}（{'FP8' if fp8 else '原精度'}）…", flush=True)
        f = Fuser(path, fp8=fp8, compile=ARGS.compile, trim_text=not ARGS.full_text)
        f.want_fp8 = fp8
        t = time.time()
        f.warmup()
        F = f
        INFO.update(model=ARGS.model, kind=F.kind, fp8=F.fp8, compile=ARGS.compile,
                    gpu=torch.cuda.get_device_name(0), load_s=F.load_s, warmup_s=round(time.time() - t, 1))
        print(f"就绪：{INFO}", flush=True)
    finally:
        INFO["switching"] = False


def ensure(fp8):
    """调用方已持有 GPU 锁。fp8 为 None 表示不在乎精度。返回切换花的秒数。"""
    if fp8 is None or (F is not None and getattr(F, "want_fp8", F.fp8) == fp8):
        return 0.0
    t = time.time()
    load(fp8)
    return round(time.time() - t, 1)


@app.post("/switch")
async def switch(req: Request):
    """网页下拉框换精度时先调一下，让切换在用户点下一格之前做完。"""
    check(req)
    fp8 = bool((await req.json()).get("fp8"))
    import anyio

    def go():
        with GPU:
            return ensure(fp8)
    sec = await anyio.to_thread.run_sync(go)
    return {"ok": True, "fp8": F.fp8, "switch_s": sec, **INFO}


@app.post("/ref")
async def ref(req: Request):
    check(req)
    body = await req.json()
    raw = body.get("data")
    if not raw:
        raise HTTPException(400, "缺少 data")
    rid = hashlib.sha1(raw.encode()).hexdigest()[:16]
    if rid not in REFS:
        keep_ref(rid, decode_data_url(raw))
    return {"id": rid}


@app.post("/edit")
async def edit(req: Request):
    check(req)
    try:
        return await _edit(req)
    except Exception as e:
        # 没接住的异常会变成不带跨域头的 500，浏览器只看到"连不上"；这里接住，把原因带回网页
        traceback.print_exc()
        return JSONResponse({"error": f"{type(e).__name__}: {str(e)[:300]}"}, status_code=500)


async def _edit(req: Request):
    t0 = time.perf_counter()
    body = await req.json()
    imgs, missing = [], []
    for u in body.get("image_urls") or []:
        if u.startswith("ref:"):
            rid = u[4:]
            if rid in REFS:
                REFS.move_to_end(rid)
                imgs.append(REFS[rid])
            else:
                missing.append(rid)
        elif u.startswith("http"):
            rid = "url:" + hashlib.sha1(u.encode()).hexdigest()[:16]
            if rid not in REFS:
                with urllib.request.urlopen(u, timeout=20) as r:
                    keep_ref(rid, Image.open(io.BytesIO(r.read())).convert("RGB"))
            imgs.append(REFS[rid])
        else:
            imgs.append(decode_data_url(u))
    if missing:
        return JSONResponse({"missing": missing}, status_code=409)
    size = body.get("image_size") or {}
    w, h = int(size.get("width") or imgs[0].width), int(size.get("height") or imgs[0].height)
    w, h = w // 16 * 16, h // 16 * 16
    fmt = "webp" if body.get("output_format") == "webp" else "jpeg"
    t1 = time.perf_counter()
    # 推理是同步的，放到线程里跑，不堵住 /health。请求里带 fp8 时按它的要求切换精度
    import anyio
    want = body.get("fp8")
    want = None if want is None else bool(want)

    cancel = None
    if body.get("supersede"):
        with LATEST_LOCK:
            LATEST["n"] += 1
            me = LATEST["n"]
        cancel = lambda: LATEST["n"] != me
        GPU.poke()

    def go():
        q0 = time.perf_counter()
        with GPU(cancel):
            queue = round(time.perf_counter() - q0, 3)
            sw = ensure(want)
            st = body.get("strength")
            out, tm = F.run(body.get("prompt") or "", imgs, w, h, body.get("seed"),
                            int(body.get("num_inference_steps") or 4), cancel=cancel,
                            strength=None if st is None else float(st))
        tm.update(queue=queue, switch=sw)
        return out, tm
    try:
        out, tm = await anyio.to_thread.run_sync(go)
    except Superseded:
        print(f"[edit] 被新的一格顶掉（{round(time.perf_counter() - t0, 2)}s）", flush=True)
        return JSONResponse({"superseded": True}, status_code=409)
    t2 = time.perf_counter()
    data = to_bytes(out, fmt)
    t3 = time.perf_counter()
    tm.update(decode=round(t1 - t0, 3), encode=round(t3 - t2, 3), server=round(t3 - t0, 3))
    url = f"data:image/{fmt};base64," + base64.b64encode(data).decode()
    print(f"[edit] {w}x{h} 图{len(imgs)} 文字{tm['text_tokens']}{'(缓存)' if tm['text_cached'] else ''} "
          f"{tm['steps']}步{' 力度%s' % tm['strength'] if tm.get('strength') else ''} 模型 {tm['model']}s 排队 {tm['queue']}s{' 切换 %ss' % tm['switch'] if tm['switch'] else ''} 服务端合计 {tm['server']}s", flush=True)
    name = f"{INFO.get('model')}{' FP8' if INFO.get('fp8') else ' 原精度'}"
    return {"images": [{"url": url, "width": w, "height": h}], "timings": tm, "model": name, "fp8": INFO.get("fp8")}


def main():
    global TOKEN, ARGS
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="9b", help="models/ 下的目录名，如 9b、4b、9b-kv")
    ap.add_argument("--fp8", action="store_true")
    ap.add_argument("--compile", action="store_true")
    ap.add_argument("--full-text", action="store_true", help="文字按 512 词元补齐（默认按实际长度裁短）")
    ap.add_argument("--port", type=int, default=8000)
    ARGS = ap.parse_args()
    TOKEN = load_token()
    load(ARGS.fp8)
    print(f"口令（填到网页设置里，不要发给别人）：{TOKEN}", flush=True)
    uvicorn.run(app, host="0.0.0.0", port=ARGS.port, log_level="warning")


if __name__ == "__main__":
    main()
