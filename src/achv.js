// 成就收藏：卡牌解锁 + 祝福解锁 + 金币成就。进度存在本机 localStorage 'ach'。
import {getLanguage} from './i18n.js?v=11042350';
import {WEAPONS,PASSIVES,WIC,PIC} from './run.js?v=11042350';
const L=o=>o[getLanguage()]||o.zh;
const BOSS={gob_king:'哥布林大王',gob_hero:'哥布林英雄',gob_chief:'哥布林酋长',gob_paladin:'哥布林圣骑士',gob_emperor:'哥布林皇帝'};
const BNAME={gob_king:{zh:'哥布林大王',en:'Goblin King',ja:'ゴブリンキング'},gob_hero:{zh:'哥布林英雄',en:'Goblin Hero',ja:'ゴブリンヒーロー'},gob_chief:{zh:'哥布林酋长',en:'Goblin Chief',ja:'ゴブリン族長'},gob_paladin:{zh:'哥布林圣骑士',en:'Goblin Paladin',ja:'ゴブリン聖騎士'},gob_emperor:{zh:'哥布林皇帝',en:'Goblin Emperor',ja:'ゴブリン皇帝'}};
const T={
 title:{zh:'成就',en:'Achievements',ja:'実績'},done:{zh:'已完成',en:'Completed',ja:'達成'},hide:{zh:'隐藏已完成',en:'Hide completed',ja:'達成済みを隠す'},
 close:{zh:'关闭',en:'Close',ja:'閉じる'},reward:{zh:'奖励',en:'Reward',ja:'報酬'},got:{zh:'达成成就',en:'Achievement',ja:'実績達成'},
 g_surv:{zh:'生存',en:'Survival',ja:'生存'},g_grow:{zh:'成长',en:'Growth',ja:'成長'},g_kill:{zh:'战斗',en:'Combat',ja:'戦闘'},g_boss:{zh:'Boss',en:'Bosses',ja:'ボス'},
 g_card:{zh:'技能卡收集',en:'Skill Cards',ja:'スキル収集'},g_bless:{zh:'祝福收集',en:'Blessings',ja:'祝福収集'},
 rCard:{zh:'解锁技能卡「{n}」',en:'Unlock skill card "{n}"',ja:'スキル「{n}」解放'},rBless:{zh:'解锁祝福「{n}」',en:'Unlock blessing "{n}"',ja:'祝福「{n}」解放'},rGold:{zh:'{n} 金币',en:'{n} gold',ja:'金貨 {n}'}};
