
import {createMenu} from './menu.js';
import {createSurvival} from './survival.js';
import {createEnemies} from './enemies.js';
import {createAudio} from './audio.js';
const SFX=window.SFX=createAudio();
import {createPathing} from './pathing.js';
let PATH=null;window.PATHDIR=(x,y)=>PATH?.dir(x,y);window.PATHDBG=()=>PATH?.dbg();window.PATHAT=(x,y)=>PATH?PATH.at(x,y):-1;
import {createWeather} from './weather.js';
import {createRun} from './run.js';
import {createDebug} from './debug.js';
const [W,CH,ED]=await Promise.all(['data/world.json','data/characters.json','data/enemies.json'].map(u=>fetch(u).then(r=>r.json())));
const HN=await fetch('data/heroine.json').then(r=>r.json());
const HM=await fetch('data/hero_m.json').then(r=>r.json());
const D={...W,...CH,gt:W.tiles.list||[0,1].flatMap(y=>[0,1].map(x=>'g'+x+y)),coll:'assets/map/coll.png?v='+W.ver,
 spr:Object.fromEntries(Object.keys(W.size).map(k=>[k,'assets/map/sprites/'+k+'.png']))};
const cv=document.getElementById('cv'),c=cv.getContext('2d'),WW=D.WW,WH=D.WH||D.WW,HD=D.HD;
let VW=480,VH=300,SC=HD;
function fit(){const dpr=Math.min(1.5,devicePixelRatio||1),k=Math.max(1,Math.min(4,Math.round(innerHeight/380),Math.min(innerWidth,innerHeight)/320));/* 短边至少看到约 320 逻辑像素 */const W=Math.round(innerWidth*dpr),H=Math.round(innerHeight*dpr);if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}SC=k*dpr;VW=W/SC;VH=H/SC}
addEventListener('resize',()=>{if(!menu?.visible)fit()});
const $=id=>document.getElementById(id);
const keys={};let joy=null;
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=1;if(e.key.startsWith('Arrow'))e.preventDefault()});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=0});
const st=$('st');
// 虚拟摇杆（王者荣耀式）：按下处出现圆盘，拖动小圆控制方向，松手消失
const JR=56,jb=document.createElement('div'),jk=document.createElement('div');
jb.style.cssText=`position:fixed;width:${JR*2}px;height:${JR*2}px;margin:-${JR}px 0 0 -${JR}px;border-radius:50%;background:rgba(20,30,40,.28);border:2px solid rgba(255,255,255,.45);pointer-events:none;z-index:40;display:none`;
jk.style.cssText='position:absolute;left:50%;top:50%;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(255,255,255,.7);box-shadow:0 2px 6px #0006';jb.append(jk);document.body.append(jb);
st.addEventListener('pointerdown',e=>{if(window.DBG&&document.body.style.cursor)return;st.setPointerCapture(e.pointerId);joy={x:e.clientX,y:e.clientY,dx:0,dy:0};jb.style.left=e.clientX+'px';jb.style.top=e.clientY+'px';jk.style.transform='';jb.style.display='block'});
st.addEventListener('pointermove',e=>{if(!joy)return;let dx=e.clientX-joy.x,dy=e.clientY-joy.y;const L=Math.hypot(dx,dy);if(L>JR){dx*=JR/L;dy*=JR/L}joy.dx=dx;joy.dy=dy;jk.style.transform=`translate(${dx}px,${dy}px)`});
['pointerup','pointercancel'].forEach(n=>st.addEventListener(n,()=>{joy=null;jb.style.display='none'}));
const ov={cld:true,fp:true};
const IM={};let left=0;
let tot=0;const BAD=[];function ld(k,s,tr=0){if(!tr){left++;tot++}const i=new Image();i.crossOrigin='anonymous';i.onload=()=>{IM[k]=i;const b=document.getElementById('bootbar');if(b)b.style.width=Math.round((tot-left+1)/tot*100)+'%';if(--left==0)start()};
 i.onerror=()=>{if(tr<2){setTimeout(()=>ld(k,s,tr+1),600*(tr+1));return}BAD.push(s);console.warn('加载失败',s);const t=document.querySelector('#boot,.boot,#loading');if(t)t.setAttribute('data-err',BAD.join(' '));if(--left==0)start()};i.src=s}
