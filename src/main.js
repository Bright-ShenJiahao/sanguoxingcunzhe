
const [W,CH]=await Promise.all(['data/world.json','data/characters.json'].map(u=>fetch(u).then(r=>r.json())));
const D={...W,...CH,ground:'assets/map/ground_grass.jpg',ground2:'assets/map/ground_mud.jpg',coll:'assets/map/coll.png',
 spr:Object.fromEntries(Object.keys(W.size).map(k=>[k,'assets/map/sprites/'+k+'.png']))};
const cv=document.getElementById('cv'),c=cv.getContext('2d'),VW=480,VH=300,WW=D.WW,HD=D.HD;
const $=id=>document.getElementById(id);
const keys={};let joy=null;
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=1;if(e.key.startsWith('Arrow'))e.preventDefault()});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=0});
const st=$('st');
st.addEventListener('pointerdown',e=>{st.setPointerCapture(e.pointerId);joy={x:e.clientX,y:e.clientY,dx:0,dy:0}});
st.addEventListener('pointermove',e=>{if(joy){joy.dx=e.clientX-joy.x;joy.dy=e.clientY-joy.y}});
['pointerup','pointercancel'].forEach(n=>st.addEventListener(n,()=>joy=null));
const ov={sh:false,cld:true,fp:true,mist:false};
const IM={};let left=0;
function ld(k,s){left++;const i=new Image();i.onload=()=>{IM[k]=i;if(--left==0)start()};i.src=s}
D.hb.forEach((u,i)=>ld('hb_'+i,u));for(const k in D.wp)ld('wp_'+k,D.wp[k]);ld('ground',D.ground);ld('ground2',D.ground2);ld('coll',D.coll);
for(const k in D.spr)ld('s_'+k,D.spr[k]);
for(const cl of ['base','one'])D.hf[cl].forEach((u,i)=>ld('hf_'+cl+'_'+i,u));for(const k in D.en2)ld('e_'+k,D.en2[k]);ld('wpn',D.wpn2);
let CM,GK='ground',mmc={},IM2={},heroM='A',wpm='none';const R=D.coll_r;
const objs=D.objs.map(([k,x,y])=>({k,x,y,a:1,w:D.size[k][0],h:D.size[k][1],r:R[k]||0}));
const hero={x:WW/2,y:WW/2,face:1};const CO=objs.filter(o=>o.r);
function water(x,y){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=WW||y>=WW)return 1;return CM[(y*WW+x)*4]}
function blocked(x,y){
 if(water(x,y)===1||water(x-3,y)===1||water(x+3,y)===1||water(x,y-2)===1)return true;
 for(const o of CO){const dx=x-o.x,dy=(y-o.y)*1.3;if(dx*dx+dy*dy<(o.r+3)*(o.r+3))return true}return false}
const ok=(x,y)=>!blocked(x,y);
/* 阴影轮廓缓存：把精灵的透明度剪成深青色 */
const SIL=new WeakMap();
function sil(im){let s=SIL.get(im);if(s)return s;s=document.createElement('canvas');s.width=im.width;s.height=im.height;const x=s.getContext('2d');x.drawImage(im,0,0);x.globalCompositeOperation='source-in';x.fillStyle='rgb(18,40,20)';x.fillRect(0,0,s.width,s.height);SIL.set(im,s);return s}
const SSH=new WeakMap();
function sshadow(im){let s=SSH.get(im);if(s)return s;const W=im.width,H=im.height,pad=14,kx=Math.abs(SH[0]),cw=Math.ceil(W+kx*H+pad*2),ch=Math.ceil(SH[1]*H+pad*2),x0=pad+(SH[0]<0?W/2:W/2+kx*H);
 const cv2_=document.createElement('canvas');cv2_.width=cw;cv2_.height=ch;const x=cv2_.getContext('2d');x.filter='blur(4px)';x.translate(x0,pad);x.transform(1,0,SH[0],-SH[1],0,0);x.drawImage(sil(im),-W/2,-H);
 s={cv:cv2_,x0,y0:pad};SSH.set(im,s);return s}
