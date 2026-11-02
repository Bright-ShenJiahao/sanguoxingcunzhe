"""GPT：20 个技能特效和弹道（5×4，品红底）→ assets/fx/skill/*.png"""
import os,sys,numpy as np
from PIL import Image
sys.path.insert(0,os.path.dirname(__file__))
from slice_skill_icons import grid,R
K='slash crack whip fistwave trap rock buck wedge orb keg jet holyorb hwall sigil bubble skull mist dcoil vortex rise'.split()
d=R+'/assets/fx/skill';os.makedirs(d,exist_ok=True)
for k,im in zip(K,grid(R+'/art_src/gpt/skill_fx.png',5,4)):
    if k not in ('holyorb','hwall','sigil','bubble'):im.thumbnail((160,160));im.save(f'{d}/{k}.png');continue   # 紫色系不去溢色
    a=np.array(im).astype(float);r,g,b,al=a[...,0],a[...,1],a[...,2],a[...,3]
    m=np.clip(np.minimum(r,b)-g,0,255)        # 品红溢色：去掉粉边，并按溢色程度变透明
    a[...,0]=r-m;a[...,2]=b-m;a[...,3]=al*np.clip(1-m/160,0,1)
    im=Image.fromarray(np.clip(a,0,255).astype(np.uint8));im.thumbnail((160,160));im.save(f'{d}/{k}.png')
print(len(K))