D.hb.forEach((u,i)=>ld('hb_'+i,u));for(const k in D.wp)ld('wp_'+k,D.wp[k]);for(const k of D.gt)ld(k,'assets/map/'+k+'.jpg?v='+W.ver);left++;tot++;fetch(D.coll).then(r=>r.blob()).then(b=>{const i=new Image();i.onload=()=>{IM.coll=i;if(--left==0)start()};i.src=URL.createObjectURL(b)});   // 碰撞图走 blob，避免跨域污染画布（试玩网址）
for(const k in D.spr)ld('s_'+k,D.spr[k]);
for(const k in ED)for(const name in ED[k].frames)ld('en_'+k+'_'+name,ED[k].frames[name].src);
ld('wp_xbow','assets/characters/hero_b/weapons/xbow.png');
// 发型按需下载：选中哪一套才加载哪一套（女主 5 套×9 帧，男主 4 套×8 帧）
const rowP={};
function loadSet(cs){
 if(rowP[cs])return rowP[cs];
 const f=cs[0]=='f',r=+cs[1]-(f?0:1),n=f?(HN.rows[r].n||9):8,pre=f?'hh':'hm',dir=f?'heroine':'hero_m';
 return rowP[cs]=Promise.all(Array.from({length:n},(_,i)=>new Promise(res=>{const m=new Image();m.onload=()=>{IM[pre+r+'_'+i]=m;res()};m.onerror=res;m.src='assets/characters/'+dir+'/r'+r+'_w'+i+'.png'})))}
const needLoad=()=>CS!=='m';

for(let i=0;i<8;i++)ld('hbg_'+i,'assets/characters/hero_b/g_w'+i+'.png');
let CS=(()=>{try{return localStorage.getItem('sex')==='f'?'f0':'m'}catch(e){return 'm'}})();const SETS={m:{pre:'hb_',gpre:'hbg_',size:D.hbsize,grip:D.grip,walk:[2,3,4,5,6,7]}};
for(let r=0;r<HM.rows.length;r++){const z=HM.rows[r].size||HM.size;SETS['m'+(r+1)]={pre:'hm'+r+'_',size:[z[0]/2,z[1]/2],grip:HM.rows[r],walk:[2,3,4,5,6,7]}};
for(let r=0;r<HN.rows.length;r++)SETS['f'+r]={pre:'hh'+r+'_',size:(z=>[z[0]/2,z[1]/2])(HN.rows[r].size||HN.size),grip:HN.rows[r],walk:HN.rows[r].n===8?[2,3,4,5,6,7]:[2,3,4,5,6,7,8]};
const GI={gb:new Image(),hp:new Image()};GI.gb.src='assets/weapons/gear/gb.png';GI.hp.src='assets/weapons/gear/hp_f.png';
let hairG=false,weaponAttack=null,pj=[],CM,mmc,wpm='short';const R=D.coll_r;
const objs=D.objs.map(([k,x,y])=>({k,x,y,a:1,w:D.size[k][0],h:D.size[k][1],r:R[k]||0}));
const QP=new URLSearchParams(location.search);const AT=QP.get('x')?[+QP.get('x')/D.WW,+QP.get('y')/D.WH]:({n:[.8,.15],s:[.85,.85],w:[.15,.2],e:[.95,.6],sw:[.15,.85]})[QP.get('at')]||[D.spawn[0]/D.WW,D.spawn[1]/D.WH];
const region=(x,y)=>{const [gw,gh]=D.rgrid||[64,64],i=D.rmap[Math.min(gh-1,Math.max(0,Math.floor(y/D.WH*gh)))*gw+Math.min(gw-1,Math.max(0,Math.floor(x/D.WW*gw)))];return D.rnames[i]};
const hero={x:WW*AT[0],y:WH*AT[1],face:1};const CO=objs.filter(o=>o.r);
function water(x,y){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=WW||y>=WH)return 1;return CM[(y*WW+x)*4]}
function blocked(x,y){
 if(water(x,y)===1||water(x-3,y)===1||water(x+3,y)===1||water(x,y-2)===1)return true;
 for(const o of CO){const dx=x-o.x,dy=(y-o.y)*1.3;if(dx*dx+dy*dy<(o.r+3)*(o.r+3))return true}return false}
