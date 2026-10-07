import asyncio
import io

from PIL import Image

import ai
import imaging
import store

WORLD = store.load_world()
ROLES = {r["id"]: r for r in WORLD["roles"]}
POSES = {p["id"]: p for p in WORLD["poses"]}
FIRST_DAY = WORLD["first_day_poses"]
STYLE_EN = WORLD["style"]["prompt_en"]
RULES_EN = WORLD["content_rules_en"]

MIN_PHOTOS, MAX_PHOTOS = 3, 5
MAX_SHEET_ATTEMPTS = 3
MIN_AGE = 18

PRIORITY_SHEET, PRIORITY_REGEN, PRIORITY_FIRST_DAY, PRIORITY_REST = 100, 60, 50, 10


# ---------- 照片质检 ----------

PHOTO_QC_PROMPT = """You are the photo quality checker for an app that turns a user's own photos into a comic character.
Check each photo below (they are numbered in order, starting at 1). Do NOT identify who the person is.
Return JSON exactly in this shape:
{"photos": [{"index": 1, "person_count": 1, "face_visible": true, "face_occluded": false, "sunglasses": false,
  "too_dark_or_blurry": false, "minor_possible": false, "public_figure_or_media": false, "note": ""}]}
Rules:
- person_count: number of clearly visible people (faces or bodies), ignore tiny far-away passers-by.
- face_visible: the main person's face is clearly visible and large enough to see the features.
- face_occluded: hand, mask, hair, hat brim, heavy filter or sticker covering a significant part of the face.
- minor_possible: the person might be under 18. Be cautious: if in doubt, set true.
- public_figure_or_media: the image looks like a film still, magazine/news photo, poster, or a well-known celebrity.
- note: one short sentence in Chinese if something is wrong, otherwise empty."""

_REASONS = [
    ("person_count", lambda v: v != 1, "照片里需要只有你一个人"),
    ("face_visible", lambda v: v is False, "脸不够清楚，请换一张正面、光线充足的照片"),
    ("face_occluded", lambda v: v is True, "脸被遮挡了"),
    ("sunglasses", lambda v: v is True, "请不要戴墨镜"),
    ("too_dark_or_blurry", lambda v: v is True, "照片太暗或太模糊"),
]


async def qc_photos(images: list[bytes]) -> tuple[list[dict], str | None]:
    """返回 (每张照片的结果, 整体拒绝原因)。整体拒绝时不保存任何照片。"""
    parts: list = [PHOTO_QC_PROMPT]
    for i, img in enumerate(images, 1):
        parts += [f"Photo {i}:", img]
    raw = await ai.vision_json(parts, mock=lambda: {"photos": [
        {"index": i, "person_count": 1, "face_visible": True} for i in range(1, len(images) + 1)]})
    found = {p.get("index"): p for p in (raw.get("photos") if isinstance(raw, dict) else raw) or []
             if isinstance(p, dict)}
    results, block = [], None
    for i, img in enumerate(images, 1):
        r = found.get(i) or {}
        reasons = [msg for key, bad, msg in _REASONS if key in r and bad(r[key])]
        w, h = Image.open(io.BytesIO(img)).size
        if min(w, h) < 400:
            reasons.append("照片分辨率太低")
        if not r:
            reasons.append("没能识别这张照片，请换一张")
        if r.get("minor_possible") is True:
            block = "照片里的人可能未满 18 岁，Demo 只为成年人生成形象。"
        if r.get("public_figure_or_media") is True:
            block = block or "这组照片看起来像剧照、媒体照片或公众人物，只能上传你本人的生活照。"
        results.append({"index": i, "ok": not reasons, "reasons": reasons, "note": r.get("note") or ""})
    return results, block


# ---------- 角色设定图 ----------

def sheet_prompt(role_id: str, feedback: str = "") -> str:
    role = ROLES[role_id]
    text = (
        "Create a character reference sheet of the person in the photo references, "
        f"drawn in the art style of the style references ({STYLE_EN}). "
        "Keep their face shape, eyes, nose, hairline, hair texture, skin tone and overall likeness recognizable, "
        "but stylized, not photorealistic.\n"
        f"Setting: Los Angeles, 1937. Role: {role['label']} ({role['id']}). Outfit: {role['outfit_en']}.\n"
        "Layout: full-body front view, three-quarter view and side view, plus four head close-ups: "
        "neutral, smiling, surprised, sad.\n"
        "Plain light grey background, even studio lighting, no text, no other people.\n"
        f"{RULES_EN}"
    )
    if feedback:
        text += f"\nAdjustment requested by the person: {feedback}"
    return text


