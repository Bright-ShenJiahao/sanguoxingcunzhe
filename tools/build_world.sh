#!/usr/bin/env bash
# 重新生成地图（需要 python3 + numpy + opencv-python + pillow）
# 1) 草地区 -> art_src/build/   2) 北部雪地 + 拼接 -> assets/map/ground.jpg、coll.png、data/world.json
set -e
cd "$(dirname "$0")/.."
python3 tools/build_world.py
python3 tools/build_snow.py
python3 tools/build_mountain.py