const f=(o,v)=>L(o).replace(/\{(\w+)\}/g,(_,k)=>v[k]);
function store(){let a=null;try{a=JSON.parse(localStorage.getItem('ach')||'null')}catch(_){}a=a&&typeof a==='object'?a:{};a.done=a.done||{};a.st=a.st||{};return a}
function save(a){try{localStorage.setItem('ach',JSON.stringify(a))}catch(_){}}
const meta=()=>{try{return JSON.parse(localStorage.getItem('meta')||'{}')}catch(_){return {}}};
const SUM=m=>Object.values(m.kills||{}).reduce((a,b)=>a+(+b||0),0);
// 金币成就：[id, 组, 图标, 说明, (ctx)=>[当前,目标], 金币]
const G=[
 ...[[1,20],[3,30],[5,50],[10,100],[15,150]].map(([m,g])=>['s'+m,'surv','ach_clock',{zh:`单局存活 ${m} 分钟`,en:`Survive ${m} min in one run`,ja:`1回で${m}分生き残る`},c=>[Math.min(m,Math.floor(c.u.best/60)),m],g]),
 ['clear1','surv','ach_trophy',{zh:'通关一次（打倒皇帝并回家）',en:'Clear the game once',ja:'1回クリアする'},c=>[Math.min(1,c.st.clears||0),1],300],
 ['clear5','surv','ach_trophy',{zh:'通关 5 次',en:'Clear the game 5 times',ja:'5回クリアする'},c=>[Math.min(5,c.st.clears||0),5],500],
 ['clearM','surv','ach_crown',{zh:'用男主通关',en:'Clear as the boy',ja:'男主人公でクリア'},c=>[c.st.clearM?1:0,1],200],
 ['clearF','surv','ach_crown',{zh:'用女主通关',en:'Clear as the girl',ja:'女主人公でクリア'},c=>[c.st.clearF?1:0,1],200],
 ['nohit5','surv','ach_heart',{zh:'前 5 分钟一次伤害都没受',en:'Take no damage for the first 5 min',ja:'最初の5分間ノーダメージ'},c=>[c.st.nohit5?1:0,1],150],
 ...[[10,30],[20,60],[30,100],[40,150]].map(([n,g])=>['lv'+n,'grow','ach_up',{zh:`单局升到 ${n} 级`,en:`Reach Lv ${n} in one run`,ja:`1回でLv${n}に到達`},c=>[Math.min(n,c.st.lv||0),n],g]),
 ['l5','grow','ach_book',{zh:'把一张技能升到第 5 级',en:'Raise a skill to Lv 5',ja:'スキルをLv5まで強化'},c=>[c.st.l5?1:0,1],50],
 ['full5','grow','ach_sword',{zh:'技能栏装满 5 张',en:'Fill all 5 skill slots',ja:'スキル枠を5つ埋める'},c=>[c.st.full5?1:0,1],50],
 ['combo100','grow','ach_fist',{zh:'掌机连击达到 100',en:'Reach a 100-hit combo with the handheld',ja:'携帯ゲーム機で100コンボ'},c=>[Math.min(100,c.st.combo||0),100],80],
 ...[[500,40],[1000,80],[2000,150]].map(([n,g])=>['k'+n,'kill','ach_sword',{zh:`单局击杀 ${n}`,en:`Defeat ${n} in one run`,ja:`1回で${n}体撃破`},c=>[Math.min(n,c.st.kills||0),n],g]),
 ...[[10000,100],[50000,300]].map(([n,g])=>['t'+n,'kill','ach_helms',{zh:`累计击杀 ${n}`,en:`Defeat ${n} in total`,ja:`累計${n}体撃破`},c=>[Math.min(n,SUM(c.m)),n],g]),
 ...[['gob_king',50],['gob_hero',60],['gob_chief',80],['gob_paladin',100],['gob_emperor',200]].map(([k,g])=>['b_'+k,'boss','ach_skull',{zh:`打倒${BNAME[k].zh}`,en:`Defeat the ${BNAME[k].en}`,ja:`${BNAME[k].ja}を倒す`},c=>[(c.u.boss?.[BOSS[k]]||0)>0?1:0,1],g]),
 ['boss4','boss','ach_trophy',{zh:'一局打倒 4 个 Boss',en:'Defeat 4 bosses in one run',ja:'1回でボスを4体倒す'},c=>[Math.min(4,c.st.bosses||0),4],150]];
function list(){
 const U=window.UNL,u=U?.load?.()||{best:0,boss:{},runs3:0,c:[],p:[]},m=meta(),a=store(),ctx={u,m,st:a.st},out=[];
 for(const [id,g,ic,d,p,gold] of G){const [cur,goal]=p(ctx);out.push({id,g,ic:`assets/ui/${ic}.png`,d:L(d),cur,goal,done:!!a.done[id]||cur>=goal,rw:f(T.rGold,{n:gold}),gold})}
 for(const [k,,fn] of U?.CU||[]){const ok=U.okC(k),[cur,goal]=fn.p?fn.p(m,u):[ok?1:0,1];out.push({id:'c_'+k,g:'card',ic:WIC[k]?`assets/ui/${WIC[k]}.png`:'',d:U.condC(k),cur:ok?goal:cur,goal,done:ok,rw:f(T.rCard,{n:WEAPONS[k]?.name||k})})}
 (U?.PU||[]).forEach((k,i)=>{const ok=U.okP(k);out.push({id:'p_'+k,g:'bless',ic:PIC[k]?`assets/ui/${PIC[k]}.png`:'',d:U.condP(k),cur:ok?i+1:Math.min(i+1,u.runs3||0),goal:i+1,done:ok,rw:f(T.rBless,{n:PASSIVES[k]?.name||k})})});
 return out}
