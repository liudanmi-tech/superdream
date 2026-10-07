import json
import os
import shutil
import sqlite3
import threading
import time
import uuid

from cryptography.fernet import Fernet

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, "data")
ASSETS = os.path.join(BASE, "assets")
os.makedirs(DATA, exist_ok=True)

PHOTO_TTL_DAYS = 7

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, birth_year INT, role TEXT, consent_at REAL,
  keep_photos INT DEFAULT 0, photos_deleted INT DEFAULT 0, created_at REAL);
CREATE TABLE IF NOT EXISTS user_photos (
  id TEXT PRIMARY KEY, user_id TEXT, path TEXT, qc TEXT, ok INT, expires_at REAL, created_at REAL);
CREATE TABLE IF NOT EXISTS character_sheets (
  id TEXT PRIMARY KEY, user_id TEXT, path TEXT, attempt INT, feedback TEXT,
  approved INT DEFAULT 0, status TEXT, error TEXT, created_at REAL);
CREATE TABLE IF NOT EXISTS sprites (
  id TEXT PRIMARY KEY, owner TEXT, pose TEXT, path TEXT, raw_path TEXT,
  foot_x REAL, foot_y REAL, head_y REAL, width INT, height INT,
  status TEXT, attempts INT DEFAULT 0, qc TEXT, error TEXT, updated_at REAL,
  UNIQUE (owner, pose));
CREATE TABLE IF NOT EXISTS worlds (
  id TEXT PRIMARY KEY, user_id TEXT, day INT, phase TEXT, pace TEXT,
  traits TEXT, choices TEXT, created_at REAL);
CREATE TABLE IF NOT EXISTS image_jobs (
  id TEXT PRIMARY KEY, kind TEXT, owner TEXT, target TEXT, prompt TEXT, model TEXT,
  status TEXT, priority INT, attempts INT DEFAULT 0, result_path TEXT, error TEXT,
  cost_usd REAL, created_at REAL, updated_at REAL);
"""

_lock = threading.Lock()
_db = sqlite3.connect(os.path.join(DATA, "echo.db"), check_same_thread=False)
_db.row_factory = sqlite3.Row
_db.executescript(SCHEMA)


def q(sql: str, *args) -> list[dict]:
    with _lock:
        return [dict(r) for r in _db.execute(sql, args).fetchall()]


def q1(sql: str, *args) -> dict | None:
    rows = q(sql, *args)
    return rows[0] if rows else None


def ex(sql: str, *args) -> int:
    with _lock:
        cur = _db.execute(sql, args)
        _db.commit()
        return cur.rowcount


def new_id() -> str:
    return uuid.uuid4().hex


def now() -> float:
    return time.time()


def dumps(v) -> str:
    return json.dumps(v, ensure_ascii=False)


# ---------- 文件 ----------

def user_dir(uid: str, *parts: str) -> str:
    path = os.path.join(DATA, "users", uid, *parts)
    os.makedirs(os.path.dirname(path) if parts else path, exist_ok=True)
    return path


def write(path: str, data: bytes) -> str:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(data)
    return path


def read(path: str) -> bytes:
    with open(path, "rb") as f:
        return f.read()


def rel(path: str) -> str:
    return os.path.relpath(path, DATA)


# ---------- 档案照片加密 ----------

def _fernet() -> Fernet:
    key = os.getenv("ECHO_PHOTO_KEY")
    if not key:
        key_path = os.path.join(DATA, ".photo.key")
        if not os.path.exists(key_path):
            with open(key_path, "wb") as f:
                f.write(Fernet.generate_key())
            os.chmod(key_path, 0o600)
        key = read(key_path).decode()
    return Fernet(key.encode() if isinstance(key, str) else key)


def save_photo(uid: str, data: bytes) -> str:
    return write(user_dir(uid, "photos", new_id() + ".enc"), _fernet().encrypt(data))


def load_photo(path: str) -> bytes:
    return _fernet().decrypt(read(path))


def delete_photos(uid: str) -> None:
    shutil.rmtree(user_dir(uid, "photos"), ignore_errors=True)
    ex("UPDATE user_photos SET path=NULL WHERE user_id=?", uid)
    ex("UPDATE users SET photos_deleted=1 WHERE id=?", uid)


def sweep_expired_photos() -> int:
    """档案照片最多保留 7 天，到期的直接删掉。"""
    expired = q("SELECT DISTINCT user_id FROM user_photos WHERE path IS NOT NULL AND expires_at < ?", now())
    for row in expired:
        delete_photos(row["user_id"])
    return len(expired)


def delete_user(uid: str) -> None:
    shutil.rmtree(os.path.join(DATA, "users", uid), ignore_errors=True)
    for table, col in (("user_photos", "user_id"), ("character_sheets", "user_id"), ("sprites", "owner"),
                       ("worlds", "user_id"), ("users", "id")):
        ex(f"DELETE FROM {table} WHERE {col}=?", uid)
    # 生图记录只留成本，不再关联到这个用户
    ex("UPDATE image_jobs SET owner='deleted', target='deleted' WHERE owner=?", uid)


# ---------- 预制素材 ----------

def style_refs(n: int = 2) -> list[bytes]:
    """assets/style/ 下美术挑过的风格参考图，按文件名排序取前 n 张。"""
    folder = os.path.join(ASSETS, "style")
    if not os.path.isdir(folder):
        return []
    files = sorted(f for f in os.listdir(folder) if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp")))
    return [read(os.path.join(folder, f)) for f in files[:n]]


def load_world() -> dict:
    with open(os.path.join(BASE, "content", "world.json"), encoding="utf-8") as f:
        return json.load(f)
