# 一次性：西南河道东岸，悬崖在河道变宽处断掉——把上游一段悬崖平移复制到下游，接到桥头。
import numpy as np,cv2,sys
from PIL import Image
DX,DY=int(sys.argv[1]),int(sys.argv[2])
I=np.array(Image.open('assets/map/g00.jpg').convert('RGB')).astype(np.float32)
OY,OX=1700,600;B=I[OY:2300,OX:1350].copy()
brown=(B[...,0]>B[...,2]+25)&(B[...,1]<B[...,0]+15)&(B[...,1]>B[...,2])
yy,xx=np.mgrid[0:B.shape[0],0:B.shape[1]]
srcm=brown&(xx>=120)&(xx<=310)&(yy<300)
srcm=cv2.morphologyEx(srcm.astype(np.uint8),cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
srcm=cv2.dilate(srcm,np.ones((5,5),np.uint8))   # 带上一点水边白线
M=np.float32([[1,0,DX],[0,1,DY]])
dm=cv2.warpAffine(srcm.astype(np.float32),M,(B.shape[1],B.shape[0]))
di=cv2.warpAffine(B,M,(B.shape[1],B.shape[0]))
dm=dm*((yy<395)&(xx<540))
w=cv2.GaussianBlur(dm,(0,0),1.2)[...,None]
B=B*(1-w)+di*w
I[OY:2300,OX:1350]=B
Image.fromarray(I.astype(np.uint8)).save('assets/map/g00.jpg',quality=90)
C=np.array(Image.open('assets/map/coll.png'))
m=cv2.resize((dm>.5).astype(np.uint8),(B.shape[1]//2,B.shape[0]//2),interpolation=cv2.INTER_NEAREST).astype(bool)
sub=C[OY//2:OY//2+m.shape[0],OX//2:OX//2+m.shape[1],0];sub[m]=1
Image.fromarray(C).save('assets/map/coll.png')
