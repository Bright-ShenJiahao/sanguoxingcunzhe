import {t as tr} from './i18n.js?v=11042480';
// 地图地标（4 个神龛：碰一下给短时增益，用完冷却）+ 限时事件「宝箱哥布林」。
// 美术先用代码画的占位图；GPT 图到了以后放进 assets/map/landmarks/ 再换。
const LM_DEF=[
 {k:'atk',get name(){return tr('world.lm.atk.name')},x:230,y:1075,col:'#ff5a3a',get tip(){return tr('world.lm.atk.tip')}},
 {k:'spd',get name(){return tr('world.lm.spd.name')},x:1560,y:1010,col:'#7df9ff',get tip(){return tr('world.lm.spd.tip')}},
 {k:'heal',get name(){return tr('world.lm.heal.name')},x:1120,y:1050,col:'#7dff9a',get tip(){return tr('world.lm.heal.tip')}},
 {k:'gold',get name(){return tr('world.lm.gold.name')},x:850,y:260,col:'#ffd23f',get tip(){return tr('world.lm.gold.tip')}}];
const CD=150,BUF=30;
const IM={};for(const k of ['atk','spd','heal','gold'])for(const t of ['on','off']){const i=new Image();i.src=`assets/map/landmarks/${k}_${t}.png`;IM[k+'_'+t]=i}
for(const f of ['idle','run1','run2','hit']){const i=new Image();i.src=`assets/characters/summons/tg/${f}.png`;IM['tg_'+f]=i}
const LH={atk:26,spd:30,heal:24,gold:20};
// 山顶木栅（用户画线 11/03，data/palisade.json）：沿线每 5px 一根营地木桩；碰撞已烘进 coll.png
for(const k of ['post0','post1','post2']){const i=new Image();i.src=`assets/map/sprites/camp_${k}.png`;IM['p_'+k]=i}
const PH={post0:31,post1:24,post2:19};let POSTS=[];
fetch('data/palisade.json?v=11042480').then(r=>r.json()).then(Ls=>{let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(const L of Ls)for(let i=0;i<L.length-1;i++){const [x0,y0]=L[i],[x1,y1]=L[i+1],len=Math.hypot(x1-x0,y1-y0);for(let t=0;t<len;t+=5){const x=x0+(x1-x0)*t/len,y=y0+(y1-y0)*t/len;
  POSTS.push({k:'post'+[0,1,1,2][Math.floor(rnd()*4)],x:x+(rnd()-.5)*1.5,y:y+(rnd()-.5)*1.5,h:.85+rnd()*.3})}}}).catch(()=>{});   // 地标在游戏里的高度
// 哥布林瞭望塔（用户圈点 11/03）：射程内放箭，前期伤害高；可被打掉，碎了这局不再出现
const TW=[[234,647],[320,638],[23,829],[398,788]];   // 离木栅 ≥45px，避免怪卡在塔和木栅之间
const DEC=[['brazier',489,725],['brazier',463,801],['brazier',126,542],['brazier',199,538],['banner',320,836],['skulls',298,524],['skulls',284,533],['skulls',312,533],['skulls',292,544],['skulls',306,546],['skulls',298,536],['banner',298,550]];
// 拒马（用户画线 11/03）：沿线每 16px 一组，尖头朝外（背向山顶中心）
const SPK=[[[505,725],[505,752]],[[502,779],[495,803]],[[532,726],[534,756]],[[531,782],[525,809]],[[559,728],[558,756]],[[559,790],[553,810]],[[487,820],[468,842]],[[523,828],[494,857]],[[546,838],[526,865]]];
const CASTLE={x:79,y:771,w:169,h:170};
// 开发者拖动摆放：读取浏览器里保存的位置，供调试面板拖动
try{const E=JSON.parse(localStorage.getItem('lmEdit2')||'null');if(E){if(E.castle){CASTLE.x=E.castle[0];CASTLE.y=E.castle[1]}if(E.tw)E.tw.forEach((p,i)=>{if(TW[i])TW[i]=p});if(E.dec)E.dec.forEach((p,i)=>{if(DEC[i]){DEC[i][1]=p[0];DEC[i][2]=p[1]}})}}catch(_){}
window.LMEDIT={items(S){const L=[{k:'城堡',get x(){return CASTLE.x},get y(){return CASTLE.y},set(x,y){CASTLE.x=x;CASTLE.y=y}}];
  TW.forEach((p,i)=>L.push({k:'瞭望塔',get x(){return TW[i][0]},get y(){return TW[i][1]},set(x,y){TW[i]=[x,y];const T=S?.tw?.[i];if(T){T.x=x;T.y=y}}}));
  DEC.forEach(d=>L.push({k:d[0],get x(){return d[1]},get y(){return d[2]},set(x,y){d[1]=x;d[2]=y}}));return L},
 save(){try{localStorage.setItem('lmEdit2',JSON.stringify(this.dump()))}catch(_){}},
 dump(){return {castle:[CASTLE.x,CASTLE.y],tw:TW.map(p=>[Math.round(p[0]),Math.round(p[1])]),dec:DEC.map(d=>[Math.round(d[1]),Math.round(d[2])]),decKinds:DEC.map(d=>d[0])}},
 reset(){try{localStorage.removeItem('lmEdit2')}catch(_){}location.reload()}};{const i=new Image();i.src='assets/map/fort/castle_big.png?v=11042480';IM.f_castle=i}
