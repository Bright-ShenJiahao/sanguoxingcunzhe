// 敌人（哥布林）：动作、受击、死亡与远程弹；命中事件交给调用方。
export function createEnemies({data,images,hero,ok,water,onHit}){
 const kinds=['goblin','gob_blade','gob_archer','gob_shield'],arrows=[],lobs=[],booms=[];
 const FX={};for(const n of ['lob_fire','lob_rock','boom0','boom1','boom2','boom3']){const im=new Image();im.src='assets/characters/enemies/fx/'+n+'.png';FX[n]=im}
 const near=(x,y,r,en)=>en.filter(o=>!o.dead&&(o.x-x)**2+((o.y-y)*1.25)**2<r*r);
 let EN=[];
 let bag=[];
 function nextKind(){
  if(!bag.length){bag=[...kinds];for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]]}}
  return bag.pop();
 }
 function make(x,y,k=nextKind()){return {k,x,y,face:1,hp:data[k].hp,state:'move',timer:0,cooldown:Math.random()*.8,ph:Math.random()*9,dead:false,sc0:data[k].sc}}
 function hit(e,dmg=1){
  if(e.dead)return false;
  if(data[e.k].ghost&&e.phT>0)dmg*=.5;
  if(e.aegT>0){e.flash=.08;return true}
  if(e.k==='gob_paladin'&&e.hpMax){for(const th of [.5,.25])if(!e['ag'+th]&&e.hp-dmg<e.hpMax*th){e['ag'+th]=1;e.state='aegis';e.timer=0;e.aegT=4;for(const o of near(e.x,e.y,120,EN))if(o!==e&&o.hpMax)o.hp=Math.min(o.hpMax,o.hp+o.hpMax*.3)}}
  e.hp-=dmg;
  if(e.hp<=0&&data[e.k].bomb&&!e.boomed){e.boomed=1;explode(e.x,e.y,40,data[e.k].damage*(e.dmgMul||1)*3,true)}
  if(e.hp<=0){e.dead=true;e.state='fall';e.timer=0;e.alpha=1}
  else if(!e.boss&&!e.elite&&e.state!=='dash'){e.state='hurt';e.timer=0;e.cooldown=.25}else e.flash=.12
  return true;
 }
 function explode(x,y,r,dm,hurtEn){booms.push({x,y,t:0,r});if(Math.hypot(hero.x-x,(hero.y-y)*1.25)<r)onHit(dm);if(hurtEn)for(const o of near(x,y,r,EN))if(!o.boomed)hit(o,dm*.6);window.SFX?.boom?.()}
 function reset(){arrows.length=0;lobs.length=0;booms.length=0}
 function update(en,dt,speed){EN=en;
  for(const e of en){
   const stats=data[e.k];e.timer+=dt;e.moving=false;
   if(e.dead){if(e.drum)continue;
    if(e.state==='fall'&&e.timer>=.4){e.state='down';e.timer=0}
    else if(e.state==='down'){e.alpha=Math.max(0,1-Math.max(0,e.timer-.55)/.8);if(e.timer>=1.35)e.expired=true}
    continue;
   }
   if(e.drum){if(e.flash>0)e.flash-=dt;continue}
   const ax=hero.x-e.x,ay=hero.y-e.y,d=Math.hypot(ax,ay)||1;if(e.state!=='dash')e.face=ax>=0?1:-1;
   const BD=stats.damage*(e.dmgMul||1)*(e.boss?2:e.elite?1.4:1);
   // 碰撞伤害：同一只怪每 0.5 秒最多一次
   e.cc=(e.cc||0)-dt;if(!stats.ranged&&!stats.bomb&&e.cc<=0&&Math.hypot(ax,(ay+2)*1.2)<(7+3*(e.sc||1))){e.cc=.5;onHit(BD*.5)}
   if(e.lifeT!=null){e.lifeT-=dt;if(e.lifeT<=0){e.expired=true;continue}}
   if(e.sweep){const sp=stats.speed*(stats.charge?3:1.8)*dt*speed;e.x+=e.sweep[0]*sp;e.y+=e.sweep[1]*sp;e.face=e.sweep[0]>=0?1:-1;e.moving=true;e.state='move';continue}   // 过场：直线冲过去
   if(e.state==='aim'){if(e.timer>=(e.aimT||.5)){e.state='dash';e.timer=0;e.dashHit=0}continue}
   if(e.state==='dash'){const st=(e.dsp||320)*dt,nx=e.x+e.dx*st,ny=e.y+e.dy*st;if(ok(nx,ny)){e.x=nx;e.y=ny}e.moving=true;
    if(!e.dashHit&&Math.hypot(hero.x-e.x,hero.y-e.y)<12){e.dashHit=1;onHit(BD)}if(e.timer>=(e.dlen||.25)){e.state='recover';e.timer=0;e.dcd=e.dcdN||4;e.dsp=e.dlen=0}continue}
   if(e.aegT>0)e.aegT-=dt;
   if(e.state==='aegis'){if(e.timer>=1){e.state='move';e.timer=0}continue}
   if(e.state==='judge'){if(e.timer>=1.5){e.state='recover';e.timer=0;explode(e.jx,e.jy,40,BD*4,false)}continue}
   if(e.state==='howl'){if(e.timer>=1){e.state='recover';e.timer=0;if(d<80)window.HSLOW=performance.now()+2000;e.hwFx=.6}continue}
   if(e.state==='fuse'){if(e.timer>=1.5){e.boomed=1;explode(e.x,e.y,40,BD*3,true);e.hp=0;e.dead=true;e.state='fall';e.timer=0;e.alpha=1}continue}
   if(e.state==='smash'){const R_=e.sr||35;if(e.timer>=(e.st||1.2)){e.state='strike';e.timer=0;explode(e.x+(e.bx>0?8:-8),e.y,R_,BD*3,false);e.bcd=e.boss?3:6}continue}
   if(e.state==='leap'){if(e.timer<1){continue}const k=Math.min(1,(e.timer-1)/.45);e.x=e.lx0+(e.lx1-e.lx0)*k;e.y=e.ly0+(e.ly1-e.ly0)*k;e.hop=Math.sin(k*Math.PI)*40;if(k>=1){e.hop=0;e.state='strike';e.timer=0;explode(e.x,e.y,50,BD*3,false);e.bcd=4}continue}
   if(e.state==='cast'){if(e.timer>=(stats.lob==='rock'?1:.8)){e.state='strike';e.timer=0;lobs.push({k:stats.lob,x0:e.x,y0:e.y-14,x:hero.x,y:hero.y,t:0,d:stats.lob==='rock'?1:.8,r:stats.lob==='rock'?22:25,dm:BD*(stats.lob==='rock'?2.5:2)});e.cooldown=stats.lob==='rock'?3:4}continue}
   if(e.state==='bash'){if(e.timer>=1){e.state='strike';e.timer=0;const fr=Math.sign(ax)===Math.sign(e.bx||1);if(d<32&&fr){onHit(BD);const nx=hero.x+ax/d*22,ny=hero.y+ay/d*22;if(ok(nx,ny)){hero.x=nx;hero.y=ny}}e.bcd=5}continue}
   if(e.state==='hurt'){if(e.timer>=.25){e.state='move';e.timer=0}continue}
   if(e.state==='windup'){
    if(e.timer>=.45){
     e.state='strike';e.timer=0;
     if(stats.ranged){
      const len=Math.hypot(ax,ay)||1;
      arrows.push({k:e.k,x:e.x,y:e.y-10,dx:ax/len,dy:ay/len,life:1.6,dm:stats.damage*(e.dmgMul||1)*(e.elite?1.3:1)});
     }else if((e.elite||e.boss)&&d<=(stats.reach+5)*(e.sc||1)){onHit(BD)}   // 普通怪挥砍只是动画，伤害靠碰撞
    }
   }else if(e.state==='strike'){
    if(e.timer>=.2){e.state='recover';e.timer=0}
   }else if(e.state==='recover'){
    if(e.timer>=.45){e.state='move';e.timer=0;e.cooldown=.55+Math.random()*.35}
   }else{
    e.cooldown=Math.max(0,e.cooldown-dt);e.dcd=(e.dcd||0)-dt;e.bcd=(e.bcd||0)-dt;
    const reg=!e.elite&&!e.boss;
    if(stats.bomb&&reg&&d<30){e.state='fuse';e.timer=0;continue}
    if(stats.charge&&reg&&d<150&&d>30&&e.dcd<=0){e.state='aim';e.timer=0;e.aimT=.8;e.dx=ax/d;e.dy=ay/d;e.dsp=260;e.dlen=(d+100)/260;e.dcdN=5;e.alen=d+100;continue}
    if(stats.heavy&&reg&&d<28&&e.bcd<=0){e.state='smash';e.timer=0;e.sr=35;e.st=1.2;e.bx=ax;continue}
    if(stats.leap&&e.bcd<=0&&d<170&&d>40){e.state='leap';e.timer=0;e.lx0=e.x;e.ly0=e.y;e.lx1=hero.x;e.ly1=hero.y;continue}
    if(stats.leap&&e.bcd<=0&&d<=40){e.state='smash';e.timer=0;e.sr=40;e.st=.7;e.bx=ax;continue}
    if(stats.lob&&d<=stats.reach&&e.cooldown===0){e.state='cast';e.timer=0;continue}
    if(stats.orbit&&reg){if(d<100&&(e.orT??-1)<0&&e.dcd<=0)e.orT=2+Math.random();if(e.orT>0){e.orT-=dt;if(e.orT<=0){e.orT=-1;e.state='aim';e.timer=0;e.aimT=.4;e.dx=ax/d;e.dy=ay/d;e.dsp=300;e.dlen=(d+20)/300;e.dcdN=4;e.alen=d+20;continue}}}
    if(stats.drum){e.drT=(e.drT??3)-dt;if(e.drT<=0){e.drT=8;e.drFx=.6;for(const o of near(e.x,e.y,100,en))o.buffT=5}}
    if(stats.necro){e.nkT=(e.nkT??3)-dt;if(e.nkT<=0){e.nkT=6;let n=0;for(const o of en){if(n>=4)break;if(o.dead&&!o.raised&&!o.boss&&o.k!=='skeleton'&&(o.x-e.x)**2+(o.y-e.y)**2<130*130){o.raised=1;o.expired=true;window.SPAWN?.('skeleton',o.x,o.y);n++}}}}
    if(e.boss&&e.k==='gob_paladin'){e.skT=(e.skT??2.5)-dt;if(e.skT<=0){e.skT=3.5;const r=Math.random();
      if(d<60&&r<.4){e.state='smash';e.timer=0;e.sr=55;e.st=.8;e.bx=ax;continue}
      else if(r<.65&&d>40){e.state='aim';e.timer=0;e.aimT=1;e.dx=ax/d;e.dy=ay/d;e.dsp=300;e.dlen=(d+100)/300;e.dcdN=0;e.alen=d+100;continue}
      else if(r<.85){e.state='judge';e.timer=0;e.jx=hero.x;e.jy=hero.y;continue}
      else{e.state='howl';e.timer=0;continue}}}
    if(e.boss&&e.k==='gob_chief'){e.skT=(e.skT??3)-dt;if(e.skT<=0){e.skT=4;const r=Math.random();if(r<.45&&d<60){e.state='smash';e.timer=0;e.sr=55;e.st=1.2;e.bx=ax;continue}else if(r<.75){e.wwT=3}else{for(const o of en)if(!o.dead)o.buffT=10;e.cryFx=1}}}
    if(e.k==='gob_blade'&&!e.elite&&!e.boss&&d<70&&d>22&&e.dcd<=0){e.state='aim';e.timer=0;e.dx=ax/d;e.dy=ay/d;continue}   // 剑士：冲刺斩
    if(e.k==='gob_shield'&&!e.elite&&!e.boss&&d<26&&e.bcd<=0){e.state='bash';e.timer=0;e.bx=ax;continue}   // 盾卫：盾击
    if(d<=stats.reach*(e.sc||1)&&e.cooldown===0){e.state='windup';e.timer=0;continue}
    if(d>stats.reach*(e.sc||1)*.85){
     e.losT=(e.losT||0)-dt;if(e.losT<=0){e.losT=.25+Math.random()*.1;e.los=true;const n=Math.ceil(d/6);for(let k=1;k<n;k++){if(water(e.x+ax*k/n,e.y+ay*k/n)===1){e.los=false;break}}}   // 中间没有河/崖就直线走
     const fd=d>28&&!e.los&&!stats.ghost&&window.PATHDIR?.(e.x,e.y);let tx=fd?fd[0]:ax/d,ty=fd?fd[1]:ay/d;
     if(e.orT>0){const sg=e.ph>4.5?1:-1,rad=(d-70)/40;tx=-ay/d*sg+ax/d*rad;ty=ax/d*sg+ay/d*rad}
     if(stats.lob&&d<stats.reach*.8){tx=-tx;ty=-ty}   // 远程投掷：保持距离   // 隔着河/崖时沿寻路图走（会绕到桥/浅滩）
     const k_=Math.min(1,dt*7);e.vx=(e.vx??tx)+(tx-(e.vx??tx))*k_;e.vy=(e.vy??ty)+(ty-(e.vy??ty))*k_;   // 转向限速：方向逐渐转过去
     const vl=Math.hypot(e.vx,e.vy)||1,ux=e.vx/vl,uy=e.vy/vl;
     if(e.slowT>0)e.slowT-=dt;if(e.buffT>0)e.buffT-=dt;if(e.wwT>0){e.wwT-=dt;e.wwc=(e.wwc||0)-dt;if(d<34&&e.wwc<=0){e.wwc=.3;onHit(BD*.5)}}if(stats.ghost){e.phC=(e.phC??6)-dt;if(e.phC<=0){e.phC=6;e.phT=1.5}if(e.phT>0)e.phT-=dt}
     const oldx=e.x,oldy=e.y,dist=(e.buffT>0?1.3:1)*(e.wwT>0?1.3:1)*((e.slowT>0&&!stats.heavy)?.5:1)*(e.boss?.8:1)*stats.speed*(water(e.x,e.y)===2?.6:1)*dt*speed,mx=ux*dist,my=uy*dist;
     if(stats.ghost){e.x+=mx;e.y+=my}else if(ok(e.x+mx,e.y+my)){e.x+=mx;e.y+=my}else if(ok(e.x+mx,e.y)){e.x+=mx}else if(ok(e.x,e.y+my)){e.y+=my}
     else if(ok(e.x-my*1.6,e.y+mx*1.6)){e.x-=my*1.6;e.y+=mx*1.6}
     e.moving=e.x!==oldx||e.y!==oldy;
     // 防卡：4 秒内离主角的路程没有变近，就从屏幕外换到主角附近能走到的地方
     const pd=window.PATHAT?.(e.x,e.y)??-1;e.stuckT=(e.stuckT||0)+dt;
     if(pd>=0&&(e.bestPd==null||pd<e.bestPd-1)){e.bestPd=pd;e.stuckT=0}
     const C_=window.CAM,far2=C_&&(Math.abs(e.x-hero.x)>C_.VW||Math.abs(e.y-hero.y)>C_.VH);   // 离主角超过两个半屏（屏幕外很远）才挪
     if(e.stuckT>4&&!e.boss&&far2){for(let k=0;k<12;k++){const a=Math.random()*6.283,r=Math.hypot(C_.VW,C_.VH)*.55+Math.random()*40,nx=hero.x+Math.cos(a)*r,ny=hero.y+Math.sin(a)*r,np=window.PATHAT?.(nx,ny)??-1;
       if(np>=0&&np<60&&ok(nx,ny)){e.x=nx;e.y=ny;break}}e.stuckT=0;e.bestPd=null}
    }
   }
  }
  for(let i=lobs.length-1;i>=0;i--){const L=lobs[i];L.t+=dt;if(L.t>=L.d){explode(L.x,L.y,L.r,L.dm,false);lobs.splice(i,1)}}
  for(let i=booms.length-1;i>=0;i--){booms[i].t+=dt;if(booms[i].t>.4)booms.splice(i,1)}
  for(let i=arrows.length-1;i>=0;i--){
   const p=arrows[i],oldx=p.x,oldy=p.y;p.x+=p.dx*145*dt;p.y+=p.dy*145*dt;p.life-=dt;
   const vx=p.x-oldx,vy=p.y-oldy,v2=vx*vx+vy*vy;
   const t=v2?Math.max(0,Math.min(1,((hero.x-oldx)*vx+(hero.y-10-oldy)*vy)/v2)):0;
   if(Math.hypot(oldx+vx*t-hero.x,oldy+vy*t-(hero.y-10))<8){onHit(p.dm);arrows.splice(i,1)}
   else if(p.life<=0||!ok(p.x,p.y+10))arrows.splice(i,1);
  }
 }
 function frame(e,now){
  if(e.k==='gob_paladin'){const F=data[e.k].frames,m={aim:'charge',dash:'charge',judge:'judge',howl:'howl',aegis:'aegis',smash:e.timer<(e.st||1)?'windup':'strike'};if(m[e.state]&&F[m[e.state]])return F[m[e.state]]}
  let name=e.state==='aim'||e.state==='bash'||e.state==='fuse'||e.state==='smash'||e.state==='cast'||(e.state==='leap'&&e.timer<1)?'windup':e.state==='dash'||e.state==='leap'?'strike':e.state;
  if(name==='move')name=e.moving?'walk'+(Math.floor(now/110+e.ph)%(data[e.k].nw||6)):'idle'+(Math.floor(now/650)%2);
  if(name==='recover'&&!data[e.k].frames.recover)name='idle0';
  if(name==='windup'&&data[e.k].frames.draw&&e.timer>.22)name='draw';
  return data[e.k].frames[name]||data[e.k].frames.idle0;
 }
 function getFrame(e,now){const f=frame(e,now),name=Object.keys(data[e.k].frames).find(key=>data[e.k].frames[key]===f);return {f,im:images['en_'+e.k+'_'+name]}}
 function draw(e,c,cx,cy,now){
  if(e.drum){const im=images[e.dead?'camp_drum_x':'camp_drum'],w=44,h=38,x=e.x-cx,y=e.y-cy;c.save();if(e.flash>0)c.filter='brightness(1.8)';if(im)c.drawImage(im,x-w/2,y-h+4,w,h);c.filter='none';if(!e.dead){c.fillStyle='#0009';c.fillRect(x-22,y-h-3,44,4);c.fillStyle='#e8503a';c.fillRect(x-21,y-h-2,42*Math.max(0,e.hp/e.hpMax),2)}c.restore();return}
  const {f,im}=getFrame(e,now);
  if(e.state==='fuse'||e.state==='smash'){const T=e.state==='fuse'?1.5:(e.st||1.2),R_=e.state==='fuse'?40:(e.sr||35),k=Math.min(1,e.timer/T);c.save();c.globalAlpha=.15+.45*k;c.fillStyle='#ff3a2a';c.beginPath();c.ellipse(e.x-cx,e.y-cy,R_,R_*.8,0,0,6.3);c.fill();c.globalAlpha=.8;c.strokeStyle='#ff3a2a';c.lineWidth=1;c.beginPath();c.ellipse(e.x-cx,e.y-cy,R_*k,R_*.8*k,0,0,6.3);c.stroke();c.restore()}
  if(e.state==='leap'){const k=Math.min(1,e.timer/1);c.save();c.globalAlpha=.2+.4*k;c.fillStyle='#ff3a2a';c.beginPath();c.ellipse(e.lx1-cx,e.ly1-cy,50,40,0,0,6.3);c.fill();c.restore()}
  if(e.state==='judge'){const k=Math.min(1,e.timer/1.5),x=e.jx-cx,y=e.jy-cy;c.save();c.globalAlpha=.3+.6*k;c.strokeStyle='#ffd23f';c.lineWidth=3;c.beginPath();c.moveTo(x-18,y);c.lineTo(x+18,y);c.moveTo(x,y-14);c.lineTo(x,y+14);c.stroke();c.globalAlpha=.15+.25*k;c.fillStyle='#ffd23f';c.beginPath();c.ellipse(x,y,40,32,0,0,6.3);c.fill();c.restore()}
  if(e.state==='howl'||e.hwFx>0){if(e.hwFx>0)e.hwFx-=1/60;const k=e.state==='howl'?e.timer:1-e.hwFx/.6;c.save();c.globalAlpha=.5*(1-k*.5);c.strokeStyle='#cfefff';c.lineWidth=2;c.beginPath();c.ellipse(e.x-cx,e.y-cy,80*k,64*k,0,0,6.3);c.stroke();c.restore()}
  if(e.aegT>0&&!e.dead){c.save();c.globalAlpha=.25+.1*Math.sin(now/120);c.fillStyle='#ffe27a';c.beginPath();c.ellipse(e.x-cx,e.y-cy-18*(e.sc||1),30,30,0,0,6.3);c.fill();c.restore()}
  if(e.drFx>0){e.drFx-=1/60;c.save();c.globalAlpha=e.drFx;c.strokeStyle='#ff6a3a';c.lineWidth=2;c.beginPath();c.ellipse(e.x-cx,e.y-cy,100*(1-e.drFx),80*(1-e.drFx),0,0,6.3);c.stroke();c.restore()}
  if(e.buffT>0&&!e.dead){c.save();c.globalAlpha=.5;c.strokeStyle='#ff5a3a';c.lineWidth=1;c.beginPath();c.ellipse(e.x-cx,e.y-cy,7,2.6,0,0,6.3);c.stroke();c.restore()}
  if(e.state==='aim'){const k=e.timer/(e.aimT||.5),L_=e.alen||80;c.save();c.globalAlpha=.25+.5*k;c.strokeStyle=e.k==='gob_paladin'?'#ffd23f':'#ff3a2a';c.lineWidth=2;c.beginPath();c.moveTo(e.x-cx,e.y-cy);c.lineTo(e.x-cx+e.dx*L_,e.y-cy+e.dy*L_);c.stroke();c.restore()}
  if(e.state==='bash'){const k=Math.min(1,e.timer),a0=(e.bx||1)>0?-Math.PI/2:Math.PI/2;c.save();c.globalAlpha=.2+.45*k;c.fillStyle='#ff3a2a';c.beginPath();c.moveTo(e.x-cx,e.y-cy);c.ellipse(e.x-cx,e.y-cy,32*k,22*k,0,a0,a0+Math.PI);c.closePath();c.fill();c.restore()}
  const sc=e.sc||1;c.save();c.translate(Math.round(e.x-cx),Math.round(e.y-cy));c.scale(e.face*sc,sc);c.globalAlpha=e.alpha??1;c.imageSmoothingEnabled=false;
  if(!e.dead){c.fillStyle='rgba(10,20,10,.32)';c.beginPath();c.ellipse(0,0,6,2.2,0,0,6.3);c.fill()}   // 脚下阴影：雨雾天也看得清
  if(e.flash>0){e.flash-=1/60;c.filter='brightness(2.2)'}
  if(data[e.k].ghost)c.globalAlpha*=e.phT>0?.25:.75;
  if(e.hop)c.translate(0,-e.hop/sc);
  c.drawImage(im,-f.anchor[0],-f.anchor[1],f.size[0],f.size[1]);c.restore();
  if((e.elite||e.boss)&&!e.dead&&e.hpMax){const w=e.boss?40:20,x=Math.round(e.x-cx-w/2),y=Math.round(e.y-cy-f.anchor[1]*sc-4);c.fillStyle='rgba(0,0,0,.6)';c.fillRect(x,y,w,2.5);c.fillStyle=e.boss?'#ff5a4a':'#c77dff';c.fillRect(x,y,w*Math.max(0,e.hp/e.hpMax),2.5)}
 }
 function drawArrows(c,cx,cy){
  for(const L of lobs){const k=L.t/L.d;c.save();c.globalAlpha=.25+.35*k;c.fillStyle=L.k==='fire'?'#a040ff':'#3a2a20';c.beginPath();c.ellipse(L.x-cx,L.y-cy,L.r*k,L.r*.8*k,0,0,6.3);c.fill();c.restore();
   const im=FX[L.k==='fire'?'lob_fire':'lob_rock'],x=L.x0+(L.x-L.x0)*k,y=L.y0+(L.y-L.y0)*k-Math.sin(k*Math.PI)*(L.k==='rock'?60:25);if(im.complete&&im.width){const w=L.k==='rock'?12:16,h=im.height*w/im.width;c.drawImage(im,x-cx-w/2,y-cy-h/2,w,h)}}
  for(const b of booms){const im=FX['boom'+Math.min(3,Math.floor(b.t/.1))];if(im.complete&&im.width){const w=b.r*2.2,h=im.height*w/im.width;c.drawImage(im,b.x-cx-w/2,b.y-cy-h/2,w,h)}}
  for(const p of arrows){const f=data[p.k].frames.arrow,im=images['en_'+p.k+'_arrow'];c.save();c.translate(p.x-cx,p.y-cy);
   if(f&&im){c.rotate(Math.atan2(p.dy,p.dx));c.imageSmoothingEnabled=false;c.drawImage(im,-f.size[0]/2,-f.size[1]/2,f.size[0],f.size[1])}
   else{const g=c.createRadialGradient(0,0,0,0,0,5);g.addColorStop(0,'rgba(240,200,255,1)');g.addColorStop(.5,'rgba(170,80,240,.9)');g.addColorStop(1,'rgba(120,40,200,0)');c.fillStyle=g;c.beginPath();c.arc(0,0,5,0,6.3);c.fill()}
   c.restore()}
 }
 return {make,hit,update,reset,draw,drawArrows,getFrame};
}
