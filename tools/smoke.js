// 冒烟测试（GitHub Actions 上跑，免费）：语法检查 + 三语词表对齐 + 三种语言 × 手机/电脑各进一局跑 25 秒，有报错就失败
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');
const errs=[];const fail=m=>{errs.push(m);console.log('✗',m)};
// 1) 语法
for(const f of fs.readdirSync('src').filter(f=>f.endsWith('.js')))try{execSync(`node --input-type=module --check < src/${f}`,{stdio:'pipe'})}catch(e){fail('语法错误 src/'+f+'：'+String(e.stderr).split('\n').slice(0,4).join(' '))}
try{execSync('node --input-type=module --check < netlify/functions/scores.mjs',{stdio:'pipe'})}catch(e){fail('语法错误 scores.mjs')}
(async()=>{
 // 2) 三语 key 对齐、占位符一致
 for(const f of ['i18n_ui','i18n_run','i18n_cards','i18n_world']){const m=await import(path.resolve('src',f+'.js'));const Z=m.zh||{};for(const L of ['en','ja']){const X=m[L]||{};for(const k of Object.keys(Z)){if(!(k in X))fail(`${f} 缺 ${L}: ${k}`);else{const a=(String(Z[k]).match(/\{\w+\}/g)||[]).sort().join(),b=(String(X[k]).match(/\{\w+\}/g)||[]).sort().join();if(a!==b)fail(`${f} 占位符不一致 ${L}: ${k}`)}}}}
 // 3) 实际进游戏
 const {chromium}=require('playwright');const b=await chromium.launch();
 for(const lang of ['zh','en','ja'])for(const [vn,vp] of [['phone',{width:390,height:844}],['pc',{width:1280,height:720}]]){
  const p=await b.newPage({viewport:vp});const tag=`${lang}/${vn}`;
  p.on('pageerror',e=>fail(`${tag} 页面报错：${e.message}`));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|favicon|api\/scores/.test(m.text()))fail(`${tag} 控制台：${m.text().slice(0,160)}`)});
  await p.addInitScript(l=>{try{if(!sessionStorage.x){localStorage.clear();localStorage.setItem('lang',l);localStorage.setItem('tutDone','1');sessionStorage.x=1}}catch(_){}},lang);
  try{
   await p.goto('http://localhost:8765/index.html?debug&v='+Date.now());await p.waitForSelector('.menu-name input',{state:'visible',timeout:60000});await p.waitForTimeout(1500);
   await p.fill('.menu-name input','Smoke');await p.click('.menu-start');await p.waitForTimeout(800);await p.click('.pp-next');await p.waitForTimeout(400);await p.click('.pp-go');
   await p.waitForFunction(()=>window.__G?.S,null,{timeout:20000});await p.evaluate(()=>{window.DBG.god=1;window.__G.S.t=290});
   for(let i=0;i<25;i++){await p.waitForTimeout(1000);await p.evaluate(()=>{const lv=document.getElementById('lvup');if(lv&&!lv.hidden)lv.querySelector('button.c2,button.card')?.click()})}
   const raw=await p.evaluate(()=>{const s=document.body.innerText;return (s.match(/\b(ui|run|card|menu|end|tut|pause)\.[a-zA-Z0-9_.]+\b/g)||[]).slice(0,5)});if(raw.length)fail(`${tag} 界面出现内部代号：${raw.join(', ')}`);
   if(!(await p.evaluate(()=>window.__G.S.t>300)))fail(`${tag} 游戏时间没有推进`);
   await p.screenshot({path:`smoke_${lang}_${vn}.png`});
  }catch(e){fail(`${tag} 流程失败：${e.message.split('\n')[0]}`)}
  await p.close()}
 await b.close();
 console.log(errs.length?`\n共 ${errs.length} 个问题`:'\n✓ 冒烟测试全部通过');process.exit(errs.length?1:0)})();
