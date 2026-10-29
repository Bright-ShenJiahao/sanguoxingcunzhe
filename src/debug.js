// 开发者面板：网址加 ?debug 才出现（仅测试用，玩家看不到）。
export function createDebug(g){
 if(!new URLSearchParams(location.search).has('debug'))return null;
 const D=window.DBG={god:false};
 const st=document.createElement('style');st.textContent=`
 #dbg{position:fixed;left:8px;bottom:8px;z-index:50;width:220px;max-height:80vh;overflow:auto;font:12px "PingFang SC","Microsoft YaHei",sans-serif;color:#eaf2ff;background:#0b1530e8;border:1px solid #8fbbef;border-radius:8px;padding:8px}
 #dbg.min>:not(h4){display:none}#dbg h4{margin:0 0 6px;color:#f7d987;cursor:pointer;font-size:13px}
 #dbg .r{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0 8px}#dbg b{display:block;color:#9fb6d8;font-weight:400;margin-top:4px}
 #dbg button{cursor:pointer;font:inherit;color:#eaf2ff;background:#1e3a72;border:1px solid #5d86c9;border-radius:4px;padding:3px 7px}
 #dbg button.on{background:#7a5a10;border-color:#f0dc9c}`;document.head.append(st);
 const el=document.createElement('div');el.id='dbg';document.body.append(el);
 const W=g.world,places=[['出生点',W.spawn[0],W.spawn[1]],['迷雾森林',700,1200],['山顶',420,730],['峡谷',900,1140],['水乡',2300,900],['海边',2950,1350]];
 const WK=['auto','clear','lightrain','heavyrain','lightsnow','heavysnow','blizzard','fog','overcast'];
 el.innerHTML=`<h4>🔧 开发者（点标题收起）</h4>
 <b>主角</b><div class="r"><button data-a="god">无敌</button><button data-a="heal">回满血</button><button data-a="lv">升一级</button><button data-a="max">全武器满级</button></div>
 <b>时间（跳过）</b><div class="r"><button data-a="t60">+1 分</button><button data-a="t300">+5 分</button><button data-a="boss">到 Boss 前</button><button data-a="kill">清屏</button></div>
 <b>传送</b><div class="r">${places.map((p,i)=>`<button data-p="${i}">${p[0]}</button>`).join('')}</div>
 <b>天气</b><div class="r">${WK.map(k=>`<button data-w="${k}">${{auto:'随机',clear:'晴',lightrain:'小雨',heavyrain:'大雨',lightsnow:'小雪',heavysnow:'大雪',blizzard:'暴雪',fog:'雾',overcast:'阴'}[k]}</button>`).join('')}</div>
 <b>地图（点小地图也能瞬移）</b><div class="r"><button data-t="tp">点地图瞬移</button><button data-t="pen">画笔</button><button data-c="#ff3040" class="on">红</button><button data-c="#20d060">绿</button><button data-c="#9040ff">紫</button><button data-a="undo">撤销</button><button data-a="clr">清除</button><button data-a="copy">复制线条坐标</button></div>
 <b>时辰</b><div class="r">${g.weather.SC.map(s=>`<button data-h="${s}">${s}</button>`).join('')}</div>`;
 el.addEventListener('keydown',e=>e.stopPropagation());
 el.querySelector('h4').onclick=()=>el.classList.toggle('min');
 el.onclick=e=>{const b=e.target.closest('button');if(!b)return;const R=g.run.dbg,a=b.dataset.a;
  if(a==='god'){D.god=!D.god;b.classList.toggle('on',D.god)}
  else if(a==='heal')g.survival.heal(9999);
  else if(a==='lv')R.levelUp();
  else if(a==='max')R.maxAll();
  else if(a==='t60')R.skip(60);else if(a==='t300')R.skip(300);
  else if(a==='boss'){const s=R.S;if(s.t<595)s.t=595}
  else if(a==='kill'){for(const e of g.en)if(!e.dead)g.hit(e,9999)}
  if(b.dataset.p){const p=places[+b.dataset.p];g.hero.x=p[1];g.hero.y=p[2]}
  if(b.dataset.w){g.weather.force(b.dataset.w);el.querySelectorAll('[data-w]').forEach(x=>x.classList.toggle('on',x===b))}
  if(b.dataset.h){g.weather.setHour(b.dataset.h);el.querySelectorAll('[data-h]').forEach(x=>x.classList.toggle('on',x===b))}
  b.blur()};

 // ---------- 瞬移 / 画笔 ----------
 let mode=null,col='#ff3040',cur=null,lines=[];try{lines=JSON.parse(localStorage.getItem('dbgLines')||'[]')}catch(e){}
 const save=()=>{try{localStorage.setItem('dbgLines',JSON.stringify(lines))}catch(e){}};
 const cv=document.getElementById('cv'),mm=document.getElementById('mm');
 const toW=e=>{const r=cv.getBoundingClientRect(),C=window.CAM||{cx:0,cy:0,SC:1};return[Math.round(C.cx+(e.clientX-r.left)*cv.width/r.width/C.SC),Math.round(C.cy+(e.clientY-r.top)*cv.height/r.height/C.SC)]};
 const go=(x,y)=>{g.hero.x=Math.max(5,Math.min(W.WW-5,x));g.hero.y=Math.max(5,Math.min(W.WH-5,y))};
 const grab=e=>{if(!mode)return;e.preventDefault();e.stopPropagation()};
 cv.addEventListener('pointerdown',e=>{if(!mode)return;grab(e);const p=toW(e);if(mode==='tp')go(p[0],p[1]);else{cur={c:col,p:[p]};lines.push(cur);cv.setPointerCapture(e.pointerId)}},true);
 cv.addEventListener('pointermove',e=>{if(mode!=='pen'||!cur)return;grab(e);const p=toW(e),q=cur.p[cur.p.length-1];if(Math.hypot(p[0]-q[0],p[1]-q[1])>=3)cur.p.push(p)},true);
 cv.addEventListener('pointerup',e=>{if(cur){cur=null;save()}},true);
 for(const t of ['mousedown','click','touchstart'])cv.addEventListener(t,grab,true);
 mm.addEventListener('pointerdown',e=>{const r=mm.getBoundingClientRect();go((e.clientX-r.left)/r.width*W.WW,(e.clientY-r.top)/r.height*W.WH);e.stopPropagation()});
 mm.style.cursor='crosshair';
 el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.t){mode=mode===b.dataset.t?null:b.dataset.t;el.querySelectorAll('[data-t]').forEach(x=>x.classList.toggle('on',x.dataset.t===mode));cv.style.cursor=mode?'crosshair':''}
  if(b.dataset.c){col=b.dataset.c;el.querySelectorAll('[data-c]').forEach(x=>x.classList.toggle('on',x===b))}
  if(b.dataset.a==='undo'){lines.pop();save()}
  if(b.dataset.a==='clr'){lines=[];save()}
  if(b.dataset.a==='copy'){const t=JSON.stringify(lines.map(l=>({颜色:l.c,点:l.p})));navigator.clipboard?.writeText(t).then(()=>{b.textContent='已复制';setTimeout(()=>b.textContent='复制线条坐标',1200)},()=>prompt('复制：',t))}});
 el.querySelectorAll('[data-c]').forEach(b=>b.style.color=b.dataset.c);
 return {show(v){el.hidden=!v},draw(c,cx,cy){if(!lines.length)return;c.save();c.lineWidth=2;c.lineJoin=c.lineCap='round';for(const l of lines){c.strokeStyle=l.c;c.beginPath();l.p.forEach((p,i)=>i?c.lineTo(p[0]-cx,p[1]-cy):c.moveTo(p[0]-cx,p[1]-cy));c.stroke()}c.restore()}};
}
