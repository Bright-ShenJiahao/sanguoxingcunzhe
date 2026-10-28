"""西部山地·层层叠高的台地（手工设计的崖线）+ 之字形山路 + 与中部拼接。
先跑 build_world.py、build_snow.py。素材：art_src/map/mountain_tex.png（3 张台地地面 + 崖面）、mountain_ramp.png（土路）、mountain_misc.png（松树等物件）。
输出：assets/map/ground_w.jpg（西，x 0..1280）、ground.jpg（中，x 1280..2560，左 200 与山地混合）、coll.png（2560x2560）、
sprites/m*.png、data/world.json（世界 2560x2560）。"""
import numpy as np, cv2, json, os, time
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=ROOT+'/art_src/map/'; BUILD=ROOT+'/art_src/build/'; OUT=ROOT+'/assets/map/'; DATA=ROOT+'/data/'
HD=2; CW=1280; H=2560; OV=200; WL=CW+OV; FACE=44          # 崖面高度（逻辑像素）
FH=FACE*HD
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
    """把无缝小图铺满 w x h，用两层错位混合打散重复。"""
    S=t.shape[0]
    def lay(ox,oy):
        big=np.tile(t,(h//S+3,w//S+3,1)); return np.roll(np.roll(big,oy,0),ox,1)[:h,:w]
    m=np.clip((vnoise(300,seed,w,h)-.5)*2.2+.5,0,1)[...,None].astype(np.float32)
    return lay(0,0)*(1-m)+lay(S//2+97,S//3+41,)*m if False else lay(0,0)*(1-m)+lay(S//2+97,S//3+41)*m
def load(p): return cv2.cvtColor(cv2.imread(SRC+p),cv2.COLOR_BGR2RGB)
cw=json.load(open(BUILD+'world_center.json'))
# ---------- 素材 ----------
tex=load('mountain_tex.png')
P_lo=tex[51:586,57:592]; P_mid=tex[51:586,663:1198]; P_hi=tex[648:1183,57:592]; P_cl=tex[648:1183,663:1198]
G=[seamless(p) for p in (P_lo,P_mid,P_hi)]
cl=P_cl[12:372].astype(np.float32); cw_=round(535*FH/360)
Ct=cv2.resize(cl,(cw_,FH),interpolation=cv2.INTER_AREA)
Ct=Ct*np.linspace(1.12,0.70,FH)[:,None,None]                 # 崖面上亮下暗
Ct=Ct.astype(np.float32)
rp=load('mountain_ramp.png') if False else cv2.cvtColor(cv2.imread(SRC+'mountain_ramp.png'),cv2.COLOR_BGR2RGB)
road=rp[:,118:228].astype(np.float32)
road=np.concatenate([road,road[::-1]],0)*0.80
# ---------- 手工设计的崖线：越往北越高，崖面朝南 ----------
xs=np.arange(WL,dtype=np.float32)
def wavy(base,amp,wl,ph,seed):
    n=vnoise(90,seed,WL,8)[0]; n=(n-n.mean())/(n.std()+1e-6)
    return base+amp*np.sin(xs/wl*2*np.pi+ph)+18*n
B=[wavy(1880,34,520,0.4,101),wavy(1560,38,610,2.1,102),wavy(1240,34,480,4.0,103),wavy(920,40,560,1.3,104)]
NB=len(B)
Bx=[np.interp(np.arange(WL*HD)/HD,xs,b) for b in B]          # HD 列对应的崖线 y（逻辑）
Yh=(np.arange(H*HD,dtype=np.float32)/HD)[:,None]
# ---------- 道路与坡道 ----------
def smooth(pts,k=31):
    pts=np.array(pts,np.float32); dense=[]
    for a,b in zip(pts[:-1],pts[1:]):
        n=max(2,int(np.hypot(*(b-a))/4)); dense+=[a+(b-a)*t for t in np.linspace(0,1,n,endpoint=False)]
    dense=np.array(dense+[pts[-1]],np.float32); ker=np.ones(k,np.float32)/k
    pad=np.pad(dense,((k//2,k//2),(0,0)),mode='edge')
    return np.stack([np.convolve(pad[:,0],ker,'valid'),np.convolve(pad[:,1],ker,'valid')],1)
def by(k,x): return float(np.interp(x,xs,B[k]))
RX=[330,960,330,900]; RD=[26,-26,26,-26]               # 每道崖的主坡道 x 与斜向
SX=[1100,150,1100,200]                                 # 每道崖的次坡道（近路，不铺长路）
road_m=np.zeros((H,WL),np.uint8); ramp_m=np.zeros((H,WL),np.uint8)
def ramp_poly(k,x,dx):
    b=by(k,x); return np.array([(x-30,b+FACE+14),(x+30,b+FACE+14),(x+30+dx,b-14),(x-30+dx,b-14)],np.int32)
route=[(1255,2070),(900,2010),(520,1990),(RX[0],by(0,RX[0])+FACE+60)]
for k in range(NB):
    x,dx=RX[k],RD[k]
    cv2.fillPoly(ramp_m,[ramp_poly(k,x,dx)],1)
    top=(x+dx,by(k,x)-40)
    if k<NB-1:
        nx=RX[k+1]; mid=((top[0]+nx)/2,(by(k,x)+by(k+1,nx)+FACE)/2+30)
        route+=[top,mid,(nx,by(k+1,nx)+FACE+60)]
    else: route+=[top,(top[0]-40,by(k,x)-190)]
    route.insert(len(route)-(3 if k<NB-1 else 2),(x,by(k,x)+FACE+14))   # 坡道起点
    sx=SX[k]; cv2.fillPoly(ramp_m,[ramp_poly(k,sx,-RD[k])],1)
cv2.polylines(road_m,[smooth(route).astype(np.int32).reshape(-1,1,2)],False,1,46)
for k in range(NB):
    for x,dx in [(RX[k],RD[k]),(SX[k],-RD[k])]: cv2.fillPoly(road_m,[ramp_poly(k,x,dx)],1)
RM=cv2.GaussianBlur(road_m.astype(np.float32),(0,0),5)
RM=np.clip(RM*1.5-0.2+0.25*fbm(24,7,2,WL,H),0,1)
RM=cv2.resize(RM,(WL*HD,H*HD),interpolation=cv2.INTER_LINEAR)
# ---------- 着色（按行分块，省内存）----------
WI=np.zeros((H*HD,WL*HD,3),np.uint8)
gains=[1.0,0.98,0.95,0.93,0.97]
wlv=np.array([[1,0,0],[.55,.45,0],[0,1,0],[0,.5,.5],[0,0,1]],np.float32)
CH=640
Gb=[tile_big(g,WL*HD,CH+2*FH,70+i*7) for i,g in enumerate(G)]   # 同一块条带反复用，按行偏移
for r0 in range(0,H*HD,CH):
    r1=min(H*HD,r0+CH); n=r1-r0
    Ls=np.zeros((n,WL*HD),np.uint8)
    for k in range(NB): Ls+=(Yh[r0:r1]<Bx[k][None,:]).astype(np.uint8)
    off=(r0//CH*137)%FH
    acc=np.zeros((n,WL*HD,3),np.float32)
    for i in range(3):
        wi=wlv[Ls][...,i]
        acc+=Gb[i][off:off+n]*wi[...,None]
    acc*=np.array(gains,np.float32)[Ls][...,None]
    WI[r0:r1]=np.clip(acc,0,255).astype(np.uint8)
print('terrain ok')
# 崖面 + 崖脚阴影
ci=np.arange(WL*HD)
for k in range(NB):
    top=np.round(Bx[k]*HD).astype(int)
    rr=np.arange(FH)[:,None]
    ys=np.clip(top[None,:]+rr,0,H*HD-1)
    WI[ys,ci[None,:]]=np.clip(Ct[rr[:,0][:,None],(ci[None,:])%Ct.shape[1]],0,255).astype(np.uint8)
    rr2=np.arange(40)[:,None]; ys2=np.clip(top[None,:]+FH+rr2,0,H*HD-1)
    f=(0.62+0.38*sstep(rr2/40.0)).astype(np.float32)
    WI[ys2,ci[None,:]]=np.clip(WI[ys2,ci[None,:]].astype(np.float32)*f[...,None],0,255).astype(np.uint8)
    rr3=np.arange(8)[:,None]; ys3=np.clip(top[None,:]-8+rr3,0,H*HD-1)              # 崖顶一道暗边
    WI[ys3,ci[None,:]]=np.clip(WI[ys3,ci[None,:]].astype(np.float32)*(0.82+0.18*rr3/8.0)[...,None],0,255).astype(np.uint8)
print('cliffs ok')
# 之字形山路 + 坡道
for r0 in range(0,H*HD,CH):
    r1=min(H*HD,r0+CH); a=(RM[r0:r1]*0.9)[...,None]
    rt=np.roll(Gb[0],200,1)[(r0//CH*137)%FH:(r0//CH*137)%FH+(r1-r0)]*1.14
    WI[r0:r1]=np.clip(WI[r0:r1].astype(np.float32)*(1-a)+rt*a,0,255).astype(np.uint8)
del Gb
print('mountain ground ok')
# ---------- 碰撞：崖面挡路，坡道处放行；东侧山口用岩墙封住 ----------
blocked=np.zeros((H,WL),bool)
yg=np.arange(H,dtype=np.float32)[:,None]
for k in range(NB): blocked|=(yg>=B[k][None,:]-4)&(yg<B[k][None,:]+FACE)
ramp_f=cv2.GaussianBlur(ramp_m.astype(np.float32),(0,0),3)>0.35
blocked&=~ramp_f
blocked[:1760,1244:]=True
colr=np.zeros((H,WL,3),np.uint8); colr[...,0]=blocked*1
# ---------- 物件：新素材 ----------
def extract(fn,minarea,n,split):
    T=load(fn).astype(np.float32); r,g,b=T[...,0],T[...,1],T[...,2]
    al=np.clip(1-((np.minimum(r,b)-g)-60)/80,0,1)
    hard=((np.minimum(r,b)-g)<70).astype(np.uint8)
    k,lab,st,_=cv2.connectedComponentsWithStats(cv2.dilate(hard,np.ones((9,9),np.uint8)))
    comps=[(i,st[i]) for i in range(1,k) if st[i][4]>minarea]
    comps.sort(key=lambda c:(int((c[1][1]+c[1][3]/2)//split),c[1][0])); assert len(comps)==n,len(comps)
    out=[]
    for i,s in comps:
        x,y,w,h=s[:4]; p=3
        ya,yb,xa,xb=max(0,y-p),min(T.shape[0],y+h+p),max(0,x-p),min(T.shape[1],x+w+p)
        rgb=T[ya:yb,xa:xb].copy(); a=al[ya:yb,xa:xb]*cv2.dilate((lab[ya:yb,xa:xb]==i).astype(np.uint8),np.ones((9,9),np.uint8))
        e=a<.98
        rgb[...,0]=np.where(e,np.minimum(rgb[...,0],rgb[...,1]+3),rgb[...,0]); rgb[...,2]=np.where(e,np.minimum(rgb[...,2],rgb[...,1]-4),rgb[...,2])
        pink=(rgb[...,0]>rgb[...,1]+20)&(rgb[...,2]>rgb[...,1]+8)&(rgb[...,0]>140)
        a=np.clip((a-0.25)/0.75,0,1)*(~pink)
        out.append(np.dstack([rgb,a*255]).astype(np.uint8))
    return out
def to_sprite(arr,h):
    ys,xs_=np.where(arr[...,3]>30); arr=arr[ys.min():ys.max()+1,xs_.min():xs_.max()+1]
    Hh,Ww=arr.shape[:2]; s=h*HD/Hh; nw,nh=round(Ww*s),round(Hh*s)
    a=arr[...,3:4].astype(np.float32)/255.; pm=arr[...,:3].astype(np.float32)*a
    rr=cv2.resize(np.dstack([pm,a]),(nw,nh),interpolation=cv2.INTER_AREA)
    a2=rr[...,3:4]; rgb=rr[...,:3]/np.maximum(a2,1e-3)
    return Image.fromarray(np.dstack([np.clip(rgb,0,255),np.clip(a2*255,0,255)]).astype(np.uint8))
comps=extract('mountain_misc.png',3000,9,420)[1:]       # 去掉左上角的土路材质块
mn=['mpine1','mpine2','mdead','mgrass1','mgrass2','mrubble1','mrubble2','mrock']; mh=[72,46,64,28,19,24,15,18]
spr={n:to_sprite(a,h) for n,a,h in zip(mn,comps,mh)}
for n,im in spr.items(): im.save(OUT+'sprites/'+n+'.png',optimize=True)
sizes={n:[im.width/HD,im.height/HD] for n,im in spr.items()}
objs=[]; grid={}; CS=40
def far(x,y,r,kk=1.0):
    gx,gy=int(x//CS),int(y//CS)
    for i in range(gx-2,gx+3):
        for j in range(gy-2,gy+3):
            for o in grid.get((i,j),()):
                if (x-o[0])**2+(y-o[1])**2<(r+kk*o[2])**2: return False
    return True
def put(k,x,y,r): objs.append([k,x,y]); grid.setdefault((int(x//CS),int(y//CS)),[]).append((x,y,r))
nearb=np.zeros((H,WL),bool)
for k in range(NB): nearb|=(yg>=B[k][None,:]-26)&(yg<B[k][None,:]+FACE+22)
roadL=cv2.resize(RM,(WL,H),interpolation=cv2.INTER_AREA)>0.15
def free(x,y,m=10): return not (blocked[max(0,y-m):y+m,max(0,x-m):x+m].any() or nearb[y,x] or roadL[max(0,y-8):y+8,max(0,x-14):x+14].any())
for y in range(40,1760,46):                                   # 东侧山口岩墙
    put(['spire1','spire2'][int(rng.integers(2))],int(1262+rng.integers(-6,7)),y+int(rng.integers(-8,9)),17)
for _ in range(90000):
    x,y=[int(v) for v in rng.integers(24,[1230,H-24])]
    if not free(x,y) or not far(x,y,22): continue
    lvl=sum(1 for k in range(NB) if y<B[k][x])
    r=rng.random()
    if r<0.07 and lvl>=1: put(['mpine1','mpine2','mpine2'][int(rng.integers(3))],x,y,22)
    elif r<0.085: put('mdead',x,y,22)
    elif r<0.55: put(['mgrass1','mgrass2'][int(rng.integers(2))],x,y,8)
    elif r<0.88: put(['mrubble1','mrubble2'][int(rng.integers(2))],x,y,8)
    else: put('mrock',x,y,10)
    if len(objs)>620: break
print('mountain objs',len(objs))
# ---------- 与中部拼接 ----------
Cen=np.array(Image.open(BUILD+'ground_center.jpg').convert('RGB'))      # 5120 x 2560
xs_=np.arange(OV,dtype=np.float32)/OV
Mx=sstep(np.clip((xs_[None,:]-0.5)*2.0+0.5+0.45*fbm(50,301,3,OV,H)*np.sin(np.pi*xs_[None,:]),0,1)).astype(np.float32)   # 0 山地 .. 1 中部
MH=cv2.resize(Mx,(OV*HD,H*HD),interpolation=cv2.INTER_LINEAR)[...,None]
ov=WI[:,CW*HD:].astype(np.float32)*(1-MH)+Cen[:,:OV*HD].astype(np.float32)*MH
Cen[:,:OV*HD]=np.clip(ov,0,255).astype(np.uint8)
Image.fromarray(WI[:,:CW*HD]).save(OUT+'ground_w.jpg',quality=72,optimize=True)
Image.fromarray(Cen).save(OUT+'ground.jpg',quality=70,optimize=True)
cc=np.array(Image.open(BUILD+'coll_center.png').convert('RGB'))      # 2560 x 1280
C=np.zeros((H,2*CW,3),np.uint8); C[:,:CW]=colr[:,:CW]; C[:,CW:]=cc
z=np.where((Mx>=0.5)[...,None],cc[:,:OV],colr[:,CW:WL]); C[:,CW:CW+OV]=z
Image.fromarray(C).save(OUT+'coll.png',optimize=True)
allo=[o for o in objs]
for kk,x,y in cw['objs']:
    if x<OV and Mx[y,x]<0.5: continue
    allo.append([kk,x+CW,y])
size={**cw['size'],**sizes}
cr={**cw['coll_r'],'mpine1':5,'mpine2':5,'mdead':5,'mrock':8}
b=cw['bridge']; bw=b['walk']
wj={'WW':2*CW,'WH':H,'HD':HD,'size':size,'coll_r':cr,'objs':allo,'bridge':{'x':b['x']+CW,'y':b['y'],'walk':[bw[0]+CW,bw[1],bw[2]+CW,bw[3]]},
    'snowY':1280,'snowX':CW,'ver':int(time.time())}
json.dump(wj,open(DATA+'world.json','w'),separators=(',',':')); print('world ok',len(allo))
