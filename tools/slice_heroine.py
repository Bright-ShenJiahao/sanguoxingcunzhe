"""女主多发型表：5 行 × 9 帧（前2待机 + 后7走路，朝右，洋红底）→ assets/characters/heroine/r{行}_w{帧}.png + data/heroine.json
用法: python3 tools/slice_heroine.py art_src/characters/heroine_5styles.png"""
import sys,os,json,numpy as np,cv2
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=ROOT+'/assets/characters/heroine/';os.makedirs(OUT,exist_ok=True)
LH=24.0;HD=2;CWs=150      # 人物高 24 逻辑像素；每帧源图裁 150 像素宽
src=np.array(Image.open(sys.argv[1]).convert('RGB')).astype(int);H0,W0=src.shape[:2]
mag=((src[...,0]-src[...,1])>60)&((src[...,2]-src[...,1])>60);fg=~mag
# 行：按横向投影找空隙
pad=np.full((80,W0,3),[255,0,255]);src=np.vstack([src,pad]);mag=np.vstack([mag,np.ones((80,W0),bool)]);fg=~mag;H0=src.shape[0]
rp=fg.sum(1)>4;rows=[];st=None
for y in range(H0):
    if rp[y] and st is None:st=y
    if (not rp[y] or y==H0-1) and st is not None:
        if y-st>40:rows.append((st,y if not rp[y] else y+1))
        st=None
START=int(sys.argv[2]) if len(sys.argv)>2 else 0
if START==0:rows=rows[:3]+[(472,619),(625,724)]
print('rows',rows)
skin=(abs(src[...,0]-240)<32)&(abs(src[...,1]-185)<40)&(src[...,2]<165)&(src[...,0]-src[...,2]>60)
white=(src.min(2)>205)
meta=json.load(open(ROOT+'/data/heroine.json')) if START else {'rows':[]}
new_rows=[];gh=max(b-a for a,b in rows);s=LH*HD/gh
cw,ch=int(round(CWs*s)),int(round(gh*s))
for ri0,(ya,yb) in enumerate(rows):
    ri=ri0+START
    yb=ya+gh if yb-ya<gh else yb;ya=yb-gh   # 统一行高，脚底在底
    d=cv2.dilate(fg[ya:yb].astype(np.uint8),np.ones((9,45),np.uint8));n,lab,stt,_=cv2.connectedComponentsWithStats(d)
    comps=sorted([stt[i] for i in range(1,n) if stt[i][4]>1500],key=lambda t:t[0])
    fr={'front':[],'back':[]}
    for fi,c in enumerate(comps):
        sub_w=white[ya:yb];ys_,xs_=np.nonzero(sub_w[int(gh*.25):int(gh*.5),c[0]:c[0]+c[2]])
        ax=c[0]+(xs_.mean() if len(xs_) else c[2]/2)   # 衣身中心作 x 锚点
        x0=int(round(ax-CWs/2));cell=np.full((gh,CWs,3),255,int);cell[...]=src[ya:yb,:1].repeat(CWs,1)  # 填洋红
        xa,xb=max(0,x0),min(W0,x0+CWs);cell[:,xa-x0:xb-x0]=src[ya:yb,xa:xb]
        m=((cell[...,0]-cell[...,1])>60)&((cell[...,2]-cell[...,1])>60)
        a=np.dstack([cell,np.where(m,0,255)]).astype(np.float32);a[...,:3]*=a[...,3:]/255
        r=cv2.resize(a,(cw,ch),interpolation=cv2.INTER_AREA);r[...,:3]/=np.maximum(r[...,3:]/255,1e-3);r[...,3]=np.where(r[...,3]>110,255,0)
        Image.fromarray(r.clip(0,255).astype(np.uint8)).save(OUT+f'r{ri}_w{fi}.png')
        sk=skin[ya:yb,x0:x0+CWs] if x0>=0 and x0+CWs<=W0 else np.zeros((gh,CWs),bool)
        band=np.zeros_like(sk);band[int(gh*.40):int(gh*.66)]=1;sk=sk&band;yy,xx=np.nonzero(sk)
        for nm,pk in (('front',xx.argmax() if len(xx) else 0),('back',xx.argmin() if len(xx) else 0)):
            if not len(xx):fr[nm].append([cw*.5,ch*.5]);continue
            near=(abs(xx-xx[pk])<24)&(abs(yy-yy[pk])<24);fr[nm].append([round(float(xx[near].mean()*s),1),round(float(yy[near].mean()*s),1)])
    (meta['rows'].__setitem__(ri,{'n':len(comps),**fr}) if START else meta['rows'].append({'n':len(comps),**fr}))
meta['size']=[cw,ch]if not START else meta['size']
json.dump(meta,open(ROOT+'/data/heroine.json','w'),separators=(',',':'));print([r['n'] for r in meta['rows']],meta['size'])
