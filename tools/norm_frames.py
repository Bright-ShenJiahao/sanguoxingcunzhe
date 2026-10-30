"""把四个卡框对齐：羊皮纸内框统一放在同一位置（画布 180x290，内框 x35-145, y34-244），装饰（翅膀、角）可以伸出内框。"""
from PIL import Image;import numpy as np,os
U=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/assets/ui/'
CW,CH,IX,IY,IW,IH=180,290,35,34,110,210
for i in range(4):
    im=Image.open(f'{U}frames_{i}.png').convert('RGBA');a=np.array(im).astype(int)
    m=(a[...,3]>0)&(a[...,0]>190)&(a[...,1]>150)&(a[...,2]>100)&(a[...,0]-a[...,2]>40)
    rows=np.where(m.sum(1)>m.shape[1]*.4)[0];cols=np.where(m.sum(0)>m.shape[0]*.3)[0]
    sx=IW/(cols.max()-cols.min());sy=IH/(rows.max()-rows.min())
    r=im.resize((round(im.width*sx),round(im.height*sy)),Image.LANCZOS)
    c=Image.new('RGBA',(CW,CH));c.alpha_composite(r,(round(IX-cols.min()*sx),round(IY-rows.min()*sy)))
    c.save(f'{U}card_{i}.png',optimize=True)
print('ok')
