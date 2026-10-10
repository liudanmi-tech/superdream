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
import time
import urllib.request

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

from fuser import Fuser, to_bytes

HERE = os.path.dirname(os.path.abspath(__file__))
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
F = None
TOKEN = None
INFO = {}
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
    return {"ok": F is not None, **INFO, "refs": len(REFS)}


@app.post("/ref")
async def ref(req: Request):
    check(req)
    body = await req.json()
    raw = body["data"]
    rid = hashlib.sha1(raw.encode()).hexdigest()[:16]
    if rid not in REFS:
        keep_ref(rid, decode_data_url(raw))
    return {"id": rid}


@app.post("/edit")
async def edit(req: Request):
    check(req)
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
    # 推理是同步的，放到线程里跑，不堵住 /health
    import anyio
    out, tm = await anyio.to_thread.run_sync(
        lambda: F.run(body.get("prompt") or "", imgs, w, h, body.get("seed"),
                      int(body.get("num_inference_steps") or 4)))
    t2 = time.perf_counter()
    data = to_bytes(out, fmt)
    t3 = time.perf_counter()
    tm.update(decode=round(t1 - t0, 3), encode=round(t3 - t2, 3), server=round(t3 - t0, 3))
    url = f"data:image/{fmt};base64," + base64.b64encode(data).decode()
    print(f"[edit] {w}x{h} 图{len(imgs)} 文字{tm['text_tokens']}{'(缓存)' if tm['text_cached'] else ''} "
          f"模型 {tm['model']}s 服务端合计 {tm['server']}s", flush=True)
    return {"images": [{"url": url, "width": w, "height": h}], "timings": tm, "model": INFO.get("model")}


def main():
    global F, TOKEN
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="9b", help="models/ 下的目录名，如 9b、4b、9b-kv")
    ap.add_argument("--fp8", action="store_true")
    ap.add_argument("--compile", action="store_true")
    ap.add_argument("--full-text", action="store_true", help="文字按 512 词元补齐（默认按实际长度裁短）")
    ap.add_argument("--port", type=int, default=8000)
    a = ap.parse_args()
    TOKEN = load_token()
    import torch
    path = os.path.join(HERE, "models", a.model)
    print(f"加载 {path} …", flush=True)
    F = Fuser(path, fp8=a.fp8, compile=a.compile, trim_text=not a.full_text)
    print(f"加载用了 {F.load_s}s，预热中（--compile 时要几分钟）…", flush=True)
    t = time.time()
    F.warmup()
    INFO.update(model=a.model, kind=F.kind, fp8=F.fp8, compile=a.compile,
                gpu=torch.cuda.get_device_name(0), warmup_s=round(time.time() - t, 1))
    print(f"就绪：{INFO}", flush=True)
    print(f"口令（填到网页设置里，不要发给别人）：{TOKEN}", flush=True)
    uvicorn.run(app, host="0.0.0.0", port=a.port, log_level="warning")


if __name__ == "__main__":
    main()
