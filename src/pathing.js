// 全地图寻路图：每 0.4 秒从主角位置做一次广度优先搜索，怪物沿“离主角更近”的格子走，
// 被河、崖挡住时会自动绕到桥或浅滩。
export function createPathing(WW,WH,ok){
 const CS=8,GW=Math.ceil(WW/CS),GH=Math.ceil(WH/CS),N=GW*GH;
 const walk=new Uint8Array(N),dist=new Int32Array(N),q=new Int32Array(N);let built=false,tLast=-1e9;
 function build(){for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const x=i*CS+CS/2,y=j*CS+CS/2;walk[j*GW+i]=ok(x,y)?1:0}built=true}
 function update(hx,hy,now){
  if(!built)build();if(now-tLast<400)return;tLast=now;dist.fill(-1);
  const hi=Math.max(0,Math.min(GW-1,(hx/CS)|0)),hj=Math.max(0,Math.min(GH-1,(hy/CS)|0));let qh=0,qt=0;const s=hj*GW+hi;dist[s]=0;q[qt++]=s;
  while(qh<qt){const c=q[qh++],ci=c%GW,cj=(c/GW)|0,dc=dist[c]+1;
   for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ni=ci+di,nj=cj+dj;if(ni<0||nj<0||ni>=GW||nj>=GH)continue;const n=nj*GW+ni;
    if(dist[n]>=0||!walk[n])continue;if(di&&dj&&(!walk[cj*GW+ni]||!walk[nj*GW+ci]))continue;dist[n]=dc;q[qt++]=n}}}
 function D(i,j,c){if(i<0||j<0||i>=GW||j>=GH)return c+3;const v=dist[j*GW+i];return v<0?c+3:v}   // 墙当作更远
 function dir(x,y){const fx=x/CS-.5,fy=y/CS-.5,i=Math.floor(fx),j=Math.floor(fy),ax=fx-i,ay=fy-j;
  const c=dist[Math.max(0,Math.min(GH-1,(y/CS)|0))*GW+Math.max(0,Math.min(GW-1,(x/CS)|0))];if(c<0)return null;
  const g=(a,b)=>D(a,b,c);
  const d00=g(i,j),d10=g(i+1,j),d01=g(i,j+1),d11=g(i+1,j+1);
  let gx=(d10-d00)*(1-ay)+(d11-d01)*ay,gy=(d01-d00)*(1-ax)+(d11-d10)*ax,l=Math.hypot(gx,gy);
  if(l<1e-3)return null;return[-gx/l,-gy/l]}
 function at(x,y){const i=(x/CS)|0,j=(y/CS)|0;if(i<0||j<0||i>=GW||j>=GH)return -1;return dist[j*GW+i]}
 return {update,dir,at,dbg:()=>{let r=0,w=0;for(let i=0;i<N;i++){if(walk[i])w++;if(dist[i]>=0)r++}return[r,w]}};
}
