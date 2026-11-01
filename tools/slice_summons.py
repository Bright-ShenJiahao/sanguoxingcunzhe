"""GPT：8 种召唤物 × 3 帧（站立/行走/攻击，品红底）→ assets/characters/summons/<名>/{idle,walk,atk}.png
按空白自动找 8 行；每行按连通块质心分 3 格；同一种召唤物 3 帧用同一缩放比例（按站立帧高度）。"""
import os,sys,numpy as np,cv2
from PIL import Image
sys.path.insert(0,os.path.dirname(__file__))
from slice_mag import mask
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
K='golem treant wolf waterel fireel firelet hawk fairy'.split();F='idle walk atk'.split()
H_OUT={'golem':52,'treant':60,'wolf':34,'waterel':50,'fireel':54,'firelet':20,'hawk':30,'fairy':22}   # 站立帧在游戏里的像素高（×2 存，HD）
a=np.array(Image.open(R+'/art_src/gpt/summons.png').convert('RGB')).astype(int);m=mask(a)
p=m.sum(1);on=p>10;bands=[];s=None
for y,v in enumerate(list(on)+[False]):
    if v and s is None:s=y
    if not v and s is not None:
        if y-s>8:bands.append([s,y])
        s=None
assert len(bands)==8,bands
cut=[0]+[(bands[i][1]+bands[i+1][0])//2 for i in range(7)]+[m.shape[0]];mb=list(zip(cut[:-1],cut[1:]))   # 行界取两段之间的中点，闪光碎片不丢
W=m.shape[1]
for k,(ya,yb) in zip(K,mb):
    sub=m[ya:yb];n,l,st,cen=cv2.connectedComponentsWithStats(sub);big=max(st[1:,4]);fr=[]
    for c in range(3):
        ids=[i for i in range(1,n) if st[i][4]>max(20,big*.003) and c*W/3<=cen[i][0]<(c+1)*W/3]
        mx=max(ids,key=lambda i:st[i][4]);bx0,by0,bw,bh=st[mx][:4];pad=max(bw,bh)*.35   # 离主体太远的小碎点不要
        ids=[i for i in ids if st[i][4]>big*.05 or (bx0-pad<cen[i][0]<bx0+bw+pad and by0-pad<cen[i][1]<by0+bh+pad)]
        keep=np.isin(l,ids);ys,xs=np.nonzero(keep)
        x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
        fr.append(Image.fromarray(np.dstack([a[ya+y0:ya+y1,x0:x1],keep[y0:y1,x0:x1]*255]).astype(np.uint8)))
    sc=H_OUT[k]*2/fr[0].height;d=R+f'/assets/characters/summons/{k}';os.makedirs(d,exist_ok=True)
    for f,im in zip(F,fr):im.resize((max(1,round(im.width*sc)),max(1,round(im.height*sc))),Image.LANCZOS).save(f'{d}/{f}.png')
print('ok')
