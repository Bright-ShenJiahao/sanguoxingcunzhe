"""一次性脚本：平原中部河流全部改浅滩、加宽一倍、去掉小桥。"""
import numpy as np,json,cv2
from PIL import Image
R='/home/claude/sanguoxingcunzhe';M=R+'/assets/map/'
J=json.load(open(R+'/data/world.json'));HD=J['HD'];T=J['tiles']['T'];W,H=J['WW'],J['WH']
full=np.zeros((H*HD,W*HD,3),np.uint8)
for t in J['tiles']['list']:
    im=np.array(Image.open(M+t+'.jpg').convert('RGB'));tx,ty=int(t[1]),int(t[2]);full[ty*T*HD:ty*T*HD+im.shape[0],tx*T*HD:tx*T*HD+im.shape[1]]=im
c=np.array(Image.open(M+'coll.png').convert('RGB'));b=c[...,0]
f=full[::HD,::HD].astype(int);sea=(f[...,2]>f[...,1]+40)&(f[...,0]<90)
reg=np.zeros((H,W),bool);reg[440:1010,980:1700]=True
riv=(b==2)&reg
deep=sea.copy();deep[:,:1120]=False;deep[:,1300:]=False;deep[:540]=False;deep[690:]=False   # 小桥那段深水
riv|=deep
riv=cv2.morphologyEx(riv.astype(np.uint8),cv2.MORPH_CLOSE,np.ones((9,9),np.uint8))>0
dt=cv2.distanceTransform((~riv).astype(np.uint8),cv2.DIST_L2,5)
inner=cv2.distanceTransform(riv.astype(np.uint8),cv2.DIST_L2,5);hw=np.median(inner[riv&(inner>0)])*1.6
mk=(dt<=hw)&reg
mkH=cv2.resize(mk.astype(np.uint8),(W*HD,H*HD),interpolation=cv2.INTER_NEAREST)>0
P=10*HD;cx,cy=1500,0
ys=np.where(b[480:620,1500]==2)[0];cy=480+int(ys.mean())
patch=full[cy*HD-P//2:cy*HD+P//2,cx*HD-P:cx*HD+P].astype(np.float32);pm=np.concatenate([patch,patch[:,::-1]],1);pm=np.concatenate([pm,pm[::-1]],0)
water=np.tile(pm,(mkH.shape[0]//pm.shape[0]+1,mkH.shape[1]//pm.shape[1]+1,1))[:mkH.shape[0],:mkH.shape[1]]
seaH=cv2.resize((sea&~deep).astype(np.uint8),(W*HD,H*HD),interpolation=cv2.INTER_NEAREST)>0
pondKeep=seaH.copy();pondKeep[:, :1120*HD]=pondKeep[:, :1120*HD];  # 池塘/海保持
m2=mkH&~pondKeep
a=cv2.GaussianBlur(m2.astype(np.float32),(0,0),1.5*HD)*(~pondKeep);a=a[...,None]
edge=np.clip(1-np.abs(a[...,0]-.5)*4,0,1)[...,None]*.45*(~pondKeep)[...,None]
out=full*(1-a)+water*a;out=out*(1-edge)+np.array([225,235,238])*edge
full=np.clip(out,0,255).astype(np.uint8)
ms=mk&~(sea&~deep);b[ms]=2
c[...,0]=b;Image.fromarray(c).save(M+'coll.png')
J['objs']=[o for o in J['objs'] if not (0<=int(o[2])<H and 0<=int(o[1])<W and dt[int(o[2]),int(o[1])]<=hw+4 and reg[int(o[2]),int(o[1])])]
for t in J['tiles']['list']:
    tx,ty=int(t[1]),int(t[2]);Image.fromarray(full[ty*T*HD:(ty+1)*T*HD,tx*T*HD:(tx+1)*T*HD]).save(M+t+'.jpg',quality=80,optimize=True)
J['ver']=J.get('ver',0)+1;json.dump(J,open(R+'/data/world.json','w'),ensure_ascii=False,separators=(',',':'))
Image.fromarray(full[420*HD:1060*HD,950*HD:W*HD]).resize((W-950,640)).save('/tmp/claude-0/s/riv.png');print('hw',hw)
