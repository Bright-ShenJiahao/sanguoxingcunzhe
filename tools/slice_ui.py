"""切（只保留游戏用到的套图，并缩小体积） art_src/ui/*.png（洋红底）→ assets/ui/<表名>_<序号>.png，按行再按列排序。"""
import numpy as np,cv2,os,sys
from PIL import Image
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for nm in ['frames','buttons','icons','misc']:
    a=np.array(Image.open(f'{R}/art_src/ui/{nm}.png').convert('RGB')).astype(int)
    bg=(a[...,0]>150)&(a[...,2]>150)&(a[...,1]<110)
    fg=(~bg).astype(np.uint8)
    n,lab,st,_=cv2.connectedComponentsWithStats(cv2.dilate(fg,np.ones((9,9),np.uint8)))
    bx=[st[i] for i in range(1,n) if st[i][4]>2500]
    bx.sort(key=lambda b:(b[1]+b[3]//2)//120*10000+b[0])
    for i,(x,y,w,h,_) in enumerate(bx):
        rgba=np.dstack([a[y:y+h,x:x+w],fg[y:y+h,x:x+w]*255]).astype(np.uint8)
        im=Image.fromarray(rgba);lim=700 if w>2.5*h else 256   # 缩到显示尺寸附近，加快加载
        im.thumbnail((lim,lim),Image.LANCZOS);im.save(f'{R}/assets/ui/{nm}_{i}.png',optimize=True)
    print(nm,len(bx))
