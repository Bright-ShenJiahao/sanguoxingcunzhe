import {WEAPONS,PASSIVES,POOL,PASS_KEYS} from './run.js';
// 主界面：独立绘制演示场景；备战（角色/装备/商店）→ 选关卡 → 出发。
document.documentElement.classList.add('menu-loading');
const style=document.createElement('style');
style.textContent=`
.menu-loading .wrap{visibility:hidden}
body{--fg:#edf4fa;--muted:#b2c1d0;--line:#566879;background:#101921;color:#edf4fa}
.menu-open{overflow:hidden}
.menu-open #st{position:fixed;inset:0;width:100%;height:100%;border:0;border-radius:0;aspect-ratio:auto}
.menu-open #cv{object-fit:cover}
.menu-open #st>:not(#cv),.menu-open .wrap>.sw{display:none!important}
#main-menu{position:fixed;inset:0;z-index:10;background:linear-gradient(100deg,#07101b80,#050c1670);display:flex;align-items:center;justify-content:center;gap:clamp(40px,9vw,150px);padding:32px;box-sizing:border-box;overflow:auto;color:#f5f7fb}
#main-menu[hidden]{display:none}
.menu-profile{width:300px;flex-shrink:0;text-align:center}
.menu-eyebrow{font-size:11px;letter-spacing:.45em;color:#c9d8e8;margin-bottom:12px}
.menu-title{font-family:serif;font-size:46px;letter-spacing:.08em;color:#f7d987;text-shadow:0 3px #513c1c,0 6px 20px #000;margin:0 0 28px;white-space:nowrap}
.menu-card{width:218px;height:188px;margin:auto;border:2px solid #77baff;border-radius:10px;background:radial-gradient(ellipse at 50% 95%,#37578b77,transparent 65%),#101e38bf;box-shadow:0 0 0 3px #0d1938aa,0 14px 38px #0005;display:grid;place-items:center}
.menu-card canvas{width:200px;height:160px;image-rendering:pixelated}
.menu-character{margin:15px 0 18px;font-size:15px;font-weight:600;letter-spacing:.08em}
.menu-name{display:block;text-align:left;width:222px;margin:auto;font-size:12px;color:#c0cde0}
.menu-name input{box-sizing:border-box;width:100%;margin-top:7px;padding:12px 14px;border:1px solid #729bd07a;border-radius:6px;background:#0c172ac9;color:#fff;font:16px system-ui;outline:none;user-select:text}
.menu-name input:focus{border-color:#a5d4ff;box-shadow:0 0 0 3px #73aaf526}
.menu-panel{box-sizing:border-box;width:390px;padding:25px;border:2px solid #b6d5ff;border-radius:12px;background:linear-gradient(145deg,#254f9cdd,#142858d9);box-shadow:0 0 0 3px #101c35aa,0 18px 60px #0005}
.menu-panel button{cursor:pointer;font:inherit;color:inherit}
.menu-start{display:flex;align-items:center;justify-content:space-between;width:100%;text-align:left;padding:17px 18px;margin-bottom:22px;border:1px solid #a2cbff88;border-radius:7px;background:#72a9f62b;font-size:23px!important;font-weight:700!important}
.menu-start:hover{background:#8bbcff40}
.menu-start small{display:block;font-size:12px;font-weight:400;letter-spacing:.04em;color:#d4e4fc;margin-top:5px}
.menu-section{font-size:15px;letter-spacing:.15em;margin:0 0 13px}
#main-menu #cs{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#main-menu #cs button{font-size:13px;padding:12px 8px;border:1px solid #83abe354;border-radius:5px;background:#0c225a55;text-align:left;color:#ecf5ff}
#main-menu #cs button[aria-pressed=true]{background:#77a9f044;border-color:#c1e0ff;box-shadow:inset 3px 0 #e2cb87}
.menu-note{color:#c3d3ef;font-size:12px;line-height:1.8;margin-top:20px;border-top:1px solid #9ebfe432;padding-top:16px}
#prep{position:fixed;inset:0;z-index:11;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;background:#050c1688;color:#f2f6ff;font-family:"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif}
#prep[hidden],#prep [hidden]{display:none!important}
.pp-box{width:min(760px,100%);max-height:100%;display:flex;flex-direction:column;border:2px solid #b6d5ff;border-radius:12px;background:linear-gradient(145deg,#254f9cee,#142858ee);box-shadow:0 0 0 3px #101c35aa,0 18px 60px #0007}
.pp-step{display:flex;flex-direction:column;min-height:0;padding:20px 22px}
.pp-head{display:flex;align-items:center;gap:22px;flex-wrap:wrap;margin-bottom:16px}.pp-head h2{margin:0;font-size:22px;color:#f7d987;letter-spacing:.1em}
.pp-tabs{display:flex;gap:6px}.pp-tabs button,.pp-foot button{cursor:pointer;font:inherit;color:#eaf2ff;border:1px solid #8fbbef88;border-radius:6px;background:#0c225a66;padding:8px 18px}
.pp-tabs button[aria-selected=true]{background:#77a9f055;border-color:#d8e8ff;color:#fff;box-shadow:inset 0 -3px #e2cb87}
.pp-body{min-height:300px;overflow:auto}.pp-pane[data-t=role]{display:flex;gap:18px;flex-wrap:wrap}
.pp-roles{flex:1 1 380px;min-width:0}
#prep #cs{display:grid;grid-template-columns:repeat(auto-fill,minmax(82px,1fr));gap:8px}
#prep #cs button{cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border:1px solid #83abe354;border-radius:8px;background:#0c225a66;color:#ecf5ff;font:12px inherit}
#prep #cs button img{height:44px;image-rendering:auto}
#prep #cs{grid-template-columns:1fr 1fr}#prep #cs button.big img{height:84px}#prep #cs button.big{padding:14px 6px;font-size:15px}
#prep .dk h4{margin:6px 0 6px;color:#f6db94;font-size:14px}#prep .dk h4 small{color:#9fb6d8;font-weight:400;margin-left:6px}#prep .dk .g{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
#prep .dk button{cursor:pointer;padding:6px 10px;border:1px solid #83abe354;border-radius:6px;background:#0c225a66;color:#ecf5ff;font:inherit;font-size:13px}#prep .dk button[aria-pressed=true]{background:#77a9f055;border-color:#f0dc9c;box-shadow:0 0 0 1px #e2cb87}
#prep .dk .warn{color:#ff9a8a;font-size:12px;min-height:16px}
#prep .lockrow{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:10px;color:#9fb6d8;font-size:12px}#prep .lockrow span{width:100%}
#prep .lockrow button{width:46px;padding:4px;border:1px solid #83abe333;border-radius:6px;background:#0c225a44;opacity:.45;cursor:not-allowed;color:#ccd}#prep .lockrow img{height:30px;filter:grayscale(1) brightness(.6);image-rendering:pixelated}#prep .lockrow button span{font-size:10px}
#prep #cs button[aria-pressed=true]{background:#77a9f044;border-color:#f0dc9c;box-shadow:0 0 0 2px #e2cb8788}
.pp-info{flex:0 0 200px;text-align:center;border:1px solid #9ebfe444;border-radius:10px;padding:14px;background:#0a183a66}
.pp-info canvas{width:120px;height:120px;image-rendering:pixelated}.pp-info h3{margin:6px 0 10px;color:#f7d987}.pp-info p{margin:6px 0;color:#c9d8f0;font-size:13px}
.pp-soon{display:grid;place-items:center;height:280px;color:#9fb6d8;font-size:16px;letter-spacing:.15em;border:1px dashed #9ebfe455;border-radius:10px}
.pp-stages{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;align-content:start}
.pp-stage{cursor:pointer;text-align:left;padding:18px;border:1px solid #8fbbef88;border-radius:10px;background:linear-gradient(160deg,#2f6d3aaa,#123222cc);color:#fff;font:inherit;min-height:110px}
.pp-stage b{display:block;font-size:19px;margin-bottom:8px;color:#f7d987}.pp-stage span{font-size:13px;color:#d4e4d8}
.pp-stage[aria-pressed=true]{box-shadow:0 0 0 2px #e2cb87}.pp-stage:disabled{cursor:default;background:#1a2440aa;filter:grayscale(1);opacity:.6}
.pp-foot{display:flex;justify-content:space-between;margin-top:16px}.pp-foot .pp-next,.pp-foot .pp-go{background:#e2cb8733;border-color:#f0dc9c;font-weight:700;padding:10px 26px}
@media(max-width:560px){.pp-info{flex:1 1 100%}.pp-step{padding:14px}}
button:focus-visible,summary:focus-visible{outline:2px solid #e9d398;outline-offset:4px}
@media(max-width:700px){#main-menu{gap:25px;padding:20px}.menu-profile{width:240px}.menu-title{font-size:36px}.menu-panel{width:310px;padding:18px}}
@media(max-width:560px){#main-menu{flex-direction:column;justify-content:flex-start;gap:24px;padding:28px 18px}.menu-profile{width:100%}.menu-title{font-size:36px;margin-bottom:18px}.menu-card{height:140px;width:200px}.menu-card canvas{height:136px;width:170px}.menu-character{margin:10px 0}.menu-panel{width:min(100%,360px)}.menu-eyebrow{margin-bottom:8px}.menu-name input{padding:9px 12px}}
`;
document.head.append(style);

