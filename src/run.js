// 局内成长（最小可玩版）：经验珠 → 升级三选一（大类卡点开再选）→ 多把武器自动攻击；被动；刷怪节奏；精英与 Boss。
// 设计见 docs/GAME_DESIGN.md。伤害单位 = 敌人血量单位（棍兵基础 2 点）。
const R=(a,b)=>a+Math.random()*(b-a);
const CATS={own:{name:'专属',ws:[]},blade:{name:'近战',ws:[]},pole:{name:'长柄',ws:[]},bow:{name:'远程',ws:[]},throw:{name:'投掷',ws:[]},spell:{name:'法术',ws:[]}};
const WEAPONS={
 sword:{name:'长剑',cat:'blade',img:'ui:w_sword',desc:['朝最近敌人那侧挥砍','伤害提升，前后各砍一刀','范围变大，攻速提升','伤害提升','【进阶】三连斩，范围、伤害大增']},
 hammer:{name:'战锤',cat:'blade',img:'ui:w_hammer',desc:['朝最近敌人那侧落锤，震圈击退','震圈变大','间隔缩短','一次砸两锤','【进阶】伤害大增，余震再震一次']},
 axe:{name:'飞斧',cat:'blade',img:'ui:w_axe',desc:['朝最近敌人那侧抛出飞斧，20% 暴击（双倍）','暴击率 30%，伤害提升','暴击伤害 ×2.5，间隔缩短','一次 2 把，暴击率 40%','【进阶】飞得更远，暴击伤害 ×3']},
 bow:{name:'长弓',cat:'bow',img:null,desc:['朝最近的敌人射箭，射程远','一次 2 支，伤害提升','一次 3 支，穿透 1 个','伤害提升','【进阶】一次 4 支，箭贯穿所有敌人']},
 xbow:{name:'连发弩',cat:'bow',img:null,desc:['对最近的敌人连射 3 支弩箭','连射 5 支','伤害提升，间隔缩短','连射 7 支','【进阶】连射 9 支，弩箭穿透 1 个']}};
const PASSIVES={
 atk:{name:'力量',desc:'物理伤害 +10%',max:5},arc:{name:'奥义',desc:'法术伤害 +10%',max:5},
 hp:{name:'活力',desc:'生命上限 +20，并回复 20',max:5},
 spd:{name:'迅捷',desc:'移动速度 +8%',max:5},
 cd:{name:'急速',desc:'攻击间隔 −6%',max:5},area:{name:'扩展',desc:'攻击范围 +10%',max:5},amt:{name:'多重',desc:'投射物 +1',max:2},
 regen:{name:'再生',desc:'每秒回复 0.3 生命',max:5},armor:{name:'护甲',desc:'受到伤害 −5%',max:5},luck:{name:'幸运',desc:'宝箱更丰厚，金币、磁铁掉落更多',max:5},crit:{name:'暴击',desc:'暴击率 +5%',max:5},critd:{name:'暴击伤害',desc:'暴击倍率 +0.2（基础 ×2）',max:5},
 wis:{name:'智慧',desc:'经验获取 +8%',max:5},dur:{name:'恒久',desc:'减速等效果持续 +15%',max:5},pspd:{name:'疾矢',desc:'投射物速度、射程 +15%',max:5},
 vamp:{name:'吸血',desc:'近战伤害的 2% 转为生命',max:5},greed:{name:'贪婪',desc:'金币 +10%',max:5},curse:{name:'诅咒',desc:'敌人数量、血量 +10%，经验 +10%',max:5},
 dodge:{name:'闪避',desc:'5% 概率完全躲开一次伤害',max:5},tough:{name:'坚韧',desc:'受伤后无敌时间 +0.2 秒',max:3},svamp:{name:'法术吸血',desc:'法术伤害的 1.5% 转为生命',max:5},rev:{name:'复苏',desc:'本局死亡时复活一次（回复一半生命）',max:1},
 berserk:{name:'狂暴',desc:'生命越低伤害越高，每级最多 +8%',max:5},exec:{name:'处决',desc:'小怪血量低于 2% 时直接击杀（每级 +2%）',max:5},hunt:{name:'猎王',desc:'对精英和 Boss 伤害 +5%',max:3},
 knock:{name:'击退',desc:'攻击击退距离 +25%',max:3},boom:{name:'连锁爆破',desc:'击杀时 4% 概率小范围爆炸',max:5},mag:{name:'磁力',desc:'拾取范围 +25%',max:5},gamble:{name:'豪赌',desc:'伤害在 70%～130% 之间浮动，每级上限再 +10%',max:3}};
export {WEAPONS,PASSIVES,WIC,PIC};
export const PASS_KEYS=Object.keys(PASSIVES);
WEAPONS.fireball={name:'火球术',cat:'spell',img:null,desc:['朝怪最密处丢火球，落地爆炸','爆炸范围变大','一次 2 颗，间隔缩短','伤害提升','【进阶】一次 3 颗，爆炸范围大增']};
WEAPONS.chain={name:'闪电链',cat:'spell',img:null,desc:['随机劈中敌人，弹跳 2 次；减速的敌人受伤翻倍','弹跳 3 次，伤害提升','弹跳 5 次，间隔缩短','伤害提升','【进阶】同时 2 道，弹跳 8 次']};
WEAPONS.frost={name:'冰霜新星',cat:'spell',img:null,desc:['朝随机敌人射出 2 根冰锥，命中处减速 50%','3 根冰锥，伤害提升','减速更久，间隔缩短','4 根冰锥','【进阶】5 根冰锥，命中时碎裂溅射']};
WEAPONS.missile={name:'魔法飞弹',cat:'spell',img:null,desc:['发射 2 颗追踪飞弹','一次 3 颗','一次 4 颗，间隔缩短','伤害提升','【进阶】一次 7 颗']};
WEAPONS.thunder={name:'雷霆',cat:'spell',img:null,desc:['随机落下 2 道雷，小范围伤害','3 道雷，伤害提升','4 道雷，间隔缩短','6 道雷','【进阶】8 道雷，每 4 轮落下一道天罚巨雷']};
for(const k in WEAPONS){const c=WEAPONS[k].cat;if(CATS[c])CATS[c].ws.push(k)}
export const POOL={w:Object.keys(WEAPONS).filter(k=>!['spell','own'].includes(WEAPONS[k].cat)),s:Object.keys(WEAPONS).filter(k=>WEAPONS[k].cat==='spell')};
// 角色专属武器（不进公共卡池）
WEAPONS.gb={name:'掌机',cat:'own',img:'gear/gb',own:1,desc:['光弹射向最近的敌人，打中弹到下一只','一次 2 发，伤害提升','穿透 1 个、弹 2 次，射速提升','一次 3 发','【进阶】穿透 2、弹 3 次；每 4 轮天降俄罗斯方块']};
WEAPONS.hp={name:'耳机',cat:'own',img:'gear/hp',own:1,desc:['放出声波圈，推开敌人','声波圈变大','间隔缩短，附带追踪音符','伤害提升','【进阶】音符更多；每 5 轮重低音冲击波扫全屏（3 倍伤害，击退）']};
const WV=await fetch('data/waves.json').then(r=>r.json());   // 波次表（每分钟一张）
const MAXW=3,MAXS=3,MAXP=6;   // 局内上限：公共武器 3、法术 3、被动 6（专属另算）
const UIV=new URLSearchParams(location.search).get('ui')==='blue'?'blue':'card';
const FRS='frames_';
const MAXL=5,OL=[0,1,3,5,6,8];   // 5 级制：新等级 → 旧数值档位
const WIC={sword:'ic_sword',hammer:'ic_hammer',axe:'icons_3',thunder:'ic_thunder',bow:'ic_bow',xbow:'ic_xbow',gb:'icons_0',hp:'icons_1',missile:'icons_2',axe:'icons_3',fireball:'icons_4',frost:'icons_5',chain:'icons_6',holy:'icons_7'};
const PIC={gamble:'misc_5',arc:'icons_2',crit:'b_luck',critd:'b_atk',dodge:'icons_9',tough:'b_armor',svamp:'b_vamp',rev:'icons_10',berserk:'b_curse',exec:'b_dur',hunt:'icons_3',knock:'ic_hammer',boom:'icons_4',mag:'misc_0',atk:'b_atk',hp:'icons_10',spd:'icons_9',cd:'b_cd',area:'b_area',amt:'b_amt',regen:'b_regen',armor:'b_armor',luck:'b_luck',wis:'icons_12',dur:'b_dur',pspd:'b_pspd',vamp:'b_vamp',greed:'icons_11',curse:'b_curse'};
const isSp=k=>WEAPONS[k].cat==='spell',isOwn=k=>!!WEAPONS[k].own;
function loadDeck(){let d=null;try{d=JSON.parse(localStorage.getItem('deck')||'null')}catch(e){}
 if(d&&Array.isArray(d.w)&&Array.isArray(d.s)){d.w=d.w.filter(k=>POOL.w.includes(k));d.s=d.s.filter(k=>POOL.s.includes(k));d.lock=(d.lock||[]).filter(k=>PASS_KEYS.includes(k))}
 if(!d||!Array.isArray(d.w)||d.w.length!==5||!Array.isArray(d.s)||d.s.length!==5)d={w:POOL.w.slice(0,5),s:POOL.s.slice(0,5),lock:[]};d.lock=(d.lock||[]).slice(0,4);return d}
