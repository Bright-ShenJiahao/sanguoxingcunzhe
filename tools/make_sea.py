"""把开发者面板涂抹的区域变成海：海水纹理（取地图里的深海）、碰撞改为阻挡、移走物件。
用法：python3 tools/make_sea.py art_src/map/sea_xxx.json [宽度=40]"""
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
    pts=np.array([[x*HD,y*HD] for x,y in s['点']],np.int32)
    if len(pts)==1:cv2.circle(mask,tuple(pts[0]),int(WID*HD/2),255,-1)
    else:
        cv2.polylines(mask,[pts],False,255,int(WID*HD))
        if np.hypot(*(pts[0]-pts[-1]))<40*HD:cv2.fillPoly(mask,[pts],255)
mask=cv2.morphologyEx(mask,cv2.MORPH_CLOSE,np.ones((25*HD,25*HD),np.uint8))   # 涂抹之间的小缝补上
f=full.astype(int)
seaNow=(f[...,2]>f[...,1]+30)&(f[...,2]>110)
# 被海围住、不连着大陆的小块陆地也一起变成海
land=((~seaNow)&(mask==0)).astype(np.uint8);n,lab,st,_=cv2.connectedComponentsWithStats(land,connectivity=4)
big=1+int(np.argmax(st[1:,4]));mask[(lab>0)&(lab!=big)]=255
# 岸线加一点自然起伏，不要笔直
rng=np.random.default_rng(5);nz=cv2.GaussianBlur(cv2.resize(rng.random((H//30+1,W//30+1)).astype(np.float32),(W*HD,H*HD),interpolation=cv2.INTER_CUBIC),(0,0),8*HD)
nz=(nz-nz.mean())/(nz.std()+1e-6)
mask=((cv2.GaussianBlur((mask>0).astype(np.float32),(0,0),14*HD)+nz*.18)>.5).astype(np.uint8)*255
# 旧海岸线残留的细线（夹在新海和旧海之间）一起盖掉
near=cv2.dilate(mask,np.ones((40*HD,40*HD),np.uint8))>0
both=cv2.morphologyEx(((mask>0)|seaNow).astype(np.uint8),cv2.MORPH_CLOSE,np.ones((14*HD,14*HD),np.uint8))>0
mask[both&near]=255
S=int(200*HD);best=None
for py in range(0,H*HD-S,40*HD):   # 找一块最纯的深海
    for px in range(0,W*HD-S,40*HD):
        q=f[py:py+S:8,px:px+S:8];sea=((q[...,2]>q[...,1]+30)&(q[...,2]>120)).mean()
        if best is None or sea>best[0]:best=(sea,px,py)
_,px,py=best;cell=full[py:py+S,px:px+S].astype(np.float32)
b_=int(S*.3);sh=np.roll(np.roll(cell,S//2,0),S//2,1);d_=np.minimum(np.arange(S),S-1-np.arange(S));w_=np.clip(np.minimum.outer(d_,d_)/b_,0,1)[...,None];cell=sh*(1-w_)+cell*w_
tile=np.tile(cell,(full.shape[0]//S+1,full.shape[1]//S+1,1))[:full.shape[0],:full.shape[1]]
m=mask>0;sw=cv2.dilate(seaNow.astype(np.uint8),np.ones((30*HD,30*HD),np.uint8))>0
a=np.where(sw,cv2.GaussianBlur(m.astype(np.float32),(0,0),18*HD),cv2.GaussianBlur(m.astype(np.float32),(0,0),3))[...,None]   # 新旧海水之间大范围渐变，看不出接缝
# 岸边一圈浅色水边
edge=cv2.GaussianBlur(m.astype(np.float32),(0,0),6);rim=(np.clip(1-np.abs(edge-.5)*4,0,1)*(~sw))[...,None]*.35
out=full*(1-a)+tile*a;out=out*(1-rim)+np.array([200,225,235],np.float32)*rim*(a>.05)+out*rim*(a<=.05)
out=np.clip(out,0,255).astype(np.uint8)
for t in J['tiles']['list']:
    tx,ty=int(t[1]),int(t[2]);Image.fromarray(out[ty*T*HD:(ty+1)*T*HD,tx*T*HD:(tx+1)*T*HD]).save(M+t+'.jpg',quality=80,optimize=True)
c=np.array(Image.open(M+'coll.png').convert('RGB'));ms=cv2.resize(m.astype(np.uint8),(W,H),interpolation=cv2.INTER_AREA)>0
c[...,0][ms]=1;Image.fromarray(c).save(M+'coll.png')
n0=len(J['objs']);J['objs']=[o for o in J['objs'] if not (0<=int(o[2])<H and 0<=int(o[1])<W and ms[int(o[2]),int(o[1])])]
J['ver']=J.get('ver',0)+1;json.dump(J,open(R+'/data/world.json','w'),ensure_ascii=False,separators=(',',':'))
Image.fromarray(out[0:760*HD,1350*HD:W*HD]).resize(((W-1350),760)).save('/tmp/sea_preview.png')
print('sea cells',int(ms.sum()),'objs',n0,'->',len(J['objs']))
