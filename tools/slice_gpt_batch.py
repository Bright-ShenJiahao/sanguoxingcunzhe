"""GPT 第一批：哥布林英雄/血咒巨魔帧、补给物件/掉落/时间/状态、24 个祝福强化图标、徽章与临时武器。"""
import json,os,sys,numpy as np,cv2
from PIL import Image
sys.path.insert(0,os.path.dirname(__file__));from slice_mag import mask,blocks,cut
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));G=R+'/art_src/gpt/';U=R+'/assets/ui/'
def trim(im):return im.crop(im.getbbox())
def grid(path,cols,rows,y_ranges=None):
    a=np.array(Image.open(path).convert('RGB')).astype(int);m=mask(a);H,W=m.shape;out=[]
    for r in range(rows):
        ya,yb=(y_ranges[r] if y_ranges else (r*H//rows,(r+1)*H//rows))
        for c in range(cols):
            xa,xb=c*W//cols,(c+1)*W//cols;sub=m[ya:yb,xa:xb]
            n,l,st,_=cv2.connectedComponentsWithStats(sub);keep=np.zeros_like(sub)
            if n>1:big=max(st[1:,4]);keep=np.isin(l,[i for i in range(1,n) if st[i][4]>max(30,big*.004)]).astype(np.uint8)
            out.append(trim(Image.fromarray(np.dstack([a[ya:yb,xa:xb],keep*255]).astype(np.uint8))))
    return out
def cells(a,m,ya,yb,n):   # 按连通块质心归格，块不裁断（武器伸出格子也完整）
    sub=m[ya:yb].copy();W=sub.shape[1];cw=W/n
    k,l,st,cen=cv2.connectedComponentsWithStats(sub)
    for i in range(1,k):   # 粘连的大块按格线切开
        if st[i][2]>cw*1.4:
            for c in range(1,n):
                x=int(c*cw)
                if st[i][0]<x<st[i][0]+st[i][2]:sub[:,x][l[:,x]==i]=0
    k,l,st,cen=cv2.connectedComponentsWithStats(sub);out=[]
    big=max(st[1:,4]) if k>1 else 1
    for c in range(n):
        ids=[i for i in range(1,k) if st[i][4]>big*.01 and c*W/n<=cen[i][0]<(c+1)*W/n]
        keep=np.isin(l,ids);ys,xs=np.nonzero(keep);x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
        out.append(Image.fromarray(np.dstack([a[ya+y0:ya+y1,x0:x1],keep[y0:y1,x0:x1]*255]).astype(np.uint8)))
    return out
# 1 英雄/巨魔
ED=json.load(open(R+'/data/enemies.json'));names=['idle0','idle1']+['walk%d'%i for i in range(6)]+['windup','strike','recover','hurt','fall','down']
a=np.array(Image.open(G+'hero_troll.png').convert('RGB')).astype(int);m=mask(a);rp=m.sum(1)
mid=int(np.argmin(rp[300:420]))+300
for k,(ya,yb),tall,st in [('gob_hero',(0,mid),44,dict(hp=70,speed=24,reach=30,damage=24,role='elite')),('gob_troll',(mid,a.shape[0]),66,dict(hp=200,speed=14,reach=36,damage=30,role='elite'))]:
    fr=cells(a,m,ya,yb,14);O=R+'/assets/characters/enemies/'+k+'/';os.makedirs(O,exist_ok=True)
    base=fr[0];S=tall*2/base.height;F={}
    for nm,im in zip(names,fr):
        w,h=max(1,round(im.width*S)),max(1,round(im.height*S));im=im.resize((w,h),Image.LANCZOS);ar=np.array(im);ar[...,3]=np.where(ar[...,3]>110,255,0);Image.fromarray(ar).save(O+nm+'.png')
        al=ar[...,3]>0;ys,xs=np.nonzero(al);low=ys>h*.82;fx=np.median(xs[low]) if low.any() else w/2
        F[nm]={'src':f'assets/characters/enemies/{k}/{nm}.png','size':[w/2,h/2],'anchor':[round(fx/2,2),round(h/2-.5,2)]}
    ED[k]={**st,'frames':F};print(k,F['idle0']['size'])
json.dump(ED,open(R+'/data/enemies.json','w'),ensure_ascii=False,separators=(',',':'))
# 2 物件
a,m,B=blocks(G+'props.png')
N=[['barrel','barrel_x','pot','pot_x','box','box_x'],['meat','goldbag','holywater'],['t_dawn','t_noon','t_dusk','t_night'],['m_crown','m_anger','m_ward','m_blood']]
for row,nn in zip(B,N):
    for b,n in zip(row,nn):cut(a,m,b).save(U+n+'.png')
# 3 图标 6x4
ic=['p_arc','p_crit','p_critd','p_dodge','p_tough','p_svamp','p_rev','p_berserk','p_exec','p_hunt','p_knock','p_boom','p_mag','p_gamble','u_hp','u_spd','u_cd','u_gold','u_rr','u_revive','u_amt','u_dur','s_ban','s_free']
for n,im in zip(ic,grid(G+'icons24.png',6,4)):im.save(U+n+'.png')
# 4 徽章 + 临时武器
a,m,B=blocks(G+'badges.png')
bd=grid(G+'badges.png',10,1,[(B[0][0][1]-4,B[0][0][3]+6)])
for i,im in enumerate(bd):im.save(U+f'rank_{i}.png')
for b,n in zip(B[1],['tw_knife','tw_rock','tw_torch','tw_spear']):cut(a,m,b).save(U+n+'.png')
print('ok')
