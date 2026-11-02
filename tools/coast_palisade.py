"""一次性脚本（用户画线 11/03）：东/南海岸向海扩成草原并做顺滑海岸线；南湖浅滩接到海；清掉看不见的小碰撞块；生成山顶木栅数据。"""
import numpy as np,json,cv2
from PIL import Image
R='/home/claude/sanguoxingcunzhe';M=R+'/assets/map/'
J=json.load(open(R+'/data/world.json'));HD=J['HD'];T=J['tiles']['T'];W,H=J['WW'],J['WH']
L=json.load(open(R+'/tools/user_lines_1103.json'))
full=np.zeros((H*HD,W*HD,3),np.uint8)
for t in J['tiles']['list']:
    im=np.array(Image.open(M+t+'.jpg').convert('RGB'));tx,ty=int(t[1]),int(t[2]);full[ty*T*HD:ty*T*HD+im.shape[0],tx*T*HD:tx*T*HD+im.shape[1]]=im
c=np.array(Image.open(M+'coll.png').convert('RGB'));b=c[...,0]
f=full[::HD,::HD].astype(int);sea=(f[...,2]>f[...,1]+40)&(f[...,0]<90)
sea=cv2.morphologyEx(sea.astype(np.uint8),cv2.MORPH_OPEN,np.ones((5,5),np.uint8))>0
# 只算真正的大海（和地图边缘连通的水）
n,lb=cv2.connectedComponents(sea.astype(np.uint8));edge=set(np.unique(np.concatenate([lb[0],lb[-1],lb[:,0],lb[:,-1]])))-{0}
ocean=np.isin(lb,list(edge))
# 1) 清小碰撞块
n2,lb2,st,_=cv2.connectedComponentsWithStats((b==1).astype(np.uint8),8)
for i in range(1,n2):
    if st[i,4]<100:b[lb2==i]=0
# 2) 海岸扩张：沿用户东/南海岸的线（x>1000 的红线），向海推 55px，再把海岸线整体抹顺
coast=np.zeros((H,W),np.uint8)
for l in L:
    P=np.array(l['点']);
    if P[:,0].mean()>1000 and len(P)>12:cv2.polylines(coast,[P.astype(np.int32)],False,255,110)
land=~ocean
grow=land|((coast>0)&ocean)
k=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(41,41))
sm=cv2.GaussianBlur(cv2.morphologyEx(grow.astype(np.uint8)*255,cv2.MORPH_CLOSE,k).astype(np.float32),(0,0),9)>127
reg=np.zeros((H,W),bool);reg[:,1250:]=True;reg[950:,1000:]=True
newland=sm&ocean&reg
# 去掉海里孤立的小岛、陆地里残留的小水坑
L2=(~ocean)|newland;n3,lb3,st3,_=cv2.connectedComponentsWithStats(L2.astype(np.uint8),8);big=1+np.argmax(st3[1:,4]);newland&=(lb3==big)
O2=~((~ocean)|newland);n4,lb4,st4,_=cv2.connectedComponentsWithStats(O2.astype(np.uint8),8)
for i in range(1,n4):
    if st4[i,4]<3000:newland|=(lb4==i)&ocean
