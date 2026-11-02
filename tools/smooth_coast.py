"""一次性：东/南海岸线整体抹顺（大尺度平滑），重画草地/海水和浪花边。"""
import numpy as np,cv2,json
from PIL import Image
R='/home/claude/sanguoxingcunzhe';M=R+'/assets/map/'
J=json.load(open(R+'/data/world.json'));HD=J['HD'];T=J['tiles']['T'];W,H=J['WW'],J['WH']
full=np.zeros((H*HD,W*HD,3),np.uint8)
for t in J['tiles']['list']:
    im=np.array(Image.open(M+t+'.jpg').convert('RGB'));tx,ty=int(t[1]),int(t[2]);full[ty*T*HD:ty*T*HD+im.shape[0],tx*T*HD:tx*T*HD+im.shape[1]]=im
c=np.array(Image.open(M+'coll.png').convert('RGB'));b=c[...,0]
f=cv2.GaussianBlur(full[::HD,::HD].astype(np.float32),(0,0),2);sea=(f[...,2]>f[...,1]+40)&(f[...,0]<90)
n,lb=cv2.connectedComponents(sea.astype(np.uint8));ed=set(np.unique(np.concatenate([lb[-1],lb[:,-1]])))-{0};ocean=np.isin(lb,list(ed))
reg=np.zeros((H,W),bool);reg[60:,1450:]=True;reg[950:,900:]=True
land=~ocean
sm=cv2.GaussianBlur(land.astype(np.float32),(0,0),22)>.5
newsea=reg&land&~sm&(b!=2)
newland=reg&ocean&sm
up=lambda x:cv2.resize(x.astype(np.uint8),(W*HD,H*HD),interpolation=cv2.INTER_NEAREST)>0
P=full[900*HD:900*HD+128,1800*HD:1800*HD+128].astype(np.float32);pm=np.concatenate([P,P[:,::-1]],1);pm=np.concatenate([pm,pm[::-1]],0)
water=np.tile(pm,(H*HD//pm.shape[0]+1,W*HD//pm.shape[1]+1,1))[:H*HD,:W*HD]
s=8;small=cv2.resize(full,(W*HD//s,H*HD//s),interpolation=cv2.INTER_AREA)
unk=cv2.resize((newland|ocean|((f[...,2]>74)&reg)|(b==1)|(b==2)).astype(np.uint8),(W*HD//s,H*HD//s),interpolation=cv2.INTER_NEAREST);unk=cv2.dilate(unk,np.ones((5,5),np.uint8))
low=cv2.inpaint(small[...,::-1],unk*255,10,cv2.INPAINT_TELEA)[...,::-1];low=cv2.GaussianBlur(low.astype(np.float32),(0,0),3);low=cv2.resize(low,(W*HD,H*HD),interpolation=cv2.INTER_CUBIC)
pre=np.array(Image.open('/tmp/claude-0/s/pre/g00.jpg').convert('RGB'))
Pt=pre[150*HD:150*HD+256,900*HD:900*HD+256].astype(np.float32);det=Pt-cv2.GaussianBlur(Pt,(0,0),12)
det=np.concatenate([det,det[:,::-1]],1);det=np.concatenate([det,det[::-1]],0)
tile=np.tile(det,(H*HD//det.shape[0]+1,W*HD//det.shape[1]+1,1))[:H*HD,:W*HD]
socean=(ocean|newsea)&~newland
# 海岸附近一条带子全部重画，保证白边只有一条
dcoast=cv2.distanceTransform((~socean).astype(np.uint8),cv2.DIST_L2,5);dland=cv2.distanceTransform(socean.astype(np.uint8),cv2.DIST_L2,5)
haze=(f[...,2]>74)&(f[...,2]<f[...,1]-20)&(b==0)&reg&~socean
haze=cv2.morphologyEx(haze.astype(np.uint8),cv2.MORPH_CLOSE,np.ones((11,11),np.uint8)).astype(bool)&(b==0)&~socean
bandL=(reg&~socean&(dcoast<10)&(b!=2))|haze;bandS=reg&socean&(dland<10)
out=full.astype(np.float32)
a=cv2.GaussianBlur(up(newland|bandL).astype(np.float32),(0,0),2)[...,None];out=out*(1-a)+(low+tile)*a
a=cv2.GaussianBlur(up(newsea|bandS).astype(np.float32),(0,0),2)[...,None];out=out*(1-a)+water*a
O=up(socean);e=cv2.GaussianBlur((~O).astype(np.float32),(0,0),1.5*HD)
edge=np.clip(1-np.abs(e-.5)*4,0,1)[...,None]*.55*up(reg)[...,None]
out=np.clip(out*(1-edge)+np.array([225,235,238])*edge,0,255).astype(np.uint8)
b[newsea]=1;b[newland&(b==1)]=0;c[...,0]=b;Image.fromarray(c).save(M+'coll.png')
for t in J['tiles']['list']:
    tx,ty=int(t[1]),int(t[2]);Image.fromarray(out[ty*T*HD:(ty+1)*T*HD,tx*T*HD:(tx+1)*T*HD]).save(M+t+'.jpg',quality=82,optimize=True)
J['ver']+=1;json.dump(J,open(R+'/data/world.json','w'),ensure_ascii=False,separators=(',',':'))
Image.fromarray(out[:, 900*HD:][::3,::3]).save('/tmp/claude-0/s/co.png');print(newsea.sum(),newland.sum())
