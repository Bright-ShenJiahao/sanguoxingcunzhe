// 新手引导：第一次进局时，屏幕下方依次弹出 5 条短提示（看过就不再出现）
import {t} from './i18n.js?v=11042470';
export function startTutorial(){
 try{if(localStorage.getItem('tutDone'))return}catch(_){return}
 const b=document.createElement('div');b.id='tut';
 b.innerHTML='<style>#tut{position:fixed;left:50%;bottom:calc(16% + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:42;max-width:min(90vw,460px);padding:10px 16px;border-radius:10px;background:#0b1530e6;border:1px solid #e2cb87;color:#fff6dc;font:700 15px/1.45 "PingFang SC","Hiragino Sans","Microsoft YaHei",sans-serif;text-align:center;pointer-events:none;opacity:0;transition:opacity .35s}#tut.on{opacity:1}#tut i{display:block;font-style:normal;font-size:11px;color:#e2cb87;margin-bottom:2px}</style><i></i><span></span>';
 document.body.append(b);
 const N=5;let i=0;
 const show=()=>{if(i>=N){b.classList.remove('on');setTimeout(()=>b.remove(),400);try{localStorage.setItem('tutDone','1')}catch(_){}return}
  b.querySelector('i').textContent=(i+1)+' / '+N;b.querySelector('span').textContent=t('tut.'+(i+1));b.classList.add('on');
  setTimeout(()=>{b.classList.remove('on');i++;setTimeout(show,500)},i===0?4500:4000)};
 setTimeout(show,1200);
 window.TUT_STOP=()=>{i=N;b.remove()};
}
