// 局外系统：金币 / 抽奖券、永久强化（男女通用）、怪物图鉴、主界面顶部状态栏、老虎机动画（宝箱用，以后抽卡复用）。
// 存档在 localStorage 'meta'。
const UP=[
 {k:'hp',ic:'❤️',nm:'体魄',fx:'+8 生命',max:10,base:60},
 {k:'atk',ic:'🥊',nm:'力量',fx:'+4% 伤害',max:10,base:80},
 {k:'spd',ic:'👟',nm:'步伐',fx:'+3% 移速',max:8,base:70},
 {k:'cd',ic:'⏱️',nm:'反应',fx:'−3% 攻击间隔',max:8,base:90},
 {k:'arm',ic:'🛡️',nm:'护甲',fx:'−2% 受到伤害',max:8,base:80},
 {k:'reg',ic:'🌱',nm:'再生',fx:'+0.2 每秒回血',max:5,base:120},
 {k:'mag',ic:'🧲',nm:'磁铁',fx:'+12% 拾取范围',max:5,base:50},
 {k:'wis',ic:'📘',nm:'智慧',fx:'+5% 经验',max:5,base:100},
 {k:'gold',ic:'🪙',nm:'财运',fx:'+8% 金币',max:5,base:120},
 {k:'crit',ic:'⭐',nm:'暴击',fx:'+3% 暴击率（双倍伤害）',max:8,base:90},
 {k:'rr',ic:'🔄',nm:'重抽',fx:'每局 +1 次重抽',max:3,base:150},
 {k:'rev',ic:'✨',nm:'复活',fx:'每局复活 1 次（50% 生命）',max:1,base:1500}];