/* 小兵 */
const S=D.hmeta.S,HC=D.hmeta.classes,WP=D.hmeta.weapon,L0=27;
const RF={0:[22,43.6],1:[21.5,43.6],4:[20,41.7],5:[22.7,42],6:[20,43.6],7:[20,42]},REST=[-0.2,-0.98];
const MOVES=['劈','横扫','撩'];let mvI=0,atk=null,nextAtk=0,swoosh=[];
function startAtk(face){const mv=MOVES[mvI++%3],ix=HC.one.moves[mv],sp=WP.speed;
 atk={mv,face,k:0,t:0,hit:false,prev:null,steps:[{i:ix[0],d:170*sp},{i:ix[1],d:70*sp},{i:ix[2],d:260*sp}]};hero.face=face}
function geom(cls,idx,isAtk){const cl=HC[cls];let d,fists;
 if(isAtk){const m=cl.frames[idx];d=m.d;fists=m.fists.length?m.fists:[[cl.cell[0]*.62,cl.cell[1]*.55]]}else{fists=[RF[idx]||RF[0]];d=REST}
 const ax=fists.reduce((q,p)=>q+p[0],0)/fists.length,ay=fists.reduce((q,p)=>q+p[1],0)/fists.length;
 const tail=[ax-d[0]*WP.grip*L0,ay-d[1]*WP.grip*L0],head=[tail[0]+d[0]*L0,tail[1]+d[1]*L0];
 return{cl,d,fists,tail,head,sy:L0/WP.h}}
const loc=(p,cl)=>[(p[0]-cl.feet[0])*S,(p[1]-cl.feet[1])*S];
const SH=[-.5,.26]; // 影子：向右下投射
function drawHero(px,py,moving,now,shadowOnly){
 if(heroM!='A'&&!atk){if(shadowOnly)return;const f=moving?[2,3,4,5][Math.floor(now/150)%4]:Math.floor(now/650)%2,im=IM['hb_'+f],[w,h]=D.hbsize;c.save();c.translate(px,py);c.scale(hero.face,1);c.imageSmoothingEnabled=false;
 const RH=[[3.1,35.6],[3.5,35],[2.75,35],[2.6,34.4],[2.9,33.5],[3.1,33.5]],FH=[[23.1,35.6],[22,35.5],[26,32.5],[25.7,30.6],[24.7,31.5],[27.5,31.5]],tl=p=>[(p[0]-15)/2,(p[1]-50)/2];
 const wi=IM['wp_'+wpm];
 if(wpm=='long'){c.save();c.translate(-3,-12);c.rotate(-.5);c.scale(.5,.5);c.drawImage(wi,-wi.width/2,-wi.height/2);c.restore()}
 c.drawImage(im,-w/2,-h,w,h);
 if(wpm=='short'){const p=tl(RH[f]);c.save();c.translate(p[0],p[1]);c.rotate(.62);c.scale(.5,.5);c.drawImage(wi,-3.04,-28*.85);c.restore()}
 if(wpm=='bow'){const p=tl(FH[f]);c.save();c.translate(p[0]+.5,p[1]-.5);c.scale(-.5,.5);c.drawImage(wi,-wi.width/2,-wi.height/2);c.restore()}
 if(wpm=='magic'){const bob=Math.sin(now/380)*1.3;c.save();c.translate(-11,-19+bob);c.scale(.5,.5);c.globalAlpha=.97;c.drawImage(wi,-wi.width/2,-wi.height/2);c.restore()}
 c.restore();return}
 let cls='base',idx,isAtk=false;
 if(atk){cls='one';idx=atk.steps[atk.k].i;isAtk=true}else idx=moving?[4,5,6,7][Math.floor(now/150)%4]:Math.floor(now/650)%2;
 const g=geom(cls,idx,isAtk),cl=g.cl,img=IM['hf_'+cls+'_'+idx],wi=IM.wpn;
 const face=isAtk?atk.face:hero.face,ox=Math.round(-cl.feet[0]*S),oy=Math.round(-cl.feet[1]*S);
 if(shadowOnly){c.save();c.translate(px,py);c.transform(1,0,SH[0],-SH[1],0,0);c.scale(face,1);c.globalAlpha=.26;c.drawImage(sil(img),ox,oy);c.restore();return}
 c.save();c.translate(px,py);c.scale(face,1);
 c.drawImage(img,ox,oy);
 const th=Math.atan2(g.d[1],g.d[0])+Math.PI/2;let best=null;
 for(const mir of[1,-1]){const sx=mir*WP.side,vx=sx*Math.cos(th),vy=sx*Math.sin(th),sc=isAtk?(-vy+.4*vx):(vx+.01*(-vy));if(!best||sc>best.sc)best={sc,mir}}
 const t=loc(g.tail,cl);c.save();c.translate(t[0],t[1]);c.rotate(th);c.scale(best.mir*g.sy,g.sy);c.drawImage(wi,-WP.sx*S,-WP.h*S);c.restore();
 for(const f of g.fists){const s=loc(f,cl);c.save();c.beginPath();c.arc(s[0],s[1],4.2*S,0,7);c.clip();c.drawImage(img,ox,oy);c.restore()}
 c.restore();
 return{g,cl,face}}
