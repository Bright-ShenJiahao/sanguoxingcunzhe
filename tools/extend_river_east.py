"""一次性脚本：东岸改成圆弧后，去掉新陆地上的隐形墙，并把东边小河延长到海。"""
import numpy as np,json,cv2
from PIL import Image
R='/home/claude/sanguoxingcunzhe';M=R+'/assets/map/'
J=json.load(open(R+'/data/world.json'));HD=J['HD'];T=J['tiles']['T'];W,H=J['WW'],J['WH']
full=np.zeros((H*HD,W*HD,3),np.uint8)
for t in J['tiles']['list']:
    im=np.array(Image.open(M+t+'.jpg').convert('RGB'));tx,ty=int(t[1]),int(t[2]);full[ty*T*HD:ty*T*HD+im.shape[0],tx*T*HD:tx*T*HD+im.shape[1]]=im
c=np.array(Image.open(M+'coll.png').convert('RGB'));b=c[...,0]
f=full[::HD,::HD].astype(int);green=(f[...,1]>f[...,2]+25)&(f[...,1]>f[...,0]+5);sea=(f[...,2]>f[...,1]+40)&(f[...,0]<90)
fix=(b==1)&green;fix[:80]=False;fix[:,:1550]=False;b[fix]=0   # 东岸新陆地去掉隐形墙
# 河尾中心线，延长到海
ys=[];xs=list(range(1580,1626,2))
for x in xs:yy=np.where(b[100:220,x]==2)[0];ys.append(100+yy.mean())
k=np.polyfit(xs,ys,1)[0];ex,ey=xs[-1],ys[-1]
pts=[];x,y=ex-6,ey
while x<W-5 and not sea[int(y),int(x)] or x<ex+5:
    pts.append((x,y+3*np.sin((x-ex)/9)));x+=2;y+=k*2*0.7
for _ in range(6):pts.append((x,y));x+=2;y+=k*1.4
wid=int(np.median([(b[100:220,x]==2).sum() for x in xs]))
mk=np.zeros((H*HD,W*HD),np.uint8);cv2.polylines(mk,[np.array([[p[0]*HD,p[1]*HD] for p in pts],np.int32)],False,255,wid*HD)
# 河水纹理：从现有河道中间截一小块，镜像平铺
cx,cy=xs[len(xs)//2],int(ys[len(ys)//2]);P=10*HD
patch=full[cy*HD-P:cy*HD+P,cx*HD-P:cx*HD+P].astype(np.float32);pm=np.concatenate([patch,patch[:,::-1]],1);pm=np.concatenate([pm,pm[::-1]],0)
water=np.tile(pm,(mk.shape[0]//pm.shape[0]+1,mk.shape[1]//pm.shape[1]+1,1))[:mk.shape[0],:mk.shape[1]]
landh=~(cv2.resize(sea.astype(np.uint8),(W*HD,H*HD),interpolation=cv2.INTER_NEAREST)>0)
mk=(mk>0)&landh
a=(cv2.GaussianBlur(mk.astype(np.float32),(0,0),1.5*HD)*landh)[...,None]
edge=(np.clip(1-np.abs(a[...,0]-.5)*4,0,1)*landh)[...,None]*.45
out=full*(1-a)+water*a;out=out*(1-edge)+np.array([225,235,238])*edge
full=np.clip(out,0,255).astype(np.uint8)
ms=cv2.resize((mk).astype(np.uint8),(W,H),interpolation=cv2.INTER_AREA)>0;b[ms&~sea]=2
c[...,0]=b;Image.fromarray(c).save(M+'coll.png')
for t in J['tiles']['list']:
    tx,ty=int(t[1]),int(t[2]);Image.fromarray(full[ty*T*HD:(ty+1)*T*HD,tx*T*HD:(tx+1)*T*HD]).save(M+t+'.jpg',quality=80,optimize=True)
J['ver']=J.get('ver',0)+1;json.dump(J,open(R+'/data/world.json','w'),ensure_ascii=False,separators=(',',':'))
Image.fromarray(full[40*HD:300*HD,1400*HD:W*HD]).resize((W-1400,260)).save('/tmp/claude-0/-home-claude/b6fcd064-da0c-5ebc-9c98-f983720bd619/scratchpad/mouth.png');print('fixed',int(fix.sum()),'pts',len(pts),'wid',wid)
