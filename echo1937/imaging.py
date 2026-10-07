import io
import os

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps

BASE_HEIGHT = 900  # 站立姿势归一后的人物像素高度
_rembg_session = None
_rembg_failed = False


def compress(data: bytes, max_side: int = 1536) -> bytes:
    img = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert("RGB")
    img.thumbnail((max_side, max_side))
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=88)
    return buf.getvalue()


def to_png(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.save(buf, "PNG", optimize=True)
    return buf.getvalue()


# ---------- 抠图 ----------

def cutout(data: bytes) -> tuple[Image.Image, str]:
    """返回 (RGBA 图, 使用的方法)。装了 rembg 就用模型抠图，否则从边缘泛洪去掉纯色背景。"""
    img = Image.open(io.BytesIO(data)).convert("RGB")
    rgba = _rembg(img)
    if rgba is not None:
        return rgba, "rembg"
    return _flood_cutout(img), "flood"


def _rembg(img: Image.Image):
    global _rembg_session, _rembg_failed
    if _rembg_failed or os.getenv("ECHO_MATTING") == "flood":
        return None
    try:
        from rembg import new_session, remove

        if _rembg_session is None:
            _rembg_session = new_session(os.getenv("ECHO_REMBG_MODEL", "isnet-general-use"))
        return remove(img, session=_rembg_session).convert("RGBA")
    except Exception:
        _rembg_failed = True
        return None


def _flood_cutout(img: Image.Image, tol: int = 26) -> Image.Image:
    w, h = img.size
    border = [img.getpixel((x, y)) for x in range(0, w, 8) for y in (0, h - 1)] + \
             [img.getpixel((x, y)) for y in range(0, h, 8) for x in (0, w - 1)]
    bg = tuple(sorted(c[i] for c in border)[len(border) // 2] for i in range(3))

    # 和背景色足够接近的像素记为 255，再只保留与边缘连通的部分，避免抠掉人物身上的浅灰色
    r, g, b = (ch.point(lambda v, c=c: abs(v - c)) for ch, c in zip(img.split(), bg))
    near = ImageChops.lighter(ImageChops.lighter(r, g), b).point(lambda v: 255 if v <= tol else 0)
    for x, y in [(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)] + \
                [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]:
        if near.getpixel((x, y)) == 255:
            ImageDraw.floodfill(near, (x, y), 128)
    alpha = near.point(lambda v: 0 if v == 128 else 255)
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    rgba = img.convert("RGBA")
    rgba.putalpha(alpha)
    return rgba


# ---------- 锚点与归一 ----------

def normalize_sprite(rgba: Image.Image, ratio: float) -> tuple[bytes, dict]:
    """裁到人物边界、缩放到统一身高，返回 PNG 和锚点（坐标为 0–1，相对于输出图）。"""
    solid = rgba.getchannel("A").point(lambda v: 255 if v > 40 else 0)
    bbox = solid.getbbox()
    if not bbox:
        raise ValueError("抠图后没有找到人物")
    x0, y0, x1, y1 = bbox
    if (y1 - y0) < rgba.height * 0.2:
        raise ValueError("抠出来的人物太小，可能抠图失败")
    pad = int((y1 - y0) * 0.02)
    crop = rgba.crop((max(0, x0 - pad), max(0, y0 - pad), min(rgba.width, x1 + pad), min(rgba.height, y1 + pad)))
    target_h = int(BASE_HEIGHT * ratio)
    fig_h = y1 - y0
    scale = target_h / fig_h
    out = crop.resize((max(1, int(crop.width * scale)), max(1, int(crop.height * scale))), Image.LANCZOS)

    a = out.getchannel("A").point(lambda v: 255 if v > 40 else 0)
    fx0, fy0, fx1, fy1 = a.getbbox()
    W, H = out.size
    px = a.load()

    def centroid(top, bottom):
        xs = ys = n = 0
        for y in range(top, bottom):
            for x in range(fx0, fx1):
                if px[x, y]:
                    xs += x
                    ys += y
                    n += 1
        return (xs / n, ys / n) if n else ((fx0 + fx1) / 2, (top + bottom) / 2)

    foot_band = max(1, int((fy1 - fy0) * 0.03))
    foot_x, _ = centroid(fy1 - foot_band, fy1)
    head_band = max(1, int((fy1 - fy0) * 0.15))
    head_x, head_y = centroid(fy0, fy0 + head_band)
    meta = {
        "foot_x": round(foot_x / W, 4), "foot_y": round(fy1 / H, 4),
        "head_x": round(head_x / W, 4), "head_y": round(head_y / H, 4),
        "width": W, "height": H,
    }
    return to_png(out), meta
