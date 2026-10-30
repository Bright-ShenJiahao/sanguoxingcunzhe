"""第一关：重画河流（加宽、中间深蓝、靠岸变浅、岸边白色水花），只保留能过河的浅滩（含原桥位），
并按“同种成片”的规则重新摆放树木、灌木、水边植物和石头。
输入（原始底稿，不会被改）：art_src/build/stage_old/{g00,g10}.jpg、coll.png、world.json
输出：assets/map/g*.jpg、coll.png、data/world.json 的 objs/size/coll_r。可重复运行。"""
import numpy as np, cv2, json, os
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OLD=ROOT+'/art_src/build/stage_old/'; MAP=ROOT+'/assets/map/'
J=json.load(open(ROOT+'/data/world.json')); J0=json.load(open(OLD+'world.json'))
if 'off' in J: J['WW'],J['WH'],J['rmap'],J['rgrid']=J0['WW'],J0['WH'],J0['rmap'],J0['rgrid']; J.pop('off')   # 重跑：先回到裁边前
HD=J['HD']; T=J['tiles']['T']; W,H=J['WW'],J['WH']; rng=np.random.default_rng(21)
blur=lambda a,s:cv2.GaussianBlur(a.astype(np.float32),(0,0),s)
disk=lambda r:cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(2*r+1,2*r+1))
dil=lambda m,r:cv2.dilate(m.astype(np.uint8),disk(r)).astype(bool)
# ---------- 读底稿 ----------
G=np.zeros((H*HD,W*HD,3),np.uint8)
for t in J['tiles']['list']:
    tx,ty=int(t[1]),int(t[2]); im=np.array(Image.open(OLD+t+'.jpg').convert('RGB')); G[ty*T*HD:ty*T*HD+im.shape[0],tx*T*HD:tx*T*HD+im.shape[1]]=im
C0=np.array(Image.open(OLD+'coll.png').convert('RGB'))[...,0]
# 手工补崖：池塘下游小溪东岸（x 574~606, y 846~892），接上旁边的崖壁
for x in range(574,607):
    t=(x-574)/32; ya,yb=int(858-12*t),int(898-8*t)          # 上沿/下沿随 x 渐变，与右边崖壁衔接
    src=608+(x-574)%20
    for y in range(ya,yb):
        sy=850+int((y-ya)/(yb-ya)*38)
        G[y*HD:(y+1)*HD,x*HD:(x+1)*HD]=G[sy*HD:(sy+1)*HD,src*HD:(src+1)*HD]
    C0[ya:yb,x]=1
# 东边旧木桥（画在地面图上的）抹掉，换成代码画的桥
BX0,BY0,BX1,BY1=2706,924,2892,974
bmk=(np.array(Image.open(ROOT+'/art_src/map/bridge_wood.png'))[...,3]>0).astype(np.uint8)
bmk=cv2.dilate(bmk,np.ones((7,7),np.uint8)); bm2=np.zeros((H*HD,W*HD),np.uint8); bm2[BY0*HD:BY1*HD,BX0*HD:BX1*HD]=bmk
G=cv2.inpaint(G,bm2,9,cv2.INPAINT_TELEA)
# 用户圈的编辑（art_src/map/edits.json）：紫=抹掉地面花纹，绿=删掉水，红=删掉圈内植物（后面处理）
ED_=json.load(open(ROOT+'/art_src/map/edits.json'))
def polym(c):
    m=np.zeros((H,W),np.uint8)
    for L_ in ED_:
        if L_['颜色']==c and len(L_['点'])>=3: cv2.fillPoly(m,[np.array(L_['点'],np.int32)],1)
    return m>0
