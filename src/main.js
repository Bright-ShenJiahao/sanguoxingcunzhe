
import {createExtract} from './extract.js';
import {createMenu} from './menu.js';
import {createSurvival} from './survival.js';
import {createEnemies} from './enemies.js';
import {createWeather} from './weather.js';
const [W,CH,ED]=await Promise.all(['data/world.json','data/characters.json','data/enemies.json'].map(u=>fetch(u).then(r=>r.json())));
const HN=await fetch('data/heroine.json').then(r=>r.json());
const D={...W,...CH,ground:'assets/map/ground_grass.jpg',coll:'assets/map/coll.png',
 spr:Object.fromEntries(Object.keys(W.size).map(k=>[k,'assets/map/sprites/'+k+'.png']))};
const cv=document.getElementById('cv'),c=cv.getContext('2d'),VW=480,VH=300,WW=D.WW,HD=D.HD;
const $=id=>document.getElementById(id);
const keys={};let joy=null;
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=1;if(e.key.startsWith('Arrow'))e.preventDefault()});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=0});
const st=$('st');
st.addEventListener('pointerdown',e=>{st.setPointerCapture(e.pointerId);joy={x:e.clientX,y:e.clientY,dx:0,dy:0}});
st.addEventListener('pointermove',e=>{if(joy){joy.dx=e.clientX-joy.x;joy.dy=e.clientY-joy.y}});
['pointerup','pointercancel'].forEach(n=>st.addEventListener(n,()=>joy=null));
const ov={cld:true,fp:true};
const IM={};let left=0;
let tot=0;function ld(k,s){left++;tot++;const i=new Image();i.onload=()=>{IM[k]=i;const b=document.getElementById('bootbar');if(b)b.style.width=Math.round((tot-left+1)/tot*100)+'%';if(--left==0)start()};i.src=s}
D.hb.forEach((u,i)=>ld('hb_'+i,u));for(const k in D.wp)ld('wp_'+k,D.wp[k]);ld('ground',D.ground);ld('coll',D.coll);
for(const k in D.spr)ld('s_'+k,D.spr[k]);
for(const k in ED)for(const name in ED[k].frames)ld('en_'+k+'_'+name,ED[k].frames[name].src);
ld('wp_xbow','assets/characters/hero_b/weapons/xbow.png');
for(let r=0;r<5;r++)for(let i=0;i<9;i++)ld('hh'+r+'_'+i,'assets/characters/heroine/r'+r+'_w'+i+'.png');
for(let i=0;i<8;i++)ld('hbg_'+i,'assets/characters/hero_b/g_w'+i+'.png');
let CS='m';const SETS={m:{pre:'hb_',gpre:'hbg_',size:D.hbsize,grip:D.grip,walk:[2,3,4,5,6,7]}};
for(let r=0;r<5;r++)SETS['f'+r]={pre:'hh'+r+'_',size:[HN.size[0]/2,HN.size[1]/2],grip:HN.rows[r],walk:[2,3,4,5,6,7,8]};
let hairG=false,weaponAttack=null,pj=[],CM,mmc,wpm='short';const R=D.coll_r;
const objs=D.objs.map(([k,x,y])=>({k,x,y,a:1,w:D.size[k][0],h:D.size[k][1],r:R[k]||0}));
const hero={x:WW/2,y:WW/2,face:1};const CO=objs.filter(o=>o.r);
function water(x,y){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=WW||y>=WW)return 1;return CM[(y*WW+x)*4]}
function blocked(x,y){
 if(water(x,y)===1||water(x-3,y)===1||water(x+3,y)===1||water(x,y-2)===1)return true;
 for(const o of CO){const dx=x-o.x,dy=(y-o.y)*1.3;if(dx*dx+dy*dy<(o.r+3)*(o.r+3))return true}return false}
const ok=(x,y)=>!blocked(x,y);
const HK=.8;let nextAtk=0;
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
const enemySystem=createEnemies({data:ED,images:IM,hero,ok,water,onHit:amount=>survival?.damage(amount)});
const extractEnemies=new Proxy(en,{get(target,key,receiver){if(key==='some')return ()=>enemySystem.extractContact;return Reflect.get(target,key,receiver)}});
function hitEnemy(e,now,dx){if(enemySystem.hit(e))fx.push({x:e.x,y:e.y,t:now,dx})}
function spawn(){for(let n=0;n<30;n++){const a=Math.random()*6.28,r=150+Math.random()*90,x=hero.x+Math.cos(a)*r,y=hero.y+Math.sin(a)*r;
 if(x<30||y<30||x>WW-30||y>WW-30||!ok(x,y))continue;en.push(enemySystem.make(x,y));return}}
