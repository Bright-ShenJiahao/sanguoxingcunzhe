"""指环王风格物件（art_src/map/lotr/*.png，洋红底，每张一行 4 个）→ 覆盖 assets/map/sprites 同名素材，更新 data/world.json 的 size。"""
import numpy as np, cv2, json, os
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SRC=ROOT+'/art_src/map/lotr/'; OUT=ROOT+'/assets/map/sprites/'
J=json.load(open(ROOT+'/data/world.json')); HD=J['HD']
def items(f):
    a=np.array(Image.open(SRC+f).convert('RGB')).astype(int); r,g,b=a[...,0],a[...,1],a[...,2]
    bg=((r>150)&(b>130)&(g<120))|((r>g+40)&(b>g+40))      # 洋红底 + 偏粉的影子/毛边
    fg=cv2.morphologyEx((~bg).astype(np.uint8),cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
    on=fg.sum(0)>2; segs=[];st0=None
    for x,v in enumerate(list(on)+[False]):
        if v and st0 is None: st0=x
        if not v and st0 is not None: segs.append([st0,x]); st0=None
    while len(segs)>4:          # 碎片并到最近的邻居
        k=min(range(len(segs)),key=lambda i:segs[i][1]-segs[i][0])
        o=k-1 if k==len(segs)-1 or (k>0 and segs[k][0]-segs[k-1][1]<segs[k+1][0]-segs[k][1]) else k+1
        segs[min(k,o)]=[min(segs[k][0],segs[o][0]),max(segs[k][1],segs[o][1])]; segs.pop(max(k,o))
    prof=fg.sum(0)
    while len(segs)<4:          # 粘连的拆开：最宽段中间找最细的一列
        k=max(range(len(segs)),key=lambda i:segs[i][1]-segs[i][0]); a0,a1=segs[k]; w=a1-a0
        c=a0+int(w*.3)+int(np.argmin(prof[a0+int(w*.3):a0+int(w*.7)])); segs[k:k+1]=[[a0,c],[c,a1]]
    bx=[]
    for x0,x1 in segs:
        ys=np.nonzero(fg[:,x0:x1].any(1))[0]; bx.append((x0,ys.min(),x1-x0,ys.max()+1-ys.min(),0))
    res=[]
    for x,y,w,h,_ in bx:
        m=fg[y:y+h,x:x+w].astype(bool); res.append(np.dstack([a[y:y+h,x:x+w],m*255]).astype(np.uint8))
    return res
S={}
for f,names in [('shrubs.png',['hedge','gorse','bramble','hawthorn']),('herbs.png',['fern','heather','foxglove','flowers']),
                ('water.png',['reedgrass','cattail','lily','willow']),('rocks.png',['boulder','rubble','standing','wall']),
                ('bridges.png',['sbridge','lbridge','steps','ruin'])]:
    for nm,im in zip(names,items(f)): S[nm]=im
os.makedirs(ROOT+'/art_src/build/lotr_cut',exist_ok=True)
for k,v in S.items(): Image.fromarray(v).save(ROOT+'/art_src/build/lotr_cut/'+k+'.png')
# 旧名 → 新图, 高度（逻辑像素）
MAPK={'bushL1':('gorse',40),'bushL2':('bramble',38),'bushM1':('hawthorn',32),'bushM2':('heather',22),'bushS1':('flowers',16),'bushS2':('fern',18),
      'tuft1':('fern',20),'tuft2':('flowers',13),'tuft3':('foxglove',26),'tuft4':('fern',14),
      'rmid2':('boulder',30),'rsmall1':('rubble',16),
      'wcat1':('cattail',38),'wcat2':('cattail',32),'wcat3':('cattail',42),'wreed1':('reedgrass',34),'wreed2':('reedgrass',28),'wreed3':('reedgrass',24),
      'wlily1':('lily',14),'wlily2':('lily',17)}
for k,(nm,th) in MAPK.items():
    if k not in J['size']: continue
    im=Image.fromarray(S[nm],'RGBA'); hh=th*HD; ww=round(im.width*hh/im.height)
    ar=np.array(im.resize((ww,hh),Image.LANCZOS)); ar[...,3]=np.where(ar[...,3]>120,255,0)
    Image.fromarray(ar).save(OUT+k+'.png'); J['size'][k]=[ww/HD,hh/HD]
json.dump(J,open(ROOT+'/data/world.json','w'),separators=(',',':'))
print('ok')