const KINDS=['grunt','grunt','blade','spear','archer','shield'];
const en=[];let kills=0,fx=[];
function spawn(){for(let n=0;n<30;n++){const a=Math.random()*6.28,r=150+Math.random()*90,x=hero.x+Math.cos(a)*r,y=hero.y+Math.sin(a)*r;
 if(x<30||y<30||x>WW-30||y>WW-30||!ok(x,y))continue;const k=KINDS[Math.random()*KINDS.length|0];en.push({k,x,y,sp:(.32+Math.random()*.2)*(k=='shield'?.8:1),face:1,ph:Math.random()*9});return}}
let last=0,mm,rip=[],fp=[],fpl={x:0,y:0},fpside=1,cloud;
function mkCloud(){const n=96,g=[];for(let i=0;i<64;i++)g.push(Math.random());const v=(x,y)=>{const fx=x/n*8,fy=y/n*8,x0=Math.floor(fx),y0=Math.floor(fy),tx=fx-x0,ty=fy-y0,s=t=>t*t*(3-2*t),q=(a,b)=>g[((b%8+8)%8)*8+((a%8+8)%8)];const a=q(x0,y0)*(1-s(tx))+q(x0+1,y0)*s(tx),b=q(x0,y0+1)*(1-s(tx))+q(x0+1,y0+1)*s(tx);return a*(1-s(ty))+b*s(ty)};
 cloud=document.createElement('canvas');cloud.width=n;cloud.height=n;const x=cloud.getContext('2d'),im=x.createImageData(n,n);for(let j=0;j<n;j++)for(let i=0;i<n;i++){const val=v(i,j)*.7+v(i*2,j*2)*.3,a=Math.max(0,Math.min(1,(val-.5)/.22))*.26;const k=(j*n+i)*4;im.data[k]=18;im.data[k+1]=40;im.data[k+2]=28;im.data[k+3]=a*255}x.putImageData(im,0,0)}
