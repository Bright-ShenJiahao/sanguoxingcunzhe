// 全局天气：晴 / 阴 / 雨 / 雪 / 雾，随时间渐变轮换。测试可用网址 ?weather=rain|snow|fog|overcast 固定。
const R=(a,b)=>a+Math.random()*(b-a);
export function createWeather(){
 const q=new URLSearchParams(location.search).get('weather');
 const forced=['rain','snow','fog','overcast'].includes(q)?q:null;
 let kind=forced||'clear',inten=0,target=forced?1:0,next=null;
 const rain=[],snow=[],splash=[];
 function pick(){const w=[['rain',.35],['snow',.25],['fog',.25],['overcast',.15]].filter(x=>x[0]!==kind);let s=w.reduce((a,x)=>a+x[1],0),r=Math.random()*s;for(const x of w){if((r-=x[1])<=0)return x[0]}return w[0][0]}
 function update(dt,now){
  if(!forced){
   if(next==null)next=now+R(20000,35000);
   if(kind==='clear'){if(now>=next){kind=pick();target=1;next=now+R(30000,50000)}}
   else if(now>=next){target=0;if(inten<=.01){kind='clear';inten=0;next=now+R(25000,45000)}}
  }
  const d=target-inten;inten+=Math.sign(d)*Math.min(Math.abs(d),dt*.5)}
 function draw(c,now,dt,VW,VH){
  update(dt,now);if(inten<.01)return;const i=inten;c.save();
  if(kind==='overcast'){c.fillStyle=`rgba(40,52,72,${.2*i})`;c.fillRect(0,0,VW,VH)}
  else if(kind==='rain'){
   c.fillStyle=`rgba(30,48,82,${.38*i})`;c.fillRect(0,0,VW,VH);
   const N=Math.floor(320*i),wind=-55;while(rain.length<320)rain.push({x:R(0,VW),y:R(0,VH),v:R(260,340),l:R(5,9)});
   c.strokeStyle=`rgba(210,226,248,${.7*i})`;c.lineWidth=1;c.beginPath();
   for(let k=0;k<rain.length;k++){const p=rain[k];p.y+=p.v*dt;p.x+=wind*dt;if(p.y>VH+10){p.y=-10;p.x=R(0,VW+60)}if(p.x<-10)p.x+=VW+20;if(k<N){c.moveTo(p.x,p.y);c.lineTo(p.x+p.l*wind/p.v,p.y+p.l)}}
   c.stroke();
   if(Math.random()<dt*60*i)splash.push({x:R(0,VW),y:R(VH*.25,VH),t:now});
   for(let k=splash.length-1;k>=0;k--){const s=splash[k],a=(now-s.t)/260;if(a>=1){splash.splice(k,1);continue}c.strokeStyle=`rgba(220,235,250,${.6*(1-a)*i})`;c.lineWidth=.7;c.beginPath();c.ellipse(s.x,s.y,1+a*3,.5+a*1.2,0,0,6.3);c.stroke()}
  }else if(kind==='snow'){
   c.fillStyle=`rgba(210,224,242,${.26*i})`;c.fillRect(0,0,VW,VH);
   c.fillStyle=`rgba(244,248,255,${.14*i})`;c.fillRect(0,0,VW,VH);
   const N=Math.floor(260*i);while(snow.length<260)snow.push({x:R(0,VW),y:R(0,VH),v:R(16,34),s:Math.random()<.4?2:1,ph:R(0,6.3)});
   c.fillStyle=`rgba(255,255,255,${.9*i})`;
   for(let k=0;k<snow.length;k++){const p=snow[k];p.y+=p.v*dt;p.x+=(Math.sin(now*.0012+p.ph)*9-5)*dt;if(p.y>VH+4){p.y=-4;p.x=R(0,VW+20)}if(p.x<-4)p.x+=VW+8;if(k<N)c.fillRect(Math.round(p.x),Math.round(p.y),p.s,p.s)}
  }else if(kind==='fog'){
   c.fillStyle=`rgba(200,212,206,${.2*i})`;c.fillRect(0,0,VW,VH);
   for(let k=0;k<6;k++){const x=((now*.006*(1+k*.3)+k*170)%(VW+300))-150,y=(k*53+30)%VH;const g=c.createRadialGradient(x,y,0,x,y,130);g.addColorStop(0,`rgba(222,232,226,${.3*i})`);g.addColorStop(1,'rgba(222,232,226,0)');c.fillStyle=g;c.fillRect(x-130,y-130,260,260)}
   const g=c.createRadialGradient(VW/2,VH/2,55,VW/2,VH/2,Math.hypot(VW,VH)*.52);g.addColorStop(0,'rgba(206,218,212,0)');g.addColorStop(1,`rgba(206,218,212,${.88*i})`);c.fillStyle=g;c.fillRect(0,0,VW,VH);
  }
  c.restore()}
 return {draw,get kind(){return kind},get intensity(){return inten}}}
