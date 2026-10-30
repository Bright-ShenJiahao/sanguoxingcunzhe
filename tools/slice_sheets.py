"""把 art_src/ui 里的洋红底网格图切成命名小图 → assets/ui/。
mode 'bbox'：图标，按格子收集连通块后裁到内容边界；'cell'：动画帧，保留整个格子（帧之间对齐）。"""
import numpy as np,cv2,os
from PIL import Image
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def bgmask(a): return (a[...,0]>150)&(a[...,2]>150)&(a[...,1]<110)
def cut(src,cols,rows,names,mode,size):
    a=np.array(Image.open(f'{R}/art_src/ui/{src}.png').convert('RGB')).astype(int);fg=(~bgmask(a)).astype(np.uint8)
    H,W=fg.shape;n,lab,st,cen=cv2.connectedComponentsWithStats(fg)
    cx=(cen[:,0]//(W/cols)).astype(int);cy=(cen[:,1]//(H/rows)).astype(int)
    for i,nm in enumerate(names):
        if not nm: continue
        c,r=i%cols,i//cols;ks=[k for k in range(1,n) if st[k][4]>3 and cx[k]==c and cy[k]==r]
        m=np.isin(lab,ks).astype(np.uint8)
        if mode=='bbox':
            ys,xs=np.where(m);y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
        else:
            x0,x1,y0,y1=int(c*W/cols),int((c+1)*W/cols),int(r*H/rows),int((r+1)*H/rows)
            m[:, :x0]=0;m[:, x1:]=0
        im=Image.fromarray(np.dstack([a[y0:y1,x0:x1],m[y0:y1,x0:x1]*255]).astype(np.uint8));im.thumbnail((size,size),Image.LANCZOS)
        im.save(f'{R}/assets/ui/{nm}.png',optimize=True)
cut('cards2',4,4,['ic_mine','ic_crystal','ic_barrier','ic_vortex','ic_hexa','ic_rune','ic_thunder','ic_flame','ic_aura','ic_water','ic_bell','ic_gods','ic_necro'],'bbox',160)
cut('badges',6,3,['cls_sword','cls_warrior','cls_hunter','cls_artisan','cls_mage','cls_priest','b_atk','b_cd','b_area','b_amt','b_regen','b_armor','b_luck','b_dur','b_pspd','b_vamp','b_curse','i_magnet'],'bbox',160)
cut('items',4,4,['w_sword','w_rapier','w_blade','w_hammer','w_axe','w_whip','w_fist','w_arrow','w_bolt','w_boomer','w_bullet','w_stake','w_mine','w_crystal','w_ice','w_missile'],'bbox',96)
fx=[]
for k in ['fire','thunder','ice','vortex','hexa','water','mine','quake']: fx+=[f'fx_{k}_{j}' for j in range(4)]
cut('fx',4,8,fx,'cell',128)
sm=[]
for k in ['skel','zombie','wolf','vamp','war','thunder','guard','wind']: sm+=[f'sum_{k}_{j}' for j in range(2)]
cut('summons',8,2,sm,'cell',128)
print('ok')
