// 全局天气：晴 / 阴 / 小雨 / 大雨 / 小雪 / 大雪 / 雾，随时间渐变轮换。
// 测试用网址：?weather=lightrain | heavyrain | lightsnow | heavysnow | fog | overcast
const R=(a,b)=>a+Math.random()*(b-a);
const RAIN={
 lightrain:{n:170,wind:-20,v:[230,290],len:[5,8],tint:.24,a:.6,lw:.8,splash:14},
 heavyrain:{n:440,wind:-100,v:[340,440],len:[8,14],tint:.5,a:.78,lw:1.1,splash:100}};
const SNOW={
 lightsnow:{n:150,wind:-3,v:[14,26],tint:.22,white:.1,big:.35,haze:0},
 heavysnow:{n:430,wind:-24,v:[32,58],tint:.34,white:.2,big:.5,haze:.3},
 blizzard:{n:800,wind:-90,v:[60,100],tint:.42,white:.3,big:.6,haze:.55}};
const ALL=['lightrain','heavyrain','lightsnow','heavysnow','blizzard','fog','overcast'];
export function createWeather(){
 const q=new URLSearchParams(location.search).get('weather');
 let forced=ALL.includes(q)?q:null;
 let kind=forced||'clear',inten=0,target=forced?1:0,next=null,evReg=null;
 const rain=[],snow=[],splash=[];
 // 各地的随机天气：[天气, 权重]；大部分时间晴天，幽州长时间下雪
 const LOCAL={'幽州·塞外':{p:.5,gap:[30000,60000],dur:[30000,50000],ev:[['blizzard',1]]},
  '北方草原':{p:.45,gap:[40000,80000],dur:[25000,45000],ev:[['wind',.8],['overcast',.2]]},
  '西凉':{p:.45,gap:[40000,80000],dur:[25000,45000],ev:[['sand',.7],['wind',.3]]},
  '翠绿平原':{p:.35,gap:[45000,90000],dur:[25000,45000],ev:[['lightrain',.5],['overcast',.5]]},
  '水乡湿地':{p:.5,gap:[35000,70000],dur:[30000,50000],ev:[['lightrain',.45],['heavyrain',.25],['fog',.3]]},
  '迷雾森林':{p:.55,gap:[35000,70000],dur:[30000,50000],ev:[['fog',.65],['lightrain',.35]]}};
 function pickFrom(ev){let s=ev.reduce((a,x)=>a+x[1],0),r=Math.random()*s;for(const x of ev){if((r-=x[1])<=0)return x[0]}return ev[0][0]}
 function update(dt,now,rg){
  if(!forced){const L=LOCAL[rg]||LOCAL['翠绿平原'];
   if(evReg&&rg!==evReg&&kind!=='clear'){target=0;next=Math.min(next,now)}          // 离开该地区：当地天气慢慢散去
   if(next==null)next=now+R(4000,10000);
   if(kind==='clear'){if(now>=next){if(Math.random()<L.p){kind=pickFrom(L.ev);target=1;evReg=rg;next=now+R(...L.dur)}else next=now+R(...L.gap)}}
   else if(now>=next){target=0;if(inten<=.01){kind='clear';inten=0;evReg=null;next=now+R(...L.gap)}}
  }
  const d=target-inten;inten+=Math.sign(d)*Math.min(Math.abs(d),dt*.4)}
 // 十二时辰：游戏里一天 = 现实 12 分钟（一个时辰 1 分钟），开局在辰时
 const SC=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'],T0=performance.now();
 let H0=Math.max(0,SC.indexOf(new URLSearchParams(location.search).get('hour')||'辰'));   // 测试：?hour=子
 let T0b=T0;function clock(now){return ((now-T0b)/60000+H0)%12}
 function drawTime(c,VW,VH,p){
  const nf=Math.max(0,Math.min(1,(Math.cos(p/12*Math.PI*2)-0.25)/0.75));
  if(nf>0){c.fillStyle=`rgba(12,20,46,${.36*nf})`;c.fillRect(0,0,VW,VH)}
  const wf=Math.exp(-((p-9.4)**2)/0.7)+Math.exp(-((p-3.4)**2)/0.7);
  if(wf>.01){c.fillStyle=`rgba(255,150,70,${.09*wf})`;c.fillRect(0,0,VW,VH)}}
 const wl=[];
 function drawWind(c,now,dt,VW,VH,i){
  while(wl.length<60)wl.push({x:R(0,VW),y:R(0,VH),v:R(160,260),l:R(8,22)});
  c.strokeStyle=`rgba(236,236,220,${.35*i})`;c.lineWidth=.7;c.beginPath();
  for(const p of wl){p.x+=p.v*dt;p.y+=6*dt;if(p.x>VW+30){p.x=-30;p.y=R(0,VH)}c.moveTo(p.x,p.y);c.lineTo(p.x+p.l,p.y+1)}c.stroke()}
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
  const N=Math.floor(P.n*i);while(snow.length<820)snow.push({x:R(0,VW),y:R(0,VH),k:Math.random(),s:Math.random(),ph:R(0,6.3)});
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
 const ZS={wn:0,ws:0,ww:0,we:0},RK={'幽州·塞外':'wn','江南':'ws','西凉':'ww','蜀':'we'};
 let snowBase=0;
 function draw(c,now,dt,VW,VH,hx,hy,WW,WH,rg){
  update(dt,now,rg);
  let nm=rg||'中原';
  if(nm!==zname){zname=nm;if(!zfirst||nm!=='中原')ztime=now}zfirst=false;
  snowBase+=((rg==='幽州·塞外'?1:0)-snowBase)*Math.min(1,dt*1.5);
  const gi=inten,ys=snowBase,wd=rg==='西凉'?.35:0;
  c.save();
  if(gi>.01&&kind==='overcast'){c.fillStyle=`rgba(40,52,72,${.2*gi})`;c.fillRect(0,0,VW,VH)}
  if(gi>.01&&kind==='fog')drawFog(c,now,VW,VH,gi);
  if(wd>0||(gi>.01&&kind==='sand'))drawDry(c,now,dt,VW,VH,Math.max(wd,kind==='sand'?gi:0));
  if(gi>.01&&(kind==='wind'||kind==='sand'))drawWind(c,now,dt,VW,VH,gi);
  if(ys)snowGround(c,VW,VH,ys);
  if(gi>.01&&RAIN[kind])drawRain(c,now,dt,VW,VH,gi,RAIN[kind]);
  else if(gi>.3&&SNOW[kind])drawSnow(c,now,dt,VW,VH,gi,SNOW[kind]);
  else if(ys>.01)drawSnow(c,now,dt,VW,VH,ys,SNOW.heavysnow);          // 幽州平时一直下雪（原来的大雪），暴雪更大
  else if(gi>.01&&SNOW[kind])drawSnow(c,now,dt,VW,VH,gi,SNOW[kind]);
  drawTime(c,VW,VH,clock(now));
  // 进入新地区时的名字提示
  const a=now-ztime;if(a<3000){const al=a<300?a/300:a>2300?(3000-a)/700:1;c.globalAlpha=al;c.font='bold 11px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif';c.textAlign='center';c.lineWidth=3;c.strokeStyle='rgba(8,14,24,.85)';c.strokeText(zname,VW/2,30);c.fillStyle='#f7e3a6';c.fillText(zname,VW/2,30)}
  c.restore()}
 return {draw,get kind(){return kind},get intensity(){return inten},shichen(now){return SC[Math.floor(clock(now))]+'时'},
  force(k){if(k==='auto'){forced=null;kind='clear';inten=0;target=0;next=null}else{forced=k;kind=k;target=1;inten=1}},
  setHour(name){H0=Math.max(0,SC.indexOf(name));T0b=performance.now()},SC}}
