"""把 AI 出的马 / 骑手图切成单帧（洋红抠底），输出 assets/characters/ride 与 data/ride.json
用法: python3 tools/slice_ride.py 马图.png 骑手图.png"""
import sys,os,json,numpy as np,cv2
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=ROOT+'/assets/characters/ride/'
HS,RS=0.157,0.054   # 源像素 → 逻辑像素（马体长≈56，骑手高≈30）；HD=2 时再乘 2
HD=2
def cut(path):
    im=np.array(Image.open(path).convert('RGB')).astype(int)
    mag=(im[...,0]>200)&(im[...,2]>200)&(im[...,1]<90)
    fg=(~mag).astype(np.uint8);fg=cv2.morphologyEx(fg,cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
    nn,lab,st,_=cv2.connectedComponentsWithStats(cv2.dilate(fg,np.ones((9,9),np.uint8)))
    out=[]
    for i in range(1,nn):
        x,y,w,h,a=st[i]
        if a<3000:continue
        rgba=np.dstack([im[y:y+h,x:x+w],np.where(mag[y:y+h,x:x+w],0,255)]).astype(np.uint8)
        out.append(((int(y),int(x)),rgba))
    return out
def small(rgba,s):
    h,w=rgba.shape[:2];W,H=max(1,round(w*s*HD)),max(1,round(h*s*HD))
    a=rgba.astype(np.float32);a[...,:3]*=a[...,3:]/255
    r=cv2.resize(a,(W,H),interpolation=cv2.INTER_AREA);r[...,:3]/=np.maximum(r[...,3:]/255,1e-3)
    r[...,3]=np.where(r[...,3]>110,255,0);return r.clip(0,255).astype(np.uint8)
def grey(rgba,box=None):
    r,g,b,a=[rgba[...,i].astype(int) for i in range(4)]
    m=(a>0)&(abs(r-g)<22)&(abs(g-b)<22)&(r>85)&(r<215)
    if box:
        y0,y1,x0,x1=box;z=np.zeros_like(m);z[y0:y1,x0:x1]=1;m&=z.astype(bool)
    ys,xs=np.nonzero(m);return (float(xs.mean()),float(ys.mean())) if len(xs) else None
if __name__=='__main__':
    hp,rp=sys.argv[1:3]
    H=sorted(cut(hp));R=sorted(cut(rp),key=lambda t:t[0][1])
    # 马：按 (行, 列) 排序：idle×2，其后 L2 R2 L3 R3 L4 R4
    rows=sorted(H,key=lambda t:(round(t[0][0]/120),t[0][1]));meta={'horse':[],'rider':[]}
    for i,(pos,im) in enumerate(rows):
        h,w=im.shape[:2]
        # 马镫（灰扣）位置 → 骑手座位
        g=grey(im,(int(h*.45),int(h*.9),int(w*.35),int(w*.75)))
        Image.fromarray(small(im,HS)).save(OUT+f'horse_{i}.png')
        meta['horse'].append({'size':[round(w*HS,1),round(h*HS,1)],'buckle':[round(g[0]*HS,1),round(g[1]*HS,1)] if g else None})
    for i,(pos,im) in enumerate(R):
        h,w=im.shape[:2]
        g=grey(im,(int(h*.75),h,0,w))
        for tag,img in (('',im),):
            Image.fromarray(small(img,RS)).save(OUT+f'rider_{i}.png')
        meta['rider'].append({'size':[round(w*RS,1),round(h*RS,1)],'boot':[round(g[0]*RS,1),round(g[1]*RS,1)] if g else None})
    json.dump(meta,open(ROOT+'/data/ride.json','w'),separators=(',',':'));print(json.dumps(meta))
