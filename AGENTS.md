# 给协作 AI 的说明

## 画风（定稿）
- 地图：**写实俯瞰**（三国群英传8 式）。单张草底 + 明暗斑、软边踩踏草径、密集灌木/草丛、树林、苔石地标、深蓝河带白浪沫、宽浅滩、木桥；可选湿泥地。不要加长影子、空气雾、河石。
- 人物与武器：保持像素，但要细（与地图精细度匹配）。主角为“细像素 B”：白 T 恤、黑短裤。
- 旧画风（水墨、粗像素地图）已移除。

## 尺寸与坐标
- 逻辑画布 480×300，渲染 960×600（HD=2）；世界 3200×3200 逻辑像素，分区：西凉(西北)、幽州·塞外(东北雪原)、北方草原、中原(出生点 1500,1750)、蜀(西南)、江南(东南，河口入海)。地面是 2×2 分块 assets/map/g{x}{y}.jpg（每块 1600 逻辑像素），区域名查 world.json 的 rmap/rnames。
- 主角高约 25 逻辑像素；精灵脚底为锚点，按 y 排序绘制。
- coll.png：R=1 深水/阻挡，R=2 浅滩/水洼（减速 ×0.55）。树、石底部有圆形碰撞（coll_r）。

## 武器对齐
- 每帧记录手（拳）坐标 fists 与方向 d；武器握点对齐拳坐标，沿 d 旋转。
- 细像素 B 的武器随朝向左右镜像；长柄背在身后，弓/法器按 hmeta 配置。
- 详见 data/characters.json 的 hmeta 与 src/main.js 中 B 的武器绘制段。

## 战斗表现（定稿）
- 所有人物不再有全身攻击动画：身体只有待机/走路，武器是独立图，自己做挥砍/突刺/射击。骑马同理。
- 旧的 hero_old 攻击帧（劈/横扫/撩）已废弃，仅留存档。
- 出图提示词见 docs/ART_PROMPTS.md。

## 当前主角（步行）
- `art_src/characters/hero_walk8.png`：8 帧（2 待机 + 6 走路，朝右）；`tools/slice_walk.py` 切成 `assets/characters/hero_b/w0..w7.png`，并量出前/后手位置写入 `data/characters.json` 的 `grip`。绿发版 `g_w*.png` 由 `tools/recolor_hair.py` 生成。
- 不再出劈/砸/抬手等全身攻击帧。

## 女主（多发型）
- `art_src/characters/heroine_5styles.png`：5 行 × 9 帧（前2待机 + 后7走路）。`tools/slice_heroine.py` 切成 `assets/characters/heroine/r{行}_w{帧}.png` 并写 `data/heroine.json`（含前/后手位置）。
- 行：0 长直发（当前默认女主）、1 短发、2 卷发、3 红发带、3、4 行（红发带、丸子头）来自后补的 `heroine_rows_3_4.png`，用 `python3 tools/slice_heroine.py art_src/characters/heroine_rows_3_4.png 3` 覆盖。以后换发型/玩家自定义外观走这个结构。
- 女主暂无专属骑手，骑马时沿用男骑手。

## 待重做美术（用户出图）
主角 B 走路 6–8 帧（左右腿交替）、劈/横扫/撩、受击/倒地/起身、各握法；武器细像素重绘；黄巾 12 帧 × 多兵种。

## 重新生成地图
`tools/build_world.sh` → `tools/build_map.py`：旧的西凉/雪原/江南块从 art_src/build/legacy_*（扩图前成品）整块平移保留，其余区域按规则生成；主河在新区域接上；物件统一摆放（按素材实际宽度算间距、禁放水边/出生点），最后打印重叠数和未使用素材，并输出 art_src/build/preview_map.png、preview_objs.png。

## 协作规则（第一次接手先读这里）
1. 运行：`python3 -m http.server 8000`，打开 http://localhost:8000 ，能看到地图、人物、可操作即正常。
2. 只改你被分配的任务涉及的文件；不要重新生成或改动 `assets/map/`、`data/world.json`（地图已定稿）。
3. 游戏逻辑都在 `src/main.js`；人物/武器素材清单在 `data/characters.json`，骑马数据在 `data/ride.json`。
4. 接入新美术：把 PNG 放进 `assets/characters/...`，在 `data/*.json` 登记路径和尺寸，再在 `src/main.js` 里引用；保持 脚底锚点、画布大小 与旧图一致。
5. 改完只做基本检查：页面能打开、控制台无报错、能走动。不需要写大量测试。
6. 一次提交只做一件事，提交信息用中文，直接推到 `main`（Netlify 会自动部署）。

## 精灵轮廓统一（细而黑，和女主一致）
- 男主、骑马（马和骑手）、全部怪物的精灵在切图后要跑一次 `python3 tools/outline.py`（原地描一圈近黑细轮廓，不改尺寸和锚点）。
- 女主精灵不处理。重新运行 `slice_*.py` 会覆盖为未描边版本，切完必须再跑一次 outline.py。
- 新增兵种、新角色同样适用。

## 男主多发型
- `art_src/characters/hero_walk_4styles.png`：4 行 × 8 帧（前2待机 + 后6走路）：光头、军人短寸、古代束发髻、高马尾。`python3 tools/slice_hero_m.py art_src/characters/hero_walk_4styles.png` 切成 `assets/characters/hero_m/r{行}_w{帧}.png` 并写 `data/hero_m.json`（含前/后手位置），再跑 `tools/outline.py`。
- 身体大小按白 T 与默认男主 hero_b 对齐；游戏里选中某个发型才下载那一套。默认男主（乱发）仍是 hero_b。
- 男主发型的骑马版（`art_src/characters/riders/rider_male_5styles.png`）和女主骑手暂未接入。