function tintSet(){if(IM2.done)return;IM2.done=1;for(const k in D.spr){const im=IM['s_'+k],t=document.createElement('canvas');t.width=im.width;t.height=im.height;const x=t.getContext('2d');x.filter='saturate(.58) brightness(.86) sepia(.16) hue-rotate(-6deg)';x.drawImage(im,0,0);IM2['s_'+k]=t}}
const SPR=k=>(GK=='ground2'&&IM2[k])||IM[k];
function start(){const t=document.createElement('canvas');t.width=WW;t.height=WW;const x=t.getContext('2d');x.drawImage(IM.coll,0,0);CM=x.getImageData(0,0,WW,WW).data;
 for(const g of['ground','ground2']){const m_=document.createElement('canvas');m_.width=84;m_.height=84;m_.getContext('2d').drawImage(IM[g],0,0,84,84);mmc[g]=m_}
 document.querySelectorAll('#ws button').forEach(b=>b.onclick=()=>{wpm=b.dataset.w;if(wpm!='none'&&heroM=='A'){heroM='B';document.querySelectorAll('#hs button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.h=='B'))}document.querySelectorAll('#ws button').forEach(x=>x.setAttribute('aria-pressed',x===b))});
 document.querySelectorAll('#hs button').forEach(b=>b.onclick=()=>{heroM=b.dataset.h;document.querySelectorAll('#hs button').forEach(x=>x.setAttribute('aria-pressed',x===b))});
 document.querySelectorAll('#gs button').forEach(b=>b.onclick=()=>{GK=b.dataset.g;if(GK=='ground2')tintSet();document.querySelectorAll('#gs button').forEach(x=>x.setAttribute('aria-pressed',x===b))});
 document.querySelectorAll('#ovs button').forEach(b=>b.onclick=()=>{const k=b.dataset.o;ov[k]=!ov[k];b.setAttribute('aria-pressed',ov[k])});
 mkCloud();for(let i=0;i<14;i++)spawn();requestAnimationFrame(loop)}
function contact(x,y,w){c.fillStyle='rgba(18,40,20,.2)';c.beginPath();c.ellipse(x,y-1,w*.4,2.2,0,0,6.3);c.fill()}
function loop(now){
 const dt=Math.min(.05,(now-last)/1000||0);last=now;
 c.setTransform(HD,0,0,HD,0,0);
 let dx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),dy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
 if(joy){const L=Math.hypot(joy.dx,joy.dy);if(L>8){dx=joy.dx/L;dy=joy.dy/L}}
 const L=Math.hypot(dx,dy),moving=L>0;if(moving){dx/=L;dy/=L;if(dx&&!atk)hero.face=dx>0?1:-1}
 const inSh=water(hero.x,hero.y)===2;
 const sp=72*dt*(inSh?.55:1)*(atk?.6:1);let nx=Math.min(WW-14,Math.max(14,hero.x+dx*sp)),ny=Math.min(WW-10,Math.max(14,hero.y+dy*sp));
 if(ok(nx,hero.y))hero.x=nx;if(ok(hero.x,ny))hero.y=ny;
 if(inSh&&moving&&Math.random()<dt*7)rip.push({x:hero.x,y:hero.y,t:now});
 for(const e of en){const ax=hero.x-e.x,ay=hero.y-e.y,d=Math.hypot(ax,ay)||1;e.face=ax>0?1:-1;
  const s2=e.sp*(water(e.x,e.y)===2?.6:1)*dt*60;if(d>13){const mx=ax/d*s2,my=ay/d*s2;
   if(ok(e.x+mx,e.y+my)){e.x+=mx;e.y+=my}else if(ok(e.x+mx,e.y)){e.x+=mx}else if(ok(e.x,e.y+my)){e.y+=my}else{const sx=-my*1.6,sy=mx*1.6;if(ok(e.x+sx,e.y+sy)){e.x+=sx;e.y+=sy}}}}
 for(let i=0;i<en.length;i++)for(let j=i+1;j<en.length;j++){const a=en[i],b=en[j],ddx=b.x-a.x,ddy=b.y-a.y,d=Math.hypot(ddx,ddy);if(d>0&&d<10){const f=(10-d)/24;if(ok(a.x-ddx/d*f,a.y-ddy/d*f)){a.x-=ddx/d*f;a.y-=ddy/d*f}if(ok(b.x+ddx/d*f,b.y+ddy/d*f)){b.x+=ddx/d*f;b.y+=ddy/d*f}}}
 if(!atk&&now>nextAtk){let best=null,bd=46;for(const e of en){const d=Math.hypot(e.x-hero.x,e.y-hero.y);if(d<bd){bd=d;best=e}}if(best)startAtk(best.x>=hero.x?1:-1)}
 if(atk){atk.t+=dt*1000;const stp=atk.steps[atk.k];if(atk.t>=stp.d){atk.t=0;atk.k++;atk.prev=null;if(atk.k>=3){atk=null;nextAtk=now+160}}}
 if(atk&&atk.k===2&&!atk.hit){atk.hit=true;for(const e of en){const ex=(e.x-hero.x)*atk.face,ey=e.y-hero.y;if(ex>-6&&ex<34&&Math.abs(ey)<18){e.dead=1;fx.push({x:e.x,y:e.y,t:now,dx:atk.face})}}}
 for(let i=en.length-1;i>=0;i--)if(en[i].dead){en.splice(i,1);kills++;spawn()}
 while(en.length<16)spawn();
 $('kc').textContent='斩敌 '+kills;
 const cx=Math.round(Math.min(WW-VW,Math.max(0,hero.x-VW/2))),cy=Math.round(Math.min(WW-VH,Math.max(0,hero.y-VH/2)));
 c.imageSmoothingEnabled=true;
 c.drawImage(IM[GK],cx*HD,cy*HD,VW*HD,VH*HD,0,0,VW,VH);
 const px=Math.round(hero.x-cx),py=Math.round(hero.y-cy);
 if(ov.fp){if(moving&&!inSh&&Math.hypot(hero.x-fpl.x,hero.y-fpl.y)>7){fpl={x:hero.x,y:hero.y};fp.push({x:hero.x+fpside*2.2,y:hero.y,t:now});fpside=-fpside}
  fp=fp.filter(f=>now-f.t<5200);for(const f of fp){const a=1-(now-f.t)/5200;c.fillStyle=`rgba(30,20,12,${(GK=='ground2'?.34:.16)*a})`;c.beginPath();c.ellipse(f.x-cx,f.y-cy-1,1.7,1,0,0,6.3);c.fill()}}
 rip=rip.filter(r=>now-r.t<520);for(const r of rip){const k=(now-r.t)/520;c.strokeStyle=`rgba(250,252,250,${.9*(1-k)})`;c.lineWidth=.8;c.beginPath();c.ellipse(r.x-cx,r.y-cy-1,3+k*9,1.5+k*4,0,0,6.3);c.stroke()}
 // 长影子：先画所有影子，再画实体
 if(ov.sh){
  for(const o of objs){const sx=o.x-cx,sy=o.y-cy;if(sx<-120||sx>VW+120||sy<-20||sy>VH+160)continue;const im=IM['s_'+o.k];
   if(o.k.startsWith('tuft')||o.k.startsWith('flow')||o.k.startsWith('dry'))continue;const q=sshadow(im);c.globalAlpha=o.k.startsWith('bush')?.30:o.k.startsWith('stone')?.28:.36;c.drawImage(q.cv,sx-q.x0/HD,sy-q.y0/HD,q.cv.width/HD,q.cv.height/HD)}
  c.globalAlpha=1;
  for(const e of en){const sx=e.x-cx,sy=e.y-cy;if(sx<-30||sx>VW+30||sy<-10||sy>VH+40)continue;const [w,h]=D.esize2[e.k],im=IM['e_'+e.k];
   c.save();c.translate(Math.round(sx),Math.round(sy));c.transform(1,0,SH[0],-SH[1],0,0);c.scale(e.face,1);c.globalAlpha=.26;c.imageSmoothingEnabled=false;c.drawImage(sil(im),-Math.floor(w/2),-h);c.restore()}
  c.imageSmoothingEnabled=true;drawHero(px,py,moving,now,true)}
 else{contact(px,py,16)}
 const items=[];
 for(const o of objs){const sx=o.x-cx,sy=o.y-cy;if(sx<-60||sx>VW+60||sy<-10||sy>VH+100)continue;
  const inx=Math.abs(hero.x-o.x)<o.w*.4,iny=hero.y<o.y-2&&hero.y>o.y-o.h*.9;const fade=/^(broad|pine|spire|bushL)/.test(o.k);const ta=(fade&&inx&&iny)?.42:1;
  o.a+=(ta-o.a)*Math.min(1,dt*10);
  items.push({y:o.y,f:()=>{c.imageSmoothingEnabled=true;c.globalAlpha=o.a;c.drawImage(SPR('s_'+o.k),sx-o.w/2,sy-o.h,o.w,o.h);c.globalAlpha=1}})}
 for(const e of en){const sx=e.x-cx,sy=e.y-cy;if(sx<-30||sx>VW+30||sy<-10||sy>VH+40)continue;const [w,h]=D.esize2[e.k];items.push({y:e.y,f:()=>{const x=Math.round(sx),y=Math.round(sy);if(!ov.sh)contact(x,y,w);const bob=Math.floor(now/180+e.ph)%2;c.save();c.imageSmoothingEnabled=false;c.translate(x,y-bob);if(e.face<0)c.scale(-1,1);c.drawImage(IM['e_'+e.k],-Math.floor(w/2),-h);c.restore();if(water(e.x,e.y)===2){c.fillStyle='rgba(200,228,232,.6)';c.fillRect(x-7,y-4,14,4)}}})}
 let hinfo=null;
 items.push({y:hero.y,f:()=>{c.imageSmoothingEnabled=false;hinfo=drawHero(px,py,moving,now,false);if(inSh){c.fillStyle='rgba(200,228,232,.6)';c.fillRect(px-7,py-4,14,4)}}});
 items.sort((a,b)=>a.y-b.y).forEach(o=>o.f());
 c.imageSmoothingEnabled=true;
 if(ov.cld){c.save();const T=640,dr=now*.011;const ox0=(((-cx+dr)%T)+T)%T,oy0=(((-cy+dr*.45)%T)+T)%T;for(let x=ox0-T;x<VW;x+=T)for(let y=oy0-T;y<VH;y+=T)c.drawImage(cloud,x,y,T,T);c.restore()}
 if(atk&&hinfo){const g=hinfo.g,a0=[g.tail[0]+g.d[0]*L0*.35,g.tail[1]+g.d[1]*L0*.35],cl=hinfo.cl;
  const A=loc(a0,cl),T2=loc(g.head,cl),w=(p)=>[hero.x+hinfo.face*p[0],hero.y+p[1]];
  const curv={a:w(A),t:w(T2)};
  if(atk.prev&&atk.prev.k!==atk.k&&atk.k>=1)swoosh.push({p:atk.prev.v,c:curv,t0:now});
  if(!atk.prev||atk.prev.k!==atk.k)atk.prev={k:atk.k,v:curv}}
 swoosh=swoosh.filter(s=>now-s.t0<210);
 for(const s of swoosh){const a=1-(now-s.t0)/210;c.fillStyle=`rgba(255,255,250,${.55*a})`;c.beginPath();c.moveTo(s.p.a[0]-cx,s.p.a[1]-cy);c.lineTo(s.p.t[0]-cx,s.p.t[1]-cy);c.lineTo(s.c.t[0]-cx,s.c.t[1]-cy);c.lineTo(s.c.a[0]-cx,s.c.a[1]-cy);c.closePath();c.fill();
  c.strokeStyle=`rgba(255,255,255,${.9*a})`;c.lineWidth=1;c.beginPath();c.moveTo(s.p.t[0]-cx,s.p.t[1]-cy);c.lineTo(s.c.t[0]-cx,s.c.t[1]-cy);c.stroke()}
 fx=fx.filter(f=>now-f.t<220);for(const f of fx){const k=(now-f.t)/220;c.strokeStyle=`rgba(255,255,245,${1-k})`;c.lineWidth=1;c.beginPath();c.arc(f.x-cx+f.dx*k*10,f.y-cy-10,3+k*9,0,6.3);c.stroke()}
 if(ov.mist){const E=70;function fog(x0,y0,x1,y1,rx,ry,rw,rh){const g=c.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,'rgba(214,230,214,.94)');g.addColorStop(1,'rgba(214,230,214,0)');c.fillStyle=g;c.fillRect(rx,ry,rw,rh)}
  if(cx<E)fog(-cx,0,-cx+E,0,0,0,E-cx,VH);if(cx>WW-VW-E)fog(WW-cx,0,WW-cx-E,0,WW-cx-E,0,E,VH);
  if(cy<E)fog(0,-cy,0,-cy+E,0,0,VW,E-cy);if(cy>WW-VH-E)fog(0,WW-cy,0,WW-cy-E,0,WW-cy-E,VW,E)}
 if(ov.mist){const g=c.createLinearGradient(0,0,0,VH*.5);g.addColorStop(0,'rgba(206,226,214,.30)');g.addColorStop(1,'rgba(206,226,214,0)');c.fillStyle=g;c.fillRect(0,0,VW,VH*.5)}
 const m=$('mm').getContext('2d'),k=84/WW;m.drawImage(mmc[GK],0,0);m.strokeStyle='#fff';m.strokeRect(cx*k,cy*k,VW*k,VH*k);m.fillStyle='#fff';m.fillRect(hero.x*k-1.5,hero.y*k-1.5,3,3);
 $('pos').textContent='位置 '+Math.round(hero.x)+', '+Math.round(hero.y)+(inSh?' · 正在涉水（速度×0.55）':'')+(atk?' · 出招：'+atk.mv:'')+' · 逻辑画布 480×300，输出 960×600，主角高约 25 像素';
 requestAnimationFrame(loop)}
