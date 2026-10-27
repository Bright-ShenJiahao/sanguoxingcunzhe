// 黄巾兵：动作、受击、死亡与弓箭；玩家与搜打撤规则由调用方接收命中事件。
export function createEnemies({data,images,hero,ok,water,onHit}){
 const kinds=Object.keys(data),arrows=[];
 let bag=[],extractContact=false;
 function nextKind(){
  if(!bag.length){bag=[...kinds];for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]]}}
  return bag.pop();
 }
 function make(x,y){const k=nextKind();return {k,x,y,face:1,hp:data[k].hp,state:'move',timer:0,cooldown:Math.random()*.8,ph:Math.random()*9,dead:false}}
 function hit(e){
  if(e.dead)return false;
  e.hp--;
  if(e.hp<=0){e.dead=true;e.state='fall';e.timer=0;e.alpha=1}
  else{e.state='hurt';e.timer=0;e.cooldown=.25}
  return true;
 }
 function reset(){arrows.length=0;extractContact=false}
 function update(en,dt,speed){
  extractContact=false;
  for(const e of en){
   const stats=data[e.k];e.timer+=dt;e.moving=false;
   if(e.dead){
    if(e.state==='fall'&&e.timer>=.4){e.state='down';e.timer=0}
    else if(e.state==='down'){e.alpha=Math.max(0,1-Math.max(0,e.timer-.55)/.8);if(e.timer>=1.35)e.expired=true}
    continue;
   }
   const ax=hero.x-e.x,ay=hero.y-e.y,d=Math.hypot(ax,ay)||1;e.face=ax>=0?1:-1;
   if(e.state==='hurt'){if(e.timer>=.25){e.state='move';e.timer=0}continue}
   if(e.state==='windup'){
    if(e.timer>=.45){
     e.state='strike';e.timer=0;
     if(e.k==='archer'){
      const len=Math.hypot(ax,ay)||1;
      arrows.push({x:e.x,y:e.y-10,dx:ax/len,dy:ay/len,life:1.6});
     }else if(d<=stats.reach+5){onHit(stats.damage);extractContact=true}
    }
   }else if(e.state==='strike'){
    // 搜打撤沿用原本按时间扣血的接口，仅在可命中的打击帧开启。
    if(e.k!=='archer'&&d<=stats.reach+5)extractContact=true;
    if(e.timer>=.2){e.state='recover';e.timer=0}
   }else if(e.state==='recover'){
    if(e.timer>=.45){e.state='move';e.timer=0;e.cooldown=.55+Math.random()*.35}
   }else{
    e.cooldown=Math.max(0,e.cooldown-dt);
    if(d<=stats.reach&&e.cooldown===0){e.state='windup';e.timer=0;continue}
    if(d>stats.reach*.85){
     const oldx=e.x,oldy=e.y,dist=stats.speed*(water(e.x,e.y)===2?.6:1)*dt*speed,mx=ax/d*dist,my=ay/d*dist;
     if(ok(e.x+mx,e.y+my)){e.x+=mx;e.y+=my}else if(ok(e.x+mx,e.y)){e.x+=mx}else if(ok(e.x,e.y+my)){e.y+=my}
     else if(ok(e.x-my*1.6,e.y+mx*1.6)){e.x-=my*1.6;e.y+=mx*1.6}
     e.moving=e.x!==oldx||e.y!==oldy;
    }
   }
  }
  for(let i=arrows.length-1;i>=0;i--){
   const p=arrows[i],oldx=p.x,oldy=p.y;p.x+=p.dx*145*dt;p.y+=p.dy*145*dt;p.life-=dt;
   const vx=p.x-oldx,vy=p.y-oldy,v2=vx*vx+vy*vy;
   const t=v2?Math.max(0,Math.min(1,((hero.x-oldx)*vx+(hero.y-10-oldy)*vy)/v2)):0;
   if(Math.hypot(oldx+vx*t-hero.x,oldy+vy*t-(hero.y-10))<8){onHit(data.archer.damage);extractContact=true;arrows.splice(i,1)}
   else if(p.life<=0||!ok(p.x,p.y+10))arrows.splice(i,1);
  }
 }
 function frame(e,now){
  let name=e.state;
  if(name==='move')name=e.moving?'walk'+(Math.floor(now/110+e.ph)%6):'idle'+(Math.floor(now/650)%2);
  if(name==='recover'&&e.k==='archer')name='idle0';
  return data[e.k].frames[name];
 }
 function getFrame(e,now){const f=frame(e,now),name=Object.keys(data[e.k].frames).find(key=>data[e.k].frames[key]===f);return {f,im:images['en_'+e.k+'_'+name]}}
 function draw(e,c,cx,cy,now){
  const {f,im}=getFrame(e,now);
  c.save();c.translate(Math.round(e.x-cx),Math.round(e.y-cy));c.scale(e.face,1);c.globalAlpha=e.alpha??1;c.imageSmoothingEnabled=false;
  c.drawImage(im,-f.anchor[0],-f.anchor[1],f.size[0],f.size[1]);c.restore();
 }
 function drawArrows(c,cx,cy){
  const f=data.archer.frames.arrow,im=images.en_archer_arrow;
  for(const p of arrows){c.save();c.translate(p.x-cx,p.y-cy);c.rotate(Math.atan2(p.dy,p.dx));c.imageSmoothingEnabled=false;c.drawImage(im,-f.size[0]/2,-f.size[1]/2,f.size[0],f.size[1]);c.restore()}
 }
 return {make,hit,update,reset,draw,drawArrows,getFrame,get extractContact(){return extractContact}};
}
