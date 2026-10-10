"""klein 融合核心：模型常驻显存，一次调用 = 拼接图（+ 角色参考图）→ 融合图。

server.py 和 bench.py 共用这里。只依赖 torch / diffusers / pillow。
"""
import collections
import io
import math
import os
import threading
import time

import torch
from PIL import Image

DTYPE = torch.bfloat16


class Superseded(Exception):
    """这一格被更新的一格顶掉了：不再算，网页保留拼接图。"""


def _sync():
    if torch.cuda.is_available():
        torch.cuda.synchronize()


class Fuser:
    def __init__(self, path, fp8=False, compile=False, trim_text=True):
        import diffusers

        t0 = time.time()
        # KV 版的权重目录里写的还是普通管线，要按目录名显式用 KV 管线加载，否则和普通版一样慢
        cls = diffusers.Flux2KleinKVPipeline if "kv" in os.path.basename(path.rstrip("/")).lower() else diffusers.DiffusionPipeline
        self.pipe = cls.from_pretrained(path, torch_dtype=DTYPE).to("cuda")
        self.pipe.set_progress_bar_config(disable=True)
        self.kind = type(self.pipe).__name__
        # KV 版：参考图只在第 1 步算一次，后面几步复用，参考图越多越省
        self.kv = "KV" in self.kind
        self.trim_text = trim_text
        self.lock = threading.Lock()
        self.emb = collections.OrderedDict()
        self.fp8 = False
        if fp8:
            self.fp8 = self._to_fp8()
        if compile:
            # 固定尺寸下编译能再快一截；第一次调用要编译几分钟
            self.pipe.transformer = torch.compile(self.pipe.transformer, dynamic=False)
        self.load_s = round(time.time() - t0, 1)

    def _to_fp8(self):
        try:
            from torchao.quantization import Float8DynamicActivationFloat8WeightConfig, quantize_
        except Exception as e:
            print(f"[fp8] 没装好 torchao，继续用 bf16：{e}")
            return False
        quantize_(self.pipe.transformer, Float8DynamicActivationFloat8WeightConfig())
        return True

    # ---------- 文字编码：同一段提示词只算一次 ----------
    def _text_len(self, prompt):
        tok = self.pipe.tokenizer
        text = tok.apply_chat_template([{"role": "user", "content": prompt}], tokenize=False,
                                       add_generation_prompt=True, enable_thinking=False)
        n = len(tok(text).input_ids)
        # 默认会补齐到 512 个词元，每一步都要白算；按实际长度向上取整到 64
        return min(512, max(64, math.ceil(n / 64) * 64))

    def embed(self, prompt):
        L = self._text_len(prompt) if self.trim_text else 512
        key = (prompt, L)
        hit = self.emb.get(key)
        if hit is not None:
            self.emb.move_to_end(key)
            return hit, L, True
        # encode_prompt 不在 no_grad 里：不关梯度的话，缓存的结果会拖着文字模型整张计算图（每条几百 MB），几十条就把显存撑爆
        with torch.inference_mode():
            pe, _ = self.pipe.encode_prompt(prompt=prompt, device="cuda", max_sequence_length=L)
        self.emb[key] = pe.detach()
        while len(self.emb) > 32:
            self.emb.popitem(last=False)
        return pe, L, False

    # ---------- 一次融合 ----------
    # ---------- 低强度重绘（"重新打光"）：从拼接图本身加一部分噪声出发，而不是从纯噪声整张重画 ----------
    def _unshift(self, s, mu):
        """调度器会把传进去的 sigma 做分辨率相关的偏移；这里反算：想要实际噪声比例 s，该传多少。"""
        cfg = self.pipe.scheduler.config
        if cfg.use_dynamic_shifting:
            e = math.exp(mu) if cfg.get("time_shift_type", "exponential") == "exponential" else mu
            return 1.0 / (1.0 + e * (1.0 / s - 1.0))
        k = cfg.get("shift", 1.0)
        return s / (k - (k - 1) * s)

    def _partial(self, stitched, width, height, strength, steps, g):
        """返回 (加了噪的拼接图潜变量, 传给管线的 sigmas, 实际起始噪声比例)。strength 越小越像拼接图。"""
        import numpy as np
        from diffusers.pipelines.flux2.pipeline_flux2_klein import compute_empirical_mu
        from diffusers.utils.torch_utils import randn_tensor
        p = self.pipe
        k = max(2, math.ceil(steps * strength))  # 力度 0.5、4 步 → 只跑 2 步
        seq = (height // 16) * (width // 16)
        mu = compute_empirical_mu(image_seq_len=seq, num_steps=k)
        want = [strength * (1 - i / k) for i in range(k)]  # 实际噪声比例从 strength 均匀降到 0
        sig = [self._unshift(w, mu) for w in want]
        p.scheduler.set_timesteps(sigmas=np.array(sig, dtype=np.float32), mu=mu, device="cuda")
        s0 = float(p.scheduler.sigmas[0])  # 以调度器实际算出来的为准
        img = p.image_processor.preprocess(stitched.resize((width, height)), height=height, width=width)
        x0 = p._encode_vae_image(img.to("cuda", p.vae.dtype), generator=None)
        noise = randn_tensor(x0.shape, generator=g, device=x0.device, dtype=x0.dtype)
        return (1 - s0) * x0 + s0 * noise, sig, s0

    def run(self, prompt, images, width, height, seed=None, steps=4, cancel=None, strength=None):
        """images: PIL 列表，第一张是拼接图，后面是角色参考图。返回 (PIL, timings)。
        cancel()：返回 True 时在下一步结束处停下，抛 Superseded（新的一格最多等一步，约 0.5 秒）。
        strength：None 整张重绘；0–1 低强度重绘，越小越保留拼接图（脸、构图），也越快。"""
        with self.lock:
            if cancel and cancel():
                raise Superseded()
            _sync()
            t0 = time.perf_counter()
            pe, L, cached = self.embed(prompt)
            _sync()
            t1 = time.perf_counter()
            g = torch.Generator("cuda").manual_seed(int(seed) if seed is not None else int(time.time() * 1000) % 2**31)
            kw = dict(image=images, prompt_embeds=pe, width=width, height=height,
                      num_inference_steps=steps, generator=g, max_sequence_length=L)
            s0 = None
            # 调度器若用自带的 flow sigmas，会忽略传进去的 sigmas，低强度就对不上，只能整张重绘
            flow = getattr(self.pipe.scheduler.config, "use_flow_sigmas", False)
            if strength is not None and 0 < strength < 1 and not self.kv and not flow:
                with torch.inference_mode():
                    lat, sig, s0 = self._partial(images[0], width, height, strength, steps, g)
                kw.update(latents=lat, sigmas=sig, num_inference_steps=len(sig))
            if not self.kv:
                kw["guidance_scale"] = 1.0  # 蒸馏版不需要 CFG，显式关掉防止算两遍
            if cancel:
                def on_step(pipe, i, t, kwargs):
                    if cancel():
                        pipe._interrupt = True  # 剩下的步数跳过
                    return kwargs
                kw["callback_on_step_end"] = on_step
            out = self.pipe(**kw).images[0]
            _sync()
            if cancel and cancel():
                raise Superseded()
            t2 = time.perf_counter()
        return out, {"text": round(t1 - t0, 3), "text_cached": cached, "text_tokens": L,
                     "inference": round(t2 - t1, 3), "model": round(t2 - t0, 3),
                     "steps": kw["num_inference_steps"], "strength": None if s0 is None else round(s0, 3)}

    def warmup(self, width=576, height=720, refs=2, n=2):
        img = Image.new("RGB", (width, height), (120, 100, 80))
        ref = Image.new("RGB", (256, 256), (90, 60, 40))
        try:
            self.run("warm up", [img] + [ref] * refs, width, height, seed=0)
        except RuntimeError as e:
            if "CUDNN" not in str(e):
                raise
            # 有的 PyTorch 版本自带的 cuDNN 子库加载不了；只有 VAE 的卷积用它，关掉照样能跑
            print(f"[cudnn] 加载失败，改用不走 cuDNN 的卷积：{str(e)[:160]}", flush=True)
            torch.backends.cudnn.enabled = False
        for _ in range(n):
            self.run("warm up", [img] + [ref] * refs, width, height, seed=0)


def to_bytes(img, fmt="jpeg", quality=88):
    b = io.BytesIO()
    if fmt == "webp":
        img.save(b, "WEBP", quality=quality)
    else:
        img.save(b, "JPEG", quality=quality)
    return b.getvalue()
