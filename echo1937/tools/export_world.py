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
