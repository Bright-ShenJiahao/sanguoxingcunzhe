import {t as tr,onLanguageChange} from './i18n.js?v=11042300';
// 局外系统：金币 / 抽奖券、永久强化（男女通用）、怪物图鉴、主界面顶部状态栏、老虎机动画（宝箱用，以后抽卡复用）。
// 存档在 localStorage 'meta'。
const UP=[
 {k:'hp',ic:'<img src="assets/ui/u_hp.png?v=11042300" alt="">',get nm(){return tr('ui.up.hp.nm')},get fx(){return tr('ui.up.hp.fx')},max:10,base:60},
 {k:'atk',ic:'<img src="assets/ui/b_atk.png?v=11042300" alt="">',get nm(){return tr('ui.up.atk.nm')},get fx(){return tr('ui.up.atk.fx')},max:10,base:80},{k:'arc',ic:'<img src="assets/ui/p_arc.png?v=11042300" alt="">',get nm(){return tr('ui.up.arc.nm')},get fx(){return tr('ui.up.arc.fx')},max:10,base:80},
 {k:'spd',ic:'<img src="assets/ui/u_spd.png?v=11042300" alt="">',get nm(){return tr('ui.up.spd.nm')},get fx(){return tr('ui.up.spd.fx')},max:8,base:70},
 {k:'cd',ic:'<img src="assets/ui/u_cd.png?v=11042300" alt="">',get nm(){return tr('ui.up.cd.nm')},get fx(){return tr('ui.up.cd.fx')},max:8,base:90},
 {k:'arm',ic:'<img src="assets/ui/b_armor.png?v=11042300" alt="">',get nm(){return tr('ui.up.arm.nm')},get fx(){return tr('ui.up.arm.fx')},max:5,base:120},
 {k:'reg',ic:'<img src="assets/ui/b_regen.png?v=11042300" alt="">',get nm(){return tr('ui.up.reg.nm')},get fx(){return tr('ui.up.reg.fx')},max:5,base:120},
 {k:'mag',ic:'<img src="assets/ui/p_mag.png?v=11042300" alt="">',get nm(){return tr('ui.up.mag.nm')},get fx(){return tr('ui.up.mag.fx')},max:5,base:50},
 {k:'wis',ic:'<img src="assets/ui/icons_12.png?v=11042300" alt="">',get nm(){return tr('ui.up.wis.nm')},get fx(){return tr('ui.up.wis.fx')},max:5,base:100},
 {k:'gold',ic:'<img src="assets/ui/u_gold.png?v=11042300" alt="">',get nm(){return tr('ui.up.gold.nm')},get fx(){return tr('ui.up.gold.fx')},max:5,base:120},
 {k:'crit',ic:'<img src="assets/ui/p_crit.png?v=11042300" alt="">',get nm(){return tr('ui.up.crit.nm')},get fx(){return tr('ui.up.crit.fx')},max:8,base:90},
 {k:'area',ic:'<img src="assets/ui/b_area.png?v=11042300" alt="">',get nm(){return tr('ui.up.area.nm')},get fx(){return tr('ui.up.area.fx')},max:5,base:100},{k:'dur',ic:'<img src="assets/ui/u_dur.png?v=11042300" alt="">',get nm(){return tr('ui.up.dur.nm')},get fx(){return tr('ui.up.dur.fx')},max:5,base:90},{k:'pspd',ic:'<img src="assets/ui/b_pspd.png?v=11042300" alt="">',get nm(){return tr('ui.up.pspd.nm')},get fx(){return tr('ui.up.pspd.fx')},max:5,base:80},{k:'amt',ic:'<img src="assets/ui/u_amt.png?v=11042300" alt="">',get nm(){return tr('ui.up.amt.nm')},get fx(){return tr('ui.up.amt.fx')},max:1,base:1200},{k:'rr',ic:'<img src="assets/ui/u_rr.png?v=11042300" alt="">',get nm(){return tr('ui.up.rr.nm')},get fx(){return tr('ui.up.rr.fx')},max:3,base:150},
 {k:'rev',ic:'<img src="assets/ui/u_revive.png?v=11042300" alt="">',get nm(){return tr('ui.up.rev.nm')},get fx(){return tr('ui.up.rev.fx')},max:1,base:1000}];
