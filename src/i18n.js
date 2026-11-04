import {zh as zhCards,en as enCards,ja as jaCards} from './i18n_cards.js?v=11042310';
import {zh as zhRun,en as enRun,ja as jaRun} from './i18n_run.js?v=11042310';
import {zh as zhWorld,en as enWorld,ja as jaWorld} from './i18n_world.js?v=11042310';
import {zh as zhUi,en as enUi,ja as jaUi} from './i18n_ui.js?v=11042310';
// Text keys are stable identifiers; saved game state must never depend on translations.
const baseZh={
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
 'pause.music':'音乐',
 'pause.sfx':'音效',
 'tut.1':'拖动屏幕（电脑用 WASD）移动',
 'tut.2':'不用按攻击，靠近敌人会自动攻击',
 'tut.3':'捡起蓝色宝石，经验满了就升级',
 'tut.4':'升级时三选一：选新技能或强化已有技能',
 'tut.5':'别站着不动——一直跑，活下去！',
 'combat.dodge':'闪避',
 'combat.revive':'复活！',
 'combat.shieldBreak':'圣盾破碎！',
};
const baseEn={
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
 'pause.music':'Music',
 'pause.sfx':'SFX',
 'tut.1':'Drag the screen (WASD on PC) to move',
 'tut.2':'No attack button — you attack nearby enemies automatically',
 'tut.3':'Pick up blue gems to level up',
 'tut.4':'On level up, pick 1 of 3: a new skill or an upgrade',
 'tut.5':'Don\'t stand still — keep running and survive!',
 'combat.dodge':'Dodge',
 'combat.revive':'Revived!',
 'combat.shieldBreak':'Holy Shield broken!',
};
const baseJa={
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
 'pause.music':'音楽',
 'pause.sfx':'効果音',
 'tut.1':'画面をドラッグ（PCはWASD）で移動',
 'tut.2':'攻撃ボタンなし：近くの敵を自動で攻撃',
 'tut.3':'青い宝石を拾ってレベルアップ',
 'tut.4':'レベルアップ時は3択：新スキルか強化を選ぶ',
 'tut.5':'立ち止まるな——走り続けて生き残れ！',
 'combat.dodge':'回避',
 'combat.revive':'復活！',
 'combat.shieldBreak':'聖盾破壊！',
};

export const zh={...baseZh,...zhCards,...zhRun,...zhWorld,...zhUi};
export const en={...baseEn,...enCards,...enRun,...enWorld,...enUi};
export const ja={...baseJa,...jaCards,...jaRun,...jaWorld,...jaUi};
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
