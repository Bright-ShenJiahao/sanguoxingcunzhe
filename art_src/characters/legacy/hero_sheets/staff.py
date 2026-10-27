from PIL import Image,ImageDraw,ImageFont
import numpy as np, colorsys, math
S=8
OUT=(22,16,34,255);DK=(104,64,34,255);MD=(152,100,54,255);LT=(196,140,80,255);CAP=(70,44,28,255)
def skin(fr):
    a=np.asarray(fr).astype(float);m=np.zeros(a.shape[:2],bool)
    for y in range(a.shape[0]):
        for x in range(a.shape[1]):
            if a[y,x,3]<128:continue
            h,s,v=colorsys.rgb_to_hsv(*(a[y,x,:3]/255))
            if 0.04<h<0.11 and s>.3 and v>.65:m[y,x]=True
    return m
def fist(fr,mode,sk):
    ys,xs=np.where(np.asarray(fr)[...,3]>0);top,bot=ys.min(),ys.max();h=bot-top
    lo=top+int(h*.42) if 'low' in mode else top;hi=top+int(h*.8)
    mm=sk.copy();mm[:lo]=False;mm[hi:]=False;y2,x2=np.where(mm)
    if mode.startswith('R'):xm=x2.max();sel=x2>=xm-3;dx=-1.5
    else:xm=x2.min();sel=x2<=xm+3;dx=1.5
    return (float(x2[sel].mean())+dx,float(y2[sel].mean()))
def pole(fr,rear,front,tip=24,tail=12,thick=2):
    cw,ch=fr.size;pad=60;W=(cw+2*pad)*S;H=(ch+2*pad)*S
    dx,dy=front[0]-rear[0],front[1]-rear[1];L=math.hypot(dx,dy) or 1;ux,uy=dx/L,dy/L
    p0=((rear[0]-ux*tail+pad)*S,(rear[1]-uy*tail+pad)*S);p1=((front[0]+ux*tip+pad)*S,(front[1]+uy*tip+pad)*S)
    im=Image.new('RGBA',(W,H),(0,0,0,0));d=ImageDraw.Draw(im)
    d.line([p0,p1],fill=OUT,width=int((thick+2)*S));d.line([p0,p1],fill=MD,width=int(thick*S))
    nx,ny=-uy,ux  # normal
    d.line([(p0[0]+nx*S*.5,p0[1]+ny*S*.5),(p1[0]+nx*S*.5,p1[1]+ny*S*.5)],fill=LT,width=int(S*.9))
    # end caps
    for (px,py,sg) in ((p0[0],p0[1],1),(p1[0],p1[1],-1)):
        q=(px+ux*S*3*sg,py+uy*S*3*sg);d.line([(px,py),q],fill=CAP,width=int(thick*S))
    sm=im.resize((W//S,H//S),Image.BOX);a=np.asarray(sm).copy();a[...,3]=np.where(a[...,3]>90,255,0)
    # snap colors to nearest of palette
    pal=np.array([OUT[:3],DK[:3],MD[:3],LT[:3],CAP[:3]]);rgb=a[...,:3].astype(int);dd=((rgb[:,:,None,:]-pal[None,None])**2).sum(3);a[...,:3]=pal[dd.argmin(2)]
    return Image.fromarray(a),pad
def fr_(sh,i):return Image.open(f'{sh}_f{i:02d}.png').convert('RGBA')
if __name__=='__main__':
    # save the staff weapon itself (vertical)
    st=Image.new('RGBA',(40,40*S),(0,0,0,0))
    base=Image.new('RGBA',(8,60),(0,0,0,0));tmp,_=pole(Image.new('RGBA',(4,4)),(4,52),(4,10),tip=0,tail=0)
    cases=[('sheet2',0,'R low','L low'),('sheet2',1,'R low','L low'),('sheet2',2,'R','L low'),('sheet2',3,'L','L low')]
    Z=4;cw,ch=fr_('sheet2',0).size;pad=60
    sheet=Image.new('RGB',(cw*4*Z,ch*Z),(58,70,52))
    for c,(sh,i,fm,rm) in enumerate(cases):
        fr=fr_(sh,i);sk=skin(fr);f=fist(fr,fm,sk);r=fist(fr,rm,sk)
        if abs(f[0]-r[0])+abs(f[1]-r[1])<6:r=(r[0]-10,r[1]+3)
        p,pad=pole(fr,r,f)
        base=Image.new('RGBA',p.size,(0,0,0,0));base.alpha_composite(fr,(pad,pad));
        # pole behind fists: composite body, pole, then fists
        comp=base.copy();comp.alpha_composite(p)
        fm_=np.zeros(p.size[::-1],bool)
        for (fx,fy) in (f,r):
            for y in range(int(fy)-2,int(fy)+3):
                for x in range(int(fx)-2,int(fx)+3):
                    if 0<=y<sk.shape[0] and 0<=x<sk.shape[1] and sk[y,x]:fm_[y+pad,x+pad]=True
        a=np.asarray(comp).copy();b=np.asarray(base);a[fm_]=b[fm_];comp=Image.fromarray(a).crop((pad-10,pad-30,pad+cw+50,pad+ch+10))
        comp=comp.resize((cw*Z,ch*Z) if False else (comp.width*Z,comp.height*Z),Image.NEAREST)
        sheet.paste(comp.crop((0,0,min(comp.width,cw*Z),min(comp.height,ch*Z))),(c*cw*Z,0)) if False else None
        if c==0: out=Image.new('RGB',(comp.width*4,comp.height),(58,70,52))
        out.paste(comp,(c*comp.width,0),comp)
    out.save('staff_preview.png');print(out.size,[ (f,r) ])
