"""清理图标里切图时混进来的邻格碎片：贴着图片边缘、面积小、且跟主体分开的连通块会被去掉，然后重新裁边。
用法：python3 tools/clean_icon_edges.py [--dry] 文件...  （--dry 只出对比图不写回）"""
import sys,numpy as np,cv2
from PIL import Image
def clean(path):
    im=Image.open(path).convert('RGBA');a=np.array(im);al=(a[...,3]>20).astype(np.uint8);H,W=al.shape
    n,l,st,_=cv2.connectedComponentsWithStats(al)
    if n<=1:return None
    mi=1+int(np.argmax(st[1:,4]));mx,my,mw,mh,big=st[mi];rm=[]
    for i in range(1,n):
        if i==mi:continue
        x,y,w,h,ar=st[i]
        edge=x<=1 or y<=1 or x+w>=W-1 or y+h>=H-1
        gap=max(mx-(x+w),x-(mx+mw),my-(y+h),y-(my+mh))
        if edge and ar<big*.12 and (gap>2 or (y<=1 and h<=max(8,H*.12))):rm.append(i)
    if not rm:return None
    a[np.isin(l,rm),3]=0;out=Image.fromarray(a);return out.crop(out.getbbox())
if __name__=='__main__':
    dry='--dry' in sys.argv;fs=[f for f in sys.argv[1:] if f!='--dry'];ch=[]
    for f in fs:
        r=clean(f)
        if r is None:continue
        ch.append((f,Image.open(f).convert('RGBA'),r))
        if not dry:r.save(f)
    S=110;sheet=Image.new('RGBA',(2*S+4,max(1,len(ch))*S),(30,50,100,255))
    for j,(f,a,b) in enumerate(ch):
        for k,im in enumerate((a,b)):
            t=im.copy();t.thumbnail((S-6,S-6));sheet.paste(t,(k*(S+4)+3,j*S+3),t)
    sheet.save('/tmp/claude-0/-home-claude/b6fcd064-da0c-5ebc-9c98-f983720bd619/scratchpad/clean.png');print(len(ch),[c[0] for c in ch])