let last=0,mm,rip=[],fp=[],fpl={x:0,y:0},fpside=1,cloud;
function mkCloud(){const n=96,g=[];for(let i=0;i<64;i++)g.push(Math.random());const v=(x,y)=>{const fx=x/n*8,fy=y/n*8,x0=Math.floor(fx),y0=Math.floor(fy),tx=fx-x0,ty=fy-y0,s=t=>t*t*(3-2*t),q=(a,b)=>g[((b%8+8)%8)*8+((a%8+8)%8)];const a=q(x0,y0)*(1-s(tx))+q(x0+1,y0)*s(tx),b=q(x0,y0+1)*(1-s(tx))+q(x0+1,y0+1)*s(tx);return a*(1-s(ty))+b*s(ty)};
 cloud=document.createElement('canvas');cloud.width=n;cloud.height=n;const x=cloud.getContext('2d'),im=x.createImageData(n,n);for(let j=0;j<n;j++)for(let i=0;i<n;i++){const val=v(i,j)*.7+v(i*2,j*2)*.3,a=Math.max(0,Math.min(1,(val-.5)/.22))*.26;const k=(j*n+i)*4;im.data[k]=18;im.data[k+1]=40;im.data[k+2]=28;im.data[k+3]=a*255}x.putImageData(im,0,0)}
function start(){const t=document.createElement('canvas');t.width=WW;t.height=WW;const x=t.getContext('2d');x.drawImage(IM.coll,0,0);CM=x.getImageData(0,0,WW,WW).data;
 mmc=document.createElement('canvas');mmc.width=84;mmc.height=84;mmc.getContext('2d').drawImage(IM.ground,0,0,84,84);
 document.querySelectorAll('#cs button').forEach(b=>b.onclick=()=>{CS=b.dataset.c;document.querySelectorAll('#cs button').forEach(x=>x.setAttribute('aria-pressed',x===b))});
 mkCloud();for(let i=0;i<14;i++)spawn();
 extract=createExtract({hero,size:WW,ok,enemies:extractEnemies,spawn,
  get kills(){return kills},get weapon(){return wpm},
  equip(w){wpm=w;weaponAttack=null;pj=[];nextAtk=0},
  hit(e,now){hitEnemy(e,now,hero.face)},
  reset(){hero.x=WW/2;hero.y=WW/2;kills=0;en.length=0;enemySystem.reset();fx=[];rip=[];fp=[];joy=null;for(const k in keys)keys[k]=0;this.equip('none')}
 });
 menu=createMenu({c,images:IM,data:D,objects:objs,enemies:ED,
  character(frame){const s=SETS[CS];return {image:IM[(hairG&&s.gpre?s.gpre:s.pre)+frame],size:s.size,label:document.querySelector('#cs button[aria-pressed="true"]').textContent}},
  clearInput(){joy=null;for(const k in keys)keys[k]=0},onStart(){survival.start()}
 });
 survival=createSurvival({hero,enemies:en,get kills(){return kills},get extractActive(){return extract.active},
  clearInput(){joy=null;for(const k in keys)keys[k]=0},home(){menu.show()},
  reset(){hero.x=WW/2;hero.y=WW/2;hero.face=1;kills=0;en.length=0;enemySystem.reset();weaponAttack=null;pj=[];fx=[];rip=[];fp=[];nextAtk=0;wpm='short';joy=null;for(const k in keys)keys[k]=0}
 });requestAnimationFrame(loop)}
