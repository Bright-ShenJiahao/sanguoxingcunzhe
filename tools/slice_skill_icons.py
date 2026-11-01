"""GPT：28 个新技能卡图标（7×4，品红底）→ assets/ui/sk_*.png"""
import os,sys
sys.path.insert(0,os.path.dirname(__file__))
import numpy as np,cv2
from PIL import Image
from slice_mag import mask
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def grid(path,cols,rows):
    a=np.array(Image.open(path).convert('RGB')).astype(int);m=mask(a);H,W=m.shape;out=[]
    for r in range(rows):
        for c in range(cols):
            ya,yb,xa,xb=r*H//rows,(r+1)*H//rows,c*W//cols,(c+1)*W//cols;sub=m[ya:yb,xa:xb]
            n,l,st,_=cv2.connectedComponentsWithStats(sub);keep=np.zeros_like(sub)
            if n>1:
                big=max(st[1:,4]);h,w=sub.shape
                edge=lambda i:st[i][0]<=1 or st[i][1]<=1 or st[i][0]+st[i][2]>=w-1 or st[i][1]+st[i][3]>=h-1
                keep=np.isin(l,[i for i in range(1,n) if st[i][4]>max(30,big*.004) and not (edge(i) and st[i][4]<big*.15)]).astype(np.uint8)
            im=Image.fromarray(np.dstack([a[ya:yb,xa:xb],keep*255]).astype(np.uint8));out.append(im.crop(im.getbbox()))
    return out
K='greatsword rapier gsword whip fist trap golem treant wolf mgun wedge hawk orb keg flamestep pouch waterel fireel holyorb hshield hwall sigil fairy shadow bmist dcoil vortex undead'.split()
if __name__=="__main__":
  for k,im in zip(K,grid(R+'/art_src/gpt/skill_icons.png',7,4)):
    im.thumbnail((128,128));im.save(R+f'/assets/ui/sk_{k}.png')
  print(len(K))
