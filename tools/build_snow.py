"""北部雪地 + 与草地拼接。先跑 build_world.py（草地区 -> art_src/build/），再跑本脚本。
最终输出：assets/map/ground.jpg、coll.png、sprites/n*.png，data/world.json（世界 1280 x 2560，北雪南草）。"""
import numpy as np, cv2, json, os
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=ROOT+'/art_src/map/'; BUILD=ROOT+'/art_src/build/'; OUT=ROOT+'/assets/map/'; DATA=ROOT+'/data/'
WW=1280; HD=2; SH=1480; OV=200; W2=WW*HD; H2=SH*HD   # 雪地区 1480 行，最下面 200 行与草地重叠做过渡
rng=np.random.default_rng(23)
def sstep(x): x=np.clip(x,0,1); return x*x*(3-2*x)
def load(p): return cv2.cvtColor(cv2.imread(SRC+p),cv2.COLOR_BGR2RGB)
def vnoise(cell,seed,w,h):
    g=np.random.default_rng(seed).random((h//cell+3,w//cell+3)).astype(np.float32)
    return cv2.resize(g,(g.shape[1]*cell,g.shape[0]*cell),interpolation=cv2.INTER_CUBIC)[:h,:w]
def fbm(cell,seed,oct,w,h):
    v=0;a=1;tot=0
    for o in range(oct): v=v+a*vnoise(max(4,cell>>o),seed+o*13,w,h);tot+=a;a*=.5
    v=v/tot; return (v-v.mean())/(v.std()+1e-6)
def sdist(m):
    m=m.astype(np.uint8); return cv2.distanceTransform(m,cv2.DIST_L2,5)-cv2.distanceTransform(1-m,cv2.DIST_L2,5)
def seamless(t,S2,band=.30):
    t=cv2.resize(t,(S2,S2),interpolation=cv2.INTER_AREA).astype(np.float32)
    U=np.roll(np.roll(t,S2//2,0),S2//2,1)
    ax=np.arange(S2); d=np.minimum(ax,S2-1-ax)/(S2*band)
    w=(sstep(d)[:,None]*sstep(d)[None,:])[...,None]
    return t*w+U*(1-w)
def world(R,ox,oy,S,W,H):
    big=np.tile(R,(H//S+3,W//S+3,1)); big=np.roll(np.roll(big,oy,0),ox,1); return big[:H,:W]
def two_layer(R,seed,S):
    m=np.clip((vnoise(300,seed,W2,H2)-.5)*2.2+.5,0,1)[...,None]
    return world(R,0,0,S,W2,H2)*(1-m)+world(R,S//2+97,S//3+41,S,W2,H2)*m
gw=json.load(open(BUILD+'world.json'))
# ---------- 地面 ----------
snow=two_layer(seamless(load('snow.png'),720),5,720)
snow=snow*np.array([0.90,0.93,1.0],np.float32)*0.90          # 压暗、偏冷，别白得发光
ice=two_layer(seamless(load('snow_water.png'),640),8,640)
ice=ice*np.array([1.0,1.0,1.02],np.float32)
# 河（接草地的河继续向北）
yy=np.arange(SH,dtype=np.float32); yg=yy-1280
E=np.exp(-np.abs(yg)/150)
rn=vnoise(160,57,SH,8)[0]; rn=(rn-rn.mean())/(rn.std()+1e-6)
xc=0.75*WW+110*np.sin(yg/210+0.6)+45*np.sin(yg/83+1.7); xc=xc+(gw['riverTop'][0]-(0.75*WW+110*np.sin(.6)+45*np.sin(1.7)))*E+30*rn*(1-E)
hwf=30+9*np.sin(yg/140+2.0); hw=hwf+(gw['riverTop'][1]-(30+9*np.sin(2.0)))*E+5*rn*(1-E)
Y,X=np.mgrid[0:SH,0:WW].astype(np.float32)
wob=fbm(70,73,2,WW,SH)*0.07
dw=np.abs(X-xc[:,None])/hw[:,None]+wob
water=dw<1.0
ford=np.zeros(SH,np.float32)
for c0 in (430,940): ford=np.maximum(ford,sstep(1-np.abs(yy-c0)/46))
shallow=water&((dw>0.40)|(ford[:,None]>0.5)); deep=water&~shallow
swd=sdist(water)
def up(a,o=cv2.INTER_LINEAR): return cv2.resize(a.astype(np.float32),(W2,H2),interpolation=o)
swdH=up(swd)*HD; waterH=up(water)>0.5; shallowH=up(shallow)>0.5
lo=fbm(300,201,3,W2,H2); mid=fbm(120,203,2,W2,H2)
base=snow*(1+0.05*lo[...,None]+0.025*mid[...,None])
bank=(swdH<=0)&(swdH>-14); bt=np.clip(1-(-swdH)/14,0,1)[...,None]
base=np.where(bank[...,None],base*(1-0.32*bt)+np.array([118,138,164],np.float32)*0.32*bt,base)
deepf=np.clip(swdH/34,0,1)[...,None]
wat=ice*(1-0.08*deepf)
et=np.clip(1-swdH/14,0,1)[...,None]**1.6
wat=wat*(1-0.5*et)+np.array([226,238,248],np.float32)*0.5*et
shs=cv2.GaussianBlur(shallowH.astype(np.float32),(0,0),14)[...,None]
wat=wat*(1-0.45*shs)+(ice*0.5+np.array([200,222,238],np.float32)*0.5)*0.45*shs
base=np.where(waterH[...,None],wat,base)
SG=np.clip(base,0,255).astype(np.uint8); del base,snow,ice,wat
print('snow ground ok')
# ---------- 过渡掩码（0 雪 .. 1 草），只在最下面 200 行 ----------
s_=np.clip((yy-1280)/OV,0,1)[:,None]
M=sstep(np.clip((s_-0.5)*2.0+0.5+0.45*fbm(50,301,3,WW,SH)*np.sin(np.pi*s_),0,1)).astype(np.float32)
M[:1280]=0
# ---------- 精灵 ----------
def extract(fn,minarea,n,split=627):
    T=load(fn).astype(np.float32); r,g,b=T[...,0],T[...,1],T[...,2]
    al=np.clip(1-((np.minimum(r,b)-g)-60)/80,0,1)
    hard=((np.minimum(r,b)-g)<70).astype(np.uint8)
    k,lab,st,_=cv2.connectedComponentsWithStats(cv2.dilate(hard,np.ones((9,9),np.uint8)))
    comps=[(i,st[i]) for i in range(1,k) if st[i][4]>minarea]
    comps.sort(key=lambda c:(int((c[1][1]+c[1][3]/2)//split),c[1][0]))
    print(fn,len(comps)); assert len(comps)==n
    out=[]
    for i,s in comps:
        x,y,w,h=s[:4]; p=3
        ya,yb,xa,xb=max(0,y-p),min(T.shape[0],y+h+p),max(0,x-p),min(T.shape[1],x+w+p)
        rgb=T[ya:yb,xa:xb].copy(); a=al[ya:yb,xa:xb].copy()
        a=a*cv2.dilate((lab[ya:yb,xa:xb]==i).astype(np.uint8),np.ones((9,9),np.uint8))
        e=a<.98
        rgb[...,0]=np.where(e,np.minimum(rgb[...,0],rgb[...,1]+18),rgb[...,0]); rgb[...,2]=np.where(e,np.minimum(rgb[...,2],rgb[...,1]+18),rgb[...,2])
        out.append(np.dstack([rgb,a*255]).astype(np.uint8))
    return out
def to_sprite(arr,h,sat=1.0,val=1.0,tint=(1,1,1)):
    ys,xs=np.where(arr[...,3]>30); arr=arr[ys.min():ys.max()+1,xs.min():xs.max()+1]
    H,W=arr.shape[:2]; s=h*HD/H; nw,nh=round(W*s),round(H*s)
    rgbf=arr[...,:3].astype(np.float32); l=rgbf.mean(2,keepdims=True); rgbf=(l+(rgbf-l)*sat)*val*np.array(tint,np.float32)
    a=arr[...,3:4].astype(np.float32)/255.; pm=rgbf*a
    rr=cv2.resize(np.dstack([pm,a]),(nw,nh),interpolation=cv2.INTER_AREA)
    a2=rr[...,3:4]; rgb=rr[...,:3]/np.maximum(a2,1e-3)
    return Image.fromarray(np.dstack([np.clip(rgb,0,255),np.clip(a2*255,0,255)]).astype(np.uint8))
spr={}
tn=['nbare1','nfir1','nfir2','nbare2','nbare3','nfir3']; th=[84,92,98,68,76,74]
for n,a in zip(tn,extract('snow_trees.png',12000,6)): spr[n]=to_sprite(a,h=th[tn.index(n)],sat=.95,val=.93,tint=(.97,.99,1.03))
def snowify(src,name,cap,seed,dry=False):
    im=np.array(Image.open(OUT+'sprites/'+src+'.png').convert('RGBA')).astype(np.float32); H,W=im.shape[:2]
    ys=np.arange(H)[:,None]/H; nz=vnoise(5,seed,W,H)
    w=np.clip((np.clip(0.6-ys,0,None)/0.6)**.8*cap*(0.6+0.8*nz),0,1)[...,None]
    rgb=im[...,:3]; l=rgb.mean(2,keepdims=True); rgb=(l+(rgb-l)*(0.55 if dry else 0.8))*(np.array([1.0,0.97,0.88]) if dry else np.array([0.95,0.98,1.04]))
    rgb=rgb*(1-w)+np.array([232,240,250],np.float32)*w
    spr[name]=Image.fromarray(np.dstack([np.clip(rgb,0,255),im[...,3]]).astype(np.uint8))
for k in ['bushL1','bushL2','bushM1','bushM2','bushS1','bushS2']: snowify(k,'n'+k,.85,sum(map(ord,k))%997)
for k in ['spire1','spire2','rmid1','rmid2','rsmall1','rsmall2']: snowify(k,'n'+k,.75,sum(map(ord,k))%991)
for k in ['dry1','dry2','tuft1','tuft2']: snowify(k,'n'+k,.35,sum(map(ord,k))%983,dry=True)
sizes={n:[im.width/HD,im.height/HD] for n,im in spr.items()}
# ---------- 摆放 ----------
objs=[]; grid={}; CS=40
def far(x,y,r,k=1.0):
    gx,gy=int(x//CS),int(y//CS)
    for i in range(gx-2,gx+3):
        for j in range(gy-2,gy+3):
            for o in grid.get((i,j),()):
                if (x-o[0])**2+(y-o[1])**2<(r+k*o[2])**2: return False
    return True
def put(k,x,y,r): objs.append([k,x,y]); grid.setdefault((int(x//CS),int(y//CS)),[]).append((x,y,r))
def okpos(x,y,m=14):
    if x<24 or y<24 or x>WW-24 or y>SH-24 or M[y,x]>0.02: return False
    return not water[max(0,y-m):y+m,max(0,x-m):x+m].any()
forest=fbm(210,111,3,WW,SH); dens=fbm(120,141,2,WW,SH)
placed={'spire':0,'rmid':0,'rsmall':0}; quota={'spire':8,'rmid':30,'rsmall':40}; rad={'spire':20,'rmid':14,'rsmall':8}
for _ in range(60000):
    kind=['spire','rmid','rsmall'][int(rng.integers(3))]
    if placed[kind]>=quota[kind]:
        if all(placed[q]>=quota[q] for q in quota): break
        continue
    x,y=[int(v) for v in rng.integers(30,[WW-30,SH-30])]
    if not okpos(x,y,22) or not far(x,y,rad[kind]+(24 if kind=='spire' else 6)): continue
    put('n'+kind+str(1+int(rng.integers(2))),x,y,rad[kind]); placed[kind]+=1
for _ in range(20000):
    x,y=[int(v) for v in rng.integers(30,[WW-30,SH-30])]
    if not okpos(x,y,18): continue
    f=forest[y,x]
    if f<0.7 and rng.random()<.992: continue
    if f<1.2 and rng.random()<.55: continue
    if not far(x,y,22): continue
    put(tn[int(rng.integers(6))],x,y,22)
nt=len(objs)
for _ in range(26000):
    x,y=[int(v) for v in rng.integers(20,[WW-20,SH-20])]
    if not okpos(x,y,10): continue
    p=np.clip(0.17+0.22*forest[y,x]+0.15*dens[y,x],0.04,0.9)
    if rng.random()>p: continue
    kind=['L','M','M','S','S','S'][int(rng.integers(6))]; r={'L':17,'M':12,'S':8}[kind]
    if not far(x,y,r): continue
    put('nbush'+kind+str(1+int(rng.integers(2))),x,y,r)
nb=len(objs)
for _ in range(30000):
    x,y=[int(v) for v in rng.integers(16,[WW-16,SH-16])]
    if M[y,x]>0.02 or water[y,x] or swd[y,x]>-4: continue
    p=np.clip(0.10+0.08*dens[y,x]-0.06*forest[y,x],0.02,0.3)
    if rng.random()>p or not far(x,y,12,.3): continue
    put(['ndry1','ndry2','ntuft1','ntuft2'][int(rng.integers(4))],x,y,6)
    if len(objs)-nb>500: break
print('snow objs',len(objs),'trees',nt)
# ---------- 拼接 ----------
GH=np.array(Image.open(BUILD+'ground_grass.jpg').convert('RGB'))
MH=cv2.resize(M[1280:],(W2,OV*HD),interpolation=cv2.INTER_LINEAR)[...,None]
out=np.zeros((H2+(1280-OV)*HD,W2,3),np.uint8)
out[:2560]=SG[:2560]
zone=SG[2560:H2].astype(np.float32)*(1-MH)+GH[:OV*HD].astype(np.float32)*MH
out[2560:H2]=np.clip(zone,0,255).astype(np.uint8)
out[H2:]=GH[OV*HD:]
Image.fromarray(out).save(OUT+'ground.jpg',quality=70,optimize=True)
print('ground',out.shape)
# 碰撞
col=np.zeros((SH,WW,3),np.uint8); col[...,0]=0   # 冰河冻住了，可以直接走过去
gc=np.array(Image.open(BUILD+'coll.png').convert('RGB'))
C=np.zeros((2560,WW,3),np.uint8); C[:1280]=col[:1280]
z=np.where((M[1280:]>=0.5)[...,None],gc[:OV],col[1280:]); C[1280:1280+OV]=z
C[1280+OV:]=gc[OV:]
Image.fromarray(C).save(OUT+'coll.png',optimize=True)
for n,im in spr.items(): im.save(OUT+'sprites/'+n+'.png',optimize=True)
# 物件合并
allo=[o for o in objs if not (o[2]>=1280 and M[o[2],o[1]]>=0.5)]   # 雪物件在过渡带只保留偏雪的位置
for k,x,y in gw['objs']:
    if y<OV and M[1280+y,x]<0.5: continue
    allo.append([k,x,y+1280])
size={**gw['size'],**sizes}
cr={**gw['coll_r'],'nbare1':6,'nbare2':6,'nbare3':6,'nfir1':5,'nfir2':5,'nfir3':5,'nspire1':17,'nspire2':15,'nrmid1':12,'nrmid2':11,'nrsmall1':5,'nrsmall2':5,'nbushL1':6,'nbushL2':6}
b=gw['bridge']; bw=b['walk']
wj={'WW':WW,'WH':2560,'HD':HD,'size':size,'coll_r':cr,'objs':allo,'bridge':{'x':b['x'],'y':b['y']+1280,'walk':[bw[0],bw[1]+1280,bw[2],bw[3]+1280]},'snowY':1280,'ver':int(__import__('time').time())}
json.dump(wj,open(DATA+'world.json','w'),separators=(',',':')); print('world ok',len(allo))