let extract,menu,survival;const weather=createWeather();
function contact(x,y,w){c.fillStyle='rgba(18,40,20,.2)';c.beginPath();c.ellipse(x,y-1,w*.4,2.2,0,0,6.3);c.fill()}
function loop(now){
 const dt=Math.min(.05,(now-last)/1000||0);last=now;
 if(menu?.visible){menu.draw(now);requestAnimationFrame(loop);return}
 if(survival?.finished){requestAnimationFrame(loop);return}
 if(extract?.finished){requestAnimationFrame(loop);return}
 c.setTransform(HD,0,0,HD,0,0);
 let dx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),dy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
 if(joy){const L=Math.hypot(joy.dx,joy.dy);if(L>8){dx=joy.dx/L;dy=joy.dy/L}}
 const L=Math.hypot(dx,dy),moving=L>0;if(moving){dx/=L;dy/=L;if(dx)hero.face=dx>0?1:-1}
 const inSh=water(hero.x,hero.y)===2;
 const sp=72*dt*(inSh?.55:1);let nx=Math.min(WW-14,Math.max(14,hero.x+dx*sp)),ny=Math.min(WW-10,Math.max(14,hero.y+dy*sp));
 if(ok(nx,hero.y))hero.x=nx;if(ok(hero.x,ny))hero.y=ny;
 if(inSh&&moving&&Math.random()<dt*7)rip.push({x:hero.x,y:hero.y,t:now});
 enemySystem.update(en,dt,extract?.speed||1);
 for(let i=0;i<en.length;i++)for(let j=i+1;j<en.length;j++){const a=en[i],b=en[j];if(a.dead||b.dead)continue;const ddx=b.x-a.x,ddy=b.y-a.y,d=Math.hypot(ddx,ddy);if(d>0&&d<10){const f=(10-d)/24;if(ok(a.x-ddx/d*f,a.y-ddy/d*f)){a.x-=ddx/d*f;a.y-=ddy/d*f}if(ok(b.x+ddx/d*f,b.y+ddy/d*f)){b.x+=ddx/d*f;b.y+=ddy/d*f}}}
 if(wpm!='none'&&wpm!='magic'){const RNG=(wpm=='bow'||wpm=='xbow'),DUR={short:380,none:380,long:430,bow:560,xbow:380,magic:380}[wpm]||380;
  if(!weaponAttack&&now>nextAtk){let best=null,bd=RNG?150:52;for(const e of en){if(e.dead)continue;const d=Math.hypot(e.x-hero.x,e.y-hero.y);if(d<bd){bd=d;best=e}}if(best){hero.face=best.x>=hero.x?1:-1;weaponAttack={t0:now,dur:DUR,hit:false,tx:best.x,ty:best.y}}}
  if(weaponAttack){const el=now-weaponAttack.t0;
   if(RNG){const rel=wpm=='bow'?.62:.5;if(!weaponAttack.hit&&el>DUR*rel){weaponAttack.hit=true;const ax=weaponAttack.tx-hero.x,ay=weaponAttack.ty-(hero.y-10),L2=Math.hypot(ax,ay)||1;pj.push({x:hero.x+hero.face*8,y:hero.y,dx:ax/L2,dy:(weaponAttack.ty-hero.y)/L2,v:wpm=='bow'?190:260,life:.7})}}
   else if(!weaponAttack.hit&&el>(wpm=='long'?190:170)){weaponAttack.hit=true;const reach=wpm=='long'?54:46,wid=wpm=='long'?14:22;for(const e of en){const ex=(e.x-hero.x)*hero.face,ey=e.y-hero.y;if(ex>-8&&ex<reach&&Math.abs(ey)<wid)hitEnemy(e,now,hero.face)}}
   if(el>DUR){weaponAttack=null;nextAtk=now+140}}
  for(const p of pj){p.x+=p.dx*p.v*dt;p.y+=p.dy*p.v*dt;p.life-=dt;for(const e of en){if(!e.dead&&Math.abs(e.x-p.x)<7&&Math.abs(e.y-p.y)<9){hitEnemy(e,now,p.dx>0?1:-1);p.life=0;break}}}
  pj=pj.filter(p=>p.life>0&&ok(p.x,p.y))}
 for(let i=en.length-1;i>=0;i--){const e=en[i];if(e.dead&&!e.counted){e.counted=true;kills++}if(e.expired){en.splice(i,1);if(!extract?.active)spawn()}}
 if(!extract?.active)while(en.length<16)spawn();
 extract?.update(dt,now,moving);
 survival?.update(dt);
 $('kc').textContent='斩敌 '+kills;
 const cx=Math.round(Math.min(WW-VW,Math.max(0,hero.x-VW/2))),cy=Math.round(Math.min(WW-VH,Math.max(0,hero.y-VH/2)));
 c.imageSmoothingEnabled=true;
 c.drawImage(IM.ground,cx*HD,cy*HD,VW*HD,VH*HD,0,0,VW,VH);
 extract?.draw(c,cx,cy);
 const px=Math.round(hero.x-cx),py=Math.round(hero.y-cy);
 if(ov.fp){if(moving&&!inSh&&Math.hypot(hero.x-fpl.x,hero.y-fpl.y)>7){fpl={x:hero.x,y:hero.y};fp.push({x:hero.x+fpside*2.2,y:hero.y,t:now});fpside=-fpside}
  fp=fp.filter(f=>now-f.t<5200);for(const f of fp){const a=1-(now-f.t)/5200;c.fillStyle=`rgba(30,20,12,${.16*a})`;c.beginPath();c.ellipse(f.x-cx,f.y-cy-1,1.7,1,0,0,6.3);c.fill()}}
 rip=rip.filter(r=>now-r.t<520);for(const r of rip){const k=(now-r.t)/520;c.strokeStyle=`rgba(250,252,250,${.9*(1-k)})`;c.lineWidth=.8;c.beginPath();c.ellipse(r.x-cx,r.y-cy-1,3+k*9,1.5+k*4,0,0,6.3);c.stroke()}
 contact(px,py,16);
 const items=[];
 for(const o of objs){const sx=o.x-cx,sy=o.y-cy;if(sx<-60||sx>VW+60||sy<-10||sy>VH+100)continue;
  const inx=Math.abs(hero.x-o.x)<o.w*.4,iny=hero.y<o.y-2&&hero.y>o.y-o.h*.9;const fade=/^(broad|pine|spire|bushL)/.test(o.k);const ta=(fade&&inx&&iny)?.42:1;
  o.a+=(ta-o.a)*Math.min(1,dt*10);
  items.push({y:o.y,f:()=>{c.imageSmoothingEnabled=true;c.globalAlpha=o.a;c.drawImage(IM['s_'+o.k],sx-o.w/2,sy-o.h,o.w,o.h);c.globalAlpha=1}})}
 for(const p of pj){const sx=p.x-cx,sy=p.y-cy;items.push({y:p.y+1,f:()=>{c.strokeStyle='#eadfc2';c.lineWidth=1;c.beginPath();c.moveTo(sx-p.dx*7,sy-9-p.dy*7);c.lineTo(sx,sy-9);c.stroke();c.fillStyle='#9aa0a6';c.fillRect(sx-.7,sy-9.7,1.6,1.4);c.fillStyle='rgba(18,40,20,.25)';c.fillRect(sx-1,sy-1,2,1)}})}
 for(const e of en){const sx=e.x-cx,sy=e.y-cy;if(sx<-60||sx>VW+60||sy<-30||sy>VH+60)continue;items.push({y:e.y,f:()=>{if(!e.dead)contact(sx,sy,16);enemySystem.draw(e,c,cx,cy,now)}})}
 items.push({y:hero.y+1,f:()=>enemySystem.drawArrows(c,cx,cy)});
 items.push({y:hero.y,f:()=>{c.imageSmoothingEnabled=false;drawHero(px,py,moving,now);if(inSh){c.fillStyle='rgba(200,228,232,.6)';c.fillRect(px-7,py-4,14,4)}}});
 items.sort((a,b)=>a.y-b.y).forEach(o=>o.f());
 c.imageSmoothingEnabled=true;
 if(ov.cld){c.save();const T=640,dr=now*.011;const ox0=(((-cx+dr)%T)+T)%T,oy0=(((-cy+dr*.45)%T)+T)%T;for(let x=ox0-T;x<VW;x+=T)for(let y=oy0-T;y<VH;y+=T)c.drawImage(cloud,x,y,T,T);c.restore()}
 weather.draw(c,now,dt,VW,VH);
 fx=fx.filter(f=>now-f.t<220);for(const f of fx){const k=(now-f.t)/220;c.strokeStyle=`rgba(255,255,245,${1-k})`;c.lineWidth=1;c.beginPath();c.arc(f.x-cx+f.dx*k*10,f.y-cy-10,3+k*9,0,6.3);c.stroke()}
 const m=$('mm').getContext('2d'),k=84/WW;m.drawImage(mmc,0,0);m.strokeStyle='#fff';m.strokeRect(cx*k,cy*k,VW*k,VH*k);m.fillStyle='#fff';m.fillRect(hero.x*k-1.5,hero.y*k-1.5,3,3);
 extract?.minimap(m,k);
 if($('pos'))$('pos').textContent='位置 '+Math.round(hero.x)+', '+Math.round(hero.y)+(inSh?' · 正在涉水（速度×0.55）':'')+' · 逻辑画布 480×300，输出 960×600，主角高约 25 像素';
 requestAnimationFrame(loop)}
