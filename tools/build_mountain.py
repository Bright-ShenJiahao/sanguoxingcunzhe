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
HL=[(430,520,780,680,7.0,11),            # 西北大山：山脚缓坡，山腰山顶多层崖
    (520,2180,540,330,2.5,12),(960,1650,300,230,2.0,13),   # 西南干旱丘陵：只有缓坡
    (1560,1760,300,240,3.6,14),          # 绿地高地
    (1760,560,330,260,3.6,15)]           # 雪地高地
h=np.zeros((N,N),np.float32)
for b in HL: h=np.maximum(h,blob(*b))
TH=[2.6,4.0,5.4]
nz=fbm(170,21,2,N,N)*0.18
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
# ---------- 坡道：每段崖壁开口子 ----------
ramp_m=np.zeros((N,N),np.uint8)
nl,lab,st,_=cv2.connectedComponentsWithStats(face.astype(np.uint8),connectivity=8)
nr=0
for i in range(1,nl):
    x0,y0,w_,hh_,area=st[i]
    if area<500 or w_<50: continue
    n=max(1,int(round(w_/340)))
    for k in range(n):
        x=int(x0+(k+0.5)*w_/n); sl=36 if (nr%2==0) else -36
        ys=np.where(lab[:,max(0,x-8):x+8]==i)[0]
        if len(ys)==0: continue
        cv2.line(ramp_m,(x-sl,int(ys.max())+36),(x+sl,int(ys.min())-48),1,40); nr+=1
ramp=np.clip(cv2.GaussianBlur(ramp_m.astype(np.float32),(0,0),5)*1.6,0,1)
face&=~(ramp>0.35)
Image.fromarray((np.dstack([face*255,(lv*60).clip(0,255),(ramp*255)])).astype(np.uint8)).resize((640,640)).save('/tmp/claude-0/-home-claude/b6fcd064-da0c-5ebc-9c98-f983720bd619/scratchpad/dbg.png')
print('h max',h.max(),[(lv==i).mean() for i in range(4)])
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
base*=up(shade)[...,None]
# 崖面 + 崖脚阴影
fH=np.repeat(np.repeat(face,2,0),2,1)
f=fH.astype(np.int32); cs=np.cumsum(f,axis=0); reset=np.maximum.accumulate(np.where(f==0,cs,0),axis=0); run=cs-reset; del cs,reset,f
ys_,xs2=np.nonzero(fH)
rows=np.minimum(run[ys_,xs2]-1,FH-1)
base[ys_,xs2]=Ct[rows,xs2%Ct.shape[1]]
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
for kk,x,y in cw['objs']:
    x+=CW
    if x<CW+OV and Mx[y,x-CW]<0.5: continue
    if bl_d[y,x] or ramp_d[y,x] or faceband[y,x]: continue
    allo.append([kk,x,y]); grid.setdefault((int(x//CS),int(y//CS)),[]).append((x,y,6))
def okp(x,y): return not (bl_d[y,x] or ramp_d[y,x] or faceband[y,x])
# 西部（干旱）：新素材
for _ in range(120000):
    x,y=[int(v) for v in rng.integers(24,[CW-10,N-24])]
    if not okp(x,y) or not far(x,y,22): continue
    lvl=h[y,x]; r=rng.random()
    if r<0.07 and lvl>=0.8: put(['mpine1','mpine2','mpine2'][int(rng.integers(3))],x,y,22)
    elif r<0.085: put('mdead',x,y,22)
    elif r<0.55: put(['mgrass1','mgrass2'][int(rng.integers(2))],x,y,8)
    elif r<0.88: put(['mrubble1','mrubble2'][int(rng.integers(2))],x,y,8)
    else: put('mrock',x,y,10)
    if len(allo)>len(cw['objs'])+900: break
# 绿地高地、雪地高地：树
def forest(cx,cy,rx,ry,names,cnt,r):
    n=0
    for _ in range(40000):
        x=int(cx+rng.uniform(-rx,rx)); y=int(cy+rng.uniform(-ry,ry))
        if not(0<x<N and 0<y<N) or h[y,x]<0.4 or not okp(x,y) or not far(x,y,r): continue
        put(names[int(rng.integers(len(names)))],x,y,r); n+=1
        if n>=cnt: break
forest(1560,1760,300,240,['broad1','broad2','broad3','pine1','pine2'],22,22)
forest(1760,560,330,260,['nfir1','nfir2','nfir3','nbare1','nbare2','nbare3'],24,22)
print('objs',len(allo))
size={**cw['size'],**sizes}
cr={**cw['coll_r'],'mpine1':5,'mpine2':5,'mdead':5,'mrock':8}
b=cw['bridge']; bw=b['walk']
wj={'WW':N,'WH':N,'HD':HD,'size':size,'coll_r':cr,'objs':allo,'bridge':{'x':b['x']+CW,'y':b['y'],'walk':[bw[0]+CW,bw[1],bw[2]+CW,bw[3]]},
    'snowY':1280,'snowX':CW,'ver':int(time.time())}
json.dump(wj,open(DATA+'world.json','w'),separators=(',',':')); print('world ok')
