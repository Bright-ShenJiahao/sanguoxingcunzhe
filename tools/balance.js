// 平衡测试机器人（GitHub Actions 上批量跑，也能本地跑）。
// 用法：node tools/balance.js <模式 solo|mix|type|fixed> <第几份 0..> <共几份> <每份局数或重复数> <输出文件> [地址]
//  solo：每张技能卡单独带（加专属），重复 reps 次
//  mix ：随机 5 张合法卡组（物理、法术各 ≤4），本份跑 reps 局（种子固定，可复现）
//  type：第几份＝伤害类型（0 近战 1 远程 2 元素 3 神圣 4 黑暗），每局 3 张本类型 + 2 张另一大类，跑 reps 局
// 默认用 bot_brain.js（BOT=v3）；BOT=v1 旧规则机器人，BOT=still 站桩。卡组用 ?deck=（只限定候选，按正常升级获得）；EQUIP=1 改用 ?cards=（开局直接装备）
const {chromium}=require('playwright');const fs=require('fs');
const [MODE='mix',PART='0',PARTS='1',REPS='2',OUT='result.json',URL='http://localhost:8765/index.html']=process.argv.slice(2);
const MAXT=+process.env.MAXT||1500;   // 一局最多跑多少秒（游戏时间）
const PAGES=+process.env.PAGES||2,BOTV=process.env.BOT||'v3',BRAIN2=fs.readFileSync(__dirname+'/bot_brain.js','utf8'),FIXED=(process.env.CARDS||'fireball,xbow,hshield,holyorb,hammer').split(',');
const BRAIN=`(()=>{window.BOT=true;let last=[0,0],stuck=0,wander=Math.random()*6.28;
setInterval(()=>{const G=window.__G;if(!G||!G.S)return;const h=G.hero,S=G.S;
 {const ju=document.getElementById('jobui');if(ju&&!ju.hidden){(ju.querySelector('[data-j]')||ju.querySelector('.no'))?.click();return}const mu=document.getElementById('mer');if(mu&&!mu.hidden){mu.querySelector('.cl')?.click();return}}
 const lv=document.getElementById('lvup');if(lv&&!lv.hidden){const c=[...lv.querySelectorAll('button.card')];if(c.length)c[Math.floor(Math.random()*c.length)].click();else lv.querySelector('[data-a=skip]')?.click();return}
 const sl=document.getElementById('slot');if(sl&&!sl.hidden){sl.click();return}
 let fx=0,fy=0;
 for(const e of G.en){if(e.dead||e.crate||e.drum)continue;const dx=h.x-e.x,dy=h.y-e.y,d=Math.hypot(dx,dy)||1;
  const danger=(e.state==='fuse'||e.state==='smash'||e.state==='leap'||e.state==='judge')?3:1,R=(e.boss||e.elite?150:110)*danger;
  if(d<R){const w=(R-d)/R*(e.boss?3:e.elite?2:1)*danger;fx+=dx/d*w;fy+=dy/d*w;fx+=-dy/d*w*.6;fy+=dx/d*w*.6}}
 const tgt=[...(S.gems||[]).map(g=>[g,1]),...(S.meats||[]).map(g=>[g,.8]),...(S.chests||[]).map(g=>[g,3])];
 let best=null,bs=0;for(const [g,w] of tgt){const d=Math.hypot(g.x-h.x,g.y-h.y);if(d<260&&w/(d+20)>bs){bs=w/(d+20);best=g}}
 if(best){const dx=best.x-h.x,dy=best.y-h.y,d=Math.hypot(dx,dy)||1;fx+=dx/d*.8;fy+=dy/d*.8}
 if(Math.hypot(fx,fy)<.2){wander+=(Math.random()-.5)*.3;fx+=Math.cos(wander);fy+=Math.sin(wander)}
 if(Math.hypot(h.x-last[0],h.y-last[1])<.5)stuck++;else stuck=0;last=[h.x,h.y];
 if(stuck>15){wander+=2+Math.random()*2;fx=Math.cos(wander);fy=Math.sin(wander);stuck=0}
 {const cx=G.WW/2-h.x,cy=G.WH/2-h.y,cd=Math.hypot(cx,cy)||1;fx+=cx/cd*.25;fy+=cy/cd*.25}
 let bd=null,bsc=-1e9;for(let k=0;k<16;k++){const a=k/16*6.283,ux=Math.cos(a),uy=Math.sin(a);let sc=ux*fx+uy*fy;for(const r of [20,45,80])if(!G.ok(h.x+ux*r,h.y+uy*r))sc-=1.5*(100-r)/50;if(sc>bsc){bsc=sc;bd=[ux,uy]}}
 window.BOTDIR=bd},40)})()`;
// 虚拟时钟：每帧固定 1/60 秒，不等显示器刷新，CPU 多快就跑多快
const CLOCK=()=>{let v=0;performance.now=()=>v;const T=window.setTimeout.bind(window);window.requestAnimationFrame=f=>T(()=>{v+=1000/60;f(v)},0)};
function rng(seed){return()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff}}
let KIND={};
async function cardList(b){const p=await b.newPage();await p.goto(URL+'?debug');await p.waitForFunction(()=>window.G?.run?.dbg?.WEAPONS,null,{timeout:60000});
 const r=await p.evaluate(()=>{const W=G.run.dbg.WEAPONS,K=G.run.dbg.KIND_ID||{};const ks=Object.keys(W).filter(k=>!W[k].own);return {ks,K:Object.fromEntries(ks.map(k=>[k,K[k]||'rng']))}});await p.close();KIND=r.K;return r.ks}