for(const k of ['tower','banner','skulls','brazier','spikes']){const i=new Image();i.src=`assets/map/fort/${k}.png?v=11042480`;IM['f_'+k]=i}
const FH={tower:55,banner:34,skulls:16,brazier:26,spikes:22};
export function install(X){
 const {hero,en,ok,makeEnemy,survival}=X,R=(a,b)=>a+Math.random()*(b-a);
 let L=null;
 function place(){L=LM_DEF.map(d=>{let best=[d.x,d.y];for(let r=0;r<120&&!ok(best[0],best[1]);r+=6)for(let a=0;a<6.28;a+=.5){const x=d.x+Math.cos(a)*r,y=d.y+Math.sin(a)*r;if(ok(x,y)){best=[x,y];r=999;break}}return {...d,x:best[0],y:best[1],cd:0}});window.LM=L}
 function update(dt){const S=X.S;if(!S)return;if(!L||S.lmRun!==S){S.lmRun=S;place();S.buf={atk:0,spd:0,gold:0};}
  for(const k in S.buf)if(S.buf[k]>0)S.buf[k]-=dt;
  for(const l of L){if(l.cd>0){l.cd-=dt;continue}if((hero.x-l.x)**2+((hero.y-l.y)*1.2)**2<16*16){l.cd=CD;
    if(l.k==='heal')survival?.heal?.(40);else S.buf[l.k]=BUF;
    S.banner={v:l.name+'：'+l.tip,t:2.5};S.texts.push({x:l.x,y:l.y-30,v:l.tip,t:1.5,c:l.col,big:1});window.SFX?.level?.()}}
  towers(S,dt);
  // 宝箱哥布林：60 秒后，每 2.5～3.5 分钟出现一次，逃跑 25 秒
  S.tgT=S.tgT??90;S.tgT-=dt;if(S.tgT<=0){S.tgT=R(150,210);spawnTG(S)}
  for(const e of en){if(!e.tg||e.dead)continue;e.alpha=0;e.stunT=Math.max(e.stunT||0,.05);e.tgL-=dt;
   const dx=e.x-hero.x,dy=e.y-hero.y,d=Math.hypot(dx,dy)||1;e.wob=(e.wob||0)+dt;const a=Math.atan2(dy,dx)+Math.sin(e.wob*1.7)*.8,sp=(d<160?62:30)*dt,nx=e.x+Math.cos(a)*sp,ny=e.y+Math.sin(a)*sp;
   if(ok(nx,ny)&&nx>30&&ny>30&&nx<(window.__G?.WW||1880)-30&&ny<(window.__G?.WH||1188)-30){e.x=nx;e.y=ny}else{const b=a+R(-2,2);const mx=e.x+Math.cos(b)*sp,my=e.y+Math.sin(b)*sp;if(ok(mx,my)){e.x=mx;e.y=my}}e.face=Math.cos(a)>=0?1:-1;e.moving=true;
   if(e.tgL<=0){e.expired=true;e.dead=true;S.banner={v:tr('world.tg.flee'),t:2}}}}
 function towers(S,dt){if(!S.tw){S.tw=TW.map(([x,y])=>({x,y,dead:false,e:null,cd:2,n:0}));S.arrows=[];S.twKills=0;
   for(const [[x0,y0],[x1,y1]] of SPK){const mx=(x0+x1)/2,my=(y0+y1)/2;for(const dx of [-7,7])for(let o=-6;o<=6;o++)for(let q=-2;q<=2;q++)window.SETC?.(mx+dx+o,my+q,1)}
   for(const d of DEC)if(d[0]==='spikes')for(let o=-9;o<=9;o++)for(let q=-3;q<=3;q++)window.SETC?.(d[1]+o,d[2]+q,1)}
  for(const T of S.tw){if(T.dead)continue;
   if(!T.e||T.e.expired||(T.e.dead&&!T.e.tower)){const m=makeEnemy(T.x,T.y,'goblin');if(!m)continue;X.onSpawnBase?.(m);Object.assign(m,{tower:T,name:tr('world.tower.name'),armor:0,res:'',sc:1.5,alpha:0});m.hp=m.hpMax=150;en.push(m);T.e=m;
    for(let o=-8;o<=8;o++)for(let q=-4;q<=3;q++)window.SETC?.(T.x+o,T.y+q,1)}
   const e=T.e;if(e.dead){T.dead=true;for(let o=-8;o<=8;o++)for(let q=-4;q<=3;q++)window.SETC?.(T.x+o,T.y+q,0);continue}
   e.x=T.x;e.y=T.y;e.alpha=0;e.stunT=Math.max(e.stunT||0,.1);
   T.cd-=dt;const d=Math.hypot(hero.x-T.x,(hero.y-T.y));if(T.cd<=0&&d<115){T.cd=1.5;const dx=hero.x-T.x,dy=hero.y-8-(T.y-40),L=Math.hypot(dx,dy)||1;S.arrows.push({x:T.x,y:T.y-40,dx:dx/L,dy:dy/L,t:0});window.SFX?.shoot?.()}}
  for(let i=S.arrows.length-1;i>=0;i--){const A=S.arrows[i];A.t+=dt;A.x+=A.dx*150*dt;A.y+=A.dy*150*dt;
   if(Math.hypot(A.x-hero.x,A.y-(hero.y-8))<7){survival?.damage?.(9);window.LASTHIT='哥布林瞭望塔';S.arrows.splice(i,1);continue}
   if(A.t>1.4||(A.t>.25&&!ok(A.x,A.y+40)))S.arrows.splice(i,1)}}
 function spawnTG(S){for(let i=0;i<30;i++){const a=R(0,6.28),r=R(200,280),x=hero.x+Math.cos(a)*r,y=hero.y+Math.sin(a)*r*.8;if(!ok(x,y))continue;const m=makeEnemy(x,y,'goblin');if(!m)continue;
   X.onSpawnBase?.(m);m.tg=1;m.tgL=25;m.hp=m.hpMax=Math.round(25+S.t/5);m.name=tr('world.tg.name');m.armor=0;m.res='';m.sc=1.15;en.push(m);S.banner={v:tr('world.tg.appear'),t:3.5};window.SFX?.banner?.();return}}
 function onKill(e){const S=X.S;if(!S)return;if(e.tower){S.twKills=(S.twKills||0)+1;for(let i=0;i<8;i++)S.coins.push({x:e.x+R(-12,12),y:e.y+R(-8,8),v:6,bag:i<2});S.gems.push({x:e.x,y:e.y-4,v:30});if(S.twKills===1)S.chests.push({x:e.x+10,y:e.y+6,big:false});S.banner={v:tr('world.tower.down'),t:2};return}if(!e.tg)return;for(let i=0;i<14;i++)S.coins.push({x:e.x+R(-14,14),y:e.y+R(-10,10),v:6,bag:i<3});S.gems.push({x:e.x,y:e.y-4,v:60});S.chests.push({x:e.x,y:e.y,big:false});S.banner={v:tr('world.tg.down'),t:2.5}}
 // 占位图：代码画的小地标（一个木箱的 1.5～2 倍大）
 function drawLM(c,l,x,y,now){const on=l.cd<=0,I=IM[l.k+(on?'_on':'_off')];
  if(I?.complete&&I.width){const h=LH[l.k],w=I.width*h/I.height;c.save();c.fillStyle='rgba(10,20,10,.3)';c.beginPath();c.ellipse(x,y,w*.45,3,0,0,6.3);c.fill();if(on){c.globalAlpha=.18+.12*Math.sin(now/300);c.fillStyle=l.col;c.beginPath();c.ellipse(x,y-h*.45,w*.7,h*.6,0,0,6.3);c.fill();c.globalAlpha=1}c.imageSmoothingEnabled=true;c.drawImage(I,x-w/2,y-h+2,w,h);c.restore();return}
  const g=on?.6+.4*Math.sin(now/300):0;c.save();c.translate(x,y);
  c.fillStyle='rgba(10,20,10,.3)';c.beginPath();c.ellipse(0,0,10,3,0,0,6.3);c.fill();
  if(on){c.globalAlpha=.25*g+.1;c.fillStyle=l.col;c.beginPath();c.ellipse(0,-10,14,16,0,0,6.3);c.fill();c.globalAlpha=1}
  if(l.k==='atk'){c.fillStyle=on?'#8a8f99':'#5d6168';c.fillRect(-5,-22,10,22);c.fillRect(-7,-3,14,3);c.fillStyle=on?'#ff5a3a':'#3a3d42';c.fillRect(-1,-19,2,12);c.fillRect(-4,-15,8,2)}
  else if(l.k==='spd'){c.fillStyle=on?'#8a5a2c':'#5a4a3a';c.fillRect(-2,-24,4,24);c.fillStyle=on?'#ffffff':'#9a9a9a';c.beginPath();c.moveTo(2,-24);c.lineTo(10,-30);c.lineTo(4,-20);c.fill();c.beginPath();c.moveTo(-2,-22);c.lineTo(-9,-27);c.lineTo(-4,-18);c.fill();if(on){c.strokeStyle='#7df9ff';c.lineWidth=1;c.beginPath();c.ellipse(0,-12,7,3,now/400,0,6.3);c.stroke()}}
  else if(l.k==='heal'){c.fillStyle='#7d8590';c.beginPath();c.ellipse(0,-3,10,4,0,0,6.3);c.fill();c.fillStyle=on?'#4fd18a':'#3b4048';c.beginPath();c.ellipse(0,-4,8,2.8,0,0,6.3);c.fill();c.fillStyle='#8a929c';c.fillRect(-1.5,-12,3,8);if(on){c.fillStyle='#bfffd6';for(let i=0;i<3;i++){const t=(now/400+i/3)%1;c.fillRect(-1+Math.sin(i*2)*2,-12-t*8,1.5,1.5)}}}
  else{c.fillStyle='#7d8590';c.fillRect(-9,-8,18,8);c.fillStyle='#9aa2ac';c.fillRect(-10,-9,20,2);if(on){c.fillStyle='#ffd23f';for(const [px,py] of [[-5,-11],[0,-12],[5,-11],[-2,-14],[3,-14],[0,-16]]){c.beginPath();c.arc(px,py,2,0,6.3);c.fill()}}}
  c.restore()}
 function sprites(items,cx,cy,c,now){if(!L)return;const VW_=(window.CAM?.VW||640),VH_=(window.CAM?.VH||400),S_=X.S;
  const dimg=(k,x,y,fl)=>{const I=IM['f_'+k];if(!I?.complete||!I.width)return;const h=FH[k],w=I.width*h/I.height;c.save();c.translate(x,y);if(fl)c.scale(-1,1);c.drawImage(I,-w/2,-h+2,w,h);c.restore()};
  {const C=CASTLE,I=IM.f_castle,x=C.x-cx,y=C.y-cy;if(I?.complete&&I.width&&x>-120&&x<VW_+120&&y>-20&&y<VH_+C.h+20)items.push({y:C.y-8,f:()=>{c.save();c.imageSmoothingEnabled=true;c.drawImage(I,x-C.w/2,y-C.h,C.w,C.h);c.restore()}})}
  for(const d of DEC){const x=d[1]-cx,y=d[2]-cy;if(x<-40||y<-10||x>VW_+40||y>VH_+70)continue;items.push({y:d[2],f:()=>{dimg(d[0],x,y,d[3]&&d[1]>380);if(d[0]==='brazier'){c.save();c.globalAlpha=.25+.1*Math.sin(now/120);c.fillStyle='#ffb040';c.beginPath();c.arc(x,y-20,9,0,6.3);c.fill();c.restore()}}})}
  for(const [[x0,y0],[x1,y1]] of SPK){const mx=(x0+x1)/2,my=(y0+y1)/2,fl=mx<250;for(const dx of [-7,7]){const x=mx+dx-cx,y=my-cy;if(x<-40||y<-10||x>VW_+40||y>VH_+60)continue;items.push({y:my,f:()=>dimg('spikes',x,y+4,fl)})}}
  if(S_?.tw)for(const T of S_.tw){if(T.dead)continue;const x=T.x-cx,y=T.y-cy;if(x<-40||y<-10||x>VW_+40||y>VH_+80)continue;const e=T.e;items.push({y:T.y,f:()=>{c.save();if(e?.flash>0)c.filter='brightness(1.8)';dimg('tower',x,y);c.restore();
    if(e&&!e.dead&&e.hp<e.hpMax){c.fillStyle='rgba(0,0,0,.6)';c.fillRect(x-12,y-60,24,3);c.fillStyle='#ff6a4a';c.fillRect(x-12,y-60,24*e.hp/e.hpMax,3)}}})}
  if(S_?.arrows)for(const A of S_.arrows){const x=A.x-cx,y=A.y-cy;items.push({y:A.y+40,f:()=>{c.save();c.translate(x,y);c.rotate(Math.atan2(A.dy,A.dx));c.fillStyle='#e8dcc0';c.fillRect(-6,-.6,9,1.2);c.fillStyle='#9a9a9a';c.fillRect(3,-1,2.5,2);c.restore()}})}
for(const p of POSTS){const x=p.x-cx,y=p.y-cy;if(x<-20||y<-10||x>(window.CAM?.VW||640)+20||y>(window.CAM?.VH||400)+50)continue;const I=IM['p_'+p.k];if(!I?.complete||!I.width)continue;items.push({y:p.y,f:()=>{const h=PH[p.k]*p.h,w=I.width*h/I.height;c.drawImage(I,x-w/2,y-h+2,w,h)}})}for(const l of L){const x=l.x-cx,y=l.y-cy;if(x<-40||y<-10||x>(window.CAM?.VW||640)+40||y>(window.CAM?.VH||400)+60)continue;items.push({y:l.y,f:()=>drawLM(c,l,x,y,now)})}
  for(const e of en){if(!e.tg||e.dead)continue;const x=e.x-cx,y=e.y-cy;items.push({y:e.y+.5,f:()=>{const I=IM['tg_'+(e.flash>0?'hit':Math.floor(now/110)%2?'run1':'run2')];if(!I?.complete||!I.width)return;const h=26,w=I.width*h/I.height;c.save();c.translate(x,y);c.scale(e.face||1,1);c.imageSmoothingEnabled=true;c.drawImage(I,-w/2,-h+1,w,h);c.restore()}})}}
 function draw(c,cx,cy,now){const S=X.S;if(!S)return;
  const B=S.buf||{};let y=64;c.save();c.font='bold 8px "PingFang SC","Microsoft YaHei",sans-serif';c.textAlign='left';
  for(const [k,n,col] of [['atk',tr('world.buff.atk'),'#ff8a6a'],['spd',tr('world.buff.spd'),'#7df9ff'],['gold',tr('world.buff.gold'),'#ffd23f']])if(B[k]>0){const v=n+' '+Math.ceil(B[k])+'s';c.lineWidth=2;c.strokeStyle='rgba(0,0,0,.7)';c.strokeText(v,6,y);c.fillStyle=col;c.fillText(v,6,y);y+=10}c.restore()}
 function mini(m,k,now){if(!L)return;for(const l of L){const x=l.x*k,y=l.y*k;m.fillStyle=l.cd<=0?l.col:'#6a6f78';m.beginPath();m.moveTo(x,y-2.6);m.lineTo(x+2.2,y);m.lineTo(x,y+2.6);m.lineTo(x-2.2,y);m.closePath();m.fill();m.strokeStyle='#000a';m.lineWidth=.5;m.stroke()}
  for(const e of en)if(e.tg&&!e.dead&&Math.floor(now/250)%2){m.fillStyle='#ffd23f';m.beginPath();m.arc(e.x*k,e.y*k,2.2,0,6.3);m.fill()}}
 return {update,sprites,draw,mini,onKill,ground(){}};
}