const ok=(x,y)=>!blocked(x,y);
const HK=+(new URLSearchParams(location.search).get('hk')||1);let nextAtk=0;
function drawHero(px,py,moving,now){
 const ST=SETS[CS],f=moving?ST.walk[Math.floor(now/105)%ST.walk.length]:Math.floor(now/650)%2,im=IM[(hairG&&ST.gpre?ST.gpre:ST.pre)+f],[w,h]=ST.size;c.save();c.translate(px,py);c.scale(hero.face*HK,HK);c.imageSmoothingEnabled=false;
 const RH=ST.grip.front,FH=ST.grip.front,tl=p=>[(p[0]-ST.size[0])/2,(p[1]-ST.size[1]*2)/2];
 const wi=IM['wp_'+wpm],T=weaponAttack?Math.min(1,(now-weaponAttack.t0)/weaponAttack.dur):0,sw=Math.min(1,T*1.25);
 if(wpm=='long'&&!weaponAttack){c.save();c.translate(-3,-12);c.rotate(-.5);c.scale(.5,.5);c.drawImage(wi,-wi.width/2,-wi.height/2);c.restore()}
 c.drawImage(im,-w/2,-h,w,h);
 if(wpm=='long'&&weaponAttack){const p=tl(FH[f]),pt=Math.sin(T*Math.PI)*10;c.save();c.translate(p[0]-6,p[1]);c.rotate(1.47);c.translate(0,-pt);c.scale(.5,.5);c.drawImage(wi,-wi.width/2,-wi.height*.55);c.restore()}
 if(wpm=='short'){const p=tl(RH[f]);c.save();c.translate(p[0],p[1]);c.rotate(weaponAttack?-1.1+2.5*sw:.62);c.scale(.5,.5);c.drawImage(wi,-3.04,-28*.85);c.restore();
  if(weaponAttack&&T>.25&&T<.85){const q=(T-.25)/.6;c.strokeStyle='rgba(255,255,255,'+.75*(1-q)+')';c.lineWidth=1.5;c.beginPath();c.arc(p[0]+3,p[1]-4,15,-1.2,-1.2+2.6*Math.min(1,q*1.6));c.stroke()}}
 if(wpm=='bow'){const p=tl(FH[f]);c.save();c.translate(p[0]+.5+(weaponAttack?3:0),p[1]-.5);c.scale(-.5,.5);c.drawImage(wi,-wi.width/2,-wi.height/2);c.scale(-2,2);
  if(weaponAttack&&T<.62){const pull=Math.min(1,T/.5)*5;c.strokeStyle='#e8dcc0';c.lineWidth=.8;c.beginPath();c.moveTo(-pull,0);c.lineTo(8-pull,0);c.stroke();c.fillStyle='#bbb';c.fillRect(8-pull,-.6,1.6,1.2)}c.restore()}
 if(wpm=='xbow'){const p=tl(FH[f]),rc=weaponAttack?Math.max(0,.3-Math.abs(T-.5))*-6:0;c.save();c.translate(p[0]+2+rc,p[1]-1);c.rotate(1.57);c.scale(.5,.5);c.drawImage(wi,-wi.width/2,-wi.height/2);c.restore()}
 if(wpm=='magic'){const bob=Math.sin(now/380)*1.3;c.save();c.translate(-11,-19+bob);c.scale(.5,.5);c.globalAlpha=.97;c.drawImage(wi,-wi.width/2,-wi.height/2);c.restore()}
 c.restore()}
const en=[];let kills=0,fx=[];
const enemySystem=createEnemies({data:ED,images:IM,hero,ok,water,onHit:amount=>{SFX.hurt();survival?.damage(Math.max(1,amount-(run?.armor||0)))}});
function hitEnemy(e,now,dx,dmg=1){if(enemySystem.hit(e,dmg))fx.push({x:e.x,y:e.y,t:now,dx})}
function spawn(){if(window.DBG?.noMob)return;for(let n=0;n<30;n++){const a=Math.random()*6.28,r=(Math.hypot(VW,VH)/2+20+Math.random()*90)*(run?.spawnR||1),x=hero.x+Math.cos(a)*r,y=hero.y+Math.sin(a)*r;
 if(x<30||y<30||x>WW-30||y>WH-30||!ok(x,y))continue;const e=enemySystem.make(x,y,run?.pickKind());run?.onSpawn(e);en.push(e);return}}
