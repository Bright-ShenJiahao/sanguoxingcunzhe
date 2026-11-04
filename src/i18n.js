// Text keys are stable identifiers; saved game state must never depend on translations.
export const zh={
 'game.title':'异世界幸存者：跑！',
 'language.label':'语言',
 'language.zh':'中文',
 'language.en':'English',
 'language.ja':'日本語',
 'menu.start':'开始游戏',
 'menu.name':'你的名字',
 'menu.name.placeholder':'输入你的名字',
 'menu.name.required':'请先输入名字',
 'menu.instructions':'WASD / 方向键移动 · 靠近敌人自动攻击',
 'menu.mobile':'移动端在地图上拖动即可行走',
 'pause.title':'暂停',
 'pause.resume':'继续游戏',
 'pause.shake.on':'震屏：开',
 'pause.shake.off':'震屏：关',
 'pause.home':'结束本局，回主界面',
 'combat.dodge':'闪避',
 'combat.revive':'复活！',
 'combat.shieldBreak':'圣盾破碎！',
};
export const en={
 'game.title':'Isekai Survivors: RUN!',
 'language.label':'Language',
 'language.zh':'中文',
 'language.en':'English',
 'language.ja':'日本語',
 'menu.start':'Start Game',
 'menu.name':'Your name',
 'menu.name.placeholder':'Enter your name',
 'menu.name.required':'Please enter your name',
 'menu.instructions':'Move with WASD or arrow keys · Attack nearby enemies automatically',
 'menu.mobile':'On mobile, drag on the map to move',
 'pause.title':'Paused',
 'pause.resume':'Resume',
 'pause.shake.on':'Screen shake: On',
 'pause.shake.off':'Screen shake: Off',
 'pause.home':'End run and return to menu',
 'combat.dodge':'Dodge',
 'combat.revive':'Revived!',
 'combat.shieldBreak':'Holy Shield broken!',
};
export const ja={
 'game.title':'異世界サバイバーズ：逃げろ！',
 'language.label':'言語',
 'language.zh':'中文',
 'language.en':'English',
 'language.ja':'日本語',
 'menu.start':'ゲームスタート',
 'menu.name':'プレイヤー名',
 'menu.name.placeholder':'名前を入力',
 'menu.name.required':'名前を入力してください',
 'menu.instructions':'WASD／矢印キーで移動 · 近くの敵を自動攻撃',
 'menu.mobile':'スマホでは画面をドラッグして移動',
 'pause.title':'一時停止',
 'pause.resume':'ゲームに戻る',
 'pause.shake.on':'画面揺れ：オン',
 'pause.shake.off':'画面揺れ：オフ',
 'pause.home':'今回を終了してメニューに戻る',
 'combat.dodge':'回避',
 'combat.revive':'復活！',
 'combat.shieldBreak':'聖盾破壊！',
};

const tables={zh,en,ja};
const supported=language=>Object.hasOwn(tables,language);
function initialLanguage(){
 try{const saved=localStorage.getItem('lang');if(supported(saved))return saved}catch{}
 const detected=(navigator.language||'').toLowerCase();
 return detected.startsWith('ja')?'ja':detected.startsWith('zh')?'zh':'en';
}
let language=initialLanguage();
const listeners=new Set();
export function t(key,values={}){
 const template=tables[language][key]??zh[key]??key;
 return template.replace(/\{([\w]+)\}/g,(match,name)=>Object.hasOwn(values,name)?String(values[name]):match);
}
export function getLanguage(){return language}
export function setLanguage(next){
 if(!supported(next))return false;
 language=next;
 try{localStorage.setItem('lang',next)}catch{}
 document.documentElement.lang=next;
 document.title=t('game.title');
 for(const listener of listeners)listener(next);
 return true;
}
export function onLanguageChange(listener){listeners.add(listener);return ()=>listeners.delete(listener)}

// The document is localised at startup as well as after an explicit selection.
document.documentElement.lang=language;
document.title=t('game.title');
