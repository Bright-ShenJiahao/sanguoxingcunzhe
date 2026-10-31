"""哥布林英雄 + 血咒巨魔（Gemini 出图，洋红底 2 行）→ assets/characters/enemies/<k>/*.png，写入 data/enemies.json。
帧按连通块手工挑（巨魔第 5 帧画重了，不用）。"""
import json,os,numpy as np,cv2
from PIL import Image
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
a=np.array(Image.open(R+'/art_src/characters/enemies/hero_troll.png').convert('RGB')).astype(int)
mag=(a[...,0]>170)&(a[...,2]>160)&(a[...,1]<110)
pink=(a[...,0]>150)&(a[...,2]>120)&(a[...,1]<a[...,0]-60)&(a[...,1]<a[...,2]-30)
fg=(~(mag|pink)).astype(np.uint8);fg=cv2.morphologyEx(fg,cv2.MORPH_OPEN,np.ones((2,2),np.uint8))
n,lab,st,_=cv2.connectedComponentsWithStats(fg)
def box(x0,x1,y0,y1):   # 区域内所有面积够大的连通块（含光雾小粒）
    m=np.zeros_like(fg)
    for i in range(1,n):
        x,y,w,h,ar=st[i];cx,cy=x+w/2,y+h/2
        ov=min(x+w,x1)-max(x,x0)
        if ar>12 and y0<=cy<y1 and ov>0 and (ov>.5*w or ov>.5*(x1-x0)):m|=(lab==i)
    m[:, :x0]=0;m[:,x1:]=0;return m.astype(bool)
H=[(0,200),(200,434)]
SPEC={'gob_hero':(H[0],{'idle0':(16,96),'idle1':(98,178),'walk0':(180,254),'walk1':(256,316),'walk2':(319,384),'walk3':(385,449),'windup':(500,600),'strike':(679,752),'recover':(600,679),'hurt':(752,832),'fall':(832,930),'down':(905,1024)},
       dict(hp=70,speed=24,reach=30,damage=24,role='elite',nw=4),46),
      'gob_troll':(H[1],{'idle0':(8,108),'idle1':(112,206),'walk0':(206,306),'walk1':(306,390),'windup':(486,610),'strike':(610,706),'recover':(706,789),'hurt':(789,880),'fall':(789,880),'down':(880,1020)},
       dict(hp=200,speed=14,reach=36,damage=30,role='elite',nw=4),70)}
def bright(arr,k):   # 后期：往 GPT 那种明亮黄绿、硬描边靠
    rgb=arr[...,:3].copy();hsv=cv2.cvtColor(rgb,cv2.COLOR_RGB2HSV).astype(float)
    if k=='gob_troll':
        skin=(hsv[...,0]>8)&(hsv[...,0]<35)&(hsv[...,1]<140);hsv[...,0][skin]=hsv[...,0][skin]*.2+40*.8;hsv[...,1][skin]=np.minimum(255,hsv[...,1][skin]*1.8+30)
    green=(hsv[...,0]>28)&(hsv[...,0]<55);hsv[...,2][green]=np.minimum(255,hsv[...,2][green]*1.15+15)
    hsv[...,1]=np.minimum(255,hsv[...,1]*1.3);hsv[...,2]=np.clip((hsv[...,2]-128)*1.2+140,0,255)
    arr[...,:3]=cv2.cvtColor(hsv.astype(np.uint8),cv2.COLOR_HSV2RGB)
    m=(arr[...,3]>0).astype(np.uint8);edge=(cv2.dilate(m,np.ones((3,3),np.uint8))>0)&(m==0);arr[edge]=[28,22,18,255];return arr
ED=json.load(open(R+'/data/enemies.json'))
for k,((ya,yb),fr,stats,tall) in SPEC.items():
    O=R+'/assets/characters/enemies/'+k+'/';os.makedirs(O,exist_ok=True);frames={}
    m0=box(*fr['idle0'],ya,yb);ys,_=np.nonzero(m0);SC=tall*2/(ys.max()-ys.min())   # 站立高度 = tall 逻辑像素
    for nm,(x0,x1) in fr.items():
        m=box(x0,x1,ya,yb)
        if k=='gob_hero' and nm=='down':m=box(x0,x1,ya+120,yb)
        if k=='gob_hero' and nm=='fall':m=box(x0,x1,ya,ya+130)|box(x0,x1,ya,ya+130)
        ys,xs=np.nonzero(m);y0,y1,xa,xb=ys.min(),ys.max()+1,xs.min(),xs.max()+1
        sub=a[y0:y1,xa:xb];mm=m[y0:y1,xa:xb]&~((sub[...,2]>sub[...,1]+45)&(sub[...,0]>sub[...,1]+45)&(sub[...,2]>90));rgba=np.dstack([sub,mm*255]).astype(np.uint8)
        w,h=max(1,round((xb-xa)*SC)),max(1,round((y1-y0)*SC))
        im=Image.fromarray(rgba,'RGBA').resize((w,h),Image.NEAREST);arr=np.array(im);arr[...,3]=np.where(arr[...,3]>100,255,0);arr=bright(arr,k);Image.fromarray(arr).save(O+nm+'.png')
        low=ys>y1-1-(y1-y0)*.18;fx=np.median(xs[low])
        frames[nm]={'src':f'assets/characters/enemies/{k}/{nm}.png','size':[w/2,h/2],'anchor':[round((fx-xa)*SC/2,2),round(h/2-1,2)]}
    ED[k]={**stats,'frames':frames};print(k,frames['idle0']['size'])
json.dump(ED,open(R+'/data/enemies.json','w'),ensure_ascii=False,separators=(',',':'))
