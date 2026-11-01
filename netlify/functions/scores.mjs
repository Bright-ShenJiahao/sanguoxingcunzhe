// 排行榜接口（参考无名之辈英雄榜）：GET 取榜，POST 提交一局。
// 存储：Netlify Blobs，每局一个独立 key，避免并发写入互相覆盖。
import { getStore } from '@netlify/blobs';
import { randomUUID } from 'node:crypto';

export const config = { path: '/api/scores' };
const SEASON = 's2';              // 换赛季只改这里（大改平衡时换，旧成绩自动不显示）
const ADMIN = 'ysj-qingli-2026';  // 维护口令：删单条 / 清空 / 查看内部 key
const NAME_MAX = 8, TOP_N = 20, RATE_MAX = 3, RATE_WINDOW = 60;
const json = (body,status=200) => new Response(JSON.stringify(body),{
 status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
});
const cleanName = raw => Array.from(String(raw??'').replace(/[\u0000-\u001f<>\\"'`]/g,'').trim()).slice(0,NAME_MAX).join('') || '无名氏';
// 评分：存活每秒 2 分 + 击杀 1 分 + 等级 10 分 + 每个 Boss 200 分（与前端 scoreOf 一致）
const scoreOf = r => Math.round(r.t*2 + r.kills + (r.lv||0)*10 + (r.bosses||0)*200);
const compare = (a,b) => b.score-a.score || b.t-a.t || b.kills-a.kills || a.at-b.at;
async function readAll(store){
 const {blobs}=await store.list({prefix:'run-'});const rows=[];
 for(let i=0;i<blobs.length;i+=50){
  const batch=await Promise.all(blobs.slice(i,i+50).map(async b=>{
   const raw=await store.get(b.key);if(!raw)return null;
   try{const r=JSON.parse(raw);r.key=b.key;return r}catch{return null}
  }));
  rows.push(...batch.filter(r=>r?.season===SEASON&&Number.isInteger(r.t)&&Number.isInteger(r.kills)));
 }
 return rows;
}
export default async function handler(req,context){
 if(!['GET','POST'].includes(req.method))return json({ok:false,error:'method not allowed'},405);
 try{
  const store=getStore({name:'sanguoxingcunzhe-board',consistency:'strong'});
  if(req.method==='GET'){
   const all=await readAll(store);
   if(new URL(req.url).searchParams.get('admin')===ADMIN)return json({ok:true,rows:all});
   const best=new Map();
   for(const r of all){if(r.cheat)continue;r.score=scoreOf(r);const p=best.get(r.name);if(!p||compare(r,p)<0)best.set(r.name,r)}
   const list=[...best.values()].sort(compare).slice(0,TOP_N).map(({name,t,kills,lv,bosses,score,at})=>({name,t,kills,lv,bosses,score,at}));
   return json({ok:true,season:SEASON,total:best.size,list});
  }
  let body;try{body=await req.json()}catch{return json({ok:false,error:'bad json'},400)}
  // 维护：删单条 / 清空
  if(body?.op==='del'||body?.op==='purge'){
   if(body.token!==ADMIN)return json({ok:false,error:'forbidden'},403);
   if(body.op==='del'){await store.delete(String(body.key));return json({ok:true,deleted:1})}
   const {blobs}=await store.list({prefix:'run-'});for(const b of blobs)await store.delete(b.key);return json({ok:true,deleted:blobs.length});
  }
  const t=Math.round(Number(body?.t)),kills=Math.round(Number(body?.kills)),lv=Math.round(Number(body?.lv))||1,bosses=Math.round(Number(body?.bosses))||0;
  // 合理性检查：一局 20 分钟（之后无尽也给到 2 小时上限）；击杀、等级、Boss 不能超过时间允许的量
  if(![t,kills].every(Number.isFinite)||t<10||t>7200)return json({ok:false,error:'bad time'},400);
  if(kills<0||kills>t*20)return json({ok:false,error:'bad kills'},400);
  if(lv<1||lv>200||bosses<0||bosses>Math.floor(t/120)+2)return json({ok:false,error:'bad stats'},400);
  const ip=context?.ip||req.headers.get('x-nf-client-connection-ip')||'unknown',now=Date.now();
  if((await readAll(store)).filter(r=>r.ip===ip&&now-r.at<RATE_WINDOW*1000).length>=RATE_MAX)return json({ok:false,error:'too many'},429);
  const rec={name:cleanName(body.name),t,kills,lv,bosses,at:now,season:SEASON,ip,cheat:0};
  await store.set('run-'+randomUUID(),JSON.stringify(rec));
  return json({ok:true,score:scoreOf(rec)});
 }catch{return json({ok:false,error:'temporarily unavailable'},503)}
}