let fish=null;const deepAt=(x,y,r)=>x>2100&&y>WH-1000&&[[0,0],[r,0],[-r,0],[0,r*.6],[0,-r*.6]].every(([a,b])=>water(x+a,y+b)===1);
let last=0,mm,rip=[],fp=[],fpl={x:0,y:0},fpside=1,cloud;
function mkCloud(){const n=96,g=[];for(let i=0;i<64;i++)g.push(Math.random());const v=(x,y)=>{const fx=x/n*8,fy=y/n*8,x0=Math.floor(fx),y0=Math.floor(fy),tx=fx-x0,ty=fy-y0,s=t=>t*t*(3-2*t),q=(a,b)=>g[((b%8+8)%8)*8+((a%8+8)%8)];const a=q(x0,y0)*(1-s(tx))+q(x0+1,y0)*s(tx),b=q(x0,y0+1)*(1-s(tx))+q(x0+1,y0+1)*s(tx);return a*(1-s(ty))+b*s(ty)};
 cloud=document.createElement('canvas');cloud.width=n;cloud.height=n;const x=cloud.getContext('2d'),im=x.createImageData(n,n);for(let j=0;j<n;j++)for(let i=0;i<n;i++){const val=v(i,j)*.7+v(i*2,j*2)*.3,a=Math.max(0,Math.min(1,(val-.5)/.22))*.26;const k=(j*n+i)*4;im.data[k]=18;im.data[k+1]=40;im.data[k+2]=28;im.data[k+3]=a*255}x.putImageData(im,0,0)}
function start(){const t=document.createElement('canvas');t.width=WW;t.height=WH;const x=t.getContext('2d');x.drawImage(IM.coll,0,0);CM=x.getImageData(0,0,WW,WH).data;
 {const mm=$('mm');mm.height=Math.round(84*WH/WW);mm.style.setProperty('--mma',WW/WH)}
 mmc=document.createElement('canvas');mmc.width=84;mmc.height=Math.round(84*WH/WW);{const g=mmc.getContext('2d');const T=D.tiles.T,s=mmc.width/WW;for(const k of D.gt){const im=IM[k];g.drawImage(im,+k[1]*T*s,+k[2]*T*s,im.width/HD*s,im.height/HD*s)}}
 document.querySelectorAll('#cs button').forEach(b=>{b.setAttribute('aria-pressed',b.dataset.c===CS);b.onclick=()=>{if(b.disabled)return;CS=b.dataset.c;try{localStorage.setItem('sex',CS[0])}catch(e){}if(needLoad())loadSet(CS);document.querySelectorAll('#cs button').forEach(x=>x.setAttribute('aria-pressed',x===b))}});if(CS!=='m'&&needLoad())loadSet(CS);
 mkCloud();
 menu=createMenu({c,images:IM,data:D,drawGround,objects:objs,enemies:ED,
  character(frame){const s=SETS[CS];return {image:IM[(hairG&&s.gpre?s.gpre:s.pre)+frame],size:s.size,label:document.querySelector('#cs button[aria-pressed="true"]').textContent}},
  clearInput(){joy=null;for(const k in keys)keys[k]=0},ready:()=>needLoad()?loadSet(CS):Promise.resolve(),fit,onStart(){survival.start();portal={x:hero.x+14,y:hero.y-2,t:performance.now()}}
 });
 survival=createSurvival({hero,enemies:en,get kills(){return kills},
  clearInput(){joy=null;for(const k in keys)keys[k]=0},home(){menu.show()},
  reset(){run.reset(CS[0]==='f'?'hp':'gb');hero.x=WW*AT[0];hero.y=WH*AT[1];hero.face=1;kills=0;en.length=0;enemySystem.reset();weaponAttack=null;pj=[];fx=[];rip=[];fp=[];nextAtk=0;wpm=CS[0]==='f'?'hp':'gb';joy=null;for(const k in keys)keys[k]=0}
 });run=createRun({hero,en,images:IM,survival,ok,makeEnemy:(x,y,k)=>enemySystem.make(x,y,k),hitEnemy:(e,v,dir)=>hitEnemy(e,performance.now(),dir,v)});dbg=createDebug({world:D,hero,en,run,survival,weather,hit:(e,v)=>hitEnemy(e,performance.now(),1,v)});dbg?.show(false);requestAnimationFrame(loop)}
