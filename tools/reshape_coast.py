"""把东边海岸线（y 0~Y1）整理成自然的圆弧：取现在的岸线，平滑后再往外鼓一点，
岸线外变海、岸线内变草地，碰撞同步。用法：python3 tools/reshape_coast.py [Y1=600] [鼓出=45]"""
import json,sys,os,numpy as np,cv2
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));M=R+'/assets/map/'
Y1=int(sys.argv[1]) if len(sys.argv)>1 else 600;BULGE=float(sys.argv[2]) if len(sys.argv)>2 else 45
J=json.load(open(R+'/data/world.json'));HD=J['HD'];T=J['tiles']['T'];W,H=J['WW'],J['WH']
full=np.zeros((H*HD,W*HD,3),np.uint8)
for t in J['tiles']['list']:
    tx,ty=int(t[1]),int(t[2]);im=np.array(Image.open(M+t+'.jpg').convert('RGB'));full[ty*T*HD:ty*T*HD+im.shape[0],tx*T*HD:tx*T*HD+im.shape[1]]=im
c=np.array(Image.open(M+'coll.png').convert('RGB'));blk=c[...,0]
X0=W//2
ff=full.astype(int);wat=((ff[...,2]>ff[...,1]+40)&(ff[...,0]<90)&(ff[...,2]>110))[::HD,::HD]   # 按颜色认海（森林碰撞不算）
xs=np.zeros(Y1+60)
for y in range(Y1+60):   # 从陆地往东扫，第一段连续 12 格的海就是岸线
    land=~wat[y,X0:];k=np.convolve(land.astype(int),np.ones(12,int),'valid')   # 从东往西扫，最东边一段连续 12 格的陆地就是岸
    idx=np.where(k>=12)[0];xs[y]=X0+(idx[-1]+12 if len(idx) else 0)
sm=cv2.GaussianBlur(xs.astype(np.float32).reshape(-1,1),(0,0),60).ravel()
yy=np.arange(Y1+60);t_=np.clip(yy/Y1,0,1);bul=BULGE*np.sin(np.pi*t_)
xn=sm+bul
w=np.clip((yy-(Y1-40))/100,0,1);xn=xn*(1-w)+xs*w   # 底部渐渐接回原来的岸（沙滩那里）
# 新的海陆
Hh=(Y1+60)*HD;newsea=np.zeros((Hh,W*HD),bool);cols=np.arange(W*HD)[None,:]
xnh=np.interp(np.arange(Hh)/HD,yy,xn)[:,None]*HD;newsea=cols>=xnh
f=full[:Hh].astype(int);oldsea=(f[...,2]>f[...,1]+30)&(f[...,2]>110)
def tilefrom(pred):
    S=int(200*HD);best=None
    for py in range(0,H*HD-S,40*HD):
        for px in range(0,W*HD-S,40*HD):
            q=full[py:py+S:8,px:px+S:8].astype(int);v=pred(q).mean()-(cv2.blur(q[...,1].astype(np.float32),(9,9)).std()/100)
            if best is None or v>best[0]:best=(v,px,py)
    _,px,py=best;cell=full[py:py+S,px:px+S].astype(np.float32)
    b_=int(S*.3);sh=np.roll(np.roll(cell,S//2,0),S//2,1);d_=np.minimum(np.arange(S),S-1-np.arange(S));w_=np.clip(np.minimum.outer(d_,d_)/b_,0,1)[...,None];cell=sh*(1-w_)+cell*w_
    return np.tile(cell,(Hh//S+1,(W*HD)//S+1,1))[:Hh,:W*HD]
seaT=tilefrom(lambda q:(q[...,2]>q[...,1]+30)&(q[...,2]>120))
grassT=tilefrom(lambda q:(q[...,1]>q[...,0]+10)&(q[...,1]>q[...,2]+20))
region=(cols>=X0*HD)&np.ones((Hh,1),bool)
toSea=newsea&~oldsea&region;toLand=~newsea&(np.ones_like(oldsea) if True else cv2.dilate(oldsea.astype(np.uint8),np.ones((8*HD,8*HD),np.uint8))>0)&region&(cols>=(np.interp(np.arange(Hh)/HD,yy,xs)[:,None]*HD-10*HD))&(cols<=xnh+6*HD)
out=full[:Hh].astype(np.float32)
a=cv2.GaussianBlur(toSea.astype(np.float32),(0,0),3*HD)[...,None];out=out*(1-a)+seaT*a
a=cv2.GaussianBlur(toLand.astype(np.float32),(0,0),3*HD)[...,None];out=out*(1-a)+grassT*a
# 新岸线一圈浅色水边
edge=cv2.GaussianBlur(newsea.astype(np.float32),(0,0),4*HD);rim=(np.clip(1-np.abs(edge-.5)*3,0,1)*region)[...,None]*.45
out=out*(1-rim)+np.array([205,228,236],np.float32)*rim
full[:Hh]=np.clip(out,0,255).astype(np.uint8)
for t in J['tiles']['list']:
    tx,ty=int(t[1]),int(t[2]);Image.fromarray(full[ty*T*HD:(ty+1)*T*HD,tx*T*HD:(tx+1)*T*HD]).save(M+t+'.jpg',quality=80,optimize=True)
ns=cv2.resize(newsea.astype(np.uint8),(W,Y1+60),interpolation=cv2.INTER_AREA)>0;reg=np.zeros_like(ns);reg[:,X0:]=True
blk[:Y1+60][ns&reg]=1;old=cv2.resize(oldsea.astype(np.uint8),(W,Y1+60),interpolation=cv2.INTER_AREA)>0;blk[:Y1+60][(~ns)&reg&old]=0   # 只把原来的海改成陆地，森林阻挡不动;c[...,0]=blk;Image.fromarray(c).save(M+'coll.png')
J['objs']=[o for o in J['objs'] if not (int(o[2])<Y1+60 and int(o[1])>=X0 and ns[int(o[2]),min(W-1,int(o[1]))])]
J['ver']=J.get('ver',0)+1;json.dump(J,open(R+'/data/world.json','w'),ensure_ascii=False,separators=(',',':'))
Image.fromarray(full[0:760*HD,1350*HD:W*HD]).resize(((W-1350),760)).save('/tmp/coast_preview.png');print('ok')
