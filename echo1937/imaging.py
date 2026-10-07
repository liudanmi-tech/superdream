import io
import os

from PIL import Image, ImageFilter, ImageOps

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
    img = Image.open(io.BytesIO(data))
    rgba = _rembg(img.convert("RGB"))
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
    """从边缘泛洪去掉纯色背景，只去掉与边缘连通的部分，人物身上的浅灰色不会被抠掉。
    模型有时会在四周画白边和细线框：剩下的区域几乎占满整张图、内圈又是同一种颜色时，
    就把这一层当成画框去掉，再从内圈继续往里抠，最多剥 3 层。与 web/index.html 的 cutout 算法一致。"""
    rgba = img.convert("RGBA")
    w, h = rgba.size
    px = rgba.tobytes()
    n = w * h
    removed = bytearray(1 if px[i * 4 + 3] < 16 else 0 for i in range(n))

    def near(i, col):
        o = i * 4
        return max(abs(px[o] - col[0]), abs(px[o + 1] - col[1]), abs(px[o + 2] - col[2])) <= tol

    def ring(r):
        x0, y0, x1, y1 = r
        return [y0 * w + x for x in range(x0, x1 + 1, 2)] + [y1 * w + x for x in range(x0, x1 + 1, 2)] + \
               [y * w + x0 for y in range(y0, y1 + 1, 2)] + [y * w + x1 for y in range(y0, y1 + 1, 2)]

    def median(idx):
        return [sorted(px[i * 4 + ch] for i in idx)[len(idx) // 2] for ch in range(3)]

    def flood(r, col):
        x0, y0, x1, y1 = r
        stack = []

        def push(x, y):
            if x0 <= x <= x1 and y0 <= y <= y1:
                i = y * w + x
                if not removed[i] and near(i, col):
                    removed[i] = 1
                    stack.append(i)

        for x in range(x0, x1 + 1):
            push(x, y0)
            push(x, y1)
        for y in range(y0, y1 + 1):
            push(x0, y)
            push(x1, y)
        while stack:
            i = stack.pop()
            x, y = i % w, i // w
            push(x - 1, y)
            push(x + 1, y)
            push(x, y - 1)
            push(x, y + 1)

    def box():
        mask = Image.frombytes("L", (w, h), bytes(0 if v else 255 for v in removed))
        b = mask.getbbox()
        return (b[0], b[1], b[2] - 1, b[3] - 1) if b else None

    def inner_ring(b):
        """在剩余区域内侧找一圈"同一种颜色"的位置：线框可能很粗、是双线或带角花，所以从浅到深多试几个深度。"""
        for k in (4, 8, 12, 16, 24, 32, 48):
            r = (b[0] + k, b[1] + k, b[2] - k, b[3] - k)
            if r[2] <= r[0] or r[3] <= r[1]:
                return None
            x0, y0, x1, y1 = r
            sides = [ring((x0, y0, x1, y0)), ring((x0, y1, x1, y1)), ring((x0, y0, x0, y1)), ring((x1, y0, x1, y1))]
            # 四条边都要大多不透明（人物的头顶那条边几乎是空的，不会被误认成画框）
            if any(sum(1 for i in sd if not removed[i]) < len(sd) * 0.6 for sd in sides):
                continue
            solid = [i for i in ring(r) if not removed[i]]
            col = median(solid)
            # 画框内的底色是浅灰或白色：亮、不饱和
            if min(col) < 150 or max(col) - min(col) > 24:
                continue
            if sum(1 for i in solid if near(i, col)) / len(solid) >= 0.85:
                return r, col
        return None

    full = (0, 0, w - 1, h - 1)
    edge = [i for i in ring(full) if not removed[i]]
    if edge:
        flood(full, median(edge))
    for _ in range(3):
        b = box()
        if not b or b[2] - b[0] < w * 0.7 or b[3] - b[1] < h * 0.7:
            break
        found = inner_ring(b)
        if not found:
            break
        (x0, y0, x1, y1), col = found
        for y in range(h):
            row = y * w
            for x in range(w):
                if x < x0 or x > x1 or y < y0 or y > y1:
                    removed[row + x] = 1
        flood(found[0], col)

    # 只保留最大的连通区域（人物）和与它相当的大块（如高脚凳），去掉背景花纹留下的零碎线条
    label = [0] * n
    sizes = [0]
    for start in range(n):
        if removed[start] or label[start]:
            continue
        cid = len(sizes)
        label[start] = cid
        stack, size = [start], 0
        while stack:
            j = stack.pop()
            size += 1
            x = j % w
            for k in ((j - 1) if x > 0 else -1, (j + 1) if x < w - 1 else -1, j - w, j + w):
                if 0 <= k < n and not removed[k] and not label[k]:
                    label[k] = cid
                    stack.append(k)
        sizes.append(size)
    biggest = max(sizes)
    for i in range(n):
        if not removed[i] and sizes[label[i]] < biggest * 0.15:
            removed[i] = 1

    alpha = Image.frombytes("L", (w, h), bytes(0 if v else 255 for v in removed))
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.BoxBlur(1))
    out = img.convert("RGB").convert("RGBA")
    out.putalpha(alpha)
    return out


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
    # 剩下一块矩形背景时，外接框四条边全都是满的；人物至少头顶那条边基本是空的
    a = rgba.getchannel("A")

    def side(pts):
        return sum(1 for p in pts if a.getpixel(p) > 40) / max(1, len(pts))

    xs, ys = range(x0, x1, 2), range(y0, y1, 2)
    sides = [side([(x, y0) for x in xs]), side([(x, y1 - 1) for x in xs]),
             side([(x0, y) for y in ys]), side([(x1 - 1, y) for y in ys])]
    if all(v > 0.6 for v in sides):
        raise ValueError("背景没抠干净（图片可能带了边框或场景），请重新生成")
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
