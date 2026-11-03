# 怪物整套切图：按轮廓切（不一刀切）→ 缩放到目标高度 → 统一描边 → 皮肤换成小哥布林色板（暗 4%、灰 10%）→ 写 enemies.json
# 用法：python3 tools/slice_monster.py <图> <怪物key> <目标高度px> <行名单json> [前缀]
#   行名单：[["idle0","idle1"],["walk0",...],...]，最后一项可以是 ["portrait"]（图鉴头像，高 96，不写 json）
import sys,json,glob,numpy as np
from PIL import Image
from scipy import ndimage as nd
sys.path.insert(0,'tools');from outline import outline
src,key,H0,rows=sys.argv[1],sys.argv[2],float(sys.argv[3]),json.loads(sys.argv[4]);pre=sys.argv[5] if len(sys.argv)>5 else '';NOSKIN='--noskin' in sys.argv
im=np.array(Image.open(src).convert('RGB')).astype(int);r,g,b=im[...,0],im[...,1],im[...,2]
white=(r>200)&(b>200)&(g>130);im[white]=[245,245,250]                       # 刀光、汗滴：被洋红染粉的白色救回来
mag=(r>150)&(b>150)&(g<120)&~white;m=nd.binary_opening(~mag,iterations=1)|white
rgba=np.dstack([im.astype(np.uint8),(m*255).astype(np.uint8)])
rp=m.sum(1)>0;bands=[];st=None
for y,v in enumerate(list(rp)+[False]):
  if v and st is None:st=y
  if not v and st is not None:bands.append([st,y]);st=None
B=[]
for b_ in bands:
  if B and b_[0]-B[-1][1]<45:B[-1][1]=b_[1]
  else:B.append(b_)
B=[b_ for b_ in B if b_[1]-b_[0]>20]
if len(B)!=len(rows):sys.exit(f'行数不对：图里 {len(B)} 行，要求 {len(rows)} 行')
def segs(y0,y1,gap=15):
  col=m[y0:y1].sum(0)>0;S=[];st=None;last=-999
  for x,v in enumerate(col):
    if v:
      if st is None:st=x
      elif x-last>=gap:S.append((st,last+1));st=x
      last=x
  S.append((st,last+1));return [s for s in S if s[1]-s[0]>20]
crops={}
for (y0,y1),N in zip(B,rows):
  S=segs(y0,y1)
  if len(S)!=len(N):sys.exit(f'{N[0]} 这一行帧数不对：图里 {len(S)}，要求 {len(N)}')
  for (x0,x1),nm in zip(S,N):
    c=rgba[y0:y1,x0:x1].copy();cr,cg,cb=[c[...,k].astype(int) for k in range(3)]
    c[...,3]=np.where((cr>120)&(cb>120)&(cg<cr-50)&(cg<cb-50),0,c[...,3])
    ys,xs=np.where(c[...,3]>0);crops[nm]=c[ys.min():ys.max()+1,xs.min():xs.max()+1]
first=next((n for r in rows for n in r if n.startswith('walk') or n.startswith('n_walk')),rows[0][0]);s=H0/crops[first].shape[0]   # 以走路帧为基准缩放
REF=crops[first].shape[0]
for a_ in sys.argv:
  if a_.startswith('--ref='):nm_,hh_=a_[6:].split(':');s=float(hh_)/crops[nm_].shape[0];REF=crops[nm_].shape[0];first=nm_
def skinmask(a):
  h=np.array(Image.fromarray(a[...,:3]).convert('HSV')).astype(float)
  return (a[...,3]>0)&(h[...,0]>28)&(h[...,0]<75)&(h[...,1]>70)&(h[...,2]>60)
P=[]
for p in glob.glob('assets/characters/enemies/goblin/*.png'):
  a=np.array(Image.open(p).convert('RGBA'));P.append(a[skinmask(a)][:,:3])
P=np.concatenate(P).astype(float);P=P[np.argsort(P@[.3,.59,.11])]
out={}
for nm,c in crops.items():
  I=Image.fromarray(c)
  ss=s*(REF/c.shape[0]) if nm.lstrip('n_').startswith('idle') and first.startswith('walk') else s   # 待机帧和走路帧一样高
  I=I.resize((round(I.width*96/I.height),96),Image.LANCZOS) if nm=='portrait' else I.resize((max(1,round(I.width*ss)),max(1,round(I.height*ss))),Image.LANCZOS)
  a=np.array(I);a[...,3]=np.where(a[...,3]>100,255,0);out[nm]=np.array(outline(Image.fromarray(a)))
Q=np.sort(np.concatenate([o[skinmask(o)][:,:3] for n,o in out.items() if n!='portrait']).astype(float)@[.3,.59,.11])
d=json.load(open('data/enemies.json'));F=d[key]['frames'];D=f'assets/characters/enemies/{key}/'
for nm,a in out.items():
  mk=skinmask(a)
  if mk.any() and not NOSKIN:
    l=a[mk][:,:3].astype(float)@[.3,.59,.11];idx=np.clip((np.searchsorted(Q,l)/len(Q)*len(P)).astype(int),0,len(P)-1);a[mk,:3]=P[idx].astype(np.uint8)
    h=np.array(Image.fromarray(a[...,:3]).convert('HSV')).astype(float);h[mk,1]*=.90;h[mk,2]*=.96
    a[...,:3]=np.array(Image.fromarray(np.clip(h,0,255).astype(np.uint8),'HSV').convert('RGB'))
  fn=(pre+nm) if nm!='portrait' else 'portrait'
  Image.fromarray(a).save(D+fn+'.png')
  if nm=='portrait':continue
  al=a[...,3]>0;hh,w=al.shape;ys,xs=np.where(al[int(hh*.85):]);ax=xs.mean()
  F[pre+nm]={'src':D+fn+'.png?v=1','size':[w/2,hh/2],'anchor':[round(float(ax)/2,2),hh/2]}
open('data/enemies.json','w').write(json.dumps(d,ensure_ascii=False,separators=(',',':')))
print('ok',len(out),'张')
