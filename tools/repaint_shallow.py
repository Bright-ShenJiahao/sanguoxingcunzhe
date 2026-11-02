"""用 GPT 浅滩贴图重画所有浅滩（coll==2）：水面纹理 + 湿沙岸边 + 和深水池塘渐变衔接。"""
import numpy as np,cv2,json
from PIL import Image
R='/home/claude/sanguoxingcunzhe';M=R+'/assets/map/'
J=json.load(open(R+'/data/world.json'));HD=J['HD'];T=J['tiles']['T'];W,H=J['WW'],J['WH']
full=np.zeros((H*HD,W*HD,3),np.uint8)
for t in J['tiles']['list']:
    im=np.array(Image.open(M+t+'.jpg').convert('RGB'));tx,ty=int(t[1]),int(t[2]);full[ty*T*HD:ty*T*HD+im.shape[0],tx*T*HD:tx*T*HD+im.shape[1]]=im
b=np.array(Image.open(M+'coll.png').convert('RGB'))[...,0]
f=cv2.GaussianBlur(full[::HD,::HD].astype(np.float32),(0,0),1.5);deep=(f[...,2]>f[...,1]+40)&(f[...,0]<90)
S=(b==2)
# 河口喇叭形：南湖入口手动铺一片浅水
fl=np.zeros((H,W),np.uint8);cv2.ellipse(fl,(1062,1018),(30,16),0,0,360,1,-1)
flare=(fl>0);S=S|flare;b[flare]=2
cc=np.array(Image.open(M+'coll.png').convert('RGB'));cc[...,0]=b;Image.fromarray(cc).save(M+'coll.png')
up=lambda x:cv2.resize(x.astype(np.uint8),(W*HD,H*HD),interpolation=cv2.INTER_NEAREST)>0
tl=np.array(Image.open(M+'shallow/tile_a.png').convert('RGB'));tl=cv2.resize(tl,(180,170),interpolation=cv2.INTER_AREA).astype(np.float32)
pm=np.concatenate([tl,tl[:,::-1]],1);pm=np.concatenate([pm,pm[::-1]],0)
water=np.tile(pm,(H*HD//pm.shape[0]+1,W*HD//pm.shape[1]+1,1))[:H*HD,:W*HD]
SH=up(S)
# 和深水：浅滩向深水里渐变 12px
dS=cv2.distanceTransform((~S).astype(np.uint8),cv2.DIST_L2,5)
fade=np.clip(1-dS/22,0,1)*deep*.85
aw=np.maximum(cv2.GaussianBlur(SH.astype(np.float32),(0,0),1.2*HD),cv2.resize(fade.astype(np.float32),(W*HD,H*HD)))
out=full*(1-aw[...,None])+water*aw[...,None]
# 湿沙岸：浅滩外 0~4px（不在深水、不在海）
band=(dS>0)&(dS<4.5)&~deep&(b!=1)
bh=cv2.GaussianBlur(up(band).astype(np.float32),(0,0),1.5*HD)[...,None]*.55
sand=np.array([138,118,86],np.float32)
out=out*(1-bh)+sand*bh
# 岸线内侧一圈淡淡的亮边
e=np.clip(1-np.abs(cv2.GaussianBlur(SH.astype(np.float32),(0,0),1*HD)-.5)*4,0,1)[...,None]*.25*(~up(deep))[...,None]
out=np.clip(out*(1-e)+np.array([215,225,215])*e,0,255).astype(np.uint8)
for t in J['tiles']['list']:
    tx,ty=int(t[1]),int(t[2]);Image.fromarray(out[ty*T*HD:(ty+1)*T*HD,tx*T*HD:(tx+1)*T*HD]).save(M+t+'.jpg',quality=84,optimize=True)
J['ver']+=1;json.dump(J,open(R+'/data/world.json','w'),ensure_ascii=False,separators=(',',':'))
Image.fromarray(out[440*HD:1080*HD,960*HD:1880*HD][::2,::2]).save('/tmp/claude-0/s/sh1.png')
Image.fromarray(out[480*HD:600*HD,1560*HD:1880*HD]).save('/tmp/claude-0/s/sh2.png')
Image.fromarray(out[960*HD:1080*HD,1000*HD:1150*HD]).save('/tmp/claude-0/s/sh3.png')
