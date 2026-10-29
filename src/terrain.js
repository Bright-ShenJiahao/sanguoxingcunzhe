// 高低差：assets/map/level.png（0 山脚、1..3 山的各层、255 坡道）。
// 同层才能近战；远程可以从高处往低处打；怪物在山上用寻路图找坡道。
export function createTerrain(){
 let L=null,W=0,H=0;
 const T={ready:false,
  load(url,ww,wh){W=ww;H=wh;return fetch(url).then(r=>r.ok?r.blob():null).then(b=>{if(!b)return;return createImageBitmap(b)}).then(bm=>{if(!bm)return;
   const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.drawImage(bm,0,0);const d=x.getImageData(0,0,W,H).data;
   L=new Uint8Array(W*H);for(let i=0;i<L.length;i++)L[i]=d[i*4];T.ready=true}).catch(()=>{})},
  lv(x,y){if(!L)return 0;x=x|0;y=y|0;if(x<0||y<0||x>=W||y>=H)return 0;return L[y*W+x]},
  // 近战：同层（坡道算任意层）
  melee(ax,ay,bx,by){const a=T.lv(ax,ay),b=T.lv(bx,by);return a===b||a===255||b===255},
  // 远程：目标不比自己高
  shoot(ax,ay,bx,by){const a=T.lv(ax,ay),b=T.lv(bx,by);return a===255||b===255||b<=a},
 };
 // ---------- 山区寻路图 ----------
 const X0=0,Y0=340,X1=960,Y1=1120,CS=4,GW=(X1-X0)/CS,GH=(Y1-Y0)/CS;
 let dist=null,walk=null,tLast=-1;
 T.inMount=(x,y)=>x>=X0&&x<X1&&y>=Y0&&y<Y1;
 T.flow=function(ok,hx,hy,now){
  if(!walk){walk=new Uint8Array(GW*GH);for(let j=0;j<GH;j++)for(let i=0;i<GW;i++)walk[j*GW+i]=ok(X0+i*CS+2,Y0+j*CS+2)?1:0;dist=new Int32Array(GW*GH)}
  if(now-tLast<350)return;tLast=now;dist.fill(-1);
  let hi=Math.max(0,Math.min(GW-1,((hx-X0)/CS)|0)),hj=Math.max(0,Math.min(GH-1,((hy-Y0)/CS)|0));
  const q=new Int32Array(GW*GH);let qh=0,qt=0;const s=hj*GW+hi;dist[s]=0;q[qt++]=s;
  while(qh<qt){const c=q[qh++],ci=c%GW,cj=(c/GW)|0,dc=dist[c]+1;
   for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ni=ci+di,nj=cj+dj;if(ni<0||nj<0||ni>=GW||nj>=GH)continue;const n=nj*GW+ni;
    if(dist[n]>=0||!walk[n])continue;if(di&&dj&&(!walk[cj*GW+ni]||!walk[nj*GW+ci]))continue;dist[n]=dc;q[qt++]=n}}
 };
 // 返回朝向下一格的方向；没有路返回 null
 T.dir=function(x,y){if(!dist)return null;const i=((x-X0)/CS)|0,j=((y-Y0)/CS)|0;if(i<0||j<0||i>=GW||j>=GH)return null;
  let best=dist[j*GW+i],bx=0,by=0;if(best<0)best=1e9;
  for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=GW||nj>=GH)continue;const v=dist[nj*GW+ni];if(v>=0&&v<best){best=v;bx=di;by=dj}}
  if(!bx&&!by)return null;const l=Math.hypot(bx,by);return[bx/l,by/l]};
 return T;
}