function drawGroundRaw(ctx,sx,sy,sw,sh,dx,dy,dw,dh){const T=D.tiles.T,z=dw/sw;for(const k of D.gt){const x0=+k[1]*T,y0=+k[2]*T,a=Math.max(sx,x0),b=Math.min(sx+sw,x0+T,WW),c0=Math.max(sy,y0),c1=Math.min(sy+sh,y0+T,WH);if(b<=a||c1<=c0)continue;const ex=b<sx+sw&&b<WW?.5:0,ey=c1<sy+sh&&c1<WH?.5:0;ctx.drawImage(IM[k],(a-x0)*HD,(c0-y0)*HD,(b-a+ex)*HD,(c1-c0+ey)*HD,dx+(a-sx)*z,dy+(c0-sy)*z,(b-a+ex)*z,(c1-c0+ey)*z)}}
// 地面缓存：按当前屏幕缩放把地面切成 256 格的小块，各缩放一次存起来，之后每帧原样贴（画面不变，省显卡）
const GC=new Map(),GCH=256;
function gChunk(i,j,s){const key=i+','+j+','+s;let e=GC.get(key);if(e){GC.delete(key);GC.set(key,e);return e}
 const n=Math.ceil(GCH*s),cv2=document.createElement('canvas');cv2.width=n;cv2.height=n;const g=cv2.getContext('2d');g.imageSmoothingQuality='high';
 drawGroundRaw(g,i*GCH,j*GCH,GCH,GCH,0,0,n,n);GC.set(key,cv2);if(GC.size>48)GC.delete(GC.keys().next().value);return cv2}
function drawGround(ctx,sx,sy,sw,sh,dx,dy,dw,dh){const m=ctx.getTransform(),s=+(m.a*dw/sw).toFixed(3);
 if(m.b||m.c||s>8){drawGroundRaw(ctx,sx,sy,sw,sh,dx,dy,dw,dh);return}
 const ox=m.e+dx*m.a,oy=m.f+dy*m.d;ctx.save();ctx.setTransform(1,0,0,1,0,0);
 for(let j=Math.max(0,Math.floor(sy/GCH));j*GCH<Math.min(WH,sy+sh);j++)for(let i=Math.max(0,Math.floor(sx/GCH));i*GCH<Math.min(WW,sx+sw);i++)
  ctx.drawImage(gChunk(i,j,s),Math.round(ox+(i*GCH-sx)*s),Math.round(oy+(j*GCH-sy)*s));
 ctx.restore()}
