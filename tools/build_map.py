"""3200x3200 世界：旧的 西凉/幽州(雪原)/江南 三块整块平移保留（地面、碰撞、物件都不变），
其余区域（北方草原、中原、蜀、新增雪原、新增江南）按规则生成；主河在新区域里接上；物件统一摆放并自检。
旧块来源：art_src/build/legacy_*（扩图前的成品）。输出：assets/map/g{x}{y}.jpg（2x2 分块）、coll.png、data/world.json。"""
import numpy as np, cv2, json, os, time
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=ROOT+'/art_src/map/'; BUILD=ROOT+'/art_src/build/'; OUT=ROOT+'/assets/map/'; DATA=ROOT+'/data/'
N=3200; HD=2; Wd=N*HD; T=1600
rng=np.random.default_rng(2026)
def sstep(x): x=np.clip(x,0,1); return x*x*(3-2*x)
def vnoise(cell,seed,w=N,h=N):
    g=np.random.default_rng(seed).random((h//cell+3,w//cell+3)).astype(np.float32)
    return cv2.resize(g,(g.shape[1]*cell,g.shape[0]*cell),interpolation=cv2.INTER_CUBIC)[:h,:w]
def fbm(cell,seed,oct=3,w=N,h=N):
    v=0;a=1;t=0
    for o in range(oct): v=v+a*vnoise(max(4,cell>>o),seed+o*13,w,h);t+=a;a*=.5
    v=v/t; return (v-v.mean())/(v.std()+1e-6)
def load(p): return cv2.cvtColor(cv2.imread(SRC+p),cv2.COLOR_BGR2RGB)
def seamless(t,S,band=.30):
    t=cv2.resize(t,(S,S),interpolation=cv2.INTER_AREA).astype(np.float32)
    U=np.roll(np.roll(t,S//2,0),S//2,1); ax=np.arange(S); d=np.minimum(ax,S-1-ax)/(S*band)
    w=(sstep(d)[:,None]*sstep(d)[None,:])[...,None]; return t*w+U*(1-w)
X,Y=np.meshgrid(np.arange(N,dtype=np.float32),np.arange(N,dtype=np.float32))
# ---------- 旧块 ----------
L=json.load(open(BUILD+'legacy_world.json'))
OG=np.concatenate([np.array(Image.open(BUILD+'legacy_ground_w.jpg').convert('RGB')),np.array(Image.open(BUILD+'legacy_ground.jpg').convert('RGB'))],1)
OC=np.array(Image.open(BUILD+'legacy_coll.png').convert('RGB'))[...,0]
# 名称, 源矩形(x0,y0,x1,y1), 目标左上, 需要羽化的内侧边
BLK=[('西凉',(0,0,1150,1300),(0,0),'RB'),('幽州·塞外',(1480,0,2560,1280),(2120,0),'LB'),('江南',(1480,1480,2560,2560),(2120,2120),'LT')]
FE=130
balpha=np.zeros((N,N),np.float32); bown=np.full((N,N),-1,np.int8)
wb=fbm(90,901,2)*45
for i,(nm,(sx0,sy0,sx1,sy1),(dx0,dy0),ed) in enumerate(BLK):
    w,h=sx1-sx0,sy1-sy0; ys,xs=np.mgrid[0:h,0:w].astype(np.float32)
    d=np.full((h,w),1e4,np.float32)
    if 'R' in ed: d=np.minimum(d,w-1-xs)
    if 'L' in ed: d=np.minimum(d,xs)
    if 'B' in ed: d=np.minimum(d,h-1-ys)
    if 'T' in ed: d=np.minimum(d,ys)
    a=sstep((d+wb[dy0:dy0+h,dx0:dx0+w]-40)/FE)
    balpha[dy0:dy0+h,dx0:dx0+w]=np.maximum(balpha[dy0:dy0+h,dx0:dx0+w],a)
    bown[dy0:dy0+h,dx0:dx0+w]=np.where(a>0.01,i,bown[dy0:dy0+h,dx0:dx0+w])
# ---------- 新区域的地貌权重 ----------
wx=fbm(420,31,3)*95; wy=fbm(420,32,3)*95; X2=X+wx; Y2=Y+wy
r_dry=sstep((1330-Y2)/130)*sstep((1100-X2)/130)
r_snow=sstep((1330-Y2)/130)*sstep((X2-1080)/130)
r_step=sstep((Y2-1290)/110)*sstep((1720-Y2)/140)*sstep((X2-1100)/140)
r_shu=sstep((Y2-1330)/130)*sstep((1180-X2)/150)
r_jn=sstep((X2-1450)/170)*sstep((Y2-1650)/170)
r_zy=np.full((N,N),0.28,np.float32)
RW=np.stack([r_dry,r_snow,r_step,r_zy,r_shu,r_jn]); RW=RW/RW.sum(0,keepdims=True)
RN=['西凉','幽州·塞外','北方草原','中原','蜀','江南']
# 区域编号（含旧块），给游戏里显示地名
reg=np.argmax(RW,0).astype(np.int8)
for i,b in enumerate(BLK): reg=np.where((bown==i)&(balpha>0.5),RN.index(b[0]),reg)
# ---------- 主河：雪原块底部 -> 江南块顶部 ----------
G=json.load(open(BUILD+'world.json'))
OFF=2120-1480+1280          # 旧草地/雪地局部 x -> 新世界 x
RS=np.load(BUILD+'snow_river.npy')
yy=np.arange(N,dtype=np.float32); xc=np.zeros(N,np.float32); hw=np.zeros(N,np.float32)
for y in range(0,1280):
    c=np.where(RS[y])[0]
    if len(c): xc[y]=c.mean()+OFF; hw[y]=(c.max()-c.min())/2+1
for y in range(2120,N):
    xc[y]=G['riverXc'][y-2120+200]+OFF; hw[y]=G['riverHw'][y-2120+200]
xb,hb,xe,he=xc[1279],hw[1279],xc[2120],hw[2120]
t_=np.clip((yy-1280)/840,0,1); mid=(yy>=1280)&(yy<2120)
xc[mid]=((1-sstep(t_))*xb+sstep(t_)*xe-150*np.sin(np.pi*t_)*np.sin(np.pi*t_*1.6+0.4))[mid]
hw[mid]=((1-t_)*hb+t_*he+4*np.sin(yy/90)*np.sin(np.pi*t_))[mid]
gap=(yy>=1060)&(yy<=2320)
wob=fbm(70,73,2)*0.07
dr=np.abs(X-xc[:,None])/hw[:,None]+wob
ford=sstep(1-np.abs(yy-1760)/46)[:,None]
pond=np.sqrt(((X-2170)/105)**2+((Y-2900)/62)**2)+wob*1.2      # 旧江南块左边被切掉的池塘补全
water=((dr<1.0)&gap[:,None])|(pond<1.0)
shallow=water&((dr>0.40)|(ford>0.5))&~(pond<0.66); deep=water&~shallow
def sdist(m):
    m=m.astype(np.uint8); return cv2.distanceTransform(m,cv2.DIST_L2,5)-cv2.distanceTransform(1-m,cv2.DIST_L2,5)
swd=sdist(water)
# ---------- 贴图 ----------
g=seamless(load('grass.png'),720); lum=g.mean(2,keepdims=True); g=lum+(g-lum)*0.82; g=g*np.array([1.03,1.0,0.90],np.float32)
TEX={'grass':g,'snow':seamless(load('snow.png'),720)*np.array([0.90,0.93,1.0],np.float32)*0.90,
     'dry':seamless(load('mountain_tex.png')[51:586,57:592],535),'water':seamless(load('water.png'),640),'shal':seamless(load('shallow.png'),640)}
MK={k:np.clip((vnoise(150,s)-.5)*2.2+.5,0,1) for k,s in (('grass',3),('snow',5),('dry',7),('water',8),('shal',9))}
def rows_up(a,y0,y1):   # 逻辑分辨率数组 -> 高清行段
    return cv2.resize(np.ascontiguousarray(a[y0//HD:y1//HD]).astype(np.float32),(Wd,y1-y0),interpolation=cv2.INTER_LINEAR)
def tex(k,y0,y1):
    t=TEX[k]; S=t.shape[0]; cols=np.arange(Wd); r=np.arange(y0,y1)
    a=t[r%S][:,cols%S]; b=t[(r+S//3+41)%S][:,(cols+S//2+97)%S]
    m=rows_up(MK[k],y0,y1)[...,None]; return a*(1-m)+b*m
lo=fbm(300,201,3)*0.075+fbm(120,203,2)*0.03
TINT={'step':None,'zy':np.array([1,1,1],np.float32),'shu':np.array([0.80,0.92,0.76],np.float32),'jn':np.array([0.93,1.0,0.98],np.float32)}
deepf=np.clip(swd/17,0,1)
out=np.zeros((Wd,Wd,3),np.uint8)
BH=640
for y0 in range(0,Wd,BH):
    y1=y0+BH; w_=[rows_up(RW[i],y0,y1)[...,None] for i in range(6)]
    gr=tex('grass',y0,y1); gl=gr.mean(2,keepdims=True)
    stp=(gl+(gr-gl)*0.65)*np.array([1.08,1.03,0.80],np.float32)
    col=gr*(w_[3]+w_[4]*TINT['shu']+w_[5]*TINT['jn'])+stp*w_[2]
    col+=tex('snow',y0,y1)*w_[1]+tex('dry',y0,y1)*w_[0]
    col*=(1+rows_up(lo,y0,y1))[...,None]
    # 河
    sw=rows_up(swd,y0,y1); wat=tex('water',y0,y1)*np.array([0.92,0.98,1.02],np.float32)*(1-0.1*rows_up(deepf,y0,y1)[...,None])
    sh=cv2.GaussianBlur(rows_up(shallow,y0,y1),(0,0),14)[...,None]
    wat=wat*(1-0.7*sh)+tex('shal',y0,y1)*0.7*sh
    bt=np.clip(1+sw/14,0,1)*((sw<=0)&(sw>-14)); col=col*(1-0.45*bt[...,None])+np.array([92,104,66],np.float32)*0.45*bt[...,None]
    wm=(sw>0)[...,None]; col=np.where(wm,wat,col)
    # 旧块
    ba=rows_up(balpha,y0,y1)[...,None]
    old=np.zeros_like(col)
    for i,(nm,(sx0,sy0,sx1,sy1),(dx0,dy0),ed) in enumerate(BLK):
        a0,a1=max(y0,dy0*HD),min(y1,sy1*HD-sy0*HD+dy0*HD)
        if a1<=a0: continue
        old[a0-y0:a1-y0,dx0*HD:dx0*HD+(sx1-sx0)*HD]=OG[a0-dy0*HD+sy0*HD:a1-dy0*HD+sy0*HD,sx0*HD:sx1*HD]
    col=col*(1-ba)+old*ba
    out[y0:y1]=np.clip(col,0,255).astype(np.uint8)
    print('band',y0,flush=True)
for ty in range(2):
    for tx in range(2):
        Image.fromarray(out[ty*T*HD:(ty+1)*T*HD,tx*T*HD:(tx+1)*T*HD]).save(OUT+f'g{tx}{ty}.jpg',quality=70,optimize=True)
Image.fromarray(out[::16,::16]).save(BUILD+'preview_map.png')
del out
# ---------- 碰撞 ----------
C=np.zeros((N,N),np.uint8); C[deep]=1; C[shallow]=2
for i,(nm,(sx0,sy0,sx1,sy1),(dx0,dy0),ed) in enumerate(BLK):
    sl=(slice(dy0,dy0+sy1-sy0),slice(dx0,dx0+sx1-sx0)); m=balpha[sl]>0.5
    C[sl]=np.where(m,OC[sy0:sy1,sx0:sx1],C[sl])
# ---------- 物件 ----------
SP={}
for f in os.listdir(OUT+'sprites'):
    if f.endswith('.png'): im=Image.open(OUT+'sprites/'+f); SP[f[:-4]]=[im.width/HD,im.height/HD]
cr=L['coll_r']
rad=lambda k:max(5.0,0.36*SP[k][0])
objs=[]; grid={}; CS=48
def far(x,y,r):
    gx,gy=int(x//CS),int(y//CS)
    for i in range(gx-2,gx+3):
        for j in range(gy-2,gy+3):
            for o in grid.get((i,j),()):
                if (x-o[0])**2+(y-o[1])**2<(r+o[2])**2: return False
    return True
def put(k,x,y):
    objs.append([k,int(x),int(y)]); grid.setdefault((int(x//CS),int(y//CS)),[]).append((x,y,rad(k)))
# 1) 旧块物件原样平移
for i,(nm,(sx0,sy0,sx1,sy1),(dx0,dy0),ed) in enumerate(BLK):
    for k,x,y in L['objs']:
        if sx0<=x<sx1 and sy0<=y<sy1:
            nx,ny=x-sx0+dx0,y-sy0+dy0
            if balpha[ny,nx]<=0.85 or k not in SP: continue
            if i==1 and RS[max(0,min(1479,y-6)):y+7,max(0,x-1280-int(rad(k))):x-1280+int(rad(k))+1].any(): continue
            if k=='mrock' and rng.random()<0.7: continue
            put(k,nx,ny)
nold=len(objs)
# 2) 新区域
SPAWN=(1500,1750)
wnear=cv2.dilate((C==1).astype(np.uint8)|(C==2),np.ones((25,25),np.uint8)).astype(bool)
fm=fbm(260,555,3); fm2=fbm(120,556,2)
def free(x,y): return balpha[y,x]<0.15 and not wnear[y,x] and (x-SPAWN[0])**2+(y-SPAWN[1])**2>140**2 and 30<x<N-30 and 30<y<N-30
def blob(x,y,lst): return max(((x-cx)/rx)**2+((y-cy)/ry)**2 for cx,cy,rx,ry in lst)
SHU_F=[(330,2930,300,240),(860,2200,230,250),(820,3090,200,110)]
def inshu(x,y): return min(((x-cx)/rx)**2+((y-cy)/ry)**2 for cx,cy,rx,ry in SHU_F)+0.25*fm2[y,x]<1.0
RULES=[ # 区域, 素材, 数量, 条件
 (1,['nfir1','nfir2','nfir3','nbare1','nbare2','nbare3'],260,lambda x,y:fm[y,x]>0.45),
 (4,['broad1','broad2','broad3','broad4','pine1','pine2'],620,lambda x,y:inshu(x,y)),
 (3,['broad1','broad2','broad3','pine1'],22,lambda x,y:fm[y,x]>1.35),
 (2,['broad2','pine2'],10,lambda x,y:fm[y,x]>1.5),
 (5,['broad1','broad2','broad3','broad4','pine1','pine2'],200,lambda x,y:fm[y,x]>0.7 or fm2[y,x]>1.5),
 (1,['nbush1','nbush2','nbush3','nbush4','nbush5','nbush6'],60,lambda x,y:True),
 (4,['bushL1','bushL2','bushM1','bushM2','bushS1','bushS2'],240,lambda x,y:inshu(x,y) or fm[y,x]>0.6),
 (3,['bushM1','bushS1','bushS2'],50,lambda x,y:True),
 (2,['bushS1','bushS2'],30,lambda x,y:True),
 (5,['bushM1','bushM2','bushS1','bushS2'],60,lambda x,y:True),
 (1,['ntuft1','ntuft2','ntuft3','ntuft4','ntuft5','ntuft6'],120,lambda x,y:True),
 (2,['dry1','dry2','tuft1','tuft2'],230,lambda x,y:True),
 (3,['tuft1','tuft2','tuft3','tuft4','flowW','flowY'],150,lambda x,y:True),
 (4,['tuft1','tuft3','tuft4'],120,lambda x,y:True),
 (5,['tuft1','tuft2','tuft3','flowW'],120,lambda x,y:True)]
stat={}
for ri,names,cnt,cond in RULES:
    n=0
    for _ in range(cnt*80):
        x=int(rng.integers(30,N-30)); y=int(rng.integers(30,N-30))
        if reg[y,x]!=ri or not free(x,y) or not cond(x,y): continue
        k=names[int(rng.integers(len(names)))]
        if not far(x,y,rad(k)): continue
        put(k,x,y); n+=1
        if n>=cnt: break
    stat[RN[ri]+':'+names[0][:5]]=n
print('old objs',nold,'new',len(objs)-nold,stat)
# 灌木 -> 减速区
BUSH=('bush','nbush','wreed','wcat')
for k,x,y in objs[nold:]:
    if k.startswith(BUSH): cv2.circle(C,(x,y),int(SP[k][0]*0.38),3,-1) if C[y,x]==0 else None
Image.fromarray(np.dstack([C,np.zeros_like(C),np.zeros_like(C)])).save(OUT+'coll.png',optimize=True)
# ---------- 自检 ----------
ov=0
for k,x,y in objs:
    r=rad(k)
    for i in range(int(x//CS)-2,int(x//CS)+3):
        for j in range(int(y//CS)-2,int(y//CS)+3):
            for o in grid.get((i,j),()):
                if (o[0],o[1])!=(x,y) and (x-o[0])**2+(y-o[1])**2<(0.5*(r+o[2]))**2: ov+=1
onwater=sum(1 for k,x,y in objs if C[y,x]==1 and k in cr)
used=set(k for k,_,_ in objs); unused=sorted(set(SP)-used)
print('重叠对(半径一半内)',ov//2,'实体压在深水/崖上',onwater)
print('未使用素材',len(unused),unused)
# ---------- 输出 ----------
rm=reg[N//128::N//64,N//128::N//64][:64,:64]
wj={'WW':N,'WH':N,'HD':HD,'tiles':{'n':2,'T':T},'size':{k:SP[k] for k in used},'coll_r':cr,'objs':objs,'rnames':RN,'rmap':rm.flatten().tolist(),
    'spawn':list(SPAWN),'ver':int(time.time())}
json.dump(wj,open(DATA+'world.json','w'),separators=(',',':')); print('world ok',len(objs))
# 物件分布图
pv=np.array(Image.open(BUILD+'preview_map.png').convert('RGB'))   # 400x400
for k,x,y in objs:
    c_=(255,60,60) if k in cr and cr[k]>0 else ((255,220,60) if k.startswith(BUSH) else (60,255,255))
    pv[min(399,y//8),min(399,x//8)]=c_
Image.fromarray(pv).resize((800,800),Image.NEAREST).save(BUILD+'preview_objs.png')
