// 局内成长（最小可玩版）：经验珠 → 升级三选一（大类卡点开再选）→ 多把武器自动攻击；被动；刷怪节奏；精英与 Boss。
// 设计见 docs/GAME_DESIGN.md。伤害单位 = 敌人血量单位（棍兵基础 2 点）。
const R=(a,b)=>a+Math.random()*(b-a);
const CATS={own:{name:'专属',ws:[]},blade:{name:'刀剑',ws:['sword','dao','hammer','axe']},bow:{name:'弓弩',ws:['bow','xbow']}};
const WEAPONS={
 sword:{name:'直剑',cat:'blade',img:'直剑',desc:['朝最近的敌人快速连斩','伤害提升','每次斩两下','范围变大','攻速提升','伤害提升','每次斩三下','范围、伤害大增']},
 dao:{name:'砍刀',cat:'blade',img:'砍刀',desc:['朝前方 120° 扇形横扫','伤害提升','扇面变大','间隔缩短','伤害提升','扇面变成半圆','间隔缩短','前后各扫一刀']},
 hammer:{name:'战锤',cat:'blade',img:'战锤',desc:['战锤砸向敌群，落地震出一圈，击退','伤害提升','震圈变大','间隔缩短','伤害提升','一次砸两锤','震圈变大','伤害大增，震晕敌人']},
 axe:{name:'短斧',cat:'blade',img:'短斧',desc:['劈砍前方敌人，20% 暴击（双倍）','暴击率 +10%','伤害提升','暴击伤害 ×2.5','间隔缩短','暴击率 +10%','范围变大','暴击伤害 ×3']},
 bow:{name:'弓',cat:'bow',img:'汉弓',desc:['射向最近的敌人','一次 2 支','伤害提升','箭能穿透 1 个敌人','一次 3 支','伤害提升','穿透 +2','一次 4 支，射速提升']},
 xbow:{name:'连弩',cat:'bow',img:'弩',desc:['朝前方扇形连射 3 支弩箭','伤害提升','一次 5 支','间隔缩短','伤害提升','一次 7 支','弩箭穿透 1 个','一次 9 支，伤害提升']}};
const PASSIVES={
 atk:{name:'攻击',desc:'所有武器伤害 +10%',max:5},
 hp:{name:'生命',desc:'生命上限 +20，并回复 20',max:5},
 spd:{name:'移速',desc:'移动速度 +8%',max:5},
 mag:{name:'拾取',desc:'经验拾取范围 +25%',max:5}};
