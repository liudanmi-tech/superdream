import base64
import hashlib
import io
import json
import os
import re

import httpx
from dotenv import load_dotenv
from PIL import Image, ImageDraw

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

if os.getenv("ECHO_MOCK") == "1":
    PROVIDER = "mock"
elif os.getenv("OPENROUTER_API_KEY"):
    PROVIDER = "openrouter"
elif os.getenv("GEMINI_API_KEY"):
    PROVIDER = "gemini"
else:
    PROVIDER = "mock"
MOCK = PROVIDER == "mock"

_DEFAULTS = {
    "openrouter": ("google/gemini-2.5-flash", "google/gemini-2.5-flash-image"),
    "gemini": ("gemini-2.5-flash", "gemini-2.5-flash-image"),
    "mock": ("mock-vision", "mock-image"),
}
VISION_MODEL = os.getenv("ECHO_VISION_MODEL", _DEFAULTS[PROVIDER][0])
IMAGE_MODEL = os.getenv("ECHO_IMAGE_MODEL", _DEFAULTS[PROVIDER][1])
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

_client = None
if PROVIDER == "gemini":
    from google import genai
    from google.genai import types

    _client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])


class ImageResult:
    def __init__(self, data: bytes, cost: float | None):
        self.data = data
        self.cost = cost


def mime_of(data: bytes) -> str:
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return "image/jpeg"


def _parse_json(text: str):
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"[\[{].*[\]}]", text or "", re.S)
        if not m:
            raise RuntimeError(f"模型没有返回 JSON：{(text or '')[:200]}")
        return json.loads(m.group(0))


async def vision_json(parts: list, mock=None):
    """parts 是文字（str）和图片（bytes）混排的列表，返回模型输出的 JSON。"""
    if MOCK:
        return mock() if callable(mock) else (mock or {})
    if PROVIDER == "openrouter":
        msg, _ = await _openrouter(VISION_MODEL, parts, response_format={"type": "json_object"}, temperature=0.1)
        return _parse_json(msg.get("content") or "")
    resp = await _client.aio.models.generate_content(
        model=VISION_MODEL, contents=_gemini_parts(parts),
        config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.1),
    )
    return _parse_json(resp.text or "")


async def generate_image(parts: list, aspect: str, mock_kind: str = "image", mock_label: str = "") -> ImageResult:
    """parts 是文字（str）和参考图（bytes）混排的列表。"""
    if MOCK:
        return ImageResult(mock_image(mock_kind, mock_label, aspect), 0.0)
    if PROVIDER == "openrouter":
        msg, cost = await _openrouter(IMAGE_MODEL, parts, modalities=["image", "text"],
                                      image_config={"aspect_ratio": aspect})
        for img in msg.get("images") or []:
            url = (img.get("image_url") or {}).get("url", "")
            if url.startswith("data:"):
                return ImageResult(base64.b64decode(url.split(",", 1)[1]), cost)
        raise RuntimeError("生图模型没有返回图片（可能被安全策略拦截）：" + (msg.get("content") or "")[:200])
    resp = await _client.aio.models.generate_content(
        model=IMAGE_MODEL, contents=_gemini_parts(parts),
        config=types.GenerateContentConfig(response_modalities=["TEXT", "IMAGE"],
                                           image_config=types.ImageConfig(aspect_ratio=aspect)),
    )
    for cand in resp.candidates or []:
        for part in (cand.content.parts if cand.content else []) or []:
            if part.inline_data and part.inline_data.data:
                return ImageResult(part.inline_data.data, None)
    raise RuntimeError("生图模型没有返回图片（可能被安全策略拦截）")


def _gemini_parts(parts):
    return [types.Part.from_bytes(data=p, mime_type=mime_of(p)) if isinstance(p, bytes) else p for p in parts]


