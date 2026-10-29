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
 function dir(x,y){const i=(x/CS)|0,j=(y/CS)|0;if(i<0||j<0||i>=GW||j>=GH)return null;
  let best=dist[j*GW+i];if(best<0)best=1e9;let bi=0,bj=0;
  for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=GW||nj>=GH)continue;const v=dist[nj*GW+ni];if(v>=0&&v<best){best=v;bi=di;bj=dj}}
  if(!bi&&!bj)return null;const tx=(i+bi)*CS+CS/2-x,ty=(j+bj)*CS+CS/2-y,l=Math.hypot(tx,ty)||1;return[tx/l,ty/l]}
 function at(x,y){const i=(x/CS)|0,j=(y/CS)|0;if(i<0||j<0||i>=GW||j>=GH)return -1;return dist[j*GW+i]}
 return {update,dir,at,dbg:()=>{let r=0,w=0;for(let i=0;i<N;i++){if(walk[i])w++;if(dist[i]>=0)r++}return[r,w]}};
}
