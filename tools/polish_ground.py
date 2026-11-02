"""一次性：地面纹理整理——草地打散菱形重复、东南/西南色斑抹匀、浅滩改随机拼块（不镜像）、东岸做成自然曲线。"""
import numpy as np,cv2,json
from PIL import Image
R='/home/claude/sanguoxingcunzhe';M=R+'/assets/map/'
J=json.load(open(R+'/data/world.json'));HD=J['HD'];T=J['tiles']['T'];W,H=J['WW'],J['WH']
full=np.zeros((H*HD,W*HD,3),np.uint8)
for t in J['tiles']['list']:
    im=np.array(Image.open(M+t+'.jpg').convert('RGB'));tx,ty=int(t[1]),int(t[2]);full[ty*T*HD:ty*T*HD+im.shape[0],tx*T*HD:tx*T*HD+im.shape[1]]=im
c=np.array(Image.open(M+'coll.png').convert('RGB'));b=c[...,0]
F=full.astype(np.float32);rng=np.random.default_rng(7)
up=lambda x:cv2.resize(x.astype(np.float32),(W*HD,H*HD),interpolation=cv2.INTER_LINEAR)
f=cv2.GaussianBlur(F[::HD,::HD],(0,0),1.5);sea=(f[...,2]>f[...,1]+30)&(f[...,0]<110)
# ---------- 5) 东岸自然曲线 ----------
yy=np.arange(H);cx=1772+10*np.sin(yy/57.0)+5*np.sin(yy/21.0+1)
X=np.arange(W)[None,:];band=(yy[:,None]>=560)&(yy[:,None]<=900)
newsea=band&(X>=cx[:,None])&~sea;newland=band&(X<cx[:,None])&sea&(X>1700)
newsea&=(b!=2)
# 河口处保留浅滩
P=F[900*HD:900*HD+128,1800*HD:1800*HD+128];pm=np.concatenate([P,P[:,::-1]],1);pm=np.concatenate([pm,pm[::-1]],0)
ocean=np.tile(pm,(H*HD//pm.shape[0]+1,W*HD//pm.shape[1]+1,1))[:H*HD,:W*HD]
s=8;small=cv2.resize(full,(W*HD//s,H*HD//s),interpolation=cv2.INTER_AREA)
unk=cv2.resize((newland|sea|(b==1)|(b==2)).astype(np.uint8),(W*HD//s,H*HD//s),interpolation=cv2.INTER_NEAREST);unk=cv2.dilate(unk,np.ones((5,5),np.uint8))
low=cv2.inpaint(small[...,::-1],unk*255,10,cv2.INPAINT_TELEA)[...,::-1];low=cv2.resize(cv2.GaussianBlur(low.astype(np.float32),(0,0),3),(W*HD,H*HD),interpolation=cv2.INTER_CUBIC)
Pt=F[150*HD:150*HD+256,900*HD:900*HD+256];det=Pt-cv2.GaussianBlur(Pt,(0,0),12)
det=np.concatenate([det,det[:,::-1]],1);det=np.concatenate([det,det[::-1]],0)
gtile=np.tile(det,(H*HD//det.shape[0]+1,W*HD//det.shape[1]+1,1))[:H*HD,:W*HD]
socean=(sea|newsea)&~newland
dl=cv2.distanceTransform(socean.astype(np.uint8),cv2.DIST_L2,5);dc=cv2.distanceTransform((~socean).astype(np.uint8),cv2.DIST_L2,5)
reg=np.zeros((H,W),bool);reg[540:920,1690:]=True
a=cv2.GaussianBlur(up(reg&(newsea|(socean&(dl<8)))),(0,0),2)[...,None];F=F*(1-a)+ocean*a
a=cv2.GaussianBlur(up(reg&(newland|(~socean&(dc<8)&(b!=2)))),(0,0),2)[...,None];F=F*(1-a)+(low+gtile)*a
e=cv2.GaussianBlur(1-up(socean),(0,0),1.5*HD);edge=np.clip(1-np.abs(e-.5)*4,0,1)[...,None]*.5*cv2.GaussianBlur(up(reg),(0,0),8)[...,None]
F=F*(1-edge)+np.array([225,235,238])*edge
b[newsea]=1;b[newland]=0
J['objs']=[o for o in J['objs'] if not (0<=o[2]<H and 0<=o[1]<W and newsea[int(o[2]),int(o[1])])]
sea=socean
# ---------- 2,3) 色斑抹匀：在指定区域把中频明暗换成大尺度平均 ----------
land=(b!=1)&(b!=2)&~sea
fix=np.zeros((H,W),np.float32);fix[860:1130,1220:1680]=1;fix[960:1080,280:420]=1;fix[600:760,40:220]=.7
fix*=land;fix=cv2.GaussianBlur(fix,(0,0),20)
FX=up(fix)[...,None]
l1=cv2.GaussianBlur(F,(0,0),10);l2=cv2.GaussianBlur(F,(0,0),60)
F=F+(l2-l1)*FX*.85
# ---------- 1) 草地大尺度起伏，打散菱形 ----------
nz=sum(cv2.resize(rng.normal(0,1,(H//k+2,W//k+2)).astype(np.float32),(W,H),interpolation=cv2.INTER_CUBIC)*w for k,w in [(120,1),(55,.6)])
nz=nz/np.abs(nz).max()
lm=cv2.GaussianBlur(land.astype(np.float32),(0,0),3)
F=F*(1+up(nz*.07*lm)[...,None])
# 再把原底图菱形周期（约 128 世界像素）压一下：减掉该尺度的周期分量
gl=cv2.GaussianBlur(F,(0,0),14)-cv2.GaussianBlur(F,(0,0),40)
F=F-gl*up(lm*.55)[...,None]
# ---------- 4) 浅滩：随机拼块（不镜像） ----------
src=np.array(Image.open(R+'/art_src/gpt/shallow/tile_a.png').convert('RGB')).astype(np.float32)
src=cv2.resize(src,(src.shape[1]*2//5*2//2,src.shape[0]*2//5*2//2),interpolation=cv2.INTER_AREA)
B=72;O=20;sh=np.zeros((H*HD+B,W*HD+B,3),np.float32);wsum=np.zeros(sh.shape[:2],np.float32)
win=np.outer(np.minimum(1,np.minimum(np.arange(B+O)+1,(B+O)-np.arange(B+O))/O),np.minimum(1,np.minimum(np.arange(B+O)+1,(B+O)-np.arange(B+O))/O)).astype(np.float32)
Sm=up(b==2)>0.01
for y in range(0,H*HD,B):
  for x in range(0,W*HD,B):
    if not Sm[min(y,H*HD-1):min(y+B,H*HD),min(x,W*HD-1):min(x+B,W*HD)].any() and not Sm[max(0,y-O):y+B+O,max(0,x-O):x+B+O].any():continue
    sy=rng.integers(0,src.shape[0]-B-O);sx=rng.integers(0,src.shape[1]-B-O)
    pt=src[sy:sy+B+O,sx:sx+B+O];yy0,xx0=y-O//2,x-O//2
    ys,xs=max(0,yy0),max(0,xx0);ye,xe=min(sh.shape[0],yy0+B+O),min(sh.shape[1],xx0+B+O)
    sh[ys:ye,xs:xe]+=pt[ys-yy0:ye-yy0,xs-xx0:xe-xx0]*win[ys-yy0:ye-yy0,xs-xx0:xe-xx0,None];wsum[ys:ye,xs:xe]+=win[ys-yy0:ye-yy0,xs-xx0:xe-xx0]
sh=(sh/np.maximum(wsum,1e-3)[...,None])[:H*HD,:W*HD]
S=(b==2).astype(np.float32);aS=cv2.GaussianBlur(up(S),(0,0),1.2*HD)
deep=sea|((b==1)&cv2.dilate((b==2).astype(np.uint8),np.ones((40,40),np.uint8)).astype(bool))
dS=cv2.distanceTransform((b!=2).astype(np.uint8),cv2.DIST_L2,5)
fade=up(np.clip(1-dS/22,0,1)*deep*.85)
k=np.maximum(aS,fade)[...,None]
# 只替换浅滩水色本身，保留岸边沙/亮边：用旧浅滩亮度做遮罩混合
F=F*(1-k*.92)+sh*k*.92
out=np.clip(F,0,255).astype(np.uint8)
c[...,0]=b;Image.fromarray(c).save(M+'coll.png')
for t in J['tiles']['list']:
    tx,ty=int(t[1]),int(t[2]);Image.fromarray(out[ty*T*HD:(ty+1)*T*HD,tx*T*HD:(tx+1)*T*HD]).save(M+t+'.jpg',quality=84,optimize=True)
J['ver']+=1;json.dump(J,open(R+'/data/world.json','w'),ensure_ascii=False,separators=(',',':'))
for i,(x,y) in enumerate([(0,0),(940,0),(0,594),(940,594)]):Image.fromarray(out[y*2:(y+594)*2,x*2:(x+940)*2]).resize((940,594)).save(f'/tmp/claude-0/s/n{i}.png')
Image.fromarray(out[480*HD:620*HD,1550*HD:1880*HD]).save('/tmp/claude-0/s/nz.png')
