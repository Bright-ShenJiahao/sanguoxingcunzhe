# 一次性修东海岸：去掉草地上的模糊竖条、海里的竖线和河口方框，海面改成随机小块拼贴（去掉镜像重复），东部草地加一点明暗起伏。
# 输入/输出 assets/map/g00.jpg、g10.jpg（HD=2，拼起来 3760×2376）。
import numpy as np,cv2
from PIL import Image
a=np.array(Image.open('assets/map/g00.jpg').convert('RGB')).astype(np.float32)
b=np.array(Image.open('assets/map/g10.jpg').convert('RGB')).astype(np.float32)
M=np.concatenate([a,b],1);H,W=M.shape[:2]
coll=np.array(Image.open('assets/map/coll.png'))[...,0]
sea=cv2.resize((coll==1).astype(np.uint8),(W,H),interpolation=cv2.INTER_NEAREST).astype(bool)
sea[:, :3000]=False                                     # 只处理东边的海
# 1) 草地竖条：用左边 70px 处的草纹替换，羽化
y0,y1,x0,x1=1700,2020,3350,3415
src=M[y0:y1,x0-80:x1-80].copy()
w=np.ones((y1-y0,x1-x0),np.float32);w=cv2.GaussianBlur(np.pad(w[8:-8,8:-8],8),(0,0),5)[...,None]
M[y0:y1,x0:x1]=M[y0:y1,x0:x1]*(1-w)+src*w
# 1b) 草地上一串淡淡的“<|||>”花纹：用上方 70px 的草替换
y0,y1,x0,x1=1765,1815,3270,3430
src=M[y0-70:y1-70,x0:x1].copy();w=np.ones((y1-y0,x1-x0),np.float32);w=cv2.GaussianBlur(np.pad(w[6:-6,6:-6],6),(0,0),4)[...,None]
M[y0:y1,x0:x1]=M[y0:y1,x0:x1]*(1-w)+src*w
# 2) 海面重新拼贴
rng=np.random.default_rng(7);P=128;S=[]
for _ in range(400):
  x=rng.integers(3600,W-P);y=rng.integers(100,H-P-100)
  if sea[y:y+P,x:x+P].all():S.append(M[y:y+P,x:x+P].copy())
S=S[:120]
acc=np.zeros_like(M);wt=np.zeros((H,W,1),np.float32)
win=np.outer(np.hanning(P),np.hanning(P)).astype(np.float32)[...,None]+1e-3
ys,xs=np.where(sea);Y0,Y1,X0,X1=ys.min(),ys.max(),xs.min(),xs.max()
for y in range(Y0-P//2,Y1,P//2):
  for x in range(X0-P//2,X1,P//2):
    jx,jy=x+rng.integers(-12,13),y+rng.integers(-12,13);p=S[rng.integers(len(S))]
    if rng.random()<.5:p=p[:,::-1]
    ya,yb,xa,xb=max(0,jy),min(H,jy+P),max(0,jx),min(W,jx+P)
    if ya>=yb or xa>=xb:continue
    acc[ya:yb,xa:xb]+=p[ya-jy:yb-jy,xa-jx:xb-jx]*win[ya-jy:yb-jy,xa-jx:xb-jx];wt[ya:yb,xa:xb]+=win[ya-jy:yb-jy,xa-jx:xb-jx]
new=acc/np.maximum(wt,1e-6)
# 拼贴会略糊：把原海面的整体亮度保留，叠回细节
sm=sea.astype(np.float32)[...,None]
lo=lambda z:cv2.GaussianBlur(z*sm,(0,0),24)/np.maximum(cv2.GaussianBlur(sm,(0,0),24)[...,None],1e-3)   # 只在海里取平均，岸边不带绿
new=lo(M)+ (new-lo(new))*1.25
m=cv2.erode(sea.astype(np.uint8),np.ones((7,7),np.uint8)).astype(np.float32)
m=cv2.GaussianBlur(m,(0,0),2.5)[...,None]
M=M*(1-m)+new*m
# 3) 东部草地加明暗起伏
land=~cv2.resize((coll==1).astype(np.uint8),(W,H),interpolation=cv2.INTER_NEAREST).astype(bool)
nz=cv2.resize(rng.random((H//160+2,W//160+2)).astype(np.float32),(W,H),interpolation=cv2.INTER_CUBIC)
nz=cv2.GaussianBlur(nz,(0,0),60);nz=(nz-nz.mean())/(nz.std()+1e-6)
ramp=np.clip((np.arange(W)-2300)/300,0,1)[None,:]
k=(1+.07*nz*ramp)[...,None]*land[...,None]+(~land[...,None])
M=np.clip(M*k,0,255).astype(np.uint8)
Image.fromarray(M[:, :3200]).save('assets/map/g00.jpg',quality=90)
Image.fromarray(M[:, 3200:]).save('assets/map/g10.jpg',quality=90)
print('ok',len(S))
