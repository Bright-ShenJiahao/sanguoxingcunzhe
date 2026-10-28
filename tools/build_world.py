import numpy as np, cv2, base64, json, io, os, sys
MODE=os.environ.get('MODE','grass')
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=os.path.join(ROOT,'art_src','map')+os.sep
OUT=os.path.join(ROOT,'assets','map')+os.sep
DATA=os.path.join(ROOT,'data')+os.sep
BUILD=os.path.join(ROOT,'art_src','build')+os.sep   # 中间产物（草地区），再由 build_snow.py 拼接成最终世界
os.makedirs(BUILD,exist_ok=True)
os.makedirs(OUT+'sprites',exist_ok=True)
def b64(im,fmt='PNG',q=88):
    b=io.BytesIO()
    if fmt=='JPEG': im.convert('RGB').save(b,'JPEG',quality=q); return 'data:image/jpeg;base64,'+base64.b64encode(b.getvalue()).decode()
    im.save(b,'PNG',optimize=True); return 'data:image/png;base64,'+base64.b64encode(b.getvalue()).decode()
def sstep(x): x=np.clip(x,0,1); return x*x*(3-2*x)
WW=1280; HD=2; WH=WW*HD
rng=np.random.default_rng(11)
def load(p): return cv2.cvtColor(cv2.imread(SRC+p),cv2.COLOR_BGR2RGB)
def vnoise(cell,seed,w=WW):
    r_=np.random.default_rng(seed); g_=r_.random((w//cell+3,w//cell+3)).astype(np.float32)
    return cv2.resize(g_,(g_.shape[1]*cell,g_.shape[0]*cell),interpolation=cv2.INTER_CUBIC)[:w,:w]
def fbm(cell,seed,oct=3,w=WW):
    v=0;a=1;tot=0
    for o in range(oct):
        v=v+a*vnoise(max(4,cell>>o),seed+o*13,w);tot+=a;a*=.5
    v=v/tot; return (v-v.mean())/(v.std()+1e-6)
def sdist(m):
    m=m.astype(np.uint8); return cv2.distanceTransform(m,cv2.DIST_L2,5)-cv2.distanceTransform(1-m,cv2.DIST_L2,5)
# ---------- 贴图 -> 无缝世界（高清 2560）----------
S=720
def seamless(t,S2,band=.30):
    t=cv2.resize(t,(S2,S2),interpolation=cv2.INTER_AREA).astype(np.float32)
    U=np.roll(np.roll(t,S2//2,0),S2//2,1)
    ax=np.arange(S2); d=np.minimum(ax,S2-1-ax)/(S2*band)
    w=(sstep(d)[:,None]*sstep(d)[None,:])[...,None]
    return t*w+U*(1-w)
def world(Rr,ox=0,oy=0,S2=S):
    big=np.tile(Rr,(WH//S2+3,WH//S2+3,1)); big=np.roll(np.roll(big,oy,0),ox,1); return big[:WH,:WH]
def two_layer(Rr,seed,S2=S):
    m=np.clip((vnoise(300,seed,WH)-.5)*2.2+.5,0,1)[...,None]
    return world(Rr,0,0,S2)*(1-m)+world(Rr,S2//2+97,S2//3+41,S2)*m
grass=two_layer(seamless(load('grass.png'),S),3)
# 调色：偏黄、降饱和（群英传的春草）
lum=grass.mean(2,keepdims=True); grass=lum+(grass-lum)*0.82; grass=grass*np.array([1.03,1.0,0.90],np.float32)
water_t=two_layer(seamless(load('water.png'),640),7,640)
shal_t=two_layer(seamless(load('shallow.png'),640),9,640)
if MODE=='mud':
    lm=grass.mean(2,keepdims=True); lm=(lm-lm.mean())/(lm.std()+1e-6)
    t_=np.clip(0.5+0.28*lm,0,1)
    dk=np.array([66,78,36],np.float32); lt=np.array([132,140,72],np.float32)
    TM=t_
    grass=dk*(1-t_)+lt*t_
print('tiles ok')
n1=fbm(260,11,3); n2=fbm(200,29,2)
n3=fbm(330,37,2)
path=((np.abs(n1)<0.06)|(np.abs(n3)<0.05)).astype(np.uint8)
path=cv2.morphologyEx(path,cv2.MORPH_CLOSE,np.ones((7,7),np.uint8))
YB=630; BW=176
Y,X=np.mgrid[0:WW,0:WW].astype(np.float32); yy=np.arange(WW,dtype=np.float32)
xc_=0.75*WW+110*np.sin(yy/210+0.6)+45*np.sin(yy/83+1.7)+30*fbm(160,57,2)[0]
BX=int(round(xc_[YB]))
path[YB-3:YB+4,BX-BW//2-120:BX+BW//2+120]=1
path=cv2.morphologyEx(path,cv2.MORPH_CLOSE,np.ones((7,7),np.uint8))
sd=sdist(path)+fbm(22,41,2)*1.8
Y,X=np.mgrid[0:WW,0:WW].astype(np.float32); yy=np.arange(WW,dtype=np.float32)
xc=0.75*WW+110*np.sin(yy/210+0.6)+45*np.sin(yy/83+1.7)+30*fbm(160,57,2)[0]
hw=30+9*np.sin(yy/140+2.0)+5*fbm(120,61,2)[0]
hw=hw*(1+1.5*sstep((yy-700)/420))   # 南段大河
dr=np.abs(X-xc[:,None])/hw[:,None]
ford=np.zeros(WW,np.float32)
for c0 in [330,850,985]: ford=np.maximum(ford,sstep(1-np.abs(yy-c0)/46))
pe=np.sqrt(((X-250)/105)**2+((Y-980)/62)**2); wob=fbm(70,73,2)*0.07
se=np.sqrt(((X-1310)/450)**2+((Y-1310)/380)**2)+wob*1.6   # 东南角的大海
dw=np.minimum(np.minimum(dr+wob,pe+wob*1.2),se); water=dw<1.0
assert not water[WW//2-90:WW//2+90,WW//2-90:WW//2+90].any()
shallow=water&(((dr+wob)>0.40)&((dr+wob)<1.0)|((pe+wob*1.2)>0.66)&((pe+wob*1.2)<1.0)|((ford[:,None]>0.5)&(dr+wob<1.0))|((se>0.80)&(se<1.0))); deep=water&~shallow
swd=sdist(water)
def up(a,order=cv2.INTER_LINEAR): return cv2.resize(a.astype(np.float32),(WH,WH),interpolation=order)
sdH=up(sd)*HD; swdH=up(swd)*HD; waterH=up(water,cv2.INTER_LINEAR)>0.5; shallowH=up(shallow)>0.5
nH=fbm(14,91,2,WH)
# ---------- 地面：一张草底 + 大色块明暗 + 软边草径 ----------
base=grass
lo=fbm(300,201,3,WH); mid=fbm(120,203,2,WH)
Mm=None
base=base*(1+0.075*lo[...,None]+0.03*mid[...,None])
pale=sstep((fbm(260,207,3,WH)-0.85)/0.9)[...,None]*(0.0 if MODE=='mud' else 1.0)      # 偏灰青的浅色斑
base=base*(1-0.26*pale)+np.array([168,196,150],np.float32)*0.26*pale
yel=sstep((fbm(220,211,3,WH)-0.95)/0.9)[...,None]*(0.0 if MODE=='mud' else 1.0)       # 偏黄的枯草斑
base=base*(1-0.30*yel)+np.array([176,184,92],np.float32)*0.30*yel
if MODE=='mud':
    Mm=sstep((fbm(210,401,3,WH)-0.05)/0.75)[...,None]
    mc=np.array([96,74,48],np.float32)*(1-TM)+np.array([154,122,82],np.float32)*TM
    mc=mc*(1+0.05*fbm(40,403,2,WH)[...,None])
    base=base*(1-0.88*Mm)+mc*0.88*Mm
# 草径：踩亮的黄绿软边带
pa=np.clip(sdH/10+0.5,0,1); pa=cv2.GaussianBlur(pa,(0,0),3.2)*np.clip(0.8+0.3*fbm(60,215,2,WH),0.4,1)
pa=np.clip(pa,0,1)[...,None]
gl=base.mean(2,keepdims=True)/max(1,base.mean())
pcol=(np.array([150,128,92],np.float32) if MODE=='mud' else np.array([188,192,106],np.float32))*(0.82+0.3*gl)
base=base*(1-0.7*pa)+pcol*0.7*pa
pamask=cv2.resize(pa[...,0],(WW,WW),interpolation=cv2.INTER_AREA)
if MODE=='mud':
    pud0=sstep((fbm(150,301,3,WH)-0.75)/0.3)*Mm[...,0]**2; pud0=cv2.GaussianBlur(pud0,(0,0),3.0); pud=pud0[...,None]*(1-pa)
    halo=cv2.GaussianBlur(pud[...,0],(0,0),7)[...,None]
    base=base*(1-0.28*halo)
    dep=np.clip(0.5+0.5*fbm(60,311,2,WH),0,1)[...,None]
    pcl=(np.array([104,120,126],np.float32)*(1-dep)+np.array([62,78,88],np.float32)*dep)*(0.85+0.25*gl)
    rim=np.clip(pud*2,0,1)
    base=base*(1-0.86*pud)+pcl*0.86*pud
pudG=np.zeros((WH,WH),np.float32)
if MODE!='mud':
    pg=sstep((fbm(190,321,2,WH)-1.75)/0.35)*np.clip((-swdH-30)/30,0,1)*np.clip(1-pa[...,0]*2,0,1)
    pg=cv2.GaussianBlur(pg,(0,0),5.0); pg=np.clip((pg-0.25)/0.5,0,1); pg=sstep(pg); pudG=pg
    halo=cv2.GaussianBlur(pg,(0,0),10)[...,None]
    base=base*(1-0.30*halo)+np.array([104,92,58],np.float32)*0.30*halo*(0.85+0.3*gl)
    dep=np.clip(0.5+0.5*fbm(60,311,2,WH),0,1)[...,None]
    pcl=(np.array([100,134,134],np.float32)*(1-dep)+np.array([56,92,104],np.float32)*dep)*(0.88+0.22*gl)
    base=base*(1-0.88*pg[...,None])+pcl*0.88*pg[...,None]
# 河岸：外侧湿暗土 + 内侧浅滩渐变 + 白浪沫
bank=(swdH<=0)&(swdH>-14); bt=np.clip(1-(-swdH)/14,0,1)[...,None]
base=np.where(bank[...,None],base*(1-0.45*bt)+np.array([92,104,66],np.float32)*0.45*bt,base)
deepf=np.clip(swdH/34,0,1)[...,None]
wat=water_t*np.array([0.92,0.98,1.02],np.float32)*(1-0.10*deepf)
edgec=np.array([108,176,176],np.float32)
et=np.clip(1-swdH/14,0,1)[...,None]**1.6
wat=wat*(1-0.62*et)+shal_t*0.62*et
shal=shal_t*np.array([1.0,1.0,1.0],np.float32)
shs=cv2.GaussianBlur(shallowH.astype(np.float32),(0,0),14)[...,None]
wat=wat*(1-shs)+shal*shs
base=np.where(waterH[...,None],wat,base)
foam=(swdH>0)&(swdH<=7)
fa=np.clip(1-swdH/7,0,1)*np.clip(0.7+0.7*nH,0,1)
base=np.where(foam[...,None],base*(1-0.9*fa[...,None])+np.array([250,252,250],np.float32)*0.9*fa[...,None],base)
ring2=(swdH>10)&(swdH<15)&(~shallowH)&(nH>0.2); base=np.where(ring2[...,None],base*0.82+np.array([236,246,248],np.float32)*0.18,base)
bsrc=cv2.cvtColor(cv2.imread(SRC+'bridge.png'),cv2.COLOR_BGR2RGB).astype(np.float32)
rr_,gg_,bb_=bsrc[...,0],bsrc[...,1],bsrc[...,2]
bal=np.clip(1-((np.minimum(rr_,bb_)-gg_)-60)/80,0,1)
bh_=((np.minimum(rr_,bb_)-gg_)<70).astype(np.uint8); bh_=cv2.morphologyEx(bh_,cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
kk,lab_,st_,_=cv2.connectedComponentsWithStats(cv2.dilate(bh_,np.ones((9,9),np.uint8)))
ii=1+int(np.argmax(st_[1:,4])); bx,by,bw_,bh2=st_[ii][:4]
msk=cv2.dilate((lab_==ii).astype(np.uint8),np.ones((5,5),np.uint8)).astype(np.float32); bal=bal*msk
e_=bal<.98; bsrc[...,0]=np.where(e_,np.minimum(bsrc[...,0],bsrc[...,1]+18),bsrc[...,0]); bsrc[...,2]=np.where(e_,np.minimum(bsrc[...,2],bsrc[...,1]+18),bsrc[...,2])
bsrc=bsrc[by:by+bh2,bx:bx+bw_]; bal=bal[by:by+bh2,bx:bx+bw_]
sc=BW*HD/bw_; nw,nh=round(bw_*sc),round(bh2*sc)
pm=cv2.resize(np.dstack([bsrc*bal[...,None],bal]),(nw,nh),interpolation=cv2.INTER_AREA)
ba=pm[...,3:4]; brgb=pm[...,:3]/np.maximum(ba,1e-3)
brgb=brgb*0.94
yband=362  # 桥面行走带中心（原图）
X0=int(BX*HD-nw/2); Y0=int(YB*HD-(yband-by)*sc)
sh_=np.zeros((WH,WH),np.float32); shy,shx=int(10*HD*.6),int(-8*HD*.6)
ya0,yb0=max(0,Y0+shy),min(WH,Y0+shy+nh); xa0,xb0=max(0,X0+shx),min(WH,X0+shx+nw)
sh_[ya0:yb0,xa0:xb0]=ba[ya0-Y0-shy:yb0-Y0-shy,xa0-X0-shx:xb0-X0-shx,0]
sh_=cv2.GaussianBlur(sh_,(0,0),5)[...,None]
base=base*(1-0.38*sh_)
ya,yb_=max(0,Y0),min(WH,Y0+nh); xa,xb_=max(0,X0),min(WH,X0+nw)
sub=base[ya:yb_,xa:xb_]; aa=ba[ya-Y0:yb_-Y0,xa-X0:xb_-X0]; rg=brgb[ya-Y0:yb_-Y0,xa-X0:xb_-X0]
base[ya:yb_,xa:xb_]=sub*(1-aa)+rg*aa
k_=1/sc*HD   # 原图像素 -> 逻辑像素 的倒数用不到
lk=sc/HD     # 原图像素 -> 逻辑像素
wx0=BX-nw/HD/2+(130-bx)*lk; wx1=BX-nw/HD/2+(1870-bx)*lk
wy0=YB-(yband-290)*lk; wy1=YB+(445-yband)*lk
print('bridge walk',wx0,wx1,wy0,wy1)
G=np.clip(base,0,255).astype(np.uint8)
del grass,water_t,shal_t,base
if MODE=='mud':
    Image.fromarray(G).save(OUT+'ground_mud.jpg',quality=84); print('mud ok'); sys.exit()
Image.fromarray(G).save(BUILD+'ground_grass.jpg',quality=88)
col=np.zeros((WW,WW,3),np.uint8); col[...,0]=deep*1+shallow*2
pudL=cv2.resize(pudG,(WW,WW),interpolation=cv2.INTER_AREA)>0.5
col[...,0]=np.where(pudL&(col[...,0]==0),2,col[...,0])
col[int(wy0):int(wy1),int(wx0):int(wx1),0]=0
print('ground ok')
# ---------- 精灵抠图 ----------
def extract(fn,minarea,n,split=627):
    T=load(fn).astype(np.float32); r,g,b=T[...,0],T[...,1],T[...,2]
    al=np.clip(1-((np.minimum(r,b)-g)-60)/80,0,1)
    hard=((np.minimum(r,b)-g)<70).astype(np.uint8)
    hard=cv2.morphologyEx(hard,cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
    k,lab,st,_=cv2.connectedComponentsWithStats(cv2.dilate(hard,np.ones((9,9),np.uint8)))
    comps=[(i,st[i]) for i in range(1,k) if st[i][4]>minarea]
    comps.sort(key=lambda c:(int((c[1][1]+c[1][3]/2)//split),c[1][0]))
    print(fn,len(comps),[tuple(c[1][:4]) for c in comps])
    assert len(comps)==n
    out=[]
    for i,s_ in comps:
        x,y,w,h=s_[:4]; p=3
        ya,yb,xa,xb=max(0,y-p),min(T.shape[0],y+h+p),max(0,x-p),min(T.shape[1],x+w+p)
        rgb=T[ya:yb,xa:xb].copy(); a=al[ya:yb,xa:xb].copy()
        inside=cv2.dilate((lab[ya:yb,xa:xb]==i).astype(np.uint8),np.ones((5,5),np.uint8)); a=a*inside
        edge=a<.98
        rgb[...,0]=np.where(edge,np.minimum(rgb[...,0],rgb[...,1]+18),rgb[...,0]); rgb[...,2]=np.where(edge,np.minimum(rgb[...,2],rgb[...,1]+18),rgb[...,2])
        out.append(np.dstack([rgb,a*255]).astype(np.uint8))
    return out
def to_sprite(arr,h,sat=1.0,val=1.0,tint=(1,1,1)):
    ys,xs=np.where(arr[...,3]>30); arr=arr[ys.min():ys.max()+1,xs.min():xs.max()+1]
    H,W=arr.shape[:2]; s=h*HD/H; nw,nh=round(W*s),round(H*s)
    rgbf=arr[...,:3].astype(np.float32); l=rgbf.mean(2,keepdims=True); rgbf=(l+(rgbf-l)*sat)*val*np.array(tint,np.float32)
    pm=rgbf*(arr[...,3:4]/255.); a=arr[...,3:4].astype(np.float32)/255.
    rr=cv2.resize(np.dstack([pm,a]),(nw,nh),interpolation=cv2.INTER_AREA)
    a2=rr[...,3:4]; rgb=rr[...,:3]/np.maximum(a2,1e-3)
    return Image.fromarray(np.dstack([np.clip(rgb,0,255),np.clip(a2*255,0,255)]).astype(np.uint8))
spr={}
bn=['bushL1','bushM1','bushS1','bushL2','bushM2','bushS2']; bh=[44,29,21,42,30,20]
for n,a_,h in zip(bn,extract('bush.png',8000,6),bh): spr[n]=to_sprite(a_,h,.86,.9,(1.0,.99,.92))
tn=['broad1','broad2','pine1','broad3','broad4','pine2']; th=[80,88,92,64,74,72]
for n,a_,h in zip(tn,extract('trees.png',20000,6),th): spr[n]=to_sprite(a_,h,.84,.88,(1.0,.99,.92))
rn=['spire1','rmid1','rsmall1','spire2','rmid2','rsmall2']; rh=[74,32,14,68,30,15]
for n,a_,h in zip(rn,extract('rocks.png',5000,6),rh): spr[n]=to_sprite(a_,h,1.0,.96)
un=['tuft1','tuft2','tuft3','tuft4','flowW','flowY','dry1','dry2']; uh=[24,20,17,14,19,18,17,13]
for n,a_,h in zip(un,extract('tufts.png',3000,8),uh): spr[n]=to_sprite(a_,h,.88,.92,(1.0,.99,.9))
sizes={n:[im.width/HD,im.height/HD] for n,im in spr.items()}
print(sizes)
# ---------- 摆放 ----------
objs=[]
free_spawn=lambda x,y:(x-WW/2)**2+(y-WW/2)**2<95**2
def okpos(x,y,m=14):
    if abs(x-BX)<BW/2+10 and abs(y-YB)<26: return False
    if x<24 or y<24 or x>WW-24 or y>WW-24 or free_spawn(x,y): return False
    return not water[max(0,y-m):y+m,max(0,x-m):x+m].any()
forest=fbm(210,101,3); dens=fbm(120,131,2)
grid={}
CS=40
def far(x,y,r):
    gx,gy=int(x//CS),int(y//CS)
    for i in range(gx-2,gx+3):
        for j in range(gy-2,gy+3):
            for o in grid.get((i,j),()):
                if (x-o[0])**2+(y-o[1])**2<(r+o[2])**2: return False
    return True
def put(k,x,y,r):
    objs.append([k,x,y]); grid.setdefault((int(x//CS),int(y//CS)),[]).append((x,y,r))
# 岩石（地标，稀疏）
placed={'spire':0,'rmid':0,'rsmall':0}; quota={'spire':9,'rmid':32,'rsmall':44}; rad={'spire':20,'rmid':14,'rsmall':8}
for _ in range(60000):
    kind=['spire','rmid','rsmall'][int(rng.integers(3))]
    if placed[kind]>=quota[kind]: 
        if all(placed[q]>=quota[q] for q in quota): break
        continue
    x,y=[int(v) for v in rng.integers(30,WW-30,2)]
    if not okpos(x,y,22) or pamask[y,x]>0.15: continue
    if not far(x,y,rad[kind]+24 if kind=='spire' else rad[kind]+6): continue
    put(kind+str(1+int(rng.integers(2))),x,y,rad[kind]); placed[kind]+=1
# 树（成林）
tmap=['broad1','broad2','broad3','broad4','pine1','pine2']
for _ in range(16000):
    x,y=[int(v) for v in rng.integers(30,WW-30,2)]
    if not okpos(x,y,18) or pamask[y,x]>0.1: continue
    f=forest[y,x]
    if f<0.75 and rng.random()<.992: continue
    if f<1.3 and rng.random()<.55: continue
    if not far(x,y,22): continue
    put(tmap[int(rng.integers(6))],x,y,22)
ntree=len(objs)
# 灌木（铺满地表：密度场）
for _ in range(26000):
    x,y=[int(v) for v in rng.integers(20,WW-20,2)]
    if not okpos(x,y,10): continue
    p=np.clip(0.55+0.32*forest[y,x]+0.2*dens[y,x],0.06,0.98)
    if pamask[y,x]>0.2: p*=0.12
    if rng.random()>p: continue
    kind=['L','M','M','S','S','S'][int(rng.integers(6))]
    r={'L':17,'M':12,'S':8}[kind]
    if not far(x,y,r): continue
    put('bush'+kind+str(1+int(rng.integers(2))),x,y,r)
nb=len(objs)
def far2(x,y,r):
    gx,gy=int(x//CS),int(y//CS)
    for i in range(gx-2,gx+3):
        for j in range(gy-2,gy+3):
            for o in grid.get((i,j),()):
                if (x-o[0])**2+(y-o[1])**2<(r+0.3*o[2])**2: return False
    return True
for _ in range(40000):
    x,y=[int(v) for v in rng.integers(16,WW-16,2)]
    if (abs(x-BX)<BW/2+10 and abs(y-YB)<26) or free_spawn(x,y): continue
    if water[y,x]: continue
    if swd[y,x]>-4: continue
    p=np.clip(0.16+0.14*dens[y,x]-0.1*forest[y,x],0.02,0.5)
    if pamask[y,x]>0.2: p*=0.5
    if rng.random()>p: continue
    if not far2(x,y,12): continue
    put(['tuft1','tuft2','tuft3','tuft4','flowW','flowY','dry1','dry2'][int(rng.choice(8,p=[.2,.17,.16,.14,.08,.08,.1,.07]))],x,y,6)
    if len(objs)-nb>1000: break
nt=len(objs)-nb
stones=0
print('objs',len(objs),'trees',ntree,'tufts',nt,'stones',stones)
objs=[o for o in objs if not o[0].startswith('stone')]
if MODE!='mud': objs=[o for o in objs if not pudL[int(o[2]),int(o[1])]]
for _n in [n for n in spr if n.startswith('stone')]: spr.pop(_n); sizes.pop(_n)
coll_r={'broad1':6,'broad2':6,'broad3':5,'broad4':6,'pine1':5,'pine2':5,'spire1':17,'spire2':15,'rmid1':12,'rmid2':11,'rsmall1':5,'rsmall2':5,'bushL1':6,'bushL2':6}
Image.fromarray(col).save(BUILD+'coll.png',optimize=True)
for n,im in spr.items(): im.save(OUT+'sprites/'+n+'.png',optimize=True)
world={'riverTop':[float(xc[0]),float(hw[0])],'WW':WW,'HD':HD,'size':sizes,'coll_r':coll_r,'objs':objs,
 'riverXc':[float(v) for v in xc],'riverHw':[float(v) for v in hw],
 'bridge':{'x':int(BX),'y':int(YB),'walk':[float(wx0),float(wy0),float(wx1),float(wy1)]}}
json.dump(world,open(BUILD+'world.json','w'),separators=(',',':')); print('world ok',len(objs),'objs')
