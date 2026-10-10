#!/usr/bin/env bash
# 在阿里云 GPU 机器上装环境（Ubuntu 22.04 + NVIDIA 驱动已装好）。用 root 跑：bash setup.sh
set -e
cd "$(dirname "$0")"

echo "== 显卡"
nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv

echo "== 系统包"
# 不让 apt 装完后去重启系统服务（Ubuntu 的 needrestart 会卡在这里）
export NEEDRESTART_SUSPEND=1 DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq python3-venv python3-pip > /dev/null

echo "== Python 虚拟环境 .venv"
python3 -m venv .venv
. .venv/bin/activate
# 阿里云 ECS 内网镜像不走公网带宽，快很多；不在阿里云上就用公网镜像。不加 -q，能看到下载进度
if curl -s -m 5 -o /dev/null http://mirrors.cloud.aliyuncs.com/pypi/simple/pip/; then
  PIP="pip install -i http://mirrors.cloud.aliyuncs.com/pypi/simple/ --trusted-host mirrors.cloud.aliyuncs.com"
else
  PIP="pip install -i https://mirrors.aliyun.com/pypi/simple/"
fi
$PIP -U pip
# PyPI 上的 Linux 版 torch 自带 CUDA 12.8 运行库，不用另外装 CUDA
$PIP torch
$PIP "diffusers>=0.41" transformers accelerate safetensors sentencepiece \
     modelscope huggingface_hub fastapi "uvicorn[standard]" pillow numpy anyio
# FP8 量化用，装不上不影响 bf16
$PIP torchao || echo "torchao 没装上，--fp8 用不了，其余不受影响"

python - <<'EOF'
import torch, diffusers
print("torch", torch.__version__, "CUDA", torch.version.cuda, "可用", torch.cuda.is_available(), torch.cuda.get_device_name(0))
print("diffusers", diffusers.__version__)
from diffusers import Flux2KleinPipeline
print("Flux2KleinPipeline OK")
EOF
echo "== 装好了。下一步：. .venv/bin/activate && python download.py 9b"
