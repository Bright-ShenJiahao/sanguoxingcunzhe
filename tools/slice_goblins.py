"""切分哥布林表（6 行：小兵/刀手/弓手/盾兵/萨满/大王；洋红底）→ assets/characters/enemies/<k>/<帧>.png，并改写 data/enemies.json。
每行：2 待机 + 6 走路 + 攻击（3 帧，弓手 4 帧）+ 受击 + 倒下 + 躺地 + 末尾 1 个附件（弓手的箭；其他行的掉落武器不用）。
用法：python3 tools/slice_goblins.py art_src/characters/enemies/goblins.png ；之后跑 tools/outline.py 描边。"""
import sys,json,os,numpy as np,cv2
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
a=np.array(Image.open(sys.argv[1]).convert('RGB')).astype(int)
mag=(a[...,0]>170)&(a[...,2]>160)&(a[...,1]<110)
# 去粉边：洋红与主体之间的过渡像素也当背景
pink=(a[...,0]>150)&(a[...,2]>120)&(a[...,1]<a[...,0]-60)&(a[...,1]<a[...,2]-30)
fg=~(mag|pink)
fg=cv2.morphologyEx(fg.astype(np.uint8),cv2.MORPH_OPEN,np.ones((2,2),np.uint8)).astype(bool)
rp=fg.sum(1)>3;rows=[];st=None
for y,v in enumerate(list(rp)+[False]):
    if v and st is None: st=y
    if not v and st is not None:
        if y-st>30: rows.append((st,y))
        st=None
KINDS=[('goblin',15,dict(hp=2,speed=30,reach=22,damage=10,role='normal')),
       ('gob_blade',15,dict(hp=2,speed=36,reach=25,damage=11,role='normal')),
       ('gob_archer',16,dict(hp=1,speed=26,reach=130,damage=10,role='normal',ranged=True)),
       ('gob_shield',15,dict(hp=4,speed=22,reach=23,damage=13,role='normal')),
       ('gob_shaman',16,dict(hp=3,speed=24,reach=110,damage=12,role='elite',ranged=True)),
       ('gob_king',15,dict(hp=6,speed=24,reach=34,damage=22,role='boss'))]
assert len(rows)==6,rows
def segments(prof,target):
    on=prof>2;segs=[];st=None
    for x,v in enumerate(list(on)+[False]):
        if v and st is None: st=x
        if not v and st is not None: segs.append([st,x]);st=None
    while len(segs)>target:     # 碎片并到最近的邻居
        i=min(range(len(segs)),key=lambda i:segs[i][1]-segs[i][0])
        j=i-1 if i==len(segs)-1 or (i>0 and segs[i][0]-segs[i-1][1]<segs[i+1][0]-segs[i][1]) else i+1
        segs[min(i,j)]=[min(segs[i][0],segs[j][0]),max(segs[i][1],segs[j][1])];segs.pop(max(i,j))
    while len(segs)<target:     # 粘连的拆开：在最宽段中间找最细的一列
        i=max(range(len(segs)),key=lambda i:segs[i][1]-segs[i][0]);s,e=segs[i];w=e-s
        c=s+int(w*.25)+int(np.argmin(prof[s+int(w*.25):s+int(w*.75)]))
        segs[i:i+1]=[[s,c],[c,e]]
    return segs
OUT=ROOT+'/assets/characters/enemies/';ED={}
idle_h=None
for (k,n,stats),(ya,yb) in zip(KINDS,rows):
    pad=25;ya=max(0,ya-pad);yb=min(a.shape[0],yb+4)
    F=fg[ya:yb];prof=F.sum(0);segs=segments(prof,n)
    if k=='gob_shaman': segs=segs[:8]+[[837,938],[938,1042],[1042,1102],[1102,1218],[1218,1331],[1331,1451],[1451,1579],[1579,1668]]   # 萨满一行粘连多，手工切
    names=['idle0','idle1']+['walk%d'%i for i in range(6)]+(['windup','draw','strike','recover'] if k=='gob_archer' else ['windup','strike','fx','recover'] if k=='gob_shaman' else ['windup','strike','recover'])+['hurt','fall','down','extra']
    print(k,[(nm,s_,e_) for nm,(s_,e_) in zip(names,segs)][-6:])
    base=max(np.nonzero(F[:,segs[0][0]:segs[0][1]].any(1))[0].max(),np.nonzero(F[:,segs[1][0]:segs[1][1]].any(1))[0].max())
    hh=base-np.nonzero(F[:,segs[0][0]:segs[0][1]].any(1))[0].min()
    if idle_h is None: idle_h=hh
    SC=40/idle_h          # 小兵站立 ≈ 20 逻辑像素（40 设备像素）；其他兵种按原图比例
    os.makedirs(OUT+k,exist_ok=True);frames={}
    for nm,(s,e) in zip(names,segs):
        if (nm=='extra' and k!='gob_archer') or nm=='fx': continue
        m=F[:,s:e];ys,xs=np.nonzero(m)
        y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
        rgba=np.dstack([a[ya+y0:ya+y1,s+x0:s+x1],m[y0:y1,x0:x1]*255]).astype(np.uint8)
        w,h=max(1,round((x1-x0)*SC)),max(1,round((y1-y0)*SC))
        im=Image.fromarray(rgba,'RGBA').resize((w,h),Image.LANCZOS)
        al=np.array(im)[...,3];arr=np.array(im);arr[...,3]=np.where(al>100,255,0);im=Image.fromarray(arr)
        if nm=='extra':
            fn='arrow';im.save(OUT+k+'/arrow.png');frames['arrow']={'src':f'assets/characters/enemies/{k}/arrow.png','size':[w/2,h/2],'anchor':[w/4,15.1]};continue
        low=ys>y1-1-(y1-y0)*.18;fx=np.median(xs[low]) if low.any() else (x0+x1)/2
        im.save(OUT+k+'/'+nm+'.png')
        frames[nm]={'src':f'assets/characters/enemies/{k}/{nm}.png','size':[w/2,h/2],'anchor':[round((fx-x0)*SC/2,2),round((base-y0)*SC/2,2)]}
    if n==16: frames['strike']=frames['strike']
    ED[k]={**stats,'frames':frames}
    print(k,len(frames),[round(v,1) for v in frames['idle0']['size']])
json.dump(ED,open(ROOT+'/data/enemies.json','w'),ensure_ascii=False,separators=(',',':'))
