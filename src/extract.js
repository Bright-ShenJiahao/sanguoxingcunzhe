// 搜打撤独立规则；通过小型适配器复用地图、人物与黄巾战斗。
export function createExtract(game) {
 const names={none:'无',short:'短武器',long:'长武器',bow:'弓',xbow:'弩',magic:'法器'};
 const colors=['#c6cbd1','#58a9f4','#dc91ff'];
 let active=false,finished=false,chests=[],exits=[],bag=[],started=0,hp=100,hold=0,lastMagic=0;
 const button=document.createElement('button');button.textContent='搜打撤';
 const bar=document.createElement('div');bar.className='sw';bar.append(button);
 document.getElementById('hs').before(bar);
 const hud=document.createElement('div');hud.setAttribute('role','status');
 hud.style.cssText='position:absolute;left:3%;bottom:3%;padding:8px;background:#14231de8;color:white;font:13px system-ui;pointer-events:none;white-space:pre-line';
 const result=document.createElement('div');
 // 结算按钮不进入原版地图的拖动摇杆 / 指针捕获流程。
 result.addEventListener('pointerdown',e=>e.stopPropagation());
 result.style.cssText='position:absolute;inset:0;background:#102219e8;color:white;display:none;align-items:center;justify-content:center;text-align:center;font:18px system-ui';
 document.getElementById('st').append(hud,result);
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 // 在出生点连通区域取样，避免宝箱或撤离圈落在水里或不可达区域。
 function reachable() {
  const step=8,origin={x:game.hero.x,y:game.hero.y},queue=[{x:0,y:0}],seen=new Set(['0,0']),points=[];
  for(let i=0;i<queue.length;i++){
   const q=queue[i],p={x:origin.x+q.x*step,y:origin.y+q.y*step};points.push(p);
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const x=q.x+dx,y=q.y+dy,key=x+','+y,nx=origin.x+x*step,ny=origin.y+y*step;
    if(seen.has(key))continue;seen.add(key);
    if(nx<24||ny<24||nx>game.size-24||ny>game.size-24)continue;
    if([.25,.5,.75,1].every(t=>game.ok(p.x+dx*step*t,p.y+dy*step*t)))queue.push({x,y});
   }
  }
  return points;
 }
 function begin(){
  game.reset();active=true;finished=false;bag=[];hp=100;hold=0;lastMagic=0;started=performance.now();
  result.style.display='none';hud.style.display='block';button.textContent='重新开始搜打撤';
  document.getElementById('ws').nextElementSibling.hidden=true;
  for(const id of ['ws','hs'])document.getElementById(id).hidden=true;
  // hidden 属性会被 .sw 的 display 覆盖，明确锁住试玩页的装备选择器。
  for(const id of ['ws','hs'])document.getElementById(id).style.display='none';
  const points=reachable(),used=[];
  function pick(min,max,spacing){
   const candidates=points.filter(p=>{const d=distance(p,game.hero);return d>=min&&d<=max&&used.every(q=>distance(p,q)>spacing)});
   const p=candidates[Math.random()*candidates.length|0];
   if(!p)throw new Error('地图连通区域不足以放置搜打撤目标');
   used.push(p);return {...p};
  }
  chests=Array.from({length:12},(_,i)=>({...pick(i===0?40:65,i===0?85:600,32),tier:i%3,opened:false}));
  exits=Array.from({length:3},()=>pick(100,460,70));
  hud.textContent='武器：无 · 靠近彩色宝箱自动开启\n绿色圆圈内静止 4 秒撤离；WASD / 方向键移动';
 }
 button.onclick=begin;
 function finish(success,reason){
  finished=true;hold=0;hud.style.display='none';
  if(!success){bag=[];game.equip('none')}
  result.replaceChildren();
  const panel=document.createElement('div'),title=document.createElement('h2'),summary=document.createElement('p'),retry=document.createElement('button');
  title.textContent=success?'撤离成功':'撤离失败';
  summary.style.cssText='color:white;white-space:pre-line;margin:16px';
  summary.textContent=reason+'\n击杀数：'+game.kills+'\n带出的武器：'+(bag.length?bag.map(w=>names[w]).join('、'):'无');
  retry.textContent='再来一局';retry.style.cssText='font:inherit;padding:10px 24px;cursor:pointer';retry.onclick=begin;
  panel.append(title,summary,retry);result.append(panel);result.style.display='flex';
 }
 function update(dt,now,moving){
  if(!active||finished)return;
  const elapsed=(now-started)/1000,remaining=Math.max(0,480-elapsed);
  if(remaining<=0){finish(false,'八分钟已到，未能撤离');return}
  for(const box of chests)if(!box.opened&&distance(box,game.hero)<20){
   box.opened=true;
   const options=[['short'],['long','bow'],['xbow','magic']][box.tier],weapon=options[Math.random()*options.length|0];
   if(!bag.includes(weapon))bag.push(weapon);game.equip(weapon);
  }
  // 沿用原有黄巾；目标数量与移速持续增加，数量封顶以保持原版两两避让开销可控。
  const target=Math.min(100,8+Math.floor(elapsed/6));
  for(let attempts=0;game.enemies.length<target&&attempts<target;attempts++)game.spawn();
  const touching=game.enemies.some(e=>!e.dead&&distance(e,game.hero)<17);
  if(touching)hp=Math.max(0,hp-10*dt);
  if(hp<=0){finish(false,'被黄巾击杀，全部装备已丢失');return}
  if(game.weapon==='magic'&&now-lastMagic>850){
   lastMagic=now;
   for(const e of game.enemies)if(!e.dead&&distance(e,game.hero)<100)game.hit(e,now);
  }
  const inside=exits.some(p=>distance(p,game.hero)<23);
  hold=inside&&!moving?Math.min(4,hold+dt):0;
  if(hold>=4){finish(true,'已安全带出本局搜集的武器');return}
  const nearest=exits.reduce((a,b)=>distance(a,game.hero)<distance(b,game.hero)?a:b);
  hud.textContent=`搜打撤 · ${Math.floor(remaining/60)}:${String(Math.floor(remaining%60)).padStart(2,'0')} · 生命 ${Math.ceil(hp)} · 武器：${names[game.weapon]}\n宝箱 ${chests.filter(b=>b.opened).length}/12 · 灰低 / 蓝中 / 紫高 · 自动开箱\n${inside?'静止撤离 '+Math.floor(hold/4*100)+'%（4 秒）':'最近撤离点：'+nearest.x+','+nearest.y+' · 小地图绿点'} · 失败丢失全部装备`;
 }
 function draw(c,cx,cy){
  if(!active)return;
  c.save();c.lineWidth=2;c.font='9px system-ui';c.textAlign='center';
  for(const p of exits){
   const x=p.x-cx,y=p.y-cy;c.strokeStyle='#70ffb0';c.fillStyle='#42ef8b25';
   c.beginPath();c.arc(x,y,23,0,Math.PI*2);c.fill();c.stroke();
   c.fillStyle='#e0ffe9';c.fillText('撤离',x,y-27);
   if(hold&&distance(p,game.hero)<23){c.strokeStyle='#fff';c.lineWidth=4;c.beginPath();c.arc(x,y,23,-Math.PI/2,-Math.PI/2+Math.PI*2*hold/4);c.stroke();c.lineWidth=2}
  }
  for(const b of chests){const x=b.x-cx,y=b.y-cy;c.globalAlpha=b.opened?.3:1;c.fillStyle=colors[b.tier];c.fillRect(x-7,y-10,14,10);c.strokeStyle='#17271e';c.strokeRect(x-7,y-10,14,10);c.fillStyle='#fff';c.fillRect(x-1,y-7,2,3)}
  c.restore();
 }
 function minimap(c,k){if(!active)return;c.save();for(const p of exits){c.fillStyle='#70ffb0';c.beginPath();c.arc(p.x*k,p.y*k,2.5,0,7);c.fill()}for(const b of chests)if(!b.opened){c.fillStyle=colors[b.tier];c.fillRect(b.x*k-1,b.y*k-1,2,2)}c.restore()}
 return {get active(){return active},get finished(){return finished},get speed(){return active?1+(performance.now()-started)/480000*1.8:1},update,draw,minimap};
}
