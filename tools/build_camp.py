"""北部哥布林部落营地：木栅栏（3 个门）、帐篷、篝火、晾肉架、图腾等摆件写进 world.json，挡路部分画进碰撞图。
战鼓本体是运行时的实体（src/run.js 里的 camp），这里只留出中间空地。用法：python3 tools/build_camp.py"""
import json,os,math,numpy as np,cv2
from PIL import Image
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));M=R+'/assets/map/'
J=json.load(open(R+'/data/world.json'))
CX,CY,RX,RY=900,290,200,135
GAPS=[(78,102),(198,222),(318,342)]   # 南门、西北门、东北门（角度，y 朝下）
SZ={'fence_h':(30,20),'fence_v':(10,21),'tent_a':(62,50),'tent_b':(90,42),'totem':(22,62),'fire':(34,28),'rack':(46,30),'bones':(40,13),'crates':(40,19),'gate_l':(16,38),'gate_r':(16,38)}
for k,v in SZ.items():J['size']['camp_'+k]=list(v)
J['objs']=[o for o in J['objs'] if not (((o[1]-CX)/(RX+40))**2+((o[2]-CY)/(RY+40))**2<1 or str(o[0]).startswith('camp_'))]
new=[];c=np.array(Image.open(M+'coll.png').convert('RGB'));blk=np.zeros(c.shape[:2],np.uint8)
ingap=lambda t:any(a<=t<b for a,b in GAPS)
t=0.
while t<360:
    r=math.radians(t);x,y=CX+RX*math.cos(r),CY+RY*math.sin(r)
    if not ingap(t):
        side=abs(math.cos(r))>.8
        new.append(['camp_fence_v' if side else 'camp_fence_h',round(x,1),round(y+4,1)])
        cv2.circle(blk,(int(x),int(y)),6,1,-1)
    # 每段弧长：横段约 26，竖段约 9
    step=(9 if abs(math.cos(r))>.8 else 24)/math.hypot(RX*math.sin(r),RY*math.cos(r))*57.3;t+=max(step,1.5)
for a,b in GAPS:
    for tt,k in [(a,'camp_gate_l'),(b,'camp_gate_r')]:
        r=math.radians(tt);new.append([k,round(CX+RX*math.cos(r),1),round(CY+RY*math.sin(r)+6,1)])
deco=[('tent_a',-120,-55,26,10),('tent_b',-10,-95,40,9),('tent_a',110,-60,26,10),('tent_b',-140,40,40,9),('rack',125,45,20,5),('totem',-60,-22,8,5),('fire',0,30,0,0),('bones',-60,85,0,0),('crates',70,85,16,5)]
for k,dx,dy,rw,rh in deco:
    x,y=CX+dx,CY+dy;new.append(['camp_'+k,x,y])
    if rw:cv2.ellipse(blk,(x,y-rh//2),(rw,rh),0,0,360,1,-1)
c[...,0][(blk>0)&(c[...,0]!=1)]=1;Image.fromarray(c).save(M+'coll.png')
J['objs']+=new;J['camp']={'x':CX,'y':CY+5,'rx':RX,'ry':RY};J['ver']+=1
json.dump(J,open(R+'/data/world.json','w'),ensure_ascii=False,separators=(',',':'));print('camp objs',len(new))
