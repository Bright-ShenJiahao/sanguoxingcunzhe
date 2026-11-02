"""GPT：哥布林城堡部件 → assets/map/castle/*.png。按行空白分行，行内按 x 间隙分组（碎片如旗子会并进主体）。"""
import os,sys,numpy as np,cv2
from PIL import Image
sys.path.insert(0,os.path.dirname(__file__))
from slice_mag import mask
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
a=np.array(Image.open(R+'/art_src/gpt/castle.png').convert('RGB')).astype(int);m=mask(a)
p=m.sum(1)>3;bands=[];s=None
for y,v in enumerate(list(p)+[False]):
    if v and s is None:s=y
    if not v and s is not None:
        if y-s>20:bands.append([s,y])
        s=None
mb=[bands[0]]
for b in bands[1:]:
    if b[0]-mb[-1][1]<12:mb[-1][1]=b[1]
    else:mb.append(b)
if len(mb)==3:   # 第 3、4 行贴得近：在中间找投影最小处切开
    ya,yb=mb[2];pp=m[ya:yb].sum(1);mid=(yb-ya)//2;k=ya+int(np.argmin(pp[mid-150:mid+150]))+mid-150;mb=mb[:2]+[[ya,k],[k,yb]]
print('行',mb)
NAMES=[['keep'],['gate_closed','gate_open'],['wall_h','wall_v','wall_c'],['tower','banner','skulls','brazier','spikes']]
d=R+'/assets/map/castle';os.makedirs(d,exist_ok=True)
for (ya,yb),names in zip(mb,NAMES):
    q=m[ya:yb].sum(0)>0;xs=[];s=None
    for x,v in enumerate(list(q)+[False]):
        if v and s is None:s=x
        if not v and s is not None:xs.append([s,x]);s=None
    g=[xs[0]]
    for b in xs[1:]:
        if b[0]-g[-1][1]<18:g[-1][1]=b[1]
        else:g.append(b)
    g=[b for b in g if b[1]-b[0]>25]
    assert len(g)==len(names),(names,g)
    for (xa,xb),n in zip(g,names):
        sub=m[ya:yb,xa:xb];ys,xx=np.nonzero(sub)
        im=Image.fromarray(np.dstack([a[ya:yb,xa:xb],sub*255]).astype(np.uint8));im=im.crop(im.getbbox());im.save(f'{d}/{n}.png');print(n,im.size)