const price=(u,L)=>Math.round(u.base*Math.pow(1.25,L)/5)*5;
export const ENEMY_NAMES={};for(const k of ["goblin", "gob_kid", "gob_blade", "gob_archer", "gob_shield", "gob_shaman", "gob_bomb", "gob_boar", "gob_rock", "gob_mage", "gob_ghost", "gob_wolf", "wolf_free", "gob_thrower", "gob_drum", "gob_necro", "gob_giant", "skeleton", "gob_king", "gob_emperor", "gob_chief", "gob_paladin", "gob_hero", "gob_troll"])Object.defineProperty(ENEMY_NAMES,k,{enumerable:true,get:()=>tr('ui.enemy.'+k)});
const RD={};for(const k of ["gob_shield", "gob_rock", "gob_wolf", "gob_boar", "gob_ghost", "gob_mage", "gob_shaman", "skeleton", "gob_necro", "gob_giant", "gob_paladin", "gob_hero", "gob_troll"])Object.defineProperty(RD,k,{enumerable:true,get:()=>tr('ui.rd.'+k)});
export function createMeta(){
 let M;try{M=JSON.parse(localStorage.getItem('meta')||'null')}catch(e){}
 M=Object.assign({gold:M?0:50,tickets:0,up:{},kills:{},runs:0},M||{});
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
 .ucard .ic img{width:40px;height:40px;object-fit:contain;image-rendering:pixelated}.ucard .ic{font-size:30px;width:40px;text-align:center}.ucard .t{flex:1;min-width:0}.ucard b{font-size:17px}.ucard .fx{color:#c9d8f0;font-size:13px;margin-left:6px}
 .pips{display:flex;gap:3px;margin-top:6px}.pips i{width:16px;height:6px;border-radius:3px;background:#0a1838}.pips i.on{background:#ffd23f}
 .ucard .buy{cursor:pointer;min-width:74px;padding:8px 10px;border:2px solid #7a5208;border-radius:10px;background:linear-gradient(#ffd75a,#f0a91c);color:#4a2c00;font:700 15px inherit;box-shadow:0 3px 0 #7a5208}
 .ucard .buy:disabled{cursor:default;background:#56607a;border-color:#3a4256;color:#c9cfdd;box-shadow:none}
 .bgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}
 .bcard{position:relative;padding:10px 8px 8px;border:2px solid #8fbbef55;border-radius:12px;background:#0d2a63aa;text-align:center}
 .bcard .no{position:absolute;left:8px;top:6px;color:#9fb6d8;font-size:12px}.bcard .im{height:64px;display:flex;align-items:flex-end;justify-content:center}
 .bcard img{max-height:56px;image-rendering:pixelated}.bcard.unk img{filter:brightness(0) opacity(.55)}.bcard .nm{margin-top:4px;font-weight:700}.bcard .k{color:#ffd23f;font-size:13px}
 #slot{position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:#04081099;font:600 15px "PingFang SC","Microsoft YaHei",sans-serif}
 #slot[hidden]{display:none}
 #slot .m{position:relative;width:min(380px,74vw);aspect-ratio:760/544;margin-top:40px;background:url(assets/ui/slot_body.png?v=11042300) center/100% 100% no-repeat;image-rendering:pixelated}
#slot .sign{position:absolute;left:-2%;right:-2%;top:-15%;height:19%;display:flex;align-items:center;justify-content:center;background:url(assets/ui/slot_sign.png?v=11042300) center/100% 100% no-repeat;color:#ffd96a;font-size:18px;letter-spacing:3px;text-shadow:0 2px 0 #000}
#slot .reels{position:absolute;left:15.5%;width:69%;top:40%;height:34%;display:flex;gap:4px;padding:4px}
#slot .reel{flex:1;overflow:hidden;background:url(assets/ui/slot_cell.png?v=11042300) center/100% 100% no-repeat;position:relative}
#slot .strip{position:absolute;left:0;right:0;top:0}
#slot .cell{height:var(--h);box-sizing:border-box;padding:12% 16% 10%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#3a2410;font-size:12px;font-weight:700;text-align:center;line-height:1.2}
#slot .cell .g{font-size:30px;line-height:36px}#slot .cell img{height:44%;max-width:64%;object-fit:contain;margin-bottom:2px;image-rendering:pixelated}
#slot .scr{position:absolute;left:0;right:0;bottom:-24%;height:19%;display:flex;align-items:center;justify-content:center;background:url(assets/ui/slot_bar.png?v=11042300) center/100% 100% no-repeat;color:#ffe9a8;font-size:15px;text-shadow:0 2px 0 #000;padding:0 8%}#slot .scr.many{height:auto;min-height:19%;bottom:auto;top:104%;flex-wrap:wrap;gap:2px 12px;font-size:13px;line-height:1.35;padding:6px 9%}#slot .scr span{white-space:nowrap}
#slot .lever{position:absolute;right:-15%;top:12%;width:13%;height:62%;background:url(assets/ui/slot_lever_up.png?v=11042300) center/contain no-repeat}
#slot .lever.dn{background-image:url(assets/ui/slot_lever_dn.png?v=11042300);top:30%}
#slot .fx{position:absolute;pointer-events:none;width:32%;aspect-ratio:1;background:center/contain no-repeat;animation:sfx 1s ease-out forwards}
@keyframes sfx{0%{opacity:0;transform:scale(.4) translateY(20px)}30%{opacity:1}100%{opacity:0;transform:scale(1.2) translateY(-30px)}}
#slot .tip{position:absolute;left:0;right:0;bottom:-48%;color:#ffe9b0;text-align:center;font-size:12px}`;
 document.head.append(st);
 // ---------- 顶部状态栏 ----------
 const bar=document.createElement('div');bar.id='mbar';document.body.append(bar);
 function drawBar(){bar.innerHTML=`<span class="pill" title="${tr('ui.gold')}"><img src="assets/ui/misc_0.png?v=11042300" alt="">${M.gold}</span><button class="pill" data-p="dex" title="${tr('ui.dex.title')}"><img src="assets/ui/misc_2.png?v=11042300" alt=""><span class="lb">${tr('ui.dex.short')}</span></button><button class="pill" data-p="ach" title="${window.ACHV_NAME?.()||''}">🏆<span class="lb">${window.ACHV_NAME?.()||''}</span></button><button class="pill" data-p="snd" title="${tr('ui.mute')}"><img src="assets/ui/misc_${window.SFX?.muted?9:8}.png?v=11042300" alt=""></button>`;
  bar.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(b.dataset.p==='dex')openDex();else if(b.dataset.p==='ach')window.ACHV_OPEN?.();else{dispatchEvent(new KeyboardEvent('keydown',{key:'m'}));setTimeout(drawBar,50)}})}
 drawBar();onLanguageChange(()=>drawBar());
 // ---------- 面板 ----------
 const pan=document.createElement('div');pan.className='mpanel';pan.hidden=true;document.body.append(pan);
 pan.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')pan.hidden=true});
 function shell(title,sub,body,note=''){pan.innerHTML=`<div class="box"><div class="hd"><h2>${title}<small>${sub}</small></h2><button class="back">${tr('ui.back')}</button></div>${note?`<div class="note">${note}</div>`:''}${body}</div>`;pan.hidden=false;pan.querySelector('.back').onclick=()=>pan.hidden=true;setTimeout(()=>pan.querySelector('button')?.focus(),30)}
 function renderUp(el){const html=upHTML();el.innerHTML='<div class="note">'+tr('ui.up.note')+'</div>'+html;bindUp(el,()=>renderUp(el))}
 function upHTML(){return `<div class="ugrid">${UP.map(u=>{const l=L(u.k),full=l>=u.max,p=price(u,l);return `<div class="ucard"><div class="ic">${u.ic}</div><div class="t"><b>${u.nm}</b><span class="fx">${u.fx}</span><div class="pips">${Array.from({length:u.max},(_,i)=>`<i class="${i<l?'on':''}"></i>`).join('')}</div></div><button class="buy" data-k="${u.k}" ${full||M.gold<p?'disabled':''}>${full?tr('ui.up.max'):'🪙 '+p}</button></div>`}).join('')}</div>`}
 function bindUp(el,again){el.querySelectorAll('.buy').forEach(b=>b.onclick=()=>{const u=UP.find(x=>x.k===b.dataset.k),l=L(u.k),p=price(u,l);if(l>=u.max||M.gold<p)return;M.gold-=p;M.up[u.k]=l+1;save();again();el.querySelector(`[data-k=${u.k}]`)?.focus()})}
 function openUp(){
  const body=`<div class="ugrid">${UP.map(u=>{const l=L(u.k),full=l>=u.max,p=price(u,l);return `<div class="ucard"><div class="ic">${u.ic}</div><div class="t"><b>${u.nm}</b><span class="fx">${u.fx}</span><div class="pips">${Array.from({length:u.max},(_,i)=>`<i class="${i<l?'on':''}"></i>`).join('')}</div></div><button class="buy" data-k="${u.k}" ${full||M.gold<p?'disabled':''}>${full?tr('ui.up.max'):'🪙 '+p}</button></div>`}).join('')}</div>`;
  shell(tr('ui.up.title'),'🪙 '+M.gold,body,tr('ui.up.note'));
  pan.querySelectorAll('.buy').forEach(b=>b.onclick=()=>{const u=UP.find(x=>x.k===b.dataset.k),l=L(u.k),p=price(u,l);if(l>=u.max||M.gold<p)return;M.gold-=p;M.up[u.k]=l+1;save();openUp();pan.querySelector(`[data-k=${u.k}]`)?.focus()})}
 function openDex(){
  const ORD=['goblin','gob_blade','gob_shield','gob_archer','gob_bomb','gob_mage','gob_wolf','gob_ghost','gob_rock','gob_thrower','gob_boar','gob_shaman','gob_drum','gob_necro','skeleton','gob_giant','gob_hero','gob_troll','gob_king','gob_chief','gob_paladin','gob_emperor'],ks=[...ORD.filter(k=>ENEMY_NAMES[k]),...Object.keys(ENEMY_NAMES).filter(k=>!ORD.includes(k))],found=ks.filter(k=>M.kills[k]).length,tot=Object.values(M.kills).reduce((a,b)=>a+b,0);
  const body=`<div class="bgrid">${ks.map((k,i)=>{const n=M.kills[k]||0;return `<div class="bcard ${n?'':'unk'}"><span class="no">${String(i+1).padStart(3,'0')}</span><div class="im"><img src="assets/characters/enemies/${k}/portrait.png?v=11042300" alt="" style="${n?'':'filter:brightness(0);opacity:.55'}" onerror="const f=+(this.dataset.f||0);this.dataset.f=f+1;if(f===0)this.src='assets/characters/enemies/${k}/idle0.png?v=11042300';else if(f===1)this.src='assets/characters/enemies/${k}/walk0.png?v=11042300'"></div><div class="nm">${n?ENEMY_NAMES[k]:tr('ui.dex.unknown')}</div><div class="k">${n?tr('ui.dex.kills',{n}):tr('ui.dex.undiscovered')}</div>${n&&RD[k]?`<div class="k" style="color:#ffcf8a">${RD[k]}</div>`:''}</div>`}).join('')}</div>`;
  shell(tr('ui.dex.title'),tr('ui.dex.sub',{found,total:ks.length,tot}),body)}
 // ---------- 老虎机 ----------
 const sl=document.createElement('div');sl.id='slot';sl.hidden=true;document.body.append(sl);
 function slot(title,results,pool,done){
  sl.innerHTML=`<div class="m"><div class="sign">${title}</div><div class="reels">${[0,1,2].map(()=>'<div class="reel"><div class="strip"></div></div>').join('')}</div><div class="scr">${tr('ui.slot.spin')}</div><div class="lever dn"></div><div class="tip">${tr('ui.slot.skip')}</div></div>`;sl.hidden=false;
  const cell=o=>`<div class="cell">${o.img?`<img src="${o.img}" alt="">`:`<span class="g">${o.g||'★'}</span>`}<span>${o.t||''}</span></div>`;
  const reels=[...sl.querySelectorAll('.strip')],show=results.length===1?[{g:''},results[0],{g:''}]:[results[0],results[1]||{g:''},results[2]||{g:''}];
  const N=18,durs=[900,1300,1700];let finished=false;const H=reels[0].parentNode.clientHeight||80;sl.style.setProperty('--h',H+'px');const lv=sl.querySelector('.lever');setTimeout(()=>lv.classList.remove('dn'),300);
  reels.forEach((s,i)=>{const items=Array.from({length:N},()=>pool[Math.floor(Math.random()*pool.length)]);items.push(show[i]);s.innerHTML=items.map(cell).join('');
   s.animate([{transform:'translateY(0)'},{transform:`translateY(${-N*H}px)`}],{duration:durs[i],easing:'cubic-bezier(.2,.6,.3,1)',fill:'forwards'})});
  let t2=setTimeout(fin,1900);
  function fin(){if(finished)return;finished=true;clearTimeout(t2);reels.forEach(s=>{s.getAnimations().forEach(a=>a.finish())});
   {const sc=sl.querySelector('.scr');sc.classList.toggle('many',results.length>1);sc.innerHTML=results.map(r=>`<span>${r.t}</span>`).join('')}window.SFX?.level();const M2=sl.querySelector('.m');[['coins',30,10],['spark',-5,5],['spark',65,0]].forEach(([n,l,t])=>{const d=document.createElement('div');d.className='fx';d.style.cssText=`left:${l}%;top:${t}%;background-image:url(assets/ui/slot_${n}.png?v=11042300)`;M2.append(d)});setTimeout(()=>{sl.onclick=close;addEventListener('keydown',kd,true)},250)}
  function close(){sl.hidden=true;sl.onclick=null;removeEventListener('keydown',kd,true);done&&done()}
  function kd(e){if(e.key===' '||e.key==='Enter'||e.key==='Escape'){e.preventDefault();e.stopPropagation();close()}}
  const skip=e=>{if(!finished&&(e.type==='click'||e.key===' '||e.key==='Enter')){e.preventDefault();e.stopPropagation();fin()}};
  sl.onclick=skip;const ks=e=>{if(!finished)skip(e);else removeEventListener('keydown',ks,true)};addEventListener('keydown',ks,true)}
 // ---------- 对外 ----------
 return {
  get gold(){return M.gold},drawBar(){bar&&drawBar()},spend(v){if(M.gold<v)return false;M.gold-=v;save();return true},get tickets(){return M.tickets},
  addGold(v){M.gold+=Math.round(v*(1+.15*L('gold')));clearTimeout(window.__gsv);window.__gsv=setTimeout(save,800)},addTickets(v){M.tickets+=v;save()},
  kill(k){M.kills[k]=(M.kills[k]||0)+1;if(!(M.kills[k]%20)||M.kills[k]===1)save()},
  runEnd(t,kills){const g=Math.round((kills/8+t/60*6)*(1+.15*L('gold'))),tk=Math.floor(t/180);M.gold+=g;M.tickets+=tk;M.runs++;save();return {g,tk}},
  bonus(){return {hp:8*L('hp'),atk:.04*L('atk'),spd:.03*L('spd'),cd:.03*L('cd'),arm:L('arm'),reg:.2*L('reg'),mag:.12*L('mag'),wis:.05*L('wis'),crit:.03*L('crit'),rr:L('rr'),rev:L('rev'),arc:.04*L('arc'),area:.05*L('area'),dur:.05*L('dur'),pspd:.05*L('pspd'),amt:L('amt')}},
  slot,openUp,openDex,renderUp,refresh:drawBar,save};
}
