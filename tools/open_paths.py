"""把开发者面板「全图」里涂的绿色线条变成可走的草地：拆掉碰撞阻挡、崖壁换成草地纹理、移开路上的物件（水面保留）。
用法：python3 tools/open_paths.py art_src/map/paths_xxx.json [宽度=40]（坐标是缩小后的世界坐标）"""
import json,sys,os,numpy as np,cv2
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));M=R+'/assets/map/'
L=json.load(open(sys.argv[1]));WID=float(sys.argv[2]) if len(sys.argv)>2 else 40
J=json.load(open(R+'/data/world.json'));HD=J['HD'];T=J['tiles']['T'];W,H=J['WW'],J['WH']
full=np.zeros((H*HD,W*HD,3),np.uint8)
for t in J['tiles']['list']:
    tx,ty=int(t[1]),int(t[2]);im=np.array(Image.open(M+t+'.jpg').convert('RGB'));full[ty*T*HD:ty*T*HD+im.shape[0],tx*T*HD:tx*T*HD+im.shape[1]]=im
mask=np.zeros(full.shape[:2],np.uint8)
for s in L:
    if s['颜色']!='#20d060':continue
    pts=np.array([[x*HD,y*HD] for x,y in s['点']],np.int32)
    if len(pts)==1:cv2.circle(mask,tuple(pts[0]),int(WID*HD/2),255,-1)
    else:cv2.polylines(mask,[pts],False,255,int(WID*HD),lineType=cv2.LINE_AA)
f=full.astype(int);water=(f[...,2]>f[...,1]+10)&(f[...,2]>90)   # 水面不动
water=cv2.dilate(water.astype(np.uint8),np.ones((9,9),np.uint8))>0
m=(mask>0)&~water
# 草地纹理：取地图中部一块平坦草地（同一画风），做成无缝后平铺，再按周围颜色校正
S=int(200*HD);best=None
for py in range(100*HD,(H-260)*HD,60*HD):   # 自动找一块最纯的草地（不含水、崖、路）
    for px in range(100*HD,(W-260)*HD,60*HD):
        q=f[py:py+S:6,px:px+S:6];sm=cv2.blur(q[...,1].astype(np.float32),(9,9));bad=((q[...,2]>q[...,1]-10)|(q[...,0]>q[...,1]-5)).mean()*5+sm.std()/20   # 不含水、崖、路，颜色最平均
        if best is None or bad<best[0]:best=(bad,px,py)
_,px,py=best
cell=full[py:py+S,px:px+S].astype(np.float32)
b_=int(S*.3);sh=np.roll(np.roll(cell,S//2,0),S//2,1);d_=np.minimum(np.arange(S),S-1-np.arange(S));w_=np.clip(np.minimum.outer(d_,d_)/b_,0,1)[...,None];cell=sh*(1-w_)+cell*w_
tile=np.tile(cell,(full.shape[0]//S+1,full.shape[1]//S+1,1))[:full.shape[0],:full.shape[1]]
grassy=(f[...,1]>f[...,0]+10)&(f[...,1]>f[...,2]+20)   # 只拿草色当参考，避开崖壁
ring=(cv2.dilate(m.astype(np.uint8),np.ones((61,61),np.uint8))>0)&~m&~water&grassy
local=cv2.GaussianBlur(np.where(ring[...,None],full,0).astype(np.float32),(0,0),40)/np.maximum(cv2.GaussianBlur(ring.astype(np.float32),(0,0),40),1e-3)[...,None]
tm=cv2.GaussianBlur(tile,(0,0),40);tile=np.clip(tile-tm+local,0,255)
a=cv2.GaussianBlur(m.astype(np.float32),(0,0),6)[...,None]
out=(full*(1-a)+tile*a).astype(np.uint8)
for t in J['tiles']['list']:
    tx,ty=int(t[1]),int(t[2]);Image.fromarray(out[ty*T*HD:(ty+1)*T*HD,tx*T*HD:(tx+1)*T*HD]).save(M+t+'.jpg',quality=80,optimize=True)
# 碰撞：涂到的地方（非水）改成可走
c=np.array(Image.open(M+'coll.png').convert('RGB'));ms=cv2.resize(m.astype(np.uint8),(W,H),interpolation=cv2.INTER_AREA)>0
c[...,0][ms&(c[...,0]==1)]=0;Image.fromarray(c).save(M+'coll.png')
# 物件：路上的移走
n0=len(J['objs']);J['objs']=[o for o in J['objs'] if not (0<=o[2]<H and 0<=o[1]<W and ms[min(H-1,int(o[2])),min(W-1,int(o[1]))]) or 'bridge' in o[0]]
J['ver']=J.get('ver',0)+1;json.dump(J,open(R+'/data/world.json','w'),ensure_ascii=False,separators=(',',':'))
Image.fromarray(out[100*HD:700*HD,0:600*HD]).resize((600,600)).save('/tmp/paths_preview.png')
Image.fromarray(full[100*HD:700*HD,0:600*HD]).resize((600,600)).save('/tmp/paths_before.png')
print('opened',int(ms.sum()),'cells; objs',n0,'->',len(J['objs']))
