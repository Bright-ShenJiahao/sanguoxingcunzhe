"""洋红底素材图 → 按行、按列空隙切块（每块可含多个连通块）。
用法：python3 tools/slice_mag.py 图 [打印]；或 import 用 blocks(path) 得到 [[(x0,y0,x1,y1),...] 每行]"""
import sys,numpy as np,cv2
from PIL import Image
def mask(a):
    r,g,b=a[...,0],a[...,1],a[...,2]
    bg=(r>150)&(b>150)&(g<120)&(np.abs(r-b)<90)
    m=(~bg).astype(np.uint8);m=cv2.morphologyEx(m,cv2.MORPH_OPEN,np.ones((3,3),np.uint8));return m
def runs(p,thr,gap):
    on=p>thr;out=[];s=None;last=-99
    for i,v in enumerate(list(on)+[False]):
        if v:
            if s is None:s=i
            last=i
        elif s is not None and i-last>gap:out.append((s,last+1));s=None
    return out
def blocks(path,gapx=6,gapy=10):
    a=np.array(Image.open(path).convert('RGB')).astype(int);m=mask(a);R=[]
    for y0,y1 in runs(m.sum(1),2,gapy):
        if y1-y0<15:continue
        row=[]
        for x0,x1 in runs(m[y0:y1].sum(0),0,gapx):
            if x1-x0<6:continue
            ys=np.nonzero(m[y0:y1,x0:x1].any(1))[0];row.append((x0,y0+ys[0],x1,y0+ys[-1]+1))
        R.append(row)
    return a,m,R
def cut(a,m,b):
    x0,y0,x1,y1=b;return Image.fromarray(np.dstack([a[y0:y1,x0:x1],m[y0:y1,x0:x1]*255]).astype(np.uint8))
if __name__=='__main__':
    a,m,R=blocks(sys.argv[1],*(int(v) for v in sys.argv[2:4]))
    for i,r in enumerate(R):print(i,len(r),[b[2]-b[0] for b in r])
