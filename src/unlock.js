// 局外解锁：开局 12 张技能卡 + 12 张祝福，其余按成就解锁，或在卡池里花金币直接买。
// 进度存在 localStorage 'unl'：{c:[已解锁卡],p:[已解锁祝福],best:最长存活秒,boss:{名字:次数},runs3:活过3分钟的局数}
export const START_C=['sword','bow','axe','hammer','fireball','chain','frost','missile','holyorb','hshield'];   // 开局正好 10 张，全部自动带入
export const START_P=['atk','hp','spd','cd','regen','armor','crit','wis','vamp','dodge','mag','area'];
import {t as tr} from './i18n.js?v=11042410';
export const BUY_C=300,BUY_P=200;
const P=(f,p)=>Object.assign(f,{p}),SUM=m=>Object.values(m.kills||{}).reduce((a,b)=>a+b,0);   // p：成就页显示进度 [当前, 目标]
const K=(k,n)=>P(m=>(m.kills[k]||0)>=n,(m)=>[m.kills?.[k]||0,n]),TOT=n=>P(m=>SUM(m)>=n,m=>[SUM(m),n]),BEST=s=>P((m,u)=>u.best>=s,(m,u)=>[Math.min(s,Math.floor(u.best))/60|0,s/60]),BOSS=nm=>P((m,u)=>(u.boss[nm]||0)>0,(m,u)=>[(u.boss[nm]||0)>0?1:0,1]),RUNS=n=>P((m,u)=>u.runs3>=n,(m,u)=>[Math.min(n,u.runs3),n]);
// [卡, 条件说明, 判断]
export const CU=[
 ['flamestep',()=>tr('ui.unl.best',{m:5}),BEST(300)],['thunder',()=>tr('ui.unl.best',{m:10}),BEST(600)],['pouch',()=>tr('ui.unl.best',{m:15}),BEST(900)],['fairy',()=>tr('ui.unl.best',{m:20}),BEST(1200)],
 ['rapier',()=>tr('ui.unl.boss',{name:tr('run.name.gob_king')}),BOSS('哥布林大王')],['fist',()=>tr('ui.unl.boss',{name:tr('run.name.gob_hero')}),BOSS('哥布林英雄')],['wedge',()=>tr('ui.unl.boss',{name:tr('run.name.gob_chief')}),BOSS('哥布林酋长')],['sigil',()=>tr('ui.unl.boss',{name:tr('run.name.gob_paladin')}),BOSS('哥布林圣骑士')],['dcoil',()=>tr('ui.unl.boss',{name:tr('run.name.gob_emperor')}),BOSS('哥布林皇帝')],
 ['greatsword',()=>tr('ui.unl.total',{n:2000}),TOT(2000)],['mgun',()=>tr('ui.unl.total',{n:3000}),TOT(3000)],['fireel',()=>tr('ui.unl.total',{n:4000}),TOT(4000)],
 ['gsword',()=>tr('ui.unl.kill',{n:250,name:tr('ui.unl.w.shield')}),K('gob_shield',250)],['whip',()=>tr('ui.unl.kill',{n:450,name:tr('ui.unl.w.blade')}),K('gob_blade',450)],['hawk',()=>tr('ui.unl.kill',{n:250,name:tr('ui.unl.w.archer')}),K('gob_archer',250)],['trap',()=>tr('ui.unl.kill',{n:150,name:tr('ui.unl.w.wolf')}),K('gob_wolf',150)],
 ['treant',()=>tr('ui.unl.kill',{n:50,name:tr('ui.enemy.gob_rock')}),K('gob_rock',50)],['keg',()=>tr('ui.unl.kill',{n:150,name:tr('ui.unl.w.bomb')}),K('gob_bomb',150)],['waterel',()=>tr('ui.unl.kill',{n:60,name:tr('ui.unl.w.mage')}),K('gob_mage',60)],['hwall',()=>tr('ui.unl.kill',{n:50,name:tr('ui.unl.w.ghost')}),K('gob_ghost',50)],
 ['vortex',()=>tr('ui.unl.kill',{n:10,name:tr('ui.unl.w.necro')}),K('gob_necro',10)],['undead',()=>tr('ui.unl.kill',{n:100,name:tr('ui.unl.w.skeleton')}),K('skeleton',100)],['bmist',()=>tr('ui.unl.kill',{n:3,name:tr('ui.unl.w.troll')}),K('gob_troll',3)],
 ['xbow',()=>tr('ui.unl.kill',{n:500,name:tr('ui.unl.w.archer')}),K('gob_archer',500)],['shadow',()=>tr('ui.unl.boss2',{name:tr('run.name.gob_king')}),P((m,u)=>(u.boss['哥布林大王']||0)>=2,(m,u)=>[Math.min(2,u.boss['哥布林大王']||0),2])],
 ['wolf',()=>tr('ui.unl.runs',{n:4}),RUNS(4)],['orb',()=>tr('ui.unl.runs',{n:5}),RUNS(5)]];
// 祝福：每完成 1 局（存活 3 分钟以上）按顺序解锁 1 张
export const PU=['tough','amt','dur','pspd','luck','critd','arc','knock','greed','exec','hunt','berserk','svamp','boom','rev','curse','gamble'];
export function load(){let u=null;try{u=JSON.parse(localStorage.getItem('unl')||'null')}catch(_){}u=Object.assign({c:[],p:[],best:0,boss:{},runs3:0},u||{});if(!Array.isArray(u.c))u.c=[];if(!u.boss||typeof u.boss!=='object')u.boss={};if(!Array.isArray(u.p))u.p=[];if(!u.g10&&(u.best>0||u.runs3>0)){u.g10=1;for(const k of ['xbow','shadow'])if(!u.c.includes(k))u.c.push(k);save(u)}return u}   // 老玩家保留原来开局就有的连发弩、暗影魔矢
export function save(u){try{localStorage.setItem('unl',JSON.stringify(u))}catch(_){}}
export const okC=(k,u=load())=>START_C.includes(k)||u.c.includes(k)||!CU.some(x=>x[0]===k);
export const okP=(k,u=load())=>START_P.includes(k)||u.p.includes(k)||!PU.includes(k);
export const condC=k=>(CU.find(x=>x[0]===k)||[])[1]?.()||'';
export const condP=k=>{const i=PU.indexOf(k);return i<0?'':tr('ui.unl.condP',{n:i+1})};
// 一局结束：更新进度，返回新解锁的 [{t:'c'|'p',k}]
export function runEnd(meta,t,bossNames){const u=load(),got=[];u.best=Math.max(u.best,t);for(const n of bossNames||[])u.boss[n]=(u.boss[n]||0)+1;if(t>=180)u.runs3++;
 for(const [k,,f] of CU)if(!u.c.includes(k)&&f(meta,u)){u.c.push(k);(u.newC=u.newC||[]).push(k);got.push({t:'c',k})}
 for(let i=0;i<Math.min(u.runs3,PU.length);i++)if(!u.p.includes(PU[i])){u.p.push(PU[i]);got.push({t:'p',k:PU[i]})}
 save(u);return got}
export function buy(t,k){const u=load();(t==='c'?u.c:u.p).push(k);if(t==='c')(u.newC=u.newC||[]).push(k);save(u)}
export function unlockAll(all){const u=load();u.c=CU.map(x=>x[0]);u.p=PU.slice();save(u)}
