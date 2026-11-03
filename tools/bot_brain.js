// 测试机器人 v2（注入游戏页面，每帧由 main.js 的 window.BOTTICK(dt) 调用）。
// 思路：24 个方向 × 未来 0.15/0.3/0.5 秒的预测位置打分——飞行物弹道、冲刺线、砸地/投掷落点、怪群密度、障碍；
// 宝石只在安全时顺路捡；有方向惯性防抖；选卡优先升级已有的卡。顺带记录受击日志供分析。
(function(){
const G=()=>window.__G,EP=()=>window.__EP||{arrows:[],lobs:[],booms:[]};
const ND=24,DIRS=[...Array(ND)].map((_,i)=>[Math.cos(i/ND*6.2832),Math.sin(i/ND*6.2832)]);
let T=0,cur=[1,0],hold=0,lastHp=null,stuckT=0,lastPos=null,mode='kite',orbitSign=Math.random()<.5?1:-1,emerg=0;
const LOG=window.BOTLOG={hits:[],tele:[],modes:{},dec:0};
const near=(x,y,r)=>{let n=0;for(const e of G().en){if(e.dead||e.crate||e.alpha===0)continue;if((e.x-x)**2+(e.y-y)**2<r*r)n++}return n};
// 一个方向的危险分（越大越危险）；返回 {d:危险, proj:飞行物危险}
function danger(ux,uy,sp){const g=G(),h=g.hero,E=EP();let d=0,proj=0;
 for(const t of [.12,.28,.5]){const px=h.x+ux*sp*t,py=h.y+uy*sp*t,w=t<.2?1.4:t<.35?1:.6;
  // 1) 障碍：走不过去直接大罚
  if(t<.3&&!g.ok(px,py))d+=80;
  // 2) 敌方箭（直线 145px/s，判定点在主角上方 10px，半径 8）
  for(const a of E.arrows){const ax=a.x+a.dx*145*t,ay=a.y+a.dy*145*t,q=Math.hypot(ax-px,ay-(py-10));if(q<16){const v=(16-q)/16*60*w;d+=v;proj+=v}}
  // 3) 投掷物/砸地落点：剩余时间内落地且在范围内
  for(const L of E.lobs){const rem=L.d-L.t;if(rem>t+.25)continue;const q=Math.hypot(L.x-px,L.y-py);if(q<(L.r||30)+8){const v=40*w;d+=v;proj+=v}}
  for(const e of g.en){if(e.dead||e.crate)continue;const ex=e.x,ey=e.y,dd=Math.hypot(ex-px,ey-py);if(dd>220)continue;
   const big=e.boss?2.2:e.elite?1.6:1;
   // 4) 冲刺：瞄准中/冲刺中，冲刺线（胶囊）上危险
   if((e.state==='aim'||e.state==='dash')&&e.dx!=null){const L_=(e.alen||e.dsp*(e.dlen||.25)||90)+20,rx=px-ex,ry=py-ey,al=rx*e.dx+ry*e.dy,sd=Math.abs(-rx*e.dy+ry*e.dx);if(al>-10&&al<L_&&sd<18){const v=50*w*big;d+=v;proj+=v}}
   // 5) 自爆/砸地/盾击/跳跃：圆形危险
   if(e.state==='fuse'&&dd<48)d+=45*w;
   if((e.state==='smash'||e.state==='leap'||e.state==='judge')&&dd<(e.sr||40)+12)d+=45*w*big;
   if(e.state==='bash'&&dd<36)d+=25*w;
   // 6) 普通接触：怪会往主角走，按预测距离给连续惩罚
   const reach=(14+(e.sc||1)*6)+t*35;if(dd<reach+26)d+=(reach+26-dd)/(reach+26)*(8*big)*w;
  }}
 return {d,proj}}
function density(ux,uy){const g=G(),h=g.hero;let s=0;for(const e of g.en){if(e.dead||e.crate)continue;const rx=e.x-h.x,ry=e.y-h.y,dd=Math.hypot(rx,ry);if(dd>360||dd<1)continue;const c=(rx*ux+ry*uy)/dd;if(c>.3)s+=(c-.3)*(e.boss?4:e.elite?2.5:1)*(1-dd/400)}return s}
function pickTarget(){const g=G(),h=g.hero,S=g.S,hpf=(g.hp||1)/(g.maxHp||100);let best=null,bs=0;
 const cand=[...(S.gems||[]).map(o=>[o,1]),...(S.meats||[]).map(o=>[o,hpf<.5?6:hpf<.8?1.5:.2]),...(S.chests||[]).map(o=>[o,4]),...(S.mags||[]).map(o=>[o,3])];
 for(const [o,w] of cand){const dd=Math.hypot(o.x-h.x,o.y-h.y);if(dd>200)continue;if(near(o.x,o.y,45)>(w>=4?2:0))continue;const sc=w/(dd+25);if(sc>bs){bs=sc;best=o}}return best}
window.BOTTICK=function(dt){const g=G();if(!g||!g.S)return;const h=g.hero;T+=dt;hold-=dt;emerg-=dt;LOG.dec++;
 const sp=72*(g.moveMul||1);
 // 受击日志
 const hp=g.hp;if(lastHp!=null&&hp<lastHp){const src=String(window.CUR_E||'?');LOG.hits.push({t:+T.toFixed(1),dmg:lastHp-hp,src,proj:/远程/.test(src),mode,emerg:emerg>0,n60:near(h.x,h.y,60),n120:near(h.x,h.y,120),arrows:EP().arrows.length});if(LOG.hits.length>400)LOG.hits.shift()}lastHp=hp;
 if(Math.floor(T/60)>LOG.tele.length-1)LOG.tele.push({m:Math.floor(T/60),lv:g.S.lv,en:g.en.filter(e=>!e.dead).length,hp});
 // 局势
 const n80=near(h.x,h.y,80),n140=near(h.x,h.y,140);
 mode=n80>=6?'break':n140>=3?'kite':'collect';LOG.modes[mode]=(LOG.modes[mode]||0)+dt;
 const tgt=mode==='collect'||(mode==='kite'&&n80<2)?pickTarget():null;
 // 怪群质心（绕圈用）
 let cx=0,cy=0,cn=0;for(const e of g.en){if(e.dead||e.crate)continue;const dd=Math.hypot(e.x-h.x,e.y-h.y);if(dd<260){cx+=e.x;cy+=e.y;cn++}}
 if(cn){cx/=cn;cy/=cn}
 let best=null,bsc=-1e9,bestProj=0,curProj=0;
 for(const [ux,uy] of DIRS){const {d,proj}=danger(ux,uy,sp);let sc=-d;
  sc-=density(ux,uy)*(mode==='break'?6:3);
  if(cn){const rx=h.x-cx,ry=h.y-cy,rl=Math.hypot(rx,ry)||1;const tx=-ry/rl*orbitSign,ty=rx/rl*orbitSign;sc+=(ux*tx+uy*ty)*(mode==='kite'?2.2:1)+(ux*rx+uy*ry)/rl*(rl<90?2.5:rl>170?-1:0)}
  if(tgt){const rx=tgt.x-h.x,ry=tgt.y-h.y,rl=Math.hypot(rx,ry)||1;sc+=(ux*rx+uy*ry)/rl*3}
  {const mx=g.WW/2-h.x,my=g.WH/2-h.y,ml=Math.hypot(mx,my)||1;if(ml>g.WW*.35)sc+=(ux*mx+uy*my)/ml*1.2}
  sc+=(ux*cur[0]+uy*cur[1])*1.5;   // 惯性
  if(sc>bsc){bsc=sc;best=[ux,uy];bestProj=proj}
  if(ux===cur[0]&&uy===cur[1])curProj=proj}
 const curD=danger(cur[0],cur[1],sp);
 if(curD.proj>5){emerg=.3}
 // 迟滞：没到最短保持时间、且当前方向不危险，就不换
 if(hold>0&&curD.d<8&&emerg<=0){}else if(best){if(best[0]!==cur[0]||best[1]!==cur[1]){cur=best;hold=mode==='break'?.45:.18}}
 // 卡住（游戏时间）
 if(lastPos&&Math.hypot(h.x-lastPos[0],h.y-lastPos[1])<sp*dt*.2){stuckT+=dt;if(stuckT>.35){const i=Math.floor(Math.random()*ND);cur=DIRS[i];hold=.4;stuckT=0;orbitSign*=-1}}else stuckT=0;
 lastPos=[h.x,h.y];
 if(Math.random()<dt*.05)orbitSign*=-1;
 window.BOTDIR=cur};
// 选卡：优先升级已有的卡，其次新卡（有空槽），再其次祝福；宝箱直接点
const PASS=['回复','活力','迅捷','吸血','磁力','急速','力量','护甲','闪避','智慧'];
setInterval(()=>{const g=G();if(!g||!g.S)return;const lv=document.getElementById('lvup');
 if(lv&&!lv.hidden){const c=[...lv.querySelectorAll('button.card')];if(!c.length){lv.querySelector('[data-a=skip]')?.click();return}
  const W=g.R?.WEAPONS||{},own=Object.keys(g.S.w).map(k=>W[k]?.name).filter(Boolean);
  const sc=b=>{const t=b.textContent;if(own.some(n=>t.includes(n)))return 3+Math.random();if(/NEW/.test(t)&&Object.values(W).some(w=>t.includes(w.name)))return 2+Math.random();const i=PASS.findIndex(p=>t.includes(p));return i>=0?1+(PASS.length-i)/PASS.length:Math.random()};
  c.sort((a,b)=>sc(b)-sc(a))[0].click();return}
 const sl=document.getElementById('slot');if(sl&&!sl.hidden)sl.click()},40);
})();