const price=(u,L)=>Math.round(u.base*Math.pow(1.35,L)/5)*5;
export const ENEMY_NAMES={goblin:'哥布林',gob_blade:'哥布林剑士',gob_archer:'哥布林弓箭手',gob_shield:'哥布林盾卫',gob_shaman:'哥布林萨满',gob_king:'哥布林大王'};
export function createMeta(){
 let M;try{M=JSON.parse(localStorage.getItem('meta')||'null')}catch(e){}
 M=Object.assign({gold:0,tickets:0,up:{},kills:{},runs:0},M||{});
 const save=()=>{try{localStorage.setItem('meta',JSON.stringify(M))}catch(e){}bar&&drawBar()};
 const L=k=>M.up[k]||0;
 // ---------- 样式 ----------
 const st=document.createElement('style');st.textContent=`
 #mbar{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:12;display:flex;gap:8px;font:600 14px "PingFang SC","Microsoft YaHei",sans-serif;color:#f4f7ff}
 #mbar .pill{display:flex;align-items:center;gap:6px;padding:6px 14px;border:2px solid #9cc3ff;border-radius:999px;background:#102446e8;box-shadow:0 2px 0 #0007}
 #mbar button{cursor:pointer;font:inherit;color:inherit}
 #mbar .pill{white-space:nowrap}#mbar img{height:20px;width:auto}
 @media (max-width:640px){#mbar{top:6px;gap:5px;font-size:13px}#mbar .pill{padding:3px 9px;gap:4px}#mbar img{height:17px}#mbar .lb{display:none}}
 body:not(.prep-open) #mbar{display:none}
 body.prep-open #prep .pp-step{margin-top:48px;max-height:calc(100vh - 70px)}
 .upw .note{color:#c9d8f0;margin:0 0 10px;font-size:13px}
 .mpanel{position:fixed;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;background:#050c16b0;font:15px "PingFang SC","Microsoft YaHei",sans-serif;color:#f2f6ff}
 .mpanel[hidden]{display:none}
 .mpanel .box{width:min(900px,94vw);max-height:88vh;overflow:auto;padding:22px 24px;border:3px solid #cfe2ff;border-radius:16px;background:linear-gradient(160deg,#2a5aaef5,#173a7cf5);box-shadow:0 8px 0 #0006}
 .mpanel h2{margin:0;font-size:26px;letter-spacing:2px;text-shadow:0 2px 0 #0008}.mpanel .hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
 .mpanel .hd small{font-size:15px;color:#c9d8f0;margin-left:10px}
 .mpanel .back{cursor:pointer;padding:8px 20px;border:2px solid #cfe2ff;border-radius:10px;background:#123063;color:#fff;font:inherit}
 .mpanel .note{color:#c9d8f0;margin:-4px 0 14px;font-size:13px}
 .ugrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px}
 .ucard{display:flex;align-items:center;gap:12px;padding:12px 14px;border:2px solid #8fbbef66;border-radius:12px;background:#0d2a63aa}
 .ucard .ic{font-size:30px;width:40px;text-align:center}.ucard .t{flex:1;min-width:0}.ucard b{font-size:17px}.ucard .fx{color:#c9d8f0;font-size:13px;margin-left:6px}
 .pips{display:flex;gap:3px;margin-top:6px}.pips i{width:16px;height:6px;border-radius:3px;background:#0a1838}.pips i.on{background:#ffd23f}
 .ucard .buy{cursor:pointer;min-width:74px;padding:8px 10px;border:2px solid #7a5208;border-radius:10px;background:linear-gradient(#ffd75a,#f0a91c);color:#4a2c00;font:700 15px inherit;box-shadow:0 3px 0 #7a5208}
 .ucard .buy:disabled{cursor:default;background:#56607a;border-color:#3a4256;color:#c9cfdd;box-shadow:none}
 .bgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}
 .bcard{position:relative;padding:10px 8px 8px;border:2px solid #8fbbef55;border-radius:12px;background:#0d2a63aa;text-align:center}
 .bcard .no{position:absolute;left:8px;top:6px;color:#9fb6d8;font-size:12px}.bcard .im{height:64px;display:flex;align-items:flex-end;justify-content:center}
 .bcard img{max-height:56px;image-rendering:pixelated}.bcard.unk img{filter:brightness(0) opacity(.55)}.bcard .nm{margin-top:4px;font-weight:700}.bcard .k{color:#ffd23f;font-size:13px}
 #slot{position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:#04081099;font:600 15px "PingFang SC","Microsoft YaHei",sans-serif}
 #slot[hidden]{display:none}
 #slot .m{position:relative;width:340px;padding:16px 16px 18px;border:4px solid #2a0d10;border-radius:10px;background:linear-gradient(90deg,#e8505a,#c9303c 40%,#b02633);box-shadow:0 8px 0 #0008}
 #slot .sign{margin:-6px 6px 12px;padding:10px;border:4px dotted #ffd23f;background:#2a0d10;color:#ffd23f;text-align:center;font-size:20px;letter-spacing:3px}
 #slot .reels{display:flex;gap:6px;padding:8px;border:4px solid #c08a1a;background:#16203a}
 #slot .reel{flex:1;height:90px;overflow:hidden;background:#f3eedf;border-radius:4px;position:relative}
 #slot .strip{position:absolute;left:0;right:0;top:0}
 #slot .cell{height:90px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#2a1a10;font-size:13px}
 #slot .cell .g{font-size:34px;line-height:40px}#slot .cell img{max-height:40px;image-rendering:pixelated}
 #slot .scr{margin:12px 20px 0;padding:8px;background:#2a0d10;color:#7dff9a;text-align:center;font-size:14px;min-height:20px}
 #slot .lever{position:absolute;right:-26px;top:40px;width:10px;height:110px;background:#c9ced8;border-radius:4px}#slot .lever:before{content:'';position:absolute;left:-7px;top:-14px;width:24px;height:24px;border-radius:50%;background:#e33}
 #slot .tip{margin-top:10px;color:#ffe9b0;text-align:center;font-size:12px}`;
 document.head.append(st);
 // ---------- 顶部状态栏 ----------
 const bar=document.createElement('div');bar.id='mbar';document.body.append(bar);
 function drawBar(){bar.innerHTML=`<span class="pill" title="金币"><img src="assets/ui/misc_0.png" alt="">${M.gold}</span><span class="pill" title="抽奖券"><img src="assets/ui/misc_1.png" alt="">${M.tickets}</span><button class="pill" data-p="dex" title="怪物图鉴"><img src="assets/ui/misc_2.png" alt=""><span class="lb">图鉴</span></button><button class="pill" data-p="snd" title="静音（M 键）"><img src="assets/ui/misc_${window.SFX?.muted?9:8}.png" alt=""></button>`;
  bar.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(b.dataset.p==='dex')openDex();else{dispatchEvent(new KeyboardEvent('keydown',{key:'m'}));setTimeout(drawBar,50)}})}
 drawBar();
 // ---------- 面板 ----------
 const pan=document.createElement('div');pan.className='mpanel';pan.hidden=true;document.body.append(pan);
 pan.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')pan.hidden=true});
 function shell(title,sub,body,note=''){pan.innerHTML=`<div class="box"><div class="hd"><h2>${title}<small>${sub}</small></h2><button class="back">返回</button></div>${note?`<div class="note">${note}</div>`:''}${body}</div>`;pan.hidden=false;pan.querySelector('.back').onclick=()=>pan.hidden=true;setTimeout(()=>pan.querySelector('button')?.focus(),30)}
 function renderUp(el){const html=upHTML();el.innerHTML='<div class="note">所有角色通用，每次购买价格上涨。</div>'+html;bindUp(el,()=>renderUp(el))}
 function upHTML(){return `<div class="ugrid">${UP.map(u=>{const l=L(u.k),full=l>=u.max,p=price(u,l);return `<div class="ucard"><div class="ic">${u.ic}</div><div class="t"><b>${u.nm}</b><span class="fx">${u.fx}</span><div class="pips">${Array.from({length:u.max},(_,i)=>`<i class="${i<l?'on':''}"></i>`).join('')}</div></div><button class="buy" data-k="${u.k}" ${full||M.gold<p?'disabled':''}>${full?'已满级':'🪙 '+p}</button></div>`}).join('')}</div>`}
 function bindUp(el,again){el.querySelectorAll('.buy').forEach(b=>b.onclick=()=>{const u=UP.find(x=>x.k===b.dataset.k),l=L(u.k),p=price(u,l);if(l>=u.max||M.gold<p)return;M.gold-=p;M.up[u.k]=l+1;save();again();el.querySelector(`[data-k=${u.k}]`)?.focus()})}
 function openUp(){
  const body=`<div class="ugrid">${UP.map(u=>{const l=L(u.k),full=l>=u.max,p=price(u,l);return `<div class="ucard"><div class="ic">${u.ic}</div><div class="t"><b>${u.nm}</b><span class="fx">${u.fx}</span><div class="pips">${Array.from({length:u.max},(_,i)=>`<i class="${i<l?'on':''}"></i>`).join('')}</div></div><button class="buy" data-k="${u.k}" ${full||M.gold<p?'disabled':''}>${full?'已满级':'🪙 '+p}</button></div>`}).join('')}</div>`;
  shell('永久强化','🪙 '+M.gold,body,'所有角色通用，每次购买价格上涨。');
  pan.querySelectorAll('.buy').forEach(b=>b.onclick=()=>{const u=UP.find(x=>x.k===b.dataset.k),l=L(u.k),p=price(u,l);if(l>=u.max||M.gold<p)return;M.gold-=p;M.up[u.k]=l+1;save();openUp();pan.querySelector(`[data-k=${u.k}]`)?.focus()})}
 function openDex(){
  const ks=Object.keys(ENEMY_NAMES),found=ks.filter(k=>M.kills[k]).length,tot=Object.values(M.kills).reduce((a,b)=>a+b,0);
  const body=`<div class="bgrid">${ks.map((k,i)=>{const n=M.kills[k]||0;return `<div class="bcard ${n?'':'unk'}"><span class="no">${String(i+1).padStart(3,'0')}</span><div class="im"><img src="assets/characters/enemies/${k}/idle0.png" alt=""></div><div class="nm">${n?ENEMY_NAMES[k]:'？？？'}</div><div class="k">${n?'击杀 '+n:'未发现'}</div></div>`}).join('')}</div>`;
  shell('怪物图鉴',`已发现 ${found} / ${ks.length} · 累计击杀 ${tot}`,body)}
 // ---------- 老虎机 ----------
 const sl=document.createElement('div');sl.id='slot';sl.hidden=true;document.body.append(sl);
 function slot(title,results,pool,done){
  sl.innerHTML=`<div class="m"><div class="sign">${title}</div><div class="reels">${[0,1,2].map(()=>'<div class="reel"><div class="strip"></div></div>').join('')}</div><div class="scr">转动中……</div><div class="lever"></div><div class="tip">按空格 / 点击跳过</div></div>`;sl.hidden=false;
  const cell=o=>`<div class="cell">${o.img?`<img src="${o.img}" alt="">`:`<span class="g">${o.g||'★'}</span>`}<span>${o.t||''}</span></div>`;
  const reels=[...sl.querySelectorAll('.strip')],show=results.length===1?[pool[0],results[0],pool[1]||pool[0]]:[results[0],results[1]||results[0],results[2]||results[0]];
  const N=18,durs=[900,1300,1700];let finished=false;
  reels.forEach((s,i)=>{const items=Array.from({length:N},()=>pool[Math.floor(Math.random()*pool.length)]);items.push(show[i]);s.innerHTML=items.map(cell).join('');
   s.animate([{transform:'translateY(0)'},{transform:`translateY(${-N*90}px)`}],{duration:durs[i],easing:'cubic-bezier(.2,.6,.3,1)',fill:'forwards'})});
  let t2=setTimeout(fin,1900);
  function fin(){if(finished)return;finished=true;clearTimeout(t2);reels.forEach(s=>{s.getAnimations().forEach(a=>a.finish())});
   sl.querySelector('.scr').textContent=results.map(r=>r.t).join('、');window.SFX?.level();setTimeout(()=>{sl.onclick=close;addEventListener('keydown',kd,true)},250)}
  function close(){sl.hidden=true;sl.onclick=null;removeEventListener('keydown',kd,true);done&&done()}
  function kd(e){if(e.key===' '||e.key==='Enter'||e.key==='Escape'){e.preventDefault();e.stopPropagation();close()}}
  const skip=e=>{if(!finished&&(e.type==='click'||e.key===' '||e.key==='Enter')){e.preventDefault();e.stopPropagation();fin()}};
  sl.onclick=skip;const ks=e=>{if(!finished)skip(e);else removeEventListener('keydown',ks,true)};addEventListener('keydown',ks,true)}
 // ---------- 对外 ----------
 return {
  get gold(){return M.gold},get tickets(){return M.tickets},
  addGold(v){M.gold+=Math.round(v*(1+.08*L('gold')));save()},addTickets(v){M.tickets+=v;save()},
  kill(k){M.kills[k]=(M.kills[k]||0)+1;if(!(M.kills[k]%20)||M.kills[k]===1)save()},
  runEnd(t,kills){const g=Math.round((kills/8+t/60*6)*(1+.08*L('gold'))),tk=Math.floor(t/180);M.gold+=g;M.tickets+=tk;M.runs++;save();return {g,tk}},
  bonus(){return {hp:8*L('hp'),atk:.04*L('atk'),spd:.03*L('spd'),cd:.03*L('cd'),arm:.02*L('arm'),reg:.2*L('reg'),mag:.12*L('mag'),wis:.05*L('wis'),crit:.03*L('crit'),rr:L('rr'),rev:L('rev')}},
  slot,openUp,openDex,renderUp,refresh:drawBar,save};
}
