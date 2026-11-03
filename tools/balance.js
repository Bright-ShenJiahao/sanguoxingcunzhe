// 平衡测试机器人（GitHub Actions 上批量跑，也能本地跑）。
// 用法：node tools/balance.js <模式 solo|mix> <第几份 0..> <共几份> <每份局数或重复数> <输出文件> [地址]
//  solo：每张技能卡单独带（加专属），重复 reps 次
//  mix ：随机 5 张卡组成一套，本份跑 reps 局（种子固定，可复现）
const {chromium}=require('playwright');const fs=require('fs');
const [MODE='mix',PART='0',PARTS='1',REPS='2',OUT='result.json',URL='http://localhost:8765/index.html']=process.argv.slice(2);
const MAXT=+process.env.MAXT||1500;   // 一局最多跑多少秒（游戏时间）
const PAGES=+process.env.PAGES||2,BOTV=process.env.BOT||'v1',BRAIN2=fs.readFileSync(__dirname+'/bot_brain.js','utf8'),FIXED=(process.env.CARDS||'fireball,xbow,hshield,holyorb,hammer').split(',');
const BRAIN=`(()=>{window.BOT=true;let last=[0,0],stuck=0,wander=Math.random()*6.28;
setInterval(()=>{const G=window.__G;if(!G||!G.S)return;const h=G.hero,S=G.S;
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
async function cardList(b){const p=await b.newPage();await p.goto(URL+'?debug');await p.waitForFunction(()=>window.G?.run?.dbg?.WEAPONS,null,{timeout:60000});
 const ks=await p.evaluate(()=>{const W=G.run.dbg.WEAPONS;return Object.keys(W).filter(k=>!W[k].own)});await p.close();return ks}
async function one(b,cards){const p=await b.newPage({viewport:{width:480,height:270}});await p.addInitScript(CLOCK);await p.addInitScript(()=>{try{localStorage.setItem('sanguo.playerName','bot');localStorage.setItem('unl',JSON.stringify({c:['greatsword','rapier','gsword','whip','fist','trap','treant','wolf','mgun','wedge','hawk','orb','keg','flamestep','pouch','waterel','fireel','hwall','sigil','fairy','bmist','dcoil','vortex','undead','thunder'],p:[],best:0,boss:{},runs3:0}))}catch(e){}});
 await p.goto(URL+'?cards='+cards.join(','));await p.waitForFunction(()=>[...document.querySelectorAll('button')].some(x=>x.textContent.includes('开始游戏')&&x.offsetParent),null,{timeout:120000});
 await p.waitForTimeout(500);await p.getByText('开始游戏').first().click();await p.waitForTimeout(300);
 for(const t of ['下一步','出发']){await p.getByText(t).first().click();await p.waitForTimeout(300)}
 await p.evaluate(BOTV!=='v1'?BRAIN2:BRAIN);const w0=Date.now();
 while(true){await p.waitForTimeout(2000);const st=await p.evaluate(()=>({dead:!!document.querySelector('.survival-dialog')?.open,t:window.__G?.S?.t||0}));if(st.dead||st.t>=MAXT||Date.now()-w0>40*60e3)break}
 const r=await p.evaluate(()=>{const S=__G.S,L=JSON.parse(localStorage.getItem('deathlog')||'[]'),d=L[L.length-1];
  return {t:Math.round(S.t),died:!!document.querySelector('.survival-dialog')?.open,by:d?.by,kills:d?.kills,lv:S.lv,lvAt:S.lvAt,fullAt:S.fullAt??null,w:S.w,p:Object.fromEntries(Object.entries(S.p).filter(([,v])=>v>0)),dmg:Object.fromEntries(Object.entries(S.dmgBy||{}).map(([k,v])=>[k,Math.round(v)])),log:window.BOTLOG?{hits:BOTLOG.hits.slice(-60),nh:BOTLOG.hits.length,tele:BOTLOG.tele,modes:BOTLOG.modes}:null}});
 r.cards=cards;r.bot=BOTV;r.wall=Math.round((Date.now()-w0)/1000);await p.close();return r}
(async()=>{const b=await chromium.launch({args:['--disable-gpu']});const all=await cardList(b);const jobs=[];
 if(MODE==='fixed'){for(let r=0;r<+REPS;r++)jobs.push(FIXED)}
 else if(MODE==='solo'){all.forEach((k,i)=>{if(i%+PARTS===+PART)for(let r=0;r<+REPS;r++)jobs.push([k])})}
 else{const R=rng(1000+ +PART*7919);for(let i=0;i<+REPS;i++){const s=[...all];for(let j=s.length-1;j>0;j--){const q=Math.floor(R()*(j+1));[s[j],s[q]]=[s[q],s[j]]}jobs.push(s.slice(0,5))}}
 const res=[];let k=0;
 await Promise.all(Array.from({length:PAGES},async()=>{while(k<jobs.length){const c=jobs[k++];const r=await one(b,c).catch(e=>({cards:c,err:String(e.message).slice(0,200)}));res.push(r);console.log(JSON.stringify(r));fs.writeFileSync(OUT,JSON.stringify(res))}}));
 fs.writeFileSync(OUT,JSON.stringify(res));await b.close()})();
