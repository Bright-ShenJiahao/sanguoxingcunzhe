// 换行美化：专有名词、括号内容、引号内容不被拆到两行（中日文按字换行时最常见的难看断行）
// 自动处理指定容器里新出现的文字；其它地方可手动调用 nbHTML()
const BR=/（[^（）]{1,14}）|\([^()]{1,18}\)|「[^「」]{1,14}」|“[^“”]{1,14}”|"[^"]{1,18}"/g;
let TERMS=null,RE=null;
function terms(){const T=window.NB_TERMS?.()||[],key=T.join('|');if(key!==TERMS){TERMS=key;const ws=[...new Set(T.filter(s=>s&&s.length>=2&&s.length<=12&&/[぀-ヿ一-鿿]/.test(s)))].sort((a,b)=>b.length-a.length).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));RE=ws.length?new RegExp(ws.join('|'),'g'):null}return RE}
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// 把一段纯文字切成 [普通, 不拆, 普通, ...]
function split(s){const re=terms(),marks=[];for(const r of [BR,re])if(r){r.lastIndex=0;let m;while((m=r.exec(s)))marks.push([m.index,m.index+m[0].length])}
 marks.sort((a,b)=>a[0]-b[0]);const out=[];let p=0;for(const [a,b] of marks){if(a<p)continue;if(a>p)out.push([s.slice(p,a),0]);out.push([s.slice(a,b),1]);p=b}if(p<s.length)out.push([s.slice(p),0]);return out}
export function nbHTML(s){return split(String(s)).map(([t,k])=>k?`<span class="nb">${esc(t)}</span>`:esc(t)).join('')}
function fixNode(tn){const s=tn.nodeValue;if(!s||s.length<6||!/[぀-ヿ一-鿿]/.test(s))return;const parts=split(s);if(!parts.some(x=>x[1]))return;
 const f=document.createDocumentFragment();for(const [t,k] of parts){if(k){const e=document.createElement('span');e.className='nb';e.textContent=t;f.append(e)}else f.append(t)}tn.replaceWith(f)}
const SEL='.pp-info p,.pp-body .rc span,#achv .it span,#achv .dt,.survival-dialog p,#dex p,.dex p,.ucard .fx,.si span,#ending .tx';
function scan(root){if(!(root instanceof Element))return;const els=root.matches?.(SEL)?[root]:[];els.push(...root.querySelectorAll(SEL));for(const el of els){if(el.closest('.nb'))continue;const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const L=[];while(w.nextNode()){const n=w.currentNode;if(!n.parentElement.closest('.nb'))L.push(n)}L.forEach(fixNode)}}
export function initNB(){
 const st=document.createElement('style');st.textContent=`.nb{white-space:nowrap}
.pp-info p,#lvup .cd,#achv .it span,#achv .dt,.survival-dialog p,.ucard .fx,.si span,.pp-body .rc span{text-wrap:pretty;line-break:strict;word-break:normal;overflow-wrap:anywhere}
.pp-info h3,.survival-dialog h2{text-wrap:balance}`;document.head.append(st);
 let q=new Set(),on=false;
 new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)q.add(n.nodeType===3?n.parentElement:n);if(!on){on=true;queueMicrotask(()=>{on=false;const L=[...q];q.clear();for(const n of L)if(n&&n.isConnected)scan(n)})}}).observe(document.body,{childList:true,subtree:true,characterData:false});
 scan(document.body);
}
