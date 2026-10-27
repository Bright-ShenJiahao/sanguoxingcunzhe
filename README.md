# 三国幸存者（sanguoxingcunzhe）

三国题材割草 / 幸存者类 roguelike，网页版（纯静态，无需服务器）。

## 本地运行
```
python3 -m http.server 8000   # 然后打开 http://localhost:8000
```
页面用 fetch 读取 data/*.json，需要 http 服务，不能直接双击 index.html。

## 部署
GitHub Pages：Settings → Pages → Branch: main / root。

## 目录
- `index.html` `src/main.js` 游戏页与逻辑（480×300 逻辑画布，2 倍渲染）
- `data/world.json` 地图物件、尺寸、碰撞半径；`data/characters.json` 人物/武器素材清单与对齐数据
- `assets/map/` 写实俯瞰地图成品（草地/湿泥地底图、碰撞图、物件精灵）
- `assets/characters/` 主角（旧版 hero_old、细像素 hero_b）、黄巾（enemies_old）、武器
- `assets/weapons/` 40 件武器原始 PNG
- `art_src/` 美术原始图（地图素材表、人物旧资源）
- `tools/build_world.sh` 由 art_src/map 重新生成世界（需 numpy、opencv-python、pillow）
- `docs/` 设计文档

协作约定见 `AGENTS.md`。
