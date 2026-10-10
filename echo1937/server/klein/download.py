"""下载 klein 权重到 models/<名字>/。先试魔搭（国内快），不行再走 hf-mirror。

  python download.py 9b
  python download.py 4b
  python download.py 9b-kv
  python download.py 9b --repo 某个组织/某个模型名     # 自己指定仓库

9B 是非商用许可。hf-mirror 走 Hugging Face 的授权：要先在 HF 网页上同意许可，
再在本机终端里 export HF_TOKEN=...（只在这台机器上设，不要发给别人）。
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPOS = {
    "9b": ["black-forest-labs/FLUX.2-klein-9B"],
    "4b": ["black-forest-labs/FLUX.2-klein-4B"],
    "9b-kv": ["black-forest-labs/FLUX.2-klein-9b-kv", "black-forest-labs/FLUX.2-klein-9B-kv"],
}


def ok(path):
    return os.path.exists(os.path.join(path, "model_index.json"))


def from_modelscope(repo, path):
    from modelscope import snapshot_download
    snapshot_download(repo, local_dir=path)


def from_hf_mirror(repo, path):
    os.environ.setdefault("HF_ENDPOINT", "https://hf-mirror.com")
    from huggingface_hub import snapshot_download
    snapshot_download(repo, local_dir=path, token=os.environ.get("HF_TOKEN"))


def main():
    name = sys.argv[1] if len(sys.argv) > 1 else "9b"
    repos = [sys.argv[sys.argv.index("--repo") + 1]] if "--repo" in sys.argv else REPOS.get(name, [])
    path = os.path.join(HERE, "models", name)
    if ok(path):
        print(f"已经有了：{path}")
        return
    for repo in repos:
        for src, fn in (("魔搭", from_modelscope), ("hf-mirror", from_hf_mirror)):
            print(f"\n== 从{src}下载 {repo} → {path}", flush=True)
            try:
                fn(repo, path)
            except Exception as e:
                print(f"   失败：{type(e).__name__}: {str(e)[:300]}")
                continue
            if ok(path):
                print(f"\n下载完成：{path}")
                os.system(f"du -sh {path}")
                return
            print("   下完了但没有 model_index.json，可能不是 diffusers 格式")
    print("\n都没下到。把上面的报错截图发我；也可以在魔搭网站搜 FLUX.2-klein 找到仓库名，"
          "用 --repo 指定。")
    sys.exit(1)


if __name__ == "__main__":
    main()
