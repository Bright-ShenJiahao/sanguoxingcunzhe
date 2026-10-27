#!/usr/bin/env bash
# 重新生成写实俯瞰地图（需要 python3 + numpy + opencv-python + pillow）
# 先生成湿泥地地面，再生成草地地面 + 地图物件 + 碰撞图
set -e
cd "$(dirname "$0")/.."
MODE=mud python3 tools/build_world.py
python3 tools/build_world.py
