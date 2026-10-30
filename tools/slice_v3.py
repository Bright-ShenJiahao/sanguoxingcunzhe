"""新版男女主（art_src/characters/v3_*）→ 游戏帧。
走路：hero_b/w0-7（男）、heroine/r0_w0-7（女），高 50 像素（每逻辑像素 2 像素），32 色，脚底对齐。
骑乘（矮脚马）：riders/m_pony0-7、f_pony0-7，高 64 像素。"""
import numpy as np,cv2,json,os
from PIL import Image
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));C=R+'/assets/characters/'
def comps(path):
    a=np.array(Image.open(path).convert('RGB')).astype(int);bg=(a[...,0]>150)&(a[...,2]>150)&(a[...,1]<110);fg=(~bg).astype(np.uint8)
    n,lab,st,cen=cv2.connectedComponentsWithStats(cv2.dilate(fg,np.ones((9,9),np.uint8)))
    out=[]
    for k in range(1,n):
        if st[k][4]<2000:continue
        x,y,w,h,_=st[k];m=(fg[y:y+h,x:x+w]>0)&(lab[y:y+h,x:x+w]==k)
        out.append((cen[k][1],x,np.dstack([a[y:y+h,x:x+w],m*255]).astype(np.uint8)))
    rows=[];
    for c in sorted(out,key=lambda t:t[0]):
        if rows and abs(rows[-1][0][0]-c[0])<60:rows[-1].append(c)
        else:rows.append([c])
    return [[t[2] for t in sorted(r,key=lambda t:t[1])] for r in rows]
def fit(frames,H):
    s=H/max(f.shape[0] for f in frames);ims=[]
    for f in frames:
        im=Image.fromarray(f).resize((max(1,round(f.shape[1]*s)),max(1,round(f.shape[0]*s))),Image.BOX)
        a=np.array(im);a[...,3]=np.where(a[...,3]>120,255,0)
        for _ in range(2):   # 去掉边缘的洋红残色
            al=a[...,3]>0;edge=al&~cv2.erode(al.astype(np.uint8),np.ones((3,3),np.uint8)).astype(bool);r,g,b=[a[...,k].astype(int) for k in range(3)]
            a[...,3][edge&(r-g>50)&(b-g>50)&(abs(r-b)<70)]=0
        rgb=Image.fromarray(a[...,:3]).quantize(32,method=Image.MEDIANCUT).convert('RGB')
        ims.append(np.dstack([np.array(rgb),a[...,3]]))
    W=max(i.shape[1] for i in ims)+2;out=[]
    for i in ims:
        c=np.zeros((H,W,4),np.uint8);ys,xs=np.where(i[...,3]>0);cx=int(np.median(xs))   # 按身体中线对齐
        x0=W//2-cx;x0=min(max(0,x0),W-i.shape[1]);c[H-i.shape[0]:,x0:x0+i.shape[1]]=i;out.append(Image.fromarray(c))
    return out
rows=comps(R+'/art_src/characters/v3_chars.png')
m=fit(rows[0],50);f=fit(rows[1],50)
for i,im in enumerate(m):im.save(f'{C}hero_b/w{i}.png')
for i,im in enumerate(f):im.save(f'{C}heroine/r0_w{i}.png')
rm=comps(R+'/art_src/characters/v3_ride_pony.png')[0];rf=comps(R+'/art_src/characters/v3_ride_pony_f.png')[0]
os.makedirs(C+'riders',exist_ok=True)
for pre,fr in [('m',rm),('f',rf)]:
    for i,im in enumerate(fit(fr,64)):im.save(f'{C}riders/{pre}_pony{i}.png')
J=json.load(open(R+'/data/characters.json'));J['hbsize']=[m[0].width/2,25.0];json.dump(J,open(R+'/data/characters.json','w'),ensure_ascii=False)
H=json.load(open(R+'/data/heroine.json'));H['rows'][0]['size']=[f[0].width,50];H['rows'][0]['n']=8;json.dump(H,open(R+'/data/heroine.json','w'),ensure_ascii=False)
print('male',m[0].size,'female',f[0].size,'rows',[len(r) for r in rows],len(rm),len(rf))
