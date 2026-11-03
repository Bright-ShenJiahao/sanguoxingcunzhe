// 机器人验收报告：node tools/bot_report.js <结果目录> <输出目录>
const fs=require('fs'),path=require('path');const [DIR='results',OUT='report']=process.argv.slice(2);fs.mkdirSync(OUT,{recursive:true});
const runs=[];for(const f of fs.readdirSync(DIR,{recursive:true}))if(String(f).endsWith('.json')){try{for(const r of JSON.parse(fs.readFileSync(path.join(DIR,f))))if(!r.err)runs.push(r)}catch(e){}}
const by={};for(const r of runs)(by[r.bot]=by[r.bot]||[]).push(r);
const S={};
for(const [b,R] of Object.entries(by)){const n=R.length,alive=m=>R.filter(r=>r.t>=m*60).length/n;
 const causes={};for(const r of R)if(r.died)causes[r.by]=(causes[r.by]||0)+1;
 const hits={proj:0,melee:0,emerg:0,total:0,n60:0};for(const r of R)for(const h of (r.log?.hits||[])){hits.total++;h.proj?hits.proj++:hits.melee++;if(h.emerg)hits.emerg++;hits.n60+=h.n60}
 const lv=m=>{const L=R.map(r=>r.lvAt?.[m]).filter(v=>v!=null);return L.length?+(L.reduce((a,b)=>a+b,0)/L.length).toFixed(1):null};
 S[b]={n,meanT:Math.round(R.reduce((a,r)=>a+r.t,0)/n),alive:{m5:alive(5),m10:alive(10),m15:alive(15),m20:alive(19.9)},lv:{m5:lv(5),m10:lv(10),m15:lv(15)},
  deaths:Object.entries(causes).sort((a,b)=>b[1]-a[1]).slice(0,8),hitMix:{proj:hits.proj,melee:hits.melee,inDodge:hits.emerg,avgNear60:hits.total?+(hits.n60/hits.total).toFixed(1):0}}}
fs.writeFileSync(path.join(OUT,'bot_summary.json'),JSON.stringify(S,null,1));console.log(JSON.stringify(S));
