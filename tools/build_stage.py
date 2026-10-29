"""第一关「翠绿之地」：从完整大地图（art_src/build/full/，由 build_map.py 生成后复制）切出南半边绿地
（迷雾森林 / 翠绿平原 / 水乡湿地），北边用密林封边，再在平原上补几片树林。
输出：assets/map/g{x}{y}.jpg（1600 逻辑像素一块，最后一行可不满）、coll.png、data/world.json。"""
import numpy as np, cv2, json, os, time
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FULL=ROOT+'/art_src/build/full/'; OUT=ROOT+'/assets/map/'; DATA=ROOT+'/data/'
HD=2; T=1600; Y0=1600; W=3200; H=1600            # 切出 y ∈ [1600, 3200)
rng=np.random.default_rng(7)
J=json.load(open(FULL+'world.json'))
big=np.zeros((3200*HD,3200*HD,3),np.uint8)
for ty in range(2):
    for tx in range(2): big[ty*T*HD:(ty+1)*T*HD,tx*T*HD:(tx+1)*T*HD]=np.array(Image.open(FULL+f'g{tx}{ty}.jpg').convert('RGB'))
G=big[Y0*HD:(Y0+H)*HD].copy(); del big
C=np.array(Image.open(FULL+'coll.png').convert('RGB'))[Y0:Y0+H].copy()
# 北边封边：最上面一条变暗（林下阴影），不可通行
band=np.clip(1-np.arange(140*HD)/(140*HD),0,1)[:,None,None]
G[:140*HD]=(G[:140*HD]*(1-0.45*band)).astype(np.uint8)
C[:46,:,0]=1
for f in os.listdir(OUT):
    if f.startswith('g') and f.endswith('.jpg'): os.remove(OUT+f)
tiles=[]
for ty in range((H+T-1)//T):
    for tx in range(W//T):
        Image.fromarray(G[ty*T*HD:(ty+1)*T*HD,tx*T*HD:(tx+1)*T*HD]).save(OUT+f'g{tx}{ty}.jpg',quality=70,optimize=True); tiles.append(f'g{tx}{ty}')
Image.fromarray(G[::16,::16]).save(ROOT+'/art_src/build/preview_stage.png')
# ---------- 物件 ----------
objs=[[k,x,y-Y0] for k,x,y in J['objs'] if Y0+20<=y<Y0+H]
SZ=J['size']; CS=48; grid={}
rad=lambda k:max(5.0,0.36*SZ[k][0])
for k,x,y in objs: grid.setdefault((x//CS,y//CS),[]).append((x,y,rad(k)))
def far(x,y,r):
    for i in range(int(x//CS)-2,int(x//CS)+3):
        for j in range(int(y//CS)-2,int(y//CS)+3):
            for o in grid.get((i,j),()):
                if (x-o[0])**2+(y-o[1])**2<(r+o[2])**2: return False
    return True
wnear=cv2.dilate(((C[...,0]==1)|(C[...,0]==2)).astype(np.uint8),np.ones((25,25),np.uint8)).astype(bool)
SPAWN=(1450,420)
def put(k,x,y): objs.append([k,int(x),int(y)]); grid.setdefault((int(x)//CS,int(y)//CS),[]).append((x,y,rad(k)))
TREES=['broad1','broad2','broad3','broad4','pine1','pine2']
# 北边密林
n=0
for _ in range(60000):
    x=rng.uniform(10,W-10); y=rng.uniform(20,135)
    if wnear[int(y),int(x)]: continue
    k=TREES[rng.integers(6)]
    if far(x,y,rad(k)*0.3): put(k,x,y); n+=1
print('北林',n)
# 平原上补几片树林（椭圆林区，中间稀、边缘自然）
GROVES=[(780,420,170,110),(2150,330,200,100),(1250,980,160,120),(2550,560,150,110),(1900,1300,180,110),(560,1380,150,90)]
n=0
for cx,cy,rx,ry in GROVES:
    for _ in range(6000):
        a=rng.uniform(0,6.283); r=rng.uniform(0,1)**0.6; x=cx+np.cos(a)*rx*r; y=cy+np.sin(a)*ry*r
        if not(20<x<W-20 and 140<y<H-20) or wnear[int(y),int(x)] or (x-SPAWN[0])**2+(y-SPAWN[1])**2<160**2: continue
        k=TREES[rng.integers(6)] if rng.random()<0.8 else ['bushL1','bushL2','bushM1'][rng.integers(3)]
        if far(x,y,rad(k)): put(k,x,y); n+=1
print('新树林',n)
used={k for k,_,_ in objs}
# 区域：原 rmap（64×64，每格 50）切出对应行，并改名
RN={'西凉':'翠绿平原','幽州·塞外':'翠绿平原','北方草原':'翠绿平原','中原':'翠绿平原','蜀':'迷雾森林','江南':'水乡湿地'}
names=['翠绿平原','迷雾森林','水乡湿地']
rm=np.array(J['rmap']).reshape(64,64)[Y0//50:(Y0+H)//50]
rm2=np.vectorize(lambda i:names.index(RN[J['rnames'][i]]))(rm)
wj={'WW':W,'WH':H,'HD':HD,'stage':'翠绿之地','tiles':{'T':T,'list':tiles},'size':{k:SZ[k] for k in used},'coll_r':J['coll_r'],'objs':objs,
    'rnames':names,'rmap':rm2.flatten().tolist(),'rgrid':[64,rm2.shape[0]],'spawn':list(SPAWN),'ver':int(time.time())}
json.dump(wj,open(DATA+'world.json','w'),separators=(',',':'))
Image.fromarray(C).save(OUT+'coll.png',optimize=True)
print('ok',len(objs),tiles)