// 角色专属武器（不进公共卡池）
WEAPONS.gb={name:'掌机',cat:'own',img:'gear/gb',own:1,desc:['按 A 键射出像素光弹，追最近的敌人','伤害提升','一次 2 发','光弹穿透 1 个敌人','射速提升','一次 3 发','穿透 +1','每 4 轮从天上砸下俄罗斯方块']};
WEAPONS.hp={name:'耳机',cat:'own',img:'gear/hp',own:1,desc:['放出声波圈，向外扩散并推开敌人','伤害提升','声波圈变大','间隔缩短','附带音符追踪敌人','伤害提升','音符变多','重低音：全屏震停敌人 1 秒']};
const MAXW=6,MAXP=4;
export function createRun({hero,en,images,hitEnemy,survival,ok,makeEnemy}){
 let S;
 const ui=document.createElement('div');ui.id='lvup';ui.hidden=true;
 const st=document.createElement('style');st.textContent=`
 #lvup{position:fixed;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;background:#050c16aa;font:15px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif;color:#f2f6ff}
 #lvup[hidden]{display:none}#lvup .box{width:min(520px,92vw);padding:18px;border:2px solid #b6d5ff;border-radius:12px;background:linear-gradient(145deg,#254f9cf2,#142858f2)}
 #lvup h2{margin:0 0 4px;text-align:center;color:#f6db94;font-size:22px}#lvup .sub{text-align:center;color:#c9d8f0;margin-bottom:12px;font-size:13px}
 #lvup button.card{display:flex;gap:12px;align-items:center;width:100%;text-align:left;margin:8px 0;padding:10px 12px;border:1px solid #8fbbef;border-radius:8px;background:#0c225a99;color:#f2f6ff;font:inherit;cursor:pointer}
 #lvup button.card:hover,#lvup button.card:focus{background:#2f5aa0cc;outline:2px solid #f6db94}
 #lvup .ic{flex:none;width:44px;height:44px;border-radius:6px;background:#0a1630;display:grid;place-items:center;font-weight:700;color:#f6db94;font-size:18px}
 #lvup .ic img{max-width:40px;max-height:40px;image-rendering:pixelated}
 #lvup .nm{font-weight:700}#lvup .lv{color:#9fe0a8;font-size:12px;margin-left:6px}#lvup .new{color:#ffd166}#lvup .d{display:block;color:#c9d8f0;font-size:13px;margin-top:2px}
 #lvup .row{display:flex;gap:8px;justify-content:center;margin-top:6px}#lvup .row button{padding:8px 16px;border-radius:6px;border:1px solid #8fbbef;background:#436da66b;color:#fff;font:inherit;cursor:pointer}`;
 document.head.append(st);document.body.append(ui);
 const wImg={};for(const k in WEAPONS){const im=new Image();im.src='assets/weapons/'+WEAPONS[k].img+'.png';wImg[k]=im}
 const GX={};for(const k of ['b0','b1','b2','b3','x0','x1','x2','x3','tet','w0','w1','w2','w3','n0','n1','n2','bass']){const im=new Image();im.src='assets/weapons/gear/'+k+'.png';GX[k]=im}
 function reset(start='sword'){
  S={t:+(new URLSearchParams(location.search).get('t')||0),lv:1,xp:0,need:5,queue:0,lastLv:-9,rerolls:0,w:{[start]:1},cd:{},p:{atk:0,hp:0,spd:0,mag:0},gems:[],shots:[],fx:[],texts:[],eliteT:+(new URLSearchParams(location.search).get('t')||0)+75,bossDone:{},paused:false,maxHp:100};
  survival?.setMax?.(100);ui.hidden=true;
 }
 // ---------- 节奏 ----------
 const want=()=>{const m=S.t/60;return Math.min(300,Math.round(m<=5?15+9*m:m<=10?60+18*(m-5):150+15*(m-10)))};
 function onSpawnBase(e){const m=S.t/60;e.hp=e.hpMax=Math.ceil(e.hp*(1+S.t/150));e.dmgMul=Math.min(1.8,.45+m*.07);e.sc=1}
 function onSpawn(e){
  onSpawnBase(e);
  if(S.t>=600&&!S.bossDone[10]){S.bossDone[10]=1;e.boss=true;e.k='gob_king';e.hp=e.hpMax=Math.round(80*(1+S.t/150));e.sc=1.25;e.name='哥布林大王';S.texts.push({x:e.x,y:e.y-40,v:'Boss 来袭！',t:2.5,c:'#ff8a6a',big:1})}
  else if(S.t>=S.eliteT){S.eliteT=S.t+R(60,110);e.elite=true;e.k='gob_shaman';e.hp=e.hpMax=Math.ceil(10*(1+S.t/150));e.sc=1.1;e.summonT=4}
 }
 function dmg(base){return base*(1+0.1*S.p.atk)}
 function nearest(r,from=hero){let b=null,bd=r*r;for(const e of en){if(e.dead)continue;const d=(e.x-from.x)**2+(e.y-from.y)**2;if(d<bd){bd=d;b=e}}return b}
 function hitArc(ang,range,half,amount,opts={}){
  let n=0;for(const e of en){if(e.dead)continue;const dx=e.x-hero.x,dy=(e.y-hero.y)*1.15,d=Math.hypot(dx,dy);if(d>range+4*(e.sc||1))continue;
   let a=Math.atan2(dy,dx)-ang;a=Math.atan2(Math.sin(a),Math.cos(a));if(Math.abs(a)>half&&d>10)continue;
   let v=amount,crit=false;if(opts.crit&&Math.random()<opts.crit){v*=opts.cm;crit=true}
   strike(e,v,Math.sign(dx)||1,crit);if(opts.kb)knock(e,opts.kb);n++}return n}
 function strike(e,v,dir,crit){hitEnemy(e,v,dir);S.texts.push({x:e.x+R(-3,3),y:e.y-18*(e.sc||1),v:(Math.round(v*10)/10)+'',t:.55,c:crit?'#ffd166':'#ffffff',big:crit})}
 function knock(e,k){if(e.boss)k*=.15;const dx=e.x-hero.x,dy=e.y-hero.y,l=Math.hypot(dx,dy)||1,nx=e.x+dx/l*k,ny=e.y+dy/l*k;if(ok(nx,ny)){e.x=nx;e.y=ny}}
 // ---------- 武器 ----------
 const FIRE={
  sword(L){const t=nearest(70);if(!t)return .2;const ang=Math.atan2(t.y-hero.y,t.x-hero.x),n=L>=7?3:L>=3?2:1,rg=L>=8?56:L>=4?48:40,dm=dmg(1+.35*(L-1)+(L>=6?.6:0)+(L>=8?1:0));
   for(let i=0;i<n;i++)setTimeout(()=>{if(!S||S.paused)return;hitArc(ang,rg,.85,dm);S.fx.push({k:'arc',a:ang+(i%2?-.3:.3),r:rg,w:1.7,t:0,d:.18,c:'255,255,255',img:'sword',flip:i%2})},i*110);
   return L>=5?.62:.8},
  dao(L){const t=nearest(90),ang=t?Math.atan2(t.y-hero.y,t.x-hero.x):(hero.face>0?0:Math.PI),half=L>=6?1.57:L>=3?1.25:1.05,dm=dmg(1.6+.45*(L-1)+(L>=5?.6:0));
   hitArc(ang,46,half,dm);S.fx.push({k:'arc',a:ang,r:46,w:half*2,t:0,d:.22,c:'255,236,200',img:'dao'});
   if(L>=8){hitArc(ang+Math.PI,46,half,dm);S.fx.push({k:'arc',a:ang+Math.PI,r:46,w:half*2,t:0,d:.22,c:'255,236,200',img:'dao'})}
   return L>=7?.85:L>=4?1.0:1.2},
  hammer(L){const n=L>=6?2:1,r=L>=7?48:L>=3?40:34,dm=dmg(3+.8*(L-1)+(L>=8?2:0));
   const pool=en.filter(e=>!e.dead&&(e.x-hero.x)**2+(e.y-hero.y)**2<120*120);if(!pool.length)return .3;
   for(let i=0;i<n;i++){const t=pool[Math.floor(Math.random()*pool.length)];S.shots.push({k:'hammer',x:t.x,y:t.y,t:0,d:.35,r,dm,stun:L>=8})}
   return L>=4?1.6:2},
  axe(L){const t=nearest(60);if(!t)return .2;const ang=Math.atan2(t.y-hero.y,t.x-hero.x),cr=.2+(L>=2?.1:0)+(L>=6?.1:0),cm=L>=8?3:L>=4?2.5:2,rg=L>=7?50:40;
   hitArc(ang,rg,.62,dmg(1.7+.35*(L-1)+(L>=3?.5:0)),{crit:cr,cm});S.fx.push({k:'arc',a:ang,r:rg,w:1.25,t:0,d:.2,c:'255,210,160',img:'axe'});return L>=5?.8:1},
  bow(L){const n=L>=8?4:L>=5?3:L>=2?2:1,dm=dmg(1.3+(L>=3?.5:0)+(L>=6?.7:0)),pierce=(L>=4?1:0)+(L>=7?2:0);
   const ts=en.filter(e=>!e.dead).map(e=>[e,(e.x-hero.x)**2+(e.y-hero.y)**2]).filter(a=>a[1]<200*200).sort((a,b)=>a[1]-b[1]);if(!ts.length)return .2;
   for(let i=0;i<n;i++){const t=ts[i%ts.length][0],a=Math.atan2(t.y-hero.y,t.x-hero.x)+(i>=ts.length?R(-.15,.15):0);S.shots.push({k:'arrow',x:hero.x,y:hero.y-10,dx:Math.cos(a),dy:Math.sin(a),v:230,life:1,dm,pierce,hit:new Set()})}
   return L>=8?.75:1},
  xbow(L){const n=L>=8?9:L>=6?7:L>=3?5:3,dm=dmg(.9+(L>=2?.3:0)+(L>=5?.4:0)+(L>=8?.5:0)),pierce=L>=7?1:0;
   const t=nearest(180),base=t?Math.atan2(t.y-hero.y,t.x-hero.x):(hero.face>0?0:Math.PI);
   for(let i=0;i<n;i++){const a=base+(i-(n-1)/2)*.16;S.shots.push({k:'bolt',x:hero.x,y:hero.y-10,dx:Math.cos(a),dy:Math.sin(a),v:260,life:.75,dm,pierce,hit:new Set()})}
   return L>=4?1.15:1.5},
  gb(L){const n=L>=6?3:L>=3?2:1,dm=dmg(1.2+.35*(L-1)),pierce=(L>=4?1:0)+(L>=7?1:0);
   const ts=en.filter(e=>!e.dead).map(e=>[e,(e.x-hero.x)**2+(e.y-hero.y)**2]).filter(a=>a[1]<190*190).sort((a,b)=>a[1]-b[1]);if(!ts.length)return .2;
   for(let i=0;i<n;i++){const t=ts[i%ts.length][0],a=Math.atan2(t.y-10-(hero.y-10),t.x-hero.x)+(i>=ts.length?R(-.2,.2):0);S.shots.push({k:'pix',x:hero.x,y:hero.y-10,dx:Math.cos(a),dy:Math.sin(a),v:210,life:1,dm,pierce,hit:new Set()})}
   S.gbN=(S.gbN||0)+1;if(L>=8&&S.gbN%4===0){const t=ts[0][0];S.shots.push({k:'tet',x:t.x,y:t.y,t:0,d:.45,r:34,dm:dmg(5)})}
   return L>=5?.6:.85},
  hp(L){const r=L>=3?62:48,dm=dmg(1+.35*(L-1)+(L>=6?.6:0));S.shots.push({k:'wave',t:0,d:.6,r,dm,hit:new Set()});
   if(L>=5){const n=L>=7?3:2;for(let i=0;i<n;i++){const a=R(0,6.28);S.shots.push({k:'note',x:hero.x,y:hero.y-12,dx:Math.cos(a),dy:Math.sin(a),v:120,life:1.8,dm:dmg(1.2),pierce:0,hit:new Set(),img:'n'+(i%3)})}}
   S.hpN=(S.hpN||0)+1;if(L>=8&&S.hpN%5===0){S.fx.push({k:'bass',t:0,d:.6});for(const e of en)if(!e.dead&&(e.x-hero.x)**2+(e.y-hero.y)**2<260*260){strike(e,dm,Math.sign(e.x-hero.x)||1);e.state='hurt';e.timer=-.75}}
   return L>=4?1.1:1.4}};
 // ---------- 升级 ----------
 function gain(v){S.xp+=v*(S.w.gb?1.1:1)}
 function tryLevel(){
  if(S.paused||S.t-S.lastLv<3)return;
  if(S.xp<S.need)return;
  S.xp-=S.need;S.lv++;S.need=5+3*(S.lv-1);S.lastLv=S.t;
  if(S.lv%3===0)S.rerolls=Math.min(2,S.rerolls+1);
  openLevel();
 }
 function options(){
  const pool=[],nw=Object.keys(S.w).length,np=Object.keys(S.p).filter(k=>S.p[k]>0).length;
  for(const k in S.w)if(S.w[k]<8)pool.push({t:'w',k,wt:1.2});
  if(nw<MAXW)for(const c in CATS)if(CATS[c].ws.length&&CATS[c].ws.some(k=>!S.w[k]))pool.push({t:'cat',k:c,wt:1});
  for(const k in PASSIVES){const L=S.p[k];if(L>=PASSIVES[k].max)continue;if(!L&&np>=MAXP)continue;pool.push({t:'p',k,wt:.8})}
  const out=[];while(out.length<3&&pool.length){const tot=pool.reduce((a,o)=>a+o.wt,0);let r=Math.random()*tot,i=0;while(i<pool.length-1&&r>pool[i].wt)r-=pool[i++].wt;out.push(pool.splice(i,1)[0])}
  if(!out.length)out.push({t:'heal'});return out}
 function icon(o){if(o.t==='w')return `<img src="${wImg[o.k].src}" alt="">`;if(o.t==='cat')return CATS[o.k].name[0];if(o.t==='p')return PASSIVES[o.k].name[0];return '息'}
 function card(o,i){
  let nm,lv='',d;
  if(o.t==='w'){const L=S.w[o.k]||0,W=WEAPONS[o.k];nm=W.name+` <i class="tag">${CATS[W.cat].name}</i>`;lv=L?`<span class="lv">${L} → ${L+1} 级</span>`:'<span class="lv new">新武器</span>';d=W.desc[L]}
  else if(o.t==='cat'){const c=CATS[o.k];nm=c.name+'类武器';lv='<span class="lv new">点开选择</span>';d='可选：'+c.ws.filter(k=>!S.w[k]).map(k=>WEAPONS[k].name).join('、')}
  else if(o.t==='p'){const L=S.p[o.k];nm=PASSIVES[o.k].name;lv=L?`<span class="lv">${L} → ${L+1} 级</span>`:'<span class="lv new">新被动</span>';d=PASSIVES[o.k].desc}
  else{nm='调息';d='回复 30 点生命'}
  return `<button class="card" data-i="${i}"><span class="ic">${icon(o)}</span><span><span class="nm">${nm}</span>${lv}<span class="d">${d}</span></span></button>`}
 let cur=[],sub=null;
 function render(){
  const list=sub?CATS[sub].ws.filter(k=>!S.w[k]).map(k=>({t:'w',k})):cur;
  ui.innerHTML=`<div class="box"><h2>${sub?CATS[sub].name+'类武器':'升级！ 第 '+S.lv+' 级'}</h2><div class="sub">${sub?'选一把加入（武器格 '+Object.keys(S.w).length+'/'+MAXW+'）':'按 1 / 2 / 3 选择'}</div>${list.map(card).join('')}
   <div class="row">${sub?'<button data-a="back">返回</button>':(S.rerolls>0?`<button data-a="rr">重抽（剩 ${S.rerolls} 次）· R</button>`:'')}</div></div>`;
  ui.querySelectorAll('button.card').forEach(b=>b.onclick=()=>choose(list[+b.dataset.i]));
  const bk=ui.querySelector('[data-a=back]');if(bk)bk.onclick=()=>{sub=null;render()};
  const rr=ui.querySelector('[data-a=rr]');if(rr)rr.onclick=reroll;
  setTimeout(()=>ui.querySelector('button.card')?.focus(),30)}
 function openLevel(){S.paused=true;sub=null;cur=options();ui.hidden=false;render()}
 function reroll(){if(sub||S.rerolls<=0)return;S.rerolls--;cur=options();render()}
 function choose(o){
  if(!o)return;
  if(o.t==='cat'){sub=o.k;render();return}
  if(o.t==='w')S.w[o.k]=(S.w[o.k]||0)+1;
  else if(o.t==='p'){S.p[o.k]++;if(o.k==='hp'){S.maxHp+=20;survival?.setMax?.(S.maxHp,20)}}
  else survival?.heal?.(30);
  ui.hidden=true;S.paused=false;sub=null}
 addEventListener('keydown',e=>{if(!S||ui.hidden)return;const k=e.key.toLowerCase();
  if(/^[1-4]$/.test(k)){const b=ui.querySelectorAll('button.card')[+k-1];if(b)b.click()}
  else if(k==='r')reroll();else if(k==='escape'&&sub){sub=null;render()}});
 // ---------- 每帧 ----------
 function update(dt){
  if(!S||S.paused)return;
  S.t+=dt;
  for(const k in S.w){S.cd[k]=(S.cd[k]??R(.1,.4))-dt;if(S.cd[k]<=0)S.cd[k]=FIRE[k](S.w[k])}
  for(const s of S.shots){
   if(s.k==='wave'){s.t+=dt;const rr=s.r*Math.min(1,s.t/s.d);for(const e of en){if(e.dead||s.hit.has(e))continue;const d=Math.hypot(e.x-hero.x,(e.y-hero.y)*1.2);if(d<rr+4){s.hit.add(e);strike(e,s.dm,Math.sign(e.x-hero.x)||1);if(!e.boss)knock(e,8)}}s.dead=s.t>=s.d;continue}
   if(s.k==='tet'){s.t+=dt;if(!s.done&&s.t>=s.d){s.done=true;S.fx.push({k:'ring',x:s.x,y:s.y,r:s.r,t:0,d:.3});for(const e of en)if(!e.dead&&(e.x-s.x)**2+((e.y-s.y)*1.3)**2<s.r*s.r)strike(e,s.dm,1)}s.dead=s.t>s.d+.05;continue}
   if(s.k==='note'){const t=nearest(160,s);if(t){const a=Math.atan2(t.y-10-s.y,t.x-s.x),b=Math.atan2(s.dy,s.dx),d=Math.atan2(Math.sin(a-b),Math.cos(a-b));const nb=b+Math.max(-4*dt,Math.min(4*dt,d));s.dx=Math.cos(nb);s.dy=Math.sin(nb)}}
   if(s.k==='hammer'){s.t+=dt;if(!s.done&&s.t>=s.d){s.done=true;S.fx.push({k:'ring',x:s.x,y:s.y,r:s.r,t:0,d:.3});
     for(const e of en){if(e.dead)continue;if((e.x-s.x)**2+((e.y-s.y)*1.3)**2<(s.r+4*(e.sc||1))**2){strike(e,s.dm,Math.sign(e.x-s.x)||1);if(!e.dead){const dx=e.x-s.x,dy=e.y-s.y,l=Math.hypot(dx,dy)||1,k=e.boss?2:12;if(ok(e.x+dx/l*k,e.y+dy/l*k)){e.x+=dx/l*k;e.y+=dy/l*k}}}}}
     s.dead=s.t>s.d+.05;continue}
   s.x+=s.dx*s.v*dt;s.y+=s.dy*s.v*dt;s.life-=dt;
   for(const e of en){if(e.dead||s.hit.has(e))continue;const r=6*(e.sc||1);if(Math.abs(e.x-s.x)<r&&Math.abs(e.y-10*(e.sc||1)-s.y)<r+4){s.hit.add(e);strike(e,s.dm,s.dx>0?1:-1);if(s.pierce--<=0){s.life=0;break}}}
   s.dead=s.life<=0||!ok(s.x,s.y+10)}
  S.shots=S.shots.filter(s=>!s.dead);
  // 经验珠
  const mr=30*(1+.25*S.p.mag)*(S.w.hp?1.25:1);
  for(const g of S.gems){const dx=hero.x-g.x,dy=hero.y-6-g.y,d=Math.hypot(dx,dy);
   if(g.fly||d<mr){g.fly=true;const v=Math.max(140,d*6);g.x+=dx/d*v*dt;g.y+=dy/d*v*dt;if(d<6){g.got=true;gain(g.v)}}}
  S.gems=S.gems.filter(g=>!g.got);
  if(S.gems.length>500){const a=S.gems.splice(0,100);S.gems[0].v+=a.reduce((s,g)=>s+g.v,0)}
  // 离太远的敌人重新放到屏幕边（像吸血鬼幸存者）
  for(const e of en){if(e.dead)continue;const dx=e.x-hero.x,dy=e.y-hero.y;if(dx*dx+dy*dy>520*520){const a=Math.atan2(hero.y-e.y,hero.x-e.x)+R(-.6,.6),r=300;const nx=hero.x+Math.cos(a)*r*-1,ny=hero.y+Math.sin(a)*r*-1;if(ok(nx,ny)){e.x=nx;e.y=ny}}}
  for(const e of en){if(!e.elite||e.dead)continue;e.summonT-=dt;if(e.summonT<=0&&en.length<340){e.summonT=7;for(let i=0;i<3;i++){const a=R(0,6.28),x=e.x+Math.cos(a)*18,y=e.y+Math.sin(a)*12;if(ok(x,y)){const m=makeEnemy(x,y,'goblin');if(m){onSpawnBase(m);en.push(m)}}}S.fx.push({k:'ring',x:e.x,y:e.y,r:22,t:0,d:.4})}}
  tryLevel();
 }
 function onKill(e){const v=e.boss?60:e.elite?12:1;S.gems.push({x:e.x+R(-3,3),y:e.y-4+R(-3,3),v});if(e.boss)S.texts.push({x:e.x,y:e.y-50,v:'击败 '+e.name+'！',t:2.5,c:'#ffd166',big:1})}
 // ---------- 绘制 ----------
 function drawWorld(c,cx,cy,now){
  for(const g of S.gems){const x=g.x-cx,y=g.y-cy;if(x<-10||y<-10||x>2000||y>2000)continue;const big=g.v>=12,col=g.v>=60?'#ffd166':big?'#c77dff':g.v>1?'#5ab0ff':'#5fe0b8';
   c.fillStyle='rgba(0,0,0,.25)';c.fillRect(x-1.5,y+2,3,1);c.fillStyle=col;c.beginPath();c.moveTo(x,y-(big?4:2.6));c.lineTo(x+(big?3:2),y);c.lineTo(x,y+(big?4:2.6));c.lineTo(x-(big?3:2),y);c.closePath();c.fill();c.fillStyle='rgba(255,255,255,.8)';c.fillRect(x-.6,y-1.4,1,1)}
  for(const s of S.shots){
   if(s.k==='hammer'){const k=Math.min(1,s.t/s.d),x=s.x-cx,y=s.y-cy-60*(1-k)-6;c.save();c.globalAlpha=.35*k;c.fillStyle='#000';c.beginPath();c.ellipse(s.x-cx,s.y-cy,s.r*.5*k,s.r*.2*k,0,0,6.3);c.fill();c.restore();
    const im=wImg.hammer;if(im.complete){c.save();c.translate(x,y);c.rotate(Math.PI*(.2+k*.8));c.drawImage(im,-im.width/2,-im.height/2);c.restore()}continue}
   if(s.k==='wave'){const k=Math.min(1,s.t/s.d),im=GX['w'+Math.min(3,Math.floor(k*4))],rr=s.r*k;if(im.complete){c.save();c.globalAlpha=1-k*.5;c.drawImage(im,hero.x-cx-rr,hero.y-cy-8-rr*.8,rr*2,rr*1.6);c.restore()}continue}
   if(s.k==='tet'){const k=Math.min(1,s.t/s.d),im=GX.tet;if(im.complete){const h=22,w=im.width*h/im.height;c.drawImage(im,s.x-cx-w/2,s.y-cy-h-70*(1-k),w,h)}continue}
   if(s.k==='note'){const im=GX[s.img];if(im.complete){const h=9,w=im.width*h/im.height;c.drawImage(im,s.x-cx-w/2,s.y-cy-h/2,w,h)}continue}
   if(s.k==='pix'){const im=GX['b'+(Math.floor(performance.now()/80)%4)];if(im.complete){c.save();c.translate(s.x-cx,s.y-cy);c.rotate(Math.atan2(s.dy,s.dx));const h=6,w=im.width*h/im.height;c.drawImage(im,-w+3,-h/2,w,h);c.restore()}continue}
   const x=s.x-cx,y=s.y-cy;c.save();c.translate(x,y);c.rotate(Math.atan2(s.dy,s.dx));
   if(s.k==='arrow'){c.strokeStyle='#e9dcc0';c.lineWidth=1;c.beginPath();c.moveTo(-8,0);c.lineTo(3,0);c.stroke();c.fillStyle='#c8ccd2';c.fillRect(3,-1,2.5,2);c.fillStyle='#c0402e';c.fillRect(-8,-1.2,2,2.4)}
   else{c.strokeStyle='#d8c39a';c.lineWidth=1.3;c.beginPath();c.moveTo(-5,0);c.lineTo(2,0);c.stroke();c.fillStyle='#aab0b8';c.fillRect(2,-1,2,2)}
   c.restore()}
  const px=hero.x-cx,py=hero.y-cy-10;
  for(const f of S.fx){f.t+=1/60;const k=f.t/f.d;if(k>=1)continue;
   if(f.k==='arc'){c.save();c.translate(px,py);c.strokeStyle=`rgba(${f.c},${.85*(1-k)})`;c.lineWidth=3*(1-k)+1;c.beginPath();c.arc(0,0,f.r*.82,f.a-f.w/2,f.a-f.w/2+f.w*Math.min(1,k*2));c.stroke();
    const im=wImg[f.img];if(im&&im.complete){const aa=f.a-f.w/2+f.w*Math.min(1,k*2);c.rotate(aa);c.translate(f.r*.55,0);c.rotate(Math.PI/2);c.globalAlpha=1-k*.6;c.drawImage(im,-im.width/2,-im.height/2)}c.restore()}
   else if(f.k==='bass'){const im=GX.bass;if(im.complete){const r=40+200*k;c.save();c.globalAlpha=1-k;c.drawImage(im,px-r,py-r*.8,r*2,r*1.6);c.restore()}}
   else if(f.k==='ring'){c.strokeStyle=`rgba(255,226,170,${1-k})`;c.lineWidth=2.5*(1-k)+.5;c.beginPath();c.ellipse(f.x-cx,f.y-cy,f.r*(.4+.6*k),f.r*(.4+.6*k)*.6,0,0,6.3);c.stroke()}}
  S.fx=S.fx.filter(f=>f.t<f.d);
  c.save();c.textAlign='center';
  for(const t of S.texts){t.t-=1/60;t.y-=.35;c.globalAlpha=Math.min(1,t.t*3);c.font=(t.big?'bold 9px':'7px')+' "PingFang SC","Microsoft YaHei",sans-serif';c.lineWidth=2;c.strokeStyle='rgba(0,0,0,.7)';c.strokeText(t.v,t.x-cx,t.y-cy);c.fillStyle=t.c;c.fillText(t.v,t.x-cx,t.y-cy)}
  c.restore();S.texts=S.texts.filter(t=>t.t>0);
 }
 function drawUI(c,VW,VH){
  c.fillStyle='rgba(8,14,30,.75)';c.fillRect(0,0,VW,5);c.fillStyle='#5ab0ff';c.fillRect(0,0,VW*Math.min(1,S.xp/S.need),5);
  let x=VW/2-((Object.keys(S.w).length)*15)/2;c.font='bold 8px "PingFang SC","Microsoft YaHei",sans-serif';c.textAlign='right';c.lineWidth=2;c.strokeStyle='rgba(0,0,0,.7)';c.strokeText('Lv '+S.lv,x-4,18);c.fillStyle='#fff';c.fillText('Lv '+S.lv,x-4,18);c.textAlign='left';
  for(const k in S.w){c.fillStyle='rgba(8,14,30,.6)';c.fillRect(x,8,13,15);const im=wImg[k];if(im.complete){const s=Math.min(11/im.width,13/im.height);c.drawImage(im,x+6.5-im.width*s/2,9,im.width*s,im.height*s)}c.fillStyle='#ffd166';c.font='6px monospace';c.fillText(S.w[k],x+9,22);x+=15}
  c.textAlign='start'}
 return {dbg:{get S(){return S},WEAPONS,PASSIVES,levelUp(){S.xp=S.need;S.lastLv=-9},maxAll(){for(const k in WEAPONS)if(!WEAPONS[k].own||S.w[k])S.w[k]=8;for(const k in PASSIVES)S.p[k]=PASSIVES[k].max},skip(sec){S.t+=sec}},reset,update,onSpawn,onKill,drawWorld,drawUI,want:()=>S?want():16,get paused(){return !!S&&S.paused},get moveMul(){return S?1+.08*S.p.spd:1}};
}
