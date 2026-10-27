"""生成绿发版本：骑手 rider_g_*.png、细像素男主 hero_b/g_f*.png（头部区域内的深色/发色像素改成绿色）"""
import os,glob,colorsys,numpy as np
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def recolor(src,dst,head_frac,skip=None,hue=0.33,xmax=999):
    a=np.array(Image.open(src).convert('RGBA'));H,W=a.shape[:2];out=a.copy()
    for y in range(int(H*head_frac)):
        for x in range(W):
            if a[y,x,3]==0 or x>xmax:continue
            if skip and skip[0]<=x<=skip[2] and skip[1]<=y<=skip[3]:continue
            r,g,b=a[y,x,:3]/255;h,s,v=colorsys.rgb_to_hsv(r,g,b)
            if v<.52 or (y<H*head_frac*.45 and s>.55 and .02<h<.14):
                s=max(s,.62);v=min(1,v*1.25+.16);rr,gg,bb=colorsys.hsv_to_rgb(hue,s,v);out[y,x,:3]=[int(rr*255),int(gg*255),int(bb*255)]
    Image.fromarray(out).save(dst)
for i in range(3):
    s=f'{ROOT}/assets/characters/ride/rider_{i}.png';im=Image.open(s)
    # 眼睛位置（逻辑坐标 7.5..12.5 × 6.5..10，乘 2）不改色
    recolor(s,s.replace('rider_','rider_g_'),.42,skip=(19,14,29,19),xmax=34)
for s in glob.glob(f'{ROOT}/assets/characters/hero_b/f*.png'):
    recolor(s,os.path.dirname(s)+'/g_'+os.path.basename(s),.30)
