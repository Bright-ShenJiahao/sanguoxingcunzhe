"""删除开发者面板涂抹区域（或圈起来的区域）内的花草树木（物件），地面和碰撞不变。
用法：python3 tools/clear_objs.py art_src/map/clear_xxx.json [宽度=30]"""
import json,sys,os,numpy as np,cv2
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
L=json.load(open(sys.argv[1]));WID=int(float(sys.argv[2])) if len(sys.argv)>2 else 30
J=json.load(open(R+'/data/world.json'));W,H=J['WW'],J['WH'];m=np.zeros((H,W),np.uint8)
for s in L:
    pts=np.array(s['点'],np.int32)
    if len(pts)==1:cv2.circle(m,tuple(pts[0]),WID//2,255,-1)
    else:
        cv2.polylines(m,[pts],False,255,WID)
        if np.hypot(*(pts[0]-pts[-1]))<40:cv2.fillPoly(m,[pts],255)   # 首尾接近＝圈起来的区域，里面全部清掉
n=len(J['objs']);J['objs']=[o for o in J['objs'] if 'bridge' in o[0] or not (0<=int(o[2])<H and 0<=int(o[1])<W and m[int(o[2]),int(o[1])])]
J['ver']=J.get('ver',0)+1;json.dump(J,open(R+'/data/world.json','w'),ensure_ascii=False,separators=(',',':'))
print('removed',n-len(J['objs']))
