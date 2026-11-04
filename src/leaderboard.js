import {t,onLanguageChange} from './i18n.js?v=11041700';
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
// 评分（与服务器一致）：存活每秒 2 分 + 击杀 1 分 + 等级 10 分 + 每个 Boss 200 分
export const scoreOf=r=>Math.round((r.t||0)*2+(r.kills||0)+(r.lv||0)*10+(r.bosses||0)*200);
export async function submitScore(record){
 try{await request({method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(record)});return true}catch{return false}
}
export function createLeaderboard(){
 const dialog=document.createElement('dialog');dialog.className='survival-dialog';dialog.innerHTML='<section><h2></h2><p></p><div class="board-content" role="status"></div><button type="button"></button></section>';
 const apply=()=>{dialog.setAttribute('aria-label',t('ui.board.title'));dialog.querySelector('h2').textContent=t('ui.board.title');dialog.querySelector('p').textContent=t('ui.board.rule');dialog.querySelector('button').textContent=t('ui.board.close')};apply();onLanguageChange(apply);
 document.body.append(dialog);
 dialog.querySelector('button').onclick=()=>dialog.close();
 const content=dialog.querySelector('.board-content');let version=0;
 return {async open(){
  const current=++version;content.textContent=t('ui.board.loading');dialog.showModal();
  try{
   const data=await request();
   if(current!==version)return;
   if(!Array.isArray(data.list))throw new Error('invalid list');
   const rows=data.list.filter(r=>typeof r.name==='string'&&Number.isFinite(r.t)&&Number.isFinite(r.kills))
    .slice(0,20);
   content.replaceChildren();
   if(!rows.length){content.textContent=t('ui.board.empty');return}
   const table=document.createElement('table');
   table.innerHTML='<thead><tr><th>#</th><th>'+['name','score','time','kills','lv','boss','date'].map(k=>t('ui.board.col.'+k)).join('</th><th>')+'</th></tr></thead>';
   const body=document.createElement('tbody');
   rows.forEach((r,i)=>{const tr=document.createElement('tr');const d=new Date(r.at||0);for(const value of [i+1,r.name,r.score??scoreOf(r),formatTime(r.t),r.kills,r.lv??'-',r.bosses??'-',(d.getMonth()+1)+'/'+d.getDate()]){const td=document.createElement('td');td.textContent=String(value);tr.append(td)}body.append(tr)});
   table.append(body);content.append(table);
  }catch{if(current===version)content.textContent=t('ui.board.offline')}
 }};
}
