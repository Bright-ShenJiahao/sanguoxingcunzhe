"""把 8 帧步行表（2 待机 + 6 走路，洋红底，朝右）切成 hero_b/w0..w7.png，并量出前/后手位置
用法: python3 tools/slice_walk.py art_src/characters/hero_walk8.png"""
import sys,os,json,numpy as np,cv2
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=ROOT+'/assets/characters/hero_b/';HD=2;LH=25.0
src=np.array(Image.open(sys.argv[1]).convert('RGB')).astype(int);H0,W0=src.shape[:2]
mag=(src[...,0]>200)&(src[...,2]>200)&(src[...,1]<90)
ys,xs=np.nonzero(~mag);y0,y1=ys.min(),ys.max()+1
CW=W0/8;s=LH*HD/(y1-y0)                      # 统一缩放：人物高 25 逻辑像素
cw,ch=int(round(CW*s)),int(round((y1-y0)*s))
skin=(abs(src[...,0]-240)<30)&(abs(src[...,1]-180)<35)&(src[...,2]<150)&(src[...,0]-src[...,2]>70)
meta={'front':[],'back':[]}
for i in range(8):
    x0=int(i*CW);x1=int((i+1)*CW)
    cell=src[y0:y1,x0:x1];m=mag[y0:y1,x0:x1]
    a=np.dstack([cell,np.where(m,0,255)]).astype(np.uint8)
    f=a.astype(np.float32);f[...,:3]*=f[...,3:]/255
    r=cv2.resize(f,(cw,ch),interpolation=cv2.INTER_AREA);r[...,:3]/=np.maximum(r[...,3:]/255,1e-3);r[...,3]=np.where(r[...,3]>110,255,0)
    Image.fromarray(r.clip(0,255).astype(np.uint8)).save(OUT+f'w{i}.png')
    # 手：衣身高度带内最右/最左的肤色像素团
    sk=skin[y0:y1,x0:x1].copy();band=np.zeros_like(sk);band[int((y1-y0)*.46):int((y1-y0)*.76)]=1;sk&=band.astype(bool)
    yy,xx=np.nonzero(sk)
    for nm,pick in (('front',xx.argmax()),('back',xx.argmin())):
        px_,py_=xx[pick],yy[pick];near=(abs(xx-px_)<26)&(abs(yy-py_)<26)
        cx_,cy_=xx[near].mean()-8*0,yy[near].mean()
        meta[nm].append([round(float(cx_*s),1),round(float(cy_*s),1)])
meta['size']=[cw,ch]
json.dump(meta,open('/tmp/walk_meta.json','w'));print(meta)
