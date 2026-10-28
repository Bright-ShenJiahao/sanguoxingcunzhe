"""男主多发型步行表：4 行 × 8 帧（前2待机 + 后6走路，朝右，洋红底）→ assets/characters/hero_m/r{行}_w{帧}.png + data/hero_m.json
用法: python3 tools/slice_hero_m.py art_src/characters/hero_walk_4styles.png
缩放按“白T身体大小”与默认男主 hero_b 对齐（身体一样大，只有发型高低不同）。切完请再跑 tools/outline.py。"""
import sys,os,json,numpy as np,cv2
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=ROOT+'/assets/characters/hero_m/';os.makedirs(OUT,exist_ok=True)
src=np.array(Image.open(sys.argv[1]).convert('RGB')).astype(int);H0,W0=src.shape[:2]
mag=((src[...,0]-src[...,1])>60)&((src[...,2]-src[...,1])>60);fg=~mag
white=(src.min(2)>205)&fg
skin=(abs(src[...,0]-240)<34)&(abs(src[...,1]-182)<40)&(src[...,2]<165)&(src[...,0]-src[...,2]>60)
rp=fg.sum(1)>4;rows=[];st=None
for y in range(H0):
    if rp[y] and st is None:st=y
    if (not rp[y] or y==H0-1) and st is not None:
        if y-st>40:rows.append((st,y))
        st=None
START=int(sys.argv[2]) if len(sys.argv)>2 else 0   # 追加单行：python3 tools/slice_hero_m.py 新行.png 4
assert len(rows)==(1 if START else 4),rows
CW=W0/8;gh=max(b-a for a,b in rows)
# 身体比例：默认男主 hero_b 白T 高 15 个素材像素；本表第一帧白T 高度量出来后求缩放
ya,yb=rows[0];ys,xs=np.nonzero(white[ya:yb,:int(CW)]);wh=ys.max()-ys.min()+1
s=15.0/wh;cw,ch=int(round(CW*s)),int(round(gh*s));print('rows',rows,'scale',round(s,4),'size',cw,ch)
meta=json.load(open(ROOT+'/data/hero_m.json')) if START else {'size':[cw,ch],'rows':[]}
for ri,(ya,yb) in enumerate(rows,START):
    ya=yb-gh;fr={'front':[],'back':[]}
    for i in range(8):
        x0=int(round(i*CW));x1=int(round((i+1)*CW))
        cell=src[ya:yb,x0:x1];m=mag[ya:yb,x0:x1]
        a=np.dstack([cell,np.where(m,0,255)]).astype(np.float32);a[...,:3]*=a[...,3:]/255
        r=cv2.resize(a,(cw,ch),interpolation=cv2.INTER_AREA);r[...,:3]/=np.maximum(r[...,3:]/255,1e-3);r[...,3]=np.where(r[...,3]>110,255,0)
        Image.fromarray(r.clip(0,255).astype(np.uint8)).save(OUT+f'r{ri}_w{i}.png')
        wy,wx=np.nonzero(white[ya:yb,x0:x1]);y0w,y1w=wy.min(),wy.max();hh=y1w-y0w
        sk=skin[ya:yb,x0:x1].copy();band=np.zeros_like(sk);band[int(y0w+.35*hh):int(y1w+.5*hh)]=1;sk&=band;yy,xx=np.nonzero(sk)
        for nm,pk in (('front',xx.argmax() if len(xx) else 0),('back',xx.argmin() if len(xx) else 0)):
            if not len(xx):fr[nm].append([cw*.5,ch*.6]);continue
            near=(abs(xx-xx[pk])<26)&(abs(yy-yy[pk])<26);fr[nm].append([round(float(xx[near].mean()*s),1),round(float(yy[near].mean()*s),1)])
    if START: fr['size']=[cw,ch]; meta['rows']=meta['rows'][:ri]+[fr]
    else: meta['rows'].append(fr)
json.dump(meta,open(ROOT+'/data/hero_m.json','w'),separators=(',',':'))