REDM=polym('#ff3040'); fixm=polym('#9040ff')|polym('#20d060'); dryM=polym('#20d060')
if fixm.any():
    sm=cv2.resize(G,(W,H),interpolation=cv2.INTER_AREA); mk=dil(fixm,14).astype(np.uint8)
    rep_=cv2.inpaint(sm,mk,12,cv2.INPAINT_TELEA); rep_=np.where(mk[...,None]>0,cv2.blur(rep_,(61,61)),rep_); big_=cv2.resize(rep_,(W*HD,H*HD),interpolation=cv2.INTER_LINEAR)
    gr_=np.array(Image.open(ROOT+'/art_src/map/grass.png').convert('RGB')).astype(np.float32); gt=cv2.resize(gr_,(900,900))
    tex_=gt[np.arange(H*HD)[:,None]%900,np.arange(W*HD)[None,:]%900]; tl=tex_-tex_.mean((0,1))
    M2=cv2.GaussianBlur(cv2.resize(mk,(W*HD,H*HD),interpolation=cv2.INTER_NEAREST).astype(np.float32),(0,0),4)[...,None]
    G=np.clip(G*(1-M2)+(big_+tl*0.6)*M2,0,255).astype(np.uint8)
    C0[dil(dryM,4)]=0
g=cv2.resize(G,(W,H),interpolation=cv2.INTER_AREA).astype(int)
blue=g[...,2]>g[...,1]+5
wat0=((C0>=1)&blue)|(C0==2)
rockc=(C0==1)&~blue                                     # 崖壁、山体
yy_,xx_=np.mgrid[0:H,0:W]
mtr=rockc&(xx_<850)&(yy_<1100)&(yy_>300)
mount=cv2.morphologyEx(dil(mtr,25).astype(np.uint8),cv2.MORPH_CLOSE,disk(60))
inv=(1-mount).astype(np.uint8); cv2.floodFill(inv,None,(W-1,H-1),2); mount=(mount>0)|(inv==1)   # 西边的山（填满内部）
back=np.zeros_like(rockc); ridge=np.zeros_like(rockc)                               # 山的背面：画面上没有崖壁的台地边 → 改成能走的缓坡
n,lab,st,_=cv2.connectedComponentsWithStats(mtr.astype(np.uint8))
for i in range(1,n):
    m=lab==i; px=g[m]
    if (px[:,0]-px[:,1]).mean()<0:
        if st[i][2]>=170:
            cut=m&(xx_<460)&(yy_>590)          # 内圈台地左下那条斜尾巴：删掉
            ridge|=m&~cut; back|=cut
        else: back|=m                         # 短的：删掉（可走，并抹掉地面上的线）
print('删掉的短台地线',back.sum(),'保留的高低差',ridge.sum())
# 高低差：外侧（低处）一条阴影，内侧上沿亮边
cx_,cy_=np.nonzero(mtr)[1].mean(),np.nonzero(mtr)[0].mean()
rd=np.hypot(xx_-cx_,yy_-cy_).astype(np.float32)
rdil=dil(ridge,8); rin=blur(ridge,1.5)
rmean=cv2.blur((rd*ridge).astype(np.float32),(31,31))/np.maximum(cv2.blur(ridge.astype(np.float32),(31,31)),1e-3)
ridge_lo=blur(rdil&~ridge&(rd>rmean),2.0); ridge_hi=blur(rdil&~ridge&(rd<rmean)&~dil(ridge,4),1.5)

# ---------- 新水域 ----------
watc=cv2.morphologyEx(wat0.astype(np.uint8),cv2.MORPH_CLOSE,disk(7)).astype(bool)   # 把桥面那条缝补上
land_ok=(C0==0)&~dil(rockc,5)
WID=5
watw=watc|(dil(watc,WID)&land_ok)
for k_,x,y in J0['objs']:                              # 原桥位：局部用更大的核把河道接起来
    if k_.startswith('bridge'):
        y0_,y1_,x0_,x1_=max(0,y-70),y+50,max(0,x-60),x+60
        watw[y0_:y1_,x0_:x1_]|=cv2.morphologyEx(watw[y0_:y1_,x0_:x1_].astype(np.uint8),cv2.MORPH_CLOSE,disk(14)).astype(bool)
# 用户标的：把池塘和下面的湖连起来
cv2.line(watw.view(np.uint8),(1738,1088),(1738,1122),1,14)
_y0,_y1,_x0,_x1=BY0-40,BY1+40,BX0-20,BX1+20
watw[_y0:_y1,_x0:_x1]|=cv2.morphologyEx(watw[_y0:_y1,_x0:_x1].astype(np.uint8),cv2.MORPH_CLOSE,disk(26)).astype(bool)
watw=(blur(watw,4.5)>0.5)                              # 河岸圆滑，去掉棱角和锯齿
watw[:40]=False
n,lab,st,_=cv2.connectedComponentsWithStats(watw.astype(np.uint8))
for i in range(1,n):
    if st[i][4]<40: watw[lab==i]=False
