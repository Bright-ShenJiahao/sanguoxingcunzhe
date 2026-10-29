"""第一关换成明亮奇幻像素风：
- art_src/map/fantasy/ground.png（2x3 地面贴图，洋红分隔）→ 按 coll.png 和旧地面颜色重铺 assets/map/g*.jpg
- art_src/map/fantasy/objects.png（4x4 物件，洋红底）→ 覆盖同名 sprites，并更新 data/world.json 的 size
旧地面先备份到 art_src/build/stage_old/（重复运行时从备份读取）。"""
import numpy as np, cv2, json, os, shutil
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=ROOT+'/art_src/map/fantasy/'; MAP=ROOT+'/assets/map/'; BK=ROOT+'/art_src/build/stage_old/'
J=json.load(open(ROOT+'/data/world.json')); HD=J['HD']; T=J['tiles']['T']; W,H=J['WW'],J['WH']
if not os.path.isdir(BK):
    os.makedirs(BK)
    for t in J['tiles']['list']: shutil.copy(MAP+t+'.jpg',BK)
    for k in J['size']:
        if os.path.exists(MAP+'sprites/'+k+'.png'): shutil.copy(MAP+'sprites/'+k+'.png',BK)
def mag(a): return (a[...,0]>170)&(a[...,2]>170)&(a[...,1]<120)
# ---------- 地面贴图 ----------
g=np.array(Image.open(SRC+'ground.png').convert('RGB')); m=mag(g)
cols=np.where(m.mean(0)>.5)[0]; rows=np.where(m.mean(1)>.5)[0]
def cuts(idx,n):
    b=[0];
    for i in range(1,len(idx)):
        if idx[i]-idx[i-1]>1: b+= [idx[i-1]+1,idx[i]]
    if len(idx): b=[0,idx[0]]+b[1:]+[idx[-1]+1,n]
    s=[(b[i],b[i+1]) for i in range(0,len(b),2) if b[i+1]-b[i]>100]; return s
