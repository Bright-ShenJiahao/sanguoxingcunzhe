// 第二批技能卡（28 张）：定义 + 发射逻辑 + 弹道/区域/召唤物 + 绘制。设计见在线文档「卡池定稿（第三版）」。
// run.js 合并 DEFS 进 WEAPONS，并在 createRun 里 install(ctx) 拿到 update / draw / sprites / absorb / onKill / mul。
import {t} from './i18n.js?v=11041900';
const T=(k,dt,cat,n)=>[k,{get name(){return t('card.'+k+'.name')},cat,img:null,dt,get desc(){return Array.from({length:n},(_,i)=>t('card.'+k+'.d'+i))}}];
export const DEFS=Object.fromEntries([
 T('greatsword','mel','blade',5),
 T('rapier','mel','blade',5),
 T('gsword','mel','blade',5),
 T('whip','mel','blade',5),
 T('fist','mel','blade',5),
 T('trap','mel','blade',5),
 T('treant','rng','bow',5),
 T('wolf','mel','blade',5),
 T('mgun','rng','bow',5),
 T('wedge','holy','bow',5),
 T('hawk','rng','bow',5),
 T('orb','ele','spell',5),
 T('keg','ele','spell',5),
 T('flamestep','ele','spell',5),
 T('pouch','ele','spell',5),
 T('waterel','ele','spell',5),
 T('fireel','ele','spell',5),
 T('holyorb','holy','spell',5),
 T('hshield','holy','spell',5),
 T('hwall','holy','spell',5),
 T('sigil','holy','spell',5),
 T('fairy','holy','spell',5),
 T('shadow','dark','spell',5),
 T('bmist','dark','spell',5),
 T('dcoil','dark','spell',5),
 T('vortex','dark','spell',5),
 T('undead','dark','spell',5),
]);
export const CARD_DT=Object.fromEntries(Object.entries(DEFS).map(([k,v])=>[k,v.dt]));
export const CARD_IC=Object.fromEntries(Object.keys(DEFS).map(k=>[k,'sk_'+k]));
const FORM={wolf:'summon',hawk:'summon',trap:'place',hshield:'shield',bmist:'aura'};
export const CARD_KIND={};for(const [k,v] of Object.entries(DEFS))Object.defineProperty(CARD_KIND,k,{enumerable:true,get:()=>t('card.kind.'+v.dt)+(FORM[k]?'·'+t('card.form.'+FORM[k]):'')});

const IMG={};const ld=(k,p)=>{const im=new Image();im.src=p;IMG[k]=im};
for(const k of 'slash crack whip fistwave trap rock buck wedge orb keg jet holyorb hwall sigil bubble skull mist dcoil vortex rise'.split(' '))ld('fx_'+k,'assets/fx/skill/'+k+'.png');
for(const k of 'golem treant wolf waterel fireel firelet hawk fairy'.split(' '))for(const f of ['idle','walk','atk'])ld(k+'_'+f,`assets/characters/summons/${k}/${f}.png`);
for(const f of ['walk0','walk1','walk2','walk3','strike'])ld('sk_'+f,'assets/characters/enemies/skeleton/'+f+'.png');
for(const k of 'bone0 bone1 bone2 bone3 tornado0 tornado1 tornado2 tornado3 flame0 flame1 flame2 flame3 pf0 pf1 pf2 pi0 pi1 pi2 pl0 pl1 pl2 crack0 crack1 crack2 wave0 wave1 wave2 wave3 feet0 feet1 feet2 feet3 rock0 rock1 rock2 rock3 rockhit bmist0 bmist1 bmist2 qi0 qi1 qi2 gs0 gs1 gs2 gs3'.split(' '))ld('s2_'+k,'assets/fx/skill2/'+k+'.png?v=11041900');
const DB=(c,im,x,y,w,alpha=1)=>{const I=IMG[im];if(!I?.complete||!I.width)return;const h=I.height*w/I.width;c.save();c.globalAlpha*=alpha;c.drawImage(I,x-w/2,y-h,w,h);c.restore()};   // 脚底对齐
ld('swd','assets/ui/w_sword.png?v=11041900');
for(const f of ['idle','walk','walk2','atk'])ld('wolf_'+f,'assets/characters/summons/cat/'+f+'.png');   // 布偶猫用 wolf 这个卡位
const SH={golem:104,treant:120,wolf:64,waterel:100,fireel:108,firelet:40,hawk:60,fairy:44},DH={golem:30,treant:36,wolf:16,waterel:30,fireel:32,firelet:11,hawk:15,fairy:13};   // 召唤物：站立帧原图高 → 游戏里的高

