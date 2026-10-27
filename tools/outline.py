#!/usr/bin/env python3
"""给角色精灵统一加上“细而黑”的轮廓（和女主一致）。原地处理，不改尺寸和锚点。
用法：python3 tools/outline.py            # 处理 男主/怪物/骑马 精灵（女主不处理）
重新切图（slice_*.py）会覆盖成未描边版本，切完后需再跑一次本脚本。"""
import glob, json, pathlib, numpy as np
from PIL import Image, ImageEnhance
ROOT=pathlib.Path(__file__).resolve().parent.parent
EDGE=(18,11,15)
def outline(im):
    a=np.array(im.convert('RGBA')).astype(float); al=a[...,3]>40
    pad=np.pad(al,1); nb=np.zeros_like(al)
    for dy in(-1,0,1):
        for dx in(-1,0,1):
            if dx or dy: nb|=~pad[1+dy:1+dy+al.shape[0],1+dx:1+dx+al.shape[1]]
    edge=al&nb; rgb=a[...,:3]; lum=rgb@[.3,.59,.11]
    dark=(lum<85)&(lum>=30)&al; rgb[dark]*=.35
    rgb[edge]=EDGE
    out=Image.fromarray(np.dstack([rgb.clip(0,255),a[...,3]]).astype('uint8'),'RGBA')
    return ImageEnhance.Color(out).enhance(.92)
def targets():
    c=ROOT/'assets/characters'
    for pat in ['hero_b/w*.png','hero_b/g_w*.png','hero_m/r*_w*.png','ride/horse_*.png','ride/rider_*.png','enemies/*/*.png']:
        for p in sorted(c.glob(pat)):
            if p.name!='arrow.png': yield p
if __name__=='__main__':
    n=0
    for p in targets():
        outline(Image.open(p)).save(p); n+=1
    print('已描边',n,'张')
