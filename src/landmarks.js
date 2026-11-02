// 地图地标（4 个神龛：碰一下给短时增益，用完冷却）+ 限时事件「宝箱哥布林」。
// 美术先用代码画的占位图；GPT 图到了以后放进 assets/map/landmarks/ 再换。
const LM_DEF=[
 {k:'atk',name:'战神石碑',x:230,y:1075,col:'#ff5a3a',tip:'伤害 +30%（30 秒）'},
 {k:'spd',name:'风之图腾',x:1560,y:1010,col:'#7df9ff',tip:'移速 +30%（30 秒）'},
 {k:'heal',name:'圣泉',x:1120,y:1050,col:'#7dff9a',tip:'回复 40 生命'},
 {k:'gold',name:'黄金祭坛',x:850,y:260,col:'#ffd23f',tip:'金币翻倍（30 秒）'}];
const CD=150,BUF=30;
const IM={};for(const k of ['atk','spd','heal','gold'])for(const t of ['on','off']){const i=new Image();i.src=`assets/map/landmarks/${k}_${t}.png`;IM[k+'_'+t]=i}
for(const f of ['idle','run1','run2','hit']){const i=new Image();i.src=`assets/characters/summons/tg/${f}.png`;IM['tg_'+f]=i}
const LH={atk:26,spd:30,heal:24,gold:20};   // 地标在游戏里的高度
// 哥布林城堡（山顶，左下角）：GPT 整张城堡院落图，城门朝东，第 15 分钟打开
const CI=new Image();CI.crossOrigin='anonymous';CI.src='assets/map/castle/castle.png?v=2';const CIW=1247,CIH=1108;   // 坐标按原图 1247×1108 写；实际文件已缩小，画的时候按比例换算
const CX0=30,CY0=625,CS=235/CIW;   // 城堡左上角的世界坐标、缩放
const cw=(ix,iy)=>[CX0+ix*CS,CY0+iy*CS];
const YARD=[...cw(183,401),...cw(1078,906)],GATE_R=[...cw(1068,526),...cw(1247,701)],SOUTH_Y=880,CBASE=CY0+CIH*CS;   // 院子、城门通道（世界坐标 x0,y0,x1,y1）
const GATE=[(GATE_R[0]+GATE_R[2])/2,(GATE_R[1]+GATE_R[3])/2];
for(const k of ['tower','banner','skulls','brazier','spikes']){const i=new Image();i.src=`assets/map/castle/${k}.png`;IM['c_'+k]=i}
const CH={tower:46,banner:32,skulls:13,brazier:20,spikes:17};
const DECO=[['tower',372,690],['tower',330,612],['banner',282,708],['brazier',276,724],['banner',300,650],['skulls',172,895],['skulls',360,790],['spikes',345,840],['spikes',150,885]];
let CMASK=null;function castleMask(){if(CMASK||!CI.complete||!CI.width)return CMASK;const c=document.createElement('canvas');c.width=CIW;c.height=CIH;const g=c.getContext('2d');g.drawImage(CI,0,0,CIW,CIH);try{CMASK=g.getImageData(0,0,CIW,CIH).data}catch(e){CMASK=new Uint8ClampedArray(CIW*CIH*4).fill(255)}return CMASK}   // 读不到像素就按整块矩形算
export function install(X){
 const {hero,en,ok,makeEnemy,survival}=X,R=(a,b)=>a+Math.random()*(b-a);
 let L=null;
 function place(){L=LM_DEF.map(d=>{let best=[d.x,d.y];for(let r=0;r<120&&!ok(best[0],best[1]);r+=6)for(let a=0;a<6.28;a+=.5){const x=d.x+Math.cos(a)*r,y=d.y+Math.sin(a)*r;if(ok(x,y)){best=[x,y];r=999;break}}return {...d,x:best[0],y:best[1],cd:0}});window.LM=L}
 function setWall(open){const W=window.SETC,M=castleMask();if(!W||!M)return false;const inR=(x,y,r)=>x>=r[0]&&x<=r[2]&&y>=r[1]&&y<=r[3];
   for(let y=Math.floor(CY0);y<CBASE;y++)for(let x=Math.floor(CX0);x<CX0+CIW*CS;x++){const ix=Math.floor((x-CX0)/CS),iy=Math.floor((y-CY0)/CS);if(ix<0||iy<0||ix>=CIW||iy>=CIH)continue;
    if(M[(iy*CIW+ix)*4+3]<40)continue;if(inR(x,y,YARD))continue;if(inR(x,y,GATE_R)){W(x,y,open?0:1);continue}W(x,y,1)}return true}
 function update(dt){const S=X.S;if(!S)return;if(!L||S.lmRun!==S){S.lmRun=S;place();S.buf={atk:0,spd:0,gold:0};S.gateOpen=false;S.wallSet=false}
  if(!S.wallSet)S.wallSet=setWall(S.gateOpen);
  if(!S.gateOpen&&S.t>=900){S.gateOpen=true;setWall(true);S.banner={v:'哥布林城堡的城门打开了！（左下角山顶）',t:4};window.SFX?.boss?.()}
  for(const k in S.buf)if(S.buf[k]>0)S.buf[k]-=dt;
  for(const l of L){if(l.cd>0){l.cd-=dt;continue}if((hero.x-l.x)**2+((hero.y-l.y)*1.2)**2<16*16){l.cd=CD;
    if(l.k==='heal')survival?.heal?.(40);else S.buf[l.k]=BUF;
    S.banner={v:l.name+'：'+l.tip,t:2.5};S.texts.push({x:l.x,y:l.y-30,v:l.tip,t:1.5,c:l.col,big:1});window.SFX?.level?.()}}
  // 宝箱哥布林：60 秒后，每 2.5～3.5 分钟出现一次，逃跑 25 秒
  S.tgT=S.tgT??90;S.tgT-=dt;if(S.tgT<=0){S.tgT=R(150,210);spawnTG(S)}
  for(const e of en){if(!e.tg||e.dead)continue;e.alpha=0;e.stunT=Math.max(e.stunT||0,.05);e.tgL-=dt;
   const dx=e.x-hero.x,dy=e.y-hero.y,d=Math.hypot(dx,dy)||1;e.wob=(e.wob||0)+dt;const a=Math.atan2(dy,dx)+Math.sin(e.wob*1.7)*.8,sp=(d<160?62:30)*dt,nx=e.x+Math.cos(a)*sp,ny=e.y+Math.sin(a)*sp;
   if(ok(nx,ny)&&nx>30&&ny>30&&nx<(window.__G?.WW||1880)-30&&ny<(window.__G?.WH||1188)-30){e.x=nx;e.y=ny}else{const b=a+R(-2,2);const mx=e.x+Math.cos(b)*sp,my=e.y+Math.sin(b)*sp;if(ok(mx,my)){e.x=mx;e.y=my}}e.face=Math.cos(a)>=0?1:-1;e.moving=true;
   if(e.tgL<=0){e.expired=true;e.dead=true;S.banner={v:'宝箱哥布林逃走了……',t:2}}}}
 function spawnTG(S){for(let i=0;i<30;i++){const a=R(0,6.28),r=R(200,280),x=hero.x+Math.cos(a)*r,y=hero.y+Math.sin(a)*r*.8;if(!ok(x,y))continue;const m=makeEnemy(x,y,'goblin');if(!m)continue;
   X.onSpawnBase?.(m);m.tg=1;m.tgL=25;m.hp=m.hpMax=Math.round(25+S.t/5);m.name='宝箱哥布林';m.armor=0;m.res='';m.sc=1.15;en.push(m);S.banner={v:'宝箱哥布林出现了！追上去打倒它（看小地图金点）',t:3.5};window.SFX?.banner?.();return}}
 function onKill(e){const S=X.S;if(!e.tg||!S)return;for(let i=0;i<14;i++)S.coins.push({x:e.x+R(-14,14),y:e.y+R(-10,10),v:6,bag:i<3});S.gems.push({x:e.x,y:e.y-4,v:60});S.chests.push({x:e.x,y:e.y,big:false});S.banner={v:'打倒宝箱哥布林！金币、经验和宝箱',t:2.5}}
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
 function drawPiece(c,k,x,y,flip){const I=IM['c_'+k];if(!I?.complete||!I.width)return;const h=CH[k],w=I.width*h/I.height;c.save();c.translate(x,y);if(flip)c.scale(-1,1);c.imageSmoothingEnabled=true;c.drawImage(I,-w/2,-h+3,w,h);c.restore()}
 function ground(c,cx,cy){if(!CI.complete||!CI.width)return;c.save();c.imageSmoothingEnabled=true;const k=CI.width/CIW;c.drawImage(CI,0,0,CI.width,SOUTH_Y*k,CX0-cx,CY0-cy,CIW*CS,SOUTH_Y*CS);c.restore()}   // 城堡（除南墙）当地面画
 function sprites(items,cx,cy,c,now){if(!L)return;const S=X.S;
  if(CI.complete&&CI.width)items.push({y:CBASE-4,f:()=>{c.save();c.imageSmoothingEnabled=true;const k=CI.width/CIW;c.drawImage(CI,0,SOUTH_Y*k,CI.width,CI.height-SOUTH_Y*k,CX0-cx,CY0+SOUTH_Y*CS-cy,CIW*CS,(CIH-SOUTH_Y)*CS);c.restore()}});   // 南墙按 y 排序，能挡住院子里的人
  if(!S?.gateOpen){for(const dy of [-9,9])items.push({y:GATE[1]+dy,f:()=>drawPiece(c,'spikes',GATE[0]+4-cx,GATE[1]+dy-cy)})}   // 城门没开：拒马堵门
  for(const [k,wx,wy] of DECO){const x=wx-cx,y=wy-cy;if(x<-80||y<-20||x>580||y>440)continue;items.push({y:wy,f:()=>drawPiece(c,k,x,y)})}for(const l of L){const x=l.x-cx,y=l.y-cy;if(x<-40||y<-40||x>600||y>400)continue;items.push({y:l.y,f:()=>drawLM(c,l,x,y,now)})}
  for(const e of en){if(!e.tg||e.dead)continue;const x=e.x-cx,y=e.y-cy;items.push({y:e.y+.5,f:()=>{const I=IM['tg_'+(e.flash>0?'hit':Math.floor(now/110)%2?'run1':'run2')];if(!I?.complete||!I.width)return;const h=26,w=I.width*h/I.height;c.save();c.translate(x,y);c.scale(e.face||1,1);c.imageSmoothingEnabled=true;c.drawImage(I,-w/2,-h+1,w,h);c.restore()}})}}
 function draw(c,cx,cy,now){const S=X.S;if(!S)return;
  const B=S.buf||{};let y=64;c.save();c.font='bold 8px "PingFang SC","Microsoft YaHei",sans-serif';c.textAlign='left';
  for(const [k,n,col] of [['atk','战神',  '#ff8a6a'],['spd','疾风','#7df9ff'],['gold','黄金','#ffd23f']])if(B[k]>0){const v=n+' '+Math.ceil(B[k])+'s';c.lineWidth=2;c.strokeStyle='rgba(0,0,0,.7)';c.strokeText(v,6,y);c.fillStyle=col;c.fillText(v,6,y);y+=10}c.restore()}
 function mini(m,k,now){if(!L)return;m.strokeStyle=X.S?.gateOpen?'#ff5a3a':'#a8463a';m.lineWidth=1;m.strokeRect(CX0*k,CY0*k,CIW*CS*k,CIH*CS*k);for(const l of L){const x=l.x*k,y=l.y*k;m.fillStyle=l.cd<=0?l.col:'#6a6f78';m.beginPath();m.moveTo(x,y-2.6);m.lineTo(x+2.2,y);m.lineTo(x,y+2.6);m.lineTo(x-2.2,y);m.closePath();m.fill();m.strokeStyle='#000a';m.lineWidth=.5;m.stroke()}
  for(const e of en)if(e.tg&&!e.dead&&Math.floor(now/250)%2){m.fillStyle='#ffd23f';m.beginPath();m.arc(e.x*k,e.y*k,2.2,0,6.3);m.fill()}}
 return {update,sprites,draw,mini,onKill,ground};
}