def resident_sheet_prompt(res: dict) -> str:
    return (
        f"Create a character reference sheet of an original fictional character in the art style of the style "
        f"references ({STYLE_EN}). Do not base the character on any real person.\n"
        f"Character: {res['name_en']}, {res['age']} years old, {res['role']}. Appearance: {res['appearance_en']}. "
        f"Outfit: {res['outfit_en']}. Setting: Los Angeles, 1937.\n"
        "Layout: full-body front view, three-quarter view and side view, plus four head close-ups: "
        "neutral, smiling, surprised, sad.\nPlain light grey background, even studio lighting, no text, no other people."
    )


async def make_sheet(prompt: str, photos: list[bytes], label: str) -> ai.ImageResult:
    parts: list = [prompt]
    if photos:
        parts.append("Photo references of the person:")
        parts += photos
    styles = store.style_refs(2)
    if styles:
        parts.append("Style references (copy the art style only, not the content):")
        parts += styles
    return await ai.generate_image(parts, "3:2", mock_kind="sheet", mock_label=label)


# ---------- 动作图 ----------

def sprite_prompt(pose_id: str, outfit_en: str) -> str:
    pose = POSES[pose_id]
    return (
        "Draw the character from the character sheet reference in a single new pose. The character sheet is the "
        "definitive reference for the face, hair, body shape and outfit"
        " (the photo, if given, is only for double-checking likeness). "
        f"Art style: {STYLE_EN}, matching the style reference.\n"
        f"Pose: {pose['prompt_en']}.\n"
        f"Outfit: {outfit_en} (unless the pose says otherwise). Keep it identical to the character sheet.\n"
        "Full body from the top of the head to the feet, eye-level camera, the character centered, "
        "feet near the bottom of the frame with a small margin.\n"
        "Plain flat light grey background (#D9D9D9). No floor, no cast shadow, no scenery, no props other than "
        "those named in the pose, no text, no other people."
    )


SPRITE_QC_PROMPT = """You check one generated character pose image for a comic app.
Expected pose: {pose}
Expected outfit: {outfit} (unless the pose description specifies different clothing).
Return JSON: {{"pose_matches": true, "full_body": true, "single_person": true, "hands_ok": true,
"outfit_matches": true, "plain_background": true, "issues": ["short Chinese description of each problem"]}}
- full_body: head and both feet are fully inside the frame.
- hands_ok: no extra, missing or badly malformed fingers or hands.
- plain_background: flat light grey background with no scenery or floor shadow."""


async def sprite_qc(image: bytes, pose_id: str, outfit_en: str) -> dict:
    prompt = SPRITE_QC_PROMPT.format(pose=POSES[pose_id]["prompt_en"], outfit=outfit_en)
    raw = await ai.vision_json([prompt, image], mock={"pose_matches": True, "full_body": True, "single_person": True,
                                                     "hands_ok": True, "outfit_matches": True,
                                                     "plain_background": True, "issues": []})
    raw = raw if isinstance(raw, dict) else {}
    checks = ("pose_matches", "full_body", "single_person", "hands_ok", "outfit_matches", "plain_background")
    failed = [k for k in checks if raw.get(k) is False]
    issues = [str(i) for i in raw.get("issues") or [] if i] if isinstance(raw.get("issues"), list) else []
    return {"pass": not failed, "failed": failed, "issues": issues}


async def make_sprite(sheet: bytes, photo: bytes | None, pose_id: str, outfit_en: str, label: str) -> dict:
    """生成一个动作：出图 → 质检（不合格自动重生一次）→ 抠图 → 锚点与统一身高。"""
    parts: list = [sprite_prompt(pose_id, outfit_en), "Character sheet reference:", sheet]
    if photo:
        parts += ["Photo of the real person (likeness check only):", photo]
    styles = store.style_refs(1)
    if styles:
        parts += ["Style reference (art style only):", styles[0]]
    cost, attempt, qc, image = 0.0, 0, None, None
    for attempt in (1, 2):
        res = await ai.generate_image(parts, "2:3", mock_kind="sprite", mock_label=pose_id)
        cost += res.cost or 0
        image = res.data
        qc = await sprite_qc(image, pose_id, outfit_en)
        if qc["pass"]:
            break
    rgba, method = await asyncio.to_thread(imaging.cutout, image)
    png, meta = await asyncio.to_thread(imaging.normalize_sprite, rgba, POSES[pose_id]["ratio"])
    return {"png": png, "raw": image, "meta": meta, "qc": {**qc, "matting": method},
            "attempts": attempt, "cost": cost, "status": "ready" if qc["pass"] else "qc_warn"}


