import {createLeaderboard,submitScore,formatTime,scoreOf} from './leaderboard.js?v=11042470';
import {t,onLanguageChange} from './i18n.js?v=11042470';
import {resetRunGlobals} from './runstate.js?v=11042470';
import {achvRunEnd,achvTitle,clearPick} from './achv.js?v=11042470';

export function createSurvival(game){
 let maxHp=100,playing=false,finished=false,hp=100,elapsed=0,cooldown=0,name='',generation=0;
 const style=document.createElement('style');style.textContent=`
 .survival-hud{position:absolute;top:2%;left:2%;width:min(310px,65%);box-sizing:border-box;padding:10px 12px;background:#102138e8;color:#f6f8ff;border:1px solid #94baff;border-radius:7px;font:clamp(11px,1.6vw,16px) system-ui;pointer-events:none}
 .survival-hud[hidden]{display:none}.survival-hud .stats{display:flex;justify-content:space-between;gap:10px;margin-bottom:5px}.survival-hud progress{width:100%;height:14px;accent-color:#66dc94}
 .survival-playing #kc{display:none}
 .survival-dialog{box-sizing:border-box;width:min(560px,94vw);max-height:90vh;padding:26px;border:2px solid #accfff;border-radius:12px;background:linear-gradient(145deg,#234e89,#101f3f);color:#f0f5ff;font:16px system-ui;text-align:center;overflow:auto}
 .survival-dialog::backdrop{background:#06101cd9}.survival-dialog h2{color:#f6db94;margin:0 0 18px}.survival-dialog p{color:#d6e2f6;margin:12px 0;overflow-wrap:anywhere}
 .survival-dialog button,.menu-board{cursor:pointer;font:inherit;color:#f0f5ff;border:1px solid #8fbbef;border-radius:6px;background:#436da66b;padding:11px 20px;margin:8px}
 .survival-dialog table{width:100%;border-collapse:collapse;margin:18px 0;font-size:14px}.survival-dialog th,.survival-dialog td{border-bottom:1px solid #7da1d54f;padding:9px 4px;overflow-wrap:anywhere;max-width:160px}
 .menu-board{display:block;width:100%;box-sizing:border-box;margin:0 0 18px;text-align:left}.board-content{margin:18px 0;min-height:30px}
 `;document.head.append(style);
 const hud=document.createElement('div');hud.className='survival-hud';hud.hidden=true;
 hud.innerHTML='<div class="stats"><span class="time"></span><span class="kills"></span></div>';
 document.getElementById('st').append(hud);
 const dialog=document.createElement('dialog');dialog.className='survival-dialog';dialog.innerHTML='<h2></h2><p class="result-name"></p><p class="result-stats"></p><p class="upload" role="status"></p><button class="retry"></button><button class="home"></button>';
 document.body.append(dialog);
 // 结算必须显式选择重开或返回；Escape 不会绕过死亡状态。
 dialog.addEventListener('cancel',e=>e.preventDefault());
 const board=createLeaderboard(),boardButton=document.createElement('button');boardButton.type='button';boardButton.className='menu-board';boardButton.onclick=()=>void board.open();
 document.querySelector('.menu-start').after(boardButton);
 function render(){hud.querySelector('.time').textContent=t('ui.hud.time',{time:formatTime(elapsed)});hud.querySelector('.kills').textContent=t('ui.hud.kills',{n:game.kills})}
 const applyText=()=>{dialog.setAttribute('aria-label',t('ui.result.aria'));dialog.querySelector('h2').textContent=t('ui.result.title');dialog.querySelector('.retry').textContent=t('ui.result.retry');dialog.querySelector('.home').textContent=t('ui.result.home');boardButton.textContent=t('ui.board.title');render()};
 applyText();onLanguageChange(applyText);
 function stop(){playing=false;finished=false;generation++;hud.hidden=true;document.body.classList.remove('survival-playing');if(dialog.open)dialog.close()}
 function start(){
  stop();playing=true;resetRunGlobals();maxHp=100;hp=100;game.reset();elapsed=0;cooldown=0;
  name=(document.querySelector('.menu-name input').value.trim()||t('ui.defaultName')).slice(0,8);
  hud.hidden=false;document.body.classList.add('survival-playing');render();
 }
function die(win){
  finished=true;dialog.querySelector('h2').textContent=t(win?'ui.result.win':'ui.result.title');game.clearInput();render();
  const rec={name,t:Math.floor(elapsed),kills:game.kills,lv:game.level?.()||1,bosses:game.bosses?.()||0,by:win?'CLEAR':String(window.LASTHIT||'?').slice(0,30),clear:win&&!(window.MODES?.fast||window.MODES?.endless)?1:0,emp:win?1:0,...(game.build?.()||{})},token=generation;
  try{const L=JSON.parse(localStorage.getItem('deathlog')||'[]');L.push({t:rec.t,kills:rec.kills,lv:game.level?.()||0,by:window.LASTHIT||'?',at:Date.now(),bot:!!window.BOT});localStorage.setItem('deathlog',JSON.stringify(L.slice(-100)))}catch(_){}
  dialog.querySelector('.result-name').textContent=t('ui.result.name',{name});
  dialog.querySelector('.result-stats').textContent=t('ui.result.stats',{time:formatTime(rec.t),kills:rec.kills,lv:rec.lv,bosses:rec.bosses,score:scoreOf(rec)});
  {const r=window.META?.runEnd(rec.t,rec.kills);{const M_=window.MODES||{},mul=(M_.rage?.5:0)+(M_.fast?.2:0)+(M_.endless?.2:0);if(r&&mul){const b=Math.round(r.g*mul);window.META.spend(-b);r.g+=b}rec.mode=['rage','fast','endless'].filter(k=>M_[k]).join(',')}if(r&&rec.clear){window.META.spend(-r.g);r.g*=2;try{const u=JSON.parse(localStorage.getItem('unl')||'{}');u.clears=(u.clears||0)+1;localStorage.setItem('unl',JSON.stringify(u))}catch(_){}}if(r)dialog.querySelector('.result-stats').textContent+=t('ui.result.gold',{g:r.g})}
  try{const U=window.UNL;if(U){const got=U.runEnd({kills:(JSON.parse(localStorage.getItem('meta')||'{}').kills)||{}},rec.t,window.__G?.S?.bossNames||[]);if(got.length){const R=window.__G?.R,nm=g=>g.t==='c'?(R?.WEAPONS?.[g.k]?.name||g.k):(R?.PASSIVES?.[g.k]?.name||g.k);dialog.querySelector('.result-stats').textContent+=t('ui.result.unlocked',{list:got.map(g=>t(g.t==='c'?'ui.result.unlockCard':'ui.result.unlockBless',{name:nm(g)})).join(t('run.sep'))})}}}catch(_){}
  try{const got=achvRunEnd(rec);if(got.length)dialog.querySelector('.result-stats').textContent+=' · 🏆 '+achvTitle()+'：'+got.join('、')}catch(_){}
  if(rec.clear){try{localStorage.setItem('clrPend',String((+localStorage.getItem('clrPend')||0)+1))}catch(_){}}
  if(rec.clear)setTimeout(()=>clearPick(t,x=>{if(!x)return;dialog.querySelector('.result-stats').textContent+=x.gold?t('ui.clr.gold'):t('ui.clr.got',{nm:x.nm})}),400);
  const upload=dialog.querySelector('.upload');upload.textContent=t('ui.result.uploading');dialog.showModal();
  // 每局仅在首次死亡时提交一次；晚到的网络响应不写入下一局界面。
  void submitScore(rec).then(ok=>{if(generation===token)upload.textContent=ok==='taken'?t('ui.board.taken'):ok?t('ui.result.uploaded'):t('ui.board.offline')});
 }
 dialog.querySelector('.retry').onclick=start;
 dialog.querySelector('.home').onclick=()=>{stop();game.clearInput();game.home()};
 return {start,stop,get playing(){return playing&&!finished},get hp(){return hp},get max(){return maxHp},get finished(){return finished},win(){if(playing&&!finished)die(true)},get canHit(){return playing&&!finished&&cooldown<=0&&!window.DBG?.god&&!window.CLEARED},guard(s){cooldown=Math.max(cooldown,s)},setMax(m,add=0){maxHp=m;hp=Math.min(m,hp+add);render()},heal(v){hp=Math.min(maxHp,hp+v);render()},damage(amount){
  if(!playing||finished||cooldown>0||window.DBG?.god||window.CLEARED)return;
  if(window.FHT==null)window.FHT=elapsed;window.LASTHIT=window.CUR_E;const big=amount>=maxHp*.12;hp=Math.max(0,hp-Math.round(amount));cooldown=Math.max(game.iframe?.()??0,big?.4:.25);window.SHAKE?.(big?3:1.5);window.HURT=performance.now();render();if(hp===0)die();
 },update(dt){
  if(!playing||finished)return;
  elapsed+=dt;if(dt>0)cooldown=Math.max(0,cooldown-dt);
  render();
 }};
}
