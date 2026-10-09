"""把 content/world.json 导出成纯前端页面用的 web/world.js：python -m tools.export_world

直接双击打开的 html 不能读取同目录的 json，但可以用 <script> 加载 js 文件。改了 world.json 后运行一次。
"""
import json
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

with open(os.path.join(BASE, "content", "world.json"), encoding="utf-8") as f:
    world = json.load(f)
with open(os.path.join(BASE, "web", "world.js"), "w", encoding="utf-8") as f:
    f.write("// 由 python -m tools.export_world 从 content/world.json 生成，请改 world.json 后重新导出\n")
    f.write("window.WORLD = " + json.dumps(world, ensure_ascii=False, indent=1) + ";\n")
print("已导出 web/world.js")

# 第二版（城市模拟）的规则和故事卡：web/sim_data.js
def _load(name):
    with open(os.path.join(BASE, "content", name), encoding="utf-8") as f:
        return json.load(f)

story = {"items": {}, "quests": [], "cards": []}
for name in sorted(os.listdir(os.path.join(BASE, "content"))):
    if name.startswith("story_") and name.endswith(".json"):
        part = _load(name)
        story["items"].update(part.get("items", {}))
        story["quests"] += part.get("quests", [])
        story["cards"] += part.get("cards", [])
ids = [c["id"] for c in story["cards"]]
dup = sorted({i for i in ids if ids.count(i) > 1})
if dup:
    raise SystemExit("故事卡 id 重复：" + ", ".join(dup))
with open(os.path.join(BASE, "web", "sim_data.js"), "w", encoding="utf-8") as f:
    f.write("// 由 python -m tools.export_world 从 content/sim.json 和 content/story_*.json 生成，请改 content 下的文件后重新导出\n")
    f.write("window.SIM = " + json.dumps(_load("sim.json"), ensure_ascii=False, indent=1) + ";\n")
    f.write("window.STORY = " + json.dumps(story, ensure_ascii=False, indent=1) + ";\n")
print(f"已导出 web/sim_data.js（故事卡 {len(story['cards'])} 张，任务 {len(story['quests'])} 个）")
