"""北部哥布林部落营地：木栅栏（3 个门）、帐篷、篝火、晾肉架、图腾等摆件写进 world.json，挡路部分画进碰撞图。
战鼓本体是运行时的实体（src/run.js 里的 camp），这里只留出中间空地。用法：python3 tools/build_camp.py"""
import json,os,math,numpy as np,cv2
from PIL import Image
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));M=R+'/assets/map/'
J=json.load(open(R+'/data/world.json'))
CX,CY,RX,RY=900,290,190,125
GAPS=[(78,102),(198,222),(318,342)]   # 南门、西北门、东北门（角度，y 朝下）
SZ={'fence_h':(30,15.5),'fence_v':(10,21),'tent_a':(62,50),'tent_b':(90,42),'totem':(22,62),'fire':(34,28),'rack':(46,30),'bones':(40,13),'crates':(40,19),'gate_l':(16,38),'gate_r':(16,38)}
for k,v in SZ.items():J['size']['camp_'+k]=list(v)
J['objs']=[o for o in J['objs'] if not (((o[1]-CX)/(RX+40))**2+((o[2]-CY)/(RY+40))**2<1 or str(o[0]).startswith('camp_'))]
new=[];c=np.array(Image.open(M+'coll.png').convert('RGB'));blk=np.zeros(c.shape[:2],np.uint8)
ingap=lambda t:any(a<=t<b for a,b in GAPS)
# 方形营地：上下横段、左右竖段，南门在下边中间，西门东门在左右边中间
X0,X1,Y0,Y1=CX-RX,CX+RX,CY-RY,CY+RY;G=24
def wall(x0,y0,x1,y1):cv2.line(blk,(int(x0),int(y0)),(int(x1),int(y1)),1,8)
x=X0+15
while x<=X1-14:
    new.append(['camp_fence_h',round(x,1),Y0]);x+=27
wall(X0,Y0-3,X1,Y0-3)
x=X0+15
while x<=X1-14:
    if abs(x-CX)>G+6:new.append(['camp_fence_h',round(x,1),Y1])
    x+=27
wall(X0,Y1-3,CX-G,Y1-3);wall(CX+G,Y1-3,X1,Y1-3)
for X in (X0,X1):
    y=Y0+8
    while y<=Y1:
        if abs(y-CY)>G:new.append(['camp_fence_v',X,round(y,1)])
        y+=9
    wall(X,Y0,X,CY-G);wall(X,CY+G,X,Y1)
for gx,gy in [(CX-G-4,Y1+4),(CX+G+4,Y1+4),(X0,CY-G-2),(X0,CY+G+8),(X1,CY-G-2),(X1,CY+G+8)]:
    new.append(['camp_gate_l' if gx<CX or (gx==X0) else 'camp_gate_r',gx,gy])
deco=[('tent_a',-120,-55,26,10),('tent_b',-10,-95,40,9),('tent_a',110,-60,26,10),('tent_b',-140,40,40,9),('rack',125,45,20,5),('totem',-60,-22,8,5),('fire',0,30,0,0),('bones',-60,85,0,0),('crates',70,85,16,5)]
for k,dx,dy,rw,rh in deco:
    x,y=CX+dx,CY+dy;new.append(['camp_'+k,x,y])
    if rw:cv2.ellipse(blk,(x,y-rh//2),(rw,rh),0,0,360,1,-1)
c[...,0][(blk>0)&(c[...,0]!=1)]=1;Image.fromarray(c).save(M+'coll.png')
J['objs']+=new;J['camp']={'x':CX,'y':CY+5,'rx':RX,'ry':RY};J['ver']+=1
json.dump(J,open(R+'/data/world.json','w'),ensure_ascii=False,separators=(',',':'));print('camp objs',len(new))
