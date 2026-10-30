"""男主 Game Boy / 女主头戴耳机 素材表（art_src/weapons/gb_hp.png，洋红底 4 行）→ assets/weapons/gear/*.png"""
import numpy as np,cv2,os
from PIL import Image
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));O=R+'/assets/weapons/gear/';os.makedirs(O,exist_ok=True)
a=np.array(Image.open(R+'/art_src/weapons/gb_hp.png').convert('RGB')).astype(int);r,g,b=a[...,0],a[...,1],a[...,2]
bg=(r>170)&(b>170)&(g<110)|((r>g+120)&(b>g+100))
fg=(~bg).astype(np.uint8)
def runs(v,gap):
    R_=[];s=None;last=-99
    for i,x in enumerate(v):
        if x:
            if s is None: s=i
            elif i-last>gap: R_.append((s,last+1)); s=i
            last=i
    if s is not None: R_.append((s,last+1))
    return R_
rows=[q for q in runs(fg.sum(1)>2,25) if q[1]-q[0]>40]; print(rows)
NAMES=[['gb','gb_glow','gb_evo'],['b0','b1','b2','b3','x0','x1','x2','x3','tet'],['hp','hp_f','hp_evo','hp_evo_f'],['w0','w1','w2','w3','n0','n1','n2','bass']]
for (y0,y1),nm in zip(rows,NAMES):
    F=fg[y0:y1];segs=[q for q in runs(F.sum(0)>0,18) if q[1]-q[0]>6]
    print(len(segs),len(nm))
    for (x0,x1),n in zip(segs,nm):
        m=F[:,x0:x1];ys=np.nonzero(m.any(1))[0];c=np.dstack([a[y0+ys[0]:y0+ys[-1]+1,x0:x1],m[ys[0]:ys[-1]+1]*255]).astype(np.uint8)
        Image.fromarray(c).save(O+n+'.png')
