"""西部山地·峡谷（灰盒版）+ 与中部（北雪南草）拼接。
先跑 build_world.py、build_snow.py。输出：assets/map/ground_w.jpg（西，x 0..1280）、ground.jpg（中，x 1280..2560，左 200 与山地混合）、
coll.png（2560x2560）、data/world.json（世界 2560x2560）。"""
import numpy as np, cv2, json, os, time
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=ROOT+'/art_src/map/'; BUILD=ROOT+'/art_src/build/'; OUT=ROOT+'/assets/map/'; DATA=ROOT+'/data/'
HD=2; CW=1280; H=2560; OV=200; WL=CW+OV          # 西图宽 1480（最右 200 与中部重叠）
rng=np.random.default_rng(41)
def sstep(x): x=np.clip(x,0,1); return x*x*(3-2*x)
def vnoise(cell,seed,w,h):
    g=np.random.default_rng(seed).random((h//cell+3,w//cell+3)).astype(np.float32)
    return cv2.resize(g,(g.shape[1]*cell,g.shape[0]*cell),interpolation=cv2.INTER_CUBIC)[:h,:w]
def fbm(cell,seed,oct,w,h):
    v=0;a=1;tot=0
    for o in range(oct): v=v+a*vnoise(max(4,cell>>o),seed+o*13,w,h);tot+=a;a*=.5
    v=v/tot; return (v-v.mean())/(v.std()+1e-6)
def seamless(t,S2,band=.30):
    t=cv2.resize(t,(S2,S2),interpolation=cv2.INTER_AREA).astype(np.float32)
    U=np.roll(np.roll(t,S2//2,0),S2//2,1)
    ax=np.arange(S2); d=np.minimum(ax,S2-1-ax)/(S2*band)
    w=(sstep(d)[:,None]*sstep(d)[None,:])[...,None]
    return t*w+U*(1-w)
cw=json.load(open(BUILD+'world_center.json'))
# ---------- 峡谷路径（局部坐标 x0..1480, y0..2560；最后拐向东边草地的缺口）----------
P=np.array([(960,40),(700,330),(430,640),(560,980),(840,1230),(600,1560),(430,1860),(700,2030),(1000,2020),(1560,2010)],np.float32)
dense=[]
for a,b in zip(P[:-1],P[1:]):
    n=max(2,int(np.hypot(*(b-a))/4)); dense+= [a+(b-a)*t for t in np.linspace(0,1,n,endpoint=False)]
dense=np.array(dense+[P[-1]],np.float32)
k=np.ones(41,np.float32)/41
pad=np.pad(dense,((20,20),(0,0)),mode='edge')
sm=np.stack([np.convolve(pad[:,0],k,'valid'),np.convolve(pad[:,1],k,'valid')],1)
mask=np.zeros((H,WL),np.uint8)
cv2.polylines(mask,[sm.astype(np.int32).reshape(-1,1,2)],False,1,3)
for c in [(560,980),(600,1560),(840,1230),(900,2020),(960,60)]: cv2.circle(mask,c,95,1,-1)   # 几处开阔的谷地
d=cv2.distanceTransform(1-mask,cv2.DIST_L2,5)
# ---------- 高度场：几层台地 + 朝南的崖面 ----------
hh=(d-30+fbm(140,3,3,WL,H)*34)/260
h=cv2.GaussianBlur(np.clip(hh,0,1),(0,0),5)
Q=4
T=np.floor(np.clip(h,0,1)*Q+0.45*fbm(170,9,2,WL,H))/Q
T=np.clip(T,0,1); T=cv2.GaussianBlur(T,(0,0),1.3)
FACE=18                                           # 崖面高度（逻辑像素）
Tn=np.roll(T,FACE,axis=0); Tn[:FACE]=T[:FACE]      # 每个像素取它北边 FACE 像素处的高度
face=np.clip((Tn-T)*Q*1.2,0,1)                    # 北边更高 -> 这里是朝南的崖面
blocked=(T>=0.5)|((face>0.35)&(Tn>=0.5))
gx=cv2.Sobel(cv2.GaussianBlur(h,(0,0),8),cv2.CV_32F,1,0,ksize=3)/8; gy=cv2.Sobel(cv2.GaussianBlur(h,(0,0),8),cv2.CV_32F,0,1,ksize=3)/8
shade=np.clip(1-60*(gx*0.6+gy*0.8),0.8,1.25)
up=lambda a:cv2.resize(a.astype(np.float32),(WL*HD,H*HD),interpolation=cv2.INTER_LINEAR)
hH=up(h); shH=up(shade); TH=up(T); fH=up(face)
stops=[(0.0,(162,140,94)),(0.25,(140,120,86)),(0.5,(122,108,88)),(0.75,(128,122,114)),(1.0,(172,168,162))]
col=np.zeros((H*HD,WL*HD,3),np.float32)
xs=np.array([s[0] for s in stops],np.float32)
for ch in range(3): col[...,ch]=np.interp(TH,xs,[s[1][ch] for s in stops])
tile=seamless(cv2.cvtColor(cv2.imread(SRC+'grass.png'),cv2.COLOR_BGR2RGB),720).mean(2)
tile=(tile-tile.mean())/(tile.std()+1e-6)
big=np.tile(tile,(H*HD//720+2,WL*HD//720+2))[:H*HD,:WL*HD]
col*=(1+0.10*big[...,None]+0.04*fbm(18,21,2,WL*HD,H*HD)[...,None])*shH[...,None]
# 崖面：深褐色竖纹，越靠崖脚越暗
vs=cv2.resize(np.random.default_rng(5).random((8,(WL*HD)//3+3)).astype(np.float32),((WL*HD)//3*3+9,H*HD),interpolation=cv2.INTER_CUBIC)[:H*HD,:WL*HD]
fc=np.array([88,72,60],np.float32)*(0.72+0.7*vs[...,None])
fa=np.clip(fH*1.6,0,1)[...,None]
col=col*(1-fa)+fc*fa
del big,vs
WI=np.clip(col,0,255).astype(np.uint8); del col
print('mountain ground ok')
# ---------- 碰撞 ----------
colr=np.zeros((H,WL,3),np.uint8); colr[...,0]=blocked*1
# ---------- 物件（用现有石头/树/枯草先搭灰盒）----------
objs=[]; grid={}; CS=40
def far(x,y,r,kk=1.0):
    gx_,gy_=int(x//CS),int(y//CS)
    for i in range(gx_-2,gx_+3):
        for j in range(gy_-2,gy_+3):
            for o in grid.get((i,j),()):
                if (x-o[0])**2+(y-o[1])**2<(r+kk*o[2])**2: return False
    return True
def put(kk,x,y,r): objs.append([kk,x,y]); grid.setdefault((int(x//CS),int(y//CS)),[]).append((x,y,r))
def freeish(x,y,m): return not blocked[max(0,y-m):y+m,max(0,x-m):x+m].any()
for _ in range(80000):
    x,y=[int(v) for v in rng.integers(24,[WL-24,H-24])]
    hv=h[y,x]
    if not (0.1<hv<0.8): continue
    kind=rng.choice(['spire','rmid','rsmall'],p=[.12,.38,.5])
    r={'spire':20,'rmid':14,'rsmall':8}[kind]; q={'spire':6,'rmid':30,'rsmall':14}[kind]
    if sum(1 for o in objs if o[0].startswith(kind))>=q*(1+ (0 if kind!='rsmall' else 3)): continue
    if T[y,x]<0.25 and kind!='rsmall': continue      # 大石头长在山脚的坡上，不堵谷底
    if not freeish(x,y,r) or not far(x,y,r+8): continue
    put(kind+str(1+int(rng.integers(2))),x,y,r)
nt=0
for _ in range(30000):
    x,y=[int(v) for v in rng.integers(24,[WL-24,H-24])]
    if T[y,x]>0.3 or d[y,x]<30: continue
    if rng.random()>0.04 or not freeish(x,y,14) or not far(x,y,22): continue
    put(['pine1','pine2'][int(rng.integers(2))],x,y,22); nt+=1
for _ in range(40000):
    x,y=[int(v) for v in rng.integers(16,[WL-16,H-16])]
    if T[y,x]>0.3 or blocked[y,x]: continue
    if rng.random()>0.22 or not far(x,y,12,.3): continue
    put(['dry1','dry2','tuft3','tuft4'][int(rng.integers(4))],x,y,6)
    if len(objs)>2400: break
print('mountain objs',len(objs),'pines',nt)
# ---------- 与中部拼接 ----------
Cen=np.array(Image.open(BUILD+'ground_center.jpg').convert('RGB'))      # 5120 x 2560
xs_=np.arange(OV,dtype=np.float32)/OV
Mx=np.zeros((H,OV),np.float32)
Mx[:]=sstep(np.clip((xs_[None,:]-0.5)*2.0+0.5+0.45*fbm(50,301,3,OV,H)*np.sin(np.pi*xs_[None,:]),0,1))   # 0 山地 .. 1 中部
MH=cv2.resize(Mx,(OV*HD,H*HD),interpolation=cv2.INTER_LINEAR)[...,None]
ov=WI[:,CW*HD:].astype(np.float32)*(1-MH)+Cen[:,:OV*HD].astype(np.float32)*MH
Cen[:,:OV*HD]=np.clip(ov,0,255).astype(np.uint8)
Image.fromarray(WI[:,:CW*HD]).save(OUT+'ground_w.jpg',quality=70,optimize=True)
Image.fromarray(Cen).save(OUT+'ground.jpg',quality=70,optimize=True)
# 碰撞 2560x2560
cc=np.array(Image.open(BUILD+'coll_center.png').convert('RGB'))      # 2560 x 1280
C=np.zeros((H,2*CW,3),np.uint8); C[:,:CW]=colr[:,:CW]; C[:,CW:]=cc
z=np.where((Mx>=0.5)[...,None],cc[:,:OV],colr[:,CW:WL]); C[:,CW:CW+OV]=z
Image.fromarray(C).save(OUT+'coll.png',optimize=True)
# 物件
allo=[o for o in objs if not (o[1]>=CW and Mx[o[2],o[1]-CW]>=0.5) and o[1]<WL]
for kk,x,y in cw['objs']:
    if x<OV and Mx[y,x]<0.5: continue
    allo.append([kk,x+CW,y])
size={**cw['size']}; cr={**cw['coll_r']}
b=cw['bridge']; bw=b['walk']
sx=[float(p[0]) for p in sm];
wj={'WW':2*CW,'WH':H,'HD':HD,'size':size,'coll_r':cr,'objs':allo,'bridge':{'x':b['x']+CW,'y':b['y'],'walk':[bw[0]+CW,bw[1],bw[2]+CW,bw[3]]},
    'snowY':1280,'snowX':CW,'chunks':[['ground_w',0],['ground',CW]],'ver':int(time.time()),'canyon':[[int(p[0]),int(p[1])] for p in sm[::40]]}
json.dump(wj,open(DATA+'world.json','w'),separators=(',',':')); print('world ok',len(allo))
