// 神经进化走位 AI（方案 A）。小神经网络只负责「往哪走」；选卡仍随机（保证平衡测试公平）。
// 每台机器是一个「岛」：(1+λ) 进化策略，父代每代重测一次，适应度 = 存活秒数 + 等级×3。
// 用法：node tools/neuro.js <岛号> <代数> <输出文件> [起点权重文件]
// 环境变量：MAXT 每局最长秒数（默认 600） PAGES 并行页数（默认 4） LAMBDA 每代子代数（默认 7） SIGMA 变异强度（默认 .15）
const {chromium}=require('playwright');const fs=require('fs');
const [ISLAND='0',GENS='20',OUT='neuro-0.json',SEED_FILE]=process.argv.slice(2);
const URL=process.env.URL||'http://localhost:8765/index.html',MAXT=+process.env.MAXT||600,PAGES=+process.env.PAGES||4,LAMBDA=+process.env.LAMBDA||7,SIGMA=+process.env.SIGMA||.15;
const NS=8,NIN=NS*4+NS+4,NH=16,NOUT=2,NW=NIN*NH+NH+NH*NOUT+NOUT;   // 输入：8 方向×(怪密度,危险,宝石,能否走) + 8 方向近距离怪 + (血量,宝箱方向x,y,偏置)
const gauss=()=>{let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
// 页面里跑的「大脑」：算特征 → 网络前向 → 写 BOTDIR
const BRAIN=(W,NS,NIN,NH)=>{window.BOT=true;
 setInterval(()=>{const G=window.__G;if(!G||!G.S)return;const h=G.hero,S=G.S;
  const lv=document.getElementById('lvup');if(lv&&!lv.hidden){const c=[...lv.querySelectorAll('button.card')];if(c.length)c[Math.floor(Math.random()*c.length)].click();else lv.querySelector('[data-a=skip]')?.click();return}
  const sl=document.getElementById('slot');if(sl&&!sl.hidden){sl.click();return}
  const sec=a=>((Math.round(a/(2*Math.PI)*NS)%NS)+NS)%NS,f=new Array(NIN).fill(0);
  for(const e of G.en){if(e.dead||e.crate)continue;const dx=e.x-h.x,dy=e.y-h.y,d=Math.hypot(dx,dy);if(d>220)continue;const s=sec(Math.atan2(dy,dx)),w=1-d/220;
   f[s]+=w*.3;const dg=(e.boss?3:e.elite?2:1)*((e.state==='fuse'||e.state==='smash'||e.state==='leap'||e.state==='judge')?3:1);f[NS+s]=Math.max(f[NS+s],w*dg/3);if(d<45)f[NS*4+s]+=.5}
  for(const g of S.gems||[]){const dx=g.x-h.x,dy=g.y-h.y,d=Math.hypot(dx,dy);if(d<240)f[NS*2+sec(Math.atan2(dy,dx))]+=(1-d/240)*.15}
  for(let s=0;s<NS;s++){const a=s/NS*2*Math.PI;let o=0;for(const r of [20,45,80])if(!G.ok(h.x+Math.cos(a)*r,h.y+Math.sin(a)*r))o+=1/3;f[NS*3+s]=o}
  const hpE=document.querySelector('.survival-hud .hp');const hp=hpE?(+hpE.textContent.split('/')[0]/+hpE.textContent.split('/')[1]):1;
  let cb=null,cd=1e9;for(const c of S.chests||[]){const d=Math.hypot(c.x-h.x,c.y-h.y);if(d<cd){cd=d;cb=c}}
  const B=NS*5;f[B]=hp;f[B+1]=cb&&cd<300?(cb.x-h.x)/cd:0;f[B+2]=cb&&cd<300?(cb.y-h.y)/cd:0;f[B+3]=1;
  for(let i=0;i<NIN;i++)f[i]=Math.max(-3,Math.min(3,f[i]));
  let k=0;const hid=new Array(NH);for(let j=0;j<NH;j++){let z=0;for(let i=0;i<NIN;i++)z+=W[k++]*f[i];z+=W[k++];hid[j]=Math.tanh(z)}
  const o=[0,0];for(let m=0;m<2;m++){let z=0;for(let j=0;j<NH;j++)z+=W[k++]*hid[j];z+=W[k++];o[m]=Math.tanh(z)}
  const L=Math.hypot(o[0],o[1]);window.BOTDIR=L<.05?null:[o[0]/L,o[1]/L]},40)};
const CLOCK=()=>{let v=0;performance.now=()=>v;const T=window.setTimeout.bind(window);window.requestAnimationFrame=f=>T(()=>{v+=1000/60;f(v)},0)};
async function evalOne(b,W){const p=await b.newPage({viewport:{width:480,height:270}});await p.addInitScript(CLOCK);
 try{await p.goto(URL);await p.waitForFunction(()=>[...document.querySelectorAll('button')].some(x=>x.textContent.includes('开始游戏')&&x.offsetParent),null,{timeout:120000});
  await p.waitForTimeout(500);await p.getByText('开始游戏').first().click();await p.waitForTimeout(300);
  for(const t of ['下一步','出发']){await p.getByText(t).first().click();await p.waitForTimeout(300)}
  await p.evaluate(`(${BRAIN})(${JSON.stringify(W)},${NS},${NIN},${NH})`);const w0=Date.now();
  while(true){await p.waitForTimeout(2000);const st=await p.evaluate(()=>({dead:!!document.querySelector('.survival-dialog')?.open,t:window.__G?.S?.t||0}));if(st.dead||st.t>=MAXT||Date.now()-w0>25*60e3)break}
  const r=await p.evaluate(()=>({t:__G.S.t,lv:__G.S.lv}));if(process.env.DBGN)console.log(r);return r.t+r.lv*3}
 catch(e){return 0}finally{await p.close()}}
(async()=>{const b=await chromium.launch({args:['--disable-gpu']});
 let parent=SEED_FILE&&fs.existsSync(SEED_FILE)?JSON.parse(fs.readFileSync(SEED_FILE)).w:Array.from({length:NW},()=>gauss()*.3);
 if(parent.length!==NW)parent=Array.from({length:NW},()=>gauss()*.3);
 let pf=null,sig=SIGMA;const log=[];
 for(let g=0;g<+GENS;g++){const kids=Array.from({length:LAMBDA},()=>parent.map(x=>x+gauss()*sig));const cand=[parent,...kids],fit=new Array(cand.length);let i=0;
  await Promise.all(Array.from({length:PAGES},async()=>{while(i<cand.length){const j=i++;fit[j]=await evalOne(b,cand[j])}}));
  pf=pf==null?fit[0]:(pf+fit[0])/2;   // 父代：历次成绩取平均，减少运气成分
  let bi=-1,bf=pf;for(let j=1;j<cand.length;j++)if(fit[j]>bf){bf=fit[j];bi=j}
  if(bi>0){parent=cand[bi];pf=bf;sig=Math.min(.4,sig*1.1)}else sig=Math.max(.03,sig*.9);   // 1/5 成功率规则的简化版
  log.push({g,pf:Math.round(pf),best:Math.round(Math.max(...fit)),mean:Math.round(fit.reduce((a,c)=>a+c,0)/fit.length),sig:+sig.toFixed(3)});console.log(JSON.stringify(log[log.length-1]));
  fs.writeFileSync(OUT,JSON.stringify({island:+ISLAND,fit:pf,w:parent,log,shape:[NIN,NH,NOUT]}))}
 await b.close()})();
