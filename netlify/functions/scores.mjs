// 与 wumingzhibei 一样：Netlify Function + Blobs，每局一个独立 key。
import { getStore } from '@netlify/blobs';
import { randomUUID } from 'node:crypto';

export const config = { path: '/api/scores' };
const SEASON = 's1';
const json = (body,status=200) => new Response(JSON.stringify(body),{
 status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
});
const cleanName = raw => Array.from(String(raw??'').replace(/[\u0000-\u001f<>]/g,'').trim()).slice(0,20).join('') || '无名氏';
const compare = (a,b) => b.t-a.t || b.kills-a.kills || a.at-b.at;
async function readAll(store){
 const {blobs}=await store.list({prefix:'run-'});
 const rows=[];
 // 分批读取，避免每条成绩同时发起一个存储请求。
 for(let i=0;i<blobs.length;i+=50){
  const batch=await Promise.all(blobs.slice(i,i+50).map(async b=>{
   const raw=await store.get(b.key);
   if(!raw)return null;
   try{return JSON.parse(raw)}catch{return null}
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
   const best=new Map();
   for(const row of await readAll(store)){
    const prev=best.get(row.name);
    if(!prev||compare(row,prev)<0)best.set(row.name,row);
   }
   const list=[...best.values()].sort(compare).slice(0,20).map(({name,t,kills,at})=>({name,t,kills,at}));
   return json({ok:true,list});
  }
  let body;try{body=await req.json()}catch{return json({ok:false,error:'bad json'},400)}
  if(!body||typeof body!=='object'||!Number.isInteger(body.t)||body.t<0||body.t>604800||
    !Number.isInteger(body.kills)||body.kills<0||body.kills>1000000)return json({ok:false,error:'bad score'},400);
  const ip=context?.ip||req.headers.get('x-nf-client-connection-ip')||'unknown',now=Date.now();
  // 沿用参考仓库的简单限流：同 IP 每分钟最多三局。
  if((await readAll(store)).filter(r=>r.ip===ip&&now-r.at<60000).length>=3)return json({ok:false,error:'too many'},429);
  const rec={name:cleanName(body.name),t:body.t,kills:body.kills,at:now,season:SEASON,ip};
  await store.set('run-'+randomUUID(),JSON.stringify(rec));
  return json({ok:true});
 }catch{return json({ok:false,error:'temporarily unavailable'},503)}
}