let menu,survival,run,dbg,portal=null;const weather=createWeather();
function contact(x,y,w){c.fillStyle='rgba(18,40,20,.2)';c.beginPath();c.ellipse(x,y-1,w*.4,2.2,0,0,6.3);c.fill()}
let flT=0;function loop(now){if(now-flT<(menu?.visible?32:15.5)){requestAnimationFrame(loop);return}flT=now;   // 锁帧：游戏 60、菜单 30

 const dt=Math.min(.05,(now-last)/1000||0);last=now;
 dbg?.show(!menu?.visible);
 SFX.setMode(menu?.visible?'menu':en.some(e=>e.boss&&!e.dead)?'boss':'game');SFX.setIntensity(en.length/180);
 if(menu?.visible){menu.draw(now);requestAnimationFrame(loop);return}
 if(CM){PATH??=createPathing(WW,WH,ok);PATH.update(hero.x,hero.y,now)}
 if(survival?.finished){requestAnimationFrame(loop);return}
 const pz=run?.paused,gdt=pz?0:dt;
 c.setTransform(SC,0,0,SC,0,0);
 let dx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),dy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
 if(joy){const L=Math.hypot(joy.dx,joy.dy);if(L>8){dx=joy.dx/L;dy=joy.dy/L}}
 if(pz){dx=0;dy=0}
 const L=Math.hypot(dx,dy),moving=L>0;if(moving){dx/=L;dy/=L;if(dx)hero.face=dx>0?1:-1}
 const wg=water(hero.x,hero.y),inSh=wg===2;
 const sp=72*gdt*(run?.moveMul||1)*(inSh?.55:wg===3?.6:1);let nx=Math.min(WW-14,Math.max(14,hero.x+dx*sp)),ny=Math.min(WH-10,Math.max(14,hero.y+dy*sp));
 if(ok(nx,hero.y))hero.x=nx;if(ok(hero.x,ny))hero.y=ny;
 if(inSh&&moving&&Math.random()<dt*7)rip.push({x:hero.x,y:hero.y,t:now});
 enemySystem.update(en,gdt,1);
 for(let i=0;i<en.length;i++)for(let j=i+1;j<en.length;j++){const a=en[i],b=en[j];if(a.dead||b.dead)continue;const ddx=b.x-a.x,ddy=b.y-a.y,d=Math.hypot(ddx,ddy);if(d>0&&d<10){const f=(10-d)/24;if(ok(a.x-ddx/d*f,a.y-ddy/d*f)){a.x-=ddx/d*f;a.y-=ddy/d*f}if(ok(b.x+ddx/d*f,b.y+ddy/d*f)){b.x+=ddx/d*f;b.y+=ddy/d*f}}}
 run.update(gdt);
 if(false){const RNG=(wpm=='bow'||wpm=='xbow'),DUR={short:380,none:380,long:430,bow:560,xbow:380,magic:380}[wpm]||380;
  if(!weaponAttack&&now>nextAtk){let best=null,bd=RNG?150:52;for(const e of en){if(e.dead)continue;const d=Math.hypot(e.x-hero.x,e.y-hero.y);if(d<bd){bd=d;best=e}}if(best){hero.face=best.x>=hero.x?1:-1;weaponAttack={t0:now,dur:DUR,hit:false,tx:best.x,ty:best.y}}}
  if(weaponAttack){const el=now-weaponAttack.t0;
   if(RNG){const rel=wpm=='bow'?.62:.5;if(!weaponAttack.hit&&el>DUR*rel){weaponAttack.hit=true;const ax=weaponAttack.tx-hero.x,ay=weaponAttack.ty-(hero.y-10),L2=Math.hypot(ax,ay)||1;pj.push({x:hero.x+hero.face*8,y:hero.y,dx:ax/L2,dy:(weaponAttack.ty-hero.y)/L2,v:wpm=='bow'?190:260,life:.7})}}
   else if(!weaponAttack.hit&&el>(wpm=='long'?190:170)){weaponAttack.hit=true;const reach=wpm=='long'?54:46,wid=wpm=='long'?14:22;for(const e of en){const ex=(e.x-hero.x)*hero.face,ey=e.y-hero.y;if(ex>-8&&ex<reach&&Math.abs(ey)<wid)hitEnemy(e,now,hero.face)}}
   if(el>DUR){weaponAttack=null;nextAtk=now+140}}
  for(const p of pj){p.x+=p.dx*p.v*dt;p.y+=p.dy*p.v*dt;p.life-=dt;for(const e of en){if(!e.dead&&Math.abs(e.x-p.x)<7&&Math.abs(e.y-p.y)<9){hitEnemy(e,now,p.dx>0?1:-1);p.life=0;break}}}
  pj=pj.filter(p=>p.life>0&&ok(p.x,p.y))}
 for(let i=en.length-1;i>=0;i--){const e=en[i];if(e.dead&&!e.counted){e.counted=true;kills++;run.onKill(e)}if(e.expired)en.splice(i,1)}
 if(!pz&&!(portal&&now-portal.t<3500)){const w=run.want();for(let n=0;n<4&&en.filter(e=>!e.dead).length<w;n++)spawn()}
 survival?.update(gdt);
 $('kc').textContent='斩敌 '+kills;
 const cx=Math.round(Math.min(WW-VW,Math.max(0,hero.x-VW/2))),cy=Math.round(Math.min(WH-VH,Math.max(0,hero.y-VH/2)));
 c.imageSmoothingEnabled=true;
 drawGround(c,cx,cy,VW,VH,0,0,VW,VH);
 const px=Math.round(hero.x-cx),py=Math.round(hero.y-cy);
 if(ov.fp){if(moving&&!inSh&&Math.hypot(hero.x-fpl.x,hero.y-fpl.y)>7){fpl={x:hero.x,y:hero.y};fp.push({x:hero.x+fpside*2.2,y:hero.y,t:now});fpside=-fpside}
  fp=fp.filter(f=>now-f.t<5200);for(const f of fp){const a=1-(now-f.t)/5200;c.fillStyle=`rgba(30,20,12,${.16*a})`;c.beginPath();c.ellipse(f.x-cx,f.y-cy-1,1.7,1,0,0,6.3);c.fill()}}
 rip=rip.filter(r=>now-r.t<520);for(const r of rip){const k=(now-r.t)/520;c.strokeStyle=`rgba(250,252,250,${.9*(1-k)})`;c.lineWidth=.8;c.beginPath();c.ellipse(r.x-cx,r.y-cy-1,3+k*9,1.5+k*4,0,0,6.3);c.stroke()}
 if(!fish){fish=[];let g=0;while(fish.length<7&&g++<4000){const x=2150+Math.random()*400,y=WH-950+Math.random()*300;if(deepAt(x,y,34))fish.push({x,y,a:Math.random()*6.28,v:12+Math.random()*12,s:.8+Math.random()*.8,p:Math.random()*6})}}
 for(const f of fish){const nx=f.x+Math.cos(f.a)*f.v*dt,ny=f.y+Math.sin(f.a)*f.v*dt*.6;if(deepAt(nx,ny,34)&&deepAt(f.x+Math.cos(f.a)*30,f.y+Math.sin(f.a)*18,24)){f.x=nx;f.y=ny}else f.a+=1.4+Math.random();f.a+=Math.sin(now/1700+f.p)*dt*.5;f.p+=dt*5;
  const sx=f.x-cx,sy=f.y-cy;if(sx<-60||sx>VW+60||sy<-40||sy>VH+40)continue;const dir=Math.cos(f.a)>=0?1:-1,L=22*f.s,tw=Math.sin(f.p)*3*f.s;
  c.save();c.translate(sx,sy);c.scale(dir,1);c.fillStyle='rgba(8,32,66,.34)';c.beginPath();c.ellipse(0,0,L,L*.28,0,0,6.3);c.fill();c.beginPath();c.moveTo(-L*.8,0);c.lineTo(-L*1.5,-L*.34+tw);c.lineTo(-L*1.5,L*.34+tw);c.closePath();c.fill();c.restore()}
 contact(px,py,16);
 c.save();c.font='7px monospace';c.textBaseline='bottom';c.fillStyle='rgba(0,0,0,.45)';c.fillRect(3,VH-13,124,10);c.fillStyle='#fff';c.fillText(region(hero.x,hero.y)+' · '+weather.shichen(now)+'  x '+Math.round(hero.x)+'  y '+Math.round(hero.y),6,VH-5);c.restore();
 const items=[];
 for(const o of objs){const sx=o.x-cx,sy=o.y-cy;if(sx<-60||sx>VW+60||sy<-10||sy>VH+100)continue;
  const inx=Math.abs(hero.x-o.x)<o.w*.4,iny=hero.y<o.y-2&&hero.y>o.y-o.h*.9;const fade=/^(broad|pine|spire|bushL|nfir|nbare|nspire|nbush|fhouse|fshed|fgran|fbamb1|fwillow|fpeach|willow)/.test(o.k);const ta=(fade&&inx&&iny)?.42:1;
  o.a+=(ta-o.a)*Math.min(1,dt*10);
  const fl=/^(st\d|wlily)/.test(o.k);   // 踏脚石、睡莲贴地画，永远在人物下面
  items.push({y:fl?-1e9:o.y,f:()=>{c.imageSmoothingEnabled=true;c.globalAlpha=o.a;c.drawImage(IM['s_'+o.k],sx-o.w/2,fl?sy-o.h/2:sy-o.h,o.w,o.h);c.globalAlpha=1}})}
 for(const p of pj){const sx=p.x-cx,sy=p.y-cy;items.push({y:p.y+1,f:()=>{c.strokeStyle='#eadfc2';c.lineWidth=1;c.beginPath();c.moveTo(sx-p.dx*7,sy-9-p.dy*7);c.lineTo(sx,sy-9);c.stroke();c.fillStyle='#9aa0a6';c.fillRect(sx-.7,sy-9.7,1.6,1.4);c.fillStyle='rgba(18,40,20,.25)';c.fillRect(sx-1,sy-1,2,1)}})}
 for(const e of en){const sx=e.x-cx,sy=e.y-cy;if(sx<-60||sx>VW+60||sy<-30||sy>VH+60)continue;items.push({y:e.y,f:()=>{if(!e.dead)contact(sx,sy,16);enemySystem.draw(e,c,cx,cy,now)}})}
 items.push({y:hero.y+1,f:()=>enemySystem.drawArrows(c,cx,cy)});
 items.push({y:hero.y,f:()=>{c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';drawHero(px,py,moving,now);if(inSh){c.fillStyle='rgba(200,228,232,.6)';c.fillRect(px-7,py-4,14,4)}}});
 items.sort((a,b)=>a.y-b.y).forEach(o=>o.f());
 run.drawWorld(c,cx,cy,now);
 if(portal){const t=Math.max(0,(now-portal.t)/1000);if(t>4.2)portal=null;else{   // 开局传送门：3 秒后缩小淡出
  const k=Math.max(.01,t<.4?t/.4:t>3?1-(t-3)/1.2:1),px=portal.x-cx,py=portal.y-cy-12;c.save();c.globalAlpha=k;c.translate(px,py);
  const g=c.createRadialGradient(0,0,0,0,0,Math.max(1,16*k));g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.35,'rgba(150,120,255,.85)');g.addColorStop(.8,'rgba(70,40,200,.5)');g.addColorStop(1,'rgba(40,20,120,0)');
  c.scale(.7,1);c.fillStyle=g;c.beginPath();c.arc(0,0,16*k,0,6.3);c.fill();
  c.lineWidth=1.2;for(let i=0;i<3;i++){c.strokeStyle=`rgba(${200-i*40},${180-i*30},255,.8)`;c.beginPath();c.arc(0,0,(6+i*4)*k,now/300*(i%2?-1:1)+i,now/300*(i%2?-1:1)+i+4);c.stroke()}
  c.restore();c.save();c.globalAlpha=k;for(let i=0;i<10;i++){const a=now/500+i*.63,r=(10+((now/40+i*13)%14))*k;c.fillStyle='rgba(200,180,255,.8)';c.fillRect(px+Math.cos(a)*r*.7,py+Math.sin(a)*r,1.2,1.2)}
  c.fillStyle='rgba(40,20,90,.25)';c.beginPath();c.ellipse(px,py+16*k,10*k,2.5*k,0,0,6.3);c.fill();c.restore()}}
 c.imageSmoothingEnabled=true;
 if(ov.cld){c.save();const T=640,dr=now*.011;const ox0=(((-cx+dr)%T)+T)%T,oy0=(((-cy+dr*.45)%T)+T)%T;for(let x=ox0-T;x<VW;x+=T)for(let y=oy0-T;y<VH;y+=T)c.drawImage(cloud,x,y,T,T);c.restore()}
 weather.draw(c,now,dt,VW,VH,hero.x,hero.y,WW,WH,region(hero.x,hero.y));
 fx=fx.filter(f=>now-f.t<220);for(const f of fx){const k=(now-f.t)/220;c.strokeStyle=`rgba(255,255,245,${1-k})`;c.lineWidth=1;c.beginPath();c.arc(f.x-cx+f.dx*k*10,f.y-cy-10,3+k*9,0,6.3);c.stroke()}
 window.CAM={cx,cy,SC,VW,VH};dbg?.draw?.(c,cx,cy);
 run.drawUI(c,VW,VH);
 const m=$('mm').getContext('2d'),k=84/WW;m.drawImage(mmc,0,0);m.strokeStyle='#fff';m.strokeRect(cx*k,cy*k,VW*k,VH*k);m.fillStyle='#fff';m.fillRect(hero.x*k-1.5,hero.y*k-1.5,3,3);
 if($('pos'))$('pos').textContent='位置 '+Math.round(hero.x)+', '+Math.round(hero.y)+(inSh?' · 正在涉水（速度×0.55）':'')+' · 逻辑画布 480×300，输出 960×600，主角高约 25 像素';
 requestAnimationFrame(loop)}