xs=cuts(cols,g.shape[1]); ys=cuts(rows,g.shape[0]); assert len(xs)==3 and len(ys)==2,(xs,ys)
S=480
def seamless(t):
    t=cv2.resize(t[8:-8,8:-8],(S,S),interpolation=cv2.INTER_AREA).astype(np.float32)
    b=int(S*.3); out=np.roll(np.roll(t,S//2,0),S//2,1)          # 接缝移到中间再用原图盖住
    w=np.clip(np.minimum.outer(np.minimum(np.arange(S),S-1-np.arange(S)),np.minimum(np.arange(S),S-1-np.arange(S)))/b,0,1)[...,None]
    return out*(1-w)+t*w
TX=[seamless(g[y0:y1,x0:x1]) for y0,y1 in ys for x0,x1 in xs]   # 草, 林草, 土, 水, 浅滩, 岩
def tile(t,h,w,ox=0,oy=0): return t[(np.arange(h)[:,None]+oy)%S,(np.arange(w)[None,:]+ox)%S]
C=np.array(Image.open(MAP+'coll.png').convert('RGB'))[...,0]
Wd,Hd=W*HD,H*HD
old=np.zeros((Hd,Wd,3),np.uint8)
for t in J['tiles']['list']:
    tx,ty=int(t[1]),int(t[2]); im=np.array(Image.open(BK+t+'.jpg').convert('RGB')); old[ty*T*HD:ty*T*HD+im.shape[0],tx*T*HD:tx*T*HD+im.shape[1]]=im
o=old.astype(np.int32); small=cv2.resize(old,(W,H),interpolation=cv2.INTER_AREA).astype(np.int32)
up=lambda a:cv2.resize(a.astype(np.float32),(Wd,Hd),interpolation=cv2.INTER_LINEAR)
blur=lambda a,s:cv2.GaussianBlur(a.astype(np.float32),(0,0),s)
water=(small[...,2]>small[...,1]+5)&(C>=1)
shal=(C==2)
rock=(C==1)&~water; rock[:50]=False
# 土路/山地：旧图里偏黄、偏亮、不太绿的地方
sat=small[...,1]-(small[...,0]+small[...,2])/2
dirt=(sat<14)&(C==0)&~cv2.dilate(water.astype(np.uint8),np.ones((5,5),np.uint8)).astype(bool)
reg=np.array(J['rmap']).reshape(J['rgrid'][1],J['rgrid'][0]); forest=cv2.resize((reg==1).astype(np.float32),(W,H),interpolation=cv2.INTER_LINEAR)
rng=np.random.default_rng(3); nz=blur(rng.random((H//40+1,W//40+1)),1.2); nz=cv2.resize((nz-nz.min())/(np.ptp(nz)+1e-6),(W,H))
forest=blur(forest,90); wF=np.clip(forest*0.9+(nz-0.5)*0.8+0.15,0,1); wF[:160]=np.maximum(wF[:160],np.linspace(1,0,160)[:,None])                   # 林草比例
wD=blur(dirt,2.5); wD=np.clip((wD-0.35)*2.2,0,1)
wR=np.clip(blur(rock,2)*1.6,0,1); wS=np.clip(blur(shal|water,3)*1.5,0,1); wW=np.clip((blur(water,2.5)-0.45)*3,0,1)
out=np.zeros((Hd,Wd,3),np.uint8); BH=800
for y0 in range(0,Hd,BH):
    y1=min(Hd,y0+BH); h=y1-y0; L=lambda a:up(a)[y0:y1][...,None]
    gr=tile(TX[0],h,Wd,0,y0); fo=tile(TX[1],h,Wd,137,y0+59)
    col=gr*(1-L(wF))+fo*L(wF)
    col=col*(1-L(wD))+tile(TX[2],h,Wd,71,y0+211)*L(wD)
    col=col*(1-L(wS))+tile(TX[4],h,Wd,33,y0)*L(wS)
    col=col*(1-L(wW))+tile(TX[3],h,Wd,0,y0+17)*L(wW)
    col=col*(1-L(wR))+tile(TX[5],h,Wd,91,y0+7)*0.85*L(wR)
    out[y0:y1]=np.clip(col,0,255).astype(np.uint8)
for t in J['tiles']['list']:
    tx,ty=int(t[1]),int(t[2]); Image.fromarray(out[ty*T*HD:(ty+1)*T*HD,tx*T*HD:(tx+1)*T*HD]).save(MAP+t+'.jpg',quality=72,optimize=True)
Image.fromarray(out[::8,::8]).save(ROOT+'/art_src/build/preview_fantasy.png')
# ---------- 物件 ----------
a=np.array(Image.open(SRC+'objects.png').convert('RGB')).astype(int)
bg=mag(a)|((a[...,0]>a[...,1]+25)&(a[...,2]>a[...,1]+25))|((a[...,0]>150)&(a[...,2]>120)&(a[...,1]<a[...,0]-60)&(a[...,1]<a[...,2]-30))
fg=cv2.morphologyEx((~bg).astype(np.uint8),cv2.MORPH_OPEN,np.ones((2,2),np.uint8))
n,lab,st,_=cv2.connectedComponentsWithStats(cv2.dilate(fg,np.ones((15,15),np.uint8)))
boxes=sorted([st[i] for i in range(1,n) if st[i][4]>1500],key=lambda b:(round((b[1]+b[3])/313),b[0]))
assert len(boxes)==16,len(boxes)
NAMES=['birch','fir','oak','firS','fern','bushR','bushF','grass','rockL','rockM','rubble','log','cattail','lily','bridge','dock']
SP={nm:b for nm,b in zip(NAMES,boxes)}
def cut(nm):
    x,y,w,h,_=SP[nm]; m=fg[y:y+h,x:x+w].astype(bool); rgba=np.dstack([a[y:y+h,x:x+w],m*255]).astype(np.uint8)
    return Image.fromarray(rgba,'RGBA')
# 旧名 → 新图, 目标高度（逻辑像素）
MAPK={'broad1':('oak',84),'broad2':('birch',88),'broad3':('oak',66),'broad4':('birch',74),'pine1':('fir',92),'pine2':('firS',70),
      'bushL1':('fern',40),'bushL2':('bushF',40),'bushM1':('bushR',30),'bushM2':('fern',30),'bushS1':('bushR',20),'bushS2':('grass',20),
      'tuft1':('grass',20),'tuft2':('grass',16),'tuft3':('fern',15),'tuft4':('grass',12),
      'rmid2':('rockL',32),'rsmall1':('rubble',14),'wlog':('log',30),
      'wcat1':('cattail',38),'wcat2':('cattail',34),'wcat3':('cattail',40),'wreed1':('grass',34),'wreed2':('cattail',32),'wreed3':('grass',26),
      'wlily1':('lily',18),'wlily2':('lily',20)}
for k,(nm,th) in MAPK.items():
    if k not in J['size']: continue
    im=cut(nm); hh=th*HD; ww=round(im.width*hh/im.height)
    im=im.resize((ww,hh),Image.LANCZOS); ar=np.array(im); al=np.where(ar[...,3]>110,255,0).astype(np.uint8); al=cv2.erode(al,np.ones((2,2),np.uint8)); pk=(ar[...,0].astype(int)>ar[...,1]+15)&(ar[...,2].astype(int)>ar[...,1]+15); al[pk]=0; ar[...,3]=al
    Image.fromarray(ar).save(MAP+'sprites/'+k+'.png'); J['size'][k]=[ww/HD,hh/HD]
json.dump(J,open(ROOT+'/data/world.json','w'),separators=(',',':'))
print('ok')
