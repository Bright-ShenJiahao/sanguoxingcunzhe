"""单形象角色（v2）：男主（拎掌机）/女主（戴耳机）步行 8 帧 + 骑坐 3 帧（无坐骑，以后叠到任意坐骑上）。
art_src/characters/v2/male.png：行1 男步行8、行2 男骑坐3；walk_ride.png 行2 女步行8；ride_f.png 行3 女骑坐3。
输出：hero_b/w0-7.png、heroine/r0_w0-7.png（覆盖）、riders/m_r0-2.png、f_r0-2.png；更新 data/heroine.json 第 0 行。"""
import os,json,numpy as np,cv2
from PIL import Image
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));A=R+'/assets/characters/';S=R+'/art_src/characters/v2/'
os.makedirs(A+'riders',exist_ok=True)
def load(f):
    a=np.array(Image.open(S+f).convert('RGB')).astype(int);bg=((a[...,0]-a[...,1])>60)&((a[...,2]-a[...,1])>60)
    fg=cv2.morphologyEx((~bg).astype(np.uint8),cv2.MORPH_OPEN,np.ones((2,2),np.uint8));return a,fg
def runs(v,gap=12,mn=30):
    out=[];s=None;last=-99
    for i,x in enumerate(v):
        if x:
            if s is None:s=i
            elif i-last>gap:out.append((s,last+1));s=i
            last=i
    if s is not None:out.append((s,last+1))
    return [r for r in out if r[1]-r[0]>mn]
def frames(f,row,n):
    a,fg=load(f);rows=runs(fg.sum(1)>3,15,60);y0,y1=rows[row];F=fg[y0:y1]
    segs=runs(F.sum(0)>0,10,20)
    while len(segs)>n:
        k=min(range(len(segs)),key=lambda i:segs[i][1]-segs[i][0]);o=k-1 if k==len(segs)-1 or(k>0 and segs[k][0]-segs[k-1][1]<segs[k+1][0]-segs[k][1])else k+1
        segs[min(k,o)]=(min(segs[k][0],segs[o][0]),max(segs[k][1],segs[o][1]));segs.pop(max(k,o))
    assert len(segs)==n,(f,row,len(segs))
    out=[]
    for x0,x1 in segs:
        m=F[:,x0:x1];ys=np.nonzero(m.any(1))[0];out.append((np.dstack([a[y0:y1,x0:x1],m*255]).astype(np.uint8),ys[0],ys[-1]))
    return out
def save(fr,LH,name,common=None):
    top=min(t for _,t,_ in fr);bot=max(b for _,_,b in fr);s=LH*2/(bot-top) if common is None else common   # 像素风：和哥布林同精度（每逻辑像素 2 个图像像素）
    W=max(c.shape[1] for c,_,_ in fr);sz=None
    for i,(c,_,_) in enumerate(fr):
        c=c[top:bot+1];pad=np.zeros((c.shape[0],W,4),np.uint8);pad[:,:c.shape[1]]=c   # 左对齐、底对齐
        w,h=round(W*s),round(c.shape[0]*s);im=Image.fromarray(pad,'RGBA').resize((w,h),Image.BOX)
        ar=np.array(im);ar[...,3]=np.where(ar[...,3]>110,255,0);q=Image.fromarray(ar[...,:3]).quantize(32,method=Image.MEDIANCUT).convert('RGB');ar[...,:3]=np.array(q);Image.fromarray(ar).save(name%i);sz=[w,h]
    return s,sz
s_m,szm=save(frames('male.png',0,8),25,A+'hero_b/w%d.png')
save(frames('male.png',1,3),0,A+'riders/m_r%d.png',s_m)
s_f,szf=save(frames('walk_ride.png',1,8),24,A+'heroine/r0_w%d.png')
save(frames('ride_f.png',2,3),0,A+'riders/f_r%d.png',s_f)
D=json.load(open(R+'/data/characters.json'));D['hbsize']=[szm[0]/2,szm[1]/2];D['grip']={k:v[:8] for k,v in D['grip'].items() if isinstance(v,list)};json.dump(D,open(R+'/data/characters.json','w'),ensure_ascii=False)
H=json.load(open(R+'/data/heroine.json'));r0=H['rows'][0];r0['n']=8;r0['size']=szf;r0['front']=r0['front'][:8];r0['back']=r0['back'][:8];json.dump(H,open(R+'/data/heroine.json','w'),ensure_ascii=False)
print('ok',szm,szf)