export function install(X){
 const {en,hero,strike,knock,nearest,cluster,dmg,AR,AMT,DUR,ok,burn,survival,AIM,MA,FN}=X,R=(a,b)=>a+Math.random()*(b-a);
 const dmK=(k,b)=>{const s=X.S,o=s.src;s.src=k;const v=dmg(b);s.src=o;return v};
 const S=()=>X.S,lv=k=>X.S.w[k]||0,LV=L=>({1:1,3:2,5:3,6:4,8:5})[L]||1;
 const st=()=>{const s=X.S;if(!s.c2)s.c2={P:[],Z:[],M:[],F:[],tr:[]};return s.c2};
 const alive=e=>e&&!e.dead&&!e.drum&&!e.totem;
 const d2=(a,b)=>(a.x-b.x)**2+(a.y-b.y)**2;
 const near=(x,y,r)=>en.filter(e=>alive(e)&&(e.x-x)**2+((e.y-y)*1.2)**2<r*r);
 const hit=(src,e,v,dir,o={})=>{if(!alive(e))return;const s=X.S,ps=s.src,pm=s.isSum;s.src=src;s.isSum=!!o.sum;strike(e,v,dir||Math.sign(e.x-hero.x)||1,o.crit,o.mel);s.src=ps;s.isSum=pm};
 const lineHit=(src,x,y,a,len,w,v,f)=>{const c=Math.cos(a),s_=Math.sin(a);for(const e of en){if(!alive(e))continue;const dx=e.x-x,dy=e.y-6-y,al=dx*c+dy*s_,sd=Math.abs(-dx*s_+dy*c);if(al>-4&&al<len&&sd<w+3*(e.sc||1)){hit(src,e,v,Math.sign(c)||1,{mel:true});f?.(e)}}};
 const fx=(o)=>{const F=st().F;if(F.length>160)F.shift();F.push(Object.assign({t:0},o))};
 const sumN=()=>st().M.length;
 const moveDir=()=>{const l=Math.hypot(hero.mx||0,hero.my||0);return l>.1?[hero.mx/l,hero.my/l]:[hero.face||1,0]};
 const tgtSum=(from,r)=>{let b=null,bd=r*r;for(const e of en){if(!alive(e))continue;const d=d2(e,from)*(e.markT>0?.3:1);if(d<bd){bd=d;b=e}}return b};   // 召唤物：优先猎印目标
 const fire={
  greatsword(L){const l=LV(L),a=Math.cos(AIM(200))>=0?0:Math.PI,len=(l>=3?100:85)*AR(),v=1.45*dmg(3.4+1*(l-1)+(l>=4?1:0));window.SFX?.slash();
   const bonus=e=>(e.k==='gob_shield'||e.k==='gob_paladin'||e.armor)?1.5:1;
   for(const e of en){if(!alive(e))continue;const c=Math.cos(a),s_=Math.sin(a),dx=e.x-hero.x,dy=e.y-6-hero.y,al=dx*c+dy*s_,sd=Math.abs(-dx*s_+dy*c);if(al>-4&&al<len&&sd<12+3*(e.sc||1)){hit('greatsword',e,v*bonus(e),Math.sign(c)||1,{mel:true});knock(e,6)}}
   fx({k:'gsw',x:hero.x,y:hero.y,f:Math.cos(a)>=0?1:-1,s:len*.9/453,d:.42});
   X.ST(()=>{fx({k:'seq',ims:['s2_crack0','s2_crack1','s2_crack2'],x:hero.x+Math.cos(a)*len/2,y:hero.y+Math.sin(a)*len/2,a,w:len*1.05,d:.55});for(let i=0;i<3;i++)fx({k:'dust',x:hero.x+Math.cos(a)*len*(.3+i*.25),y:hero.y+Math.sin(a)*len*(.3+i*.25),r:14,d:.45});window.SFX?.boom()},90);
   if(l>=5){const x=hero.x,y=hero.y;X.ST(()=>{lineHit('greatsword',x,y,a,len,12,v*.6);fx({k:'seq',ims:['s2_crack0','s2_crack1','s2_crack2'],x:x+Math.cos(a)*len/2,y:y+Math.sin(a)*len/2,a,w:len*1.05,d:.5})},400)}
   return l>=3?2.3:3},
  rapier(L){const l=LV(L),[mx,my]=moveDir(),len=(l>=3?95:78)*AR(),v=.45*dmg(1.8+.5*(l-1)+(l>=4?.6:0)),x0=hero.x,y0=hero.y,a=Math.atan2(my,mx);   // 人不动，往移动方向刺出剑气
   [0,-.13,.13].forEach((o,i)=>X.ST(()=>{const b=a+o;lineHit('rapier',x0,y0+6,b,len,8,v*.42);window.SFX?.slash();fx({k:'thrust',x0,y0,x1:x0+Math.cos(b)*len,y1:y0+Math.sin(b)*len,d:.22,c:'200,240,255'})},i*80));
   if(l>=5)X.ST(()=>{lineHit('rapier',x0,y0+6,a,len,10,v*.7);fx({k:'thrust',x0,y0,x1:x0+mx*len,y1:y0+my*len,d:.3,c:'200,240,255'})},500);
   return l>=3?.7:.9},
  gsword(){return 9},orb(){return 9},hshield(){return 9},bmist(){return 9},flamestep(){return 9},
  wolf(){return 9},hawk(){return 9},
  treant(L){const l=LV(L);let best=null,bn=0;for(const e of en){if(!alive(e))continue;const d=Math.hypot(e.x-hero.x,e.y-hero.y);if(d>(l>=3?250:210)||d<40)continue;const k=near(e.x,e.y,40).length+d/100;if(k>bn){bn=k;best=e}}if(!best)return .5;
   const n=l>=5?3:1,a=Math.atan2(best.y-hero.y,best.x-hero.x);for(let i=0;i<n;i++){const ox=(i-(n-1)/2)*32;st().P.push({k:'lob',src:'treant',x0:hero.x,y0:hero.y-20,x:best.x+ox*Math.cos(a+1.57),y:best.y+ox*Math.sin(a+1.57),t:0,d:.8,r:32*AR(),dm:dmg(3+.8*(l-1)),img:'fx_rock',size:16})}
   return l>=4?2.2:3},
  waterel(L){const l=LV(L),[mx,my]=moveDir(),len=(l>=3?80:62)*AR(),v=dmg(2+.6*(l-1));const mk=()=>st().P.push({k:'wave',src:'waterel',x:hero.x+mx*14,y:hero.y+my*14,dx:mx,dy:my,v:110,life:1.4,dm:v,len,hit:new Set(),nohit:1,slow:l>=5});
   mk();if(l>=5)X.ST(mk,450);return l>=4?2.4:3.2},
  fireel(L){const l=LV(L),n=l>=5?2:1,d=l>=4?6:4;for(let i=0;i<n;i++)st().Z.push({k:'tornado',x:hero.x+R(-30,30),y:hero.y+R(-20,20),t:0,d,r:(l>=3?26:20)*AR(),v:dmg(.8+.25*(l-1)),tick:0,a:R(0,6.3),src:'fireel'});return d+(l>=4?2:3)},
  fairy(L){const l=LV(L),n=l>=5?3:1,v=dmg(4+1.2*(l-1)),r=(l>=3?22:16)*AR();const c=en.filter(e=>alive(e)&&Math.hypot(e.x-hero.x,e.y-hero.y)<230).sort((a,b)=>b.hp-a.hp);if(!c.length)return .5;
   for(let i=0;i<Math.min(n,c.length);i++){const t=c[i];st().Z.push({k:'pillar',x:t.x,y:t.y,t:-.45,d:.35,r,v,src:'fairy'})}return l>=4?1.8:2.5},
  undead(L){const l=LV(L),n=l>=5?3:l>=4?2:1,v=dmg(.7+.2*(l-1)),d=l>=3?2.8:2;const c=en.filter(e=>alive(e)&&!e.boss&&!(e.boneT>0)&&Math.hypot(e.x-hero.x,e.y-hero.y)<200).sort((a,b)=>d2(a,hero)-d2(b,hero));if(!c.length)return .5;
   for(let i=0;i<Math.min(n,c.length);i++){const e=c[i];e.boneT=d;st().Z.push({k:'bone',e,x:e.x,y:e.y,t:0,d,v,tick:0,src:'undead'})}return l>=4?2.2:3},
  whip(L){const l=LV(L),side=FN()===0?1:-1,len=(l>=3?130:110)*AR(),v=dmg(1.6+.45*(l-1)),sides=l>=4?[side,-side]:[side];window.SFX?.slash();
   for(const sd of sides){const a=sd>0?0:Math.PI;lineHit('whip',hero.x,hero.y,a,len,9,v);fx({k:'whip',x:hero.x,y:hero.y,sd,len,d:.3,c:'255,255,255'});
    if(l>=5)X.ST(()=>{lineHit('whip',hero.x,hero.y,a,len,9,v*.7);fx({k:'whip',x:hero.x,y:hero.y+4,sd,len,d:.25,c:'255,220,160',back:1})},220)}
   return l>=3?.95:1.25},
  fist(L){const l=LV(L),a=AIM(140),r=(l>=3?13:10)*AR(),v=dmg(1.7+.4*(l-1)),sl=(l>=4?2:1.3)*DUR();window.SFX?.wave();
   for(const o of (l>=5?[0,-.35,.35]:[0]))st().P.push({k:'qi',src:'fist',x:hero.x+Math.cos(a+o)*10,y:hero.y-10+Math.sin(a+o)*10,dx:Math.cos(a+o),dy:Math.sin(a+o),v:165,life:.6,dm:v,r,sl,hit:new Set(),nohit:1,tr:[]});
   return l>=3?1.5:2},
  trap(L){const l=LV(L),n=l>=4?4:3,[mx,my]=moveDir(),v=dmg(2+.6*(l-1));
   for(let i=0;i<n;i++){const d=35+i*18,sp=(i-(n-1)/2)*.35,a=Math.atan2(my,mx)+sp;st().Z.push({k:'trap',x:hero.x+Math.cos(a)*d,y:hero.y+Math.sin(a)*d,t:0,d:10,v,l5:l>=5,src:'trap'})}
   const tr=st().Z.filter(z=>z.k==='trap');if(tr.length>12)tr.slice(0,tr.length-12).forEach(z=>z.t=z.d);
   return l>=3?2:2.8},
  mgun(L){const l=LV(L),n=5+(l>=2?1:0)+(l>=4?1:0)+AMT(),a=AIM(150),v=dmg(.75+.2*(l-1));
   for(let i=0;i<n;i++)X.ST(()=>{const b=a+(n>1?(i/(n-1)-.5)*1.1:0),mx=hero.x+Math.cos(a)*14,my=hero.y-10+Math.sin(a)*14;window.SFX?.shoot();st().P.push({k:'buck',src:'mgun',x:mx,y:my,dx:Math.cos(b),dy:Math.sin(b),v:330,life:.5,dm:v,hit:new Set(),kb:6,l5:l>=5,size:7});fx({k:'flash',x:mx,y:my+10,r:6,d:.06,c:'255,230,140'})},i*55);
   return l>=3?1.2:1.6},
  wedge(L){const l=LV(L),v=dmg(2.2+.6*(l-1)+(l>=4?.6:0));let t=null,bd=320*320;for(const e of en)if(alive(e)&&(e.elite||e.boss)&&d2(e,hero)<bd){bd=d2(e,hero);t=e}t=t||nearest(260);if(!t)return .4;
   st().Z.push({k:'stake',e:t,x:t.x,y:t.y,t:-.3,d:.4,v,l5:l>=5,src:'wedge'});
   return l>=3?1:1.4},
  keg(L){const l=LV(L),[mx,my]=moveDir();st().P.push({k:'keg',src:'keg',x:hero.x+mx*10,y:hero.y+my*10,dx:mx,dy:my,v:85,life:1.3,dm:dmg(3+.8*(l-1)),r:(l>=3?48:38)*AR(),hit:new Set(),img:'fx_keg',size:16,roll:1,l5:l>=5,nohit:1});
   return l>=4?2.2:3},
  pouch(L){const l=LV(L),s=X.S;s.pI=((s.pI||0)+1)%9;const el=Math.floor(s.pI/3),a=AIM(130),r=(l>=3?60:50)*AR(),v=dmg(1.6+.45*(l-1))*(el===2?1.3:1),col=['255,140,60','150,220,255','255,240,120'][el];
   const go=(m,rr)=>{for(const e of near(hero.x,hero.y,rr)){let d=Math.atan2((e.y-hero.y)*1.15,e.x-hero.x)-a;d=Math.atan2(Math.sin(d),Math.cos(d));if(Math.abs(d)<=.5){hit('pouch',e,v*m);if(el===0)burn(e,v*.3);if(el===1)e.slowT=Math.max(e.slowT||0,(e.boss?.6:1.8)*DUR())}}fx({k:'seq',ims:['p'+'fil'[el]+'0','p'+'fil'[el]+'1','p'+'fil'[el]+'2'].map(q=>'s2_'+q),x:hero.x+Math.cos(a)*rr*.55,y:hero.y-6+Math.sin(a)*rr*.55,a,w:rr*.85,d:.5,al:.75,wh:el===2})};
   if(l>=5&&s.pI%3===2)go(2,r*1.3);else go(1,r);
   return l>=4?1:1.3},
  holyorb(L){const l=LV(L),a=AIM(220),v=dmg(1+.3*(l-1));st().P.push({k:'holyorb',src:'holyorb',x:hero.x,y:hero.y-10,dx:Math.cos(a),dy:Math.sin(a),v:48,life:3,dm:v,tick:0,r:(l>=3?24:18)*AR(),hit:new Set(),img:'fx_holyorb',size:l>=3?26:20,nohit:1,l5:l>=5});
   return l>=4?1.8:2.5},
  hwall(L){const l=LV(L),[mx,my]=moveDir(),len=(l>=3?75:58)*AR(),v=dmg(2+.6*(l-1));const mk=(dx,dy,x,y)=>st().P.push({k:'hwall',src:'hwall',x,y,dx,dy,v:85,life:2,dm:v,len,hit:new Set(),nohit:1});
   mk(mx,my,hero.x+mx*16,hero.y+my*16);if(l>=5)mk(-my,mx,hero.x+my*45,hero.y-mx*45);
   return l>=4?2.8:3.6},
  sigil(L){const l=LV(L),t=cluster();if(!t)return .5;st().Z.push({k:'sigil',x:t.x,y:t.y,t:0,d:1+(l>=5?1.5:1),r:(l>=3?48:38)*AR(),v:dmg(2.5+.7*(l-1)),l,src:'sigil'});
   if(l>=5){const [mx,my]=moveDir();for(let i=1;i<=2;i++)st().Z.push({k:'sigil2',x:hero.x+mx*40*i,y:hero.y+my*40*i,t:-.3*i,d:.9,r:26,v:dmg(2),src:'sigil'})}
   return l>=4?5:7},
  shadow(L){const l=LV(L),n=l>=4?2:1,v=dmg(1.3+.35*(l-1));const t=nearest(240);if(!t)return .3;
   for(let i=0;i<n;i++){const a=Math.atan2(t.y-10-(hero.y-10),t.x-hero.x)+(i?.2:0);st().P.push({k:'shadow',src:'shadow',x:hero.x,y:hero.y-10,dx:Math.cos(a),dy:Math.sin(a),v:300,life:.9,dm:v,hit:new Set(),pierce:0,img:'fx_skull',size:14,vmax:l>=5?3:1})}
   return l>=3?.6:.85},
  dcoil(L){const l=LV(L),n=l>=4?2:1,v=dmg(1.6+.45*(l-1)),rg=(l>=3?150:120);
   for(let i=0;i<n;i++){const t=nearest(rg),a=t?Math.atan2(t.y-hero.y,t.x-hero.x):MA()+i*Math.PI;st().P.push({k:'dcoil',src:'dcoil',x:hero.x,y:hero.y-10,dx:Math.cos(a+(i?.5:0)),dy:Math.sin(a+(i?.5:0)),v:190,life:9,out:rg/190,dm:v,hit:new Set(),heal:0,img:'fx_dcoil',size:14,nohit:0,pierce:99,l5:l>=5})}
   return l>=3?1.2:1.6},
  vortex(L){const l=LV(L),t=cluster();if(!t)return .5;st().Z.push({k:'vortex',x:t.x,y:t.y,t:0,d:1,r:(l>=3?85:70)*AR(),v:dmg(3+.8*(l-1)),l5:l>=5,src:'vortex'});return l>=4?3.5:5},
 };
 // ---------- 持续型：每帧维护 ----------
 function keepSum(k,n,mk){const c=st(),have=c.M.filter(m=>m.k===k);for(let i=have.length;i<n&&sumN()<12;i++)c.M.push(mk(i))}
 function update(dt){const s=X.S;if(!s)return;const c=st();
  for(const e of en){if(e.markT>0)e.markT-=dt;if(e.vulnT>0){e.vulnT-=dt;if(e.vulnT<=0)e.vuln=0}if(e.sealT>0)e.sealT-=dt;if(e.stunImm>0)e.stunImm-=dt;if(e.boneT>0)e.boneT-=dt}
  // 守护飞剑
  const g=lv('gsword');if(g){c.gA=(c.gA||0)+dt*(g>=3?4.2:3.2);c.gT=(c.gT||0)+dt;const n=g>=4?4:g>=2?3:2,out=g>=5&&(c.gT%4)<1?Math.sin((c.gT%4)*Math.PI):0,r=(34+out*60)*AR(),v=dmK('gsword',1+.3*(g-1));c.gs=[];
   for(let i=0;i<n;i++){const a=c.gA+i*6.283/n,x=hero.x+Math.cos(a)*r,y=hero.y-8+Math.sin(a)*r*.8;c.gs.push({x,y,a});for(const e of en){if(!alive(e))continue;if((e.x-x)**2+(e.y-10-y)**2<(9*(e.sc||1))**2&&!(e.gsT>0)){e.gsT=.45;hit('gsword',e,v,Math.sign(e.x-hero.x)||1,{mel:true});knock(e,7)}}}
   for(const e of en)if(e.gsT>0)e.gsT-=dt}else c.gs=null;
  // 水晶弹珠：六芒星轨迹
  const o=lv('orb');if(o){c.oT=(c.oT||0)+dt*(o>=3?.33:.24);const n=o>=4?2:1,sc=o>=5?1+.5*Math.max(0,Math.sin(c.oT*1.2)):1,R0=60*AR()*sc,v=dmK('orb',.55+.15*(o-1));c.os=[];
   const P=[];for(let i=0;i<6;i++){const a=-Math.PI/2+i*Math.PI/3;P.push([Math.cos(a),Math.sin(a)])}const path=[0,2,4,0,1,3,5,1].map(i=>P[i]);   // 两个三角形
   for(let j=0;j<n;j++){let u=((c.oT+j*.5)%1)*7,i=Math.floor(u),f=u-i;const A=path[i],B=path[i+1],x=hero.x+(A[0]+(B[0]-A[0])*f)*R0,y=hero.y-8+(A[1]+(B[1]-A[1])*f)*R0*.8;c.os.push({x,y});
    for(const e of en){if(!alive(e))continue;if((e.x-x)**2+(e.y-10-y)**2<(8*(e.sc||1))**2&&!(e.obT>0)){e.obT=.3;hit('orb',e,v)}}}
   for(const e of en)if(e.obT>0)e.obT-=dt}else c.os=null;
  // 圣盾
  const h=lv('hshield');if(h){const mx=20+8*(h-1);if(c.sh===undefined){c.sh=mx;c.shT=0}if(c.sh<=0){c.shT-=dt;if(c.shT<=0)c.sh=mx}c.shMax=mx}else c.sh=undefined;
  // 血雾
  const b=lv('bmist');if(b){c.bT=(c.bT||0)-dt;const r=(b>=3?52:42)*AR(),v=dmK('bmist',.5+.15*(b-1)+(b>=4?.2:0));if(c.bT<=0){c.bT=.5;for(const e of near(hero.x,hero.y,r)){hit('bmist',e,v);e.vulnT=Math.max(e.vulnT||0,.8);e.vuln=Math.max(e.vuln||0,1)}}
   if(b>=5&&Math.hypot(hero.mx||0,hero.my||0)>.1&&(hero.moving??true)){c.bmT=(c.bmT||0)-dt;if(c.bmT<=0){c.bmT=.35;c.Z.push({k:'mist',x:hero.x,y:hero.y,t:0,d:2,r:22,v:v*.6,tick:0,src:'bmist'})}}}
  // 烈焰足迹
  const fs=lv('flamestep');if(fs){c.fsT=(c.fsT||0)-dt;const mv=Math.hypot(hero.x-(c.px??hero.x),hero.y-(c.py??hero.y))>.05;if(mv&&c.fsT<=0){c.px0=c.px;c.py0=c.py}c.px=hero.x;c.py=hero.y;
   if(mv&&c.fsT<=0){c.fsT=.22;c.fsT=.32;const z={k:'flame',a:Math.atan2(hero.y-(c.py0??hero.y),hero.x-(c.px0??hero.x)),x:hero.x,y:hero.y+2,t:0,d:(fs>=4?3:2)*DUR(),r:(fs>=3?15:11)*AR(),v:dmK('flamestep',.5+.15*(fs-1)),tick:0,src:'flamestep'};c.Z.push(z);c.tr.push(z);if(c.tr.length>14)c.tr.shift()}
   if(fs>=5){c.fbT=(c.fbT||0)+dt;if(c.fbT>4&&c.tr.length>=8){c.fbT=0;c.tr.filter(z=>z.t<z.d).forEach((z,i)=>X.ST(()=>{fx({k:'boom',x:z.x,y:z.y,r:24,d:.3});for(const e of near(z.x,z.y,24)){hit('flamestep',e,z.v*3);burn(e,z.v)}z.t=z.d},i*70))}}}
  // 召唤：数量维护
  const wf=lv('wolf');if(wf)keepSum('wolf',wf>=4?2:1,i=>({k:'wolf',x:hero.x+R(-15,15),y:hero.y+R(-8,8),cd:.3,face:1,i,src:'wolf'}));
  const hk=lv('hawk');if(hk)keepSum('hawk',hk>=4?2:1,i=>({k:'hawk',x:hero.x,y:hero.y-30,cd:1+i,a:i*Math.PI,face:1,i,src:'hawk'}));
  // ---------- 召唤物行为 ----------
  for(const m of c.M){m.cd-=dt;m.at=(m.at||0)-dt;if(m.life!==undefined)m.life-=dt;if(m.rise>0){m.rise-=dt;continue}
   if(m.broken>0){m.broken-=dt;if(m.broken<=0){m.hp=m.hpMax;fx({k:'ring',x:m.x,y:m.y,r:20,d:.3,c:'200,200,200'})}continue}
   const L=lv(m.src)||1,dm=b=>dmK(m.src,b);let walk=false;
   const goto=(tx,ty,sp)=>{const dx=tx-m.x,dy=ty-m.y,d=Math.hypot(dx,dy);if(d<2)return d;const k=Math.min(d,sp*dt),nx=m.x+dx/d*k,ny=m.y+dy/d*k;if(m.fly||ok(nx,ny)){m.x=nx;m.y=ny}else{m.x+=dx/d*k*.3;m.y+=dy/d*k*.3}m.face=dx>=0?1:-1;walk=true;return d};
   const far=Math.hypot(m.x-hero.x,m.y-hero.y);if(far>320){m.x=hero.x+R(-20,20);m.y=hero.y+R(-15,15)}   // 跟丢了直接回到身边
   if(m.k==='golem'||m.k==='skel'){const t=tgtSum(hero,150);if(t&&Math.hypot(t.x-hero.x,t.y-hero.y)<170){const d=goto(t.x-(t.x>m.x?10:-10),t.y,m.k==='golem'?42:55);if(d<16&&m.cd<=0){m.cd=m.k==='golem'?(L>=3?.8:1.1):.9;m.at=.25;
      if(m.spear){}else{const v=m.k==='golem'?dm(2.2+.6*(L-1)):dm(1.2+.35*(L-1));for(const e of near(m.x+m.face*8,m.y,m.k==='golem'?22:14))hit(m.src,e,v,m.face,{sum:1,mel:true})}}
     if(m.spear&&m.cd<=0&&t){m.cd=1.2;m.at=.25;const a=Math.atan2(t.y-m.y,t.x-m.x);c.P.push({k:'spear',src:'undead',x:m.x,y:m.y-10,dx:Math.cos(a),dy:Math.sin(a),v:220,life:.9,dm:dm(1.5+.3*L),hit:new Set(),pierce:1,sum:1,size:12})}}
    else goto(hero.x-hero.face*(18+(m.i||0)*10),hero.y+((m.i||0)?10:-6),70);
    if(m.k==='golem'&&L>=5){m.jT=(m.jT??(3+(m.i||0)*2.5))-dt;if(m.jT<=0){m.jT=5;const [mx,my]=moveDir();m.x=hero.x+mx*45;m.y=hero.y+my*45;fx({k:'ring',x:m.x,y:m.y,r:40,d:.3,c:'200,190,170'});for(const e of near(m.x,m.y,40)){hit('golem',e,dm(3),Math.sign(e.x-m.x)||1,{sum:1});knock(e,6)}}}}
   if(m.k==='golem'||m.k==='treant'){m.hT=(m.hT||0)-dt;if(m.hT<=0){m.hT=.5;let n=0;for(const e of en)if(alive(e)&&(e.x-m.x)**2+(e.y-m.y)**2<16*16)n+=(e.elite||e.boss)?3:1;if(n){m.hp-=n*2;if(m.hp<=0){m.broken=6;fx({k:'img',im:'fx_rock',x:m.x,y:m.y-8,a:0,w:24,d:.4})}}}}
   if(m.k==='treant'){const [mx,my]=moveDir();goto(hero.x-mx*26,hero.y-my*20,75);if(m.cd<=0){let best=null,bn=0;for(const e of en){if(!alive(e))continue;const d=Math.hypot(e.x-hero.x,e.y-hero.y);if(d>(L>=3?240:200)||d<50)continue;const k=near(e.x,e.y,40).length+d/100;if(k>bn){bn=k;best=e}}
     if(best){m.cd=L>=4?2.3:3;m.at=.35;m.face=best.x>=m.x?1:-1;const n=L>=5?3:1;for(let i=0;i<n;i++){const ox=(i-(n-1)/2)*30;c.P.push({k:'lob',src:'treant',x0:m.x,y0:m.y-20,x:best.x+ox*Math.cos(Math.atan2(best.y-m.y,best.x-m.x)+1.57),y:best.y+ox*Math.sin(Math.atan2(best.y-m.y,best.x-m.x)+1.57),t:0,d:.8,r:30*AR(),dm:dm(2.6+.7*(L-1)),img:'fx_rock',size:16,sum:1})}}}}
   if(m.k==='wolf'){const t=tgtSum(m,150);if(t&&Math.hypot(t.x-hero.x,t.y-hero.y)<190){m.wp=null;goto(t.x,t.y,L>=3?150:125)}else{if(!m.wp||m.wT<=0||Math.hypot(m.x-m.wp[0],m.y-m.wp[1])<6){m.wT=R(.8,1.8);const a=R(0,6.3),r=R(20,110);m.wp=[hero.x+Math.cos(a)*r,hero.y+Math.sin(a)*r*.8]}m.wT-=dt;goto(m.wp[0],m.wp[1],L>=3?120:95)}   // 布偶猫：在你附近乱跑，碰到就挠
    for(const e of en){if(!alive(e)||e.catT>0)continue;if((e.x-m.x)**2+(e.y-m.y)**2<15*15){e.catT=.5;fx({k:'arc',x:e.x,y:e.y-8,a:m.face>0?0:Math.PI,r:9,sw:1,w:4,c:'255,255,255',d:.15});m.at=.2;const v=dm(1.1+.35*(L-1));hit('wolf',e,v,m.face,{mel:true});if(L>=5){X.ST(()=>hit('wolf',e,v*.6,m.face,{mel:true}),120);X.ST(()=>hit('wolf',e,v*.6,m.face,{mel:true}),240)}}}
    for(const e of en)if(e.catT>0)e.catT-=dt/Math.max(1,c.M.filter(q=>q.k==='wolf').length)}
   if(m.k==='hawk'){m.fly=1;m.tr=m.tr||[];   // 盘旋 → 看到敌人俯冲啄击 → 回到盘旋
    if(m.dv){const t=m.dv;m.dvT-=dt;const px=m.x;if(!alive(t)||m.dvT<=0)m.dv=null;else{const dx=t.x-m.x,dy=t.y-12-m.y,d=Math.hypot(dx,dy);const k=Math.min(d,260*dt);m.x+=dx/d*k;m.y+=dy/d*k;if(Math.abs(dx)>3)m.face=dx>0?1:-1;
      if(d<10){m.dv=null;m.at=.2;hit('hawk',t,dm(1.6+.45*(L-1)),m.face,{sum:1});t.markT=6;fx({k:'flash',x:t.x,y:t.y-8,r:9,d:.15,c:'255,255,255'})}}
     m.tr.push([m.x,m.y]);if(m.tr.length>8)m.tr.shift()}
    else{m.a+=dt*1.4;const tx=hero.x+Math.cos(m.a+(m.i||0)*Math.PI)*55,ty=hero.y-14+Math.sin(m.a+(m.i||0)*Math.PI)*36,vx=(tx-m.x)*Math.min(1,dt*3);m.x+=vx;m.y+=(ty-m.y)*Math.min(1,dt*3);if(Math.abs(vx)>dt*20)m.face=vx>0?1:-1;if(m.tr.length)m.tr.shift();
     if(m.cd<=0){const t=tgtSum(m,170);if(t){m.cd=L>=3?1.1:1.5;m.dv=t;m.dvT=.9}}}}
   if(m.k==='fairy'){m.fly=1;m.a+=dt*1.6;goto(hero.x+Math.cos(m.a)*22,hero.y-26+Math.sin(m.a)*6,150);if(m.cd<=0){const t=tgtSum(m,170);if(t){m.cd=L>=3?.7:1;m.at=.2;const a=Math.atan2(t.y-10-m.y,t.x-m.x);c.P.push({k:'light',src:'fairy',x:m.x,y:m.y,dx:Math.cos(a),dy:Math.sin(a),v:240,life:.8,dm:dm(1+.3*(L-1)),hit:new Set(),pierce:L>=5?1:0,sum:1,size:5})}}}
   if(m.k==='waterel'){goto(hero.x-28,hero.y-4,80);if(m.cd<=0){let t=null,bd=200*200;for(const e of en)if(alive(e)&&(e.elite||e.boss)&&d2(e,m)<bd){bd=d2(e,m);t=e}t=t||tgtSum(m,190);
     if(t){m.cd=m.rate;m.at=.3;m.face=t.x>=m.x?1:-1;if(m.l5){m.pr=m.tg===t?(m.pr||0)+1:1;m.tg=t}const a=Math.atan2(t.y-10-(m.y-14),t.x-m.x);
      if(m.l5&&m.pr>=5){m.pr=0;lineHit('waterel',m.x,m.y-8,a,170,8,m.dm*3);fx({k:'img',im:'fx_jet',x:m.x+Math.cos(a)*85,y:m.y-14+Math.sin(a)*85,a,w:170,d:.3})}
      else c.P.push({k:'wbolt',src:'waterel',x:m.x,y:m.y-14,dx:Math.cos(a),dy:Math.sin(a),v:230,life:1,dm:m.dm,hit:new Set(),pierce:0,sum:1,size:9,img:'fx_orb'})}}}
   if(m.k==='fireel'){goto(hero.x+28,hero.y-4,80);if(m.cd<=0){const t=tgtSum(m,150);if(t){m.cd=m.rate;m.at=.3;m.face=t.x>=m.x?1:-1;const a=Math.atan2(t.y-10-(m.y-14),t.x-m.x);c.P.push({k:'fbolt',src:'fireel',x:m.x,y:m.y-14,dx:Math.cos(a),dy:Math.sin(a),v:200,life:.9,dm:m.dm,hit:new Set(),pierce:0,sum:1,size:8,boom:18});
      if(++m.n%5===0&&c.M.filter(q=>q.k==='firelet').length<2&&sumN()<12)c.M.push({k:'firelet',x:m.x,y:m.y,life:6,cd:0,face:1,src:'fireel',br:m.br,dm:m.dm*1.5})}}}
   if(m.k==='firelet'){const t=tgtSum(m,200);if(t){const d=goto(t.x,t.y,110);if(d<10)m.life=0}if(m.life<=0){fx({k:'boom',x:m.x,y:m.y,r:m.br,d:.3});for(const e of near(m.x,m.y,m.br)){hit('fireel',e,m.dm,Math.sign(e.x-m.x)||1,{sum:1});burn(e,m.dm*.3)}}}
   m.walk=walk}
  c.M=c.M.filter(m=>m.life===undefined||m.life>0);
  for(const k of ['wolf','hawk'])if(!lv(k))c.M=c.M.filter(m=>m.k!==k);if(!lv('undead'))c.M=c.M.filter(m=>m.k!=='skel');
  // ---------- 弹道 ----------
  for(const p of c.P){p.age=(p.age||0)+dt;
   if(p.k==='lob'){p.t+=dt;if(p.t>=p.d){p.dead=1;fx({k:'img',im:'s2_rockhit',x:p.x,y:p.y-6,a:0,w:p.r*1.3,d:.35});for(const e of near(p.x,p.y,p.r)){hit(p.src,e,p.dm,1);if(p.mark)e.markT=6;else e.slowT=Math.max(e.slowT||0,e.boss?.3:1)}}continue}
   if(p.k==='dcoil'&&!p.back&&p.age>=p.out){p.back=1;p.hit.clear()}
   if(p.k==='dcoil'&&p.back){const dx=hero.x-p.x,dy=hero.y-10-p.y,d=Math.hypot(dx,dy);if(d<10){p.dead=1;continue}p.dx=dx/d;p.dy=dy/d}
   if(p.k==='keg'){if(p.age>=p.life){p.dead=1;kegBoom(p);continue}p.dT=(p.dT||0)-dt;if(p.dT<=0){p.dT=.09;fx({k:'dust',x:p.x-p.dx*6,y:p.y+2,r:5,d:.35})}}
   if(p.k==='holyorb'){p.tick-=dt;if(p.tick<=0){p.tick=.3;for(const e of near(p.x,p.y+10,p.r))hit('holyorb',e,p.dm*.45)}if(p.age>=p.life){p.dead=1;fx({k:'boom2',x:p.x,y:p.y,r:p.r*2,d:.35});for(const e of near(p.x,p.y+10,p.r*2))hit('holyorb',e,p.dm*2.2);
     if(p.l5&&!p.small)for(const s_ of [-1,1]){const a=Math.atan2(p.dy,p.dx)+s_*1;c.P.push({...p,dx:Math.cos(a),dy:Math.sin(a),age:0,life:1.5,small:1,r:p.r*.7,size:p.size*.7,dead:0})}}}
   if(p.k==='qi'){p.tr.push([p.x,p.y]);if(p.tr.length>6)p.tr.shift();for(const e of near(p.x,p.y+10,p.r+4)){if(p.hit.has(e))continue;p.hit.add(e);hit('fist',e,p.dm,Math.sign(p.dx)||1,{mel:true});e.slowT=Math.max(e.slowT||0,e.boss?p.sl*.3:p.sl);if(!e.boss)knock(e,8);fx({k:'flash',x:e.x,y:e.y-8,r:8,d:.12,c:'255,240,190'})}
    if(p.age>=p.life){p.dead=1;fx({k:'ring',x:p.x,y:p.y+10,r:p.r*2.4,d:.3,c:'255,220,140'});fx({k:'flash',x:p.x,y:p.y+10,r:p.r*1.6,d:.18,c:'255,245,210'});for(const e of near(p.x,p.y+10,p.r*2.4))if(!p.hit.has(e))hit('fist',e,p.dm*.5,Math.sign(p.dx)||1);continue}}
   if(p.k==='dcoil'){(p.tr=p.tr||[]).push([p.x,p.y]);if(p.tr.length>6)p.tr.shift()}
   if(p.k==='wave'){const c_=p.dx,s_=p.dy;for(const e of en){if(!alive(e))continue;const dx=e.x-p.x,dy=e.y-p.y,al=dx*c_+dy*s_,sd=Math.abs(-dx*s_+dy*c_);if(Math.abs(al)<9&&sd<p.len/2){if(!p.hit.has(e)){p.hit.add(e);hit('waterel',e,p.dm,Math.sign(c_)||1);if(p.slow)e.slowT=Math.max(e.slowT||0,e.boss?.5:1.5)}if(!e.boss){const k=(e.elite?.3:1)*p.v*dt,nx=e.x+c_*k,ny=e.y+s_*k;if(ok(nx,ny)){e.x=nx;e.y=ny}}}}}
   if(p.k==='hwall'){const c_=p.dx,s_=p.dy;for(const e of en){if(!alive(e)||p.hit.has(e))continue;const dx=e.x-p.x,dy=e.y-p.y,al=dx*c_+dy*s_,sd=Math.abs(-dx*s_+dy*c_);if(Math.abs(al)<8&&sd<p.len/2){p.hit.add(e);hit('hwall',e,p.dm,Math.sign(c_)||1);if(!e.boss&&!e.elite){const nx=e.x+c_*6,ny=e.y+s_*6;if(ok(nx,ny)){e.x=nx;e.y=ny}}}}}
   p.x+=p.dx*p.v*dt;p.y+=p.dy*p.v*dt;if(p.k!=='dcoil'&&p.k!=='keg'&&p.age>=p.life){p.dead=1;continue}
   if(p.nohit)continue;
   for(const e of en){if(!alive(e)||p.hit.has(e))continue;const r=6*(e.sc||1)+(p.size||6)*.25;if(Math.abs(e.x-p.x)<r&&Math.abs(e.y-10*(e.sc||1)-p.y)<r+4){p.hit.add(e);
     let v=p.dm;if(p.elite&&(e.elite||e.boss))v*=p.elite;
     if(p.k==='dcoil'&&p.back&&p.l5&&!e.elite&&!e.boss&&e.hp<e.hpMax*.3)v=e.hp+1;
     hit(p.src,e,v,p.dx>0?1:-1,{sum:p.sum});
     if(p.k==='buck'&&!e.boss){knock(e,p.kb);if(p.l5)for(const o of en){if(o===e||!alive(o))continue;if((o.x-e.x)**2+(o.y-e.y)**2<12*12){fx({k:'boom',x:e.x,y:e.y,r:22,d:.25});for(const q of near(e.x,e.y,22))hit('mgun',q,p.dm*1.5);break}}}
     if(p.k==='shadow'){e.vuln=Math.min(p.vmax,(e.vuln||0)+1);e.vulnT=4}
     if(p.k==='wedge'&&p.l5&&(e.elite||e.boss)){e.wg=(e.wg||0)+1;if(e.wg>=3){e.wg=0;const a=Math.atan2(p.dy,p.dx);lineHit('wedge',e.x,e.y,a,200,8,p.dm*2);fx({k:'streak',x0:e.x,y0:e.y-8,x1:e.x+Math.cos(a)*200,y1:e.y-8+Math.sin(a)*200,d:.3,c:'230,230,240'})}}
     if(p.k==='dcoil'&&e.dead&&p.heal<3){p.heal++;survival?.heal?.(1)}
     if(p.k==='fbolt'){fx({k:'boom',x:e.x,y:e.y-6,r:p.boom,d:.25});for(const q of near(e.x,e.y,p.boom)){if(q!==e)hit('fireel',q,p.dm*.6,1,{sum:1});burn(q,p.dm*.3)}}
     if(p.pierce!==undefined){if(p.pierce<=0){p.dead=1;break}p.pierce--}else{p.dead=1;break}}}}
  c.P=c.P.filter(p=>!p.dead);
  // ---------- 区域 ----------
  for(const z of c.Z){z.t+=dt;if(z.t<0)continue;
   if(z.k==='trap'){for(const e of en){if(!alive(e))continue;if((e.x-z.x)**2+((e.y-z.y)*1.2)**2<10*10){hit('trap',e,z.v,1);e.slowT=Math.max(e.slowT||0,e.boss?.5:2*DUR());fx({k:'img',im:'fx_trap',x:z.x,y:z.y-3,a:0,w:16,d:.3});
      if(z.l5){fx({k:'ring',x:z.x,y:z.y,r:28,d:.25,c:'220,220,220'});for(const q of near(z.x,z.y,28))if(q!==e)hit('trap',q,z.v*.6,1)}z.t=z.d;break}}}
   else if(z.k==='sigil'||z.k==='sigil2'){if(!z.on&&z.t>=(z.k==='sigil'?1:.3)){z.on=1;fx({k:'ring',x:z.x,y:z.y,r:z.r,d:.3,c:'255,230,140'});
      if(z.k==='sigil')for(const e of near(z.x,z.y,z.r)){if(e.boss){e.slowT=Math.max(e.slowT||0,1.5);continue}if(e.stunImm>0)continue;const dur=e.elite?(z.l>=5?.6:.4):(z.l>=5?1.5:1);e.stunT=dur;e.stunImm=dur+2;if(z.l>=5)e.sealT=dur}
      else for(const e of near(z.x,z.y,z.r))hit('sigil',e,z.v)}
     if(z.k==='sigil'&&z.on&&!z.burst&&z.t>=z.d-.05){z.burst=1;fx({k:'boom2',x:z.x,y:z.y,r:z.r*1.2,d:.35});for(const e of near(z.x,z.y,z.r))hit('sigil',e,z.v)}}
   else if(z.k==='vortex'){if(z.t<.9){for(const e of near(z.x,z.y,z.r)){if(e.boss)continue;const dx=z.x-e.x,dy=z.y-e.y,d=Math.hypot(dx,dy)||1,sp=(e.elite?40:130)*dt;if(d>6){const nx=e.x+dx/d*Math.min(sp,d),ny=e.y+dy/d*Math.min(sp,d);if(ok(nx,ny)){e.x=nx;e.y=ny}}}}
     else if(!z.boom){z.boom=1;fx({k:'boom2',x:z.x,y:z.y,r:46,d:.35,c:'170,110,255'});for(const e of near(z.x,z.y,46))hit('vortex',e,z.v);
      if(z.l5){const [mx,my]=moveDir(),a0=Math.atan2(my,mx);for(let i=0;i<6;i++){const a=a0+(i-2.5)*.22;c.P.push({k:'shard',src:'vortex',x:z.x,y:z.y-8,dx:Math.cos(a),dy:Math.sin(a),v:220,life:.7,dm:z.v*.5,hit:new Set(),pierce:1,size:6})}}}}
   else if(z.k==='tornado'){z.a+=dt*1.5;const tx=hero.x+Math.cos(z.a)*60,ty=hero.y+Math.sin(z.a*1.3)*40;z.x+=(tx-z.x)*Math.min(1,dt*2);z.y+=(ty-z.y)*Math.min(1,dt*2);z.tick-=dt;if(z.tick<=0){z.tick=.3;for(const e of near(z.x,z.y,z.r)){hit('fireel',e,z.v);burn(e,z.v*.5)}}}
   else if(z.k==='pillar'){if(!z.hit&&z.t>=0){z.hit=1;window.SFX?.holy?.();fx({k:'flash',x:z.x,y:z.y-6,r:z.r*1.3,d:.2,c:'255,255,255'});for(const e of near(z.x,z.y,z.r))hit('fairy',e,z.v)}}
   else if(z.k==='stake'){const e=z.e;if(alive(e)&&!z.hit){z.x=e.x;z.y=e.y}if(!z.hit&&z.t>=0){z.hit=1;window.SFX?.holy?.();fx({k:'flash',x:z.x,y:z.y-8,r:12,d:.18,c:'235,240,255'});fx({k:'ring',x:z.x,y:z.y,r:16,d:.25,c:'230,235,255'});
     if(alive(e)){const big=e.elite||e.boss;hit('wedge',e,z.v*(big?2.5:1));if(z.l5&&big){e.wg=(e.wg||0)+1;if(e.wg>=3){e.wg=0;fx({k:'boom2',x:e.x,y:e.y,r:40,d:.35,c:'230,235,255'});for(const q of near(e.x,e.y,40))hit('wedge',q,z.v*2)}}}}}
   else if(z.k==='bone'){const e=z.e;if(!alive(e)){z.t=z.d;continue}z.x=e.x;z.y=e.y;e.slowT=Math.max(e.slowT||0,.2);z.tick-=dt;if(z.tick<=0){z.tick=.4;hit('undead',e,z.v)}}
   else if(z.k==='flame'||z.k==='mist'){z.tick-=dt;if(z.tick<=0){z.tick=.5;for(const e of near(z.x,z.y,z.r)){hit(z.src,e,z.v);if(z.k==='flame')burn(e,z.v*.5);else{e.vulnT=Math.max(e.vulnT||0,.8);e.vuln=Math.max(e.vuln||0,1)}}}}}
  c.Z=c.Z.filter(z=>z.t<z.d);
  for(const f of c.F)f.t+=dt;c.F=c.F.filter(f=>f.t<f.d);
 }
 function kegBoom(p){fx({k:'boom',x:p.x,y:p.y,r:p.r,d:.35});window.SFX?.boom();for(const e of near(p.x,p.y,p.r)){hit('keg',e,p.dm,Math.sign(e.x-p.x)||1);burn(e,p.dm*.25)}
  if(p.l5&&!p.small)for(const s_ of [-1,1])st().P.push({...p,dx:-p.dy*s_,dy:p.dx*s_,age:0,life:.6,r:p.r*.65,dm:p.dm*.6,small:1,size:11,dead:0})}
 // ---------- 绘制 ----------
 const DI=(c,im,x,y,w,a=0,flip=false,alpha=1)=>{const I=IMG[im];if(!I||!I.complete||!I.width)return;const h=I.height*w/I.width;c.save();c.globalAlpha*=alpha;c.translate(x,y);if(a)c.rotate(a);if(flip)c.scale(-1,1);c.drawImage(I,-w/2,-h/2,w,h);c.restore()};
 function ground(c,cx,cy,now){const s=X.S;if(!s?.c2)return;const C=s.c2;   // 地面层：先画（半透明，压在下面）
  for(const z of C.Z){const x=z.x-cx,y=z.y-cy,fade=Math.min(1,(z.d-z.t)*2);
   if(z.k==='trap')DI(c,'fx_trap',x,y-3,13);
   else if(z.k==='sigil'||z.k==='sigil2'){if(z.t<0)continue;c.save();c.globalAlpha=(z.on?.55:.3)*fade;c.translate(x,y);c.scale(1,.8);c.rotate(now/900);DI(c,'fx_sigil',0,0,z.r*2.1);c.restore()}
   else if(z.k==='vortex'){c.save();c.globalAlpha=.7*fade;c.translate(x,y);c.scale(1,.8);c.rotate(-now/150);DI(c,'fx_vortex',0,0,z.r*1.4*(1-z.t*.4));c.restore()}
   else if(z.k==='flame'){c.save();c.globalAlpha=.9*fade;c.translate(x,y);c.scale(1,.8);c.rotate((z.a||0)+Math.PI/2);DI(c,'s2_feet'+(Math.floor(now/120+z.x)%4),0,0,z.r*2.2);c.restore()}
   else if(z.k==='mist'){DI(c,'s2_bmist'+(Math.floor(now/260+z.x)%3),x,y,z.r*2.4,0,false,.4*fade)}
   else if(z.k==='pillar'&&z.t<0){c.save();c.globalAlpha=.6;c.strokeStyle='#ffffff';c.lineWidth=1.5;c.beginPath();c.ellipse(x,y,z.r,z.r*.7,0,0,6.3);c.stroke();c.restore()}}
  const b=lv('bmist');if(b){const r=(b>=3?52:42)*AR();c.save();c.translate(hero.x-cx,hero.y-cy);c.rotate(now/2000);DI(c,'s2_bmist'+(Math.floor(now/260)%3),0,0,r*2.2,0,false,.32);c.restore()}}
 function sprites(items,cx,cy,c,now){const s=X.S;if(!s?.c2)return;const C=s.c2;
  for(const m of C.M){const x=m.x-cx,y=m.y-cy;items.push({y:m.y,f:()=>{c.imageSmoothingEnabled=true;
   if(m.k==='skel'){const k=m.rise>0?1-m.rise/.6:1;if(m.rise>0)DI(c,'fx_rise',x,y-6,22);const im=m.at>0?'sk_strike':'sk_walk'+(m.walk?Math.floor(now/120)%4:0);c.save();c.globalAlpha=k;c.translate(x,y);c.scale(-(m.face||1),1);const I=IMG[im];if(I?.complete&&I.width){c.filter='hue-rotate(160deg) saturate(1.6)';c.drawImage(I,-16,-30,32,32);c.filter='none'}c.restore();
     c.fillStyle='rgba(90,170,255,.55)';c.beginPath();c.ellipse(x,y,6,2,0,0,6.3);c.fill();return}
   if(m.broken>0){DI(c,'fx_rock',x,y-6,18,0,false,.6);return}
   const key=m.k,f=m.at>0?'atk':m.walk?(m.k==='wolf'&&Math.floor(now/110)%2?'walk2':'walk'):'idle',I=IMG[key+'_'+f];if(!I?.complete||!I.width)return;const sc=DH[key]/SH[key]*(lv(m.src)>=4&&(m.k==='golem'||m.k==='treant')?1.15:1),h=I.height*sc,w=I.width*sc;
   const bob=m.fly&&m.k!=='hawk'?Math.sin(now/180+(m.i||0))*2:0;if(m.k==='hawk'&&m.tr?.length>1){c.save();for(let i=1;i<m.tr.length;i++){const q=i/m.tr.length;c.strokeStyle=`rgba(255,255,255,${q*.5})`;c.lineWidth=q*3;c.beginPath();c.moveTo(m.tr[i-1][0]-cx,m.tr[i-1][1]-cy-h/2);c.lineTo(m.tr[i][0]-cx,m.tr[i][1]-cy-h/2);c.stroke()}c.restore()}c.save();c.translate(x,y-h/2+2+bob);if(m.face<0)c.scale(-1,1);
   const nearHero=Math.abs(m.x-hero.x)<14&&m.y>hero.y-4&&m.y<hero.y+20;if(nearHero)c.globalAlpha=.55;   // 挡住主角时半透明
   if(m.life!==undefined&&m.life<2)c.globalAlpha*=.5+.5*Math.sin(now/60);
   c.drawImage(I,-(f==='atk'?w*.35:w/2),-h/2,w,h);c.restore();
   if(!m.fly){c.fillStyle='rgba(18,40,20,.22)';c.beginPath();c.ellipse(x,y,w*.25,2,0,0,6.3);c.fill()}}})}
 }
 function draw(c,cx,cy,now){const s=X.S;if(!s?.c2)return;const C=s.c2;
  if(C.gs)for(const g of C.gs){const I=IMG.swd;if(I?.complete){c.save();c.translate(g.x-cx,g.y-cy);c.rotate(g.a+Math.PI/2);c.drawImage(I,-6,-6,12,12);c.restore()}}
  if(C.os)for(const o of C.os)DI(c,'fx_orb',o.x-cx,o.y-cy,10);
  if(C.sh>0){c.save();c.globalAlpha=.25+.15*(C.sh/C.shMax);DI(c,'fx_bubble',hero.x-cx,hero.y-cy-12,34);c.restore()}
  for(const p of C.P){const x=p.x-cx,y=p.y-cy,a=Math.atan2(p.dy||0,p.dx||1);
   if(p.k==='lob'){const k=Math.min(1,p.t/p.d),lx=p.x0+(p.x-p.x0)*k-cx,ly=p.y0+(p.y-p.y0)*k-cy-Math.sin(k*Math.PI)*50;p.rk=p.rk??Math.floor(Math.random()*4);c.save();c.translate(lx,ly);c.rotate(now/250);DI(c,'s2_rock'+p.rk,0,0,(p.size||14)*.9);c.restore();continue}
   if(p.k==='buck'){c.save();c.translate(x,y);c.rotate(a);c.fillStyle='rgba(255,200,90,.35)';c.fillRect(-12,-1.5,12,3);c.fillStyle='#fff1b8';c.fillRect(-6,-.8,8,1.6);c.restore();continue}
   if(p.k==='qi'){const I=IMG['s2_qi'+Math.min(2,Math.floor(p.age/p.life*3))];if(I?.complete&&I.width){const w=p.r*4.5,h=I.height*w/I.width;c.save();c.translate(x,y);c.rotate(a);c.drawImage(I,-w*.82,-h/2,w,h);c.restore()}continue}
   if(p.k==='buck'||p.k==='light'||p.k==='shard'||p.k==='spear'){c.save();c.translate(x,y);c.rotate(a);c.fillStyle=p.k==='buck'?'#bfe6ff':p.k==='light'?'#fff3b0':p.k==='shard'?'#b98cff':'#e8dcc0';c.fillRect(-(p.size||5)/2,-1,p.size||5,2);c.restore();continue}
   if(p.k==='wave'){const fd=Math.min(1,(p.life-p.age)*3,p.age*6),I=IMG['s2_wave'+(Math.floor(now/120)%4)];if(I?.complete&&I.width){const w=p.len*1.1,h=I.height*w/I.width;c.save();c.globalAlpha=fd;c.translate(x,y+4);if(p.dx<0)c.scale(-1,1);c.drawImage(I,-w/2,-h,w,h);c.restore()}continue}
   if(p.k==='hwall'){c.save();c.translate(x,y-8);c.rotate(Math.atan2(p.dy,p.dx));const L2=p.len/2,fl=.75+.25*Math.sin(now/60),g=c.createLinearGradient(-7,0,7,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,`rgba(255,255,255,${.85*fl})`);g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(-7,-L2,14,p.len);c.fillStyle=`rgba(255,250,225,${.95*fl})`;c.fillRect(-1.2,-L2,2.4,p.len);c.restore();continue}
   if(p.k==='keg'){c.fillStyle='rgba(18,40,20,.25)';c.beginPath();c.ellipse(x,y+2,p.size*.4,2,0,0,6.3);c.fill();c.save();c.translate(x,y-p.size/2+2);c.rotate(p.age*p.v/(p.size/2)*(p.dx>=0?1:-1));DI(c,'fx_keg',0,0,p.size);c.restore();continue}
   if(p.k==='dcoil'){c.save();for(let i=0;i<(p.tr||[]).length;i++){const q=(i+1)/p.tr.length;c.fillStyle=`rgba(40,0,60,${q*.35})`;c.beginPath();c.arc(p.tr[i][0]-cx,p.tr[i][1]-cy,4*q,0,6.3);c.fill()}
    const g=c.createRadialGradient(x,y,0,x,y,9);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.5,'rgba(25,0,40,.95)');g.addColorStop(.8,'rgba(90,20,130,.5)');g.addColorStop(1,'rgba(90,20,130,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,9,0,6.3);c.fill();
    c.strokeStyle='rgba(170,90,230,.8)';c.lineWidth=1.2;for(let i=0;i<3;i++){const b=now/120+i*2.09;c.beginPath();c.arc(x,y,6.5,b,b+1.1);c.stroke()}c.restore();continue}
   if(p.k==='fbolt'){c.fillStyle='rgba(255,140,40,.6)';c.beginPath();c.arc(x,y,4,0,6.3);c.fill();c.fillStyle='#ffe08a';c.fillRect(x-1.5,y-1.5,3,3);continue}
   if(p.img)DI(c,p.img,x,y,p.size||12,p.k==='shadow'||p.k==='wedge'?a+(p.k==='wedge'?Math.PI*.83:0):0,p.k==='shadow'&&p.dx<0)}
  for(const z of C.Z){if(z.k==='bone'){const f=Math.min(3,Math.floor(z.t/.1)),fade=Math.min(1,(z.d-z.t)*2);DB(c,'s2_bone'+f,z.x-cx,z.y-cy+5,f>=2?24:22,fade)}
   if(z.k==='tornado'){const fd=Math.min(1,(z.d-z.t)*2,z.t*3);DB(c,'s2_tornado'+(Math.floor(now/90)%4),z.x-cx,z.y-cy+3,z.r*2,fd)}
   if(z.k==='pillar'&&z.t>=0){const x=z.x-cx,y=z.y-cy,k=z.t/z.d,w=z.r*(1.1-k*.5);c.save();c.globalAlpha=1-k;const g=c.createLinearGradient(x-w,0,x+w,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.3,'rgba(240,248,255,.6)');g.addColorStop(.5,'rgba(255,255,255,1)');g.addColorStop(.7,'rgba(240,248,255,.6)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(x-w,y-170,w*2,170);
    c.fillStyle='rgba(255,255,255,.9)';c.beginPath();c.ellipse(x,y,z.r*1.1,z.r*.8,0,0,6.3);c.fill();c.restore()}
   if(z.k==='stake'){const x=z.x-cx,y=z.y-cy,f=Math.min(1,(z.t+.3)/.3),yy=y-8-(1-f)*90;c.save();if(f<1){c.strokeStyle='rgba(230,240,255,.55)';c.lineWidth=3;c.beginPath();c.moveTo(x,yy-40);c.lineTo(x,yy);c.stroke()}else c.globalAlpha=Math.max(0,1-(z.t)/z.d);
    c.fillStyle='#d8dde8';c.fillRect(x-2,yy-18,4,18);c.fillStyle='#ffffff';c.fillRect(x-1,yy-18,1,18);c.fillStyle='#9aa3b5';c.beginPath();c.moveTo(x-2,yy);c.lineTo(x+2,yy);c.lineTo(x,yy+6);c.fill();c.fillStyle='#b9c0cf';c.fillRect(x-3,yy-20,6,3);c.restore()}}
  for(const f of C.F){const k=f.t/f.d;c.save();c.globalAlpha=1-k;
   if(f.k==='img')DI(c,f.im,f.x-cx,f.y-cy,f.w,f.a,f.flip);
   else if(f.k==='streak'){c.strokeStyle=`rgba(${f.c},.9)`;c.lineWidth=3*(1-k)+1;c.beginPath();c.moveTo(f.x0-cx,f.y0-cy-8);c.lineTo(f.x1-cx,f.y1-cy-8);c.stroke()}
   else if(f.k==='arc'){const p=Math.min(1,k/.3);c.globalAlpha=k<.3?1:1-(k-.3)/.7;c.translate(f.x-cx,f.y-cy);c.scale(1,.8);const a0=f.a-f.sw,a1=a0+2*f.sw*p,N=18;c.fillStyle=`rgba(${f.c},.9)`;c.beginPath();
     for(let i=0;i<=N;i++){const b=a0+(a1-a0)*i/N;c.lineTo(Math.cos(b)*f.r,Math.sin(b)*f.r)}for(let i=N;i>=0;i--){const t=i/N,b=a0+(a1-a0)*t,rr=f.r-f.w*Math.pow(t,1.5);c.lineTo(Math.cos(b)*rr,Math.sin(b)*rr)}c.closePath();c.fill()}
   else if(f.k==='gsw'){const I=IMG['s2_gs'+Math.min(3,Math.floor(k*4))];if(I?.complete&&I.width){c.globalAlpha=k<.75?1:(1-k)*4;const w=I.width*f.s,h=I.height*f.s;c.translate(f.x-cx,f.y-cy+4);c.scale(f.f,1);c.drawImage(I,-8,-h,w,h)}}
   else if(f.k==='chop'){const p=Math.min(1,k/.3),x=f.x-cx,y=f.y-cy,N=16,n=Math.ceil(N*p);c.globalAlpha=k<.4?1:1-(k-.4)/.6;const P=t=>{const u=1-t;return[u*u*(x-8*f.f)+2*u*t*(x+22*f.f)+t*t*x,u*u*(y-62)+2*u*t*(y-34)+t*t*y]};
     c.fillStyle='rgba(255,255,255,.92)';c.beginPath();for(let i=0;i<=n;i++){const [px,py]=P(i/N);c.lineTo(px,py)}for(let i=n;i>=0;i--){const [px,py]=P(i/N),w=9*Math.sin(Math.PI*i/N);c.lineTo(px-w*f.f,py)}c.closePath();c.fill()}
   else if(f.k==='bigsw'){const I=IMG.swd,p=Math.min(1,k/.3);if(I?.complete&&I.width){c.globalAlpha=k<.5?1:1-(k-.5)*2;c.translate(f.x-cx,f.y-cy);c.rotate(f.a-1.1+2*p);c.drawImage(I,0,-f.r*.18,f.r,f.r*.36)}}
   else if(f.k==='thrust'){const x0=f.x0-cx,y0=f.y0-cy-8,x1=f.x1-cx,y1=f.y1-cy-8,a=Math.atan2(y1-y0,x1-x0),L=Math.hypot(x1-x0,y1-y0)*Math.min(1,k/.25+.3);c.translate(x0,y0);c.rotate(a);c.fillStyle=`rgba(${f.c},.35)`;c.beginPath();c.moveTo(0,-5);c.lineTo(L,0);c.lineTo(0,5);c.fill();c.fillStyle='rgba(255,255,255,.95)';c.beginPath();c.moveTo(4,-1.6);c.lineTo(L+4,0);c.lineTo(4,1.6);c.fill()}
   else if(f.k==='whip'){const p=Math.min(1,k/.35),x=f.x-cx,y=f.y-cy-8,ex=x+f.sd*f.len,ey=y+1,qx=x+f.sd*f.len*.5,qy=y-7,N=20,n=Math.ceil(N*p);c.globalAlpha=k<.35?1:1-(k-.35)/.65;
     const P=t=>{const u=f.back?1-t:t;return[(1-u)*(1-u)*x+2*(1-u)*u*qx+u*u*ex,(1-u)*(1-u)*y+2*(1-u)*u*qy+u*u*ey]};for(let i=1;i<=n;i++){const [ax,ay]=P((i-1)/N),[bx,by]=P(i/N),t=i/N;c.strokeStyle=`rgba(${f.c},${.4+.6*t})`;c.lineWidth=f.back?1+4*t:5-4*t;c.lineCap='round';c.beginPath();c.moveTo(ax,ay);c.lineTo(bx,by);c.stroke()}}
   else if(f.k==='dust'){c.globalAlpha=(1-k)*.5;c.fillStyle='rgb(190,175,140)';for(let i=0;i<3;i++){c.beginPath();c.arc(f.x-cx+(i-1)*f.r*.4,f.y-cy-k*f.r*.5,f.r*(.3+.5*k),0,6.3);c.fill()}}
   else if(f.k==='flash'){c.globalAlpha=1-k;const g=c.createRadialGradient(f.x-cx,f.y-cy,0,f.x-cx,f.y-cy,f.r);g.addColorStop(0,`rgba(${f.c},1)`);g.addColorStop(1,`rgba(${f.c},0)`);c.fillStyle=g;c.beginPath();c.arc(f.x-cx,f.y-cy,f.r*(.7+.3*k),0,6.3);c.fill()}
   else if(f.k==='seq'){const im=f.ims[Math.min(f.ims.length-1,Math.floor(k*f.ims.length))];c.globalAlpha=(f.al||1)*(k<.7?1:(1-k)/.3);if(f.wh)c.filter='saturate(0) brightness(1.7)';const fl=Math.cos(f.a)<0;c.translate(f.x-cx,f.y-cy);c.rotate(fl?f.a-Math.PI:f.a);DI(c,im,0,-2,f.w,0,fl)}
   else if(f.k==='ring'){c.strokeStyle=`rgba(${f.c||'255,255,255'},.9)`;c.lineWidth=2;c.beginPath();c.ellipse(f.x-cx,f.y-cy,f.r*(.6+.4*k),f.r*.8*(.6+.4*k),0,0,6.3);c.stroke()}
   else if(f.k==='cone'){c.fillStyle=`rgba(${f.c},.35)`;c.beginPath();c.moveTo(f.x-cx,f.y-cy);c.arc(f.x-cx,f.y-cy,f.r*(.5+.5*k),f.a-.5,f.a+.5);c.closePath();c.fill()}
   else if(f.k==='boom'){c.fillStyle='rgba(255,150,50,.45)';c.beginPath();c.ellipse(f.x-cx,f.y-cy,f.r*(.5+.5*k),f.r*.8*(.5+.5*k),0,0,6.3);c.fill()}
   else if(f.k==='boom2'){if(f.c){c.fillStyle=`rgba(${f.c},.4)`;c.beginPath();c.ellipse(f.x-cx,f.y-cy,f.r*(.5+.5*k),f.r*.8*(.5+.5*k),0,0,6.3);c.fill()}else DI(c,'fx_holyorb',f.x-cx,f.y-cy-6,f.r*1.6*(.6+.4*k))}
   c.restore()}}
 // 圣盾：吸收伤害，破碎爆炸
 function absorb(v){const s=X.S;if(!s?.c2||!(s.c2.sh>0))return v;const C=s.c2,a=Math.min(C.sh,v);C.sh-=a;
  if(C.sh<=0){const h=lv('hshield');C.shT=h>=3?5:8;fx({k:'boom2',x:hero.x,y:hero.y,r:60,d:.4});const v2=dmK('hshield',3+1.2*(h-1)+(h>=4?2:0));for(const e of near(hero.x,hero.y,60)){hit('hshield',e,v2);if(!e.boss&&!e.elite)knock(e,10)}
   if(h>=5){const [mx,my]=moveDir();st().P.push({k:'hwall',src:'hshield',x:hero.x+mx*14,y:hero.y+my*14,dx:mx,dy:my,v:120,life:1.4,dm:v2,len:70,hit:new Set(),nohit:1})}}
  return v-a}
 function onKill(e){if(e.vuln>=3&&e.vulnT>0&&lv('shadow')>=5){let n=0;for(const o of en.filter(q=>alive(q)&&q!==e).sort((a,b)=>d2(a,e)-d2(b,e))){if(n>=3||d2(o,e)>80*80)break;o.vuln=3;o.vulnT=4;n++}}
  if(e.markT>0&&lv('hawk')>=5){const o=nearest(150,e);if(o&&o!==e)o.markT=6}}
 // 伤害乘区：猎印、易伤、圣印封印
 function mul(e){const s=X.S;let m=1;if(e.markT>0)m*=1.15;if(e.vulnT>0)m*=1+.12*(e.vuln||1);if(e.sealT>0)m*=1.2;return m}
 return {fire,update,draw,ground,sprites,absorb,onKill,mul};
}
