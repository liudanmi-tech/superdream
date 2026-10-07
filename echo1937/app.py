import asyncio
import json
import os
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import ai
import imaging
import jobs
import onboard as ob
import store

COOKIE = "echo_uid"


@asynccontextmanager
async def lifespan(app):
    store.sweep_expired_photos()
    jobs.start()
    yield
    await jobs.stop()


app = FastAPI(title="回声 1937 Demo", lifespan=lifespan)
os.makedirs(store.ASSETS, exist_ok=True)
app.mount("/assets", StaticFiles(directory=store.ASSETS), name="assets")


@app.exception_handler(Exception)
async def _unhandled(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": f"服务器出错：{type(exc).__name__}: {exc}"})


def _uid(request: Request) -> str | None:
    uid = request.cookies.get(COOKIE)
    return uid if uid and store.q1("SELECT id FROM users WHERE id=?", uid) else None


def _user(request: Request) -> dict:
    uid = _uid(request)
    if not uid:
        raise HTTPException(401, "请先选择身份")
    return store.q1("SELECT * FROM users WHERE id=?", uid)


def _approved(uid: str) -> dict | None:
    return store.q1("SELECT * FROM character_sheets WHERE user_id=? AND approved=1", uid)


@app.get("/")
def index():
    return FileResponse(os.path.join(store.BASE, "static", "index.html"))


@app.get("/api/config")
def config():
    try:
        import rembg  # noqa: F401
        matting = "rembg"
    except Exception:
        matting = "flood"
    return {"provider": ai.PROVIDER, "vision_model": ai.VISION_MODEL, "image_model": ai.IMAGE_MODEL,
            "style_refs": len(store.style_refs(99)), "matting": matting, "premise": ob.WORLD["premise"],
            "roles": ob.WORLD["roles"], "poses": [{k: p[k] for k in ("id", "label")} for p in ob.WORLD["poses"]],
            "first_day_poses": ob.FIRST_DAY, "min_photos": ob.MIN_PHOTOS, "max_photos": ob.MAX_PHOTOS,
            "max_sheet_attempts": ob.MAX_SHEET_ATTEMPTS}


# ---------- 入住 ----------

class RoleBody(BaseModel):
    role: str


@app.post("/api/onboard/role")
def choose_role(body: RoleBody, request: Request, response: Response):
    if body.role not in ob.ROLES:
        raise HTTPException(400, "没有这个身份")
    uid = _uid(request)
    if uid and _approved(uid):
        raise HTTPException(409, "已经入住，不能再换身份")
    if not uid:
        uid = store.new_id()
        store.ex("INSERT INTO users (id, role, created_at) VALUES (?, ?, ?)", uid, body.role, store.now())
        response.set_cookie(COOKIE, uid, httponly=True, samesite="lax", max_age=3600 * 24 * 90)
    else:
        store.ex("UPDATE users SET role=? WHERE id=?", body.role, uid)
    return status(request, uid)


@app.post("/api/onboard/photos")
async def upload_photos(request: Request, files: list[UploadFile] = File(...), birth_year: int = Form(...),
                        consent_self: bool = Form(False), consent_adult: bool = Form(False),
                        consent_generate: bool = Form(False)):
    user = _user(request)
    if _approved(user["id"]):
        raise HTTPException(409, "已经入住，不能再换照片")
    if not (consent_self and consent_adult and consent_generate):
        raise HTTPException(400, "需要勾选全部三项同意")
    if not 1900 <= birth_year <= datetime.now().year or datetime.now().year - birth_year < ob.MIN_AGE:
        raise HTTPException(400, f"Demo 只对年满 {ob.MIN_AGE} 岁的用户开放")
    if not ob.MIN_PHOTOS <= len(files) <= ob.MAX_PHOTOS:
        raise HTTPException(400, f"请上传 {ob.MIN_PHOTOS}–{ob.MAX_PHOTOS} 张照片")

    images = []
    for f in files:
        try:
            images.append(await asyncio.to_thread(imaging.compress, await f.read()))
        except Exception:
            raise HTTPException(400, f"「{f.filename}」不是可识别的图片")
    results, block = await ob.qc_photos(images)
    store.ex("UPDATE users SET birth_year=?, consent_at=? WHERE id=?", birth_year, store.now(), user["id"])
    # 新的一组照片替换旧的；没通过质检的照片不保存
    store.delete_photos(user["id"])
    store.ex("DELETE FROM user_photos WHERE user_id=?", user["id"])
    store.ex("UPDATE users SET photos_deleted=0 WHERE id=?", user["id"])
    if block:
        raise HTTPException(422, block)
    expires = store.now() + store.PHOTO_TTL_DAYS * 86400
    for img, r in zip(images, results):
        path = store.save_photo(user["id"], img) if r["ok"] else None
        store.ex("INSERT INTO user_photos (id, user_id, path, qc, ok, expires_at, created_at) VALUES (?,?,?,?,?,?,?)",
                 store.new_id(), user["id"], path, store.dumps(r), int(r["ok"]), expires, store.now())
    return {"results": results, "ok_count": sum(r["ok"] for r in results), **status(request, user["id"])}


class SheetBody(BaseModel):
    feedback: str = ""


@app.post("/api/onboard/sheet")
def make_sheet(body: SheetBody, request: Request):
    user = _user(request)
    if _approved(user["id"]):
        raise HTTPException(409, "已经入住")
    ok = store.q1("SELECT COUNT(*) n FROM user_photos WHERE user_id=? AND ok=1 AND path IS NOT NULL", user["id"])["n"]
    if ok < ob.MIN_PHOTOS:
        raise HTTPException(400, f"需要至少 {ob.MIN_PHOTOS} 张通过质检的照片")
    sheets = store.q("SELECT * FROM character_sheets WHERE user_id=?", user["id"])
    if any(s["status"] in ("queued", "generating") for s in sheets):
        raise HTTPException(409, "设定图正在生成")
    if sum(s["status"] != "failed" for s in sheets) >= ob.MAX_SHEET_ATTEMPTS:
        raise HTTPException(409, f"设定图最多生成 {ob.MAX_SHEET_ATTEMPTS} 次")
    sid = store.new_id()
    store.ex("INSERT INTO character_sheets (id, user_id, attempt, feedback, status, created_at) VALUES (?,?,?,?,?,?)",
             sid, user["id"], len(sheets) + 1, body.feedback.strip()[:200], "queued", store.now())
    jobs.enqueue("sheet", user["id"], sid, ob.PRIORITY_SHEET)
    return status(request, user["id"])


class ApproveBody(BaseModel):
    sheet_id: str
    keep_photos: bool = False


@app.post("/api/onboard/approve")
def approve(body: ApproveBody, request: Request):
    user = _user(request)
    if _approved(user["id"]):
        raise HTTPException(409, "已经入住")
    sheet = store.q1("SELECT * FROM character_sheets WHERE id=? AND user_id=? AND status='ready'",
                     body.sheet_id, user["id"])
    if not sheet:
        raise HTTPException(404, "没有这张设定图")
    store.ex("UPDATE character_sheets SET approved=1 WHERE id=?", sheet["id"])
    store.ex("UPDATE users SET keep_photos=? WHERE id=?", int(body.keep_photos), user["id"])
    store.ex("INSERT INTO worlds (id, user_id, day, phase, pace, traits, choices, created_at) VALUES (?,?,?,?,?,?,?,?)",
             store.new_id(), user["id"], 1, "dawn", "fast", "{}", "[]", store.now())
    for pose in ob.WORLD["poses"]:
        store.ex("INSERT OR REPLACE INTO sprites (id, owner, pose, status, attempts, updated_at) VALUES (?,?,?,?,0,?)",
                 store.new_id(), user["id"], pose["id"], "queued", store.now())
        first = pose["id"] in ob.FIRST_DAY
        jobs.enqueue("sprite", user["id"], pose["id"], ob.PRIORITY_FIRST_DAY if first else ob.PRIORITY_REST)
    return status(request, user["id"])


@app.post("/api/sprites/{pose}/regen")
def regen_sprite(pose: str, request: Request):
    user = _user(request)
    if pose not in ob.POSES or not _approved(user["id"]):
        raise HTTPException(404, "没有这个动作")
    row = store.q1("SELECT status FROM sprites WHERE owner=? AND pose=?", user["id"], pose)
    if row and row["status"] in ("queued", "generating"):
        raise HTTPException(409, "这个动作正在生成")
    store.ex("UPDATE sprites SET status='queued', error=NULL, updated_at=? WHERE owner=? AND pose=?",
             store.now(), user["id"], pose)
    jobs.enqueue("sprite", user["id"], pose, ob.PRIORITY_REGEN)
    return status(request, user["id"])


@app.post("/api/me/photos/delete")
def delete_photos_now(request: Request):
    user = _user(request)
    store.delete_photos(user["id"])
    return status(request, user["id"])


@app.delete("/api/me")
def delete_me(request: Request, response: Response):
    uid = _uid(request)
    if uid:
        store.delete_user(uid)
    response.delete_cookie(COOKIE)
    return {"deleted": True}


# ---------- 状态 ----------

def _url(uid: str, path: str | None) -> str | None:
    return f"/files/{store.rel(path)}" if path else None


@app.get("/api/onboard/status")
def get_status(request: Request):
    uid = _uid(request)
    return status(request, uid) if uid else {"user": None}


def status(request: Request, uid: str) -> dict:
    user = store.q1("SELECT id, role, birth_year, keep_photos, photos_deleted FROM users WHERE id=?", uid)
    photos = store.q("SELECT qc, ok, path IS NOT NULL AS stored FROM user_photos WHERE user_id=? ORDER BY created_at",
                     uid)
    sheets = store.q("SELECT id, path, attempt, feedback, approved, status, error FROM character_sheets "
                     "WHERE user_id=? ORDER BY attempt", uid)
    sprites = store.q("SELECT pose, path, foot_x, foot_y, head_y, width, height, status, attempts, qc, error "
                      "FROM sprites WHERE owner=?", uid)
    world = store.q1("SELECT day, phase, pace FROM worlds WHERE user_id=?", uid)
    for s in sheets:
        s["url"] = _url(uid, s.pop("path"))
    for s in sprites:
        s["url"] = _url(uid, s.pop("path"))
        s["qc"] = json.loads(s["qc"]) if s["qc"] else None
    for p in photos:
        p["qc"] = json.loads(p["qc"])
    order = {p["id"]: i for i, p in enumerate(ob.WORLD["poses"])}
    sprites.sort(key=lambda s: order.get(s["pose"], 99))
    return {"user": user, "photos": photos, "sheets": sheets, "sprites": sprites, "world": world,
            "cost_usd": jobs.total_cost(uid)}


@app.get("/files/{path:path}")
def files(path: str, request: Request):
    uid = _uid(request)
    full = os.path.realpath(os.path.join(store.DATA, path))
    own = os.path.realpath(os.path.join(store.DATA, "users", uid or "-")) + os.sep
    if not uid or not full.startswith(own) or f"{os.sep}photos{os.sep}" in full or not os.path.isfile(full):
        raise HTTPException(404, "没有这个文件")
    return FileResponse(full)
