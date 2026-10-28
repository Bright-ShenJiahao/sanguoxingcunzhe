// 主界面独立绘制演示场景，不推进实际游戏或搜打撤计时。
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
button:focus-visible,summary:focus-visible{outline:2px solid #e9d398;outline-offset:4px}
@media(max-width:700px){#main-menu{gap:25px;padding:20px}.menu-profile{width:240px}.menu-title{font-size:36px}.menu-panel{width:310px;padding:18px}}
@media(max-width:560px){#main-menu{flex-direction:column;justify-content:flex-start;gap:24px;padding:28px 18px}.menu-profile{width:100%}.menu-title{font-size:36px;margin-bottom:18px}.menu-card{height:140px;width:200px}.menu-card canvas{height:136px;width:170px}.menu-character{margin:10px 0}.menu-panel{width:min(100%,360px)}.menu-eyebrow{margin-bottom:8px}.menu-name input{padding:9px 12px}}
`;
document.head.append(style);

export function createMenu(game){
 let visible=true;
 const root=document.createElement('main');root.id='main-menu';root.setAttribute('aria-label','游戏主界面');
 root.innerHTML=`<section class="menu-profile" aria-label="当前角色">
  <div class="menu-eyebrow">无名之辈 · 外传</div><h1 class="menu-title">三国幸存者</h1>
  <div class="menu-card"><canvas width="200" height="160" aria-label="当前角色待机动画"></canvas></div>
  <div class="menu-character"></div><label class="menu-name">你的名字<input maxlength="20" placeholder="输入你的名字" autocomplete="nickname"></label>
 </section><nav class="menu-panel" aria-label="主菜单">
  <button class="menu-start" type="button"><span>开始游戏<small>进入三国野地</small></span><span aria-hidden="true">→</span></button>
  <h2 class="menu-section">角色</h2><div class="menu-characters"></div>
  <div class="menu-note">WASD / 方向键移动 · 靠近敌人自动攻击<br>移动端在地图上拖动即可行走</div>
 </nav>`;
 document.body.append(root);document.body.classList.remove('loading');{const bt=document.getElementById('boot');if(bt)setTimeout(()=>{bt.style.opacity='0';setTimeout(()=>bt.remove(),500)},Math.max(0,2300-performance.now()))}document.body.classList.add('menu-open');document.title='三国幸存者 · 无名之辈外传';
 const cs=document.getElementById('cs');root.querySelector('.menu-characters').append(cs);
 const input=root.querySelector('input'),caption=root.querySelector('.menu-character');
 try{input.value=localStorage.getItem('sanguo.playerName')||''}catch{/* 隐私模式仍可游玩。 */}
 input.addEventListener('input',()=>{try{localStorage.setItem('sanguo.playerName',input.value)}catch{}});
 // 阻断名字输入与菜单点击进入原来的全局移动按键处理。
 root.addEventListener('keydown',e=>e.stopPropagation());root.addEventListener('keyup',e=>e.stopPropagation());
 const preview=root.querySelector('canvas').getContext('2d');
 const KINDS=['grunt_club','blade','spear','archer','shield','blade','grunt_club','spear'];
 const actors=KINDS.map((k,i)=>({k,sx:(i-3.5)*.2,sy:((i*5)%3-1)*.2,ph:i*1.7}));
 let starting=false;
 root.querySelector('.menu-start').onclick=async()=>{
  if(starting)return;starting=true;
  try{await game.ready?.()}catch{/* 加载失败也进入游戏 */}
  starting=false;
  visible=false;root.hidden=true;document.body.classList.remove('menu-open');game.clearInput();game.fit();
  document.getElementById('cv').setAttribute('tabindex','-1');document.getElementById('cv').focus({preventScroll:true});
  game.onStart();
 };
 document.documentElement.classList.remove('menu-loading');
 return {get visible(){return visible},show(){visible=true;root.hidden=false;document.body.classList.add('menu-open');root.querySelector('.menu-start').focus()},draw(now){
  const {c,images,data,enemies}=game,t=now/1000,cv=c.canvas,HD=data.HD,WW=data.WW,WH=data.WH||WW,oy=WH/2-580,ox=WW/2-620;
  // 画布跟窗口一样大，按整数倍（和游戏内同样的像素大小）绘制，视野比游戏内更宽，背景清晰不糊。
  const dpr=Math.min(2,window.devicePixelRatio||1),W=Math.round(innerWidth*dpr),H=Math.round(innerHeight*dpr);
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
  const scale=2.6;if(image)preview.drawImage(image,100-size[0]*scale/2,145-size[1]*scale,size[0]*scale,size[1]*scale);
  caption.textContent=label;
 }};
}
