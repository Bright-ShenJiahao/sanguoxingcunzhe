"""白底素材图 → 按连通块切成透明 PNG。用法：python3 tools/slice_white.py 图 输出目录 [名字,...]（按从上到下、从左到右顺序；不给名字只打印块）"""
import sys,os,numpy as np,cv2
from PIL import Image
a=np.array(Image.open(sys.argv[1]).convert('RGB')).astype(int)
fg=~((a.min(2)>232)&(a.max(2)-a.min(2)<18))
# 去掉白底边缘：从边界泛洪的白色才算背景
bg=(~fg).astype(np.uint8);ff=bg.copy();m=np.zeros((bg.shape[0]+2,bg.shape[1]+2),np.uint8)
cv2.floodFill(ff,m,(0,0),2);outside=ff==2
blob=cv2.dilate((~outside).astype(np.uint8),np.ones((int(os.environ.get('DIL',15)),)*2,np.uint8))
n,lab,st,_=cv2.connectedComponentsWithStats(blob)
bx=[(st[i][1]//150,st[i][0],i) for i in range(1,n) if st[i][4]>1500]
bx.sort()
names=sys.argv[3].split(',') if len(sys.argv)>3 else None
os.makedirs(sys.argv[2],exist_ok=True)
for k,(_,_,i) in enumerate(bx):
    x,y,w,h,_=st[i];print(k,x,y,w,h)
    if names and k<len(names) and names[k]!='-':
        sub=a[y:y+h,x:x+w].astype(np.uint8);al=((lab[y:y+h,x:x+w]==i)&~outside[y:y+h,x:x+w]).astype(np.uint8)*255
        al=cv2.erode(al,np.ones((2,2),np.uint8))
        Image.fromarray(np.dstack([sub,al])).save(f'{sys.argv[2]}/{names[k]}.png')
