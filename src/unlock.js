// 局外解锁：开局 12 张技能卡 + 12 张祝福，其余按成就解锁，或在卡池里花金币直接买。
// 进度存在 localStorage 'unl'：{c:[已解锁卡],p:[已解锁祝福],best:最长存活秒,boss:{名字:次数},runs3:活过3分钟的局数}
export const START_C=['sword','bow','axe','hammer','xbow','fireball','chain','frost','missile','holyorb','hshield','shadow'];
export const START_P=['atk','hp','spd','cd','regen','armor','crit','wis','vamp','dodge','mag','area'];
export const BUY_C=500,BUY_P=300;
const K=(k,n)=>m=>(m.kills[k]||0)>=n,TOT=n=>m=>Object.values(m.kills).reduce((a,b)=>a+b,0)>=n,BEST=s=>(m,u)=>u.best>=s,BOSS=nm=>(m,u)=>(u.boss[nm]||0)>0,RUNS=n=>(m,u)=>u.runs3>=n;
// [卡, 条件说明, 判断]
export const CU=[
 ['flamestep','首次存活 5 分钟',BEST(300)],['thunder','首次存活 10 分钟',BEST(600)],['pouch','首次存活 15 分钟',BEST(900)],['fairy','首次存活满 20 分钟',BEST(1200)],
 ['rapier','击败哥布林大王',BOSS('哥布林大王')],['fist','击败哥布林英雄',BOSS('哥布林英雄')],['wedge','击败哥布林酋长',BOSS('哥布林酋长')],['sigil','击败哥布林圣骑士',BOSS('哥布林圣骑士')],['dcoil','击败哥布林皇帝',BOSS('哥布林皇帝')],
 ['greatsword','累计击杀 1000',TOT(1000)],['mgun','累计击杀 3000',TOT(3000)],['fireel','累计击杀 6000',TOT(6000)],
 ['gsword','击杀 300 盾卫',K('gob_shield',300)],['whip','击杀 500 剑士',K('gob_blade',500)],['hawk','击杀 300 弓手',K('gob_archer',300)],['trap','击杀 200 狼骑',K('gob_wolf',200)],
 ['treant','击杀 100 投石手',K('gob_rock',100)],['keg','击杀 100 自爆兵',K('gob_bomb',100)],['waterel','击杀 200 法师',K('gob_mage',200)],['hwall','击杀 100 幽灵',K('gob_ghost',100)],
 ['vortex','击杀 100 死灵法师',K('gob_necro',100)],['undead','击杀 300 骷髅',K('skeleton',300)],['bmist','击杀 10 只巨魔',K('gob_troll',10)],
 ['wolf','完成 3 局（每局存活 3 分钟以上）',RUNS(3)],['orb','完成 5 局（每局存活 3 分钟以上）',RUNS(5)]];
// 祝福：每完成 1 局（存活 3 分钟以上）按顺序解锁 1 张
export const PU=['luck','dur','pspd','amt','tough','critd','arc','knock','greed','exec','hunt','berserk','svamp','boom','rev','curse','gamble'];
export function load(){let u=null;try{u=JSON.parse(localStorage.getItem('unl')||'null')}catch(_){}u=Object.assign({c:[],p:[],best:0,boss:{},runs3:0},u||{});return u}
export function save(u){try{localStorage.setItem('unl',JSON.stringify(u))}catch(_){}}
export const okC=(k,u=load())=>START_C.includes(k)||u.c.includes(k)||!CU.some(x=>x[0]===k);
export const okP=(k,u=load())=>START_P.includes(k)||u.p.includes(k)||!PU.includes(k);
export const condC=k=>(CU.find(x=>x[0]===k)||[])[1]||'';
export const condP=k=>{const i=PU.indexOf(k);return i<0?'':`完成 ${i+1} 局后解锁`};
// 一局结束：更新进度，返回新解锁的 [{t:'c'|'p',k}]
export function runEnd(meta,t,bossNames){const u=load(),got=[];u.best=Math.max(u.best,t);for(const n of bossNames||[])u.boss[n]=(u.boss[n]||0)+1;if(t>=180)u.runs3++;
 for(const [k,,f] of CU)if(!u.c.includes(k)&&f(meta,u)){u.c.push(k);got.push({t:'c',k})}
 for(let i=0;i<Math.min(u.runs3,PU.length);i++)if(!u.p.includes(PU[i])){u.p.push(PU[i]);got.push({t:'p',k:PU[i]})}
 save(u);return got}
export function buy(t,k){const u=load();(t==='c'?u.c:u.p).push(k);save(u)}
export function unlockAll(all){const u=load();u.c=CU.map(x=>x[0]);u.p=PU.slice();save(u)}
