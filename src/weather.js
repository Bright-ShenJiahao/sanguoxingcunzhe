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
 // 西部干旱：暖黄色调、飘尘、边缘泛黄
 const dust=[];
 function drawDry(c,now,dt,VW,VH,i){
  c.globalCompositeOperation='multiply';c.fillStyle=`rgba(238,194,116,${.5*i})`;c.fillRect(0,0,VW,VH);c.globalCompositeOperation='source-over';
  const g=c.createLinearGradient(0,0,0,VH);g.addColorStop(0,`rgba(244,214,146,${.2*i})`);g.addColorStop(1,'rgba(244,214,146,0)');c.fillStyle=g;c.fillRect(0,0,VW,VH);
  while(dust.length<110)dust.push({x:R(0,VW),y:R(0,VH),v:R(40,95),s:Math.random()<.25?2:1,ph:R(0,6.3)});
  c.fillStyle=`rgba(226,190,128,${.6*i})`;const N=Math.floor(110*i);
  for(let k=0;k<dust.length;k++){const p=dust[k];p.x+=p.v*dt;p.y+=Math.sin(now*.002+p.ph)*8*dt;if(p.x>VW+4){p.x=-4;p.y=R(0,VH)}if(k<N)c.fillRect(Math.round(p.x),Math.round(p.y),p.s,1)}
  const v=c.createRadialGradient(VW/2,VH/2,80,VW/2,VH/2,Math.hypot(VW,VH)*.55);v.addColorStop(0,'rgba(196,138,54,0)');v.addColorStop(1,`rgba(196,138,54,${.3*i})`);c.fillStyle=v;c.fillRect(0,0,VW,VH)}
 // 北部积雪：画面去色，偏冷白
 function snowGround(c,VW,VH,i){
  c.globalCompositeOperation='saturation';c.fillStyle=`rgba(128,128,128,${.5*i})`;c.fillRect(0,0,VW,VH);c.globalCompositeOperation='source-over'}
 // 区域气候：按主角在地图上的位置（北雪、南雨、西旱、东雾，中间随机天气）
 const NAMES=[['wn','北境·大雪'],['ws','南方·多雨'],['ww','西陲·干旱'],['we','东滨·海雾']];
 let zname='中原',ztime=-1e9,zfirst=true;
 function draw(c,now,dt,VW,VH,hx,hy,WW,WH){
  update(dt,now);
  let wn=0,ws=0,ww=0,we=0;
  if(!forced&&hx!=null){const u=hx/WW,v=hy/(WH||WW),r=a=>Math.max(0,Math.min(1,a)),g=WH?r((v-.45)/.1):1;wn=WH?r((.55-v)/.12):r((.36-v)/.18);ws=WH?r((v-.82)/.1):r((v-.64)/.18);ww=r((.36-u)/.18)*g;we=r((u-.64)/.18)*g;const sm=wn+ws+ww+we;if(sm>1){wn/=sm;ws/=sm;ww/=sm;we/=sm}}
  const wc=1-(wn+ws+ww+we),gi=inten*wc,Z={wn,ws,ww,we};
  // 地区名提示
  let nm='中原';for(const [k,t] of NAMES)if(Z[k]>=.5)nm=t;
  if(nm!==zname){zname=nm;if(!zfirst||nm!=='中原')ztime=now}zfirst=false;
  c.save();
  if(gi>.01&&kind==='overcast'){c.fillStyle=`rgba(40,52,72,${.2*gi})`;c.fillRect(0,0,VW,VH)}
  if(gi>.01&&kind==='fog')drawFog(c,now,VW,VH,gi);
  if(we>.01)drawFog(c,now,VW,VH,we*.8);
  if(ww>.01)drawDry(c,now,dt,VW,VH,ww);
  if(wn>.01)snowGround(c,VW,VH,wn);
  // 降水（雨/雪）同一帧只画一种，避免粒子重复更新
  let pk=null,pi=0,pP=null;
  if(gi>.01&&RAIN[kind]){pk='rain';pi=gi;pP=RAIN[kind]}else if(gi>.01&&SNOW[kind]){pk='snow';pi=gi;pP=SNOW[kind]}
  if(wn>pi){pk='snow';pi=wn;pP=SNOW.heavysnow}
  if(ws*.9>pi){pk='rain';pi=ws*.9;pP=RAIN.heavyrain}
  if(pk==='rain')drawRain(c,now,dt,VW,VH,pi,pP);else if(pk==='snow')drawSnow(c,now,dt,VW,VH,pi,pP);
  // 进入新地区时的名字提示
  const a=now-ztime;if(a<3000){const al=a<300?a/300:a>2300?(3000-a)/700:1;c.globalAlpha=al;c.font='bold 11px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif';c.textAlign='center';c.lineWidth=3;c.strokeStyle='rgba(8,14,24,.85)';c.strokeText(zname,VW/2,30);c.fillStyle='#f7e3a6';c.fillText(zname,VW/2,30)}
  c.restore()}
 return {draw,get kind(){return kind},get intensity(){return inten}}}
