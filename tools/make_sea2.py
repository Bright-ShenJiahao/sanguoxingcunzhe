"""一次性：用户绿圈（11/03 b）改成海。"""
import numpy as np,cv2,json
from PIL import Image
R='/home/claude/sanguoxingcunzhe';M=R+'/assets/map/'
J=json.load(open(R+'/data/world.json'));HD=J['HD'];T=J['tiles']['T'];W,H=J['WW'],J['WH']
full=np.zeros((H*HD,W*HD,3),np.uint8)
for t in J['tiles']['list']:
    im=np.array(Image.open(M+t+'.jpg').convert('RGB'));tx,ty=int(t[1]),int(t[2]);full[ty*T*HD:ty*T*HD+im.shape[0],tx*T*HD:tx*T*HD+im.shape[1]]=im
c=np.array(Image.open(M+'coll.png').convert('RGB'));b=c[...,0]
L=json.load(open(R+'/tools/user_lines_1103b.json'))
m=np.zeros((H,W),np.uint8)
for l in L:cv2.fillPoly(m,[np.array(l['点'],np.int32)],1)
m[1170:,1005:1430]=np.maximum(m[1170:,1005:1430],1)   # 底边那条一直到地图下边缘
f=full[::HD,::HD].astype(int);sea=(f[...,2]>f[...,1]+40)&(f[...,0]<90)
sm=cv2.GaussianBlur(((m>0)|sea).astype(np.float32),(0,0),4)>.5
new=sm&~sea&(m>0)|(sm&~sea&cv2.dilate(m,np.ones((15,15),np.uint8)).astype(bool))
up=lambda x:cv2.resize(x.astype(np.uint8),(W*HD,H*HD),interpolation=cv2.INTER_NEAREST)>0
P=full[900*HD:900*HD+128,1800*HD:1800*HD+128].astype(np.float32);pm=np.concatenate([P,P[:,::-1]],1);pm=np.concatenate([pm,pm[::-1]],0)
water=np.tile(pm,(H*HD//pm.shape[0]+1,W*HD//pm.shape[1]+1,1))[:H*HD,:W*HD]
A=up(new);a=cv2.GaussianBlur(A.astype(np.float32),(0,0),1.5*HD)[...,None]
out=full*(1-a)+water*a
allsea=up(sea|new);e=cv2.GaussianBlur((~allsea).astype(np.float32),(0,0),1.5*HD)
near=up(cv2.dilate(new.astype(np.uint8),np.ones((9,9),np.uint8)))
edge=np.clip(1-np.abs(e-.5)*4,0,1)[...,None]*.5*near[...,None]
out=np.clip(out*(1-edge)+np.array([225,235,238])*edge,0,255).astype(np.uint8)
b[new]=1;c[...,0]=b;Image.fromarray(c).save(M+'coll.png')
for t in J['tiles']['list']:
    tx,ty=int(t[1]),int(t[2]);Image.fromarray(out[ty*T*HD:(ty+1)*T*HD,tx*T*HD:(tx+1)*T*HD]).save(M+t+'.jpg',quality=82,optimize=True)
J['ver']+=1;json.dump(J,open(R+'/data/world.json','w'),ensure_ascii=False,separators=(',',':'))
Image.fromarray(out[1000*HD:,950*HD:1650*HD][::2,::2]).save('/tmp/claude-0/s/sea2.png');print(new.sum())