land=~watw
# 过河浅滩：原浅滩里两岸都接陆地的 + 原来的桥位
ford=np.zeros_like(watw)
n,lab,st,cen=cv2.connectedComponentsWithStats((C0==2).astype(np.uint8))
fords=[]
for i in range(1,n):
    m=lab==i; ring=dil(m,WID+4)&land&~dil(rockc,2)
    k,_=cv2.connectedComponents(ring.astype(np.uint8))
    wr_=dil(m,WID+4)&wat0&~dil(m,1)&(C0!=2); k2,_=cv2.connectedComponents(wr_.astype(np.uint8))
    if k-1>=2 and k2-1>=2 and st[i][4]<2500:   # 两岸都是陆地、上下游都是河 = 真正的过河点
        ford|=m; fords.append(tuple(cen[i]))
for k_,x,y in J0['objs']:
    if k_.startswith('bridge'):
        m=np.zeros_like(watw); cv2.circle(m.view(np.uint8),(x,y),22,1,-1); ford|=m.astype(bool); fords.append((x,y))
ford=dil(ford,WID+3)&watw
# 用户标的红线：沿线的河道整段改成可涉水的浅滩
shm=np.zeros((H,W),np.uint8)
for L_ in json.load(open(ROOT+'/art_src/map/shallows.json')): cv2.polylines(shm,[np.array(L_['点'],np.int32)],False,1,60)
ford|=(shm>0)&watw
print('过河点',len(fords))
C=C0.copy(); C[watw]=1; C[ford]=2
C[(C0==2)&~watw]=0
# ---------- 木桥（art_src/map/bridges.json：用户画的线；沿线延伸到两岸） ----------
BRS=[]
for L_ in json.load(open(ROOT+'/art_src/map/bridges.json')):
    (x0,y0),(x1,y1)=L_['点'][0],L_['点'][-1]
    if x1<x0: x0,y0,x1,y1=x1,y1,x0,y0                 # 统一从左到右，木纹亮面朝上
    mx,my=(x0+x1)/2,(y0+y1)/2; ux,uy=x1-x0,y1-y0; l=np.hypot(ux,uy); ux/=l; uy/=l
    ext=[]
    for sg in (-1,1):
        t=0
        while t<200 and (watw[int(my+sg*uy*t),int(mx+sg*ux*t)] or g[int(my+sg*uy*t),int(mx+sg*ux*t),2]>g[int(my+sg*uy*t),int(mx+sg*ux*t),0]+15 or t<l/2): t+=1
        ext.append(t+18)
    a_,b_=(mx-ux*ext[0],my-uy*ext[0]),(mx+ux*ext[1],my+uy*ext[1])
    bd=np.zeros((H,W),np.uint8); cv2.line(bd,(int(a_[0]),int(a_[1])),(int(b_[0]),int(b_[1])),1,16); C[bd>0]=0
    BRS.append((a_,b_))