const PHY=k=>KIND[k]==='mel'||KIND[k]==='rng',legal=c=>c.filter(PHY).length<=4&&c.filter(k=>!PHY(k)).length<=4;
let ALL=[];
async function one(b,cards){const p=await b.newPage({viewport:{width:480,height:270}});const errs=[];p.on('pageerror',e=>{if(errs.length<10)errs.push(String(e.message).slice(0,160))});await p.addInitScript(CLOCK);await p.addInitScript(ALL=>{try{localStorage.setItem('lang','zh');localStorage.setItem('tutDone','1');localStorage.setItem('bootSeen','1');localStorage.setItem('meta',JSON.stringify({gold:9999,runs:1,up:{},kills:{}}));localStorage.setItem('sanguo.playerName','bot');localStorage.setItem('unl',JSON.stringify({c:ALL,p:[],best:0,boss:{},runs3:0,mig1:1}))}catch(e){}},ALL);
 await p.goto(URL+(process.env.EQUIP?'?cards=':'?deck=')+cards.join(','));await p.waitForSelector('.menu-name input',{state:'visible',timeout:120000});
 await p.waitForTimeout(500);await p.fill('.menu-name input','bot');await p.evaluate(()=>document.querySelector('.menu-start').click());await p.waitForTimeout(400);
 await p.evaluate(()=>document.querySelector('.cfm')?.remove());await p.evaluate(()=>document.querySelector('.pp-next').click());await p.waitForTimeout(300);await p.evaluate(()=>{document.querySelector('.cfm')?.remove();document.querySelector('.pp-go').click()});await p.waitForFunction(()=>window.__G?.S,null,{timeout:30000})
 await p.evaluate(BOTV!=='v1'?BRAIN2:BRAIN);if(BOTV==='still')await p.evaluate(()=>{window.BOTTICK=()=>{window.BOTDIR=[0,0]}});const w0=Date.now();
 let status='timeout',lastT=-1,lastMove=Date.now();
 while(true){await p.waitForTimeout(2000);await p.evaluate(()=>{const b=document.querySelector('#arcui:not([hidden]) button.it');if(b)b.click()});const st=await p.evaluate(()=>({dead:!!document.querySelector('.survival-dialog')?.open,clear:!!window.__G?.S?.clear,t:window.__G?.S?.t||0}));
  if(st.clear){status='clear';await p.waitForTimeout(1500);break}if(st.dead){status='death';break}if(st.t>=MAXT){status='cap';break}
  if(st.t!==lastT){lastT=st.t;lastMove=Date.now()}else if(Date.now()-lastMove>90e3){status='stuck';break}
  if(Date.now()-w0>40*60e3)break}
 const r=await p.evaluate(()=>{const S=__G.S,L=JSON.parse(localStorage.getItem('deathlog')||'[]'),d=L[L.length-1];
  return {t:Math.round(S.t),died:!!document.querySelector('.survival-dialog')?.open&&!S.clear,clear:!!S.clear,job:S.job||null,lastHit:window.LASTHIT||null,by:d?.by,kills:d?.kills??window.__G.kills,lv:S.lv,lvAt:S.lvAt,fullAt:S.fullAt??null,w:S.w,p:Object.fromEntries(Object.entries(S.p).filter(([,v])=>v>0)),dmg:Object.fromEntries(Object.entries(S.dmgBy||{}).map(([k,v])=>[k,Math.round(v)])),log:window.BOTLOG?{hits:BOTLOG.hits.slice(-60),nh:BOTLOG.hits.length,tele:BOTLOG.tele,modes:BOTLOG.modes,ev:BOTLOG.ev}:null}});
 r.status=status;r.errors=errs;r.cards=cards;r.bot=BOTV;r.mode=MODE;r.type=TYPE;r.wall=Math.round((Date.now()-w0)/1000);await p.close();return r}
const TYPES=['mel','rng','ele','holy','dark'];let TYPE=null;
(async()=>{const b=await chromium.launch({args:['--disable-gpu']});const all=await cardList(b);ALL=all;const jobs=[];
 if(MODE==='fixed'){for(let r=0;r<+REPS;r++)jobs.push(FIXED)}
 else if(MODE==='solo'){all.forEach((k,i)=>{if(i%+PARTS===+PART)for(let r=0;r<+REPS;r++)jobs.push([k])})}
 else if(MODE==='type'){TYPE=TYPES[+PART%5];const R=rng(5000+ +PART*7919),sh=a=>{a=[...a];for(let j=a.length-1;j>0;j--){const q=Math.floor(R()*(j+1));[a[j],a[q]]=[a[q],a[j]]}return a};
  const own=all.filter(k=>KIND[k]===TYPE),phy=TYPE==='mel'||TYPE==='rng',other=all.filter(k=>PHY(k)!==phy);for(let i=0;i<+REPS;i++)jobs.push([...sh(own).slice(0,3),...sh(other).slice(0,2)])}
 else{const R=rng(1000+ +PART*7919);for(let i=0;i<+REPS;i++){let c;do{const s=[...all];for(let j=s.length-1;j>0;j--){const q=Math.floor(R()*(j+1));[s[j],s[q]]=[s[q],s[j]]}c=s.slice(0,5)}while(!legal(c));jobs.push(c)}}
 const res=[];let k=0;
 await Promise.all(Array.from({length:PAGES},async()=>{while(k<jobs.length){const c=jobs[k++];const r=await one(b,c).catch(e=>({cards:c,err:String(e.message).slice(0,200)}));res.push(r);console.log(JSON.stringify(r));fs.writeFileSync(OUT,JSON.stringify(res))}}));
 fs.writeFileSync(OUT,JSON.stringify(res));await b.close()})();
