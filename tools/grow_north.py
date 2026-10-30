"""地图往北加高 N：最上面新加一条草原（东侧海岸顺着弧线往上收），原来的北边白桦林拆掉、改种到新的最北边。
用法：python3 tools/grow_north.py [N=350]"""
import json,sys,os,subprocess,numpy as np,cv2
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));M=R+'/assets/map/'
N=int(sys.argv[1]) if len(sys.argv)>1 else 350;FB=95   # 旧白桦林带的下沿
J=json.load(open(R+'/data/world.json'));HD=J['HD'];T=J['tiles']['T'];W,H=J['WW'],J['WH']
full=np.zeros((H*HD,W*HD,3),np.uint8)
for t in J['tiles']['list']:
    tx,ty=int(t[1]),int(t[2]);im=np.array(Image.open(M+t+'.jpg').convert('RGB'));full[ty*T*HD:ty*T*HD+im.shape[0],tx*T*HD:tx*T*HD+im.shape[1]]=im
f=full.astype(int);seaH=(f[...,2]>f[...,1]+40)&(f[...,0]<90)
def tile(pred,Hh):
    S=int(200*HD);best=None
    for py in range(0,H*HD-S,40*HD):
        for px in range(0,W*HD-S,40*HD):
            q=f[py:py+S:8,px:px+S:8];v=pred(q).mean()-cv2.blur(q[...,1].astype(np.float32),(9,9)).std()/100
            if best is None or v>best[0]:best=(v,px,py)
    _,px,py=best;cell=full[py:py+S,px:px+S].astype(np.float32)
    b_=int(S*.3);sh=np.roll(np.roll(cell,S//2,0),S//2,1);d_=np.minimum(np.arange(S),S-1-np.arange(S));w_=np.clip(np.minimum.outer(d_,d_)/b_,0,1)[...,None];cell=sh*(1-w_)+cell*w_
    return np.tile(cell,(Hh//S+1,(W*HD)//S+1,1))[:Hh,:W*HD]
Hn=N*HD+FB*HD
grass=tile(lambda q:(q[...,1]>q[...,0]+10)&(q[...,1]>q[...,2]+20),Hn);sea=tile(lambda q:(q[...,2]>q[...,1]+30)&(q[...,2]>120),Hn)
# 旧图最上面（林带下沿）那一行的海岸 x
row=seaH[FB*HD];xc0=np.argmax(row[W*HD//2:])+W*HD//2 if row[W*HD//2:].any() else W*HD
yy=np.arange(Hn);u=yy/Hn   # 0=新顶端 1=旧林带下沿
xc=xc0-70*HD*(1-u)**2+np.sin(yy/(60*HD))*6*HD*(1-u)   # 往上慢慢往西收，带一点起伏
newsea=np.arange(W*HD)[None,:]>=xc[:,None]
# 草地：细节取平铺草地的高频，大块颜色取旧图往下那一段的镜像（只看草色），接起来自然、不重复
ref=full[FB*HD:FB*HD+Hn][::-1].astype(np.float32);rg=((ref[...,1]>ref[...,0]+10)&(ref[...,1]>ref[...,2]+20)).astype(np.float32)
sg=40*HD;low=cv2.GaussianBlur(ref*rg[...,None],(0,0),sg)/np.maximum(cv2.GaussianBlur(rg,(0,0),sg),1e-3)[...,None]
grass=grass-cv2.GaussianBlur(grass,(0,0),sg)+low
top=np.where(newsea[...,None],sea,grass)
# 和旧图接缝：下沿 30 格渐变
old=full[:FB*HD].astype(np.float32);band=top[N*HD:].copy()
wv=np.clip((np.arange(FB*HD)-(FB-30)*HD)/(30*HD),0,1)[:,None,None]
top[N*HD:]=band*(1-wv)+old*wv
edge=cv2.GaussianBlur(newsea.astype(np.float32),(0,0),4*HD);rim=np.clip(1-np.abs(edge-.5)*3,0,1)[...,None]*.45
rim[N*HD:]*=(1-wv)
top=top*(1-rim)+np.array([205,228,236],np.float32)*rim
out=np.concatenate([np.clip(top,0,255).astype(np.uint8),full[FB*HD:]],0)
H2=H+N;assert out.shape[0]==H2*HD
# 碰撞
c=np.array(Image.open(M+'coll.png').convert('RGB'));b=c[...,0]
bt=np.zeros((N+FB,W),np.uint8);ns=cv2.resize(newsea.astype(np.uint8),(W,N+FB),interpolation=cv2.INTER_NEAREST)>0
bt[ns]=1
b2=np.concatenate([bt,b[FB:]],0);c2=np.zeros((H2,W,3),np.uint8);c2[...,0]=b2;Image.fromarray(c2).save(M+'coll.png')
# 物件：旧林带里的树拆掉，其余往下移 N
J['objs']=[[k,x,y+N] for k,x,y in J['objs'] if not (y<FB and k in ('broad2','broad4'))]
J['spawn']=[J['spawn'][0],J['spawn'][1]+N];J['WH']=H2;J['grownN']=J.get('grownN',0)+N
lst=[]
for ty in range(0,(H2*HD+T*HD-1)//(T*HD)):
    for tx in range(0,(W*HD+T*HD-1)//(T*HD)):
        n=f'g{tx}{ty}';Image.fromarray(out[ty*T*HD:(ty+1)*T*HD,tx*T*HD:(tx+1)*T*HD]).save(M+n+'.jpg',quality=80,optimize=True);lst.append(n)
for o in J['tiles']['list']:
    if o not in lst and os.path.exists(M+o+'.jpg'):os.remove(M+o+'.jpg')
J['tiles']['list']=lst;J['ver']=J.get('ver',0)+1
json.dump(J,open(R+'/data/world.json','w'),ensure_ascii=False,separators=(',',':'))
Image.fromarray(out[::4,::4]).save('/tmp/grow_preview.png');print('new size',W,H2,'coast top',xc0/HD)
