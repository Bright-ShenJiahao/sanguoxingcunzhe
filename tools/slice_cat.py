"""GPT：布偶猫 4 帧（站立/跑1/跑2/挠，品红底）→ assets/characters/summons/cat/*.png"""
import os,sys
sys.path.insert(0,os.path.dirname(__file__))
from slice_skill_icons import grid,R
d=R+'/assets/characters/summons/cat';os.makedirs(d,exist_ok=True)
ims=grid(R+'/art_src/gpt/cat.png',4,1);sc=64/ims[0].height
for f,im in zip(['idle','walk','walk2','atk'],ims):im.resize((round(im.width*sc),round(im.height*sc))).save(f'{d}/{f}.png')
print([im.size for im in ims])
