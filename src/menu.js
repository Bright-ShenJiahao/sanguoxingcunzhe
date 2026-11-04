import {WEAPONS,PASSIVES,POOL,PASS_KEYS,WIC,PIC,fixDeck,DECKN,KIND,KIND_ID} from './run.js?v=11042010';
// 带 data-i18n / data-i18n-title / data-i18n-aria / data-i18n-ph 的元素统一在这里翻译
const applyI18n=el=>{el.querySelectorAll('[data-i18n]').forEach(e=>{e.textContent=tr(e.dataset.i18n)});el.querySelectorAll('[data-i18n-title]').forEach(e=>{e.title=tr(e.dataset.i18nTitle)});el.querySelectorAll('[data-i18n-aria]').forEach(e=>e.setAttribute('aria-label',tr(e.dataset.i18nAria)));if(el.dataset?.i18nAria)el.setAttribute('aria-label',tr(el.dataset.i18nAria))};
import {t,t as tr,getLanguage,setLanguage,onLanguageChange} from './i18n.js?v=11042010';
// 主界面：独立绘制演示场景；备战（角色/装备/商店）→ 选关卡 → 出发。
document.documentElement.classList.add('menu-loading');
const style=document.createElement('style');
style.textContent=`
.menu-loading .wrap{visibility:hidden}
body{--fg:#edf4fa;--muted:#b2c1d0;--line:#566879;background:#101921;color:#edf4fa}
.menu-open{overflow:hidden}
.menu-open #st{position:fixed;inset:0;width:100%;height:100%;border:0;border-radius:0;aspect-ratio:auto}
.menu-open #cv{object-fit:cover}
.menu-open #st>:not(#cv),.menu-open .wrap>.sw{display:none!important}
#main-menu{position:fixed;inset:0;z-index:10;background:linear-gradient(100deg,#07101b80,#050c1670);display:flex;align-items:center;justify-content:center;gap:clamp(40px,9vw,150px);padding:32px;box-sizing:border-box;overflow:auto;color:#f5f7fb}
#main-menu[hidden]{display:none}
.menu-profile{width:300px;flex-shrink:0;text-align:center}
.menu-eyebrow{font-size:11px;letter-spacing:.45em;color:#c9d8e8;margin-bottom:12px}
.menu-title{font-family:serif;font-size:clamp(28px,4.2vw,46px);line-height:1.15;letter-spacing:.06em;color:#f7d987;text-shadow:0 3px #513c1c,0 6px 20px #000;margin:0 0 28px;white-space:nowrap}.menu-run{display:block;color:#ff8a5a;font-size:.82em;letter-spacing:.1em}
.menu-language{display:flex;align-items:center;gap:8px}.menu-language select{font:inherit;font-size:14px;color:#eaf2ff;background:#0c225a;border:1px solid #8fbbef88;border-radius:6px;padding:5px 8px}
.menu-card{width:218px;height:188px;margin:auto;border:2px solid #77baff;border-radius:10px;background:radial-gradient(ellipse at 50% 95%,#37578b77,transparent 65%),#101e38bf;box-shadow:0 0 0 3px #0d1938aa,0 14px 38px #0005;display:grid;place-items:center}
.menu-card canvas{width:200px;height:160px;image-rendering:pixelated}
.menu-character{margin:15px 0 18px;font-size:15px;font-weight:600;letter-spacing:.08em}
.menu-name{display:block;text-align:left;width:222px;margin:auto;font-size:12px;color:#c0cde0}
.menu-name input{box-sizing:border-box;width:100%;margin-top:7px;padding:12px 14px;border:1px solid #729bd07a;border-radius:6px;background:#0c172ac9;color:#fff;font:16px system-ui;outline:none;user-select:text}
.menu-name input:focus{border-color:#a5d4ff;box-shadow:0 0 0 3px #73aaf526}
.menu-panel{box-sizing:border-box;width:390px;padding:25px;border:2px solid #b6d5ff;border-radius:12px;background:linear-gradient(145deg,#254f9cdd,#142858d9);box-shadow:0 0 0 3px #101c35aa,0 18px 60px #0005}
.menu-panel button{cursor:pointer;font:inherit;color:inherit}
.menu-start{display:flex;align-items:center;justify-content:space-between;width:100%;text-align:left;padding:17px 18px;margin-bottom:22px;border:1px solid #a2cbff88;border-radius:7px;background:#72a9f62b;font-size:23px!important;font-weight:700!important}
.menu-start:hover{background:#8bbcff40}
.menu-start.off{opacity:.45}
.menu-name input.need{outline:2px solid #ff6b6b;animation:nshake .35s}
@keyframes nshake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.menu-start small{display:block;font-size:12px;font-weight:400;letter-spacing:.04em;color:#d4e4fc;margin-top:5px}
.menu-section{font-size:15px;letter-spacing:.15em;margin:0 0 13px}
#main-menu #cs{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#main-menu #cs button{font-size:13px;padding:12px 8px;border:1px solid #83abe354;border-radius:5px;background:#0c225a55;text-align:left;color:#ecf5ff}
#main-menu #cs button[aria-pressed=true]{background:#77a9f044;border-color:#c1e0ff;box-shadow:inset 3px 0 #e2cb87}
.menu-note{color:#c3d3ef;font-size:12px;line-height:1.8;margin-top:20px;border-top:1px solid #9ebfe432;padding-top:16px}
#prep{position:fixed;inset:0;z-index:11;display:flex;align-items:center;justify-content:center;padding:58px 20px 16px;box-sizing:border-box;background:#050c1688;color:#f2f6ff;font-family:"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif}
#prep[hidden],#prep [hidden]{display:none!important}
.pp-box{width:min(760px,100%);height:min(600px,100%);max-height:100%;display:flex;flex-direction:column;border:2px solid #b6d5ff;border-radius:12px;background:linear-gradient(145deg,#254f9cee,#142858ee);box-shadow:0 0 0 3px #101c35aa,0 18px 60px #0007}
.pp-step{display:flex;flex-direction:column;flex:1;min-height:0;padding:20px 22px}
.pp-head{display:flex;align-items:center;gap:22px;flex-wrap:wrap;margin-bottom:16px}.pp-head h2{margin:0;font-size:22px;color:#f7d987;letter-spacing:.1em}
.pp-tabs{display:flex;gap:6px}.pp-tabs button,.pp-foot button{cursor:pointer;font:inherit;color:#eaf2ff;border:1px solid #8fbbef88;border-radius:6px;background:#0c225a66;padding:8px 18px}
.pp-tabs button{white-space:nowrap;flex:none}
@media (max-width:640px){.pp-head{gap:8px}.pp-tabs{width:100%;display:grid!important;grid-template-columns:repeat(5,1fr);gap:4px;overflow:visible}.pp-tabs button{padding:6px 2px;font-size:12px;line-height:1.15;min-width:0;white-space:normal;word-break:keep-all;overflow-wrap:anywhere}#prep{padding:58px 10px 10px}}
.pp-tabs button[aria-selected=true]{background:#77a9f055;border-color:#d8e8ff;color:#fff;box-shadow:inset 0 -3px #e2cb87}
.pp-body{flex:1;min-height:0;overflow:auto}.pp-pane[data-t=role]{display:flex;gap:18px;flex-wrap:wrap}
.pp-roles{flex:1 1 380px;min-width:0}
#prep #cs{display:grid;grid-template-columns:repeat(auto-fill,minmax(82px,1fr));gap:8px}
#prep #cs button{cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border:1px solid #83abe354;border-radius:8px;background:#0c225a66;color:#ecf5ff;font:12px inherit}
#prep #cs button img{height:44px;image-rendering:pixelated}
#prep #cs{grid-template-columns:1fr 1fr}#prep #cs button.big img{height:84px}#prep #cs button.big{padding:14px 6px;font-size:15px}
#prep .dk h4{margin:6px 0 6px;color:#f6db94;font-size:14px}#prep .dk h4 small{color:#9fb6d8;font-weight:400;margin-left:6px}#prep .dk .g{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}#prep .ft{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:0 0 8px}#prep .ft button{padding:3px 10px;border-radius:12px;border:1px solid #8fbbef66;background:#0b153080;color:#cfe0f5;font-size:12px;cursor:pointer}#prep .ft button.on{background:#e8c56a;color:#1b2440;border-color:#e8c56a;font-weight:700}#prep .ft i{color:#8fa6c8;font-style:normal}#prep .ft label{margin-left:auto;font-size:12px;color:#cfe0f5;display:flex;align-items:center;gap:4px;cursor:pointer}.rgh{grid-column:1/-1;font-size:12px;font-weight:700;color:#e8c56a;letter-spacing:.1em;margin-top:4px;border-bottom:1px solid #e8c56a44;padding-bottom:2px}
#prep .dk button{cursor:pointer;padding:6px 10px;border:1px solid #83abe354;border-radius:6px;background:#0c225a66;color:#ecf5ff;font:inherit;font-size:13px}#prep .dk button[aria-pressed=true]{background:#77a9f055;border-color:#f0dc9c;box-shadow:0 0 0 1px #e2cb87}
#prep .dk .rg{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px}#prep .dk button.rc{display:flex;flex-direction:column;gap:3px;text-align:left;padding:10px 12px;border-radius:10px}#prep .dk .rc b{font-size:15px;color:#f6db94}#prep .dk .rc span{font-size:12px;color:#c9d8f0}#prep .dk .rc i{font-size:11px;color:#9fb6d8;font-style:normal}
#prep .dk button.ic{display:flex;flex-direction:column;align-items:center;gap:4px;width:84px;padding:8px 4px 6px;border-radius:10px;background:linear-gradient(180deg,#16306e99,#0a1c4c99)}
#prep .dk button.ic img{width:48px;height:48px;object-fit:contain;image-rendering:pixelated;padding:4px;border-radius:8px;background:radial-gradient(circle,#2c4f9a 0%,#0d2257 75%);box-shadow:inset 0 0 0 1px #7fa6e44d}
#prep .dk button.ic[aria-pressed=false]{opacity:.55;filter:saturate(.6)}#prep .dk button.ic.lkd{opacity:.4;filter:grayscale(1)}#prep .dk button.ic.lkd .kd{white-space:normal;line-height:1.15;font-size:9px}#prep .dk button.ic span{font-size:12px}#prep .dk button.ic .kd{font-style:normal;font-size:10px;color:#9fb6d8}
#prep .dk .rc b img{width:26px;height:26px;vertical-align:-7px;object-fit:contain;image-rendering:pixelated;border-radius:6px;background:radial-gradient(circle,#2c4f9a,#0d2257);padding:2px;margin-right:2px}
#prep .dk button.rc{position:relative}#prep .dk button.rc.ban{opacity:.5;border-color:#ff7a7a;filter:grayscale(.7)}#prep .dk button.rc em{position:absolute;right:8px;top:6px;font-style:normal;font-size:11px;color:#ffb0b0;border:1px solid #ff8a8a;border-radius:4px;padding:0 4px}
#prep .bmode{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 10px}#prep .bmode button{display:flex;flex-direction:column;align-items:center;padding:6px 14px;border:1px solid #83abe354;border-radius:8px;background:#0c225a66;color:#ffe9a8;font:inherit;font-size:13px;cursor:pointer}#prep .bmode button small{font-size:10px;color:#9fb6d8}#prep .bmode button[aria-pressed=true]{background:#77a9f055;border-color:#f0dc9c;box-shadow:0 0 0 1px #e2cb87}#prep .bmode span{font-size:12px;color:#9fb6d8}@media(max-width:700px){#prep .bmode{flex-wrap:nowrap;gap:4px;justify-content:center}#prep .bmode span{display:none}#prep .bmode button{padding:5px 10px;font-size:12px;white-space:nowrap}}@media(max-width:560px){#prep .pp-foot{flex-wrap:wrap}#prep .pp-foot .pp-mid{order:-1;flex:1 1 100%}.pp-foot .pp-back{padding:8px 10px}.pp-foot .pp-next,.pp-foot .pp-go{padding:10px 12px}#prep .bmode button small{display:none}}
#prep .dk .rc em.lk{color:#ffe08a;border-color:#e2cb87}#prep .bmenu{position:absolute;right:6px;bottom:6px;display:flex;gap:4px;z-index:2}#prep .bmenu button{padding:3px 7px;white-space:nowrap;box-shadow:0 2px 6px #0008;border:1px solid #f0dc9c;border-radius:6px;background:#0b1d4a;color:#ffe9a8;font:inherit;font-size:12px;cursor:pointer}#prep .bmenu button[disabled]{background:#26304a;color:#8a93a8;border-color:#5a6480;cursor:default}#prep .bmenu small{font-size:10px;color:#cfe0ff}
#prep .rc{position:relative;display:flex;flex-direction:column;gap:3px;text-align:left;padding:10px 12px;border:1px solid #83abe354;border-radius:10px;background:#0c225a66;color:#ecf5ff}#prep .rc[aria-pressed=true]{background:#77a9f055;border-color:#f0dc9c}
#prep .rc b{font-size:15px;color:#f6db94}#prep .rc span{font-size:12px;color:#c9d8f0}#prep .rc i{font-size:11px;color:#8fa6c8;font-style:normal}
#prep .rc em{position:absolute;right:8px;top:7px;font-style:normal;font-size:11px;padding:1px 6px;border-radius:4px;border:1px solid #9fb6d8;color:#cfe0ff;cursor:pointer}#prep .rc em.lk.on{color:#ffe08a;border-color:#e2cb87;background:#e2cb8722}#prep .rc[aria-pressed=true]{background:linear-gradient(145deg,#e8b84ecc,#a8741ecc);border:1px solid #ffe08a;box-shadow:0 0 12px #f0c85077}#prep .rc[aria-pressed=true] b img{box-shadow:0 0 0 2px #f0c850,0 0 6px #f0c850aa}#prep .rc[aria-pressed=true] b{color:#fff6d8}#prep .rc[aria-pressed=true] span{color:#fff3d0}#prep .rc[aria-pressed=true] i{color:#f6e2b0}#prep .rc[aria-pressed=true] em{color:#fff;border-color:#fff3c0;background:#0003}#prep .rc.ban{border-color:#8a2a2a}#prep .rc.ban b img{filter:grayscale(1) brightness(.55);box-shadow:0 0 0 2px #8a2a2a}#prep .rc.ban b{color:#8a8f9e}#prep .rc.ban span,#prep .rc.ban i{color:#6f7688}#prep .rc.ban em{cursor:default;color:#ffb0b0;border-color:#ff8a8a}
.cfm{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:#0008}.cfm .cb{width:min(320px,88vw);padding:18px;border:2px solid #b6d5ff;border-radius:12px;background:linear-gradient(145deg,#254f9c,#142858);color:#eef4ff;text-align:center}.cfm .cb.wide{width:min(560px,92vw)}.cfm b{color:#f6db94;font-size:16px}.cfm p{font-size:14px;margin:10px 0 14px}.cfm button{margin:4px;padding:7px 16px;border:1px solid #8fbbef;border-radius:6px;background:#0c225a;color:#fff;font:inherit;cursor:pointer}.cfm .yes{background:linear-gradient(180deg,#f3d27a,#c99a3a);color:#2a1a08;border-color:#ffe9a8}
.cfm .pk{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:6px;max-height:50vh;overflow:auto;margin:12px 0}.cfm .pk button{display:flex;align-items:center;gap:4px;margin:0;font-size:13px}.cfm .pk img{width:22px;height:22px;image-rendering:pixelated}
#prep .shop{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin-bottom:12px}#prep .si{display:flex;flex-direction:column;gap:6px;padding:14px;border:1px solid #83abe354;border-radius:10px;background:#0c225a66}#prep .si b{color:#f6db94;font-size:16px}#prep .si span{font-size:12px;color:#c9d8f0}#prep .si button{align-self:flex-start;padding:6px 14px;border:1px solid #f0dc9c;border-radius:6px;background:#0b1d4a;color:#ffe9a8;font:inherit;cursor:pointer}#prep .si button[disabled]{opacity:.45;cursor:default}
@media(max-width:560px){#prep .dk .rg{grid-template-columns:1fr!important;gap:6px}#prep .rc{display:grid;grid-template-columns:96px 1fr;grid-template-rows:auto auto;column-gap:10px;row-gap:1px;padding:8px 52px 8px 10px;align-items:center}#prep .rc b{grid-row:1/3;font-size:14px}#prep .rc span{grid-column:2}#prep .rc i{grid-column:2}}
#prep .dk .warn{color:#ff9a8a;font-size:12px;min-height:16px}
#prep .lockrow{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:10px;color:#9fb6d8;font-size:12px}#prep .lockrow span{width:100%}
#prep .lockrow button{width:46px;padding:4px;border:1px solid #83abe333;border-radius:6px;background:#0c225a44;opacity:.45;cursor:not-allowed;color:#ccd}#prep .lockrow img{height:30px;filter:grayscale(1) brightness(.6);image-rendering:pixelated}#prep .lockrow button span{font-size:10px}
#prep #cs button[aria-pressed=true]{background:#77a9f044;border-color:#f0dc9c;box-shadow:0 0 0 2px #e2cb8788}
.pp-info{flex:0 0 200px;text-align:center;border:1px solid #9ebfe444;border-radius:10px;padding:14px;background:#0a183a66}
.pp-info canvas{width:120px;height:120px;image-rendering:pixelated}.pp-info h3{margin:6px 0 10px;color:#f7d987}.pp-info p{margin:6px 0;color:#c9d8f0;font-size:13px}.pp-info p.b{color:#e9dcb8;font-size:12px;line-height:1.5;text-align:left}
.pp-soon{display:grid;place-items:center;height:280px;color:#9fb6d8;font-size:16px;letter-spacing:.15em;border:1px dashed #9ebfe455;border-radius:10px}
.pp-stages{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;align-content:start}
.pp-stage{cursor:pointer;text-align:left;padding:18px;border:1px solid #8fbbef88;border-radius:10px;background:linear-gradient(160deg,#2f6d3aaa,#123222cc);color:#fff;font:inherit;min-height:110px}
.pp-stage b{display:block;font-size:19px;margin-bottom:8px;color:#f7d987}.pp-stage span{font-size:13px;color:#d4e4d8}
.pp-stage[aria-pressed=true]{box-shadow:0 0 0 2px #e2cb87}.pp-stage:disabled{cursor:default;background:#1a2440aa;filter:grayscale(1);opacity:.6}
.pp-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:16px}.pp-mid{flex:1;min-width:0}.pp-mid .bmode{margin:0}.pp-foot .pp-next,.pp-foot .pp-go{background:linear-gradient(180deg,#f3d27a,#c99a3a);border-color:#ffe9a8;color:#2a1a06;font-weight:700;padding:10px 26px;box-shadow:0 2px 0 #7a5a1a,0 0 10px #f0c86a55}
@media(max-width:560px){.pp-info{flex:1 1 100%}.pp-step{padding:14px}}
button:focus-visible,summary:focus-visible{outline:2px solid #e9d398;outline-offset:4px}
@media(max-width:700px){#main-menu{gap:25px;padding:20px}.menu-profile{width:240px}.menu-title{font-size:34px}.menu-panel{width:310px;padding:18px}}
@media(max-width:560px){#main-menu{flex-direction:column;justify-content:flex-start;gap:24px;padding:28px 18px}.menu-profile{width:100%}.menu-title{font-size:30px;margin-bottom:14px}.menu-card{height:140px;width:200px}.menu-card canvas{height:136px;width:170px}.menu-character{margin:10px 0}.menu-panel{width:min(100%,360px)}.menu-eyebrow{margin-bottom:8px}.menu-name input{padding:9px 12px}}
`;
document.head.append(style);