C[back]=0
C[ridge]=1
Image.fromarray(np.dstack([C,np.zeros_like(C),np.zeros_like(C)])).save(MAP+'coll.png',optimize=True)
# ---------- 画水 ----------
S=900
def seamless(t):
    t=cv2.resize(t,(S,S),interpolation=cv2.INTER_AREA).astype(np.float32); b=int(S*.3)
    out=np.roll(np.roll(t,S//2,0),S//2,1); e=np.minimum(np.arange(S),S-1-np.arange(S))
    w=np.clip(np.minimum.outer(e,e)/b,0,1)[...,None]; return out*(1-w)+t*w
ld=lambda f:np.array(Image.open(ROOT+'/art_src/map/'+f).convert('RGB'))
TW=seamless(ld('water.png')); TS=seamless(ld('shallow.png'))
def tile(t,y0,h,w,ox=0): return t[(np.arange(y0,y0+h)[:,None])%S,(np.arange(w)[None,:]+ox)%S]
din=cv2.distanceTransform(watw.astype(np.uint8),cv2.DIST_L2,5); dout=cv2.distanceTransform(land.astype(np.uint8),cv2.DIST_L2,5)
sd=np.where(watw,din-0.5,-(dout-0.5))                   # 有符号距离：水里为正
nz=blur(rng.random((H//6+1,W//6+1)),1.0); nz=cv2.resize((nz-nz.min())/(np.ptp(nz)+1e-6),(W,H))
fordb=blur(ford,3)
n,lab,st,_=cv2.connectedComponentsWithStats(watw.astype(np.uint8))
sea=watw&(cv2.blur(watw.astype(np.float32),(121,121))>0.55)&(xx_>2500)&(yy_>1000)&(xx_>2500)&(yy_>1000)   # 大片开阔水面 = 海（河道太窄不算）
sea=cv2.morphologyEx(sea.astype(np.uint8),cv2.MORPH_OPEN,disk(10)).astype(bool)
dsea=cv2.distanceTransform((~sea).astype(np.uint8),cv2.DIST_L2,5)
bw=18+12*nz                                              # 沙滩宽度带点起伏
beach=land&(dsea<bw)
sand=np.clip((bw-dsea)/4,0,1)*land                       # 沙滩（边缘柔和过渡到草地）
wet=np.clip(1-dsea/7,0,1)*land
seanear=np.clip(1-dsea/30,0,1)
print('沙滩',beach.sum())
out=np.zeros_like(G); BH=640; Wd=W*HD
FU={}
def up(a,y0,y1):
    k=id(a)
    if k not in FU or FU[k][0] is not a: FU[k]=(a,cv2.resize(a.astype(np.float32),(Wd,H*HD),interpolation=cv2.INTER_LINEAR))
    return FU[k][1][y0:y1]
for y0 in range(0,H*HD,BH):
    y1=min(H*HD,y0+BH); h=y1-y0; L=lambda a:up(a,y0,y1)[...,None]
    col=G[y0:y1].astype(np.float32)
    s=L(sd); k=L(nz)
    # 岸：湿泥一圈
    bank=np.clip(1+s/4,0,1)*(s<=0)*(1-L(seanear))
    rf=L(rin); col=col*(1-rf)+(col*0.55+np.array([70,58,34],np.float32)*0.45)*rf     # 坡面：土色
    col=col*(1-0.5*L(ridge_lo))+36*L(ridge_hi)
    gr_=np.random.default_rng(y0).random((h,Wd,1)).astype(np.float32)
    sc_=L(sand); wt_=L(wet)
    sandc=(np.array([222,204,158],np.float32)*(1-wt_)+np.array([168,148,108],np.float32)*wt_)*(0.93+0.12*gr_)
    col=col*(1-sc_)+sandc*sc_
    col=col*(1-0.45*bank)+np.array([92,84,58],np.float32)*0.45*bank
    # 水：深处深蓝，靠岸变浅
    deep=tile(TW,y0,h,Wd)*np.array([0.62,0.78,0.98],np.float32)
    lite=tile(TW,y0,h,Wd,331)*0.55+np.array([150,196,206],np.float32)*0.45
    dk=np.clip((s-1)/9,0,1)
    wc=lite*(1-dk)+deep*dk
    fk=L(fordb); wc=wc*(1-fk)+(tile(TS,y0,h,Wd,77)*0.7+np.array([150,190,200],np.float32)*0.2)*fk
    fw=1.8+3.0*L(seanear)                                # 海浪更宽，外面再一道
    foam=np.clip(1-(s-0.2)/fw,0,1)*(s>-0.5)*(0.55+0.45*k)
    foam=np.maximum(foam,0.45*L(seanear)*np.clip(1-np.abs(s-8)/1.5,0,1)*k)
    wc=wc*(1-foam)+np.array([238,246,248],np.float32)*foam
    a=np.clip(s+0.5,0,1)
    out[y0:y1]=np.clip(col*(1-a)+wc*a,0,255).astype(np.uint8)
# 俯视木桥：木板纹理取自原木桥桥面，按桥的方向铺；两侧圆木栏杆；桥下影子（不画立柱，任何角度都不歪）
BW=np.array(Image.open(ROOT+'/art_src/map/bridge_wood.png').convert('RGB')).astype(np.float32)
PL=BW[36:60,40:340]; PL=cv2.resize(PL,(PL.shape[1],PL.shape[0]),interpolation=cv2.INTER_AREA)   # 木板（竖纹 = 垂直于行走方向）
RAIL=np.array([92,66,40],np.float32)
for (ax,ay),(bx,by) in BRS:
    A=np.array([ax,ay])*HD; B=np.array([bx,by])*HD; u=(B-A); Ln=np.linalg.norm(u); u/=Ln; v=np.array([-u[1],u[0]])
    HW=11*HD                                                    # 半宽
    x0_,y0_=int(min(A[0],B[0])-HW-12),int(min(A[1],B[1])-HW-12); x1_,y1_=int(max(A[0],B[0])+HW+12),int(max(A[1],B[1])+HW+12)
    yy,xx=np.mgrid[y0_:y1_,x0_:x1_].astype(np.float32); px,py=xx-A[0],yy-A[1]
    s_=px*u[0]+py*u[1]; t_=px*v[0]+py*v[1]
    reg=out[y0_:y1_,x0_:x1_].astype(np.float32)
    # 影子
    sh=((s_>0)&(s_<Ln)&(np.abs(t_-5)<HW+2)).astype(np.float32); sh=cv2.GaussianBlur(sh,(0,0),3)[...,None]
    reg=reg*(1-0.4*sh)
    inside=(s_>=0)&(s_<Ln)&(np.abs(t_)<HW)
    tu=(s_*1.0).astype(int)%PL.shape[1]; tv=np.clip(((t_+HW)/(2*HW)*PL.shape[0]).astype(int),0,PL.shape[0]-1)
    deck=PL[tv,tu]
    edge=np.abs(np.abs(t_)-(HW-3))<3                           # 两侧圆木
    lg=np.clip(1-np.abs(np.abs(t_)-(HW-3))/3,0,1)[...,None]
    deck=deck*(1-lg*0.85)+(RAIL*(0.75+0.5*lg))*lg*0.85
    endf=np.clip(np.minimum(s_,Ln-s_)/3,0,1)[...,None]          # 两头稍暗
    deck*=0.8+0.2*endf
    m=inside[...,None]
    reg=np.where(m,deck,reg)
    out[y0_:y1_,x0_:x1_]=np.clip(reg,0,255).astype(np.uint8)
print('木桥',[(tuple(map(int,a)),tuple(map(int,b))) for a,b in BRS])
for t in J['tiles']['list']:
    tx,ty=int(t[1]),int(t[2]); Image.fromarray(out[ty*T*HD:(ty+1)*T*HD,tx*T*HD:(tx+1)*T*HD]).save(MAP+t+'.jpg',quality=72,optimize=True)
Image.fromarray(out[::8,::8]).save(ROOT+'/art_src/build/preview_nature.png')
del out,G
# ---------- 物件 ----------
CUT=ROOT+'/art_src/build/lotr_cut/'
def add_sprite(k,src,th):
    im=Image.open(CUT+src+'.png'); hh=th*HD; ww=round(im.width*hh/im.height)
    ar=np.array(im.resize((ww,hh),Image.LANCZOS)); ar[...,3]=np.where(ar[...,3]>120,255,0)
    Image.fromarray(ar).save(MAP+'sprites/'+k+'.png'); J['size'][k]=[ww/HD,hh/HD]
add_sprite('willow','willow',64); J['coll_r']['willow']=6
SZ=J['size']
VEG=('broad','pine','bush','tuft','flow','dry','wcat','wreed','wlily','bridge','rmid','rsmall','wlog','st','wr','rf','willow')
objs=[o for o in J0['objs'] if not o[0].startswith(VEG)]
CS=40; grid={}
def far(x,y,r):
    for i in range(int(x//CS)-2,int(x//CS)+3):
        for j in range(int(y//CS)-2,int(y//CS)+3):
            for ox,oy,orr in grid.get((i,j),()):
                if (x-ox)**2+(y-oy)**2<(r+orr)**2: return False
    return True
def put(k,x,y,r):
    objs.append([k,int(x),int(y)]); grid.setdefault((int(x)//CS,int(y)//CS),[]).append((x,y,r))
SPAWN=J['spawn']
nowater=~dil(watw,6)&~dil(rockc,10)
notree=mount|dil(beach,6)
def okpos(x,y,cl=True):
    xi,yi=int(x),int(y)
    if not(8<x<W-8 and 8<y<H-4): return False
    if not nowater[yi,xi]: return False
    return not cl or (x-SPAWN[0])**2+(y-SPAWN[1])**2>150**2
# 森林密度：沿用原来树的分布（北边林墙、迷雾森林、几片树林）
dens=np.zeros((H,W),np.float32)
for k_,x,y in J0['objs']:
    if k_.startswith(('broad','pine')) and 0<=y<H: dens[y,x]+=1
dens=blur(dens,28); dens=np.clip(dens/np.percentile(dens[dens>0.0005],60),0,1.2)
reg=np.array(J['rmap']).reshape(J['rgrid'][1],J['rgrid'][0]); fr=cv2.resize((reg==1).astype(np.float32),(W,H))
dens=np.clip(dens+0.25*blur(fr,60),0,1.2)
def field(cell,seed):
    r=np.random.default_rng(seed).random((H//cell+2,W//cell+2)); r=blur(r,1.0); r=cv2.resize(r,(W,H),interpolation=cv2.INTER_CUBIC); return (r-r.min())/(np.ptp(r)+1e-6)
fC,fB,fO=field(110,1),field(70,2),field(110,3); clear=field(70,4)
north=np.clip(1-np.arange(H)/500,0,1)[:,None]
TREE={'con':(['pine1','pine1','pine2'],15),'bir':(['broad2','broad4'],17),'oak':(['broad1','broad3'],24)}
nt=0
for _ in range(260000):
    x,y=rng.uniform(0,W),rng.uniform(0,H); xi,yi=int(x),int(y); d=dens[yi,xi]
    if d<0.42 or rng.random()>min(1,(d-0.42)*0.8) or not okpos(x,y) or notree[yi,xi]: continue
    if d<0.75 and clear[yi,xi]<0.2: continue                 # 林中空地
    sc={'con':fC[yi,xi]+0.45*north[yi,0]+0.2*d,'bir':fB[yi,xi]-0.12,'oak':fO[yi,xi]-0.15*d}
    sp=max(sc,key=sc.get); ks,r=TREE[sp]; k=ks[rng.integers(len(ks))]
    if far(x,y,r*1.3): put(k,x,y,r*1.3); nt+=1   # 树间留宽一点的通道                # 树间留出能走的空隙
# 草地上的孤树：橡树 1~3 棵一组
for _ in range(0):                                     # 平原不放孤树
    x,y=rng.uniform(0,W),rng.uniform(0,H)
    if dens[int(y),int(x)]>0.12 or rng.random()>0.05 or not okpos(x,y) or notree[int(y),int(x)] or not far(x,y,110): continue
    for m in range(rng.integers(1,4)):
        xx,yy=x+rng.normal(0,22)*(m>0),y+rng.normal(0,16)*(m>0)
        if okpos(xx,yy) and not notree[int(yy),int(xx)] and far(xx,yy,18): put(['broad1','broad3'][rng.integers(2)],xx,yy,18); nt+=1
# 平原上的小片树林（5~10 棵同种）和一小排树（5~7 棵成一线），旁边带几丛灌木
GR=[]
for _ in range(20000):
    if len(GR)>=22: break
    x,y=rng.uniform(80,W-80),rng.uniform(150,H-80)
    if dens[int(y),int(x)]>0.15 or notree[int(y),int(x)] or not okpos(x,y) or any((x-a)**2+(y-b)**2<260**2 for a,b in GR): continue
    GR.append((x,y)); ks,r=TREE[['con','bir','oak'][rng.integers(3)]]; row=rng.random()<0.35; ang=rng.uniform(0,3.14)
    pts=[(x+np.cos(ang)*i*r*1.6,y+np.sin(ang)*i*r*1.1) for i in range(-3,4)] if row else [(x+rng.normal(0,r*1.6),y+rng.normal(0,r*1.1)) for _ in range(rng.integers(5,11))]
    for xx,yy in pts:
        if okpos(xx,yy) and not notree[int(yy),int(xx)] and far(xx,yy,r*0.9): put(ks[rng.integers(len(ks))],xx,yy,r*0.9); nt+=1
    for _ in range(rng.integers(2,5)):
        a2=rng.uniform(0,6.28); xx,yy=x+np.cos(a2)*r*3.2,y+np.sin(a2)*r*2.4; k2=['bushL2','bushM1','tuft1'][rng.integers(3)]
        if okpos(xx,yy) and far(xx,yy,8): put(k2,xx,yy,8)
print('小树林',len(GR))
# 水边柳树
wl=np.nonzero((dout>7)&(dout<12)&~dil(rockc,10))
for j in rng.permutation(len(wl[0]))[:3000]:
    y,x=int(wl[0][j]),int(wl[1][j])
    if rng.random()<0.3 and okpos(x,y) and not notree[y,x] and far(x,y,95) and not watw[max(0,y-60):y,max(0,x-20):x+20].any(): put('willow',x,y,20)
print('树',nt)
# 灌木：一团一团，同一团同一种
EDGE=[(['bushL2'],.3),(['bushM1'],.3),(['bushL1'],.15),(['tuft1','tuft4'],.25)]   # 林缘：荆棘、山楂、金雀花、蕨
nb=0
for _ in range(60000):
    x,y=rng.uniform(0,W),rng.uniform(0,H); xi,yi=int(x),int(y); d=dens[yi,xi]
    if mount[yi,xi]:
        if rng.random()>0.02: continue
        ks=[['bushM2','bushS2'],['bushL1']][rng.integers(2)]
    else:
        if not(0.3<d<0.5) or rng.random()>0.14 or beach[yi,xi]: continue
        ks=EDGE[rng.choice(len(EDGE),p=[e[1] for e in EDGE])][0]
    if not okpos(x,y) or not far(x,y,40): continue
    for _ in range(rng.integers(3,7)):
        xx,yy=x+rng.normal(0,16),y+rng.normal(0,11); k=ks[rng.integers(len(ks))]; r=SZ[k][0]*0.38
        if okpos(xx,yy) and far(xx,yy,r): put(k,xx,yy,r); nb+=1
# 林下：蕨类、毛地黄
for _ in range(30000):
    x,y=rng.uniform(0,W),rng.uniform(0,H); d=dens[int(y),int(x)]
    if not(0.45<d<1.0) or rng.random()>0.03 or not okpos(x,y) or mount[int(y),int(x)]: continue
    k=['tuft1','tuft4','tuft3'][rng.choice(3,p=[.45,.4,.15])]
    if far(x,y,8): put(k,x,y,8); nb+=1
# 野花：草地上小片
for _ in range(0):                                     # 平原不放野花
    x,y=rng.uniform(0,W),rng.uniform(0,H)
    if dens[int(y),int(x)]>0.1 or rng.random()>0.025 or not okpos(x,y,False) or beach[int(y),int(x)] or not far(x,y,80): continue
    for _ in range(rng.integers(2,6)):
        xx,yy=x+rng.normal(0,14),y+rng.normal(0,9)
        if okpos(xx,yy,False) and far(xx,yy,5): put(['tuft2','bushS1'][rng.integers(2)],xx,yy,5); nb+=1
print('灌木草花',nb)
# 水边：芦苇、香蒲成丛（避开过河点）
bankz=(dout>0.5)&(dout<4)&~dil(ford,14)&~dil(rockc,8)&(dsea>40); by,bx=np.nonzero(bankz); nr=0; RC=[]
for j in rng.permutation(len(bx))[:20000]:
    x,y=int(bx[j]),int(by[j])
    if y<50 or rng.random()>0.25 or any((x-a)**2+(y-b)**2<55**2 for a,b in RC): continue
    RC.append((x,y))
    ks=['wcat1','wcat2','wcat3'] if rng.random()<0.5 else ['wreed1','wreed2','wreed3']
    for _ in range(rng.integers(2,5)):
        xx,yy=x+rng.normal(0,9),y+rng.normal(0,5); xi,yi=int(xx),int(yy)
        if 0<xi<W and 0<yi<H and dout[yi,xi]<6 and not ford[yi,xi] and far(xx,yy,2): put(ks[rng.integers(3)],xx,yy,6); nr+=1
# 睡莲：只在大片水面靠边处
n,lab,st,_=cv2.connectedComponentsWithStats(watw.astype(np.uint8)); big=np.isin(lab,[i for i in range(1,n) if st[i][4]>2500])&~sea
ly,lx=np.nonzero(big&(din>4)&(din<9)&~dil(ford,20))
for j in rng.permutation(len(lx))[:6000]:
    x,y=int(lx[j]),int(ly[j])
    if rng.random()<0.15 and far(x,y,70): put(['wlily1','wlily2'][rng.integers(2)],x,y,8)
print('水边',nr)
# 石头：过河点放踏脚石；大片水面靠岸处零星河中石；峡谷末端落石
# 沙滩：零星浮木、卵石
by_,bx_=np.nonzero(beach&(dsea>5)&(dsea<14)); BB=[]
for j in rng.permutation(len(bx_))[:3000]:
    x,y=int(bx_[j]),int(by_[j])
    if rng.random()<0.3 and all((x-a)**2+(y-b)**2>120**2 for a,b in BB) and far(x,y,10): BB.append((x,y)); put('wlog',x,y,10)
def nearbr(x,y):
    for (ax,ay),(bx,by) in BRS:
        u=np.array([bx-ax,by-ay]); l=np.linalg.norm(u); t=np.clip(((x-ax)*u[0]+(y-ay)*u[1])/l**2,0,1)
        if np.hypot(x-ax-u[0]*t,y-ay-u[1]*t)<26: return True
    return False
objs=[o for o in objs if not nearbr(o[1],o[2])]
pass   # 踏脚石已删除
WR=[]
ry,rx=np.nonzero(big&(din>5)&(din<9)&~dil(ford,30)); nw=0
for j in rng.permutation(len(rx))[:4000]:
    x,y=int(rx[j]),int(ry[j])
    if False and all((x-a)**2+(y-b)**2>300**2 for a,b in WR):
        WR.append((x,y))
        put('wr%d'%rng.integers(1,5),x,y,10); nw+=1
for k,x,y in [('rf1',1232,1392),('rf3',1246,1360),('rf4',1214,1352)]: put(k,x,y,12)
objs=[o for o in objs if not (REDM[min(H-1,o[2]),min(W-1,o[1])] and o[0][:2] in ('br','pi','bu','tu','fl','wc','wr','wl','dr'))]
J['objs']=objs; J['size']={k:v for k,v in J['size'].items() if k in {o[0] for o in objs} or True}
json.dump(J,open(ROOT+'/data/world.json','w'),separators=(',',':'))
print('物件总数',len(objs),'河中石',nw)
# ---------- 裁边（用户画线：上边 y≈100 以上、左边 x≈100 以左删除）。之前的标注文件都用裁前坐标 ----------
CX,CY=100,100
Gf=np.zeros((H*HD,W*HD,3),np.uint8)
for t in J['tiles']['list']:
    tx,ty=int(t[1]),int(t[2]); im=np.array(Image.open(MAP+t+'.jpg').convert('RGB')); Gf[ty*T*HD:ty*T*HD+im.shape[0],tx*T*HD:tx*T*HD+im.shape[1]]=im
Gf=Gf[CY*HD:,CX*HD:]; W2,H2=W-CX,H-CY
for t in J['tiles']['list']:
    tx,ty=int(t[1]),int(t[2]); Image.fromarray(Gf[ty*T*HD:(ty+1)*T*HD,tx*T*HD:(tx+1)*T*HD]).save(MAP+t+'.jpg',quality=72,optimize=True)
Cc=np.array(Image.open(MAP+'coll.png'))[CY:,CX:]; Image.fromarray(Cc).save(MAP+'coll.png',optimize=True)
J['objs']=[[k,x-CX,y-CY] for k,x,y in J['objs'] if x-CX>=4 and y-CY>=4]
J['spawn']=[J['spawn'][0]-CX,J['spawn'][1]-CY]; J['WW'],J['WH']=W2,H2; J['off']=[CX,CY]
gw,gh=J['rgrid']; rm=np.array(J['rmap']).reshape(gh,gw)[CY//50:,CX//50:]; J['rmap']=rm.flatten().tolist(); J['rgrid']=[rm.shape[1],rm.shape[0]]
json.dump(J,open(ROOT+'/data/world.json','w'),separators=(',',':'))
Image.fromarray(Gf[::8,::8]).save(ROOT+'/art_src/build/preview_nature.png')
print('裁边后',W2,H2)
