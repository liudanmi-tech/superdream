import asyncio
import os
import traceback

import ai
import onboard
import store

HANDLERS = {"sheet": onboard.handle_sheet, "sprite": onboard.handle_sprite}
CONCURRENCY = int(os.getenv("ECHO_IMAGE_CONCURRENCY", "3"))
_tasks: list[asyncio.Task] = []
_wake = asyncio.Event()


def enqueue(kind: str, owner: str, target: str, priority: int) -> str | None:
    """同一个对象已经在排队或生成中时不重复投递。"""
    busy = store.q1("SELECT id FROM image_jobs WHERE kind=? AND owner=? AND target=? AND status IN ('queued','running')",
                    kind, owner, target)
    if busy:
        return None
    jid = store.new_id()
    store.ex("""INSERT INTO image_jobs (id, kind, owner, target, model, status, priority, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 'queued', ?, ?, ?)""",
             jid, kind, owner, target, ai.IMAGE_MODEL, priority, store.now(), store.now())
    _wake.set()
    return jid


def _claim() -> dict | None:
    with store._lock:
        row = store._db.execute("SELECT * FROM image_jobs WHERE status='queued' "
                                "ORDER BY priority DESC, created_at LIMIT 1").fetchone()
        if not row:
            return None
        store._db.execute("UPDATE image_jobs SET status='running', attempts=attempts+1, updated_at=? WHERE id=?",
                          (store.now(), row["id"]))
        store._db.commit()
        return dict(row)


async def _worker(n: int):
    while True:
        job = _claim()
        if not job:
            _wake.clear()
            try:
                await asyncio.wait_for(_wake.wait(), timeout=2)
            except asyncio.TimeoutError:
                pass
            continue
        try:
            cost = await HANDLERS[job["kind"]](job)
            store.ex("UPDATE image_jobs SET status='done', cost_usd=?, updated_at=? WHERE id=?",
                     cost, store.now(), job["id"])
        except Exception as e:
            traceback.print_exc()
            msg = f"{type(e).__name__}: {e}"[:500]
            store.ex("UPDATE image_jobs SET status='failed', error=?, updated_at=? WHERE id=?",
                     msg, store.now(), job["id"])
            onboard.on_job_failed(job, msg)


def start():
    # 进程重启时，上次没跑完的任务重新排队
    store.ex("UPDATE image_jobs SET status='queued' WHERE status='running'")
    store.ex("UPDATE sprites SET status='queued' WHERE status='generating'")
    store.ex("UPDATE character_sheets SET status='queued' WHERE status='generating'")
    for n in range(CONCURRENCY):
        _tasks.append(asyncio.create_task(_worker(n)))


async def stop():
    for t in _tasks:
        t.cancel()
    await asyncio.gather(*_tasks, return_exceptions=True)
    _tasks.clear()


def total_cost(owner: str | None = None) -> float:
    row = store.q1("SELECT COALESCE(SUM(cost_usd), 0) c FROM image_jobs" + (" WHERE owner=?" if owner else ""),
                   *([owner] if owner else []))
    return round(row["c"], 4)
