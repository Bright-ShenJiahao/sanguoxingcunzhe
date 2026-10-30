"""沿开发者面板涂的线种一片密集白桦林（不能进、不刷怪；过场事件照常穿过）。
用法：python3 tools/plant_forest.py art_src/map/forest_xxx.json [宽度=44]"""
import json,sys,os,random,numpy as np,cv2
from PIL import Image
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));M=R+'/assets/map/'
L=json.load(open(sys.argv[1]));WID=float(sys.argv[2]) if len(sys.argv)>2 else 44
J=json.load(open(R+'/data/world.json'));W,H=J['WW'],J['WH']
mask=np.zeros((H,W),np.uint8)
for s in L:
    pts=np.array(s['点'],np.int32)
    cv2.polylines(mask,[pts],False,255,int(WID))
c=np.array(Image.open(M+'coll.png').convert('RGB'));c[...,0][(mask>0)&(c[...,0]!=1)]=1;Image.fromarray(c).save(M+'coll.png')
rnd=random.Random(11);ys,xs=np.where(mask>0);new=[]
for y in range(0,H,9):
    for x in range(0,W,11):
        xx,yy=x+rnd.randint(-4,4),y+rnd.randint(-3,3)
        if 0<=xx<W and 0<=yy<H and mask[yy,xx]:new.append([rnd.choice(['broad2','broad2','broad4']),xx,yy])
J['objs']=[o for o in J['objs'] if not (0<=int(o[2])<H and 0<=int(o[1])<W and mask[int(o[2]),int(o[1])])]+new
J['ver']=J.get('ver',0)+1;json.dump(J,open(R+'/data/world.json','w'),ensure_ascii=False,separators=(',',':'))
print('trees',len(new),'blocked',int((mask>0).sum()))
