// 汇总平衡测试结果：node tools/balance_report.js <结果目录> <输出目录>
const fs=require('fs'),path=require('path');const [DIR='results',OUT='report']=process.argv.slice(2);fs.mkdirSync(OUT,{recursive:true});
const runs=[];for(const f of fs.readdirSync(DIR,{recursive:true}))if(String(f).endsWith('.json')){try{for(const r of JSON.parse(fs.readFileSync(path.join(DIR,f))))if(!r.err)runs.push({...r,mode:/solo/.test(f)?'solo':'mix'})}catch(e){}}
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null,r1=x=>x==null?null:Math.round(x*10)/10,f=t=>t==null?'—':Math.floor(t/60)+':'+String(Math.round(t%60)).padStart(2,'0');
const solo=runs.filter(r=>r.mode==='solo'),mix=runs.filter(r=>r.mode==='mix');
const cards=[...new Set(runs.flatMap(r=>r.cards))];
const soloT=cards.map(k=>{const R=solo.filter(r=>r.cards[0]===k);return {k,n:R.length,t:mean(R.map(r=>r.t)),kills:mean(R.map(r=>r.kills||0)),share:mean(R.map(r=>{const s=Object.values(r.dmg).reduce((a,b)=>a+b,0)||1;return (r.dmg[k]||0)/s}))}}).filter(x=>x.n).sort((a,b)=>b.t-a.t);
const avgMix=mean(mix.map(r=>r.t));
const mixT=cards.map(k=>{const A=mix.filter(r=>r.cards.includes(k)),B=mix.filter(r=>!r.cards.includes(k));return {k,n:A.length,with:mean(A.map(r=>r.t)),without:mean(B.map(r=>r.t)),diff:mean(A.map(r=>r.t))-mean(B.map(r=>r.t)),share:mean(A.map(r=>{const s=Object.values(r.dmg).reduce((a,b)=>a+b,0)||1;return (r.dmg[k]||0)/s}))}}).filter(x=>x.n).sort((a,b)=>b.diff-a.diff);
const pairs=[];for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++){const a=cards[i],b=cards[j],R=mix.filter(r=>r.cards.includes(a)&&r.cards.includes(b));if(R.length<4)continue;const ea=mixT.find(x=>x.k===a)?.diff||0,eb=mixT.find(x=>x.k===b)?.diff||0;const t=mean(R.map(r=>r.t));pairs.push({a,b,n:R.length,t,syn:t-avgMix-ea-eb})}
pairs.sort((x,y)=>y.syn-x.syn);
const lvAt=[5,8,10,12,15].map(m=>({m,lv:r1(mean(mix.filter(r=>r.lvAt?.[m]!=null).map(r=>r.lvAt[m])))}));
const full=mix.filter(r=>r.fullAt!=null).map(r=>r.fullAt);
const deaths={};for(const r of runs)if(r.died)deaths[r.by]=(deaths[r.by]||0)+1;
const builds=[...mix].sort((a,b)=>b.t-a.t);
const S={runs:runs.length,solo:solo.length,mix:mix.length,avgMix:r1(avgMix),lvAt,fullAt:{n:full.length,of:mix.length,mean:r1(mean(full))},deaths:Object.entries(deaths).sort((a,b)=>b[1]-a[1]).slice(0,8),
 soloRank:soloT.map(x=>({k:x.k,n:x.n,t:r1(x.t),kills:r1(x.kills),share:r1(x.share*100)})),mixRank:mixT.map(x=>({k:x.k,n:x.n,with:r1(x.with),diff:r1(x.diff),share:r1(x.share*100)})),
 topPairs:pairs.slice(0,10).map(p=>({...p,t:r1(p.t),syn:r1(p.syn)})),worstPairs:pairs.slice(-8).map(p=>({...p,t:r1(p.t),syn:r1(p.syn)})),
 topBuilds:builds.slice(0,10).map(r=>({cards:r.cards,t:r.t,lv:r.lv})),worstBuilds:builds.slice(-6).map(r=>({cards:r.cards,t:r.t,lv:r.lv}))};
fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(S,null,1));
const tb=(h,rows)=>`<table><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(x=>`<td>${x??'—'}</td>`).join('')}</tr>`).join('')}</table>`;
fs.writeFileSync(path.join(OUT,'index.html'),`<!doctype html><meta charset=utf-8><title>平衡测试报告</title><style>body{font:14px system-ui;max-width:900px;margin:20px auto;padding:0 16px}table{border-collapse:collapse;margin:8px 0 24px}td,th{border:1px solid #ccc;padding:3px 8px;text-align:right}</style>
<h1>平衡测试报告</h1><p>共 ${S.runs} 局（单卡 ${S.solo}，随机搭配 ${S.mix}）。随机搭配平均存活 ${f(avgMix)}；技能全满 ${full.length}/${mix.length} 局，平均 ${f(mean(full))}。</p>
<h2>各时间点平均等级</h2>${tb(['分钟','等级'],lvAt.map(x=>[x.m,x.lv]))}
<h2>单卡排名（只带专属+这张）</h2>${tb(['卡','局数','平均存活','击杀','伤害占比%'],soloT.map(x=>[x.k,x.n,f(x.t),r1(x.kills),r1(x.share*100)]))}
<h2>搭配中的贡献（带它 vs 不带它，存活秒数差）</h2>${tb(['卡','局数','带它平均存活','差值(秒)','伤害占比%'],mixT.map(x=>[x.k,x.n,f(x.with),r1(x.diff),r1(x.share*100)]))}
<h2>最强两两组合（超出各自贡献的部分）</h2>${tb(['A','B','局数','平均存活','协同(秒)'],S.topPairs.map(p=>[p.a,p.b,p.n,f(p.t),p.syn]))}
<h2>最弱两两组合</h2>${tb(['A','B','局数','平均存活','协同(秒)'],S.worstPairs.map(p=>[p.a,p.b,p.n,f(p.t),p.syn]))}
<h2>存活最久的搭配</h2>${tb(['卡组','存活','等级'],S.topBuilds.map(r=>[r.cards.join(' '),f(r.t),r.lv]))}
<h2>死因</h2>${tb(['死因','次数'],S.deaths)}`);
console.log(JSON.stringify({runs:S.runs,avgMix:S.avgMix,lvAt}));
