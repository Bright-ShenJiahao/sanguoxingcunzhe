// 结局过场：黑屏 → 插图淡入 → 逐行打字 → 点击进入通关结算
import {t} from './i18n.js?v=11042420';
export function playEnding(female,done){
 const k=female?'f':'m',lines=[1,2,3,4,5].map(i=>t(`end.${k}.${i}`)).filter(s=>s&&!s.startsWith('end.'));
 const o=document.createElement('div');o.id='ending';
 o.innerHTML=`<style>#ending{position:fixed;inset:0;z-index:9000;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:max(16px,env(safe-area-inset-top)) 16px;opacity:0;transition:opacity 1.2s;color:#f3ead2;font:16px/1.7 "PingFang SC","Hiragino Sans","Microsoft YaHei",sans-serif;cursor:pointer}
#ending img{width:min(92vw,680px,calc((100vh - 230px)*1.79));image-rendering:pixelated;border:2px solid #e2cb8755;border-radius:6px;opacity:0;transition:opacity 1.6s}
#ending .tx{width:min(92vw,640px);min-height:8.5em;text-align:center;white-space:pre-line}#ending .tp{font-size:13px;color:#e2cb87;opacity:0;transition:opacity .6s}#ending .tx b{color:#ffd76a}</style>
<img src="assets/ui/end_${k}.png?v=1" alt=""><div class="tx"></div><div class="tp">${t('end.tap')}</div>`;
 document.body.append(o);requestAnimationFrame(()=>o.style.opacity=1);
 const img=o.querySelector('img'),tx=o.querySelector('.tx'),tp=o.querySelector('.tp');
 let li=0,ci=0,timer=null,fin=false;
 const show=()=>{tx.innerHTML=lines.slice(0,li).concat(li<lines.length?[lines[li].slice(0,ci)]:[]).join('\n').replace(/GAME CLEAR/g,'<b>GAME CLEAR</b>')};
 const step=()=>{if(li>=lines.length){fin=true;tp.style.opacity=1;return}if(li===1)img.style.opacity=1;ci++;if(ci>lines[li].length){li++;ci=0;show();timer=setTimeout(step,li===1?1400:700);return}show();timer=setTimeout(step,45)};
 setTimeout(step,1300);
 o.addEventListener('click',()=>{if(!fin){clearTimeout(timer);li=lines.length;ci=0;img.style.opacity=1;show();fin=true;tp.style.opacity=1;return}o.style.opacity=0;setTimeout(()=>{o.remove();done?.()},700)});
}