export function createRun({hero,en,images,hitEnemy,survival,ok,makeEnemy}){
 let S;
 const ui=document.createElement('div');ui.id='lvup';ui.hidden=true;
 const st=document.createElement('style');st.textContent=`
 #lvup{position:fixed;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;background:#050c1655;font:15px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif;color:#f2f6ff}
 #lvup[hidden]{display:none}#lvup .box{width:min(560px,94vw);padding:20px 22px 16px;border:3px solid #cfe2ff;border-radius:18px;background:linear-gradient(160deg,#2a5aae99,#173a7ca6);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);box-shadow:0 8px 24px #0006}
 #lvup h2{margin:0 0 2px;text-align:center;color:#fff;font-size:30px;letter-spacing:2px;text-shadow:0 2px 0 #0008}#lvup .sub{text-align:center;color:#c9d8f0;margin-bottom:14px;font-size:15px}
 #lvup button.card{display:flex;gap:16px;align-items:center;width:100%;text-align:left;margin:10px 0;padding:14px 16px;border:2px solid #8fbbef66;border-radius:16px;background:#0d2a6388;color:#f2f6ff;font:inherit;text-shadow:0 1px 3px #000a;cursor:pointer;transition:transform .08s}
 #lvup button.card:hover,#lvup button.card:focus{border-color:#ffe08a;background:#1d4590dd;outline:none;transform:translateY(-1px)}
 #lvup .ic{flex:none;width:64px;height:64px;border-radius:12px;background:#0a1838;display:grid;place-items:center;font-weight:700;color:#f6db94;font-size:26px}
 #lvup .ic img{max-width:54px;max-height:54px;image-rendering:pixelated}
 #lvup .nm{font-weight:800;font-size:21px}#lvup .tag{display:inline-block;margin-left:10px;padding:3px 10px;border-radius:8px;font-size:13px;font-weight:700;vertical-align:3px;background:#c9d4e8;color:#1b2a48}
 #lvup .tag.new{background:#ffd23f;color:#4a2c00}#lvup .tag.sp{background:#c9a8ff;color:#2a1050}#lvup .tag.p{background:#9fe0a8;color:#0f3a1a}#lvup .tag.q{background:linear-gradient(#ffe27a,#f0a91c);color:#4a2c00}
 #lvup .d{display:block;color:#d6e2f6;font-size:15px;margin-top:5px}#lvup .slots{text-align:center;color:#9fb6d8;font-size:12px;margin-top:6px}
 #lvup .row{display:flex;gap:8px;justify-content:center;margin-top:8px}#lvup .row button{padding:9px 22px;border-radius:12px;border:2px solid #cfe2ff;background:#123063;color:#fff;font:inherit;cursor:pointer}`;
 st.textContent+=`
 #lvup .b2{position:relative;width:min(600px,96vw);display:flex;flex-direction:column;align-items:center;gap:10px;font-family:"Noto Serif CJK SC","Songti SC",serif}
 #lvup .scroll{width:min(560px,92vw);aspect-ratio:1414/264;background:url(assets/ui/buttons_0.png) center/100% 100%;display:grid;place-items:center;font-size:clamp(22px,6vw,32px);font-weight:900;color:#5a2e0e;image-rendering:pixelated}
 #lvup .b2 .sub{color:#ffe7a8;text-shadow:0 1px 3px #000;margin:0 0 14px}
 #lvup .cards{display:flex;gap:min(10px,2vw);justify-content:center;width:100%}
 #lvup button.c2{all:unset;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;width:min(200px,30vw);transition:transform .1s}
 #lvup button.c2:hover,#lvup button.c2:focus{background:none!important;border:0!important;outline:none;transform:translateY(-4px) scale(1.03);filter:drop-shadow(0 0 8px #ffd860)}
 #lvup .cn{position:absolute;top:-9%;height:8%;left:0;right:0;display:grid;place-items:center;line-height:1;color:#ffe7a8;text-shadow:0 2px 2px #000;font-weight:900;font-size:clamp(13px,3.6vw,18px);white-space:nowrap}
 #lvup .cf{position:relative;margin-top:12%;width:100%;aspect-ratio:180/290;background:center/100% 100% no-repeat}
 #lvup .nw{position:absolute;top:0;left:50%;transform:translateX(-50%);z-index:1;padding:0 5px;background:#c8323a;border-radius:3px;color:#fff;font-size:10px;font-weight:900;line-height:15px}
 #lvup .ci{position:absolute;left:26%;right:26%;top:22.5%;height:29%;display:grid;place-items:center;font-size:clamp(22px,7vw,34px);font-weight:900;color:#5a3a14}
 #lvup .ci img{max-width:55%;max-height:55%;image-rendering:pixelated}#lvup .ci img.u{position:absolute;inset:0;width:100%;height:100%;max-width:none;max-height:none;object-fit:contain;image-rendering:auto}
 #lvup .st{position:absolute;top:55%;left:0;right:0;text-align:center;color:#7a5a2a;font-size:clamp(9px,2.5vw,12px);font-weight:700}
 #lvup .cd{position:absolute;top:67%;left:22%;right:22%;bottom:15.5%;display:flex;align-items:center;justify-content:center;text-align:center;font-size:clamp(9.5px,2.6vw,13px);line-height:1.22;color:#3a2410;overflow:hidden}
 @media (max-width:640px){#lvup .cards{gap:4px}#lvup button.c2{width:32vw}#lvup .cf{aspect-ratio:180/360}#lvup .cd{left:20%;right:20%;top:66.5%;bottom:14.5%;font-size:10px;line-height:1.18}}
 #lvup .btns{display:flex;gap:10px;margin-top:4px}
 #lvup .pb{all:unset;cursor:pointer;width:min(130px,30vw);aspect-ratio:360/135;background:center/100% 100%;display:grid;place-items:center;color:#fff;font-weight:900;font-size:16px;text-shadow:0 2px #0008;image-rendering:pixelated}
 #lvup .pb.green{background-image:url(assets/ui/buttons_1.png)}#lvup .pb.gray{background-image:url(assets/ui/buttons_3.png)}#lvup .pb:disabled{filter:grayscale(1) brightness(.7);cursor:default}
 #lvup .own{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
 #lvup .sl{position:relative;cursor:help;width:40px;height:40px;background:url(assets/ui/buttons_9.png) center/100% 100%;display:grid;place-items:center;color:#f6db94;font-weight:900;image-rendering:pixelated}#lvup .sl img{max-width:24px;max-height:24px;image-rendering:pixelated}#lvup .sl b{position:absolute;right:2px;bottom:0;font:700 10px sans-serif;color:#ffd166;text-shadow:0 1px 2px #000}
 #lvup .tip{position:absolute;left:50%;bottom:58px;transform:translateX(-50%);z-index:5;pointer-events:none;box-shadow:0 4px 10px #0008;max-width:min(420px,92vw);padding:8px 12px;border:2px solid #8a5a1c;border-radius:6px;background:#f0d8a6;color:#3a2410;font-size:13px;line-height:1.45}#lvup .tip b{font-size:15px}#lvup .tip i{font-style:normal;color:#8a5a1c;font-weight:700}`;
 st.textContent+=``;
 document.head.append(st);document.body.append(ui);
 for(const f of ['buttons_0','buttons_1','buttons_3','buttons_9',...[0,1,2,3].map(i=>'card_'+i),...Object.values(WIC),...Object.values(PIC)])new Image().src='assets/ui/'+f+'.png';   // 预加载，升级时不再现等图片
 const wImg={};for(const k in WEAPONS){if(!WEAPONS[k].img)continue;const im=new Image(),g=WEAPONS[k].img;im.src=g.startsWith('ui:')?'assets/ui/'+g.slice(3)+'.png':'assets/weapons/'+g+'.png';wImg[k]=im}
 const UI={};for(const k of ['w_arrow','w_bolt','w_ice','i_magnet',...[0,1,2,3].flatMap(j=>['fx_fire_'+j,'fx_thunder_'+j,'fx_ice_'+j])]){const im=new Image();im.src='assets/ui/'+k+'.png';UI[k]=im}
 const HI={};for(const k in WIC){const im=new Image();im.src='assets/ui/'+WIC[k]+'.png';HI[k]=im}
 const DW=(c,im,h)=>{const w=im.width*h/im.height;c.drawImage(im,-w/2,-h/2,w,h)},DA=(c,im,x,y,w)=>{if(!im||!im.complete||!im.width)return;const h=im.height*w/im.width;c.drawImage(im,x-w/2,y-h/2,w,h)};
 const GX={};for(const k of ['b0','b1','b2','b3','x0','x1','x2','x3','tet','w0','w1','w2','w3','n0','n1','n2','bass']){const im=new Image();im.src='assets/weapons/gear/'+k+'.png';GX[k]=im}
 function reset(start='sword'){
  S={B:window.META?.bonus()||{hp:0,atk:0,spd:0,cd:0,arm:0,reg:0,mag:0,wis:0,crit:0,rr:0,rev:0},coins:[],chests:[],seen:{},ev:{},calm:0,t:+(new URLSearchParams(location.search).get('t')||0),lv:1,xp:0,need:5,queue:0,lastLv:-9,rerolls:0,w:{[start]:1},cd:{},p:Object.fromEntries(PASS_KEYS.map(k=>[k,0])),gems:[],shots:[],fx:[],texts:[],eliteT:Math.max(180,+(new URLSearchParams(location.search).get('t')||0)+60),bossDone:{},paused:false,maxHp:100};
  {const P=Array.prototype.push;S.shots.push=function(...a){for(const x of a)if(!x.src)x.src=S.src;return P.apply(this,a)}}
  {const d=loadDeck();S.deck=[...d.w,...d.s];const rest=PASS_KEYS.filter(k=>!d.lock.includes(k)).sort(()=>Math.random()-.5);S.pp=[...d.lock,...rest.slice(0,12-d.lock.length)]}
  S.maxHp=100+S.B.hp;S.rerolls=S.B.rr;S.rev=S.B.rev;survival?.setMax?.(S.maxHp,S.B.hp);ui.hidden=true;
 }
 // ---------- 节奏 ----------
  const want=()=>{if(S.t<(S.calm||0))return 0;const W=wave();let a=0;for(const e of en)if(!e.dead)a++;return Math.min(WV.cap,Math.max(Math.round(W.min*(1+.1*S.p.curse)*(window.NIGHT?1.3:1)),a+((S.pend||0)>0?1:0)))};
 // ---------- 波数：按时间逐步加入兵种 ----------
 const NEWK={gob_kid:'哥布林崽群！',goblin:'哥布林棍兵',gob_blade:'剑士出现！会冲刺斩',gob_shield:'盾卫出现！举盾挡箭：远程只吃三成，靠近砍',gob_archer:'弓箭手出现！会放冷箭',gob_bomb:'炸弹哥布林！看到红圈快跑',gob_boar:'野猪骑兵！会直线冲锋',gob_rock:'岩甲哥布林！石皮：物理减半，用法术',gob_mage:'哥布林法师！护符：元素减半',gob_ghost:'幽灵哥布林！物理打不实，怕神圣和元素',gob_wolf:'狼骑兵！会绕圈扑咬',gob_thrower:'投石哥布林！看地上阴影',gob_drum:'精英·鼓手！先打掉它',gob_necro:'精英·死灵师！会复活尸体'};
 const RES={gob_shield:'iron',gob_rock:'iron',gob_ghost:'spirit',gob_mage:'magic'};
 window.SUMMON=k=>{for(let i=0;i<12;i++){const a=Math.random()*6.28,x=hero.x+Math.cos(a)*120,y=hero.y+Math.sin(a)*90;if(!ok(x,y))continue;const m=makeEnemy(x,y,k);if(!m)return;onSpawnBase(m);m.armor=0;m.res='';m.sc=1;
  const B={gob_king:['哥布林大王',80,1.25],gob_chief:['哥布林酋长',200,1.3],gob_paladin:['哥布林圣骑士',160,1],gob_hero:['哥布林英雄',150,1]}[k];
  if(B){m.boss=true;m.name=B[0];m.hp=m.hpMax=Math.round(B[1]*(1+S.t/160));m.sc=B[2]}else{m.elite=true;if(k==='gob_troll')m.bshield=1;m.hp=m.hpMax=Math.ceil((k==='gob_troll'?60:k==='gob_giant'?40:12)*(1+S.t/80));if(k==='gob_shaman')m.summonT=4}
  en.push(m);S.banner={v:'召唤：'+(m.name||k),t:1.5};return}};
 window.SPAWN=(k,x,y)=>{if(!ok(x,y))return;const m=makeEnemy(x,y,k);if(m){onSpawnBase(m);en.push(m)}};
 const wave=()=>WV.waves[Math.min(WV.waves.length-1,Math.max(0,Math.floor(S.t/60)))];
 function introduced(){const m=Math.floor(S.t/60),o=new Set();for(const w of WV.waves)if(w.t<=m)for(const k of w.main)if(k!=='*')o.add(k);return [...o]}
 function pickKind(){const W=wave(),pool=introduced();let k=(W.main[0]==='*'||Math.random()>.55)?pool[Math.floor(Math.random()*pool.length)]:W.main[Math.floor(Math.random()*W.main.length)];if(!k)k='goblin';
  if(NEWK[k]&&!S.seen[k]){S.seen[k]=1;S.banner={v:NEWK[k],t:3}}return k}
 function ring(n,r,k,life){for(let i=0;i<n;i++){const a=i/n*6.283,x=hero.x+Math.cos(a)*r,y=hero.y+Math.sin(a)*r*.8;if(ok(x,y)){const m=makeEnemy(x,y,k);if(m){onSpawnBase(m);if(life)m.lifeT=life;en.push(m)}}}}
 function swarm(k,n){const a=Math.random()*6.283,R0=290,dx=-Math.cos(a),dy=-Math.sin(a);for(let i=0;i<n;i++){const s_=(Math.random()-.5)*300,b=R0+Math.random()*60,x=hero.x+Math.cos(a)*b-dy*s_,y=hero.y+Math.sin(a)*b*.8+dx*s_;const m=makeEnemy(x,y,k);if(m){onSpawnBase(m);m.sweep=[dx,dy];m.lifeT=14;en.push(m)}}}
 const EVN={kids:['哥布林崽群冲过来了！',()=>swarm('gob_kid',40)],ghosts:['幽灵群横穿！',()=>swarm('gob_ghost',25)],boars:['野猪冲锋潮！',()=>swarm('gob_boar',10)],
  wall:['盾墙合拢！快突围',d=>ring(28,200,'gob_shield',d||30)],ring:['包围圈！从四面合拢',()=>ring(22,170,'goblin')],flank:['剑士包抄！',()=>ring(14,170,'gob_blade')],wolfring:['狼群包围！',()=>ring(10,150,'gob_wolf')]};
 function events(){
  const E=S.ev,wi=Math.floor(S.t/60);
  if(wi!==S.wi){S.wi=wi;S.evq=S.evq||[];for(const [k,p,n,gap,dur] of wave().ev||[])if(Math.random()<p)for(let i=0;i<n;i++)S.evq.push({t:S.t+3+i*(gap||0)+Math.random()*3,k,dur})}
  for(const q of S.evq||[])if(!q.done&&S.t>=q.t&&EVN[q.k]){q.done=1;EVN[q.k][1](q.dur);S.banner={v:EVN[q.k][0],t:2.5}}
  S.evq=(S.evq||[]).filter(q=>!q.done);
  if(S.t>=660){E.gT=(E.gT??S.t)};if(S.t>=660&&S.t>=E.gT){E.gT=S.t+90;const a=Math.random()*6.28,x=hero.x+Math.cos(a)*200,y=hero.y+Math.sin(a)*150;if(ok(x,y)){const m=makeEnemy(x,y,'gob_giant');if(m){onSpawnBase(m);m.elite=true;m.armor=0;m.hp=m.hpMax=Math.ceil(40*(1+S.t/80));m.sc=1;en.push(m);S.banner={v:'巨型哥布林！看红圈躲开',t:3}}}}
  if(S.t>=1200&&!E.clear){E.clear=1;for(const e of en)if(!e.boss&&!e.dead)e.expired=true;S.evq=[]}
 }



 // ---------- 部落：活太久的变老兵；首领附近的小怪受鼓舞；首领死了周围四散 ----------
 window.onGrow=e=>{if(!S.grownMsg){S.grownMsg=1;S.banner={v:'没杀掉的崽子长大了！',t:2.5}}};
 function tribe(dt){const L=[];
  for(const e of en){if(e.rtT>0)e.rtT-=dt;if(e.dead||e.drum||e.totem)continue;if(e.k==='gob_troll'){if(e.noRegT>0)e.noRegT-=dt;else e.hp=Math.min(e.hpMax,e.hp+e.hpMax*.02*dt);if(e.brkT>0){e.brkT-=dt;if(e.brkT<=0)e.bshield=1}}if(e.boss||e.elite){L.push(e);continue}
   e.age=(e.age||0)+dt;if(!e.vet&&!e.sweep&&!e.guard&&e.age>60&&e.k!=='gob_kid'&&e.k!=='skeleton'){e.vet=1;e.hp*=2;e.hpMax*=2;e.sc=(e.sc||1)*1.2;e.dmgMul=(e.dmgMul||1)*1.3}}
  if(L.length)for(const e of en){if(e.dead||e.boss||e.elite||e.sweep)continue;for(const l of L){if((e.x-l.x)**2+(e.y-l.y)**2<90*90){e.buffT=Math.max(e.buffT||0,.3);break}}}}
 function leaderDown(l){for(const e of en)if(!e.dead&&!e.boss&&!e.elite&&!e.drum&&(e.x-l.x)**2+(e.y-l.y)**2<130*130)e.fearT=2}
 // ---------- 北部哥布林营地：部落战鼓 ----------
 function camp(dt){const C=window.CAMP;if(!C)return;const K=S.camp=S.camp||{cd:0,gt:0};const d=Math.hypot(hero.x-C.x,(hero.y-C.y)*1.2);
  if(K.e&&K.e.dead&&!K.done){K.done=1;K.cd=S.t+240;campWave(C)}
  if(d<520&&S.t>=K.cd&&(!K.e||K.e.dead)){if(K.e)K.e.expired=true;if(K.t)K.t.expired=true;const m=makeEnemy(C.x,C.y,'gob_shield');if(m){onSpawnBase(m);Object.assign(m,{drum:true,elite:true,armor:0,res:'',name:'部落战鼓',summonT:1e9,sc:1});m.hp=m.hpMax=Math.round(600+S.t*6);en.push(m);K.e=m;K.done=0;K.lh=m.hp}
   const tx=C.x-60,ty=C.y-14,t=makeEnemy(tx,ty,'gob_shield');if(t){onSpawnBase(t);Object.assign(t,{totem:true,drum:true,elite:true,armor:0,res:'',name:'萨满图腾',summonT:1e9,sc:1});t.hp=t.hpMax=Math.round((600+S.t*6)*.4);en.push(t);K.t=t}}
  if(K.t&&K.t.dead&&!K.tdone){K.tdone=1;S.banner={v:'图腾倒了！守卫失去护佑',t:2.5}}
  if(K.t&&!K.t.dead)K.tdone=0;
  {const w=K.t&&!K.t.dead;for(const o of en)if(o.guard)o.ward=w&&!o.dead}
  const e=K.e;if(!e||e.dead)return;
  if(d>420){e.hp=e.hpMax;K.lh=e.hp;if(K.t&&!K.t.dead)K.t.hp=K.t.hpMax;return}   // 离开营地就回满，不能磨
  const guard=()=>{const a=R(0,6.28),x=C.x+Math.cos(a)*R(30,110),y=C.y+Math.sin(a)*R(20,70);if(!ok(x,y))return;const ks=S.t<300?['gob_shield','goblin','gob_archer']:['gob_shield','gob_archer','gob_rock','gob_blade'];const m=makeEnemy(x,y,ks[Math.floor(Math.random()*ks.length)]);if(m){onSpawnBase(m);m.guard=1;en.push(m)}};
  if(d<330&&S.t>=K.gt){K.gt=S.t+5;let n=0;for(const o of en)if(o.guard&&!o.dead)n++;for(let i=n;i<5;i++)guard()}
  if(K.lh-e.hp>e.hpMax*.08){K.lh=e.hp;guard();guard()}}   // 挨打就叫人
 function campWave(C){S.banner={v:'战鼓破了！精英从四面涌来',t:3};window.SFX?.boss?.();
  const ek=S.t>=600?['gob_shaman','gob_drum','gob_necro']:S.t>=420?['gob_shaman','gob_drum']:['gob_shaman','gob_blade'];
  for(let i=0;i<3;i++){const a=i/3*6.283+R(0,1),x=C.x+Math.cos(a)*(C.rx+60),y=C.y+Math.sin(a)*(C.ry+50);if(!ok(x,y))continue;const m=makeEnemy(x,y,'goblin');if(!m)continue;onSpawnBase(m);m.elite=true;m.armor=0;m.res='';m.k=ek[Math.floor(Math.random()*ek.length)];m.hp=m.hpMax=Math.ceil(15*(1+S.t/100));m.sc=1.1;if(m.k==='gob_shaman')m.summonT=4;en.push(m)}
  for(let i=0;i<16;i++){const a=i/16*6.283,x=C.x+Math.cos(a)*(C.rx+40),y=C.y+Math.sin(a)*(C.ry+35);if(ok(x,y)){const m=makeEnemy(x,y,'goblin');if(m){onSpawnBase(m);en.push(m)}}}}
 function onSpawnBase(e){const m=S.t/40;   // 一局 20 分钟：强度按 30 分钟曲线压缩
 e.hp=e.hpMax=Math.ceil(e.hp*(m<10?1+m/2:6+(m-10)*.9)*(1+.1*S.p.curse));e.dmgMul=Math.min(3,.6+m*.12);e.sc=e.sc0||1;e.res=RES[e.k]||'';e.armor=e.res==='iron'?1:0}
 function onSpawn(e){
  onSpawnBase(e);S.pend=Math.max(0,(S.pend||0)-1);
  const BS=[[300,'哥布林大王',80,1.25,'gob_king'],[600,'哥布林酋长',200,1.3,'gob_chief'],[900,'哥布林圣骑士',160,1,'gob_paladin'],[1200,'哥布林皇帝',600,1.8,'gob_king']];   // 一局 20 分钟
  for(const [bt,nm,hp,sc,k] of BS)if(S.t>=bt&&!S.bossDone[bt]){S.bossDone[bt]=1;e.boss=true;e.armor=0;e.res='';e.k=k;e.hp=e.hpMax=Math.round(hp*(1+S.t/160));e.sc=sc;e.name=nm;if(k==='gob_shaman')e.summonT=3;S.calm=S.t+15;S.banner={v:'Boss：'+nm,t:3.5};S.texts.push({x:e.x,y:e.y-40,v:'Boss 来袭！',t:2.5,c:'#ff8a6a',big:1});return}
  else if(S.t>=S.eliteT){S.eliteT=S.t+R(40,60);e.elite=true;e.armor=0;e.res='';const ek=S.t>=600?['gob_shaman','gob_drum','gob_necro']:S.t>=420?['gob_shaman','gob_drum']:['gob_shaman'];e.k=ek[Math.floor(Math.random()*ek.length)];e.hp=e.hpMax=Math.ceil((e.k==='gob_shaman'?10:12)*(1+S.t/100));e.sc=1.1;if(e.k==='gob_shaman')e.summonT=4;if(NEWK[e.k]&&!S.seen[e.k]){S.seen[e.k]=1;S.banner={v:NEWK[e.k],t:3}}}
 }
 const ST=(f,t)=>{const k=S.src;return setTimeout(()=>{const o=S.src;S.src=k;f();S.src=o},t)};
 function dmg(base){const ph=PHYS.has(S.src)||DT[S.src]==='mel'||DT[S.src]==='rng',hpf=survival?survival.hp/Math.max(1,survival.max):1;return base*(1+(ph?0.1*S.p.atk:0.1*S.p.arc)+S.B.atk)*(1+.08*S.p.berserk*(1-hpf))}
 const AR=()=>1+.1*S.p.area,AMT=()=>S.p.amt,FA=()=>hero.face>0?0:Math.PI,MA=()=>Math.atan2(hero.my||0,hero.mx||hero.face),FN=()=>{const t=nearest(260);return t?(t.x>=hero.x?0:Math.PI):FA()},AIM=(r=260)=>{const t=nearest(r);return t?Math.atan2(t.y-10-hero.y+10,t.x-hero.x):MA()},PS=()=>1+.15*S.p.pspd,DUR=()=>1+.15*S.p.dur;
 function cluster(){let b=null,bn=-1;const v=en.filter(e=>!e.dead&&Math.abs(e.x-hero.x)<230&&Math.abs(e.y-hero.y)<160);for(let i=0;i<Math.min(24,v.length);i++){const e=v[Math.floor(Math.random()*v.length)];let n=0;for(const o of v)if((o.x-e.x)**2+(o.y-e.y)**2<40*40)n++;if(n>bn){bn=n;b=e}}return b}
 function nearest(r,from=hero){let b=null,bd=r*r;for(const e of en){if(e.dead)continue;const d=(e.x-from.x)**2+(e.y-from.y)**2;if(d<bd){bd=d;b=e}}return b}
 function hitArc(ang,range,half,amount,opts={}){range*=AR();
  let n=0;for(const e of en){if(e.dead||e.drum)continue;const dx=e.x-hero.x,dy=(e.y-hero.y)*1.15,d=Math.hypot(dx,dy);if(d>range+4*(e.sc||1))continue;
   let a=Math.atan2(dy,dx)-ang;a=Math.atan2(Math.sin(a),Math.cos(a));if(Math.abs(a)>half&&d>10)continue;
   let v=amount,crit=false;if(opts.crit&&Math.random()<opts.crit){v*=opts.cm;crit=true}
   strike(e,v,Math.sign(dx)||1,crit,true);if(opts.kb)knock(e,opts.kb);n++}return n}
 const PHYS=new Set(['gb','sword','hammer','axe','bow','xbow']),
 // 伤害五类：近战物理 mel、远程物理 rng、元素 ele、神圣 holy、黑暗 dark
 DT={sword:'mel',hammer:'mel',axe:'rng',bow:'rng',xbow:'rng',gb:'rng',fireball:'ele',frost:'ele',chain:'ele',thunder:'ele',missile:'ele',hp:'ele',holy:'holy'},
 // 抗性表（没写 = ×1）；同步 docs/ENEMIES.md
 RT={gob_shield:{rng:.3},gob_rock:{mel:.5,rng:.5},gob_wolf:{rng:1.5},gob_boar:{mel:.7},gob_ghost:{mel:.5,rng:.5,ele:1.5,holy:2,dark:.5},gob_mage:{ele:.5},gob_shaman:{dark:.5},
  skeleton:{rng:.7,holy:1.5,dark:.5},gob_necro:{rng:.7,holy:1.5,dark:.5},gob_giant:{mel:.8,rng:.8},gob_paladin:{holy:.5,dark:1.5},gob_hero:{rng:.5},gob_troll:{mel:.3,rng:.3}};
 function strike(e,v,dir,crit,mel){const dt_=DT[S.src]||'rng',rt=e.drum?null:RT[e.k],rm=(e.k==='gob_troll'&&e.brkT>0&&(dt_==='mel'||dt_==='rng'))?1:(rt?.[dt_]??1),arm=rm<1;v*=rm;if(S.src==='fireball')e.noRegT=4;if(dt_==='holy'&&e.bshield){e.bshield=0;e.brkT=6;S.texts.push({x:e.x,y:e.y-50,v:'血盾破碎！',t:1.2,c:'#ffe27a',big:1})}if(rm!==1&&!(e.rtT>0)){e.rtT=1.2;S.texts.push({x:e.x,y:e.y-28*(e.sc||1),v:rm<1?'抵抗':'克制！',t:.8,c:rm<1?'#9aa3ad':'#ff9a3c',big:rm>1})}if(mel&&S.p.vamp){S.vh=(S.vh||0)+v*.02*S.p.vamp;if(S.vh>=1){survival?.heal?.(Math.floor(S.vh));S.vh%=1}}window.SFX?.hit();if(e.elite||e.boss)v*=1+.05*S.p.hunt;if(!crit&&Math.random()<.05*S.p.crit+S.B.crit){v*=2+.2*S.p.critd;crit=true}if(S.p.gamble)v*=.7+Math.random()*(.6+.1*S.p.gamble);if(S.p.svamp&&(dt_==='ele'||dt_==='holy'||dt_==='dark')){S.sv=(S.sv||0)+v*.015*S.p.svamp;if(S.sv>=1){survival?.heal?.(Math.floor(S.sv));S.sv%=1}}window.KB=1+.25*S.p.knock;hitEnemy(e,v,dir);if(S.p.exec&&!e.dead&&!e.boss&&!e.elite&&!e.drum&&e.hp>0&&e.hp<e.hpMax*.02*S.p.exec)hitEnemy(e,e.hp+1,dir);S.texts.push({x:e.x+R(-3,3),y:e.y-18*(e.sc||1),v:(Math.round(v*10)/10)+'',t:.55,c:arm?'#8f98a3':crit?'#ffd166':'#ffffff',big:crit&&!arm})}
 function knock(e,k){if(e.drum)return;if(e.boss)k*=.15;if(e.armor)k*=.2;const dx=e.x-hero.x,dy=e.y-hero.y,l=Math.hypot(dx,dy)||1,nx=e.x+dx/l*k,ny=e.y+dy/l*k;if(ok(nx,ny)){e.x=nx;e.y=ny}}
 // ---------- 武器 ----------
 const FIRE={
  sword(L){const a=FN(),n=L>=7?3:L>=3?2:1,rg=(L>=8?56:L>=4?48:40),dm=1.3*dmg(1+.35*(L-1)+(L>=6?.6:0)+(L>=8?1:0));if(nearest(rg+10))window.SFX?.slash();
   for(let i=0;i<n;i++)ST(()=>{if(!S||S.paused)return;const aa=i===1?a+Math.PI:a;hitArc(aa,rg,.9,dm);S.fx.push({k:'arc',a:aa+(i%2?-.3:.3),r:rg*AR(),w:1.8,t:0,d:.18,c:'255,255,255',img:'sword',flip:i%2})},i*110);
   return L>=5?.65:.85},
  dao(L){const ang=FA(),half=L>=6?1.57:L>=3?1.25:1.05,dm=dmg(1.6+.45*(L-1)+(L>=5?.6:0));if(nearest(60))window.SFX?.slash();
   hitArc(ang,46,half,dm);S.fx.push({k:'arc',a:ang,r:46*AR(),w:half*2,t:0,d:.22,c:'255,236,200',img:'dao'});
   if(L>=8){hitArc(ang+Math.PI,46,half,dm);S.fx.push({k:'arc',a:ang+Math.PI,r:46*AR(),w:half*2,t:0,d:.22,c:'255,236,200',img:'dao'})}
   return L>=7?.85:L>=4?1.0:1.2},
  hammer(L){const n=L>=6?2:1,r=(L>=7?48:L>=3?40:34)*AR(),dm=1.3*dmg(3+.8*(L-1)+(L>=8?2:0)),sd=FN()===0?1:-1;
   for(let i=0;i<n;i++){const d=60+i*45;const hx=hero.x+sd*d,hy=hero.y+R(-10,10);S.shots.push({k:'hammer',x:hx,y:hy,t:0,d:.35,r,dm});if(L>=8)S.shots.push({k:'hammer',x:hx,y:hy,t:-.35,d:.35,r:r*1.3,dm:dm*.6,ghost:1})}
   return L>=4?1.6:2},
  axe(L){const n=(L>=6?2:1)+AMT(),dm=1.3*dmg(1.7+.35*(L-1)+(L>=3?.5:0)),sd=FN()===0?1:-1,cr=.2+(L>=2?.1:0)+(L>=6?.1:0),cm=L>=8?3:L>=4?2.5:2;
   for(let i=0;i<n;i++)S.shots.push({k:'axe',x:hero.x,y:hero.y-12,vx:sd*(55+i*30)*(L>=7?1.3:1),vy:-190,life:1.6,dm,cr,cm,hit:new Set()});
   return L>=5?.9:1.2},
  bow(L){const n=(L>=8?4:L>=5?3:L>=2?2:1)+AMT(),dm=dmg(1.3+(L>=3?.5:0)+(L>=6?.7:0)),pierce=L>=8?99:(L>=4?1:0)+(L>=7?2:0),b=AIM(300);
   for(let i=0;i<n;i++){const a=b+(i-(n-1)/2)*.12;S.shots.push({k:'arrow',x:hero.x,y:hero.y-10,dx:Math.cos(a),dy:Math.sin(a),v:240,life:1,dm,pierce,hit:new Set()})}
   return L>=8?.7:.95},
  xbow(L){const n=(L>=8?9:L>=6?7:L>=3?5:3)+AMT(),dm=dmg(.9+(L>=2?.3:0)+(L>=5?.4:0)+(L>=8?.5:0)),pierce=L>=7?1:0,t=nearest(240);if(!t)return .3;
   for(let i=0;i<n;i++)ST(()=>{if(!S||S.paused)return;const tx=t.dead?null:t,a=tx?Math.atan2(tx.y-10-(hero.y-10),tx.x-hero.x)+R(-.04,.04):AIM(240);S.shots.push({k:'bolt',x:hero.x,y:hero.y-10,dx:Math.cos(a),dy:Math.sin(a),v:300,life:.8,dm,pierce,hit:new Set()})},i*70);
   return L>=4?1.15:1.5},
  spear(L){const a=MA(),len=(L>=7?95:L>=3?80:65)*AR(),dm=dmg(1.6+.4*(L-1)+(L>=8?1.5:0)),n=L>=8?3:L>=5?2:1;if(nearest(len))window.SFX?.slash();
   for(let i=0;i<n;i++)ST(()=>{if(!S||S.paused)return;for(const e of en){if(e.dead)continue;const dx=e.x-hero.x,dy=e.y-6-hero.y,along=dx*Math.cos(a)+dy*Math.sin(a),side=Math.abs(-dx*Math.sin(a)+dy*Math.cos(a));if(along>0&&along<len&&side<8)strike(e,dm,Math.sign(dx)||1)}S.fx.push({k:'thrust',a,len,t:0,d:.16})},i*140);
   return L>=4?.95:1.2},
  knife(L){const n=(L>=8?5:L>=5?3:L>=2?2:1)+AMT(),dm=dmg(.9+(L>=3?.4:0)+(L>=7?.5:0)),pierce=L>=6?1:0,base=MA();window.SFX?.slash();
   for(let i=0;i<n;i++)ST(()=>{if(!S||S.paused)return;const a=base+R(-.1,.1);S.shots.push({k:'knife',x:hero.x,y:hero.y-10,dx:Math.cos(a),dy:Math.sin(a),v:300,life:.7,dm,pierce,hit:new Set()})},i*60);
   return L>=4?.55:.75},
  fireball(L){const n=(L>=7?3:L>=4?2:1),r=(L>=8?40:L>=3?32:26)*AR(),dm=dmg(2+.5*(L-1)),tg=cluster();if(!tg)return .4;const b=Math.atan2(tg.y-hero.y,tg.x-hero.x),dist=Math.min(200,Math.hypot(tg.x-hero.x,tg.y-hero.y));
   for(let i=0;i<n;i++){const a=b+(i-(n-1)/2)*.25;S.shots.push({k:'fire',x:hero.x,y:hero.y-10,tx:hero.x+Math.cos(a)*dist,ty:hero.y+Math.sin(a)*dist,dx:Math.cos(a),dy:Math.sin(a),v:170,life:1.1,r,dm,hit:new Set()})}
   return L>=5?1.3:1.7},
  chain(L){window.SFX?.zap();const jumps=2+(L>=2?1:0)+(L>=5?2:0)+(L>=8?3:0),dm=dmg(1.4+(L>=3?.5:0)+(L>=6?.6:0)+(L>=8?.8:0)),casts=L>=7?2:1;let any=false;
   for(let c=0;c<casts;c++){const vis=en.filter(e=>!e.dead&&Math.abs(e.x-hero.x)<220&&Math.abs(e.y-hero.y)<150);let cur=vis[Math.floor(Math.random()*vis.length)];if(!cur)break;any=true;const hit=new Set();let px=hero.x,py=hero.y-12;
    for(let j=0;j<=jumps&&cur;j++){hit.add(cur);strike(cur,(cur.slowT>0?2:1)*dm,Math.sign(cur.x-px)||1);S.fx.push({k:'bolt',x0:px,y0:py,x1:cur.x,y1:cur.y-8,t:0,d:.18});px=cur.x;py=cur.y-8;
     let b=null,bd=70*70;for(const e of en){if(e.dead||hit.has(e))continue;const d=(e.x-cur.x)**2+(e.y-cur.y)**2;if(d<bd){bd=d;b=e}}cur=b}}
   return any?(L>=4?1.1:1.4):.3},
  frost(L){const n=(L>=8?5:L>=6?4:L>=3?3:2)+AMT(),dm=dmg(1.2+.3*(L-1)),slow=(L>=5?2.6:1.8)*DUR();const vis=en.filter(e=>!e.dead&&Math.abs(e.x-hero.x)<230&&Math.abs(e.y-hero.y)<160);if(!vis.length)return .4;window.SFX?.wave();
   for(let i=0;i<n;i++){const t=vis[Math.floor(Math.random()*vis.length)],a=Math.atan2(t.y-10-(hero.y-10),t.x-hero.x);S.shots.push({k:'ice',x:hero.x,y:hero.y-10,dx:Math.cos(a),dy:Math.sin(a),v:230,life:1.1,dm,pierce:0,slow,shat:L>=8,hit:new Set()})}
   return L>=5?1.5:1.9},
  thunder(L){const n=L>=8?8:L>=6?6:L>=5?4:L>=3?3:2,dm=dmg(2+.4*(L-1)),vis=en.filter(e=>!e.dead&&Math.abs(e.x-hero.x)<230&&Math.abs(e.y-hero.y)<160);if(!vis.length)return .4;window.SFX?.zap();S.thN=(S.thN||0)+1;
   for(let i=0;i<n;i++)ST(()=>{if(!S||S.paused)return;const t=vis[Math.floor(Math.random()*vis.length)];if(!t)return;const big=L>=8&&S.thN%4===0&&i===0,r=(big?44:16)*AR();S.fx.push({k:'anim',a:'fx_thunder_',x:t.x,y:t.y-14,w:big?70:34,t:0,d:.4});for(const e of en)if(!e.dead&&(e.x-t.x)**2+((e.y-t.y)*1.25)**2<r*r)strike(e,big?dm*3:dm,Math.sign(e.x-t.x)||1)},i*90);
   return L>=5?1.3:1.6},
  holy(L){if(!S.zones?.some(z=>z.k==='holy'))S.zones=(S.zones||[]).concat([{k:'holy',follow:1,t:0,d:1e9,tick:.5,every:.5,r:30,dm:1}]);const z=S.zones.find(z=>z.k==='holy');
   z.r=(L>=8?52:L>=6?44:L>=3?38:30)*AR();z.dm=dmg(.6+.25*(L-1)+(L>=8?.6:0));z.every=L>=7?.3:L>=4?.4:.5;return 1},
  missile(L){const n=(L>=8?7:L>=7?5:L>=5?4:L>=3?3:2)+AMT(),dm=dmg(1+(L>=2?.4:0)+(L>=6?.5:0));if(!nearest(220))return .3;
   for(let i=0;i<n;i++){const a=-Math.PI/2+(i-(n-1)/2)*.5;S.shots.push({k:'note',x:hero.x,y:hero.y-14,dx:Math.cos(a),dy:Math.sin(a),v:150,life:2,dm,pierce:0,hit:new Set(),mis:1})}
   return L>=4?1.1:1.4},
  poison(L){const n=L>=8?3:L>=5?2:1,r=(L>=7?34:L>=3?28:22)*AR(),dm=dmg(.5+.2*(L-1)+(L>=8?.4:0)),d=L>=4?6:4.5;
   for(let i=0;i<n;i++)S.zones=(S.zones||[]).concat([{k:'poison',x:hero.x-hero.mx*14*i+R(-6,6),y:hero.y-hero.my*14*i+R(-6,6),t:0,d,tick:.2,every:.5,r,dm}]);
   return L>=5?1.2:1.6},
  _gb(){},
  gb(L){const n=(L>=6?3:L>=3?2:1)+AMT(),dm=dmg(1.2+.35*(L-1)),pierce=(L>=4?1:0)+(L>=7?1:0),bounce=1+(L>=5?1:0)+(L>=8?1:0),b=AIM(260);window.SFX?.shoot();
   for(let i=0;i<n;i++){const a=b+(i-(n-1)/2)*.15;S.shots.push({k:'pix',x:hero.x,y:hero.y-10,dx:Math.cos(a),dy:Math.sin(a),v:210,life:1,dm,pierce,bounce,hit:new Set()})}
   S.gbN=(S.gbN||0)+1;if(L>=8&&S.gbN%4===0){const t=nearest(200);if(t)S.shots.push({k:'tet',x:t.x,y:t.y,t:0,d:.45,r:34,dm:dmg(5)})}
   return L>=5?.6:.85},
  hp(L){if(nearest(70))window.SFX?.wave();const r=L>=3?62:48,dm=dmg(1+.35*(L-1)+(L>=6?.6:0));S.shots.push({k:'wave',t:0,d:.6,r,dm,hit:new Set()});
   if(L>=5){const n=L>=7?3:2;for(let i=0;i<n;i++){const a=R(0,6.28);S.shots.push({k:'note',x:hero.x,y:hero.y-12,dx:Math.cos(a),dy:Math.sin(a),v:120,life:1.8,dm:dmg(1.2),pierce:0,hit:new Set(),img:'n'+(i%3)})}}
   S.hpN=(S.hpN||0)+1;if(L>=8&&S.hpN%5===0){S.fx.push({k:'bass',t:0,d:.6});for(const e of en)if(!e.dead&&(e.x-hero.x)**2+(e.y-hero.y)**2<260*260){strike(e,dm*3,Math.sign(e.x-hero.x)||1);if(!e.boss)knock(e,14)}}
   return L>=4?1.1:1.4}};
 // ---------- 升级 ----------
 function gain(v){S.xp+=v*(1+.1*S.p.curse)*(S.w.gb?1.1:1)*(1+.08*S.p.wis+S.B.wis)}
 function tryLevel(){
  if(S.paused||S.t-S.lastLv<3)return;
  if(S.xp<S.need)return;
  S.xp-=S.need;S.lv++;S.need=5+8*(S.lv-1);S.lastLv=S.t;
  if(S.lv%3===0)S.rerolls=Math.min(2,S.rerolls+1);
  window.SFX?.level();openLevel();
 }
 function options(){
  const pool=[],own=Object.keys(S.w),nw=own.filter(k=>!isOwn(k)&&!isSp(k)).length,ns=own.filter(isSp).length,np=Object.keys(S.p).filter(k=>S.p[k]>0).length;
  for(const k in S.w)if(S.w[k]<MAXL-1)pool.push({t:'w',k,wt:1.2});   // 满级（第 5 级）只能开宝箱拿
  for(const k of S.deck){if(S.w[k])continue;if(isSp(k)?ns>=MAXS:nw>=MAXW)continue;pool.push({t:'w',k,wt:1})}
  for(const k of S.pp){const L=S.p[k];if(L>=PASSIVES[k].max)continue;if(!L&&np>=MAXP)continue;pool.push({t:'p',k,wt:.8})}
  const out=[];while(out.length<3&&pool.length){const tot=pool.reduce((a,o)=>a+o.wt,0);let r=Math.random()*tot,i=0;while(i<pool.length-1&&r>pool[i].wt)r-=pool[i++].wt;out.push(pool.splice(i,1)[0])}
  if(!out.length)out.push({t:'heal'});return out}
 function icon(o){const f=o.t==='w'?WIC[o.k]:o.t==='p'?PIC[o.k]:null;if(f)return `<img class="u" src="assets/ui/${f}.png" alt="">`;if(o.t==='w')return wImg[o.k]?`<img src="${wImg[o.k].src}" alt="">`:WEAPONS[o.k].name[0];if(o.t==='cat')return CATS[o.k].name[0];if(o.t==='p')return PASSIVES[o.k].name[0];return '息'}
 function card(o,i){if(UIV==='card')return card2(o,i);
  let nm,tag,d;
  if(o.t==='w'){const L=S.w[o.k]||0,W=WEAPONS[o.k],sp=isSp(o.k);nm=W.name;d=W.desc[L];
   tag=!L?`<span class="tag ${sp?'sp':'new'}">${sp?'新法术卡':'新装备卡'} · ${CATS[W.cat].name}</span>`:L+1===MAXL||/【/.test(d)?`<span class="tag q">★ ${L} → ${L+1} 级</span>`:`<span class="tag">升级 · ${L} → ${L+1} 级</span>`}
  else if(o.t==='p'){const L=S.p[o.k];nm=PASSIVES[o.k].name;d=PASSIVES[o.k].desc;tag=`<span class="tag p">${L?'祝福 · '+L+' → '+(L+1):'新祝福'}</span>`}
  else{nm='调息';d='回复 30 点生命';tag='<span class="tag p">回复</span>'}
  return `<button class="card" data-i="${i}"><span class="ic">${icon(o)}</span><span><span class="nm">${nm}</span>${tag}<span class="d">${d}</span></span></button>`}
 function card2(o,i){let nm,d,L=0,fr=FRS+'0',nw=false;
  if(o.t==='w'){const W=WEAPONS[o.k];L=S.w[o.k]||0;nm=W.name;d=W.desc[L];nw=!L;fr=FRS+(isOwn(o.k)?3:isSp(o.k)?2:1)}
  else if(o.t==='p'){L=S.p[o.k];nm=PASSIVES[o.k].name;d=PASSIVES[o.k].desc;nw=!L}else{nm='调息';d='回复 30 点生命'}
  const st=o.t==='heal'?'':`<span class="st">${L?'Lv '+L+' → '+(L+1):'Lv 1'}</span>`;
  return `<button class="card c2" data-i="${i}"><span class="cf" style="background-image:url(assets/ui/${fr.replace('frames_','card_')}.png)"><span class="cn">${nm}</span>${nw?'<span class="nw">NEW</span>':''}<span class="ci">${icon(o)}</span>${st}<span class="cd">${d}</span></span></button>`}
 function owned(){return Object.keys(S.w).map(k=>({t:'w',k})).concat(Object.keys(S.p).filter(k=>S.p[k]>0).map(k=>({t:'p',k})))}
 let cur=[],sub=null;
 function render(){
  const list=sub?CATS[sub].ws.filter(k=>!S.w[k]).map(k=>({t:'w',k})):cur;
  if(UIV==='card'){const ow=owned();ui.innerHTML=`<div class="b2"><div class="scroll">等级 ${S.lv}！</div><div class="sub">选择一张卡 · 按 1 / 2 / 3</div><div class="cards">${list.map(card).join('')}</div>
   <div class="btns">${sub?'<button class="pb gray" data-a="back">返回</button>':`<button class="pb green" data-a="rr" ${S.rerolls>0?'':'disabled'}>刷新 ${S.rerolls}</button><button class="pb gray" data-a="skip">跳过</button>`}</div>
   <div class="own">${Array.from({length:Math.max(6,ow.length)},(_,j)=>`<span class="sl" data-j="${j}">${ow[j]?icon(ow[j])+`<b>${ow[j].t==='w'?S.w[ow[j].k]:S.p[ow[j].k]}</b>`:''}</span>`).join('')}</div><div class="tip" hidden></div></div>`;
   const tip=ui.querySelector('.tip');ui.querySelectorAll('.sl').forEach(el=>{const o=ow[+el.dataset.j];if(!o)return;const show=()=>{const W=o.t==='w'?WEAPONS[o.k]:PASSIVES[o.k],L=o.t==='w'?S.w[o.k]:S.p[o.k],d=o.t==='w'?W.desc.slice(0,L).map((x,i)=>`<i>Lv${i+1}</i> ${x}`).join('<br>'):W.desc;tip.innerHTML=`<b>${W.name}</b> Lv ${L}<br>${d}`;tip.hidden=false};el.onmouseenter=show;el.onclick=e=>{e.stopPropagation();tip.hidden?show():tip.hidden=true};el.onmouseleave=()=>tip.hidden=true})}
  else ui.innerHTML=`<div class="box"><h2>等级 ${S.lv}！</h2><div class="sub">选择奖励 · 按 1 / 2 / 3</div>${list.map(card).join('')}
   <div class="row">${sub?'<button data-a="back">返回</button>':(S.rerolls>0?`<button data-a="rr">重抽（${S.rerolls}）· R</button>`:'')}</div><div class="slots">装备 ${Object.keys(S.w).filter(k=>!isOwn(k)&&!isSp(k)).length}/${MAXW} · 法术 ${Object.keys(S.w).filter(isSp).length}/${MAXS} · 祝福 ${Object.keys(S.p).filter(k=>S.p[k]>0).length}/${MAXP}</div></div>`;
  ui.querySelectorAll('button.card').forEach(b=>b.onclick=()=>choose(list[+b.dataset.i]));
  const bk=ui.querySelector('[data-a=back]');if(bk)bk.onclick=()=>{sub=null;render()};
  const rr=ui.querySelector('[data-a=rr]');if(rr)rr.onclick=reroll;
  const sk=ui.querySelector('[data-a=skip]');if(sk)sk.onclick=()=>{ui.hidden=true;S.paused=false;sub=null};
  setTimeout(()=>ui.querySelector('button.card')?.focus(),30)}
 function openLevel(){S.paused=true;sub=null;cur=options();ui.hidden=false;render()}
 function reroll(){if(sub||S.rerolls<=0)return;S.rerolls--;cur=options();render()}
 function choose(o){
  if(!o)return;
  if(o.t==='cat'){sub=o.k;render();return}
  if(o.t==='w')S.w[o.k]=(S.w[o.k]||0)+1;
  else if(o.t==='p'){S.p[o.k]++;if(o.k==='rev')S.rev=(S.rev||0)+1;if(o.k==='hp'){S.maxHp+=20;survival?.setMax?.(S.maxHp,20)}}
  else survival?.heal?.(30);
  ui.hidden=true;S.paused=false;sub=null}
 addEventListener('keydown',e=>{if(!S||ui.hidden)return;const k=e.key.toLowerCase();
  if(/^[1-4]$/.test(k)){const b=ui.querySelectorAll('button.card')[+k-1];if(b)b.click()}
  else if(k==='r')reroll();else if(k==='escape'&&sub){sub=null;render()}});
 // ---------- 每帧 ----------
 function update(dt){
  if(!S||S.paused)return;
  S.t+=dt;S.spT=(S.spT||0)+dt;if(S.spT>=wave().iv){S.spT=0;S.pend=Math.min((S.pend||0)+1,8)}events();camp(dt);tribe(dt);if(S.banner&&!S.banner.snd){S.banner.snd=1;window.SFX?.[/Boss/.test(S.banner.v)?'boss':'banner']()}if(S.banner){S.banner.t-=dt;if(S.banner.t<=0)S.banner=null}
  for(const k in S.w){S.cd[k]=(S.cd[k]??R(.1,.4))-dt;if(S.cd[k]<=0){S.src=k;S.cd[k]=FIRE[k](OL[S.w[k]])*(1-.06*S.p.cd)*(1-S.B.cd)}}
  if(S.p.regen||S.B.reg){S.rg=(S.rg||0)+dt*(.3*S.p.regen+S.B.reg);if(S.rg>=1){survival?.heal?.(Math.floor(S.rg));S.rg%=1}}
  for(const z of S.zones||[]){z.t+=dt;z.tick-=dt;if(z.tick<=0){z.tick=z.every;const zx=z.follow?hero.x:z.x,zy=z.follow?hero.y:z.y;for(const e of en)if(!e.dead&&(e.x-zx)**2+((e.y-zy)*1.25)**2<z.r*z.r)strike(e,z.dm,Math.sign(e.x-zx)||1)}}
  S.zones=(S.zones||[]).filter(z=>z.t<z.d);
  for(const s of S.shots){S.src=s.src;
   if(s.k==='axe'){s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=380*dt;s.life-=dt;for(const e of en){if(e.dead||s.hit.has(e))continue;if(Math.abs(e.x-s.x)<8&&Math.abs(e.y-10-s.y)<10){s.hit.add(e);let v=s.dm,c=false;if(Math.random()<s.cr){v*=s.cm;c=true}strike(e,v,Math.sign(s.vx)||1,c,true)}}s.dead=s.life<=0;continue}
   if(s.k==='fire'){s.x+=s.dx*s.v*dt;s.y+=s.dy*s.v*dt;s.life-=dt;for(const e of en)if(!e.dead&&Math.abs(e.x-s.x)<7&&Math.abs(e.y-10-s.y)<9){s.tx=s.x;s.ty=s.y+10;s.life=0;break}if((s.x-s.tx)**2+(s.y-10-s.ty+10)**2<36||s.life<=0||(s.x-s.tx)*s.dx+(s.y+10-s.ty)*s.dy>0){window.SFX?.boom();S.fx.push({k:'boom',x:s.tx,y:s.ty,r:s.r,t:0,d:.3});for(const e of en)if(!e.dead&&(e.x-s.tx)**2+((e.y-s.ty)*1.25)**2<s.r*s.r)strike(e,s.dm,Math.sign(e.x-s.tx)||1);s.dead=true}continue}
   if(s.k==='wave'){s.t+=dt;const rr=s.r*AR()*Math.min(1,s.t/s.d);for(const e of en){if(e.dead||s.hit.has(e))continue;const d=Math.hypot(e.x-hero.x,(e.y-hero.y)*1.2);if(d<rr+4){s.hit.add(e);strike(e,s.dm,Math.sign(e.x-hero.x)||1);if(!e.boss)knock(e,8)}}s.dead=s.t>=s.d;continue}
   if(s.k==='tet'){s.t+=dt;if(!s.done&&s.t>=s.d){s.done=true;window.SFX?.boom();S.fx.push({k:'ring',x:s.x,y:s.y,r:s.r,t:0,d:.3});for(const e of en)if(!e.dead&&(e.x-s.x)**2+((e.y-s.y)*1.3)**2<s.r*s.r)strike(e,s.dm,1)}s.dead=s.t>s.d+.05;continue}
   if(s.k==='note'){const t=nearest(s.mis?240:160,s);if(t){const a=Math.atan2(t.y-10-s.y,t.x-s.x),b=Math.atan2(s.dy,s.dx),d=Math.atan2(Math.sin(a-b),Math.cos(a-b));const nb=b+Math.max(-4*dt,Math.min(4*dt,d));s.dx=Math.cos(nb);s.dy=Math.sin(nb)}}
   if(s.k==='hammer'){s.t+=dt;if(!s.done&&s.t>=s.d){s.done=true;S.fx.push({k:'ring',x:s.x,y:s.y,r:s.r,t:0,d:.3});
     for(const e of en){if(e.dead)continue;if((e.x-s.x)**2+((e.y-s.y)*1.3)**2<(s.r+4*(e.sc||1))**2){strike(e,s.dm,Math.sign(e.x-s.x)||1,false,true);if(!e.dead){const dx=e.x-s.x,dy=e.y-s.y,l=Math.hypot(dx,dy)||1,k=e.boss?2:12;if(ok(e.x+dx/l*k,e.y+dy/l*k)){e.x+=dx/l*k;e.y+=dy/l*k}}}}}
     s.dead=s.t>s.d+.05;continue}
   s.x+=s.dx*s.v*PS()*dt;s.y+=s.dy*s.v*PS()*dt;s.life-=dt;
   for(const e of en){if(e.dead||s.hit.has(e))continue;const r=6*(e.sc||1);if(Math.abs(e.x-s.x)<r&&Math.abs(e.y-10*(e.sc||1)-s.y)<r+4){s.hit.add(e);strike(e,s.dm,s.dx>0?1:-1);if(s.slow){e.slowT=e.boss?Math.min(1,s.slow):s.slow;if(s.shat){S.fx.push({k:'anim',a:'fx_ice_',x:s.x,y:s.y,w:30,t:0,d:.3});for(const o of en)if(o!==e&&!o.dead&&(o.x-s.x)**2+(o.y-s.y)**2<20*20)strike(o,s.dm*.5,1)}}if(s.bounce>0){s.bounce--;let b=null,bd=90*90;for(const o of en){if(o.dead||s.hit.has(o))continue;const d=(o.x-s.x)**2+(o.y-10-s.y)**2;if(d<bd){bd=d;b=o}}if(b){const l=Math.hypot(b.x-s.x,b.y-10-s.y)||1;s.dx=(b.x-s.x)/l;s.dy=(b.y-10-s.y)/l;s.life=Math.max(s.life,.5);break}}if(s.pierce--<=0){s.life=0;break}}}
   s.dead=s.life<=0||!ok(s.x,s.y+10)}
  {let j=0;for(const s of S.shots)if(!s.dead)S.shots[j++]=s;S.shots.length=j}
  // 经验珠
  const mr=30*(1+S.B.mag+.25*S.p.mag)*(S.w.hp?1.25:1);
  for(const g of S.gems){const dx=hero.x-g.x,dy=hero.y-6-g.y,d=Math.hypot(dx,dy);
   if(g.fly||d<mr){g.fly=true;const v=Math.max(140,d*6);g.x+=dx/d*v*dt;g.y+=dy/d*v*dt;if(d<6){g.got=true;gain(g.v);window.SFX?.gem()}}}
  S.gems=S.gems.filter(g=>!g.got);
  for(const c of S.coins){const dx=hero.x-c.x,dy=hero.y-6-c.y,d=Math.hypot(dx,dy);if(c.fly||d<mr){c.fly=true;const v=Math.max(140,d*6);c.x+=dx/d*v*dt;c.y+=dy/d*v*dt;if(d<6){c.got=true;window.META?.addGold(c.v*(1+.1*S.p.greed)+(Math.random()<.5?0:0)|0||1);window.SFX?.gem()}}}
  S.coins=S.coins.filter(c=>!c.got);
  for(const ch of S.chests){if((hero.x-ch.x)**2+(hero.y-ch.y)**2<14*14){ch.got=true;openChest(ch.big)}}
  S.chests=S.chests.filter(c=>!c.got);
  for(const m of S.mags||[])if((hero.x-m.x)**2+(hero.y-m.y)**2<12*12){m.got=true;for(const g of S.gems)g.fly=true;window.SFX?.level()}
  S.mags=(S.mags||[]).filter(m=>!m.got);
  if(S.gems.length>500){const a=S.gems.splice(0,100);S.gems[0].v+=a.reduce((s,g)=>s+g.v,0)}
  // 离太远的敌人重新放到屏幕边（像吸血鬼幸存者）
  for(const e of en){if(e.dead)continue;const dx=e.x-hero.x,dy=e.y-hero.y;if(dx*dx+dy*dy>520*520){const a=Math.atan2(hero.y-e.y,hero.x-e.x)+R(-.6,.6),r=300;const nx=hero.x+Math.cos(a)*r*-1,ny=hero.y+Math.sin(a)*r*-1;if(ok(nx,ny)){e.x=nx;e.y=ny}}}
  for(const e of en){if(!e.elite||e.dead)continue;e.summonT-=dt;if(e.summonT<=0&&en.length<340){e.summonT=7;for(let i=0;i<3;i++){const a=R(0,6.28),x=e.x+Math.cos(a)*18,y=e.y+Math.sin(a)*12;if(ok(x,y)){const m=makeEnemy(x,y,'goblin');if(m){onSpawnBase(m);en.push(m)}}}S.fx.push({k:'ring',x:e.x,y:e.y,r:22,t:0,d:.4})}}
  tryLevel();
 }
 function openChest(big){const r=Math.random(),n=big?(r<.2?5:3):(r<.05*(1+S.p.luck)?5:r<.25?3:1),GOT=[];
  const ic=(t,k)=>{const f=t==='w'?WIC[k]:PIC[k];return f?'assets/ui/'+f+'.png':(t==='w'?wImg[k]?.src:null)};
  for(let i=0;i<n;i++){
   const ready=Object.keys(S.w).filter(k=>S.w[k]===MAXL-1);   // 先给等着满级的卡
   const ops=ready.length?ready.map(k=>['w',k]):[...Object.keys(S.w).filter(k=>S.w[k]<MAXL-1).map(k=>['w',k]),...Object.keys(S.p).filter(k=>S.p[k]>0&&S.p[k]<PASSIVES[k].max).map(k=>['p',k])];
   if(!ops.length){survival?.heal?.(30);GOT.push({img:'assets/ui/b_regen.png',t:'回复 30'});continue}
   const [t,k]=ops[Math.floor(Math.random()*ops.length)];
   if(t==='w'){S.w[k]++;const W=WEAPONS[k],L=S.w[k];GOT.push({img:ic('w',k),g:W.name[0],t:L===MAXL?W.name+' 进阶！':W.name+' '+(L-1)+'→'+L})}
   else{S.p[k]++;if(k==='rev')S.rev=(S.rev||0)+1;if(k==='hp'){S.maxHp+=20;survival?.setMax?.(S.maxHp,20)}GOT.push({img:ic('p',k),g:PASSIVES[k].name[0],t:PASSIVES[k].name+' '+(S.p[k]-1)+'→'+S.p[k]})}}
  const pool=GOT.length?GOT:[{g:'❤️'}];   // 转轮只转这次真的会给的东西
  if(window.META){S.paused=true;window.META.slot(big?'Boss 宝箱 ×'+n:'宝箱 ×'+n,GOT,pool,()=>{S.paused=false})}else S.banner={v:'宝箱：'+GOT.map(o=>o.t).join('、'),t:4,snd:1}}
 const HARD=new Set(['gob_shield','gob_rock','gob_boar','gob_wolf','gob_mage']);
 function onKill(e){if(S.p.boom&&!e.drum&&Math.random()<.04*S.p.boom){S.fx.push({k:'ring',x:e.x,y:e.y,t:0,r:30});const o=S.src;S.src='boom';for(const t of en)if(!t.dead&&t!==e&&(t.x-e.x)**2+((t.y-e.y)*1.2)**2<30*30)strike(t,dmg(4),0);S.src=o}if((e.elite||e.boss)&&!e.drum&&!e.totem)leaderDown(e);window.SFX?.kill();window.META?.kill(e.k);{const c=e.boss?25:e.elite?5:Math.random()<.12*(1+.2*S.p.luck)?1:0;if(c)S.coins.push({x:e.x+R(-4,4),y:e.y-3,v:c});if(e.boss)window.META?.addTickets(1)}if(!e.boss&&Math.random()<.004*(1+.2*S.p.luck))(S.mags=S.mags||[]).push({x:e.x,y:e.y-3});if((e.boss||e.elite)&&!e.totem)S.chests.push({x:e.x,y:e.y,big:!!e.boss});const v=e.boss?60:e.elite?12:(e.sweep||e.k==='gob_kid'||e.k==='skeleton')?0:HARD.has(e.k)?3:1;if(v)S.gems.push({x:e.x+R(-3,3),y:e.y-4+R(-3,3),v:v+(window.NIGHT&&Math.random()<.3?Math.max(1,Math.round(v*.3)):0)});if(e.boss)S.texts.push({x:e.x,y:e.y-50,v:'击败 '+e.name+'！',t:2.5,c:'#ffd166',big:1})}
 // ---------- 绘制 ----------
 function drawWorld(c,cx,cy,now){
  for(const e of en){if(e.dead||e.drum)continue;const x=e.x-cx,y=e.y-cy-({gob_troll:74,gob_hero:50,gob_giant:50,gob_paladin:56}[e.k]||26)*(e.sc||1);if(e.vet){c.fillStyle='#ff4a3a';c.beginPath();c.moveTo(x-3,y);c.lineTo(x+3,y);c.lineTo(x,y+4);c.fill()}else if((e.elite||e.boss)){c.fillStyle='#ffd23f';c.beginPath();c.moveTo(x-4,y+3);c.lineTo(x-4,y-1);c.lineTo(x-2,y+1);c.lineTo(x,y-2);c.lineTo(x+2,y+1);c.lineTo(x+4,y-1);c.lineTo(x+4,y+3);c.fill()}}
  for(const g of S.gems){const x=g.x-cx,y=g.y-cy;if(x<-10||y<-10||x>2000||y>2000)continue;const big=g.v>=12,col=g.v>=60?'#ffd166':big?'#c77dff':g.v>1?'#5ab0ff':'#5fe0b8';
   c.fillStyle='rgba(0,0,0,.25)';c.fillRect(x-1.5,y+2,3,1);c.fillStyle=col;c.beginPath();c.moveTo(x,y-(big?4:2.6));c.lineTo(x+(big?3:2),y);c.lineTo(x,y+(big?4:2.6));c.lineTo(x-(big?3:2),y);c.closePath();c.fill();c.fillStyle='rgba(255,255,255,.8)';c.fillRect(x-.6,y-1.4,1,1)}
  for(const co of S.coins){const x=co.x-cx,y=co.y-cy;c.fillStyle='#7a5208';c.beginPath();c.arc(x,y+.5,2.6,0,6.3);c.fill();c.fillStyle='#ffd23f';c.beginPath();c.arc(x,y,2.4,0,6.3);c.fill();c.fillStyle='#fff6c0';c.fillRect(x-1,y-1.4,1,1)}
  for(const m of S.mags||[])DA(c,UI.i_magnet,m.x-cx,m.y-cy-2+Math.sin(now/200),11);
  for(const ch of S.chests){const x=ch.x-cx,y=ch.y-cy,b=Math.sin(performance.now()/250)*1.2,w=ch.big?14:10,h=ch.big?10:8;c.fillStyle='rgba(0,0,0,.3)';c.fillRect(x-w/2,y,w,2);
   c.fillStyle='#7a4a1c';c.fillRect(x-w/2,y-h+b,w,h);c.fillStyle='#e8b23a';c.fillRect(x-w/2,y-h+b,w,2);c.fillRect(x-1,y-h+b,2,h);c.fillStyle='#fff3b0';c.fillRect(x-1,y-h/2+b-1,2,2);
   c.save();c.globalAlpha=.35+.25*Math.sin(performance.now()/180);c.fillStyle='#ffe27a';c.beginPath();c.arc(x,y-h/2+b,w*.9,0,6.3);c.fill();c.restore()}
  for(const s of S.shots){
   if(s.k==='hammer'){if(s.t<0)continue;const k=Math.min(1,s.t/s.d),x=s.x-cx,y=s.y-cy-60*(1-k)-6;c.save();c.globalAlpha=.35*k;c.fillStyle='#000';c.beginPath();c.ellipse(s.x-cx,s.y-cy,s.r*.5*k,s.r*.2*k,0,0,6.3);c.fill();c.restore();
    const im=wImg.hammer;if(im.complete){c.save();c.translate(x,y);c.rotate(Math.PI*(.2+k*.8));c.globalAlpha=s.ghost?.5:1;DW(c,im,22);c.restore()}continue}
   if(s.k==='wave'){const k=Math.min(1,s.t/s.d),im=GX['w'+Math.min(3,Math.floor(k*4))],rr=s.r*k;if(im.complete){c.save();c.globalAlpha=1-k*.5;c.drawImage(im,hero.x-cx-rr,hero.y-cy-8-rr*.8,rr*2,rr*1.6);c.restore()}continue}
   if(s.k==='tet'){const k=Math.min(1,s.t/s.d),im=GX.tet;if(im.complete){const h=22,w=im.width*h/im.height;c.drawImage(im,s.x-cx-w/2,s.y-cy-h-70*(1-k),w,h)}continue}
   if(s.k==='fire'){const x=s.x-cx,y=s.y-cy;c.fillStyle='rgba(255,140,40,.5)';c.beginPath();c.arc(x-s.dx*4,y-s.dy*4,3,0,6.3);c.fill();c.fillStyle='#ffcf5a';c.beginPath();c.arc(x,y,2.6,0,6.3);c.fill();c.fillStyle='#fff6d0';c.fillRect(x-1,y-1,2,2);continue}
   if(s.k==='axe'){const im=wImg.axe;if(im&&im.complete){c.save();c.translate(s.x-cx,s.y-cy);c.rotate(performance.now()/60);DW(c,im,14);c.restore()}continue}
   if(s.k==='knife'){c.save();c.translate(s.x-cx,s.y-cy);c.rotate(Math.atan2(s.dy,s.dx));c.fillStyle='#d9dee6';c.fillRect(-2,-1,7,2);c.fillStyle='#6b4a2a';c.fillRect(-5,-1,3,2);c.restore();continue}
   if(s.k==='note'&&s.mis){const x=s.x-cx,y=s.y-cy;c.fillStyle='rgba(140,170,255,.45)';c.beginPath();c.arc(x,y,3.2,0,6.3);c.fill();c.fillStyle='#e6ecff';c.beginPath();c.arc(x,y,1.6,0,6.3);c.fill();continue}
   if(s.k==='note'){const im=GX[s.img];if(im.complete){const h=9,w=im.width*h/im.height;c.drawImage(im,s.x-cx-w/2,s.y-cy-h/2,w,h)}continue}
   if(s.k==='pix'){const im=GX['b'+(Math.floor(performance.now()/80)%4)];if(im.complete){c.save();c.translate(s.x-cx,s.y-cy);c.rotate(Math.atan2(s.dy,s.dx));const h=6,w=im.width*h/im.height;c.drawImage(im,-w+3,-h/2,w,h);c.restore()}continue}
   const x=s.x-cx,y=s.y-cy;c.save();c.translate(x,y);c.rotate(Math.atan2(s.dy,s.dx));
   if(s.k==='arrow'&&UI.w_arrow.complete){DA(c,UI.w_arrow,0,0,16)}else if(s.k==='bolt'&&UI.w_bolt.complete){DA(c,UI.w_bolt,0,0,11)}else if(s.k==='ice'){DA(c,UI.w_ice,0,0,13)}
   else if(s.k==='arrow'){c.strokeStyle='#e9dcc0';c.lineWidth=1;c.beginPath();c.moveTo(-8,0);c.lineTo(3,0);c.stroke();c.fillStyle='#c8ccd2';c.fillRect(3,-1,2.5,2);c.fillStyle='#c0402e';c.fillRect(-8,-1.2,2,2.4)}
   else{c.strokeStyle='#d8c39a';c.lineWidth=1.3;c.beginPath();c.moveTo(-5,0);c.lineTo(2,0);c.stroke();c.fillStyle='#aab0b8';c.fillRect(2,-1,2,2)}
   c.restore()}
  const px=hero.x-cx,py=hero.y-cy-10;
  for(const f of S.fx){f.t+=1/60;const k=f.t/f.d;if(k>=1)continue;
   if(f.k==='arc'){c.save();c.translate(px,py);c.strokeStyle=`rgba(${f.c},${.85*(1-k)})`;c.lineWidth=3*(1-k)+1;c.beginPath();c.arc(0,0,f.r*.82,f.a-f.w/2,f.a-f.w/2+f.w*Math.min(1,k*2));c.stroke();
    const im=wImg[f.img];if(im&&im.complete){const aa=f.a-f.w/2+f.w*Math.min(1,k*2);c.rotate(aa);c.translate(f.r*.55,0);c.rotate(Math.PI/2);c.globalAlpha=1-k*.6;c.rotate(-Math.PI/2);DW(c,im,9)}c.restore()}
   else if(f.k==='thrust'){c.save();c.translate(px,py+4);c.rotate(f.a);c.globalAlpha=1-k;c.fillStyle='#e9eef5';c.fillRect(6,-1,f.len*Math.min(1,k*3)-6,2);c.fillStyle='#c0402e';c.fillRect(f.len*Math.min(1,k*3)-4,-2,5,4);c.restore()}
   else if(f.k==='anim'){DA(c,UI[f.a+Math.min(3,Math.floor(k*4))],f.x-cx,f.y-cy,f.w)}
   else if(f.k==='boom'&&UI.fx_fire_0.complete){DA(c,UI['fx_fire_'+Math.min(3,Math.floor(k*4))],f.x-cx,f.y-cy,f.r*2.4)}
   else if(f.k==='boom'){const r=f.r*(.5+.5*k);c.save();c.globalAlpha=1-k;c.fillStyle='rgba(255,120,30,.45)';c.beginPath();c.ellipse(f.x-cx,f.y-cy,r,r*.7,0,0,6.3);c.fill();c.fillStyle='rgba(255,220,120,.7)';c.beginPath();c.ellipse(f.x-cx,f.y-cy,r*.5,r*.35,0,0,6.3);c.fill();c.restore()}
   else if(f.k==='bolt'){c.save();c.globalAlpha=1-k;c.strokeStyle='#cfe6ff';c.lineWidth=1.4;c.beginPath();c.moveTo(f.x0-cx,f.y0-cy);for(let i=1;i<5;i++){const t=i/5;c.lineTo(f.x0+(f.x1-f.x0)*t-cx+R(-3,3),f.y0+(f.y1-f.y0)*t-cy+R(-3,3))}c.lineTo(f.x1-cx,f.y1-cy);c.stroke();c.restore()}
   else if(f.k==='nova'){const r=f.r*k;c.save();c.globalAlpha=1-k;c.strokeStyle='#bfe8ff';c.lineWidth=3*(1-k)+1;c.beginPath();c.ellipse(px,py+10,r,r*.8,0,0,6.3);c.stroke();c.fillStyle='rgba(170,220,255,.18)';c.fill();c.restore()}
   else if(f.k==='bass'){const im=GX.bass;if(im.complete){const r=40+200*k;c.save();c.globalAlpha=1-k;c.drawImage(im,px-r,py-r*.8,r*2,r*1.6);c.restore()}}
   else if(f.k==='ring'){c.strokeStyle=`rgba(255,226,170,${1-k})`;c.lineWidth=2.5*(1-k)+.5;c.beginPath();c.ellipse(f.x-cx,f.y-cy,f.r*(.4+.6*k),f.r*(.4+.6*k)*.6,0,0,6.3);c.stroke()}}
  for(const z of S.zones||[]){const zx=(z.follow?hero.x:z.x)-cx,zy=(z.follow?hero.y:z.y)-cy;c.save();
   if(z.k==='holy'){c.globalAlpha=.32+.1*Math.sin(now/200);c.fillStyle='#fff3b0';c.beginPath();c.ellipse(zx,zy,z.r,z.r*.8,0,0,6.3);c.fill();c.globalAlpha=.7;c.strokeStyle='#ffe27a';c.lineWidth=1;c.stroke()}
   else{c.globalAlpha=Math.min(1,(z.d-z.t)*2)*.4;c.fillStyle='#7bd35a';for(let i=0;i<5;i++){const a=now/700+i*1.26;c.beginPath();c.arc(zx+Math.cos(a)*z.r*.45,zy+Math.sin(a)*z.r*.3,z.r*.55,0,6.3);c.fill()}}
   c.restore()}
  S.fx=S.fx.filter(f=>f.t<f.d);
  c.save();c.textAlign='center';
  for(const t of S.texts){t.t-=1/60;t.y-=.35;c.globalAlpha=Math.min(1,t.t*3);c.font=(t.big?'bold 9px':'7px')+' "PingFang SC","Microsoft YaHei",sans-serif';c.lineWidth=2;c.strokeStyle='rgba(0,0,0,.7)';c.strokeText(t.v,t.x-cx,t.y-cy);c.fillStyle=t.c;c.fillText(t.v,t.x-cx,t.y-cy)}
  c.restore();S.texts=S.texts.filter(t=>t.t>0);
 }
 function drawUI(c,VW,VH){
  if(window.HOUR!=null){const h=window.HOUR,t=String(Math.floor(h)).padStart(2,'0')+':00',ic=window.NIGHT?'☾':h<8?'◒':h<17?'☀':'◓';c.save();c.font='bold 8px "PingFang SC",sans-serif';c.textAlign='left';c.lineWidth=2;c.strokeStyle='rgba(0,0,0,.7)';c.fillStyle=window.NIGHT?'#a9c4ff':'#ffe08a';const s_=ic+' '+t+(window.NIGHT?'  夜晚 敌人+30%':'');c.strokeText(s_,6,VH-8);c.fillText(s_,6,VH-8);c.restore()}
  c.fillStyle='rgba(8,14,30,.75)';c.fillRect(0,0,VW,5);c.fillStyle='#5ab0ff';c.fillRect(0,0,VW*Math.min(1,S.xp/S.need),5);
  let x=VW/2-((Object.keys(S.w).length)*15)/2;c.font='bold 8px "PingFang SC","Microsoft YaHei",sans-serif';c.textAlign='right';c.lineWidth=2;c.strokeStyle='rgba(0,0,0,.7)';c.strokeText('Lv '+S.lv,x-4,18);c.fillStyle='#fff';c.fillText('Lv '+S.lv,x-4,18);c.textAlign='left';
  for(const k in S.w){c.fillStyle='rgba(8,14,30,.6)';c.fillRect(x,8,13,15);const im=HI[k]||wImg[k];if(!im){c.fillStyle='#ffd166';c.font='bold 8px "PingFang SC",sans-serif';c.fillText(WEAPONS[k].name[0],x+2.5,19)}else if(im.complete){const s=Math.min(11/im.width,13/im.height);c.drawImage(im,x+6.5-im.width*s/2,9,im.width*s,im.height*s)}c.fillStyle='#ffd166';c.font='6px monospace';c.fillText(S.w[k],x+9,22);x+=15}
  if(S.banner){c.save();c.globalAlpha=Math.min(1,S.banner.t*2);c.textAlign='center';c.font='bold 11px "PingFang SC","Microsoft YaHei",sans-serif';c.lineWidth=3;c.strokeStyle='rgba(0,0,0,.75)';c.strokeText(S.banner.v,VW/2,48);c.fillStyle='#ffd166';c.fillText(S.banner.v,VW/2,48);c.restore()}
  c.textAlign='start'}
 return {dbg:{get S(){return S},WEAPONS,PASSIVES,levelUp(){S.xp=S.need;S.lastLv=-9},maxAll(){for(const k of Object.keys(S.w).concat(S.deck))S.w[k]=MAXL;for(const k in PASSIVES)S.p[k]=PASSIVES[k].max},skip(sec){S.t+=sec}},reset,update,onSpawn,onKill,drawWorld,drawUI,want:()=>S?want():16,get paused(){return !!S&&S.paused},get armor(){return 0},pickKind:()=>S?pickKind():'goblin',get spawnR(){return S&&S.t<45?.75:1},get armPct(){return S?S.B.arm+.05*S.p.armor:0},dodge(){if(S&&S.p.dodge&&Math.random()<.05*S.p.dodge){S.texts.push({x:hero.x,y:hero.y-30,v:'闪避',t:.7,c:'#bfe6ff'});return true}return false},get iframe(){return S?.75+.2*S.p.tough:.75},useRevive(){if(S&&S.rev>0){S.rev--;S.banner={v:'复活！',t:2.5};return true}return false},get moveMul(){return S?(window.HSLOW>performance.now()?.5:1)*(1+.08*S.p.spd+S.B.spd):1}};
}