# 3) 南湖→海 浅滩
pond=np.array([[1058,1050],[1075,1080],[1100,1105],[1125,1125],[1150,1140],[1165,1188]])
riv=np.zeros((H,W),np.uint8);cv2.polylines(riv,[pond.astype(np.int32)],False,255,34);cv2.polylines(riv,[np.array([[1655,480],[1700,462],[1760,440],[1820,420]],np.int32)],False,255,44)
riv=riv>0
# 画面：新陆地用内陆草地纹理（向内平移 140px 取样）
def up(m):return cv2.resize(m.astype(np.uint8),(W*HD,H*HD),interpolation=cv2.INTER_NEAREST)>0
# 老海岸线的白边也盖掉：新陆地再往陆地里多吃 10px
dist_o=cv2.distanceTransform((~ocean).astype(np.uint8),cv2.DIST_L2,5)
paint=(newland|((dist_o<10)&~ocean&cv2.dilate(newland.astype(np.uint8),np.ones((25,25),np.uint8)).astype(bool)))
clean=(b==0)&(dist_o>25)
# 每个要画的点，从几个方向平移取「干净草地」
offs=[(0,-150),(-150,0),(0,-260),(-260,0),(-150,-150),(0,-380),(-380,0),(150,0),(150,-150),(300,-150),(300,0)]
pick=np.full((H,W),-1,np.int8)
for i,(dy,dx) in enumerate(offs):
    sh=np.roll(clean,(-dy,-dx),axis=(0,1)) if False else np.roll(clean,(-dy,-dx),axis=(0,1))
    YY,XX=np.mgrid[0:H,0:W];inb=(YY+dy>=0)&(YY+dy<H)&(XX+dx>=0)&(XX+dx<W)
    ok=paint&(pick<0)&inb&np.roll(clean,(-dy,-dx),axis=(0,1))
    pick[ok]=i
newland&=pick>=0
pickH=cv2.resize(pick,(W*HD,H*HD),interpolation=cv2.INTER_NEAREST)
grass=full.copy()
for i,(dy,dx) in enumerate(offs):
    m=pickH==i
    if m.any():grass[m]=np.roll(full,(-dy*HD,-dx*HD),axis=(0,1))[m]
pl=up(paint&(pick>=0))
a=cv2.GaussianBlur(pl.astype(np.float32),(0,0),2*HD)[...,None]
out=full*(1-a)+grass*a
ocean2=ocean&~newland
landH=up(~ocean2);e=cv2.GaussianBlur(landH.astype(np.float32),(0,0),1.5*HD);edge=np.clip(1-np.abs(e-.5)*4,0,1)[...,None]*.5*up(reg)[...,None]
out=out*(1-edge)+np.array([225,235,238])*edge
full=np.clip(out,0,255).astype(np.uint8)
# 浅滩
yy=int(np.mean([p[1] for p in [(0,1100)]]));
P=10*HD;cx,cy=1500,0;ys=np.where(b[480:620,1500]==2)[0];cy=480+int(ys.mean())
patch=full[cy*HD-P//2:cy*HD+P//2,cx*HD-P:cx*HD+P].astype(np.float32);pm=np.concatenate([patch,patch[:,::-1]],1);pm=np.concatenate([pm,pm[::-1]],0)
water=np.tile(pm,(full.shape[0]//pm.shape[0]+1,full.shape[1]//pm.shape[1]+1,1))[:full.shape[0],:full.shape[1]]
pondDeep=sea&~ocean
rmask=riv&~pondDeep&~(ocean&~newland)
rH=up(rmask);ra=cv2.GaussianBlur(rH.astype(np.float32),(0,0),1.5*HD)[...,None]*(~up(pondDeep|(ocean&~newland)))[...,None]
ed=np.clip(1-np.abs(ra[...,0]-.5)*4,0,1)[...,None]*.45
o2=full*(1-ra)+water*ra;o2=o2*(1-ed)+np.array([225,235,238])*ed;full=np.clip(o2,0,255).astype(np.uint8)
# 碰撞
b[newland]=0;b[rmask]=2
# 新陆地边缘外的海仍是 1
c[...,0]=b;Image.fromarray(c).save(M+'coll.png')
for t in J['tiles']['list']:
    tx,ty=int(t[1]),int(t[2]);Image.fromarray(full[ty*T*HD:(ty+1)*T*HD,tx*T*HD:(tx+1)*T*HD]).save(M+t+'.jpg',quality=80,optimize=True)
J['ver']=J.get('ver',0)+1;json.dump(J,open(R+'/data/world.json','w'),ensure_ascii=False,separators=(',',':'))
Image.fromarray(full[::4,::4]).save('/tmp/claude-0/s/after.png');print('newland',int(newland.sum()),'river',int(rmask.sum()))
