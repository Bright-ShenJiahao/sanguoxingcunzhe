// 汇总平衡测试结果：node tools/balance_report.js <结果目录> <输出目录>
const fs=require('fs'),path=require('path');const [DIR='results',OUT='report']=process.argv.slice(2);fs.mkdirSync(OUT,{recursive:true});
const runs=[];for(const f of fs.readdirSync(DIR,{recursive:true}))if(String(f).endsWith('.json')){try{for(const r of JSON.parse(fs.readFileSync(path.join(DIR,f))))if(!r.err)runs.push({...r,mode:r.mode||(/solo/.test(f)?'solo':'mix')})}catch(e){}}
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

// ---------- Markdown 报告（写到 summary.md，并追加到 GitHub Actions 的 job summary） ----------
{const md=[],T=(h,rows)=>'| '+h.join(' | ')+' |\n|'+h.map(()=>'---').join('|')+'|\n'+rows.map(r=>'| '+r.map(x=>x??'—').join(' | ')+' |').join('\n')+'\n';
 const st={};for(const r of runs)st[r.status||'?']=(st[r.status||'?']||0)+1;
 md.push(`# 平衡测试报告\n\n共 ${runs.length} 局；结局：${Object.entries(st).map(([k,v])=>k+' '+v).join('，')}（cap＝跑到时间上限，stuck／timeout＝异常，不计入死亡）。\n`);
 const err=runs.filter(r=>r.errors?.length);if(err.length)md.push(`⚠️ ${err.length} 局有页面报错，例：${err[0].errors[0]}\n`);
 const TY=['mel','rng','ele','holy','dark'],TN={mel:'近战',rng:'远程',ele:'元素',holy:'神圣',dark:'黑暗'},ok=r=>r.status!=='stuck'&&r.status!=='timeout';
 const ty=runs.filter(r=>r.mode==='type'&&ok(r));
 if(ty.length){md.push('## 按伤害类型\n');md.push(T(['类型','局数','平均存活','中位存活','到 10 分钟','通关率','平均等级','首张 6 级','转职率','转职时间','主要死因'],TY.map(k=>{const R=ty.filter(r=>r.type===k);if(!R.length)return [TN[k],0];const ts=R.map(r=>r.t).sort((a,b)=>a-b),dz={};for(const r of R)if(r.died)dz[r.by]=(dz[r.by]||0)+1;
  const f6=R.map(r=>r.log?.ev?.first6?.t).filter(x=>x!=null),jb=R.filter(r=>r.job),jt=R.map(r=>r.log?.ev?.job?.t).filter(x=>x!=null);
  return [TN[k],R.length,f(mean(ts)),f(ts[ts.length>>1]),Math.round(R.filter(r=>r.t>=600).length/R.length*100)+'%',Math.round(R.filter(r=>r.clear).length/R.length*100)+'%',r1(mean(R.map(r=>r.lv))),f(mean(f6)),Math.round(jb.length/R.length*100)+'%',f(mean(jt)),Object.entries(dz).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([a,b])=>a+'×'+b).join(' ')]})))}
 const all=runs.filter(ok),M=Math.max(0,...all.map(r=>(r.log?.tele||[]).length));
 if(M){md.push('## 难度曲线（每分钟，按活到该分钟的局平均）\n');const rows=[];for(let m=0;m<M;m++){const X=all.map(r=>r.log?.tele?.[m]).filter(Boolean);if(!X.length)continue;
   rows.push([m,X.length+'/'+all.length,r1(mean(X.map(x=>x.lv))),r1(mean(X.map(x=>x.kills))),r1(mean(X.map(x=>x.en))),Math.max(...X.map(x=>x.en)),Math.round(mean(X.map(x=>x.hp/(x.maxHp||100)))*100)+'%',r1(mean(X.map(x=>x.ftMs).filter(v=>v!=null)))])}
  md.push(T(['分钟','存活样本','等级','累计击杀','同屏怪','同屏怪最多','生命','帧耗时ms（无头，相对值）'],rows))}
 {const dm={},n={};for(const r of all){const tot=Object.values(r.dmg||{}).reduce((a,b)=>a+b,0)||1;for(const [k,v] of Object.entries(r.dmg||{})){dm[k]=(dm[k]||0)+v/tot;n[k]=(n[k]||0)+1}}
  const L=Object.keys(dm).map(k=>[k,n[k],r1(dm[k]/n[k]*100)]).sort((a,b)=>b[2]-a[2]);if(L.length){md.push('## 卡伤害占比（出现局内平均）\n');md.push('**前 10**\n\n'+T(['卡','局数','占比%'],L.slice(0,10)));md.push('**后 10**\n\n'+T(['卡','局数','占比%'],L.slice(-10)))}}
 {const J={};for(const r of all)if(r.job)J[r.job]=(J[r.job]||[]).concat(r);const buys={};for(const r of all)for(const b of r.log?.ev?.buys||[])buys[b.k]=(buys[b.k]||0)+1;
  if(Object.keys(J).length)md.push('## 职业\n\n'+T(['职业','局数','平均存活','通关率'],Object.entries(J).map(([k,R])=>[k,R.length,f(mean(R.map(r=>r.t))),Math.round(R.filter(r=>r.clear).length/R.length*100)+'%'])));
  md.push(`商人：平均每局出现 ${r1(mean(all.map(r=>(r.log?.ev?.mer||[]).length)))} 次，购买 ${Object.entries(buys).map(([k,v])=>k+'×'+v).join('，')||'无'}。\n`)}
 const out=md.join('\n');fs.writeFileSync(path.join(OUT,'summary.md'),out);if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,out)}
