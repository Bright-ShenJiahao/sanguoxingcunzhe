// 音乐与音效：全部用 WebAudio 现场合成（不需要音频文件）。
// 音乐：D 多利亚调式的凯尔特风旋律（长笛音色）+ 竖琴分解和弦 + 低音 + 鼓；战斗层随怪物数量加强；Boss 时换激烈段。
// 首次点击/按键后才能出声（浏览器规定）。M 键静音。
export function createAudio(){
 let ac=null,master,musicBus,sfxBus,on=true,mode='menu',inten=0,started=false,next=0,step=0;
 try{on=localStorage.getItem('mute')!=='1'}catch(e){}
 const VOL={m:1,s:1};try{Object.assign(VOL,JSON.parse(localStorage.getItem('vol')||'{}'))}catch(e){}
 function init(){if(ac)return;ac=new (window.AudioContext||window.webkitAudioContext)();master=ac.createGain();master.gain.value=on?.9:0;master.connect(ac.destination);
  musicBus=ac.createGain();musicBus.gain.value=.32*VOL.m;musicBus.connect(master);sfxBus=ac.createGain();sfxBus.gain.value=.5*VOL.s;sfxBus.connect(master);
  const rv=ac.createConvolver(),len=ac.sampleRate*1.6,b=ac.createBuffer(2,len,ac.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.5)}
  rv.buffer=b;const wet=ac.createGain();wet.gain.value=.22;musicBus.connect(rv);rv.connect(wet);wet.connect(master);T.rv=rv}
 const T={};
 const unlock=()=>{init();if(ac.state==='suspended')ac.resume();if(!started){started=true;next=ac.currentTime+.1;tick()}};
 addEventListener('pointerdown',unlock);addEventListener('keydown',e=>{unlock();if(e.key==='m'||e.key==='M'){on=!on;try{localStorage.setItem('mute',on?'0':'1')}catch(_){}if(master)master.gain.setTargetAtTime(on?.9:0,ac.currentTime,.05)}});
 const hz=m=>440*Math.pow(2,(m-69)/12);
 function tone(t,m,d,{type='triangle',vol=.2,bus=musicBus,att=.01,rel=.25,det=0,lp=0}={}){const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=hz(m);o.detune.value=det;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+att);g.gain.setTargetAtTime(0,t+d,rel/3);let n=o;if(lp){const f=ac.createBiquadFilter();f.frequency.value=lp;o.connect(f);n=f}n.connect(g);g.connect(bus);o.start(t);o.stop(t+d+rel+.1)}
 function noise(t,d,{vol=.3,hp=0,lp=0,bus=sfxBus}={}){const len=Math.ceil(ac.sampleRate*d),b=ac.createBuffer(1,len,ac.sampleRate),x=b.getChannelData(0);for(let i=0;i<len;i++)x[i]=(Math.random()*2-1)*(1-i/len);
  const s=ac.createBufferSource();s.buffer=b;let n=s;if(hp){const f=ac.createBiquadFilter();f.type='highpass';f.frequency.value=hp;n.connect(f);n=f}if(lp){const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=lp;n.connect(f);n=f}
  const g=ac.createGain();g.gain.value=vol;n.connect(g);g.connect(bus);s.start(t)}
 function kick(t,v=.5){const o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(40,t+.15);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(g);g.connect(musicBus);o.start(t);o.stop(t+.3)}
 // ---------- 曲子 ----------
 // 多首曲子按场景切换；大部分是舒缓的，只有 Boss 战激烈。每 16 小节有 4 小节去掉鼓，避免一直很吵。
 // 和弦：每小节一个三和弦（MIDI 音高）；旋律：每小节 8 个八分音符，0 = 休止
 const SONGS={
  menu:{beat:.36,ch:[[50,53,57],[48,52,55],[43,47,50],[50,53,57]],bass:[38,36,31,38],drum:0,lead:'sine',lv:.09,harp:.07,
   mel:[74,0,72,69,67,0,69,0, 72,0,74,77,76,0,0,0, 71,0,72,74,71,0,67,0, 69,0,67,65,64,0,62,0]},
  prep:{beat:.32,ch:[[55,59,62],[52,55,59],[48,52,55],[50,54,57]],bass:[43,40,36,38],drum:0,lead:'triangle',lv:.07,harp:.06,pluck:1,
   mel:[79,0,78,76,74,0,71,0, 76,0,74,72,71,0,0,0, 72,74,76,0,79,0,76,0, 74,0,72,0,69,0,0,0]},
  calm:{beat:.27,ch:[[50,53,57],[46,50,53],[48,52,55],[45,49,52]],bass:[38,34,36,33],drum:1,lead:'sine',lv:.07,harp:.05,
   mel:[69,0,72,74,72,0,69,67, 70,0,69,67,65,0,62,0, 67,0,69,72,71,0,67,0, 69,0,0,0,73,0,0,0]},
  game:{beat:.24,ch:[[50,53,57],[48,52,55],[43,47,50],[50,53,57]],bass:[38,36,31,38],drum:2,lead:'sine',lv:.07,harp:.05,
   mel:[74,72,69,67,69,72,74,77, 76,74,72,69,67,69,72,74, 71,72,74,71,67,69,71,74, 69,67,65,64,62,64,65,69],
   mel2:[81,79,77,76,74,76,77,79, 79,77,76,74,72,74,76,77, 74,76,79,81,79,77,74,71, 74,72,69,67,69,72,74,74]},
  night:{beat:.34,ch:[[45,48,52],[41,45,48],[43,47,50],[40,44,47]],bass:[33,29,31,28],drum:0,lead:'sine',lv:.065,harp:.06,
   mel:[76,0,0,74,72,0,71,0, 69,0,0,0,72,0,0,0, 74,0,72,71,67,0,0,0, 68,0,71,0,76,0,0,0]},
  late:{beat:.26,ch:[[45,48,52],[41,45,48],[48,52,55],[44,47,52]],bass:[33,29,36,32],drum:1,lead:'triangle',lv:.06,harp:.05,
   mel:[76,0,77,76,74,72,71,0, 72,0,74,72,69,0,0,0, 72,0,74,76,79,0,76,0, 75,0,74,0,71,0,68,0]},
  boss:{beat:.19,ch:[[50,53,57],[48,52,55],[43,47,50],[50,53,57]],bass:[38,36,31,38],drum:3,lead:'sine',lv:.07,harp:.05,heavy:1,
   mel:[81,79,77,76,74,76,77,79, 79,77,76,74,72,74,76,77, 74,76,79,81,79,77,74,71, 74,72,69,67,69,72,74,74]},
  emperor:{beat:.3,ch:[[38,45,50],[36,43,48],[34,41,46],[33,40,45]],bass:[26,24,22,21],drum:4,lead:'sawtooth',lv:.035,harp:.04,heavy:1,
   mel:[62,0,0,65,64,0,62,0, 60,0,0,64,62,0,60,0, 58,0,62,65,70,0,69,0, 69,0,0,0,61,0,64,0]},
  end:{beat:.4,ch:[[48,52,55],[45,48,52],[41,45,48],[43,47,50]],bass:[36,33,29,31],drum:0,lead:'sine',lv:.08,harp:.07,box:1,
   mel:[79,0,76,0,72,0,76,0, 74,0,72,0,69,0,0,0, 72,0,69,0,65,0,69,0, 71,0,74,0,79,0,0,0]}};
 let cur='menu';
 function bar(t,beat,bi){
  const S=SONGS[cur]||SONGS.menu,c=S.ch[bi%4],b=S.bass[bi%4],e=cur==='boss'?1:inten,quiet=S.drum&&(bi%16)>=12;   // 每 16 小节最后 4 小节不打鼓
  const mel=(S.mel2&&(bi>>2)%2)?S.mel2:S.mel,seg=(bi%4)*8;
  for(let i=0;i<8;i++){const tt=t+i*beat;
   if(S.harp)tone(tt,c[i%3]+12+(i>=4?12:0),beat*(S.pluck?.5:.9),{type:S.box?'sine':'triangle',vol:S.harp,rel:S.pluck?.25:.6});    // 分解和弦
   if(S.drum&&i%2===0)tone(tt,b,beat*1.8,{type:'sawtooth',vol:.04+.03*e,lp:450,rel:.2});        // 低音
   else if(!S.drum&&i===0)tone(tt,b,beat*7.5,{type:'triangle',vol:.05,lp:400,rel:1});             // 舒缓曲：长低音
   if(!quiet){
    if(S.drum===1){if(i===0)kick(tt,.18);if(i%2===1)noise(tt,.05,{vol:.03,hp:5000,bus:musicBus})}   // 轻：沙锤
    else if(S.drum===2){if(i%4===0)kick(tt,.28+.2*e);if(i%4===2)noise(tt,.1,{vol:.06+.06*e,hp:1800,bus:musicBus})}
    else if(S.drum===3){if(i%4===0)kick(tt,.6);if(i%4===2)noise(tt,.12,{vol:.18,hp:1800,bus:musicBus});noise(tt+beat/2,.04,{vol:.05,hp:6000,bus:musicBus})}
    else if(S.drum===4){if(i===0||i===3)kick(tt,.7);if(i===4)noise(tt,.3,{vol:.16,lp:900,bus:musicBus})}}   // 皇帝：慢而重的战鼓
   const m=mel[seg+i];if(m)tone(tt,m,beat*(S.drum?.9:1.7),{type:S.lead,vol:S.lv,att:.03,rel:.35,det:Math.sin(i)*6,lp:S.lead==='sawtooth'?1400:0});
   if(m&&S.heavy)tone(tt,m-12,beat*.9,{type:'square',vol:.022,lp:1600});
   if(m&&S.box&&i%4===0)tone(tt,m+12,beat*.4,{type:'sine',vol:.03,rel:.8})}
 }
 function tick(){if(!ac)return;const want=MODEMAP(mode);if(want!==cur){cur=want;step=0;next=Math.max(next,ac.currentTime+.05)}const beat=(SONGS[cur]||SONGS.menu).beat;
  while(next<ac.currentTime+.6){if(on)bar(next,beat,step);next+=beat*8;step++}
  setTimeout(tick,200)}
 const MODEMAP=m=>SONGS[m]?m:'game';
 // ---------- 音效 ----------
 let last={};const ok=(k,gap)=>{const n=performance.now();if(n-(last[k]||0)<gap)return false;last[k]=n;return true};
 const S={
  shoot(){if(!ac||!ok('sh',70))return;const t=ac.currentTime;tone(t,88,.04,{type:'square',vol:.06,bus:sfxBus,rel:.03});tone(t+.03,95,.03,{type:'square',vol:.04,bus:sfxBus,rel:.03})},
  slash(){if(!ac||!ok('sl',80))return;noise(ac.currentTime,.12,{vol:.12,hp:2500})},
  wave(){if(!ac||!ok('wv',150))return;const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(70,t+.3);g.gain.setValueAtTime(.18,t);g.gain.exponentialRampToValueAtTime(.001,t+.35);o.connect(g);g.connect(sfxBus);o.start(t);o.stop(t+.4)},
  boom(){if(!ac||!ok('bm',90))return;noise(ac.currentTime,.35,{vol:.25,lp:700})},
  zap(){if(!ac||!ok('zp',90))return;const t=ac.currentTime;for(let i=0;i<4;i++)tone(t+i*.02,96-i*5,.03,{type:'sawtooth',vol:.04,bus:sfxBus,rel:.02})},
  drum(fast){if(!ac||!ok('dr',fast?60:200))return;const t=ac.currentTime;tone(t,38,.12,{type:'sine',vol:fast?.09:.14,bus:sfxBus,rel:.15});noise(t,.05,{vol:.06,lp:400})},
  holy(){if(!ac||!ok('hl',120))return;const t=ac.currentTime;tone(t,96,.35,{type:'sine',vol:.03,bus:sfxBus,rel:.5});tone(t+.04,103,.3,{type:'sine',vol:.02,bus:sfxBus,rel:.5});tone(t,84,.2,{type:'triangle',vol:.02,bus:sfxBus,rel:.3})},
  hit(k='rng'){if(!ac)return;const t=ac.currentTime;if(!k||!ok('h'+k,k==='mel'?60:50))return;
   if(k==='mel'){noise(t,.07,{vol:.14,lp:900});tone(t,45,.06,{type:'square',vol:.05,bus:sfxBus,rel:.05,lp:500})}
   else if(k==='rng')noise(t,.04,{vol:.09,hp:1800})
   else if(k==='fire')noise(t,.12,{vol:.1,lp:1400})
   else if(k==='zap'){for(let i=0;i<3;i++)tone(t+i*.015,100-i*6,.025,{type:'sawtooth',vol:.03,bus:sfxBus,rel:.02})}
   else if(k==='ice')tone(t,100+Math.floor(Math.random()*3),.05,{type:'sine',vol:.04,bus:sfxBus,rel:.12})
   else if(k==='holy')tone(t,98,.06,{type:'sine',vol:.04,bus:sfxBus,rel:.15})
   else if(k==='dark')tone(t,40,.1,{type:'triangle',vol:.07,bus:sfxBus,rel:.12})
   else noise(t,.05,{vol:.1,lp:1500})},
  kill(){if(!ac||!ok('kl',60))return;const t=ac.currentTime;tone(t,60,.06,{type:'square',vol:.05,bus:sfxBus,rel:.05,lp:900})},
  gem(n=0){if(!ac||!ok('gm',40))return;const t=ac.currentTime;tone(t,84+Math.min(24,n*.5|0),.05,{type:'sine',vol:.07,bus:sfxBus,rel:.08})},
  hurt(){if(!ac||!ok('hu',110))return;const t=ac.currentTime;noise(t,.06,{vol:.16,lp:1200});tone(t,57,.05,{type:'square',vol:.09,bus:sfxBus,rel:.05,lp:900});tone(t+.04,50,.1,{type:'sawtooth',vol:.1,bus:sfxBus,rel:.1,lp:700})},
  heart(){if(!ac||!ok('hb',700))return;const t=ac.currentTime;tone(t,31,.08,{type:'sine',vol:.22,bus:sfxBus,rel:.1});tone(t+.16,29,.08,{type:'sine',vol:.16,bus:sfxBus,rel:.12})},
  level(){if(!ac)return;const t=ac.currentTime;[74,78,81,86].forEach((m,i)=>tone(t+i*.07,m,.12,{type:'triangle',vol:.12,bus:sfxBus,rel:.3}))},
  boss(){if(!ac)return;const t=ac.currentTime;[38,38,41,38].forEach((m,i)=>tone(t+i*.35,m,.3,{type:'sawtooth',vol:.14,bus:sfxBus,rel:.4,lp:700}))},
  banner(){if(!ac)return;const t=ac.currentTime;tone(t,69,.1,{type:'triangle',vol:.1,bus:sfxBus});tone(t+.1,74,.18,{type:'triangle',vol:.1,bus:sfxBus})}};
 return {...S,setMode(m){mode=m},setIntensity(x){inten=Math.max(0,Math.min(1,x))},get muted(){return !on},get vol(){return VOL},setVol(k,v){VOL[k]=Math.max(0,Math.min(1,v));try{localStorage.setItem('vol',JSON.stringify(VOL))}catch(e){}if(k==='m'&&musicBus)musicBus.gain.value=.32*VOL.m;if(k==='s'&&sfxBus)sfxBus.gain.value=.5*VOL.s}};
}
