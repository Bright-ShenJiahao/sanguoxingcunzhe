"""一次性：把扩海岸新增的草地重画（低频颜色从周围草地延伸 + 一块干净草地的细节纹理平铺），去掉方块接缝和营地痕迹。"""
import numpy as np,cv2,json
from PIL import Image
R='/home/claude/sanguoxingcunzhe';M=R+'/assets/map/';PRE='/tmp/claude-0/s/pre/'
J=json.load(open(R+'/data/world.json'));HD=J['HD'];T=J['tiles']['T'];W,H=J['WW'],J['WH']
def load(d):
    f=np.zeros((H*HD,W*HD,3),np.uint8)
    for t in J['tiles']['list']:
        im=np.array(Image.open(d+t+'.jpg').convert('RGB'));tx,ty=int(t[1]),int(t[2]);f[ty*T*HD:ty*T*HD+im.shape[0],tx*T*HD:tx*T*HD+im.shape[1]]=im
    return f
cur=load(M);pre=load(PRE)
def seaof(full):f=full[::HD,::HD].astype(int);return (f[...,2]>f[...,1]+40)&(f[...,0]<90)
b=np.array(Image.open(M+'coll.png').convert('RGB'))[...,0]
psea=seaof(pre);csea=seaof(cur)
reg=np.zeros((H,W),bool);reg[:,1250:]=True;reg[900:,950:]=True
dpre=cv2.distanceTransform((~psea).astype(np.uint8),cv2.DIST_L2,5)
dcur=cv2.distanceTransform((~csea).astype(np.uint8),cv2.DIST_L2,5)
area=reg&(b==0)&(psea|(dpre<16))&(dcur>7)
# 也把之前拼接碰到的地方（与老图差异大的陆地）一起重画
diff=np.abs(cur[::HD,::HD].astype(int)-pre[::HD,::HD].astype(int)).sum(-1)>40
area|=reg&(b==0)&diff&(dcur>7)&~psea&(dpre<200)
cf0=cur[::HD,::HD].astype(int);odd=((cf0[...,0]>cf0[...,1]-5)|(cf0[...,2]>cf0[...,1]))&reg&(b==0)&(dcur>7)
area|=cv2.dilate(odd.astype(np.uint8),np.ones((7,7),np.uint8))>0
area=cv2.morphologyEx(area.astype(np.uint8),cv2.MORPH_CLOSE,np.ones((7,7),np.uint8))>0
area&=(b==0)&(dcur>7)
up=lambda m:cv2.resize(m.astype(np.uint8),(W*HD,H*HD),interpolation=cv2.INTER_NEAREST)>0
A=up(area)
# 低频：缩小 8 倍后修补
s=8;small=cv2.resize(cur,(W*HD//s,H*HD//s),interpolation=cv2.INTER_AREA)
cf=cur[::HD,::HD].astype(int);sand=(cf[...,0]>cf[...,1]-5)
unk=cv2.resize((area|csea|(b==2)|(b==1)|sand|odd).astype(np.uint8),(W*HD//s,H*HD//s),interpolation=cv2.INTER_NEAREST)
unk=cv2.dilate(unk,np.ones((3,3),np.uint8))
low=cv2.inpaint(small[...,::-1],unk*255,6,cv2.INPAINT_TELEA)[...,::-1]
low=cv2.GaussianBlur(low.astype(np.float32),(0,0),3)
low=cv2.resize(low,(W*HD,H*HD),interpolation=cv2.INTER_CUBIC)
# 细节：干净草地块去掉低频后镜像平铺
P=pre[150*HD:150*HD+256,900*HD:900*HD+256].astype(np.float32)
det=P-cv2.GaussianBlur(P,(0,0),12)
det=np.concatenate([det,det[:,::-1]],1);det=np.concatenate([det,det[::-1]],0)
tile=np.tile(det,(H*HD//det.shape[0]+1,W*HD//det.shape[1]+1,1))[:H*HD,:W*HD]
g=low+tile
a=cv2.GaussianBlur(A.astype(np.float32),(0,0),3)[...,None]
out=np.clip(cur*(1-a)+g*a,0,255).astype(np.uint8)
for t in J['tiles']['list']:
    tx,ty=int(t[1]),int(t[2]);Image.fromarray(out[ty*T*HD:(ty+1)*T*HD,tx*T*HD:(tx+1)*T*HD]).save(M+t+'.jpg',quality=82,optimize=True)
J['ver']+=1;json.dump(J,open(R+'/data/world.json','w'),ensure_ascii=False,separators=(',',':'))
Image.fromarray(out[:, 950*HD:][::2,::2]).save('/tmp/claude-0/s/rp.png');print(area.sum())