async def _openrouter(model: str, parts: list, **extra) -> tuple[dict, float | None]:
    content = []
    for p in parts:
        if isinstance(p, bytes):
            url = f"data:{mime_of(p)};base64," + base64.b64encode(p).decode()
            content.append({"type": "image_url", "image_url": {"url": url}})
        else:
            content.append({"type": "text", "text": p})
    body = {"model": model, "messages": [{"role": "user", "content": content}],
            "usage": {"include": True}, **extra}
    headers = {"Authorization": f"Bearer {os.environ['OPENROUTER_API_KEY']}", "X-Title": "echo1937"}
    async with httpx.AsyncClient(timeout=240) as client:
        r = await client.post(OPENROUTER_URL, json=body, headers=headers)
    if r.status_code != 200:
        raise RuntimeError(f"OpenRouter {r.status_code}：{r.text[:300]}")
    data = r.json()
    if data.get("error"):
        raise RuntimeError(f"OpenRouter 错误：{data['error']}")
    cost = (data.get("usage") or {}).get("cost")
    return data["choices"][0]["message"], (float(cost) if cost is not None else None)


# ---------- 模拟模式 ----------

_ASPECTS = {"2:3": (683, 1024), "3:2": (1024, 683), "4:5": (820, 1024), "1:1": (1024, 1024)}


def mock_image(kind: str, label: str, aspect: str) -> bytes:
    w, h = _ASPECTS.get(aspect, (1024, 1024))
    seed = int(hashlib.md5(label.encode()).hexdigest()[:6], 16)
    color = (80 + seed % 150, 80 + (seed // 7) % 150, 80 + (seed // 49) % 150)
    img = Image.new("RGB", (w, h), (217, 217, 217))
    d = ImageDraw.Draw(img)
    if kind == "sprite":
        _figure(d, w // 2, int(h * 0.92), int(h * 0.78), color, label)
    elif kind == "sheet":
        for i, x in enumerate((0.15, 0.32, 0.49)):
            _figure(d, int(w * x), int(h * 0.92), int(h * 0.8), color, "stand")
        for i in range(4):
            cx, cy = int(w * (0.65 + 0.15 * (i % 2))), int(h * (0.28 + 0.4 * (i // 2)))
            d.ellipse([cx - 60, cy - 70, cx + 60, cy + 70], fill=(236, 200, 170), outline=(40, 40, 40), width=3)
    else:
        img = Image.new("RGB", (w, h), color)
        d = ImageDraw.Draw(img)
    if kind != "sprite":  # 动作图不写字，否则文字会被当成人物的一部分抠出来
        d.text((16, 16), f"MOCK {kind} {label}".encode("ascii", "replace").decode(), fill=(40, 40, 40))
    buf = io.BytesIO()
    img.save(buf, "PNG")
    return buf.getvalue()


def _figure(d, cx, foot_y, height, color, pose):
    """画一个简单的小人，用来在模拟模式下测试抠图和锚点。"""
    if pose in ("sit_booth", "type"):
        height = int(height * 0.72)
    head_r = height // 9
    top = foot_y - height
    arms_up = pose == "wake_stretch"
    d.ellipse([cx - head_r, top, cx + head_r, top + 2 * head_r], fill=(236, 200, 170), outline=(40, 40, 40), width=3)
    body_top, body_bot = top + 2 * head_r, top + int(height * 0.6)
    d.rectangle([cx - head_r, body_top, cx + head_r, body_bot], fill=color, outline=(40, 40, 40), width=3)
    leg_w = head_r // 2
    d.rectangle([cx - head_r, body_bot, cx - head_r + leg_w, foot_y], fill=(50, 50, 70))
    d.rectangle([cx + head_r - leg_w, body_bot, cx + head_r, foot_y], fill=(50, 50, 70))
    if arms_up:
        d.line([cx - head_r, body_top, cx - head_r - 20, top - head_r], fill=color, width=leg_w)
        d.line([cx + head_r, body_top, cx + head_r + 20, top - head_r], fill=color, width=leg_w)
    else:
        d.line([cx - head_r, body_top, cx - 2 * head_r, body_bot], fill=color, width=leg_w)
        d.line([cx + head_r, body_top, cx + 2 * head_r, body_bot], fill=color, width=leg_w)
