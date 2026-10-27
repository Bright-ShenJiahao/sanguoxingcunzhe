// 同源 Netlify Functions 接口；超时/断网均由调用方显示提示，不影响游戏。
export const formatTime = seconds => Math.floor(seconds/60)+':'+String(Math.floor(seconds%60)).padStart(2,'0');
async function request(options={}){
 // README 中的 Python 静态服务不运行 Netlify Functions，直接进入离线提示。
 if(['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&location.port==='8000')throw new Error('static server');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
 try{
  const response=await fetch('/api/scores',{...options,cache:'no-store',signal:controller.signal});
  if(!response.ok)throw new Error('unavailable');
  const data=await response.json();if(!data?.ok)throw new Error('unavailable');return data;
 }finally{clearTimeout(timer)}
}
export async function submitScore(record){
 try{await request({method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(record)});return true}catch{return false}
}
export function createLeaderboard(){
 const dialog=document.createElement('dialog');dialog.className='survival-dialog';dialog.setAttribute('aria-label','排行榜');
 dialog.innerHTML='<section><h2>排行榜</h2><p>存活时间优先，同时间比较击杀数 · 前 20 名</p><div class="board-content" role="status"></div><button type="button">关闭</button></section>';
 document.body.append(dialog);
 dialog.querySelector('button').onclick=()=>dialog.close();
 const content=dialog.querySelector('.board-content');let version=0;
 return {async open(){
  const current=++version;content.textContent='正在读取排行榜……';dialog.showModal();
  try{
   const data=await request();
   if(current!==version)return;
   if(!Array.isArray(data.list))throw new Error('invalid list');
   const rows=data.list.filter(r=>typeof r.name==='string'&&Number.isFinite(r.t)&&Number.isFinite(r.kills))
    .sort((a,b)=>b.t-a.t||b.kills-a.kills).slice(0,20);
   content.replaceChildren();
   if(!rows.length){content.textContent='暂无成绩，来打第一局吧';return}
   const table=document.createElement('table');
   table.innerHTML='<thead><tr><th>名次</th><th>名字</th><th>存活时间</th><th>击杀数</th></tr></thead>';
   const body=document.createElement('tbody');
   rows.forEach((r,i)=>{const tr=document.createElement('tr');for(const value of [i+1,r.name,formatTime(r.t),r.kills]){const td=document.createElement('td');td.textContent=String(value);tr.append(td)}body.append(tr)});
   table.append(body);content.append(table);
  }catch{if(current===version)content.textContent='暂时无法连接'}
 }};
}