export function createMenu(game){
 let visible=true;
 const root=document.createElement('main');root.id='main-menu';root.setAttribute('aria-label','游戏主界面');
 root.innerHTML=`<section class="menu-profile" aria-label="当前角色">
  <div class="menu-eyebrow">无名之辈 · 外传</div><h1 class="menu-title">异世界幸存者</h1>
  <div class="menu-card"><canvas width="200" height="160" aria-label="当前角色待机动画"></canvas></div>
  <div class="menu-character" hidden></div><label class="menu-name" aria-label="你的名字"><input maxlength="20" placeholder="输入你的名字" autocomplete="nickname"></label>
 </section><nav class="menu-panel" aria-label="主菜单">
  <button class="menu-start" type="button"><span>开始游戏<small>进入翠绿之地</small></span><span aria-hidden="true">→</span></button>
  <div class="menu-note">WASD / 方向键移动 · 靠近敌人自动攻击<br>移动端在地图上拖动即可行走</div>
 </nav>`;
 document.body.append(root);document.body.classList.remove('loading');{const bt=document.getElementById('boot');if(bt){const go=()=>{if(performance.now()<(window.BOOT_MIN??2300)){setTimeout(go,100);return}bt.style.opacity='0';setTimeout(()=>bt.remove(),500)};go()}}document.body.classList.add('menu-open');document.title='异世界幸存者 · 无名之辈外传';
 const cs=document.getElementById('cs');
 const input=root.querySelector('input'),caption=root.querySelector('.menu-character');
 try{input.value=localStorage.getItem('sanguo.playerName')||''}catch{/* 隐私模式仍可游玩。 */}
 input.addEventListener('input',()=>{try{localStorage.setItem('sanguo.playerName',input.value)}catch{}});
 // 阻断名字输入与菜单点击进入原来的全局移动按键处理。
 root.addEventListener('keydown',e=>e.stopPropagation());root.addEventListener('keyup',e=>e.stopPropagation());
 const preview=root.querySelector('canvas').getContext('2d');
 const KINDS=['goblin','gob_blade','gob_archer','gob_shield','goblin','gob_blade','goblin','gob_shield'];
 const actors=KINDS.map((k,i)=>({k,sx:(i-3.5)*.2,sy:((i*5)%3-1)*.2,ph:i*1.7}));
 let starting=false;
 // ---------- 备战 → 选关卡 → 出发 ----------
 const prep=document.createElement('section');prep.id='prep';prep.hidden=true;prep.setAttribute('aria-label','备战');
 prep.innerHTML=`<div class="pp-box">
  <div class="pp-step" data-s="prep"><div class="pp-head"><h2>备战</h2><div class="pp-tabs" role="tablist"><button data-t="role" aria-selected="true">角色</button><button data-t="gear">装备</button><button data-t="shop">商店</button></div></div>
   <div class="pp-body"><div class="pp-pane" data-t="role"><div class="pp-roles"></div><div class="pp-info"><canvas width="120" height="120"></canvas><h3></h3><p class="w"></p><p class="t"></p></div></div>
    <div class="pp-pane" data-t="gear" hidden><div class="dk"></div></div>
    <div class="pp-pane" data-t="shop" hidden><div class="pp-soon">商店 · 即将开放</div></div></div>
   <div class="pp-foot"><button class="pp-back">返回</button><button class="pp-next">下一步 →</button></div></div>
  <div class="pp-step" data-s="stage" hidden><div class="pp-head"><h2>选择关卡</h2></div>
   <div class="pp-body pp-stages"><button class="pp-stage" aria-pressed="true"><b>翠绿之地</b><span>森林、平原、水乡 · 哥布林出没</span></button><button class="pp-stage" disabled><b>冰原</b><span>未解锁</span></button><button class="pp-stage" disabled><b>？？？</b><span>未解锁</span></button></div>
   <div class="pp-foot"><button class="pp-back">返回</button><button class="pp-go">出发 →</button></div></div></div>`;
 document.body.append(prep);
 prep.addEventListener('keydown',e=>e.stopPropagation());
 // ---------- 键盘操作：方向键在按钮间移动，回车/空格确认，Esc 返回 ----------
 function navKeys(e){const box=!prep.hidden?prep:!root.hidden?root:document.getElementById('lvup')?.hidden===false?document.getElementById('lvup'):null;if(!box)return;
  const K={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]}[e.key];
  if(e.key==='Escape'&&box===prep){const b=[...prep.querySelectorAll('.pp-back')].find(x=>x.offsetParent);if(b){b.click();e.preventDefault()}return}
  const bsAll=[...box.querySelectorAll('button:not([disabled])')].filter(b=>b.offsetParent);
  if((e.key==='Enter'||e.key===' ')&&!bsAll.includes(document.activeElement)&&document.activeElement?.tagName!=='INPUT'){const pr=[...box.querySelectorAll('.menu-start,.pp-go,.pp-next,button.card')].find(b=>b.offsetParent);if(pr){e.preventDefault();pr.click();setTimeout(()=>{const nb=[...document.querySelectorAll('#prep .pp-step:not([hidden]) .pp-next,#prep .pp-step:not([hidden]) .pp-go')].find(b=>b.offsetParent);nb?.focus()},50)}return}
  if(!K)return;if(document.activeElement?.tagName==='INPUT'&&K[0])return;
  const bs=[...box.querySelectorAll('button:not([disabled])')].filter(b=>b.offsetParent);if(!bs.length)return;e.preventDefault();
  const cur=bs.includes(document.activeElement)?document.activeElement:null;if(!cur){bs[0].focus();return}
  const r=cur.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let best=null,bd=1e9;
  for(const b of bs){if(b===cur)continue;const q=b.getBoundingClientRect(),dx=q.left+q.width/2-cx,dy=q.top+q.height/2-cy,along=dx*K[0]+dy*K[1];if(along<=4)continue;const side=Math.abs(dx*K[1]-dy*K[0]);const d=along+side*2.5;if(d<bd){bd=d;best=b}}
  if(best)best.focus()}
 addEventListener('keydown',navKeys,true);
 const fs=document.createElement('style');fs.textContent='#prep button:focus-visible,#main-menu button:focus-visible,#lvup button:focus-visible{outline:2px solid #f6db94;outline-offset:2px}';document.head.append(fs);prep.addEventListener('keyup',e=>e.stopPropagation());
 const roles=prep.querySelector('.pp-roles');roles.append(cs);
 const thumb=b=>{const c=b.dataset.c;return c==='m'?'assets/characters/hero_b/w0.png':c[0]==='m'?`assets/characters/hero_m/r${+c[1]-1}_w0.png`:`assets/characters/heroine/r${c[1]}_w0.png`};
 cs.querySelectorAll('button').forEach(b=>{const im=new Image();im.src=thumb(b);im.alt='';const t=document.createElement('span');const main=b.dataset.c==='m'||b.dataset.c==='f0';
  t.textContent=main?(b.dataset.c==='m'?'男 · 掌机':'女 · 耳机'):'🔒';b.textContent='';b.append(im,t);
  if(main)b.classList.add('big');else{b.disabled=true;b.classList.add('lock');b.title='后期解锁（商店 / 成就）'}});

 const step=s=>{prep.querySelectorAll('.pp-step').forEach(x=>x.hidden=x.dataset.s!==s);setTimeout(()=>prep.querySelector(`.pp-step[data-s=${s}] .pp-next,.pp-step[data-s=${s}] .pp-go`)?.focus(),30)};
 prep.querySelectorAll('.pp-tabs button').forEach(b=>b.onclick=()=>{prep.querySelectorAll('.pp-tabs button').forEach(x=>x.setAttribute('aria-selected',x===b));prep.querySelectorAll('.pp-pane').forEach(p=>p.hidden=p.dataset.t!==b.dataset.t)});
 prep.querySelector('[data-s=prep] .pp-back').onclick=()=>{prep.hidden=true;root.hidden=false;root.querySelector('.menu-start').focus()};
 // ---------- 卡组：5 武器 + 5 法术（必须选满），锁定 2 个被动 ----------
 const dk=prep.querySelector('.dk');let deck;try{deck=JSON.parse(localStorage.getItem('deck')||'null')}catch(e){}
 if(!deck||!Array.isArray(deck.w))deck={w:POOL.w.slice(0,5),s:POOL.s.slice(0,5),lock:[]};deck.lock=deck.lock||[];
 const LIM={w:5,s:5,lock:2};
 function drawDeck(){const row=(key,list,names,title,tip)=>`<h4>${title}<small>${deck[key].length}/${LIM[key]} ${tip}</small></h4><div class="g">${list.map(k=>`<button data-k="${key}" data-v="${k}" aria-pressed="${deck[key].includes(k)}">${names(k)}</button>`).join('')}</div>`;
  dk.innerHTML=row('w',POOL.w,k=>WEAPONS[k].name,'武器','必须选满')+row('s',POOL.s,k=>WEAPONS[k].name,'法术','必须选满')+row('lock',PASS_KEYS,k=>PASSIVES[k].name,'锁定被动','这局一定会出现，其余随机 '+(10-deck.lock.length)+' 个')+'<div class="warn"></div>';
  dk.querySelectorAll('button').forEach(b=>b.onclick=()=>{const a=deck[b.dataset.k],v=b.dataset.v,i=a.indexOf(v);if(i>=0)a.splice(i,1);else if(a.length<LIM[b.dataset.k])a.push(v);try{localStorage.setItem('deck',JSON.stringify(deck))}catch(e){}drawDeck()})}
 drawDeck();
 prep.querySelector('.pp-next').onclick=()=>{if(deck.w.length<5||deck.s.length<5){prep.querySelector('.pp-tabs [data-t=gear]').click();dk.querySelector('.warn').textContent='武器和法术都要选满 5 个才能出发';return}try{localStorage.setItem('deck',JSON.stringify(deck))}catch(e){}step('stage')};
 prep.querySelector('[data-s=stage] .pp-back').onclick=()=>step('prep');
 const info=prep.querySelector('.pp-info'),ipv=info.querySelector('canvas').getContext('2d');
 root.querySelector('.menu-start').onclick=()=>{root.hidden=true;prep.hidden=false;step('prep');prep.querySelector('.pp-next').focus()};
 prep.querySelector('.pp-go').onclick=async()=>{
  if(starting)return;starting=true;prep.hidden=true;
  try{await game.ready?.()}catch{/* 加载失败也进入游戏 */}
  starting=false;
  visible=false;root.hidden=true;document.body.classList.remove('menu-open');game.clearInput();game.fit();
  document.getElementById('cv').setAttribute('tabindex','-1');document.getElementById('cv').focus({preventScroll:true});
  game.onStart();
 };
 document.documentElement.classList.remove('menu-loading');
 return {get visible(){return visible},show(){visible=true;root.hidden=false;prep.hidden=true;document.body.classList.add('menu-open');root.querySelector('.menu-start').focus()},draw(now){
  const {c,images,data,enemies}=game,t=now/1000,cv=c.canvas,HD=data.HD,WW=data.WW,WH=data.WH||WW,oy=WH/2-580,ox=WW/2-620;
  // 画布跟窗口一样大，按整数倍（和游戏内同样的像素大小）绘制，视野比游戏内更宽，背景清晰不糊。
  const dpr=Math.min(1.5,window.devicePixelRatio||1),W=Math.round(innerWidth*dpr),H=Math.round(innerHeight*dpr);
  if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}
  const S=Math.max(HD*dpr,W/WW,H/WW),vw=W/S,vh=H/S;
  const mx=ox+620+Math.sin(t/30)*110,my=oy+580+Math.cos(t/37)*95;
  const cx=Math.max(0,Math.min(WW-vw,mx-vw/2)),cy=Math.max(0,Math.min(WH-vh,my-vh/2));
  c.setTransform(S,0,0,S,0,0);c.imageSmoothingEnabled=true;
  game.drawGround(c,cx,cy,vw,vh,0,0,vw,vh);
  const items=game.objects.filter(o=>o.x>cx-80&&o.x<cx+vw+80&&o.y>cy&&o.y<cy+vh+120).map(o=>({y:o.y,draw(){c.imageSmoothingEnabled=true;c.drawImage(images['s_'+o.k],o.x-cx-o.w/2,o.y-cy-o.h,o.w,o.h)}}));
  for(const [i,a] of actors.entries()){
   const wx=mx+a.sx*vw+Math.sin(t/5+a.ph)*55,wy=my+a.sy*vh+Math.cos(t/6+a.ph)*22;
   const face=Math.cos(t/5+a.ph)>=0?1:-1,fr=enemies[a.k].frames['walk'+(Math.floor(t*9+i)%6)],im=images['en_'+a.k+'_walk'+(Math.floor(t*9+i)%6)];
   items.push({y:wy,draw(){c.save();c.translate(Math.round(wx-cx),Math.round(wy-cy));c.scale(face,1);c.imageSmoothingEnabled=false;c.drawImage(im,-fr.anchor[0],-fr.anchor[1],fr.size[0],fr.size[1]);c.restore()}});
  }
  items.sort((a,b)=>a.y-b.y).forEach(item=>item.draw());
  const {image,size,label}=game.character(Math.floor(now/650)%2);
  preview.clearRect(0,0,200,160);preview.imageSmoothingEnabled=false;
  const scale=2.6;preview.imageSmoothingEnabled=true;preview.imageSmoothingQuality='high';if(image)preview.drawImage(image,100-size[0]*scale/2,145-size[1]*scale,size[0]*scale,size[1]*scale);
  caption.textContent=label;
  if(!prep.hidden){info.querySelector('h3').textContent=label;{const f=(document.querySelector('#cs button[aria-pressed=true]')?.dataset.c||'m')[0]==='f';info.querySelector('.w').textContent=f?'专属武器：耳机（声波圈）':'专属武器：掌机（像素光弹）';info.querySelector('.t').textContent=f?'特性：拾取范围 +25%':'特性：经验 +10%'}ipv.clearRect(0,0,120,120);ipv.imageSmoothingEnabled=true;if(image){const s2=3.4;ipv.drawImage(image,60-size[0]*s2/2,112-size[1]*s2,size[0]*s2,size[1]*s2)}}
 }};
}
