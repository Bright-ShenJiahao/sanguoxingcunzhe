// 全局天气：晴 / 阴 / 小雨 / 大雨 / 小雪 / 大雪 / 雾，随时间渐变轮换。
// 测试用网址：?weather=lightrain | heavyrain | lightsnow | heavysnow | fog | overcast
const R=(a,b)=>a+Math.random()*(b-a);
const RAIN={
 lightrain:{n:170,wind:-20,v:[230,290],len:[5,8],tint:.24,a:.6,lw:.8,splash:14},
 heavyrain:{n:440,wind:-100,v:[340,440],len:[8,14],tint:.5,a:.78,lw:1.1,splash:100}};
const SNOW={
 lightsnow:{n:150,wind:-3,v:[14,26],tint:.22,white:.1,big:.35,haze:0},
 heavysnow:{n:430,wind:-24,v:[32,58],tint:.34,white:.2,big:.5,haze:.3}};
const ALL=['lightrain','heavyrain','lightsnow','heavysnow','fog','overcast'];
export function createWeather(){
 const q=new URLSearchParams(location.search).get('weather');
 const forced=ALL.includes(q)?q:null;
 let kind=forced||'clear',inten=0,target=forced?1:0,next=null;
 const rain=[],snow=[],splash=[];
 function pick(){const w=[['lightrain',.2],['heavyrain',.15],['lightsnow',.15],['heavysnow',.12],['fog',.2],['overcast',.1]].filter(x=>x[0]!==kind);let s=w.reduce((a,x)=>a+x[1],0),r=Math.random()*s;for(const x of w){if((r-=x[1])<=0)return x[0]}return w[0][0]}
 function update(dt,now){
  if(!forced){
   if(next==null)next=now+R(20000,35000);
   if(kind==='clear'){if(now>=next){kind=pick();target=1;next=now+R(30000,50000)}}
   else if(now>=next){target=0;if(inten<=.01){kind='clear';inten=0;next=now+R(25000,45000)}}
  }
  const d=target-inten;inten+=Math.sign(d)*Math.min(Math.abs(d),dt*.5)}
 function drawRain(c,now,dt,VW,VH,i,P){
  c.fillStyle=`rgba(30,48,82,${P.tint*i})`;c.fillRect(0,0,VW,VH);
  const N=Math.floor(P.n*i);while(rain.length<460)rain.push({x:R(0,VW),y:R(0,VH),k:Math.random()});
  c.strokeStyle=`rgba(210,226,248,${P.a*i})`;c.lineWidth=P.lw;c.beginPath();
  for(let k=0;k<rain.length;k++){const p=rain[k],v=P.v[0]+(P.v[1]-P.v[0])*p.k,l=P.len[0]+(P.len[1]-P.len[0])*p.k;
   p.y+=v*dt;p.x+=P.wind*dt;if(p.y>VH+14){p.y=-14;p.x=R(0,VW+80)}if(p.x<-14)p.x+=VW+28;
   if(k<N){c.moveTo(p.x,p.y);c.lineTo(p.x+l*P.wind/v,p.y+l)}}
  c.stroke();
  if(Math.random()<dt*P.splash*i)splash.push({x:R(0,VW),y:R(VH*.25,VH),t:now});
  for(let k=splash.length-1;k>=0;k--){const s=splash[k],a=(now-s.t)/260;if(a>=1){splash.splice(k,1);continue}c.strokeStyle=`rgba(220,235,250,${.6*(1-a)*i})`;c.lineWidth=.7;c.beginPath();c.ellipse(s.x,s.y,1+a*3,.5+a*1.2,0,0,6.3);c.stroke()}}
 function drawSnow(c,now,dt,VW,VH,i,P){
  c.fillStyle=`rgba(210,224,242,${P.tint*i})`;c.fillRect(0,0,VW,VH);
  c.fillStyle=`rgba(244,248,255,${P.white*i})`;c.fillRect(0,0,VW,VH);
  const N=Math.floor(P.n*i);while(snow.length<460)snow.push({x:R(0,VW),y:R(0,VH),k:Math.random(),s:Math.random(),ph:R(0,6.3)});
  c.fillStyle=`rgba(255,255,255,${.92*i})`;
  for(let k=0;k<snow.length;k++){const p=snow[k],v=P.v[0]+(P.v[1]-P.v[0])*p.k;
   p.y+=v*dt;p.x+=(Math.sin(now*.0012+p.ph)*9+P.wind*1.4)*dt;if(p.y>VH+4){p.y=-4;p.x=R(0,VW+40)}if(p.x<-4)p.x+=VW+8;if(p.x>VW+4)p.x-=VW+8;
   if(k<N){const sz=p.s<P.big?2:1;c.fillRect(Math.round(p.x),Math.round(p.y),sz,sz)}}
  if(P.haze){const g=c.createRadialGradient(VW/2,VH/2,70,VW/2,VH/2,Math.hypot(VW,VH)*.55);g.addColorStop(0,'rgba(236,242,250,0)');g.addColorStop(1,`rgba(236,242,250,${P.haze*i})`);c.fillStyle=g;c.fillRect(0,0,VW,VH)}}
 function drawFog(c,now,VW,VH,i){
  c.fillStyle=`rgba(200,212,206,${.2*i})`;c.fillRect(0,0,VW,VH);
  for(let k=0;k<6;k++){const x=((now*.006*(1+k*.3)+k*170)%(VW+300))-150,y=(k*53+30)%VH;const g=c.createRadialGradient(x,y,0,x,y,130);g.addColorStop(0,`rgba(222,232,226,${.3*i})`);g.addColorStop(1,'rgba(222,232,226,0)');c.fillStyle=g;c.fillRect(x-130,y-130,260,260)}
  const g=c.createRadialGradient(VW/2,VH/2,55,VW/2,VH/2,Math.hypot(VW,VH)*.52);g.addColorStop(0,'rgba(206,218,212,0)');g.addColorStop(1,`rgba(206,218,212,${.88*i})`);c.fillStyle=g;c.fillRect(0,0,VW,VH)}
 function draw(c,now,dt,VW,VH){
  update(dt,now);if(inten<.01)return;const i=inten;c.save();
  if(kind==='overcast'){c.fillStyle=`rgba(40,52,72,${.2*i})`;c.fillRect(0,0,VW,VH)}
  else if(RAIN[kind])drawRain(c,now,dt,VW,VH,i,RAIN[kind]);
  else if(SNOW[kind])drawSnow(c,now,dt,VW,VH,i,SNOW[kind]);
  else if(kind==='fog')drawFog(c,now,VW,VH,i);
  c.restore()}
 return {draw,get kind(){return kind},get intensity(){return inten}}}