export function createMenu(game){
 let visible=true;
 const root=document.createElement('main');root.id='main-menu';root.dataset.i18nAria='ui.menu.aria';
 root.innerHTML=`<section class="menu-profile" data-i18n-aria="ui.menu.profile">
  <div class="menu-eyebrow">Isekai Survivors: RUN!</div><h1 class="menu-title"></h1>
  <div class="menu-card"><canvas width="200" height="160" data-i18n-aria="ui.menu.idle"></canvas></div>
  <div class="menu-character" hidden></div><label class="menu-name"><input maxlength="8" autocomplete="nickname"></label>
 </section><nav class="menu-panel" data-i18n-aria="ui.menu.nav">
  <button class="menu-start" type="button"><span></span><span aria-hidden="true">→</span></button>
  <label class="menu-language"><span></span> <select aria-label="Language"><option value="zh">中文</option><option value="en">English</option><option value="ja">日本語</option></select></label>
  <div class="menu-note"></div>
 </nav>`;
 document.body.append(root);document.body.classList.remove('loading');{const bt=document.getElementById('boot');if(bt){const go=()=>{if(performance.now()<(window.BOOT_MIN??2300)){setTimeout(go,100);return}bt.style.opacity='0';setTimeout(()=>bt.remove(),500)};go()}}document.body.classList.add('menu-open');
 const cs=document.getElementById('cs');
 const input=root.querySelector('input'),caption=root.querySelector('.menu-character');
 const languageSelect=root.querySelector('.menu-language select');
 languageSelect.addEventListener('change',()=>setLanguage(languageSelect.value));
 const localizeMenu=()=>{
  {const T=t('game.title'),m=T.match(/^(.*?)(\s*[:：]\s*)(.+)$/),h=root.querySelector('.menu-title');h.textContent='';if(m){h.append(m[1]);const s=document.createElement('span');s.className='menu-run';s.textContent=m[3];h.append(s)}else h.textContent=T;root.querySelector('.menu-eyebrow').hidden=getLanguage()==='en';h.style.fontSize='';requestAnimationFrame(()=>{const W=Math.min(h.parentElement.clientWidth,innerWidth*.92);let f=parseFloat(getComputedStyle(h).fontSize);while(h.scrollWidth>W+1&&f>18){f-=1;h.style.fontSize=f+'px'}})}
  root.querySelector('.menu-start span').textContent=t('menu.start');
  root.querySelector('.menu-language span').textContent=t('language.label');
  root.querySelector('.menu-language select').setAttribute('aria-label',t('language.label'));
  root.querySelector('.menu-name').setAttribute('aria-label',t('menu.name'));
  input.placeholder=t(input.classList.contains('need')?'menu.name.required':'menu.name.placeholder');
  root.querySelector('.menu-note').replaceChildren(document.createTextNode(t('menu.instructions')),document.createElement('br'),document.createTextNode(t('menu.mobile')));
  languageSelect.value=getLanguage();applyI18n(root);
 };
 onLanguageChange(localizeMenu);localizeMenu();
 try{input.value=localStorage.getItem('sanguo.playerName')||''}catch{/* 隐私模式仍可游玩。 */}
 const syncSt=()=>root.querySelector('.menu-start')?.classList.toggle('off',!input.value.trim());input.addEventListener('input',()=>{try{localStorage.setItem('sanguo.playerName',input.value)}catch{}syncSt();input.classList.remove('need')});setTimeout(syncSt,0);
 // 阻断名字输入与菜单点击进入原来的全局移动按键处理。
 root.addEventListener('keydown',e=>e.stopPropagation());root.addEventListener('keyup',e=>e.stopPropagation());
 const preview=root.querySelector('canvas').getContext('2d');
 const KINDS=['goblin','gob_blade','gob_archer','gob_shield','goblin','gob_blade','goblin','gob_shield'];
 const actors=KINDS.map((k,i)=>({k,sx:(i-3.5)*.2,sy:((i*5)%3-1)*.2,ph:i*1.7}));
 let starting=false;
 // ---------- 备战 → 选关卡 → 出发 ----------
 const prep=document.createElement('section');prep.id='prep';prep.hidden=true;prep.dataset.i18nAria='ui.prep.aria';
 prep.innerHTML=`<div class="pp-box">
  <div class="pp-step" data-s="prep"><div class="pp-head"><h2 data-i18n="ui.prep.title"></h2><div class="pp-tabs" role="tablist"><button data-t="role" aria-selected="true" data-i18n="ui.tab.role"></button><button data-t="gear" data-i18n="ui.tab.gear"></button><button data-t="rune" data-i18n="ui.tab.rune"></button><button data-t="up" data-i18n="ui.tab.up"></button><button data-t="shop" data-i18n="ui.tab.shop"></button></div></div>
   <div class="pp-body"><div class="pp-pane" data-t="role"><div class="pp-roles"></div><div class="pp-info"><canvas width="120" height="120"></canvas><h3></h3><p class="b"></p><p class="w"></p><p class="t"></p></div></div>
    <div class="pp-pane" data-t="gear" hidden><div class="dk dkw"></div></div><div class="pp-pane" data-t="rune" hidden><div class="dk dkr"></div></div><div class="pp-pane" data-t="up" hidden><div class="upw"></div></div>
    <div class="pp-pane" data-t="shop" hidden><div class="pp-soon" data-i18n="ui.shop.soonTop"></div></div></div>
   <div class="pp-foot"><button class="pp-back" data-i18n="ui.back"></button><button class="pp-next" data-i18n="ui.next"></button></div></div>
  <div class="pp-step" data-s="stage" hidden><div class="pp-head"><h2 data-i18n="ui.stage.title"></h2></div>
   <div class="pp-body pp-stages"><button class="pp-stage" aria-pressed="true"><b data-i18n="ui.stage.1"></b><span data-i18n="ui.stage.1d"></span></button><button class="pp-stage" disabled><b data-i18n="ui.stage.2"></b><span data-i18n="ui.locked"></span></button><button class="pp-stage" disabled><b data-i18n="ui.dex.unknown"></b><span data-i18n="ui.locked"></span></button></div>
   <div class="pp-foot"><button class="pp-back" data-i18n="ui.back"></button><button class="pp-go" data-i18n="ui.go"></button></div></div></div>`;
 document.body.append(prep);applyI18n(prep);
 prep.addEventListener('keydown',e=>e.stopPropagation());
 // ---------- 键盘操作：方向键在按钮间移动，回车/空格确认，Esc 返回 ----------
 function navKeys(e){if(document.activeElement?.tagName==='SELECT')return;const box=!prep.hidden?prep:!root.hidden?root:document.getElementById('lvup')?.hidden===false?document.getElementById('lvup'):null;if(!box)return;if(/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName)&&e.key!=='Escape'&&!/^Arrow(Up|Down)$/.test(e.key))return;   // 打字时 WASD、左右键留给输入框
 
  const K={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]}[e.key];
  if(e.key==='Escape'&&box===prep){const b=[...prep.querySelectorAll('.pp-back')].find(x=>x.offsetParent);if(b){b.click();e.preventDefault()}return}
  const bsAll=[...box.querySelectorAll('button:not([disabled])')].filter(b=>b.offsetParent);
  if((e.key==='Enter'||e.key===' ')&&!bsAll.includes(document.activeElement)&&document.activeElement?.tagName!=='INPUT'){const pr=[...box.querySelectorAll('.menu-start,.pp-go,.pp-next,button.card')].find(b=>b.offsetParent);if(pr){e.preventDefault();pr.click();setTimeout(()=>{const nb=[...document.querySelectorAll('#prep .pp-step:not([hidden]) .pp-next,#prep .pp-step:not([hidden]) .pp-go')].find(b=>b.offsetParent);nb?.focus()},50)}return}
  if(!K)return;if(document.activeElement?.tagName==='INPUT'&&K[0])return;
  const bs=[...box.querySelectorAll('button:not([disabled])')].filter(b=>b.offsetParent);if(!bs.length)return;e.preventDefault();
  const cur=bs.includes(document.activeElement)?document.activeElement:null;if(!cur){bs[0].focus();return}
  const r=cur.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let best=null,bd=1e9;
  for(const b of bs){if(b===cur)continue;const q=b.getBoundingClientRect(),dx=q.left+q.width/2-cx,dy=q.top+q.height/2-cy,along=dx*K[0]+dy*K[1];if(along<=4)continue;const side=Math.abs(dx*K[1]-dy*K[0]);const d=along+side*2.5;if(d<bd){bd=d;best=b}}
  if(best)best.focus()}
 addEventListener('keydown',navKeys,true);
 const fs=document.createElement('style');fs.textContent='#prep button:focus-visible,#main-menu button:focus-visible,#lvup button:focus-visible{outline:2px solid #f6db94;outline-offset:2px}';document.head.append(fs);prep.addEventListener('keyup',e=>e.stopPropagation());
 const roles=prep.querySelector('.pp-roles');roles.append(cs);
 const thumb=b=>{const c=b.dataset.c;return c==='m'?'assets/characters/hero_b/w0.png':c[0]==='m'?`assets/characters/hero_m/r${+c[1]-1}_w0.png`:`assets/characters/heroine/r${c[1]}_w0.png`};
 cs.querySelectorAll('button').forEach(b=>{const im=new Image();im.src=thumb(b);im.alt='';const t=document.createElement('span');const main=b.dataset.c==='m'||b.dataset.c==='f0';
  if(main)t.dataset.i18n=b.dataset.c==='m'?'ui.role.m':'ui.role.f';t.textContent=main?tr(t.dataset.i18n):'🔒';b.textContent='';b.append(im,t);
  if(main)b.classList.add('big');else{b.disabled=true;b.classList.add('lock');b.dataset.i18nTitle='ui.role.locked';b.title=tr('ui.role.locked')}});

 const step=s=>{prep.querySelectorAll('.pp-step').forEach(x=>x.hidden=x.dataset.s!==s);setTimeout(()=>prep.querySelector(`.pp-step[data-s=${s}] .pp-next,.pp-step[data-s=${s}] .pp-go`)?.focus(),30)};
 prep.querySelectorAll('.pp-tabs button').forEach(b=>b.onclick=()=>{prep.querySelectorAll('.pp-tabs button').forEach(x=>x.setAttribute('aria-selected',x===b));prep.querySelectorAll('.pp-pane').forEach(p=>p.hidden=p.dataset.t!==b.dataset.t);if(b.dataset.t==='up')window.META?.renderUp(prep.querySelector('.upw'))});
 prep.addEventListener('click',e=>{const t=e.target.closest('[data-fa],[data-fb]');if(!t)return;const FT=window.__FT;if(t.dataset.fa){FT.a=t.dataset.fa;FT.b=''}else FT.b=FT.b===t.dataset.fb?'':t.dataset.fb;drawDeck()});prep.addEventListener('change',e=>{if(e.target.matches('[data-fo]')){window.__FT.own=e.target.checked;drawDeck()}});
 prep.querySelector('[data-s=prep] .pp-back').onclick=()=>{prep.hidden=true;root.hidden=false;root.querySelector('.menu-start').focus()};
 // ---------- 卡组：5 武器 + 5 法术（必须选满），锁定 2 个被动 ----------
 const dk=prep.querySelector('.dkw'),dkr=prep.querySelector('.dkr');let deck;try{deck=JSON.parse(localStorage.getItem('deck')||'null')}catch(e){}
 deck=fixDeck(deck);
 const LIM={c:DECKN,lock:4};const BANL=()=>8,PR={lock:200,ban:150,free:50};deck.ban=deck.ban||[];
 function save_(){try{localStorage.setItem('deck',JSON.stringify(deck))}catch(_){}}
 // 页内确认框（viewer 不支持 confirm）
 function ask(title,body,ok,cb){prep.querySelector('.cfm')?.remove();const d=document.createElement('div');d.className='cfm';d.innerHTML=`<div class="cb"><b>${title}</b><p>${body}</p><div><button class="no">${tr('ui.cancel')}</button><button class="yes">${ok}</button></div></div>`;prep.append(d);d.querySelector('.no').onclick=()=>d.remove();d.querySelector('.yes').onclick=()=>{d.remove();cb()}}
 const FT=window.__FT||(window.__FT={a:'all',b:'',own:false});
 const SUBS={phys:['mel','rng'],spell:['ele','holy','dark']};
 const fOK=k=>{const K=KIND_ID[k]||'';if(FT.own&&!window.UNL?.okC(k))return false;if(FT.a==='phys'&&!SUBS.phys.includes(K))return false;if(FT.a==='spell'&&!SUBS.spell.includes(K))return false;if(FT.b&&K!==FT.b)return false;return true};
 const PG=[['atk',['atk','arc','crit','critd','cd','amt','area','pspd','berserk','exec','hunt','knock','boom','gamble']],['def',['hp','armor','regen','dodge','vamp','svamp','tough','rev']],['util',['spd','mag','luck','wis','greed','dur','curse']]];
 function drawDeck(){const fbar=()=>`<div class="ft">${['all','phys','spell'].map(a=>`<button data-fa="${a}" class="${FT.a===a?'on':''}">${tr('ui.f.'+a)}</button>`).join('')}${SUBS[FT.a]?'<i>｜</i>'+SUBS[FT.a].map(b=>`<button data-fb="${b}" class="${FT.b===b?'on':''}">${tr('ui.f.'+b)}</button>`).join(''):''}<label><input type="checkbox" data-fo ${FT.own?'checked':''}> ${tr('ui.f.own')}</label></div>`;
 const row=(key,list,names,title,tip)=>`<h4>${title}<small>${deck[key].length}/${LIM[key]} ${tip}</small></h4>${fbar()}<div class="g">${list.filter(fOK).map(k=>`<button class="ic${key==='c'&&!window.UNL?.okC(k)?' lkd':''}" data-k="${key}" data-v="${k}" aria-pressed="${deck[key].includes(k)}" title="${key==='c'&&!window.UNL?.okC(k)?tr('ui.lockedTip',{cond:window.UNL.condC(k),p:window.UNL.BUY_C}):''}">${WIC[k]?`<img src="assets/ui/${WIC[k]}.png?v=11042010" alt="">`:''}<span>${names(k)}</span><i class="kd">${key==='c'&&!window.UNL?.okC(k)?'🔒 '+window.UNL.condC(k):(KIND[k]||'')}</i></button>`).join('')}</div>`;
  dk.innerHTML=row('c',POOL.c,k=>WEAPONS[k].name,tr('ui.tab.gear'),tr('ui.deck.tip',{n:DECKN}))+'<div class="warn"></div>';
  const U=window.UNL,okp=k=>!U||U.okP(k),ORD=[],HD={};const seen=new Set();for(const [g,ks] of PG){const L=[...ks,...(g==='util'?PASS_KEYS.filter(k=>!PG.some(x=>x[1].includes(k))):[])].filter(k=>PASSIVES[k]&&okp(k)&&!deck.ban.includes(k)&&!seen.has(k));L.sort((a,b)=>deck.lock.includes(b)-deck.lock.includes(a));if(L.length){HD[L[0]]=g;L.forEach(k=>{seen.add(k);ORD.push(k)})}}
  const BN=deck.ban.filter(k=>okp(k));if(BN.length){HD[BN[0]]='banned';ORD.push(...BN)}const UL=PASS_KEYS.filter(k=>!okp(k)).sort((a,b)=>(U?.PU||[]).indexOf(a)-(U?.PU||[]).indexOf(b));if(UL.length){HD[UL[0]]='locked';ORD.push(...UL)}
  dkr.innerHTML=`<h4>${tr('ui.tab.rune')}<small>${tr('ui.rune.sub',{a:deck.lock.length,b:deck.ban.length})}</small></h4><div class="rg">${ORD.map(k=>(HD[k]?`<div class="rgh">${tr('ui.grp.'+HD[k])}</div>`:'')+(k=>{const B=deck.ban.includes(k),Lk=deck.lock.includes(k);const UL=!window.UNL?.okP(k);if(UL)return `<div class="rc ban" style="opacity:.45;filter:grayscale(1)"><em class="bp" data-v="${k}" style="cursor:pointer">🔒 🪙${window.UNL.BUY_P}</em><b>${PIC[k]?`<img src="assets/ui/${PIC[k]}.png?v=11042010" alt="">`:'✦'} ${PASSIVES[k].name}</b><span>${window.UNL.condP(k)}</span><i>${tr('ui.rune.max',{n:PASSIVES[k].max})}</i></div>`;
   return `<div class="rc${B?' ban':''}" aria-pressed="${Lk}">${B?'<em>'+tr('ui.rune.banned')+'</em>':`<em class="lk${Lk?' on':''}" data-v="${k}">${Lk?tr('ui.rune.locked'):tr('ui.rune.lock')}</em>`}<b>${PIC[k]?`<img src="assets/ui/${PIC[k]}.png?v=11042010" alt="">`:'✦'} ${PASSIVES[k].name}</b><span>${PASSIVES[k].desc}</span><i>${tr('ui.rune.max',{n:PASSIVES[k].max})}</i></div>`})(k)).join('')}</div>`;
  prep.querySelectorAll('.dk button.ic').forEach(b=>b.onclick=()=>{if(b.classList.contains('lkd')){const v=b.dataset.v,U=window.UNL,nm=WEAPONS[v].name;if((window.META?.gold||0)<U.BUY_C)ask(tr('ui.ask.locked'),tr('ui.ask.cardNeed',{nm,cond:U.condC(v),p:U.BUY_C}),tr('ui.ok'),()=>{});else ask(tr('ui.ask.buyCard'),tr('ui.ask.buyCardBody',{nm,cond:U.condC(v),p:U.BUY_C}),tr('ui.buy'),()=>{if(window.META.spend(U.BUY_C)){U.buy('c',v);drawDeck()}});return}const a=deck[b.dataset.k],v=b.dataset.v,i=a.indexOf(v);if(i>=0)a.splice(i,1);else if(a.length<LIM[b.dataset.k])a.push(v);save_();drawDeck()});
  prep.querySelectorAll('.rc em.bp').forEach(e=>e.onclick=()=>{const v=e.dataset.v,U=window.UNL,nm=PASSIVES[v].name;if((window.META?.gold||0)<U.BUY_P)ask(tr('ui.ask.locked'),tr('ui.ask.blessNeed',{nm,cond:U.condP(v),p:U.BUY_P}),tr('ui.ok'),()=>{});else ask(tr('ui.ask.buyBless'),tr('ui.ask.buyBlessBody',{nm,cond:U.condP(v),p:U.BUY_P}),tr('ui.buy'),()=>{if(window.META.spend(U.BUY_P)){U.buy('p',v);drawDeck()}})});
  prep.querySelectorAll('.rc em.lk').forEach(e=>e.onclick=()=>{const v=e.dataset.v,nm=PASSIVES[v].name;
   if(deck.lock.includes(v))ask(tr('ui.ask.unlock'),tr('ui.ask.unlockBody',{nm}),tr('ui.ask.unlockBtn'),()=>{deck.lock=deck.lock.filter(x=>x!==v);save_();drawDeck()});
   else if(deck.lock.length>=4)ask(tr('ui.ask.full'),tr('ui.ask.fullBody'),tr('ui.ok'),()=>{});
   else if((window.META?.gold||0)<PR.lock)ask(tr('ui.ask.noGold'),tr('ui.ask.noGoldBody',{p:PR.lock}),tr('ui.ok'),()=>{});
   else ask(tr('ui.ask.lock'),tr('ui.ask.lockBody',{p:PR.lock,nm}),tr('ui.ask.lockBtn'),()=>{if(window.META.spend(PR.lock)){deck.lock.push(v);save_();drawDeck()}})})}
 // 商店：封印符 / 解封符 → 买完弹出卡池选择
 function drawShop(){const sp=prep.querySelector('.pp-pane[data-t=shop]');const IMG={ban:'s_ban',free:'s_free'};const it=[['ban',tr('ui.shop.ban'),PR.ban,tr('ui.shop.banD'),deck.ban.length<8&&PASS_KEYS.some(k=>!deck.ban.includes(k)&&!deck.lock.includes(k))],['free',tr('ui.shop.free'),PR.free,tr('ui.shop.freeD'),deck.ban.length>0]];
  sp.innerHTML=`<div class="shop">${it.map(([k,n,p,d,ok])=>`<div class="si"><b><img src="assets/ui/${IMG[k]}.png?v=11042010" alt="" style="width:36px;height:36px;vertical-align:middle;image-rendering:pixelated;margin-right:6px">${n}</b><span>${d}</span><button data-buy="${k}" ${ok&&(window.META?.gold||0)>=p?'':'disabled'}>🪙 ${p}</button></div>`).join('')}</div><div class="pp-soon">${tr('ui.shop.soon')}</div>`;
  sp.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>pick(b.dataset.buy))}
 function pick(kind){const list=kind==='ban'?PASS_KEYS.filter(k=>!deck.ban.includes(k)&&!deck.lock.includes(k)):deck.ban.slice();prep.querySelector('.cfm')?.remove();
  const d=document.createElement('div');d.className='cfm';d.innerHTML=`<div class="cb wide"><b>${kind==='ban'?tr('ui.pick.ban'):tr('ui.pick.free')}（🪙${PR[kind]}）</b><div class="pk">${list.map(k=>`<button data-v="${k}">${PIC[k]?`<img src="assets/ui/${PIC[k]}.png?v=11042010" alt="">`:''}${PASSIVES[k].name}</button>`).join('')}</div><div><button class="no">${tr('ui.cancel')}</button></div></div>`;
  prep.append(d);d.querySelector('.no').onclick=()=>d.remove();d.querySelectorAll('.pk button').forEach(b=>b.onclick=()=>{const v=b.dataset.v;if(!window.META.spend(PR[kind]))return d.remove();if(kind==='ban')deck.ban.push(v);else deck.ban=deck.ban.filter(x=>x!==v);save_();d.remove();drawDeck();drawShop()})}
 drawDeck();drawShop();prep.querySelector('.pp-tabs [data-t=shop]')?.addEventListener('click',drawShop);
 onLanguageChange(()=>{applyI18n(prep);cs.querySelectorAll('span[data-i18n]').forEach(e=>{e.textContent=tr(e.dataset.i18n)});drawDeck();drawShop();if(!prep.querySelector('.pp-pane[data-t=up]').hidden)window.META?.renderUp(prep.querySelector('.upw'))});
 new MutationObserver(()=>document.body.classList.toggle('prep-open',!prep.hidden)).observe(prep,{attributes:true,attributeFilter:['hidden']});
 prep.querySelector('.pp-next').onclick=()=>{if(deck.c.length<Math.min(DECKN,POOL.c.length)){prep.querySelector('.pp-tabs [data-t=gear]').click();prep.querySelectorAll('.dk .warn').forEach(w=>w.textContent=tr('ui.deck.warn',{n:DECKN}));return}try{localStorage.setItem('deck',JSON.stringify(deck))}catch(e){}step('stage')};
 prep.querySelector('[data-s=stage] .pp-back').onclick=()=>step('prep');
 const info=prep.querySelector('.pp-info'),ipv=info.querySelector('canvas').getContext('2d');
 root.querySelector('.menu-start').onclick=()=>{const ni=root.querySelector('.menu-name input');if(!ni.value.trim()){ni.placeholder=t('menu.name.required');ni.classList.remove('need');void ni.offsetWidth;ni.classList.add('need');ni.focus();return}root.hidden=true;prep.hidden=false;step('prep');prep.querySelector('.pp-next').focus()};
 prep.querySelector('.pp-go').onclick=async()=>{
  if(starting)return;starting=true;prep.hidden=true;
  try{await game.ready?.()}catch{/* 加载失败也进入游戏 */}
  starting=false;
  visible=false;root.hidden=true;document.body.classList.remove('menu-open');game.clearInput();game.fit();
  document.getElementById('cv').setAttribute('tabindex','-1');document.getElementById('cv').focus({preventScroll:true});
  game.onStart();
 };
 document.documentElement.classList.remove('menu-loading');
 return {get visible(){return visible},show(){visible=true;root.hidden=false;prep.hidden=true;document.body.classList.add('menu-open');root.querySelector('.menu-start').focus()},draw(now){
  const {c,images,data,enemies}=game,t=now/1000,cv=c.canvas,HD=data.HD,WW=data.WW,WH=data.WH||WW,oy=WH/2-580,ox=WW/2-620;
  // 画布跟窗口一样大，按整数倍（和游戏内同样的像素大小）绘制，视野比游戏内更宽，背景清晰不糊。
  const dpr=Math.min(1.5,window.devicePixelRatio||1),W=Math.round(innerWidth*dpr),H=Math.round(innerHeight*dpr);
  if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}
  const S=Math.max(HD*dpr,W/WW,H/WW),vw=W/S,vh=H/S;
  const mx=ox+620+Math.sin(t/30)*110,my=oy+580+Math.cos(t/37)*95;
  const cx=Math.max(0,Math.min(WW-vw,mx-vw/2)),cy=Math.max(0,Math.min(WH-vh,my-vh/2));
  c.setTransform(S,0,0,S,0,0);c.imageSmoothingEnabled=true;
  game.drawGround(c,cx,cy,vw,vh,0,0,vw,vh);
  const items=game.objects.filter(o=>o.x>cx-80&&o.x<cx+vw+80&&o.y>cy&&o.y<cy+vh+120).map(o=>({y:o.y,draw(){c.imageSmoothingEnabled=true;c.drawImage(images['s_'+o.k],o.x-cx-o.w/2,o.y-cy-o.h,o.w,o.h)}}));
  for(const [i,a] of actors.entries()){
   const wx=mx+a.sx*vw+Math.sin(t/5+a.ph)*55,wy=my+a.sy*vh+Math.cos(t/6+a.ph)*22;
   const face=Math.cos(t/5+a.ph)>=0?1:-1,fr=enemies[a.k].frames['walk'+(Math.floor(t*9+i)%6)],im=images['en_'+a.k+'_walk'+(Math.floor(t*9+i)%6)];
   items.push({y:wy,draw(){c.save();c.translate(Math.round(wx-cx),Math.round(wy-cy));c.scale(face,1);c.imageSmoothingEnabled=false;c.drawImage(im,-fr.anchor[0],-fr.anchor[1],fr.size[0],fr.size[1]);c.restore()}});
  }
  items.sort((a,b)=>a.y-b.y).forEach(item=>item.draw());
  const {image,size,label}=game.character(Math.floor(now/650)%2);
  preview.clearRect(0,0,200,160);preview.imageSmoothingEnabled=false;
  const scale=2.6;preview.imageSmoothingEnabled=false;if(image)preview.drawImage(image,100-size[0]*scale/2,145-size[1]*scale,size[0]*scale,size[1]*scale);
  caption.textContent=label;
  if(!prep.hidden){info.querySelector('h3').textContent=label.split(/\s*·\s*/)[0];{const f=(document.querySelector('#cs button[aria-pressed=true]')?.dataset.c||'m')[0]==='f';info.querySelector('.b').textContent=tr(f?'ui.role.f.b':'ui.role.m.b');info.querySelector('.w').textContent=tr(f?'ui.role.f.w':'ui.role.m.w');info.querySelector('.t').textContent=tr(f?'ui.role.f.t':'ui.role.m.t')}ipv.clearRect(0,0,120,120);ipv.imageSmoothingEnabled=false;if(image){const s2=3.4;ipv.drawImage(image,60-size[0]*s2/2,112-size[1]*s2,size[0]*s2,size[1]*s2)}}
 }};
}
