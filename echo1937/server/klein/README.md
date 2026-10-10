# klein 融合服务（阿里云 GPU 自部署）

把 fal 上的 klein 融合搬到自己的 GPU 机器上，省掉 fal 排队和跨境网络。网页那边只把请求地址换成这台机器。

| 文件 | 作用 |
|---|---|
| `setup.sh` | 装 Python 环境、PyTorch、diffusers（阿里云 pip 镜像） |
| `download.py` | 下载权重到 `models/<名字>/`，先试魔搭再试 hf-mirror |
| `bench.py` | 在机器上测纯模型耗时（不含网络） |
| `server.py` | HTTP 服务，端口 8000，返回格式和 fal 一样 |
| `fuser.py` | 两者共用的核心：模型常驻显存、提示词编码缓存、文字长度裁短 |

## 步骤（root 用户）

```bash
cd /root/klein
bash setup.sh                          # 约 5 分钟
. .venv/bin/activate
python download.py 9b                  # 约 35GB
python bench.py --model 9b             # bf16 基准
python bench.py --model 9b --fp8       # FP8，看能快多少
python server.py --model 9b            # 开服务；终端会打印口令
```

后台常驻：`nohup python server.py --model 9b > server.log 2>&1 &`，看日志 `tail -f server.log`。

在自己电脑上检查：`curl http://<公网IP>:8000/health`。安全组要放行 TCP 8000，来源最好只填自己的公网 IP。

## 许可

klein 9B 是 FLUX 非商用许可，只能用来测试；商用要向 BFL 买授权，或者换 Apache 2.0 的 klein 4B（`python download.py 4b`）。

## 接到城市模拟页

`web/sim.html` 的配图栏：融合模型选「阿里云自部署 klein」，填 `http://<公网IP>:8000` 和服务口令（只存在本机浏览器），点「测连接」看网络来回和服务端模型。每格的说明里会写上传、服务端、纯模型、下载各花多久。

KV 版（`python download.py 9b-kv`，目录名带 kv 时自动用 KV 管线）：拼接图和参考图只在第 1 步算一次。
