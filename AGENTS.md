# 给协作 AI 的说明

## 画风（定稿）
- 地图：**写实俯瞰**（三国群英传8 式）。单张草底 + 明暗斑、软边踩踏草径、密集灌木/草丛、树林、苔石地标、深蓝河带白浪沫、宽浅滩、木桥；可选湿泥地。不要加长影子、空气雾、河石。
- 人物与武器：保持像素，但要细（与地图精细度匹配）。主角为“细像素 B”：白 T 恤、黑短裤。
- 旧画风（水墨、粗像素地图）已移除。

## 尺寸与坐标
- 逻辑画布 480×300，渲染 960×600（HD=2）；当前关卡「翠绿之地」3100×1290（tools/rebuild_nature.py 在 3200×1600 底稿上重画河/植被/桥后，裁掉上 100、左 100、y≥1390 的部分；world.json 的 off=[100,100] 记录偏移。art_src/map/*.json 里的用户标注都是裁前坐标；之后在调试全图里画的线是裁后坐标，用时要加 off。底稿由 tools/build_stage.py 从完整大地图 art_src/build/full/ 切出南半边：迷雾森林/翠绿平原/水乡湿地，北边密林封边）；完整三国大地图存档在分支 archive/map-sanguo-3200。原大地图：世界 3200×3200 逻辑像素，分区：西凉(西北)、幽州·塞外(东北雪原)、北方草原、中原(出生点 1500,1750)、蜀(西南)、江南(东南，河口入海)。地面是 2×2 分块 assets/map/g{x}{y}.jpg（每块 1600 逻辑像素），区域名查 world.json 的 rmap/rnames。
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
（当前设定：异世界幸存者；敌人为哥布林，`tools/slice_goblins.py` 切图；黄巾兵素材保留不用。）

## 重新生成地图
- 当前第一关：`python3 tools/rebuild_nature.py`（读 art_src/build/stage_old/ 底稿 + art_src/map/ 下的标注：shallows/bridges/edits/water_paint/mountain_paths.json），输出 assets/map 与 data/world.json。
- 寻路：src/pathing.js（全图流场，能直视主角就直线追，隔河绕桥/浅滩，离主角两屏外卡住会挪位）。
- 调试面板：没有怪物、点地图/小地图瞬移、画笔、全图（直线/画笔/涂抹、复制坐标）。移动端虚拟摇杆在 src/main.js。

### 旧流程（三国大地图，已不用）
`tools/build_world.sh` → `tools/build_map.py`：旧的西凉/雪原/江南块从 art_src/build/legacy_*（扩图前成品）整块平移保留，其余区域按规则生成；主河在新区域接上；物件统一摆放（按素材实际宽度算间距、禁放水边/出生点），最后打印重叠数和未使用素材，并输出 art_src/build/preview_map.png、preview_objs.png。

## 协作规则（第一次接手先读这里）
1. 运行：`python3 -m http.server 8000`，打开 http://localhost:8000 ，能看到地图、人物、可操作即正常。
2. 只改你被分配的任务涉及的文件；地图由 tools/build_stage.py 生成，不要手改 `assets/map/`、`data/world.json`。
3. 游戏逻辑都在 `src/main.js`；人物/武器素材清单在 `data/characters.json`，骑马数据在 `data/ride.json`。
4. 接入新美术：把 PNG 放进 `assets/characters/...`，在 `data/*.json` 登记路径和尺寸，再在 `src/main.js` 里引用；保持 脚底锚点、画布大小 与旧图一致。
5. 改完只做基本检查：页面能打开、控制台无报错、能走动。不需要写大量测试。
6. 一次提交只做一件事，提交信息用中文。**发布流程（先试玩、确认后再上线，节省 Netlify 构建额度）**：
   - 日常改动只在本地 `git commit`，不要推 `main`。
   - 需要用户看效果时：`git push origin HEAD:preview`，给出试玩网址 `https://raw.githack.com/Bright-ShenJiahao/sanguoxingcunzhe/preview/index.html`（测试参数照常加在后面，如 `?x=1500&y=1750&weather=blizzard&hour=子`）。
   - 只有用户明确说“推送”或“上线”时才推 `main`：先 `git pull --rebase`，再 `git push`。禁止 force push。
   - netlify.toml 里设置了 `ignore`，Netlify 只构建 main，其他分支跳过。
   - 本项目是纯静态文件，不需要打包；如果以后加了打包步骤，推 preview 前必须先在本地打包并把结果一起提交（试玩网址只读仓库里的现成文件）。
   - 试玩网址没有后端：Netlify Functions（如 /api/scores 排行榜）、云存档等用不了，属正常；需要时在调试模式里用本地测试数据代替。
   - 每次交付说明三件事：改了什么、试玩网址、main 上还有几个未推送的提交。

## 精灵轮廓统一（细而黑，和女主一致）
- 男主、骑马（马和骑手）、全部怪物的精灵在切图后要跑一次 `python3 tools/outline.py`（原地描一圈近黑细轮廓，不改尺寸和锚点）。
- 女主精灵不处理。重新运行 `slice_*.py` 会覆盖为未描边版本，切完必须再跑一次 outline.py。
- 新增兵种、新角色同样适用。

## 男主多发型
- `art_src/characters/hero_walk_4styles.png`：4 行 × 8 帧（前2待机 + 后6走路）：光头、军人短寸、古代束发髻、高马尾。`python3 tools/slice_hero_m.py art_src/characters/hero_walk_4styles.png` 切成 `assets/characters/hero_m/r{行}_w{帧}.png` 并写 `data/hero_m.json`（含前/后手位置），再跑 `tools/outline.py`。
- 身体大小按白 T 与默认男主 hero_b 对齐；游戏里选中某个发型才下载那一套。默认男主（乱发）仍是 hero_b。
- 男主发型的骑马版（`art_src/characters/riders/rider_male_5styles.png`）和女主骑手暂未接入。
- 注意：assets/map/sprites 里的 wreed/wcat 已缩到 0.55 倍、fdock ×1.7、wlog ×1.5（直接改的成品图）；重跑 build_mountain.py 会覆盖回原尺寸。

## 设定与界面（当前）
- 游戏名：异世界幸存者 · 无名之辈外传。设计总表见 docs/GAME_DESIGN.md。
- 敌人：哥布林小兵/刀手/弓手/盾兵，精英萨满，10 分钟 Boss 哥布林大王（data/enemies.json，role 字段）。
- 局内成长在 src/run.js；主菜单与备战/选关在 src/menu.js；加载动画在 index.html（卧室 assets/ui/bedroom.jpg、坐姿 hero_b/sit0-2）。
- 主角按原图 1:1 绘制（HK=1），不要再缩放。
- 开发者面板：网址加 `?debug`，进游戏后左下角出现（src/debug.js）：无敌、回血、升级、全满级、跳时间/到 Boss、清屏、传送、天气、时辰。
