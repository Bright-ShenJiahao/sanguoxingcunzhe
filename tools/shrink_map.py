"""把第一关地图整体缩到 SC 倍（相对布局不变）：地面贴图、碰撞图、物件位置、出生点。
物件按面积比例抽稀（桥和大型物件保留）。注意：之后若重跑 rebuild_nature.py，要再跑一次本脚本。"""
import json,os,random,numpy as np,cv2
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));M=R+'/assets/map/'
SC=.65
J=json.load(open(R+'/data/world.json'));HD=J['HD'];T=J['tiles']['T'];W,H=J['WW'],J['WH']
NW,NH=int(W*SC),int(H*SC)
# 地面
full=Image.new('RGB',(W*HD,H*HD))
for t in J['tiles']['list']:
    tx,ty=int(t[1]),int(t[2]);full.paste(Image.open(M+t+'.jpg').convert('RGB'),(tx*T*HD,ty*T*HD))
full=full.resize((NW*HD,NH*HD),Image.LANCZOS);lst=[]
for ty in range(0,(NH*HD+T*HD-1)//(T*HD)):
    for tx in range(0,(NW*HD+T*HD-1)//(T*HD)):
        n=f'g{tx}{ty}';full.crop((tx*T*HD,ty*T*HD,min(NW*HD,(tx+1)*T*HD),min(NH*HD,(ty+1)*T*HD))).save(M+n+'.jpg',quality=80,optimize=True);lst.append(n)
J['tiles']['list']=lst
# 碰撞：1 阻挡 > 2 浅水 > 3 慢地，按覆盖比例保留细线
c=np.array(Image.open(M+'coll.png').convert('RGB'));r=c[...,0];out=np.zeros((NH,NW),np.uint8)
for v,th in [(3,.5),(2,.4),(1,.3)]:
    f=cv2.resize((r==v).astype(np.float32),(NW,NH),interpolation=cv2.INTER_AREA);out[f>th]=v
o=np.zeros((NH,NW,3),np.uint8);o[...,0]=out;Image.fromarray(o).save(M+'coll.png')
# 物件
rnd=random.Random(7);keep=[]
for k,x,y in J['objs']:
    big='bridge' in k or 'dock' in k or J['coll_r'].get(k,0)>=10
    if big or rnd.random()<SC*SC*1.1:keep.append([k,round(x*SC),round(y*SC)])
J['objs']=keep
J['spawn']=[round(J['spawn'][0]*SC),round(J['spawn'][1]*SC)];J['WW'],J['WH']=NW,NH
J['ver']=J.get('ver',0)+1;J['scale']=round(J.get('scale',1)*SC,4)
json.dump(J,open(R+'/data/world.json','w'),ensure_ascii=False,separators=(',',':'))
print(NW,NH,len(keep),lst)
