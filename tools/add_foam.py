# 一次性：所有深水（河、池塘、海）和陆地交界处补一条白色水岸线（水的一侧，2~4 像素，略带起伏）。
import numpy as np,cv2
from PIL import Image
a=np.array(Image.open('assets/map/g00.jpg').convert('RGB')).astype(np.float32)
b=np.array(Image.open('assets/map/g10.jpg').convert('RGB')).astype(np.float32)
M=np.concatenate([a,b],1);H,W=M.shape[:2]
R,G,B=M[...,0],M[...,1],M[...,2]
core=(B>R+50)&(B>G+30)
halo=(B>R+20)&(B>G+3)                                    # 原来淡淡的水边过渡也算水，白线贴着最外沿
water=halo&(cv2.dilate(core.astype(np.uint8),np.ones((15,15),np.uint8))>0)
water=cv2.morphologyEx(water.astype(np.uint8),cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
water=cv2.morphologyEx(water,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
# 去掉很小的蓝色碎块
n,lab,st,_=cv2.connectedComponentsWithStats(water,8);keep=np.zeros(n,bool);keep[1:]=st[1:,4]>400;water=keep[lab].astype(np.uint8)
dist=cv2.distanceTransform(water,cv2.DIST_L2,3)          # 水里到岸的距离
rng=np.random.default_rng(3)
nz=cv2.GaussianBlur(rng.random((H,W)).astype(np.float32),(0,0),6);nz=(nz-nz.mean())/(nz.std()+1e-6)
width=2.6+0.6*nz                                          # 线宽起伏
al=np.clip((width-dist)/1.6,0,1)*(dist>0)
al*=np.clip(1-(R+G+B-600)/120,0,1)                        # 已经很白的地方不再叠
al=cv2.GaussianBlur(al.astype(np.float32),(0,0),.6)[...,None]
foam=np.array([235,245,250],np.float32)
M=M*(1-al*.85)+foam*al*.85
M=np.clip(M,0,255).astype(np.uint8)
Image.fromarray(M[:, :3200]).save('assets/map/g00.jpg',quality=90)
Image.fromarray(M[:, 3200:]).save('assets/map/g10.jpg',quality=90)
print('ok',water.sum())
