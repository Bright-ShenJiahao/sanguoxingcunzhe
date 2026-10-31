// 规则 AI 自动试玩：绕怪走位、躲红圈、捡经验/烤肉/宝箱，升级随机选卡；跑完把每局结果打印出来。
// 用法：node tools/bot.js [局数=6] [并行=3] [时间倍速=3] [地址=http://localhost:8811/index.html]
const {chromium}=require('playwright');
const N=+process.argv[2]||6,P=+process.argv[3]||3,TS=+process.argv[4]||3,URL=process.argv[5]||'http://localhost:8811/index.html';
const BRAIN=`(()=>{window.BOT=true;let last=[0,0],stuck=0,wander=Math.random()*6.28;
setInterval(()=>{const G=window.__G;if(!G||!G.S)return;const h=G.hero,S=G.S;
 const lv=document.getElementById('lvup');if(lv&&!lv.hidden){const c=[...lv.querySelectorAll('button.card')];if(c.length)c[Math.floor(Math.random()*c.length)].click();else lv.querySelector('[data-a=skip]')?.click();return}
 const sl=document.getElementById('slot');if(sl&&!sl.hidden){sl.click();return}
 let fx=0,fy=0;
 for(const e of G.en){if(e.dead||e.crate||e.drum)continue;const dx=h.x-e.x,dy=h.y-e.y,d=Math.hypot(dx,dy)||1;
  const danger=(e.state==='fuse'||e.state==='smash'||e.state==='leap'||e.state==='judge')?3:1,R=(e.boss||e.elite?150:110)*danger;
  if(d<R){const w=(R-d)/R*(e.boss?3:e.elite?2:1)*danger;fx+=dx/d*w;fy+=dy/d*w;fx+=-dy/d*w*.6;fy+=dx/d*w*.6}}   // 远离 + 绕圈
 const hpf=(+document.querySelector('.survival-hud .hp')?.textContent.split('/')[0]||100)/100;
 const tgt=[...(S.gems||[]).map(g=>[g,1]),...(S.meats||[]).map(g=>[g,hpf<.6?4:.5]),...(S.chests||[]).map(g=>[g,3])];
 let best=null,bs=0;for(const [g,w] of tgt){const d=Math.hypot(g.x-h.x,g.y-h.y);if(d<260&&w/(d+20)>bs){bs=w/(d+20);best=g}}
 if(best){const dx=best.x-h.x,dy=best.y-h.y,d=Math.hypot(dx,dy)||1;fx+=dx/d*.8;fy+=dy/d*.8}
 if(Math.hypot(fx,fy)<.2){wander+=(Math.random()-.5)*.3;fx+=Math.cos(wander);fy+=Math.sin(wander)}
 if(Math.hypot(h.x-last[0],h.y-last[1])<.5)stuck++;else stuck=0;last=[h.x,h.y];
 if(stuck>15){wander+=2+Math.random()*2;fx=Math.cos(wander);fy=Math.sin(wander);stuck=0}
 {const cx=G.WW/2-h.x,cy=G.WH/2-h.y,cd=Math.hypot(cx,cy)||1;fx+=cx/cd*.25;fy+=cy/cd*.25}   // 别贴边
 let bd=null,bsc=-1e9;for(let k=0;k<16;k++){const a=k/16*6.283,ux=Math.cos(a),uy=Math.sin(a);let sc=ux*fx+uy*fy;for(const r of [20,45,80])if(!G.ok(h.x+ux*r,h.y+uy*r))sc-=1.5*(100-r)/50;if(sc>bsc){bsc=sc;bd=[ux,uy]}}
 window.BOTDIR=bd},40)})()`;
async function one(b,i){const p=await b.newPage({viewport:{width:960,height:540}});
 await p.addInitScript(ts=>{const pn=performance.now.bind(performance);performance.now=()=>pn()*ts;const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=f=>raf(t=>f(t*ts))},TS);
 await p.goto(URL);await p.waitForTimeout(6000);await p.getByText('开始游戏').first().click();await p.waitForTimeout(400);
 await p.getByText('下一步').first().click();await p.waitForTimeout(300);await p.getByText('出发').first().click();await p.waitForTimeout(500);
 await p.evaluate(BRAIN);
 const t0=Date.now();while(Date.now()-t0<30*60*1000/TS+60000){await p.waitForTimeout(3000);if(await p.evaluate(()=>document.querySelector('.survival-dialog')?.open))break}
 const r=await p.evaluate(()=>{const L=JSON.parse(localStorage.getItem('deathlog')||'[]');return L[L.length-1]});await p.close();return r}
(async()=>{const b=await chromium.launch();const res=[];let k=0;
 await Promise.all(Array.from({length:P},async()=>{while(k<N){const i=k++;const r=await one(b,i).catch(e=>({err:e.message}));res.push(r);console.log('局',i+1,JSON.stringify(r))}}));
 const ts=res.filter(r=>r&&r.t!=null).map(r=>r.t).sort((a,b)=>a-b),f=t=>Math.floor(t/60)+':'+String(t%60).padStart(2,'0');
 if(ts.length)console.log(`共 ${ts.length} 局 · 平均 ${f(Math.round(ts.reduce((a,b)=>a+b)/ts.length))} · 中位 ${f(ts[ts.length>>1])} · 最短 ${f(ts[0])} · 最长 ${f(ts[ts.length-1])}`);
 await b.close()})();
