"""生成风格参考图候选：python -m tools.style_refs [--n 8]

第一张只按文字生成，之后的每一张都以第一张为参考，保证画风一致。
结果写到 assets/style/candidates/，美术挑出 6–8 张满意的，复制到 assets/style/。
生图时按文件名排序取前 2 张（动作图取第 1 张），所以把最能代表画风的命名为 01、02。
"""
import argparse
import asyncio
import os

import ai
import store

WORLD = store.load_world()


def prompt(subject: str) -> str:
    return (f"A single illustration that defines the art style for a vertical webtoon set in Los Angeles, 1937. "
            f"Style: {WORLD['style']['prompt_en']}. Subject: {subject}. No text, no logos, no real brand names.")


async def main(n: int):
    out_dir = os.path.join(store.ASSETS, "style", "candidates")
    os.makedirs(out_dir, exist_ok=True)
    subjects = WORLD["style"]["reference_subjects_en"][:n]
    first = await ai.generate_image([prompt(subjects[0])], "4:5", mock_label="style-1")
    store.write(os.path.join(out_dir, "01.png"), first.data)
    print(f"01.png  {subjects[0][:60]}…")
    cost = first.cost or 0

    async def one(i, subject):
        res = await ai.generate_image([prompt(subject) + " Match the art style of the reference image exactly.",
                                       "Style reference:", first.data], "4:5", mock_label=f"style-{i}")
        store.write(os.path.join(out_dir, f"{i:02d}.png"), res.data)
        print(f"{i:02d}.png  {subject[:60]}…")
        return res.cost or 0

    cost += sum(await asyncio.gather(*(one(i, s) for i, s in enumerate(subjects[1:], 2))))
    print(f"\n完成：{out_dir}\n约花费 ${cost:.3f}。挑出满意的复制到 assets/style/。")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=8)
    asyncio.run(main(ap.parse_args().n))
