// 敌人（哥布林）：动作、受击、死亡与远程弹；命中事件交给调用方。
export function createEnemies({data,images,hero,ok,water,onHit}){
 const kinds=['goblin','gob_blade','gob_archer','gob_shield'],arrows=[],lobs=[],booms=[];window.__EP={arrows,lobs,booms};   // 测试机器人读取敌方飞行物
 const FX={};for(const n of ['lob_fire','lob_rock','boom0','boom1','boom2','boom3']){const im=new Image();im.src='assets/characters/enemies/fx/'+n+'.png';FX[n]=im}
 const near=(x,y,r,en)=>en.filter(o=>!o.dead&&(o.x-x)**2+((o.y-y)*1.25)**2<r*r);
 let EN=[];const PH={};const SPR_=[],PIL=[];
 let bag=[];
 function nextKind(){
  if(!bag.length){bag=[...kinds];for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]]}}
  return bag.pop();
 }
 function make(x,y,k=nextKind()){return {k,x,y,face:1,hp:data[k].hp,state:'move',timer:0,cooldown:Math.random()*.8,ph:Math.random()*9,dead:false,sc0:data[k].sc}}
 function hit(e,dmg=1){
  if(e.dead)return false;
  if(data[e.k].ghost&&e.phT>0)dmg*=.5;
  if(e.aegT>0||e.crT>0){e.flash=.08;return true}
  if(e.k==='gob_paladin'&&e.hpMax){for(const th of [.5,.25])if(!e['ag'+th]&&e.hp-dmg<e.hpMax*th){e['ag'+th]=1;e.state='aegis';e.timer=0;e.aegT=4;e.aegHp=e.hpMax*.12;e.aegMax=e.aegHp;for(const o of near(e.x,e.y,120,EN))if(o!==e&&o.hpMax)o.hp=Math.min(o.hpMax,o.hp+o.hpMax*.3)}}
  if(e.ward)dmg*=.5;
  if(e.k==='gob_wolf'&&!e.dism&&e.hp-dmg<e.hpMax*.5&&e.hp-dmg>0){e.dism=1;window.onDismount?.(e);e.k='goblin';e.sc0=data.goblin.sc;e.sc=data.goblin.sc||1;e.fell=.6}
  e.flash=Math.max(e.flash||0,.07);e.hp-=dmg;
  if(e.hp<=0&&data[e.k].bomb&&!e.boomed&&e.state==='fuse'){e.boomed=1;explode(e.x,e.y,40,data[e.k].damage*(e.dmgMul||1)*3,true)}
  if(e.hp<=0){e.dead=true;e.state='fall';e.timer=0;e.alpha=1}
  else if(!e.boss&&!e.elite&&e.state!=='dash'){e.state='hurt';e.timer=0;e.cooldown=.25}else e.flash=.12
  return true;
 }
 function explode(x,y,r,dm,hurtEn){booms.push({x,y,t:0,r});window.SHAKE?.(2);if(Math.hypot(hero.x-x,(hero.y-y)*1.25)<r)onHit(dm);if(hurtEn)for(const o of near(x,y,r,EN))if(!o.boomed)hit(o,dm*.6);window.SFX?.boom?.()}
 function reset(){arrows.length=0;lobs.length=0;booms.length=0;SPR_.length=0;PIL.length=0}
 let CT=[];
 function update(en,dt,speed){EN=en;if(dt>0){const hx=(hero.x-(PH.x??hero.x))/dt,hy=(hero.y-(PH.y??hero.y))/dt;PH.vx=(PH.vx||0)*.85+hx*.15;PH.vy=(PH.vy||0)*.85+hy*.15}PH.x=hero.x;PH.y=hero.y;
  for(const e of en){window.CUR_E=e.k+(e.boss?'·Boss':e.elite?'·精英':'');
   const stats=data[e.k];e.timer+=dt;e.moving=false;
   if(e.dead){if(e.crate){e.expired=true;continue}if(e.drum)continue;
    if(e.state==='fall'&&e.timer>=.4){e.state='down';e.timer=0}
    else if(e.state==='down'&&e.soulT>0){e.alpha=1}else if(e.state==='down'){e.alpha=Math.max(0,1-Math.max(0,e.timer-.55)/.8);if(e.timer>=1.35)e.expired=true}
    continue;
   }
   if(e.drum){if(e.flash>0)e.flash-=dt;continue}
   const ax=hero.x-e.x,ay=hero.y-e.y,d=Math.hypot(ax,ay)||1;if(e.state!=='dash'){if(e.k==='gob_shield'&&!e.shBrk){e.turnT=(e.turnT||0)-dt;const want=ax>=0?1:-1;if(want!==e.face&&e.turnT<=0){e.face=want;e.turnT=1.2}}else e.face=ax>=0?1:-1}
   if(e.stunT>0){e.stunT-=dt;e.moving=false;continue}   // 圣印定身：不动、不打、不碰撞伤害
   const BD=stats.damage*(e.dmgMul||1)*(e.boss?1.3:e.elite?1.4:1);
   // 碰撞伤害：同一只怪每 0.5 秒最多一次
   e.cc=(e.cc||0)-dt;if(!stats.ranged&&!stats.bomb&&e.cc<=0&&Math.hypot(ax,(ay+2)*1.2)<Math.max(13+5*(e.sc||1),stats.reach*(e.sc||1)*.9)){e.cc=.5;const tn=performance.now();CT=CT.filter(t=>tn-t<500);if(CT.length<4){CT.push(tn);onHit(BD*.4)}}   // 被围也最多算 4 只的碰撞
   if(e.lifeT!=null){e.lifeT-=dt;if(e.lifeT<=0){if(e.k==='gob_kid'&&Math.random()<.5&&Math.hypot(ax,ay)<420){e.lifeT=null;e.sweep=null;e.k='goblin';e.grown=1;e.hp=e.hpMax=Math.ceil(e.hpMax*2.5);window.onGrow?.(e)}else{e.expired=true;continue}}}
   if(e.fearT>0){e.fearT-=dt;const sp=stats.speed*1.2*dt*speed,nx=e.x-ax/d*sp,ny=e.y-ay/d*sp;if(ok(nx,ny)){e.x=nx;e.y=ny}e.face=ax>=0?-1:1;e.moving=true;e.state='move';continue}
   if(e.sweep){const sp=stats.speed*(stats.charge?3:1.8)*dt*speed;e.x+=e.sweep[0]*sp;e.y+=e.sweep[1]*sp;e.face=e.sweep[0]>=0?1:-1;e.moving=true;e.state='move';continue}   // 过场：直线冲过去
   if(e.state==='aim'){if(e.timer>=(e.aimT||.5)){e.state='dash';e.timer=0;e.dashHit=0}continue}
   if(e.thrown){const T=e.thrown;T.t+=dt;const k=Math.min(1,T.t/T.d);e.x=T.x0+(T.x1-T.x0)*k;e.y=T.y0+(T.y1-T.y0)*k;e.hop=Math.sin(k*Math.PI)*45;if(k>=1){e.hop=0;e.thrown=null;explode(e.x,e.y,24,T.dm,false);e.stunT=1.5;window.SHAKE?.(1.5)}continue}   // 被巨人扔出去的小怪
   if(e.dazeT>0){e.dazeT-=dt;e.moving=false;continue}
   if(e.ctrT>0){e.ctrT-=dt;if(e.ctrT<=0){e.swFx=.2;if(Math.hypot(hero.x-e.x,hero.y-e.y)<46)onHit(BD*.8)}}
   if(e.state==='combo'){const H=[.45,.9,1.5],R_=[30,30,44],M=[.6,.6,1];e.moving=false;for(let i=0;i<3;i++)if(!(e.cmb>i)&&e.timer>=H[i]){e.cmb=i+1;e.swFx=.2;const cx_=e.x+e.face*10;if(Math.hypot(hero.x-cx_,(hero.y-e.y)*1.25)<R_[i])onHit(BD*M[i]);if(i===2)window.SHAKE?.(1.5)}if(e.timer>=1.8){e.state='move';e.timer=0;e.cmb=0;e.cooldown=2.5}continue}
   if(stats.leap&&!e.boss){e.tgT=(e.tgT??3)-dt;   // 巨型哥布林：抓小怪扔、半血怒吼、践踏
    if(!e.enr&&e.hpMax&&e.hp<e.hpMax*.5){e.enr=1;e.chain=3;e.bcd=0;window.onRoar?.(e)}
    if(e.moving){e.stT=(e.stT??.6)-dt;if(e.stT<=0){e.stT=.6;if(Math.random()<.2){e.stFx=.3;if(d<30)window.HSLOW=performance.now()+800}}}
    if(e.tgT<=0&&d>50&&d<200&&e.state!=='leap'){e.tgT=5;let b=null,bd=40*40;for(const o of en){if(o===e||o.dead||o.elite||o.boss||o.drum||o.thrown)continue;const q=(o.x-e.x)**2+(o.y-e.y)**2;if(q<bd){bd=q;b=o}}if(b){b.thrown={x0:b.x,y0:b.y,x1:hero.x,y1:hero.y,t:0,d:.9,dm:BD*1.5};b.state='move';e.flash=.15}}}
   if(e.k==='gob_mage'&&!e.boss){e.blCd=(e.blCd??0)-dt;e.rnCd=(e.rnCd??4)-dt;   // 法师：闪现（冷却 6 秒）、火雨（念咒 2 秒）
    if(e.rain>0){e.rain-=dt;e.moving=false;if(e.rain<=0){for(let i=0;i<5;i++){const a=Math.random()*6.28,r=Math.random()*70;lobs.push({k:'fire',x0:e.x,y0:e.y-30,x:hero.x+Math.cos(a)*r,y:hero.y+Math.sin(a)*r*.8,t:-i*.15,d:.9,r:20,dm:BD*1.3})}}continue}
    if(d<40&&e.blCd<=0){for(let k=0;k<10;k++){const a=Math.random()*6.28,nx=hero.x+Math.cos(a)*110,ny=hero.y+Math.sin(a)*80;if(ok(nx,ny)){window.onBlink?.(e.x,e.y);e.x=nx;e.y=ny;e.blCd=6;break}}continue}
    if(e.rnCd<=0&&d<200){e.rain=2;e.rnCd=8;continue}}
   if(e.k==='gob_rock'&&!e.boss&&(e.shed||0)<3&&e.hpMax&&e.hp<e.hpMax*(1-.25*((e.shed||0)+1))){e.shed=(e.shed||0)+1;e.spdMul=1+.4*e.shed;e.sc=(e.sc||1)*.94;window.onShed?.(e)}   // 岩甲：血掉到 75/50/25% 各剥一层石甲
   if(e.state==='dash'){const st=(e.dsp||320)*dt,nx=e.x+e.dx*st,ny=e.y+e.dy*st;if(ok(nx,ny)){e.x=nx;e.y=ny}else if(stats.charge){e.state='move';e.timer=0;e.dcd=e.dcdN||4;e.dazeT=2;window.SHAKE?.(2);window.onDaze?.(e);continue}e.moving=true;
    if(stats.charge){for(const o of EN){if(o===e||o.dead||o.boss||o.drum||o.k==='gob_boar')continue;const qx=o.x-e.x,qy=o.y-e.y,q=Math.hypot(qx,qy);if(q<14&&q>0){const sd=(-e.dy*qx+e.dx*qy)>=0?1:-1,nx2=o.x-e.dy*sd*10,ny2=o.y+e.dx*sd*10;if(ok(nx2,ny2)){o.x=nx2;o.y=ny2}}}}   // 野猪冲锋：把沿途的小怪撞到两边
    if(!e.dashHit&&Math.hypot(hero.x-e.x,hero.y-e.y)<12){e.dashHit=1;onHit(BD);if(stats.charge){for(let i=8;i>=1;i--){const k=40*i/8,hx=hero.x+e.dx*k,hy=hero.y+e.dy*k;if(ok(hx,hy)){hero.x=hx;hero.y=hy;break}}window.SHAKE?.(3)}}if(e.timer>=(e.dlen||.25)){e.state='recover';e.timer=0;if(data[e.k].frames.tired){e.tiredT=1;e.slowT=Math.max(e.slowT||0,1)}e.dcd=e.dcdN||4;e.dsp=e.dlen=0}continue}
   if(e.aegT>0){e.aegT-=dt;e.plT=(e.plT??0)-dt;if(e.plT<=0){e.plT=.7;for(let i=0;i<2;i++){const a=Math.random()*6.28,r=Math.random()*70;PIL.push({x:hero.x+Math.cos(a)*r,y:hero.y+Math.sin(a)*r*.8,t:0,d:.8,r:18,dm:BD*.8})}}}   // 圣盾期间圣光阵;
   if(e.state==='aegis'){if(e.timer>=1){e.state='move';e.timer=0}continue}
   if(e.state==='judge'){if(e.timer>=1.5){e.state='recover';e.timer=0;explode(e.jx,e.jy,40,BD*4,false)}continue}
   if(e.state==='howl'){if(e.timer>=1){e.state='recover';e.timer=0;if(d<80)window.HSLOW=performance.now()+2000;e.hwFx=.6}continue}
   if(e.state==='fuse'){if(e.timer>=.5){const sp=170*dt,nx=e.x+e.fx*sp,ny=e.y+e.fy*sp;if(ok(nx,ny)){e.x=nx;e.y=ny}e.moving=true;e.face=e.fx>=0?1:-1}   // 点燃 0.5 秒后推着炸弹直线冲
    if(e.timer>=1.5||(e.timer>=.5&&Math.hypot(hero.x-e.x,hero.y-e.y)<14)){e.boomed=1;explode(e.x,e.y,40,BD*3,true);e.hp=0;e.dead=true;e.state='fall';e.timer=0;e.alpha=1}continue}
   if(e.state==='smash'){const R_=e.sr||35;if(e.timer>=(e.st||1.2)){e.state='strike';e.timer=0;explode(e.x+(e.bx>0?8:e.bx<0?-8:0),e.y,R_,BD*2,false);if(e.k==='gob_rock'){if(Math.hypot(hero.x-e.x,(hero.y-e.y)*1.25)<R_)window.HSLOW=performance.now()+1200;window.SHAKE?.(2)}e.bcd=e.boss?3:e.k==='gob_rock'?4:6}continue}
   if(e.state==='leap'){if(e.timer<1){continue}const k=Math.min(1,(e.timer-1)/.45);e.x=e.lx0+(e.lx1-e.lx0)*k;e.y=e.ly0+(e.ly1-e.ly0)*k;e.hop=Math.sin(k*Math.PI)*40;if(k>=1){e.hop=0;e.state='strike';e.timer=0;explode(e.x,e.y,50,BD*2,false);if(e.chain>0){e.chain--;e.bcd=.6}else e.bcd=e.enr?2:4}continue}
   if(e.state==='cast'){if(e.timer>=(stats.lob==='rock'?1:.8)){e.state='strike';e.timer=0;if(e.k==='gob_thrower'&&Math.random()<.35){const vol={n:0},a=Math.random()*6.28;for(let i=0;i<3;i++){const o=40*(2-i)/2;lobs.push({k:'rock',x0:e.x,y0:e.y-14,x:hero.x+Math.cos(a)*o,y:hero.y+Math.sin(a)*o*.8,t:-i*.35,d:1,r:22,dm:BD*2.5,vol})}}else lobs.push({k:stats.lob,x0:e.x,y0:e.y-14,x:hero.x,y:hero.y,t:0,d:stats.lob==='rock'?1:.8,r:stats.lob==='rock'?22:25,dm:BD*(stats.lob==='rock'?2.5:2)});e.cooldown=stats.lob==='rock'?3:4}continue}
   if(e.state==='bash'){if(e.timer>=1){e.state='strike';e.timer=0;const fr=Math.sign(ax)===Math.sign(e.bx||1);if(d<32&&fr){onHit(BD);const nx=hero.x+ax/d*22,ny=hero.y+ay/d*22;if(ok(nx,ny)){hero.x=nx;hero.y=ny}}e.bcd=5}continue}
   if(e.state==='hurt'){if(e.timer>=.25){e.state='move';e.timer=0}continue}
   if(e.state==='windup'){
    if(e.timer>=.45){
     e.state='strike';e.timer=0;
     if(stats.ranged){
      const len=Math.hypot(ax,ay)||1;
      arrows.push({k:e.k,x:e.x,y:e.y-10,dx:ax/len,dy:ay/len,life:1.6,dm:stats.damage*(e.dmgMul||1)*(e.elite?1.3:1)});
      if(e.k==='gob_archer'&&!(e.vlT>performance.now())){const g=en.filter(o=>o!==e&&o.k==='gob_archer'&&!o.dead&&(o.x-e.x)**2+(o.y-e.y)**2<60*60);if(g.length>=2){window.onVolley?.(e);for(const o of g){o.flash=.15;o.vlT=performance.now()+2500;o.cooldown=Math.max(o.cooldown||0,1.5);arrows.push({k:o.k,x:o.x,y:o.y-10,dx:ax/len,dy:ay/len,life:1.6,dm:stats.damage*(o.dmgMul||1)})}e.vlT=performance.now()+2500}}   // 弓手齐射：同一方向一排箭
     }else if((e.elite||e.boss)&&d<=(stats.reach+5)*(e.sc||1)){onHit(BD)}   // 普通怪挥砍只是动画，伤害靠碰撞
    }
   }else if(e.state==='strike'){
    if(e.timer>=.2){e.state='recover';e.timer=0}
   }else if(e.state==='recover'){
    if(e.timer>=.45){e.state='move';e.timer=0;e.cooldown=stats.ranged?1.4+Math.random()*.5:.55+Math.random()*.35}   // 弓手一轮约 2.5–3 秒
   }else{
    e.cooldown=Math.max(0,e.cooldown-dt);e.dcd=(e.dcd||0)-dt;e.bcd=(e.bcd||0)-dt;
    const reg=!e.elite&&!e.boss;
    if(stats.bomb&&reg&&d<90){e.state='fuse';e.timer=0;e.fx=ax/d;e.fy=ay/d;continue}
    if(stats.charge&&reg&&d<150&&d>30&&e.dcd<=0){e.state='aim';e.timer=0;e.aimT=.8;e.dx=ax/d;e.dy=ay/d;e.dsp=260;e.dlen=(d+100)/260;e.dcdN=5;e.alen=d+100;continue}
    if(stats.heavy&&reg&&d<(e.k==='gob_rock'?60:28)&&e.bcd<=0){e.state='smash';e.timer=0;e.sr=e.k==='gob_rock'?55:35;e.st=e.k==='gob_rock'?1:1.2;e.bx=e.k==='gob_rock'?0:ax;continue}   // 岩甲地震拳：以自己为中心
    if(stats.leap&&e.bcd<=0&&d<170&&d>40){e.state='leap';e.timer=0;e.lx0=e.x;e.ly0=e.y;e.lx1=hero.x;e.ly1=hero.y;continue}
    if(stats.leap&&e.bcd<=0&&d<=40){e.state='smash';e.timer=0;e.sr=40;e.st=.7;e.bx=ax;continue}
    if(stats.lob&&d<=stats.reach&&e.cooldown===0){e.state='cast';e.timer=0;continue}
    if(stats.orbit&&reg){if(d<100&&(e.orT??-1)<0&&e.dcd<=0)e.orT=2+Math.random();if(e.orT>0){e.orT-=dt;if(e.orT<=0){e.orT=-1;e.state='aim';e.timer=0;e.aimT=.4;e.dx=ax/d;e.dy=ay/d;e.dsp=300;e.dlen=(d+20)/300;e.dcdN=4;e.alen=d+20;continue}}}
    if(stats.drum){e.drT=(e.drT??1)-dt;e.chT=(e.chT??6)-dt;if(e.drT<=0){e.drT=e.rollT>0?.25:2;e.drFx=.6;window.SFX?.drum?.(e.rollT>0);for(const o of near(e.x,e.y,110,en))o.buffT=2.5}   // 鼓手：每 2 秒一下鼓点，鼓舞周围
     if(e.rollT>0)e.rollT-=dt;if(e.chT<=0){e.chT=11;e.rollT=1.2;window.onDrumRoll?.(e);for(const o of near(e.x,e.y,170,en))if(!o.boss&&o!==e)o.chgT=3}}   // 战鼓冲锋：急促鼓点，周围怪一起冲 3 秒
    if(stats.necro){e.nkT=(e.nkT??3)-dt;e.dnT=(e.dnT??3)-dt;
     if(e.nkT<=0){e.nkT=6;e.flash=.15;let n=0;for(const o of en){if(n>=4)break;if(o.dead&&!o.expired&&!o.raised&&!o.boss&&!o.drum&&o.k!=='skeleton'&&(o.x-e.x)**2+(o.y-e.y)**2<130*130){o.raised=1;o.soulT=1.5;o.soulBy=e;n++}}}   // 死灵师：尸体冒魂火 1.5 秒后爬起来；主角踩上去可踩碎
     if(e.dnT<=0&&e.hp<e.hpMax){e.dnT=3;let b=null,bd=120*120;for(const o of en){if(o.k!=='skeleton'||o.dead)continue;const q=(o.x-e.x)**2+(o.y-e.y)**2;if(q<bd){bd=q;b=o}}if(b){b.dead=true;b.expired=true;e.hp=Math.min(e.hpMax,e.hp+e.hpMax*.15);window.onDrain?.(e,b)}}}   // 献祭骷髅回血
    if(e.boss&&e.k==='gob_paladin'){e.skT=(e.skT??2.5)-dt;if(e.skT<=0){e.skT=3.5;const r=Math.random();
      if(d<60&&r<.4){e.state='smash';e.timer=0;e.sr=55;e.st=.8;e.bx=ax;continue}
      else if(r<.65&&d>40){e.state='aim';e.timer=0;e.aimT=1;e.dx=ax/d;e.dy=ay/d;e.dsp=300;e.dlen=(d+100)/300;e.dcdN=0;e.alen=d+100;continue}
      else if(r<.85){e.state='judge';e.timer=0;e.jx=hero.x;e.jy=hero.y;continue}
      else{e.state='howl';e.timer=0;continue}}}
    if(e.k==='gob_emperor'){   // 皇帝：三阶段＋皇冠之怒
     const P=e.hp>e.hpMax*.6?1:e.hp>e.hpMax*.3?2:3;
     if(e.crT>0){e.crT-=dt;e.moving=false;let n=e.crN||0;for(const o of en){if(n>=20)break;if(o===e||o.dead||o.elite||o.boss||o.drum||o.suck)continue;if((o.x-e.x)**2+(o.y-e.y)**2<200*200){o.suck=e;n++}}e.crN=n;
      for(const o of en){if(o.suck!==e||o.dead)continue;const qx=e.x-o.x,qy=e.y-30-o.y,q=Math.hypot(qx,qy);if(q<12){o.dead=true;o.expired=true;o.noChest=1;e.aegMax=Math.max(e.aegMax||0,e.hpMax*.2);e.aegHp=Math.min(e.hpMax*.2,(e.aegHp||0)+e.hpMax*.01);e.aegT=1e9}else{o.x+=qx/q*Math.min(q,260*dt);o.y+=qy/q*Math.min(q,260*dt)}}
      if(e.crT<=0){window.SHAKE?.(3);if(d<120){const k=60/d;for(let i=8;i>=1;i--){const hx=hero.x+ax/d*60*i/8,hy=hero.y+ay/d*60*i/8;if(ok(hx,hy)){hero.x=hx;hero.y=hy;break}}}window.onCrownEnd?.(e)}continue}
     if(P>(e.ph||1)){e.ph=P;e.crT=2;e.crN=0;e.wwT=0;e.wwPre=0;e.spQ=0;if(P===2){e.rage=1;e.spdMul=1.4}window.onCrown?.(e);continue}
     if(e.wwPre>0){e.wwPre-=dt;e.moving=false;if(e.wwPre<=0){e.wwT=2;e.wwS=.6}continue}
     if(e.spQ>0){e.moving=false;e.spT-=dt;if(e.spT<=0){SPR_.push({x:e.x,y:e.y-20,dx:e.spD[0],dy:e.spD[1],life:.9,dm:BD*.9,st:0,img:1});e.spQ--;e.spT=.4;e.spD=[ax/d,ay/d]}continue}
     if(P===3){e.plT=(e.plT??0)-dt;if(e.plT<=0){e.plT=.9;for(let i=0;i<2;i++){const a=Math.random()*6.28,r=Math.random()*80;PIL.push({x:hero.x+Math.cos(a)*r,y:hero.y+Math.sin(a)*r*.8,t:0,d:.8,r:18,dm:BD*.7})}}}
     e.skT=(e.skT??3)-dt;if(e.skT<=0&&e.state!=='judge'){
      if(P===1){if(d<100){e.skT=5;e.wwPre=.6;continue}if(!(e.smT>0)){e.smT=1;window.onHorn2?.(e)}e.skT=1}
      else if(P===2){e.skT=3.2;e.spQ=3;e.spT=.4;e.spD=[ax/d,ay/d];continue}
      else{e.skT=2.5;e.state='judge';e.timer=0;e.jx=hero.x;e.jy=hero.y;continue}}
     if(e.smT>0)e.smT-=dt/14}
    if(e.boss&&e.k==='gob_king'){   // 大王：70%/40% 吹号召小弟；旋风斩
     for(const th of [.7,.4])if(!e['hn'+th]&&e.hp<e.hpMax*th){e['hn'+th]=1;window.onHorn?.(e)}
     if(e.wwPre>0){e.wwPre-=dt;e.moving=false;if(e.wwPre<=0){e.wwT=2;e.wwS=.6}continue}
     e.skT=(e.skT??4)-dt;if(e.skT<=0&&d<90&&!(e.wwT>0)){e.skT=6;e.wwPre=.6;continue}}
    if(e.boss&&e.k==='gob_chief'){
     if(!e.rage&&e.hp<e.hpMax*.3){e.rage=1;e.spdMul=1.5;window.onRage?.(e)}   // 酋长：30% 以下狂暴
     if(e.spQ>0){e.moving=false;e.spT-=dt;if(e.spT<=0){SPR_.push({x:e.x,y:e.y-14,dx:e.spD[0],dy:e.spD[1],life:.8,dm:BD*.9,st:0});e.spQ--;e.spT=e.rage?.35:.5;e.spD=[ax/d,ay/d]}continue}   // 投矛：每支前 0.5 秒直线预警
     e.skT=(e.skT??3)-dt;if(e.skT<=0){e.skT=e.rage?2.7:4;const r=Math.random();if(r<.45&&d<60){e.state='smash';e.timer=0;e.sr=55;e.st=1.2;e.bx=ax;continue}else if(r<.75){e.spQ=3;e.spT=e.rage?.35:.5;e.spD=[ax/d,ay/d];continue}else{for(const o of en)if(!o.dead)o.buffT=10;e.cryFx=1}}}
    if(e.k==='gob_blade'&&!e.elite&&!e.boss&&d<70&&d>22&&e.dcd<=0){e.state='aim';e.timer=0;e.dx=ax/d;e.dy=ay/d;continue}   // 剑士：冲刺斩
    if(e.k==='gob_shield'&&!e.elite&&!e.boss&&d<26&&e.bcd<=0){e.state='bash';e.timer=0;e.bx=ax;continue}   // 盾卫：盾击
    const plain=!e.elite&&!e.boss&&!stats.ranged&&!stats.lob&&!stats.bomb;   // 普通近战小怪：边走边砍（动作只是表现，伤害靠碰撞）
    if(e.swT>0)e.swT-=dt;
    if(plain){if(d<=stats.reach*(e.sc||1)*1.2&&e.cooldown===0){e.swT=.9;e.cooldown=.9+Math.random()*.15}}
    if(e.k==='gob_archer'){if(d<50&&!(e.fleeT>0)&&!(e.fleeCd>0)){e.fleeT=1;e.fleeCd=3}if(e.fleeCd>0)e.fleeCd-=dt;if(e.fleeT>0){e.fleeT-=dt;const sp=stats.speed*1.6*dt*speed,nx=e.x-ax/d*sp,ny=e.y-ay/d*sp;if(ok(nx,ny)){e.x=nx;e.y=ny}e.face=ax>=0?-1:1;e.moving=true;continue}   // 弓手：被贴脸转身逃
     }
    if(plain||(e.k==='gob_archer'&&(Math.abs(ax)>230||Math.abs(ay)>140))){}
    else if(e.k==='gob_hero'&&d<=stats.reach*(e.sc||1)*1.2&&e.cooldown===0){e.state='combo';e.timer=0;e.cmb=0;continue}
    else if(d<=stats.reach*(e.sc||1)&&e.cooldown===0&&(!stats.ranged||(Math.abs(ax)<(window.VIEWHW||240)-8&&Math.abs(ay)<(window.VIEWHH||150)-8))){e.state='windup';e.timer=0;if(stats.ranged)e.flash=.12;continue}   // 远程怪只在屏幕内才拉弓
    if(d>(plain?6:stats.reach*(e.sc||1)*.85)){
     e.losT=(e.losT||0)-dt;if(e.losT<=0){e.losT=.25+Math.random()*.1;e.los=true;const n=Math.ceil(d/6);for(let k=1;k<n;k++){if(water(e.x+ax*k/n,e.y+ay*k/n)===1){e.los=false;break}}}   // 中间没有河/崖就直线走
     const fd=d>28&&!e.los&&!stats.ghost&&window.PATHDIR?.(e.x,e.y);let tx=fd?fd[0]:ax/d,ty=fd?fd[1]:ay/d;
     if(e.k==='gob_kid'&&!fd&&d>25){const lead=Math.min(1.2,d/90),px_=ax+(PH.vx||0)*lead,py_=ay+(PH.vy||0)*lead,pl=Math.hypot(px_,py_)||1;tx=px_/pl;ty=py_/pl}   // 崽：往主角预计要到的位置跑
     if(e.orT>0){const sg=e.ph>4.5?1:-1,rad=(d-70)/40;tx=-ay/d*sg+ax/d*rad;ty=ax/d*sg+ay/d*rad}
     if(stats.lob&&d<stats.reach*.8){tx=-tx;ty=-ty}   // 远程投掷：保持距离   // 隔着河/崖时沿寻路图走（会绕到桥/浅滩）
     const k_=Math.min(1,dt*7);e.vx=(e.vx??tx)+(tx-(e.vx??tx))*k_;e.vy=(e.vy??ty)+(ty-(e.vy??ty))*k_;   // 转向限速：方向逐渐转过去
     const vl=Math.hypot(e.vx,e.vy)||1,ux=e.vx/vl,uy=e.vy/vl;
     if(e.slowT>0)e.slowT-=dt;if(e.buffT>0)e.buffT-=dt;if(e.chgT>0)e.chgT-=dt;if(e.wwT>0){e.wwT-=dt;e.wwc=(e.wwc||0)-dt;if(d<34&&e.wwc<=0){e.wwc=.3;onHit(BD*.5)}}if(stats.ghost){e.phC=(e.phC??6)-dt;if(e.phC<=0){e.phC=6;e.phT=1.5}if(e.phT>0)e.phT-=dt}
     const oldx=e.x,oldy=e.y,dist=(e.buffT>0?1.3:1)*(e.chgT>0?1.8:1)*(e.wwT>0?(e.wwS||1.3):1)*((e.slowT>0&&!stats.heavy)?.5:1)*(e.boss?.8:1)*(e.spdMul||1)*stats.speed*(water(e.x,e.y)===2?.6:1)*dt*speed,mx=ux*dist,my=uy*dist;
     if(stats.ghost){e.x+=mx;e.y+=my}else if(ok(e.x+mx,e.y+my)){e.x+=mx;e.y+=my}else if(ok(e.x+mx,e.y)){e.x+=mx}else if(ok(e.x,e.y+my)){e.y+=my}
     else if(ok(e.x-my*1.6,e.y+mx*1.6)){e.x-=my*1.6;e.y+=mx*1.6}
     e.moving=e.x!==oldx||e.y!==oldy;
     // 防卡：4 秒内离主角的路程没有变近，就从屏幕外换到主角附近能走到的地方
     const pd=window.PATHAT?.(e.x,e.y)??-1;e.stuckT=(e.stuckT||0)+dt;
     if(pd>=0&&(e.bestPd==null||pd<e.bestPd-1)){e.bestPd=pd;e.stuckT=0}
     const C_=window.CAM,far2=C_&&(Math.abs(e.x-hero.x)>C_.VW||Math.abs(e.y-hero.y)>C_.VH);   // 离主角超过两个半屏（屏幕外很远）才挪
     if(e.stuckT>(e.boss?6:4)&&far2){for(let k=0;k<12;k++){const a=Math.random()*6.283,r=Math.hypot(C_.VW,C_.VH)*.55+Math.random()*40,nx=hero.x+Math.cos(a)*r,ny=hero.y+Math.sin(a)*r,np=window.PATHAT?.(nx,ny)??-1;
       if(np>=0&&np<60&&ok(nx,ny)){e.x=nx;e.y=ny;break}}e.stuckT=0;e.bestPd=null}
    }
   }
  }
  for(const o of en){if(!(o.soulT>0))continue;if(o.expired||!o.soulBy||o.soulBy.dead){o.soulT=0;continue}if(Math.hypot(hero.x-o.x,hero.y-o.y)<14){o.soulT=0;o.expired=true;window.onStomp?.(o);continue}o.soulT-=dt;if(o.soulT<=0){o.expired=true;window.SPAWN?.('skeleton',o.x,o.y)}}   // 魂火尸体
  for(let i=lobs.length-1;i>=0;i--){const L=lobs[i];L.t+=dt;if(L.t>=L.d){let dm=L.dm;if(L.vol){dm*=[1,.6,.35][Math.min(2,L.vol.n)];if(Math.hypot(hero.x-L.x,(hero.y-L.y)*1.25)<L.r)L.vol.n++}explode(L.x,L.y,L.r,dm,false);lobs.splice(i,1)}}
  for(let i=booms.length-1;i>=0;i--){booms[i].t+=dt;if(booms[i].t>.4)booms.splice(i,1)}
  for(let i=PIL.length-1;i>=0;i--){const L=PIL[i];L.t+=dt;if(!L.hit&&L.t>=L.d){L.hit=1;if(Math.hypot(hero.x-L.x,(hero.y-L.y)*1.25)<L.r)onHit(L.dm)}if(L.t>=L.d+.25)PIL.splice(i,1)}
  for(let i=SPR_.length-1;i>=0;i--){const p=SPR_[i];if(p.st>0){p.st-=dt;const q=Math.hypot(hero.x-p.x,hero.y-(p.y+10));if(q<9&&q>0){hero.x=p.x+(hero.x-p.x)/q*9;hero.y=p.y+10+(hero.y-p.y-10)/q*9}if(p.st<=0)SPR_.splice(i,1);continue}   // 插地长矛：挡路 3 秒
   const nx=p.x+p.dx*320*dt,ny=p.y+p.dy*320*dt;p.life-=dt;if(!ok(nx,ny+10)||p.life<=0){p.st=3;continue}p.x=nx;p.y=ny;if(!p.hit&&Math.hypot(hero.x-p.x,hero.y-10-p.y)<9){p.hit=1;onHit(p.dm)}}
  for(let i=arrows.length-1;i>=0;i--){
   const p=arrows[i],oldx=p.x,oldy=p.y;p.x+=p.dx*120*dt;p.y+=p.dy*120*dt;p.life-=dt;
   const vx=p.x-oldx,vy=p.y-oldy,v2=vx*vx+vy*vy;
   const t=v2?Math.max(0,Math.min(1,((hero.x-oldx)*vx+(hero.y-10-oldy)*vy)/v2)):0;
   if(Math.hypot(oldx+vx*t-hero.x,oldy+vy*t-(hero.y-10))<8){window.CUR_E=(p.k||'?')+'·远程';onHit(p.dm);arrows.splice(i,1)}
   else if(p.life<=0||!ok(p.x,p.y+10))arrows.splice(i,1);
  }
 }
 function frame(e,now){
  if(e.k==='gob_paladin'){const F=data[e.k].frames,m={aim:'charge',dash:'charge',judge:'judge',howl:'howl',aegis:'aegis',smash:e.timer<(e.st||1)?'windup':'strike'};if(m[e.state]&&F[m[e.state]])return F[m[e.state]]}
  {const F=data[e.k].frames;if(F.charge&&e.state==='aim')return F.charge;if(F.dash&&e.state==='dash')return F.dash;if(F.tired&&e.tiredT>0&&e.state!=='hurt'){e.tiredT-=1/60;return F.tired}}
  if(e.k==='gob_emperor'){const F=data[e.k].frames;if(e.crT>0)return F.crown;if(e.wwPre>0)return F.cast;if(e.wwT>0&&e.wwS)return Math.floor(now/90)%2?F.ww1:F.ww0;if(e.spQ>0)return e.spT>.12?F.throw0:F.throw1;if(e.state==='judge')return F.cast;if(e.rage&&!e.moving&&e.state==='move')return F.rage}
  if(e.state==='combo'){const t=e.timer,F=data[e.k].frames;const hit=[.45,.9,1.5].some(h=>t>=h&&t<h+.15);return (hit?F.strike:F.windup)||F.idle0}
  let name=e.state==='aim'||e.state==='bash'||e.state==='fuse'||e.state==='smash'||e.state==='cast'||(e.state==='leap'&&e.timer<1)?'windup':e.state==='dash'||e.state==='leap'?'strike':e.state;
  if(name==='move'&&e.swT>0){const F=data[e.k].frames,p=.9-e.swT;name=p<.4?'windup':p<.6?'strike':'recover';if(!F[name])name='move'}
  if(name==='move')name=e.moving?'walk'+(Math.floor(now/110+e.ph)%(data[e.k].nw||6)):'idle'+(Math.floor(now/650)%2);
  if(name==='recover'&&!data[e.k].frames.recover)name='idle0';
  if(name==='windup'&&data[e.k].frames.draw&&e.timer>.22)name='draw';
  const FF=data[e.k].frames;if(e.shBrk){if(e.brkFx>0&&FF.brk){e.brkFx-=1/60;return FF.brk}if(FF['n_'+name])return FF['n_'+name];if(name==='idle0'&&FF.n_idle0)return FF.n_idle0}
  return FF[name]||FF.idle0;
 }
 function getFrame(e,now){const f=frame(e,now),name=Object.keys(data[e.k].frames).find(key=>data[e.k].frames[key]===f);return {f,im:images['en_'+e.k+'_'+name]}}
 function draw(e,c,cx,cy,now){const SPR=1.07;   // 人物、怪物整体放大一点
  if(e.bshield&&!e.dead){c.save();c.globalAlpha=.25+.12*Math.sin(now/180);c.fillStyle='#c0182a';c.beginPath();c.ellipse(e.x-cx,e.y-cy-30,26,36,0,0,6.3);c.fill();c.restore()}
  if(e.ward&&!e.dead){c.save();c.globalAlpha=.35+.15*Math.sin(now/200);c.strokeStyle='#7fd8ff';c.lineWidth=1.2;c.beginPath();c.ellipse(e.x-cx,e.y-cy,9*(e.sc||1),4*(e.sc||1),0,0,6.3);c.stroke();c.restore()}
  if(e.crate){if(e.dead)return;const im=images['ui_'+e.ct];if(im&&im.width){const w=e.ct==='pot'?13:16,h=im.height*w/im.width;c.drawImage(im,e.x-cx-w/2,e.y-cy-h+2,w,h)}return}if(e.drum){if(e.totem&&e.dead)return;const ti=e.shTot&&window.RUNUI?.['totem_h'+(Math.floor(performance.now()/450)%2)],im=ti?.complete&&ti.width?ti:images[e.totem?'camp_totem':e.dead?'camp_drum_x':'camp_drum'],w=im===ti?ti.width*(22*(e.sc||1)/43)*1.4:e.totem?22*(e.sc||1):44,h=im===ti?ti.height*(22*(e.sc||1)/43)*1.4:e.totem?62*(e.sc||1):38,x=e.x-cx,y=e.y-cy;c.save();if(e.flash>0)c.filter='brightness(1.8)';if(im)c.drawImage(im,x-w/2,y-h+4,w,h);c.filter='none';if(!e.dead){c.fillStyle='#0009';c.fillRect(x-22,y-h-3,44,4);c.fillStyle='#e8503a';c.fillRect(x-21,y-h-2,42*Math.max(0,e.hp/e.hpMax),2)}c.restore();return}
  const {f,im}=getFrame(e,now);
  if(e.state==='fuse'||e.state==='smash'){const T=e.state==='fuse'?1.5:(e.st||1.2),R_=e.state==='fuse'?40:(e.sr||35),k=Math.min(1,e.timer/T);c.save();c.globalAlpha=.15+.45*k;c.fillStyle='#ff3a2a';c.beginPath();c.ellipse(e.x-cx,e.y-cy,R_,R_*.8,0,0,6.3);c.fill();c.globalAlpha=.8;c.strokeStyle='#ff3a2a';c.lineWidth=1;c.beginPath();c.ellipse(e.x-cx,e.y-cy,R_*k,R_*.8*k,0,0,6.3);c.stroke();c.restore()}
  if(e.state==='leap'){const k=Math.min(1,e.timer/1);c.save();c.globalAlpha=.2+.4*k;c.fillStyle='#ff3a2a';c.beginPath();c.ellipse(e.lx1-cx,e.ly1-cy,50,40,0,0,6.3);c.fill();c.restore()}
  if(e.state==='judge'){const k=Math.min(1,e.timer/1.5),x=e.jx-cx,y=e.jy-cy;c.save();c.globalAlpha=.3+.6*k;c.strokeStyle='#ffd23f';c.lineWidth=3;c.beginPath();c.moveTo(x-18,y);c.lineTo(x+18,y);c.moveTo(x,y-14);c.lineTo(x,y+14);c.stroke();c.globalAlpha=.15+.25*k;c.fillStyle='#ffd23f';c.beginPath();c.ellipse(x,y,40,32,0,0,6.3);c.fill();c.restore()}
  if(e.state==='howl'||e.hwFx>0){if(e.hwFx>0)e.hwFx-=1/60;const k=e.state==='howl'?e.timer:1-e.hwFx/.6;c.save();c.globalAlpha=.5*(1-k*.5);c.strokeStyle='#cfefff';c.lineWidth=2;c.beginPath();c.ellipse(e.x-cx,e.y-cy,80*k,64*k,0,0,6.3);c.stroke();c.restore()}
  if(e.aegT>0&&!e.dead){c.save();c.globalAlpha=.25+.1*Math.sin(now/120);c.fillStyle='#ffe27a';c.beginPath();c.ellipse(e.x-cx,e.y-cy-18*(e.sc||1),30,30,0,0,6.3);c.fill();if(e.aegMax){c.globalAlpha=1;const w=40,x=Math.round(e.x-cx-w/2),y=Math.round(e.y-cy-58*(e.sc||1));c.fillStyle='rgba(0,0,0,.6)';c.fillRect(x,y,w,3);c.fillStyle='#ffe27a';c.fillRect(x,y,w*Math.max(0,e.aegHp/e.aegMax),3)}c.restore()}
  if(e.drFx>0){e.drFx-=1/60;c.save();c.globalAlpha=e.drFx;c.strokeStyle='#ff6a3a';c.lineWidth=2;c.beginPath();c.ellipse(e.x-cx,e.y-cy,100*(1-e.drFx),80*(1-e.drFx),0,0,6.3);c.stroke();c.restore()}
  if((e.buffT>0||e.chgT>0)&&!e.dead&&!e.drum){const x=Math.round(e.x-cx),y=Math.round(e.y-cy-26*(e.sc||1)-Math.abs(Math.sin(now/150))*2);c.save();c.fillStyle=e.chgT>0?'#ff2a1a':'#ff6a3a';c.beginPath();c.moveTo(x,y-3);c.lineTo(x+3,y+1);c.lineTo(x+1,y+1);c.lineTo(x+1,y+3);c.lineTo(x-1,y+3);c.lineTo(x-1,y+1);c.lineTo(x-3,y+1);c.closePath();c.fill();c.globalAlpha=.55;c.strokeStyle='#ff5a3a';c.beginPath();c.ellipse(e.x-cx,e.y-cy,7,2.6,0,0,6.3);c.stroke();c.restore()}   // 被鼓舞：头上红箭头
  if(e.state==='aim'&&e.k==='gob_paladin'){const k=e.timer/(e.aimT||.5),L_=e.alen||80;c.save();c.globalAlpha=.25+.5*k;c.strokeStyle='#ffd23f';c.lineWidth=2;c.beginPath();c.moveTo(e.x-cx,e.y-cy);c.lineTo(e.x-cx+e.dx*L_,e.y-cy+e.dy*L_);c.stroke();c.restore()}
  else if(e.state==='aim'){const k=Math.min(1,e.timer/(e.aimT||.5)),L_=e.alen||80,N=Math.max(4,Math.round(L_/12)),hot=data[e.k].charge?'255,150,40':'255,60,40',ux=e.dx,uy=e.dy,px=-uy,py=ux;c.save();c.lineWidth=1.6;c.lineCap='round';
   for(let i=1;i<=N;i++){const t=i/(N+1),x=e.x-cx+ux*L_*t,y=e.y-cy+uy*L_*t,s=3.2,on=t<=k;c.strokeStyle=on?`rgba(${hot},.95)`:'rgba(255,255,255,.3)';if(on){c.shadowColor=`rgba(${hot},.8)`;c.shadowBlur=4}else c.shadowBlur=0;c.beginPath();c.moveTo(x-ux*s+px*s,y-uy*s+py*s);c.lineTo(x+ux*s,y+uy*s);c.lineTo(x-ux*s-px*s,y-uy*s-py*s);c.stroke()}c.restore()}   // 蓄力箭头：从脚下逐个点亮
  if(e.state==='windup'&&(e.boss||e.elite)&&!e.dead&&!data[e.k].ranged){const k=Math.min(1,e.timer/.45),R=((data[e.k].reach||30)+5)*(e.sc||1);c.save();c.globalAlpha=.15+.35*k;c.fillStyle='#ff3a2a';c.beginPath();c.ellipse(e.x-cx,e.y-cy,R,R*.75,0,0,6.3);c.fill();c.globalAlpha=.8;c.strokeStyle='#ff3a2a';c.lineWidth=1.5;c.beginPath();c.ellipse(e.x-cx,e.y-cy,R,R*.75,0,0,6.3);c.stroke();c.restore()}   // Boss/精英挥砍预警
  if(e.state==='fuse'&&e.timer<.5&&!e.dead){const k=e.timer/.5,L_=150,N=10,ux=e.fx,uy=e.fy,px=-uy,py=ux;c.save();c.lineWidth=1.6;c.lineCap='round';for(let i=1;i<=N;i++){const t=i/(N+1),x=e.x-cx+ux*L_*t,y=e.y-cy+uy*L_*t,s_=3.2,on=t<=k;c.strokeStyle=on?'rgba(255,150,40,.95)':'rgba(255,255,255,.3)';c.beginPath();c.moveTo(x-ux*s_+px*s_,y-uy*s_+py*s_);c.lineTo(x+ux*s_,y+uy*s_);c.lineTo(x-ux*s_-px*s_,y-uy*s_-py*s_);c.stroke()}c.restore()}
  if(e.dazeT>0&&!e.dead){const x=e.x-cx,y=e.y-cy-30*(e.sc||1);c.save();c.fillStyle='#ffe066';for(let i=0;i<3;i++){const a=now/180+i*2.09;c.fillRect(Math.round(x+Math.cos(a)*9)-1.5,Math.round(y+Math.sin(a)*3)-1.5,3,3)}c.restore()}
  if(e.state==='combo'&&!e.dead){const H=[.45,.9,1.5],R_=[30,30,44];const i=e.cmb||0;if(i<3){const k=Math.max(0,1-(H[i]-e.timer)/.45),x=e.x-cx+e.face*10,y=e.y-cy;c.save();c.globalAlpha=.15+.4*k;c.fillStyle='#ff3a2a';c.beginPath();c.ellipse(x,y,R_[i],R_[i]*.8,0,0,6.3);c.fill();c.globalAlpha=.8;c.strokeStyle='#ff3a2a';c.lineWidth=1;c.beginPath();c.ellipse(x,y,R_[i]*k,R_[i]*.8*k,0,0,6.3);c.stroke();c.restore()}}
  if(e.swFx>0&&!e.dead){e.swFx-=1/60;const x=e.x-cx+e.face*10,y=e.y-cy-12;c.save();c.globalAlpha=e.swFx*4;c.strokeStyle='#fff';c.lineWidth=2.5;c.beginPath();c.arc(x,y,18,e.face>0?-1.2:Math.PI-1.2,e.face>0?1.2:Math.PI+1.2);c.stroke();c.restore()}
  if(e.spQ>0&&!e.dead&&e.spD){const k=1-e.spT/(e.rage?.35:.5),x=e.x-cx,y=e.y-cy-14;c.save();c.globalAlpha=.3+.5*k;c.strokeStyle='#ff3a2a';c.lineWidth=1.5;c.setLineDash([6,4]);c.beginPath();c.moveTo(x,y);c.lineTo(x+e.spD[0]*256,y+e.spD[1]*256);c.stroke();c.restore()}
  if(e.rage&&!e.dead){c.save();c.globalAlpha=.3+.15*Math.sin(now/90);c.fillStyle='#ff2a1a';c.beginPath();c.ellipse(e.x-cx,e.y-cy-18*(e.sc||1),20*(e.sc||1),26*(e.sc||1),0,0,6.3);c.fill();c.restore()}
  if(e.wwPre>0&&!e.dead){const k=1-e.wwPre/.6,R=34;c.save();c.globalAlpha=.2+.4*k;c.fillStyle='#ff3a2a';c.beginPath();c.ellipse(e.x-cx,e.y-cy,R,R*.75,0,0,6.3);c.fill();c.globalAlpha=.8;c.strokeStyle='#ff3a2a';c.lineWidth=1.5;c.beginPath();c.ellipse(e.x-cx,e.y-cy,R*k,R*.75*k,0,0,6.3);c.stroke();c.restore()}
  if(e.wwT>0&&e.wwS&&!e.dead&&e.k!=='gob_emperor'){const x=e.x-cx,y=e.y-cy-10;c.save();c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=2.5;for(let i=0;i<3;i++){const a=now/70+i*2.09;c.beginPath();c.ellipse(x,y,34,22,0,a,a+1.2);c.stroke()}c.restore()}
  if(e.thrown){const T=e.thrown,k=Math.min(1,T.t/T.d);c.save();c.globalAlpha=.25+.5*k;c.fillStyle='#ff3a2a';c.beginPath();c.ellipse(T.x1-cx,T.y1-cy,24,19,0,0,6.3);c.fill();c.restore()}
  if(e.stFx>0&&!e.dead){e.stFx-=1/60;c.save();c.globalAlpha=e.stFx*2;c.strokeStyle='#c9b38a';c.lineWidth=1.5;c.beginPath();c.ellipse(e.x-cx,e.y-cy,30*(1-e.stFx),18*(1-e.stFx),0,0,6.3);c.stroke();c.restore()}
  if(e.soulT>0){const x=e.x-cx,y=e.y-cy-6,k=1-e.soulT/1.5;c.save();for(let i=0;i<4;i++){const ph=now/90+i*1.6,h=6+k*8+Math.sin(ph)*2;c.globalAlpha=.5+.4*Math.sin(ph);c.fillStyle=i%2?'#5dff9a':'#b8ffd0';c.beginPath();c.ellipse(x+(i-1.5)*3,y-h/2,2,h/2,0,0,6.3);c.fill()}c.restore()}   // 魂火
  if(e.rain>0&&!e.dead){const k=1-e.rain/2,x=e.x-cx,y=e.y-cy;c.save();c.globalAlpha=.4+.4*k;c.strokeStyle='#ff8a3a';c.lineWidth=1.5;c.beginPath();c.ellipse(x,y,18,11,0,0,6.3);c.stroke();for(let i=0;i<5;i++){const a=now/200+i*1.257;c.fillStyle='#ffd27a';c.fillRect(x+Math.cos(a)*14-1,y-26-k*6+Math.sin(a)*4-1,2,2)}c.restore()}
  if(e.rit>0&&!e.dead){const k=1-e.rit/1.5,x=e.x-cx,y=e.y-cy,R=24;c.save();c.globalAlpha=.35+.45*k;c.strokeStyle='#7df9ff';c.lineWidth=1.5;c.beginPath();c.ellipse(x,y,R,R*.6,0,0,6.3);c.stroke();c.beginPath();c.ellipse(x,y,R*k,R*.6*k,0,0,6.3);c.stroke();for(let i=0;i<6;i++){const a=now/300+i*1.047;c.fillStyle='#bff7ff';c.fillRect(x+Math.cos(a)*R*.8-1,y+Math.sin(a)*R*.48-1,2,2)}c.restore()}   // 萨满召唤法阵
  if(e.state==='bash'){const k=Math.min(1,e.timer),a0=(e.bx||1)>0?-Math.PI/2:Math.PI/2;c.save();c.globalAlpha=.2+.45*k;c.fillStyle='#ff3a2a';c.beginPath();c.moveTo(e.x-cx,e.y-cy);c.ellipse(e.x-cx,e.y-cy,32*k,22*k,0,a0,a0+Math.PI);c.closePath();c.fill();c.restore()}
  const sc=(e.sc||1)*SPR;c.save();c.translate(Math.round(e.x-cx)+(e.state==='aim'&&e.timer>(e.aimT||.5)*.6?(Math.floor(now/40)%2?1:-1):0),Math.round(e.y-cy));if(e.rc>0){e.rc-=1/60;if(!e.boss&&!e.dead)c.translate(Math.round((e.rcd||0)*(e.elite?1:2.5)*e.rc/.09),0)}c.scale(e.face*sc,sc);c.globalAlpha=e.alpha??1;c.imageSmoothingEnabled=false;
  if(!e.dead){c.fillStyle='rgba(10,20,10,.32)';c.beginPath();c.ellipse(0,0,6,2.2,0,0,6.3);c.fill()}   // 脚下阴影：雨雾天也看得清
  if(e.flash>0){e.flash-=1/60;c.filter=e.flash>.03?'brightness(0) invert(1)':'brightness(2.2)'}if(e.state==='fall'&&e.timer<.4)c.scale(1-.3*e.timer/.4,1-.3*e.timer/.4);
  if(data[e.k].ghost)c.globalAlpha*=e.phT>0?.25:.75;
  if(e.hop)c.translate(0,-e.hop/sc);
  c.drawImage(im,-f.anchor[0],-f.anchor[1],f.size[0],f.size[1]);c.restore();
  if((e.elite||e.boss)&&!e.dead&&e.hpMax){const w=e.boss?40:20,x=Math.round(e.x-cx-w/2),y=Math.round(e.y-cy-f.anchor[1]*sc-4);c.fillStyle='rgba(0,0,0,.6)';c.fillRect(x,y,w,2.5);c.fillStyle=e.boss?'#ff5a4a':'#c77dff';c.fillRect(x,y,w*Math.max(0,e.hp/e.hpMax),2.5)}
 }
 function drawArrows(c,cx,cy){
  for(const L of PIL){const x=L.x-cx,y=L.y-cy;c.save();if(L.t<L.d){const k=L.t/L.d;c.globalAlpha=.25+.4*k;c.strokeStyle='#ffe27a';c.lineWidth=1.5;c.beginPath();c.ellipse(x,y,L.r,L.r*.8,0,0,6.3);c.stroke();c.fillStyle='#fff3c0';c.beginPath();c.ellipse(x,y,L.r*k,L.r*.8*k,0,0,6.3);c.fill()}else{const k=1-(L.t-L.d)/.25;c.globalAlpha=k;const g=c.createLinearGradient(x-L.r,0,x+L.r,0);g.addColorStop(0,'rgba(255,240,190,0)');g.addColorStop(.5,'rgba(255,255,240,1)');g.addColorStop(1,'rgba(255,240,190,0)');c.fillStyle=g;c.fillRect(x-L.r,y-140,L.r*2,140)}c.restore()}
  for(const p of SPR_){const a=Math.atan2(p.dy,p.dx);if(p.img&&!(p.st>0)){const f=data.gob_emperor.frames.spear,im=images['en_gob_emperor_spear'];if(f&&im){c.save();c.translate(p.x-cx,p.y-cy);c.rotate(a);c.drawImage(im,-f.size[0]/2,-f.size[1]/2,f.size[0],f.size[1]);c.restore();continue}}c.save();c.translate(p.x-cx,p.y-cy+(p.st>0?6:0));c.rotate(p.st>0?a*.3-.9:a);c.fillStyle='#7a4a24';c.fillRect(-14,-1,22,2);c.fillStyle='#d8dde8';c.beginPath();c.moveTo(8,-2.5);c.lineTo(14,0);c.lineTo(8,2.5);c.fill();c.restore()}
  for(const L of lobs){if(L.t<0)continue;const k=L.t/L.d;c.save();c.globalAlpha=.25+.35*k;c.fillStyle=L.k==='fire'?'#a040ff':'#3a2a20';c.beginPath();c.ellipse(L.x-cx,L.y-cy,L.r*k,L.r*.8*k,0,0,6.3);c.fill();c.restore();
   const im=FX[L.k==='fire'?'lob_fire':'lob_rock'],x=L.x0+(L.x-L.x0)*k,y=L.y0+(L.y-L.y0)*k-Math.sin(k*Math.PI)*(L.k==='rock'?60:25);if(im.complete&&im.width){const w=L.k==='rock'?12:16,h=im.height*w/im.width;c.drawImage(im,x-cx-w/2,y-cy-h/2,w,h)}}
  for(const b of booms){const im=FX['boom'+Math.min(3,Math.floor(b.t/.1))];if(im.complete&&im.width){const w=b.r*2.2,h=im.height*w/im.width;c.drawImage(im,b.x-cx-w/2,b.y-cy-h/2,w,h)}}
  for(const p of arrows){const f=data[p.k].frames.arrow,im=images['en_'+p.k+'_arrow'];c.save();c.translate(p.x-cx,p.y-cy);
   if(f&&im){c.rotate(Math.atan2(p.dy,p.dx));c.imageSmoothingEnabled=false;c.drawImage(im,-f.size[0]/2,-f.size[1]/2,f.size[0],f.size[1])}
   else{const g=c.createRadialGradient(0,0,0,0,0,5);g.addColorStop(0,'rgba(240,200,255,1)');g.addColorStop(.5,'rgba(170,80,240,.9)');g.addColorStop(1,'rgba(120,40,200,0)');c.fillStyle=g;c.beginPath();c.arc(0,0,5,0,6.3);c.fill()}
   c.restore()}
 }
 return {make,hit,update,reset,draw,drawArrows,getFrame};
}