# ---------- 任务处理（由 jobs.py 调用） ----------

def user_photos(uid: str) -> list[bytes]:
    rows = store.q("SELECT path FROM user_photos WHERE user_id=? AND ok=1 AND path IS NOT NULL ORDER BY created_at",
                   uid)
    return [store.load_photo(r["path"]) for r in rows]


async def handle_sheet(job: dict) -> float:
    sheet = store.q1("SELECT * FROM character_sheets WHERE id=?", job["target"])
    user = store.q1("SELECT * FROM users WHERE id=?", job["owner"])
    if not sheet or not user:
        return 0.0
    store.ex("UPDATE character_sheets SET status='generating' WHERE id=?", sheet["id"])
    res = await make_sheet(sheet_prompt(user["role"], sheet["feedback"] or ""), user_photos(user["id"]),
                           f"{user['role']}-{sheet['attempt']}")
    path = store.write(store.user_dir(user["id"], "sheets", f"{sheet['id']}.png"), res.data)
    store.ex("UPDATE character_sheets SET status='ready', path=? WHERE id=?", path, sheet["id"])
    return res.cost or 0.0


async def handle_sprite(job: dict) -> float:
    uid, pose_id = job["owner"], job["target"]
    user = store.q1("SELECT * FROM users WHERE id=?", uid)
    sheet = store.q1("SELECT * FROM character_sheets WHERE user_id=? AND approved=1", uid)
    if not user or not sheet:
        return 0.0
    store.ex("UPDATE sprites SET status='generating', error=NULL, updated_at=? WHERE owner=? AND pose=?",
             store.now(), uid, pose_id)
    photos = user_photos(uid)
    out = await make_sprite(store.read(sheet["path"]), photos[0] if photos else None, pose_id,
                            ROLES[user["role"]]["outfit_en"], f"{uid[:6]}-{pose_id}")
    version = int(store.now())
    path = store.write(store.user_dir(uid, "sprites", f"{pose_id}_{version}.png"), out["png"])
    raw = store.write(store.user_dir(uid, "sprites_raw", f"{pose_id}_{version}.png"), out["raw"])
    m = out["meta"]
    store.ex("""UPDATE sprites SET path=?, raw_path=?, foot_x=?, foot_y=?, head_y=?, width=?, height=?, status=?,
                attempts=attempts+?, qc=?, updated_at=? WHERE owner=? AND pose=?""",
             path, raw, m["foot_x"], m["foot_y"], m["head_y"], m["width"], m["height"], out["status"],
             out["attempts"], store.dumps({**out["qc"], "head_x": m["head_x"]}), store.now(), uid, pose_id)
    finish_pack_if_done(uid)
    return out["cost"]


def on_job_failed(job: dict, error: str) -> None:
    if job["kind"] == "sheet":
        store.ex("UPDATE character_sheets SET status='failed', error=? WHERE id=?", error, job["target"])
    elif job["kind"] == "sprite":
        store.ex("UPDATE sprites SET status='failed', error=?, updated_at=? WHERE owner=? AND pose=?",
                 error, store.now(), job["owner"], job["target"])
        finish_pack_if_done(job["owner"])


def finish_pack_if_done(uid: str) -> None:
    """16 个动作都有了结果（成功或失败）后，默认删除档案照片。"""
    pending = store.q1("SELECT COUNT(*) n FROM sprites WHERE owner=? AND status IN ('queued','generating')", uid)
    done_ok = store.q1("SELECT COUNT(*) n FROM sprites WHERE owner=? AND status IN ('ready','qc_warn')", uid)
    user = store.q1("SELECT keep_photos, photos_deleted FROM users WHERE id=?", uid)
    if user and pending["n"] == 0 and done_ok["n"] == len(POSES) and not user["keep_photos"] \
            and not user["photos_deleted"]:
        store.delete_photos(uid)
