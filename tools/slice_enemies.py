"""新哥布林三张图 → assets/characters/enemies/<kind>/<frame>.png，并写入 data/enemies.json。
每 2 图像像素 = 1 逻辑像素；以第 1 张第 1 行（普通哥布林）走路帧高 = 39 像素定比例。"""
import numpy as np,cv2,json,os
from PIL import Image
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));OUT=R+'/assets/characters/enemies/'
def load(n):
    a=np.array(Image.open(f'{R}/art_src/enemies/{n}.png').convert('RGB')).astype(int)
    fg=~((a[...,0]>200)&(a[...,2]>200)&(a[...,1]<90)&(abs(a[...,0]-a[...,2])<45));return a,fg.astype(np.uint8)
def grid(a,fg,nrow,ncol):
    """每行按 x 方向把连通块聚成帧：大块各成一帧，小碎块（武器、火花）并到最近的大块。"""
    H,W=fg.shape;n,lab,st,cen=cv2.connectedComponentsWithStats(fg);G=[]
    for r in range(nrow):
        ks=[k for k in range(1,n) if st[k][4]>4 and int(cen[k][1]//(H/nrow))==r]
        big=sorted([k for k in ks if st[k][4]>=600],key=lambda k:cen[k][0])
        # 相互重叠或很近的大块合成一帧
        groups=[]
        for k in big:
            x0,x1=st[k][0],st[k][0]+st[k][2]
            if groups and x0<groups[-1]['x1']+6 and abs(cen[k][0]-groups[-1]['cx'])<W/ncol*.55:groups[-1]['ks'].append(k);groups[-1]['x1']=max(groups[-1]['x1'],x1)
            else:groups.append({'ks':[k],'x1':x1,'cx':cen[k][0]})
        while len(groups)>ncol:   # 多出来的：把最小的一组并进相邻组
            i=min(range(len(groups)),key=lambda i:sum(st[k][4] for k in groups[i]['ks']));j=i-1 if i>0 else 1
            if i>0 and i<len(groups)-1 and abs(groups[i+1]['cx']-groups[i]['cx'])<abs(groups[i]['cx']-groups[i-1]['cx']):j=i+1
            groups[j]['ks']+=groups[i]['ks'];groups.pop(i)
        for gg in groups:gg['cx']=np.mean([cen[k][0] for k in gg['ks']])
        for k in ks:
            if st[k][4]<600:min(groups,key=lambda gg:abs(gg['cx']-cen[k][0]))['ks'].append(k)
        row=[]
        for gg in groups:
            m=np.isin(lab,gg['ks']);ys,xs=np.where(m);bx0,bx1,by0,by1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
            mm=m[by0:by1,bx0:bx1];rgba=np.dstack([a[by0:by1,bx0:bx1],mm*255]).astype(np.uint8)
            hy=mm.shape[0];cxs=np.where(mm[hy//2:])[1];cx=float(np.median(cxs)) if len(cxs) else mm.shape[1]/2
            row.append((rgba,cx))
        print(r,len(row),end=' | ')
        G.append(row+[None]*(ncol-len(row)))
    print();return G
def clean(im):
    a=np.array(im);a[...,3]=np.where(a[...,3]>120,255,0)
    for _ in range(2):
        al=a[...,3]>0;edge=al&~cv2.erode(al.astype(np.uint8),np.ones((3,3),np.uint8)).astype(bool);r,g,b=[a[...,k].astype(int) for k in range(3)]
        a[...,3][edge&(r-g>50)&(b-g>50)&(abs(r-b)<70)]=0
    return Image.fromarray(a)
J=json.load(open(R+'/data/enemies.json'))
def save(kind,frames,scale,names,stats):
    os.makedirs(OUT+kind,exist_ok=True);F={}
    for nm,cell in zip(names,frames):
        if cell is None or nm is None:continue
        rgba,cx=cell;im=Image.fromarray(rgba);w,h=max(1,round(im.width*scale)),max(1,round(im.height*scale))
        im=clean(im.resize((w,h),Image.BOX));p=f'assets/characters/enemies/{kind}/{nm}.png';im.save(R+'/'+p,optimize=True)
        F[nm]={'src':p,'size':[w/2,h/2],'anchor':[round(cx*scale/2,2),h/2-.5]}
    for a_,b_ in [('idle0','walk0'),('idle1','walk2'),('down','fall'),('recover','windup')]:
        if a_ not in F and b_ in F:F[a_]=F[b_]
    J[kind]=dict(stats,frames=F)
# ---- 第 1 张：每行 9 帧（走 0-4、前摇、攻击、受击、倒地）
a,fg=load('gob_sheet1');G1=grid(a,fg,6,9)
N9=['walk0','walk1','walk2','walk3',None,'windup','strike','hurt','fall']
S=39/max(c[0].shape[0] for c in G1[0][:4])
specs1=[('gob_kid',.7,dict(hp=1,speed=42,reach=16,damage=6,role='normal',nw=4,sc=.75)),
        ('gob_bomb',1,dict(hp=2,speed=39,reach=26,damage=10,role='normal',nw=4,bomb=1)),
        ('gob_boar',1,dict(hp=6,speed=24,reach=24,damage=15,role='normal',nw=4,charge=1)),
        ('gob_rock',1,dict(hp=16,speed=15,reach=24,damage=20,role='normal',nw=4,res='iron',heavy=1)),
        ('gob_mage',1,dict(hp=4,speed=24,reach=120,damage=12,role='normal',nw=4,ranged=True,lob='fire',res='magic')),
        ('gob_ghost',1,dict(hp=4,speed=33,reach=20,damage=10,role='normal',nw=4,res='spirit',ghost=1))]
for (k,s,st),rr in zip(specs1,G1):save(k,rr,S*s,N9,st)
# ---- 第 2 张：每行 8 帧
a,fg=load('gob_sheet2');G2=grid(a,fg,5,8)
N8=['walk0','walk1','walk2','walk3','windup','strike','hurt','fall']
specs2=[('gob_wolf',dict(hp=6,speed=48,reach=22,damage=13,role='normal',nw=4,orbit=1)),
        ('gob_thrower',dict(hp=4,speed=24,reach=160,damage=12,role='normal',nw=4,ranged=True,lob='rock')),
        ('gob_drum',dict(hp=24,speed=21,reach=22,damage=12,role='elite',nw=4,drum=1)),
        ('gob_necro',dict(hp=24,speed=21,reach=22,damage=12,role='elite',nw=4,necro=1)),
        ('gob_giant',dict(hp=80,speed=18,reach=34,damage=25,role='elite',nw=4,leap=1))]
for (k,st),rr in zip(specs2,G2):save(k,rr,S,N8,st)
# ---- 第 3 张：酋长 + 弹道
a,fg=load('gob_sheet3');G3=grid(a,fg,4,8)
save('gob_chief',G3[0],S,N8,dict(hp=12,speed=24,reach=40,damage=26,role='boss',nw=4))
it=G3[2]
os.makedirs(OUT+'fx',exist_ok=True)
for nm,c in zip(['lob_fire','lob_rock','boom0','boom1','boom2','boom3','skel0','skel1'],it):
    rgba,cx=c;im=Image.fromarray(rgba);im=clean(im.resize((max(1,round(im.width*S)),max(1,round(im.height*S))),Image.BOX));im.save(OUT+'fx/'+nm+'.png',optimize=True)
sk=[it[6],it[7],it[6],it[7],it[7],it[6],it[7],it[6]]
save('skeleton',sk,S,N8,dict(hp=2,speed=30,reach=18,damage=8,role='summon',nw=2))
json.dump(J,open(R+'/data/enemies.json','w'),ensure_ascii=False)
print('ok',S)
