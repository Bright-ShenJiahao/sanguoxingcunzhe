"""浅滩踏脚石 / 河中石 / 崖壁末端落石（art_src/map/lotr/stones.png，3 行 x 4 个，洋红底）
→ sprites st1-4 / wr1-4 / rf1-4，并按 coll.png 自动摆进 data/world.json（重复运行会先清掉旧的）。"""
import numpy as np, cv2, json, os
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT=ROOT+'/assets/map/sprites/'
J=json.load(open(ROOT+'/data/world.json')); HD=J['HD']; rng=np.random.default_rng(11)
a=np.array(Image.open(ROOT+'/art_src/map/lotr/stones.png').convert('RGB')).astype(int); r,g,b=a[...,0],a[...,1],a[...,2]
bg=((r>150)&(b>130)&(g<120))|((r>g+35)&(b>g+35))
fg=cv2.morphologyEx((~bg).astype(np.uint8),cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
def runs(on):
    R=[];s0=None
    for x,v in enumerate(list(on)+[False]):
        if v and s0 is None: s0=x
        if not v and s0 is not None: R.append([s0,x]); s0=None
    return R
rows=[q for q in runs(fg.sum(1)>3) if q[1]-q[0]>60]; assert len(rows)==3,rows
bx=[]
for y0,y1 in rows:
    F=fg[y0:y1]; prof=F.sum(0); segs=[q for q in runs(prof>2)]
    while len(segs)>4:
        k=min(range(len(segs)),key=lambda i:segs[i][1]-segs[i][0]); o=k-1 if k==len(segs)-1 or (k>0 and segs[k][0]-segs[k-1][1]<segs[k+1][0]-segs[k][1]) else k+1
        segs[min(k,o)]=[min(segs[k][0],segs[o][0]),max(segs[k][1],segs[o][1])]; segs.pop(max(k,o))
    while len(segs)<4:
        k=max(range(len(segs)),key=lambda i:segs[i][1]-segs[i][0]); a0,a1=segs[k]; w=a1-a0
        c=a0+int(w*.3)+int(np.argmin(prof[a0+int(w*.3):a0+int(w*.7)])); segs[k:k+1]=[[a0,c],[c,a1]]
    for x0,x1 in segs:
        ys=np.nonzero(F[:,x0:x1].any(1))[0]; bx.append((x0,y0+ys.min(),x1-x0,ys.max()+1-ys.min(),0))
H={'st':26,'wr':22,'rf':40}   # 逻辑像素高度
for i,(x,y,w,h,_) in enumerate(bx):
    k=['st','wr','rf'][i//4]+str(i%4+1); m=fg[y:y+h,x:x+w].astype(bool)
    im=Image.fromarray(np.dstack([a[y:y+h,x:x+w],m*255]).astype(np.uint8),'RGBA')
    hh=H[k[:2]]*HD*(1 if k[:2]!='rf' else [1,.85,.7,.75][i%4]); hh=round(hh); ww=round(im.width*hh/im.height)
    ar=np.array(im.resize((ww,hh),Image.LANCZOS)); ar[...,3]=np.where(ar[...,3]>120,255,0)
    Image.fromarray(ar).save(OUT+k+'.png'); J['size'][k]=[ww/HD,hh/HD]
C=np.array(Image.open(ROOT+'/assets/map/coll.png').convert('RGB'))[...,0]
objs=[o for o in J['objs'] if not o[0][:2] in ('st','wr','rf')]
occ=[]
def ok(x,y,d):
    for ox,oy in occ:
        if (x-ox)**2+(y-oy)**2<d*d: return False
    return True
# 1) 浅滩：每块浅水区按面积放几组踏脚石
n,lab,st,cen=cv2.connectedComponentsWithStats((C==2).astype(np.uint8))
ns=0
for i in range(1,n):
    ys,xs=np.nonzero(lab==i); cnt=max(1,min(8,st[i][4]//900))
    for _ in range(cnt*6):
        if cnt<=0: break
        j=rng.integers(len(xs)); x,y=int(xs[j]),int(ys[j])
        if C[max(0,y-6):y+7,max(0,x-10):x+11].min()!=2 or not ok(x,y,60): continue
        objs.append(['st%d'%rng.integers(1,5),x,y]); occ.append((x,y)); cnt-=1; ns+=1
# 2) 河中石：深水里、离岸不远的地方零星放
G=np.zeros((C.shape[0],C.shape[1],3),np.uint8)
for t in J['tiles']['list']:
    tx,ty=int(t[1]),int(t[2]); im=np.array(Image.open(ROOT+'/assets/map/'+t+'.jpg').convert('RGB'))[::HD,::HD]; T=J['tiles']['T']; G[ty*T:ty*T+im.shape[0],tx*T:tx*T+im.shape[1]]=im
G=G.astype(int); blue=(G[...,2]>G[...,1]+5)
water=(C==1)&blue; dist=cv2.distanceTransform(water.astype(np.uint8),cv2.DIST_L2,5)
ys,xs=np.nonzero((dist>4)&(dist<10)); nw=0
for j in rng.permutation(len(xs))[:4000]:
    x,y=int(xs[j]),int(ys[j])
    if y<60 or not ok(x,y,140) or rng.random()>.5: continue
    objs.append(['wr%d'%rng.integers(1,5),x,y]); occ.append((x,y)); nw+=1
# 3) 崖壁末端：不可走、旁边没有水的细长岩带，两头堆落石
rock=((C==1)&~cv2.dilate(blue.astype(np.uint8),np.ones((5,5),np.uint8)).astype(bool)).astype(np.uint8); rock[:60]=0
nr=0   # 自动找尖端会落到看不见崖壁的地方，只用手工位置
# 手工补：峡谷（大河北岸崖壁）东端
for k,x,y in [('rf1',1232,1392),('rf3',1246,1360),('rf4',1214,1352)]: objs.append([k,x,y]); nr+=1
J['objs']=objs; json.dump(J,open(ROOT+'/data/world.json','w'),separators=(',',':'))
print('踏脚石',ns,'河中石',nw,'落石',nr)
