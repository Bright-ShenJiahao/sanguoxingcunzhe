"""按连通块质心归格切图（不会把图标切掉一半，也不会混进邻格碎片）。"""
import os,sys,numpy as np,cv2
from PIL import Image
sys.path.insert(0,os.path.dirname(__file__))
from slice_mag import mask
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def slice_grid(path,cols,rows):
    a=np.array(Image.open(path).convert('RGB')).astype(int);m=mask(a);H,W=m.shape
    n,l,st,cen=cv2.connectedComponentsWithStats(m);out=[]
    big=np.percentile(st[1:,4],99) if n>1 else 1
    cell={}
    for i in range(1,n):
        if st[i][4]<20:continue
        c=min(cols-1,int(cen[i][0]/W*cols));r=min(rows-1,int(cen[i][1]/H*rows));cell.setdefault((r,c),[]).append(i)
    for r in range(rows):
        for c in range(cols):
            ids=cell.get((r,c),[]);keep=np.isin(l,ids);ys,xs=np.nonzero(keep)
            x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
            out.append(Image.fromarray(np.dstack([a[y0:y1,x0:x1],keep[y0:y1,x0:x1]*255]).astype(np.uint8)))
    return out
if __name__=='__main__':
    U=R+'/assets/ui/'
    ic=['p_arc','p_crit','p_critd','p_dodge','p_tough','p_svamp','p_rev','p_berserk','p_exec','p_hunt','p_knock','p_boom','p_mag','p_gamble','u_hp','u_spd','u_cd','u_gold','u_rr','u_revive','u_amt','u_dur','s_ban','s_free']
    for n,im in zip(ic,slice_grid(R+'/art_src/gpt/icons24.png',6,4)):im.save(U+n+'.png')
    K='greatsword rapier gsword whip fist trap golem treant wolf mgun wedge hawk orb keg flamestep pouch waterel fireel holyorb hshield hwall sigil fairy shadow bmist dcoil vortex undead'.split()
    for k,im in zip(K,slice_grid(R+'/art_src/gpt/skill_icons.png',7,4)):im.thumbnail((128,128));im.save(U+f'sk_{k}.png')
    print('ok')
