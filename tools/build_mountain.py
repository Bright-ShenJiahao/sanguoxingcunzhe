"""高地地形系统：西北大山 + 西南干旱丘陵 + 绿地高地 + 雪地高地，并与中部（北雪南草）拼接成 2560x2560 的世界。
低处是缓坡（只用明暗表现，随便走），只有高处才出现崖壁（朝南的一面，挡路，靠坡道上去）。
先跑 build_world.py、build_snow.py。素材：art_src/map/mountain_tex.png、mountain_ramp.png、mountain_misc.png。
输出：assets/map/ground_w.jpg（x 0..1280）、ground.jpg（x 1280..2560）、coll.png、sprites/m*.png、data/world.json。"""
import numpy as np, cv2, json, os, time
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=ROOT+'/art_src/map/'; BUILD=ROOT+'/art_src/build/'; OUT=ROOT+'/assets/map/'; DATA=ROOT+'/data/'
HD=2; N=2560; CW=1280; OV=200; WL=CW+OV; FACE=44; FH=FACE*HD; Wd=N*HD; WLd=WL*HD
rng=np.random.default_rng(41)
def sstep(x): x=np.clip(x,0,1); return x*x*(3-2*x)
def vnoise(cell,seed,w,h):
    g=np.random.default_rng(seed).random((h//cell+3,w//cell+3)).astype(np.float32)
    return cv2.resize(g,(g.shape[1]*cell,g.shape[0]*cell),interpolation=cv2.INTER_CUBIC)[:h,:w]
def fbm(cell,seed,oct,w,h):
    v=0;a=1;tot=0
    for o in range(oct): v=v+a*vnoise(max(4,cell>>o),seed+o*13,w,h);tot+=a;a*=.5
    v=v/tot; return (v-v.mean())/(v.std()+1e-6)
def seamless(t,band=.30):
    t=t.astype(np.float32); S=t.shape[0]
    U=np.roll(np.roll(t,S//2,0),S//2,1)
    ax=np.arange(S); d=np.minimum(ax,S-1-ax)/(S*band)
    w=(sstep(d)[:,None]*sstep(d)[None,:])[...,None]
    return t*w+U*(1-w)
def tile_big(t,w,h,seed):
    S=t.shape[0]
    def lay(ox,oy):
        big=np.tile(t,(h//S+3,w//S+3,1)); return np.roll(np.roll(big,oy,0),ox,1)[:h,:w]
    m=np.clip((vnoise(300,seed,w,h)-.5)*2.2+.5,0,1)[...,None].astype(np.float32)
    return lay(0,0)*(1-m)+lay(S//2+97,S//3+41)*m
def load(p): return cv2.cvtColor(cv2.imread(SRC+p),cv2.COLOR_BGR2RGB)
up=lambda a:cv2.resize(a.astype(np.float32),(Wd,Wd),interpolation=cv2.INTER_LINEAR)
cw=json.load(open(BUILD+'world_center.json'))
# ---------- 素材 ----------
tex=load('mountain_tex.png')
P_lo=tex[51:586,57:592]; P_mid=tex[51:586,663:1198]; P_hi=tex[648:1183,57:592]; P_cl=tex[648:1183,663:1198]
G=[seamless(p) for p in (P_lo,P_mid,P_hi)]
cl=P_cl[12:372].astype(np.float32); cw_=round(535*FH/360)
Ct=cv2.resize(cl,(cw_,FH),interpolation=cv2.INTER_AREA)*np.linspace(1.12,0.70,FH)[:,None,None]
Ct=Ct.astype(np.float32)
# ---------- 高度场 ----------
X,Y=np.meshgrid(np.arange(N,dtype=np.float32),np.arange(N,dtype=np.float32))
wx=fbm(260,5,3,N,N)*42; wy=fbm(260,6,3,N,N)*42
def blob(cx,cy,rx,ry,hmax,seed,pw=0.7):
    r=np.sqrt(((X+wx-cx)/rx)**2+((Y+wy-cy)/ry)**2)
    p=np.clip(1-r+0.11*fbm(170,seed,2,N,N),0,1)
    return hmax*p**pw
ridge=np.zeros((N,N),np.uint8)
cv2.polylines(ridge,[np.array([(150,1100),(330,640),(700,300),(1250,200),(1800,330),(2300,520)],np.int32)],False,1,60)
rd=cv2.distanceTransform(1-ridge,cv2.DIST_L2,5)+wx*0.8+wy*0.5
hmx=7.2-2.6*sstep((X-900)/1100)
h=hmx*1.12*np.clip(1-np.maximum(rd,0)/720+0.08*fbm(170,11,2,N,N),0,1)**0.75
h=np.minimum(h,hmx)
h=np.maximum(h,blob(430,560,700,640,7.2,11,0.7)*(1-sstep((X-1000)/500)))
for b_ in [(520,2180,540,330,2.4,12),(960,1650,300,230,1.9,13)]: h=np.maximum(h,blob(*b_))
TH=[2.6,4.0,5.4]
nz=fbm(260,21,2,N,N)*0.07
lv=np.zeros((N,N),np.float32)
for t in TH: lv+=(h>=t+nz)
Hc=cv2.GaussianBlur(lv,(0,0),1.2)
Tn=np.roll(Hc,FACE,0); Tn[:FACE]=Hc[:FACE]
hb=cv2.GaussianBlur(h,(0,0),10)
gyb=np.gradient(hb,axis=0); gxb=np.gradient(hb,axis=1)
south=np.clip((-gyb/(np.hypot(gxb,gyb)+1e-4)-0.2)/0.4,0,1)       # 高处在北、崖面朝南
south=cv2.GaussianBlur(south,(0,0),6)
face=((Tn-Hc)>0.5)&(south>0.5)
face=cv2.morphologyEx(face.astype(np.uint8),cv2.MORPH_OPEN,np.ones((3,3),np.uint8)).astype(bool)
# ---------- 崖线缺口：崖高沿走向消失成缓坡（不画路）----------
gap=cv2.GaussianBlur(fbm(200,77,2,N,N),(0,0),3)
face&=(gap>-1.4)
ramp=np.zeros((N,N),np.float32); nr=0
print('face px',int(face.sum()),'ramps',nr)
# ---------- 地面 ----------
Cen=np.array(Image.open(BUILD+'ground_center.jpg').convert('RGB'))          # 5120 x 2560
base=np.zeros((Wd,Wd,3),np.float32); base[:,2*CW:]=Cen
xs_=np.arange(OV,dtype=np.float32)/OV
Mx=sstep(np.clip((xs_[None,:]-0.5)*2.0+0.5+0.45*fbm(50,301,3,OV,N)*np.sin(np.pi*xs_[None,:]),0,1)).astype(np.float32)   # 0 山地 .. 1 中部
dryw=np.zeros((N,WL),np.float32); dryw[:,:CW]=1; dryw[:,CW:]=1-Mx
hH=up(h)[:,:WLd]; dryH=cv2.resize(dryw,(WLd,Wd),interpolation=cv2.INTER_LINEAR)[...,None]
wlo=np.clip(1-hH/1.6,0,1); whi=np.clip((hH-2.6)/1.3,0,1); wmid=np.clip(1-wlo-whi,0,1)
acc=np.zeros((Wd,WLd,3),np.float32)
for i,w in enumerate((wlo,wmid,whi)):
    acc+=tile_big(G[i],WLd,Wd,70+i*7)*w[...,None]
base[:,:WLd]=acc*dryH+base[:,:WLd]*(1-dryH)
del acc,hH,dryH,wlo,wmid,whi
print('base ok')
# 明暗：西北光源，缓坡靠明暗表现
hs=np.minimum(h,2.6)+0.1*np.clip(h-2.6,0,None)
hs=cv2.GaussianBlur(hs,(0,0),10)
gx=cv2.Sobel(hs,cv2.CV_32F,1,0,ksize=3)/8; gy=cv2.Sobel(hs,cv2.CV_32F,0,1,ksize=3)/8
shade=np.clip(1-12*(gx*0.6+gy*0.8)+0.015*h,0.85,1.18)
base*=up(shade)[...,None]*up(0.93+0.035*Hc)[...,None]
# 雪岩崖壁条纹理
def snow_strip():
    T=load('snowcliff.png'); hard=((np.minimum(T[...,0],T[...,2]).astype(np.int32)-T[...,1])<70).astype(np.uint8)
    k,lb,st,_=cv2.connectedComponentsWithStats(cv2.dilate(hard,np.ones((9,9),np.uint8)))
    cs=sorted([st[i] for i in range(1,k) if st[i][4]>3000 and st[i][1]<300],key=lambda c:c[0])[:3]
    parts=[]
    for x,y,w,h_,_ in cs:
        p=T[y+int(h_*.06):y+int(h_*.86),x+8:x+w-8].copy()
        m=((np.minimum(p[...,0],p[...,2]).astype(np.int32)-p[...,1])>60).astype(np.uint8)
        p=cv2.inpaint(p,cv2.dilate(m,np.ones((5,5),np.uint8)),5,cv2.INPAINT_TELEA)
        parts.append(cv2.resize(p,(round(p.shape[1]*FH/p.shape[0]),FH),interpolation=cv2.INTER_AREA))
    return np.concatenate(parts,1).astype(np.float32)
Cs=snow_strip(); print('snow strip',Cs.shape)
# 崖面 + 崖脚阴影
fH=np.repeat(np.repeat(face,2,0),2,1)
f=fH.astype(np.int32); cs=np.cumsum(f,axis=0); reset=np.maximum.accumulate(np.where(f==0,cs,0),axis=0); run=cs-reset; del cs,reset,f
ys_,xs2=np.nonzero(fH)
rows=np.minimum(run[ys_,xs2]-1,FH-1)
base[ys_,xs2]=Ct[rows,xs2%Ct.shape[1]]
sn=(xs2>=2*(CW+60))&(ys_<2*1300)
base[ys_[sn],xs2[sn]]=Cs[rows[sn],xs2[sn]%Cs.shape[1]]
rmk=np.zeros((N,N),np.uint8); rmk[:1480,CW:]=np.load(BUILD+'snow_river.npy').astype(np.uint8)
rmk=cv2.dilate(rmk,np.ones((1,9),np.uint8)); rmH=np.repeat(np.repeat(rmk,2,0),2,1)
fw=rmH[ys_,xs2]>0
icet=tile_big(seamless(load('snow_water.png')),Wd,Wd,555)
shd=(0.9+0.1*np.clip(rows[fw]/FH,0,1)-0.12*(rows[fw]<8))[:,None]
base[ys_[fw],xs2[fw]]=icet[ys_[fw],xs2[fw]]*shd
del icet
print('waterfall px',int(fw.sum()))
del run,ys_,xs2,rows
fa=cv2.GaussianBlur(face.astype(np.float32),(0,0),7); fa=np.roll(fa,10,0)*(1-face)
base*=(1-0.42*up(fa))[...,None]
# 坡道：土路
dirt=tile_big(G[0],Wd,Wd,99)*1.14
a=(up(ramp)*0.9)[...,None]
base=base*(1-a)+dirt*a
del dirt,a
Cf=np.clip(base,0,255).astype(np.uint8); del base
Image.fromarray(Cf[:,:2*CW]).save(OUT+'ground_w.jpg',quality=72,optimize=True)
Image.fromarray(Cf[:,2*CW:]).save(OUT+'ground.jpg',quality=70,optimize=True)
del Cf
print('ground ok')
# ---------- 碰撞 ----------
blocked=cv2.dilate(face.astype(np.uint8),np.ones((3,3),np.uint8)).astype(bool)&~(ramp>0.35)
cc=np.array(Image.open(BUILD+'coll_center.png').convert('RGB'))      # 2560 x 1280
C=np.zeros((N,N,3),np.uint8); C[:,CW:]=cc
C[:,:CW+OV]=np.where((np.concatenate([np.ones((N,CW),np.float32),1-Mx],1)>0.5)[...,None],0,C[:,:CW+OV])
C[...,0]=np.maximum(C[...,0],blocked*1)
Image.fromarray(C).save(OUT+'coll.png',optimize=True)
# ---------- 物件 ----------
def extract(fn,minarea,n,split):
    T=load(fn).astype(np.float32); r,g,b=T[...,0],T[...,1],T[...,2]
    al=np.clip(1-((np.minimum(r,b)-g)-60)/80,0,1)
    hard=((np.minimum(r,b)-g)<70).astype(np.uint8)
    k,lb,s2,_=cv2.connectedComponentsWithStats(cv2.dilate(hard,np.ones((9,9),np.uint8)))
    comps=[(i,s2[i]) for i in range(1,k) if s2[i][4]>minarea]
    comps.sort(key=lambda c:(int((c[1][1]+c[1][3]/2)//split),c[1][0])); assert len(comps)==n,len(comps)
    out=[]
    for i,s in comps:
        x,y,w,hh,_=s; p=3
        ya,yb,xa,xb=max(0,y-p),min(T.shape[0],y+hh+p),max(0,x-p),min(T.shape[1],x+w+p)
        rgb=T[ya:yb,xa:xb].copy(); a=al[ya:yb,xa:xb]*cv2.dilate((lb[ya:yb,xa:xb]==i).astype(np.uint8),np.ones((9,9),np.uint8))
        e=a<.98
        rgb[...,0]=np.where(e,np.minimum(rgb[...,0],rgb[...,1]+3),rgb[...,0]); rgb[...,2]=np.where(e,np.minimum(rgb[...,2],rgb[...,1]-4),rgb[...,2])
        pink=(rgb[...,0]>rgb[...,1]+20)&(rgb[...,2]>rgb[...,1]+8)&(rgb[...,0]>140)
        a=np.clip((a-0.25)/0.75,0,1)*(~pink)
        out.append(np.dstack([rgb,a*255]).astype(np.uint8))
    return out
def to_sprite(arr,hgt):
    ys,xs=np.where(arr[...,3]>30); arr=arr[ys.min():ys.max()+1,xs.min():xs.max()+1]
    Hh,Ww=arr.shape[:2]; s=hgt*HD/Hh; nw,nh=round(Ww*s),round(Hh*s)
    a=arr[...,3:4].astype(np.float32)/255.; pm=arr[...,:3].astype(np.float32)*a
    rr=cv2.resize(np.dstack([pm,a]),(nw,nh),interpolation=cv2.INTER_AREA)
    a2=rr[...,3:4]; rgb=rr[...,:3]/np.maximum(a2,1e-3)
    return Image.fromarray(np.dstack([np.clip(rgb,0,255),np.clip(a2*255,0,255)]).astype(np.uint8))
comps=extract('mountain_misc.png',3000,9,420)[1:]
mn=['mpine1','mpine2','mdead','mgrass1','mgrass2','mrubble1','mrubble2','mrock']; mh=[72,46,64,28,19,24,15,18]
spr={n:to_sprite(a,hg) for n,a,hg in zip(mn,comps,mh)}
wn=['wreed1','wreed2','wreed3','wreed4','wcat1','wcat2','wcat3','wcat4','wlily1','wlily2','wlily3','wlily4','wtuft','wstone','wlog','wpud']
wh=[70,62,46,64,66,64,68,44,18,20,18,16,28,20,22,26]
for n,a_,hg in zip(wn,extract('wetland.png',3000,16,313),wh): spr[n]=to_sprite(a_,hg)
sc=extract('snowcliff.png',3000,12,313)[3:]
for n,a_,hg in zip(['srock1','srock2','srock3','srub1','srub2','srub3','sicerock','sreed','sice'],sc,[46,32,20,34,26,16,26,36,14]): spr[n]=to_sprite(a_,hg)
for n,im in spr.items(): im.save(OUT+'sprites/'+n+'.png',optimize=True)
sizes={n:[im.width/HD,im.height/HD] for n,im in spr.items()}
bl_d=cv2.dilate(blocked.astype(np.uint8),np.ones((25,25),np.uint8)).astype(bool)
ramp_d=cv2.dilate((ramp>0.2).astype(np.uint8),np.ones((17,17),np.uint8)).astype(bool)
faceband=cv2.dilate(face.astype(np.uint8),np.ones((45,45),np.uint8)).astype(bool)
# 先留下中部原有物件（去掉压在崖面/坡道上的）
allo=[]
grid={}; CS=40
def far(x,y,r,kk=1.0):
    gx_,gy_=int(x//CS),int(y//CS)
    for i in range(gx_-2,gx_+3):
        for j in range(gy_-2,gy_+3):
            for o in grid.get((i,j),()):
                if (x-o[0])**2+(y-o[1])**2<(r+kk*o[2])**2: return False
    return True
def put(k,x,y,r): allo.append([k,x,y]); grid.setdefault((int(x//CS),int(y//CS)),[]).append((x,y,r))
wdm=cv2.distanceTransform((cc[...,0]==0).astype(np.uint8),cv2.DIST_L2,5)
fmn=fbm(210,555,3,N,N)
nearcl=cv2.dilate(face.astype(np.uint8),np.ones((161,161),np.uint8)).astype(bool)
ROCK=('spire','rmid','rsmall','nspire','nrmid','nrsmall'); TREE=('broad','pine','nfir','nbare'); BUSH=('bush','nbush')
for kk,x,y in cw['objs']:
    x+=CW
    if x<CW+OV and Mx[y,x-CW]<0.5: continue
    wd=wdm[y,x-CW]; rr_=rng.random()
    if kk.startswith(ROCK) and (wd<70 or rr_>(0.8 if nearcl[y,x] else 0.12)): continue
    if kk.startswith(TREE) and (wd<26 or rr_>np.clip(0.35+0.5*fmn[y,x],0.2,1)): continue
    if kk.startswith(BUSH) and rr_>(0.25 if y>=1280 else (0.6 if wd<60 else (0.2 if fmn[y,x]<-0.3 else 0.5))): continue
    if kk.startswith(('tuft','flow','dry')) and rr_>0.5: continue
    if bl_d[y,x] or ramp_d[y,x] or faceband[y,x]: continue
    allo.append([kk,x,y]); grid.setdefault((int(x//CS),int(y//CS)),[]).append((x,y,6))
def okp(x,y): return not (bl_d[y,x] or ramp_d[y,x] or faceband[y,x])
# 西部（干旱）：新素材
for _ in range(120000):
    x,y=[int(v) for v in rng.integers(24,[CW-10,N-24])]
    if not okp(x,y) or not far(x,y,22): continue
    lvl=h[y,x]; r=rng.random(); fm=fmn[y,x]
    if r<0.07 and lvl>=0.8 and fm>0.2: put(['mpine1','mpine2','mpine2'][int(rng.integers(3))],x,y,22)
    elif r<0.075: put('mdead',x,y,22) if rng.random()<0.3 else None
    elif r<0.55: put(['mgrass1','mgrass2'][int(rng.integers(2))],x,y,8)
    elif r<0.88:
        if lvl>0.4 or fm>0.4: put(['mrubble1','mrubble2'][int(rng.integers(2))],x,y,8)
    elif nearcl[y,x] and rng.random()<0.5: put('mrock',x,y,10)
    if len(allo)>len(cw['objs'])+500: break
# 湿地：芦苇香蒲只在大河岸边，睡莲在河里（小），海边不放
from scipy import ndimage
wlab,_=ndimage.label(cc[...,0]>0)
bx0=cw['bridge']['x']; by0=cw['bridge']['y']
rowx=np.where(cc[by0,:,0]>0)[0]; rl=wlab[by0,rowx[np.argmin(abs(rowx-bx0))]]
XL,YL=np.meshgrid(np.arange(CW),np.arange(N)-1280)
seaz=(((XL-1310)/450.)**2+((YL-1310)/380.)**2)<1.45
rv=(wlab==rl)&~seaz; rv[:1300]=False
drv=cv2.distanceTransform((~rv).astype(np.uint8),cv2.DIST_L2,5)
for _ in range(90000):
    x=int(rng.integers(CW+30,N-30)); y=int(rng.integers(1300,N-30)); xl=x-CW
    if seaz[y,xl]: continue
    sh=cc[y,xl,0]
    if sh==2 and rv[y,xl]:
        if rng.random()<0.03 and far(x,y,22): put('wlily'+str(1+int(rng.integers(4))),x,y,22)
        continue
    if sh!=0 or bl_d[y,x]: continue
    d=drv[y,xl]
    if d<8 or d>26: continue
    r=rng.random()
    if rng.random()>0.3: continue
    if r<0.8 and far(x,y,14): put('wreed'+str(1+int(rng.integers(4))) if rng.random()<.5 else 'wcat'+str(1+int(rng.integers(4))),x,y,14)
    elif r<0.95 and far(x,y,22): put('wlog',x,y,22)
# 雪地：岩石在崖脚，碎石堆在崖脚，冰河岸边小件
for _ in range(80000):
    x=int(rng.integers(CW+OV+20,N-20)); y=int(rng.integers(30,1290))
    if cc[y,x-CW,0]!=0 or bl_d[y,x]: continue
    wd=wdm[y,x-CW]; r=rng.random()
    if nearcl[y,x] and not faceband[y,x]:
        if r<0.012 and far(x,y,18): put('srock'+str(1+int(rng.integers(3))),x,y,18)
        elif r<0.03 and far(x,y,14): put('srub'+str(1+int(rng.integers(3))),x,y,14)
    elif 8<wd<50 and r<0.02 and far(x,y,16): put(['sicerock','sreed','sice'][int(rng.integers(3))],x,y,16)
print('objs',len(allo))
size={**cw['size'],**sizes}
cr={**cw['coll_r'],'mpine1':5,'mpine2':5,'mdead':5,'mrock':8}
cr.update({'srock1':14,'srock2':10,'srock3':6,'sicerock':8})
for k_ in ('bushL1','bushL2'): cr.pop(k_,None)
b=cw['bridge']; bw=b['walk']
wj={'WW':N,'WH':N,'HD':HD,'size':size,'coll_r':cr,'objs':allo,'bridge':{'x':b['x']+CW,'y':b['y'],'walk':[bw[0]+CW,bw[1],bw[2]+CW,bw[3]]},
    'snowY':1280,'snowX':CW,'ver':int(time.time())}
bm=np.zeros((N,N),np.uint8)
for kk,x,y in allo:
    if kk.startswith(BUSH+('wreed','wcat')): cv2.circle(bm,(int(x),int(y)),int(size[kk][0]*0.38),1,-1)
C[...,0]=np.where((bm>0)&(C[...,0]==0),3,C[...,0])
Image.fromarray(C).save(OUT+'coll.png',optimize=True)
json.dump(wj,open(DATA+'world.json','w'),separators=(',',':')); print('world ok')
