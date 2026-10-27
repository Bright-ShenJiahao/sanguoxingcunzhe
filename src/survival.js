import {createLeaderboard,submitScore,formatTime} from './leaderboard.js';

export function createSurvival(game){
 let playing=false,finished=false,hp=100,elapsed=0,cooldown=0,name='',generation=0;
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
 hud.innerHTML='<div class="stats"><span class="time"></span><span class="kills"></span></div><label>生命 <span class="hp"></span><progress max="100" value="100" aria-label="主角血量"></progress></label>';
 document.getElementById('st').append(hud);
 const dialog=document.createElement('dialog');dialog.className='survival-dialog';dialog.setAttribute('aria-label','游戏结算');
 dialog.innerHTML='<h2>游戏结束</h2><p class="result-name"></p><p class="result-stats"></p><p class="upload" role="status"></p><button class="retry">再来一局</button><button class="home">回主界面</button>';
 document.body.append(dialog);
 // 结算必须显式选择重开或返回；Escape 不会绕过死亡状态。
 dialog.addEventListener('cancel',e=>e.preventDefault());
 const board=createLeaderboard(),boardButton=document.createElement('button');boardButton.type='button';boardButton.className='menu-board';boardButton.textContent='排行榜';boardButton.onclick=()=>void board.open();
 document.querySelector('.menu-start').after(boardButton);
 function render(){hud.querySelector('.time').textContent='存活 '+formatTime(elapsed);hud.querySelector('.kills').textContent='击杀 '+game.kills;hud.querySelector('.hp').textContent=hp+'/100';hud.querySelector('progress').value=hp}
 function stop(){playing=false;finished=false;generation++;hud.hidden=true;document.body.classList.remove('survival-playing');if(dialog.open)dialog.close()}
 function start(){
  stop();game.reset();playing=true;hp=100;elapsed=0;cooldown=0;
  name=(document.querySelector('.menu-name input').value.trim()||'无名氏').slice(0,20);
  hud.hidden=false;document.body.classList.add('survival-playing');render();
 }
 function die(){
  finished=true;game.clearInput();render();
  const rec={name,t:Math.floor(elapsed),kills:game.kills},token=generation;
  dialog.querySelector('.result-name').textContent='名字：'+name;
  dialog.querySelector('.result-stats').textContent='存活时间：'+formatTime(rec.t)+' · 击杀数：'+rec.kills;
  const upload=dialog.querySelector('.upload');upload.textContent='正在提交成绩……';dialog.showModal();
  // 每局仅在首次死亡时提交一次；晚到的网络响应不写入下一局界面。
  void submitScore(rec).then(ok=>{if(generation===token)upload.textContent=ok?'成绩已提交':'暂时无法连接'});
 }
 dialog.querySelector('.retry').onclick=start;
 dialog.querySelector('.home').onclick=()=>{stop();game.clearInput();game.home()};
 return {start,get finished(){return finished},damage(amount){
  if(!playing||finished||game.extractActive||cooldown>0)return;
  hp=Math.max(0,hp-amount);cooldown=.75;render();if(hp===0)die();
 },update(dt){
  // 搜打撤继续使用原有血量、计时和结算，不重复扣血或混入生存榜。
  if(game.extractActive){if(playing)stop();return}
  if(!playing||finished)return;
  elapsed+=dt;cooldown=Math.max(0,cooldown-dt);
  render();
 }};
}
