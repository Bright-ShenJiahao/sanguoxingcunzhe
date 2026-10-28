#!/usr/bin/env bash
# 重新生成地图（需要 python3 + numpy + opencv-python + pillow）
# 世界 3200x3200：旧的西凉/雪原/江南块来自 art_src/build/legacy_*（扩图前的成品，整块保留），
# 其余区域由 build_map.py 生成。旧流水线 build_world/build_snow/build_mountain 只在需要重做旧块时再跑。
set -e
cd "$(dirname "$0")/.."
python3 tools/build_map.py
