"""切分黄巾兵原图：去洋红底，保留动作里的武器，并单独导出弓箭。

用法：python3 tools/slice_enemies.py（需要 numpy、opencv-python、Pillow）
"""
import json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'art_src/characters/enemies'
OUT = ROOT / 'assets/characters/enemies'
SCALE = 40 / 245  # 2 倍画布约 40 像素高，接近游戏里缩放后的主角。
NAMES = ['idle0', 'idle1', 'walk0', 'walk1', 'walk2', 'walk3', 'walk4', 'walk5']
STATS = {
    'grunt_club': dict(source='grunt_club', hp=2, speed=29, reach=24, damage=12),
    'blade': dict(source='blade', hp=2, speed=32, reach=27, damage=12),
    'spear': dict(source='spear', hp=2, speed=27, reach=36, damage=12),
    'shield': dict(source='shield', hp=3, speed=22, reach=25, damage=14),
    'archer': dict(source='archer', hp=1, speed=25, reach=130, damage=12),
}

def components(row):
    rgb = row.astype(np.int16)
    mask = ~((rgb[:,:,0] > 180) & (rgb[:,:,2] > 170) & (rgb[:,:,1] < 130))
    _, labels, stats, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), 8)
    major = sorted([i for i in range(1, len(stats)) if stats[i,4] > 1800], key=lambda i: stats[i,0])
    return labels, stats, major

def build_groups(labels, stats, major, groups):
    # 大连通块按原图顺序归入各动作；小碎片归入距离最近的主体，保留弓弦等细节。
    assignment = {}
    for index, group in enumerate(groups):
        for idx in group:
            assignment[major[idx]] = index
    for idx in range(1, len(stats)):
        if idx in assignment or stats[idx,4] < 3:
            continue
        x,y,w,h,_=stats[idx];cx=x+w/2;cy=y+h/2
        def gap(mid):
            a,b,c,d,_=stats[mid]
            return max(a-cx,0,cx-(a+c))**2 + max(b-cy,0,cy-(b+d))**2
        assignment[idx] = assignment[min(assignment.keys(), key=gap)]
    return [np.isin(labels, [key for key,value in assignment.items() if value == group]) for group in range(len(groups))]

def save_frame(row, mask, path, baseline, lying=False):
    ys,xs=np.nonzero(mask)
    x0,x1=max(0,xs.min()-3),min(row.shape[1],xs.max()+4)
    y0,y1=max(0,ys.min()-3),min(row.shape[0],ys.max()+4)
    # 使用脚底附近的主体位置作为锚点，而不是武器尖端或整个画框的中心。
    if lying:
        foot_x=np.median(xs[ys > np.percentile(ys,55)])
        foot_y=np.percentile(ys,97)
    else:
        low=(ys >= baseline-35) & (ys <= baseline+8)
        foot_x=np.median(xs[low]) if low.any() else np.median(xs)
        foot_y=baseline
    rgba=np.dstack((row[y0:y1,x0:x1],(mask[y0:y1,x0:x1]*255).astype(np.uint8)))
    w,h=max(1,round((x1-x0)*SCALE)),max(1,round((y1-y0)*SCALE))
    # 与 slice_walk.py 一样先做预乘 alpha 再缩小，避免洋红边。
    f=rgba.astype(np.float32);f[:,:,:3]*=f[:,:,3:]/255
    f=cv2.resize(f,(w,h),interpolation=cv2.INTER_AREA)
    f[:,:,:3]/=np.maximum(f[:,:,3:]/255,1e-3);f[:,:,3]=np.where(f[:,:,3]>110,255,0)
    Image.fromarray(f.clip(0,255).astype(np.uint8)).save(path)
    return {'src':path.relative_to(ROOT).as_posix(),'size':[w/2,h/2],
            'anchor':[round((foot_x-x0)*SCALE/2,2),round((foot_y-y0)*SCALE/2,2)]}

result={}
for kind, stats in STATS.items():
    src=np.array(Image.open(SOURCE / ('yellow_'+stats['source']+'.png')).convert('RGB'))
    assert src.shape[:2] == (724,2172), f'原图尺寸异常: {kind}'
    out=OUT/kind;out.mkdir(parents=True,exist_ok=True)
    top,bottom=src[:362],src[362:]
    labels,parts,major=components(top)
    assert len(major)==8,(kind,'第一行',len(major))
    frames={}
    for name,mask in zip(NAMES,build_groups(labels,parts,major,[[i] for i in range(8)])):
        frames[name]=save_frame(top,mask,out/(name+'.png'),325)
    labels,parts,major=components(bottom)
    if kind=='archer':
        groups=[[0],[1],[2],[3],[4,5],[6]]
        names=['windup','strike','arrow','hurt','fall','down']
    elif kind=='shield':
        groups=[[0],[1],[2],[3],[4,5],[6,7]]
        names=['windup','strike','recover','hurt','fall','down']
    else:
        groups=[[0],[1],[2],[3],[4,5],[6]]
        names=['windup','strike','recover','hurt','fall','down']
    assert max(i for group in groups for i in group)<len(major),(kind,'第二行',len(major))
    for name,mask in zip(names,build_groups(labels,parts,major,groups)):
        frames[name]=save_frame(bottom,mask,out/(name+'.png'),310,lying=name=='down')
    result[kind]={**{k:v for k,v in stats.items() if k!='source'},'frames':frames}
path=ROOT/'data/enemies.json'
path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('生成',len(result),'种敌人：',path)
