"""生成常驻角色的设定图和动作包。

  python -m tools.residents sheet mae eli      # 先生成设定图（不带参数 = 全部 5 人），每次运行生成一张新候选
  python -m tools.residents pack mae           # 用 assets/residents/mae/sheet.png 生成 16 个动作
  python -m tools.residents pack mae --poses stand,walk

设定图候选写到 assets/residents/<id>/sheet_candidates/，美术挑一张复制为 assets/residents/<id>/sheet.png 再生成动作包。
动作图写到 assets/residents/<id>/<pose>.png，锚点等元数据写到同目录的 sprites.json。
"""
import argparse
import asyncio
import json
import os
import time

import onboard as ob
import store

RESIDENTS = {r["id"]: r for r in ob.WORLD["residents"]}


def folder(rid: str, *parts: str) -> str:
    path = os.path.join(store.ASSETS, "residents", rid, *parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path


async def make_sheet(rid: str):
    res = await ob.make_sheet(ob.resident_sheet_prompt(RESIDENTS[rid]), [], f"resident-{rid}")
    path = store.write(folder(rid, "sheet_candidates", f"{int(time.time())}.png"), res.data)
    print(f"{rid}: 设定图候选 → {os.path.relpath(path, store.BASE)}")
    return res.cost or 0


async def make_pack(rid: str, poses: list[str], sem: asyncio.Semaphore):
    sheet_path = folder(rid, "sheet.png")
    if not os.path.exists(sheet_path):
        print(f"{rid}: 缺少 {os.path.relpath(sheet_path, store.BASE)}，请先挑一张设定图")
        return 0
    sheet = store.read(sheet_path)
    meta_path = folder(rid, "sprites.json")
    meta = json.load(open(meta_path, encoding="utf-8")) if os.path.exists(meta_path) else {}

    async def one(pose):
        async with sem:
            try:
                out = await ob.make_sprite(sheet, None, pose, RESIDENTS[rid]["outfit_en"], f"{rid}-{pose}")
            except Exception as e:
                print(f"{rid}/{pose}: 失败 {e}")
                return 0
        store.write(folder(rid, f"{pose}.png"), out["png"])
        store.write(folder(rid, "raw", f"{pose}.png"), out["raw"])
        meta[pose] = {**out["meta"], "status": out["status"], "qc": out["qc"]}
        flag = "" if out["status"] == "ready" else f"  ⚠ {'；'.join(out['qc']['issues'])}"
        print(f"{rid}/{pose}: {out['status']}{flag}")
        return out["cost"]

    cost = sum(await asyncio.gather(*(one(p) for p in poses)))
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    return cost


async def main(args):
    ids = args.ids or list(RESIDENTS)
    unknown = [i for i in ids if i not in RESIDENTS]
    if unknown:
        raise SystemExit(f"没有这些角色：{unknown}，可选：{list(RESIDENTS)}")
    if args.cmd == "sheet":
        cost = sum(await asyncio.gather(*(make_sheet(i) for i in ids)))
    else:
        poses = args.poses.split(",") if args.poses else list(ob.POSES)
        bad = [p for p in poses if p not in ob.POSES]
        if bad:
            raise SystemExit(f"没有这些动作：{bad}")
        sem = asyncio.Semaphore(3)
        cost = 0
        for rid in ids:
            cost += await make_pack(rid, poses, sem)
    print(f"\n约花费 ${cost:.3f}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["sheet", "pack"])
    ap.add_argument("ids", nargs="*")
    ap.add_argument("--poses", default="")
    asyncio.run(main(ap.parse_args()))