// 一局结束：记录本局数据，发放新达成的金币成就，返回达成的成就说明
export function achvRunEnd(rec){
 const a=store(),st=a.st,S=window.__G?.S;
 st.lv=Math.max(st.lv||0,rec.lv||0);st.kills=Math.max(st.kills||0,rec.kills||0);st.bosses=Math.max(st.bosses||0,rec.bosses||0);
 if(rec.clear){st.clears=(st.clears||0)+1;if(rec.role==='f')st.clearF=1;else st.clearM=1}
 if(S){if(Object.values(S.w||{}).some(v=>v>=5))st.l5=1;if(S.full5)st.full5=1;st.combo=Math.max(st.combo||0,S.cmax||0)}
 if(rec.t>=300&&(window.FHT==null||window.FHT>=300))st.nohit5=1;
 save(a);
 const got=[];for(const x of list()){if(x.gold&&x.done&&!a.done[x.id]){a.done[x.id]=1;window.META?.spend?.(-x.gold);got.push(x.d+' +'+x.gold+'🪙')}}
 save(a);return got}
export const achvTitle=()=>L(T.got);
// 成就页
export function initAchv(){
 const st=document.createElement('style');st.textContent=`#achv{position:fixed;inset:0;z-index:60;background:#06101cd9;display:grid;place-items:center;padding:max(12px,env(safe-area-inset-top)) 12px}#achv[hidden]{display:none}
#achv .box{width:min(640px,96vw);max-height:min(88vh,860px);display:flex;flex-direction:column;background:linear-gradient(145deg,#234e89,#101f3f);border:2px solid #e2cb87;border-radius:12px;color:#eef3ff;font:15px/1.4 "PingFang SC","Hiragino Sans","Microsoft YaHei",sans-serif;overflow:hidden}
#achv .hd{display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid #e2cb8755;flex-wrap:wrap}#achv h2{margin:0;color:#f6db94;font-size:22px;flex:1}#achv .hd label{font-size:13px;display:flex;gap:6px;align-items:center}#achv .hd button{font:inherit;color:#fff;background:#436da66b;border:1px solid #8fbbef;border-radius:6px;padding:6px 14px;cursor:pointer}
#achv .ls{overflow:auto;padding:6px 10px 12px;flex:1;-webkit-overflow-scrolling:touch}#achv .gh{display:flex;justify-content:space-between;align-items:center;margin:10px 4px 4px;padding:8px 12px;background:#0b1a38;border:1px solid #e2cb8788;border-radius:6px;color:#f6db94;font-weight:800;cursor:pointer;user-select:none}
#achv .it{display:grid;grid-template-columns:22px 1fr auto 34px;gap:10px;align-items:center;padding:8px 10px;border-bottom:1px solid #ffffff14;cursor:pointer}#achv .it.ok{opacity:.72}#achv .ck{width:18px;height:18px;border:2px solid #e2cb87;border-radius:3px;display:grid;place-items:center;color:#f6db94;font-weight:900;font-size:13px}
#achv .pg{font:600 12px ui-monospace,Menlo,monospace;color:#b9cbe6;white-space:nowrap}#achv .it img{width:30px;height:30px;image-rendering:pixelated;object-fit:contain}#achv .dt{padding:10px 16px;border-top:1px solid #e2cb8755;min-height:44px;font-size:14px;background:#0b1a38}#achv .dt b{color:#f6db94}`;
 document.head.append(st);
 const o=document.createElement('div');o.id='achv';o.hidden=true;document.body.append(o);
 let hide=false;const open=new Set(['surv','grow','kill','boss','card','bless']);try{hide=localStorage.getItem('achHide')==='1'}catch(_){}
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const draw=()=>{const xs=list(),n=xs.filter(x=>x.done).length;
  let h=`<div class="box"><div class="hd"><h2>${L(T.title)}　${L(T.done)}：${n}/${xs.length}</h2><label><input type="checkbox" data-h ${hide?'checked':''}>${L(T.hide)}</label><button data-x>${L(T.close)}</button></div><div class="ls">`;
  for(const g of ['surv','grow','kill','boss','card','bless']){const gs=xs.filter(x=>x.g===g);h+=`<div class="gh" data-g="${g}"><span>${open.has(g)?'▼':'▶'} ${L(T['g_'+g])}</span><span>${gs.filter(x=>x.done).length} / ${gs.length}</span></div>`;
   if(open.has(g))for(const x of gs){if(hide&&x.done)continue;h+=`<div class="it${x.done?' ok':''}" data-i="${x.id}"><span class="ck">${x.done?'✓':''}</span><span>${esc(x.d)}</span><span class="pg">${x.goal>1?Math.min(x.cur,x.goal)+' / '+x.goal:''}</span>${x.ic?`<img src="${x.ic}" alt="">`:'<span></span>'}</div>`}}
  h+=`</div><div class="dt"></div></div>`;o.innerHTML=h;o._xs=xs};
 o.addEventListener('click',e=>{if(e.target===o||e.target.closest('[data-x]')){o.hidden=true;return}
  const gh=e.target.closest('[data-g]');if(gh){const g=gh.dataset.g;open.has(g)?open.delete(g):open.add(g);draw();return}
  const it=e.target.closest('[data-i]');if(it){const x=o._xs.find(y=>y.id===it.dataset.i);if(x)o.querySelector('.dt').innerHTML=`${esc(x.d)}<br><b>${L(T.reward)}：</b>${esc(x.rw)}`}});
 o.addEventListener('change',e=>{if(e.target.matches('[data-h]')){hide=e.target.checked;try{localStorage.setItem('achHide',hide?'1':'0')}catch(_){}draw()}});
 const b=document.createElement('button');b.type='button';b.className='menu-board';b.dataset.achv=1;
 const lab=()=>{b.textContent='🏆 '+L(T.title)};lab();b.onclick=()=>{draw();o.hidden=false};
 window.ACHV_OPEN=()=>{draw();o.hidden=false};window.ACHV_NAME=()=>L(T.title);window.ACHV_LABEL=()=>window.META?.drawBar?.();window.META?.drawBar?.();
}
// 通关奖励：任选一张未解锁的技能卡或祝福免费解锁；全部解锁后改为 +1000 金币
export function clearPick(tr,done){
 const U=window.UNL;if(!U){done(null);return}
 const items=[...(U.CU||[]).map(x=>x[0]).filter(k=>!U.okC(k)&&WEAPONS[k]).map(k=>({t:'c',k,nm:WEAPONS[k].name,ic:WIC[k]})),...(U.PU||[]).filter(k=>!U.okP(k)&&PASSIVES[k]).map(k=>({t:'p',k,nm:PASSIVES[k].name,ic:PIC[k]}))];
 if(!items.length){window.META?.spend?.(-1000);done({gold:1});return}
 const o=document.createElement('div');o.id='clrpick';
 o.innerHTML=`<style>#clrpick{position:fixed;inset:0;z-index:70;background:#06101ce6;display:grid;place-items:center;padding:16px}#clrpick .b{width:min(620px,96vw);max-height:86vh;display:flex;flex-direction:column;background:linear-gradient(145deg,#234e89,#101f3f);border:2px solid #e2cb87;border-radius:12px;color:#eef3ff;font:14px "PingFang SC","Hiragino Sans",sans-serif;overflow:hidden}#clrpick h2{margin:14px 16px 2px;color:#f6db94}#clrpick p{margin:0 16px 10px;color:#c9d8f0}#clrpick .g{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px;padding:0 14px 16px;overflow:auto}#clrpick button{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border:1px solid #8fbbef88;border-radius:8px;background:#0c225a99;color:#fff;font:inherit;font-size:12px;cursor:pointer}#clrpick button:hover{border-color:#e2cb87}#clrpick img{width:40px;height:40px;image-rendering:pixelated;object-fit:contain}#clrpick i{font-style:normal;font-size:10px;color:#e2cb87}</style>
<div class="b"><h2>🏆 ${tr('ui.clr.t')}</h2><p>${tr('ui.clr.b')}</p><div class="g">${items.map((x,i)=>`<button data-i="${i}">${x.ic?`<img src="assets/ui/${x.ic}.png" alt="">`:''}<span>${x.nm}</span><i>${x.t==='c'?L(T.g_card):L(T.g_bless)}</i></button>`).join('')}</div></div>`;
 document.body.append(o);
 o.addEventListener('click',e=>{const b=e.target.closest('[data-i]');if(!b)return;const x=items[+b.dataset.i];U.buy(x.t,x.k);o.remove();done(x)});
}
