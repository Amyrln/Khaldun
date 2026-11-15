/* «Миний нутаг» — дэвсгэр хөгжим. Халдун апп-ын тохиргоог дагана:
   «Дэвсгэр хөгжим» асаалттай бол Тохиргоо › Дуу › «2D, 3D тоглоомд» сонгосон аялгуу (анхдагч нь калимбын «Тайван тал»)
   3 секундын турш аажмаар чангарч эхэлнэ. Байгалийн чимээнээс (SND) тусдаа, ижил AudioContext дээр тоглоно.
   Калимбын код нь Халдун аппын index.html-ийн «Тайван тал»-тай яг ижил. */
(function(){
"use strict";
const LS=k=>{try{return localStorage.getItem(k);}catch(e){return null;}};
const M={on:LS("jalair-music")!=="off",tune:LS("jalair-tune-game")==="khaldun"?"khaldun":"taivan",
  A:null,out:null,rev:null,playing:false,timer:0,t:0,bar:0,src:null,buf:null,raw:null,gen:0,resume:false};
window.MUZ=M;

/* ---------- «Тайван тал»: калимба, 68 bpm, 16 хэмжүүр давтагдана ---------- */
const mtof=m=>440*Math.pow(2,(m-69)/12);
const KM={bpm:68,
  /* per bar: arpeggio tones (kalimba, low), drone tones (bowed pad), bass root */
  ch:[[[50,57,64,66],[50,57,62],38],[[50,57,64,66],[50,57,62],38],[[47,54,62,64],[47,54,62],35],[[47,54,62,64],[47,54,62],35],
      [[43,50,57,59],[43,50,59],31],[[43,50,57,59],[43,50,59],31],[[45,52,59,62],[45,52,57],33],[[45,52,59,62],[45,52,57],33],
      [[50,57,64,66],[50,57,62],38],[[50,57,64,66],[50,57,62],38],[[42,49,57,64],[42,49,57],30],[[42,49,57,64],[42,49,57],30],
      [[43,50,57,59],[43,50,59],31],[[43,50,57,59],[43,50,59],31],[[45,52,59,62],[45,52,57],33],[[45,52,59,62],[45,52,57],33]],
  /* the melody: [midi, beats] per bar, 0 = rest */
  mel:[[[78,1],[81,1],[76,2]],[[74,3],[0,1]],[[74,1],[76,1],[78,2]],[[71,3],[0,1]],
       [[69,1],[71,1],[74,2]],[[78,2],[76,2]],[[76,3],[74,1]],[[71,4]],
       [[78,1],[81,1],[83,2]],[[81,2],[78,2]],[[76,1],[78,1],[81,2]],[[76,3],[0,1]],
       [[74,1],[76,1],[78,1],[81,1]],[[83,2],[81,2]],[[76,2],[74,2]],[[74,2],[0,2]]],
  arp:[0,1,2,3,2,1,2,1]};
const kmBeat=()=>60/KM.bpm;
function kmRev(){const n=Math.floor(M.A.sampleRate*2.8),b=M.A.createBuffer(2,n,M.A.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3)*(i<M.A.sampleRate*.02?i/(M.A.sampleRate*.02):1);}
  const cv=M.A.createConvolver();cv.buffer=b;const lp=M.A.createBiquadFilter();lp.type="lowpass";lp.frequency.value=3200;const g=M.A.createGain();g.gain.value=.42;cv.connect(lp);lp.connect(g);g.connect(M.out);return cv;}
function kmPan(p){try{const s=M.A.createStereoPanner();s.pan.value=p;s.connect(M.out);return s;}catch(e){return M.out;}}
/* kalimba tine: a round fundamental, the tine's own bright overtone (~6.3×) that fades fast, a touch of body, a soft thumb */
function kmTine(m,t,v,pan,wet){const f=mtof(m),d=Math.max(1.4,3.4-(m-50)*.05),o=M.A.createOscillator(),o2=M.A.createOscillator(),o3=M.A.createOscillator(),g=M.A.createGain(),g2=M.A.createGain(),g3=M.A.createGain(),lp=M.A.createBiquadFilter();
  o.type=o2.type=o3.type="sine";o.frequency.value=f;o2.frequency.value=f*6.27;o3.frequency.value=f*2.01;lp.type="lowpass";lp.frequency.value=4200;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.006);g.gain.exponentialRampToValueAtTime(v*.45,t+.25);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  g2.gain.setValueAtTime(.0001,t);g2.gain.exponentialRampToValueAtTime(v*.16,t+.003);g2.gain.exponentialRampToValueAtTime(.0001,t+.18);
  g3.gain.setValueAtTime(.0001,t);g3.gain.exponentialRampToValueAtTime(v*.08,t+.006);g3.gain.exponentialRampToValueAtTime(.0001,t+.6);
  o.connect(g);o2.connect(g2);o3.connect(g3);[g,g2,g3].forEach(x=>x.connect(lp));const out=kmPan(pan);lp.connect(out);
  const w=M.A.createGain();w.gain.value=wet;lp.connect(w);w.connect(M.rev);[o,o2,o3].forEach(x=>{x.start(t);x.stop(t+d+.05);});}
/* warm bowed drone, like a khuur heard from far away: soft, low, slow swells, a slight shimmer */
function kmPad(m,t,d,v){const f=mtof(m),o=M.A.createOscillator(),o2=M.A.createOscillator(),lfo=M.A.createOscillator(),lg=M.A.createGain(),g=M.A.createGain(),lp=M.A.createBiquadFilter();
  o.type="triangle";o2.type="sine";o.frequency.value=f;o2.frequency.value=f*1.002;lfo.frequency.value=4.6;lg.gain.value=f*.003;lfo.connect(lg);lg.connect(o.frequency);
  lp.type="lowpass";lp.frequency.value=650;lp.Q.value=.3;o.connect(lp);o2.connect(lp);lp.connect(g);g.connect(M.out);g.connect(M.rev);
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+d*.35);g.gain.linearRampToValueAtTime(v*.8,t+d*.75);g.gain.linearRampToValueAtTime(.0001,t+d+.6);
  [o,o2,lfo].forEach(x=>{x.start(t);x.stop(t+d+.7);});}
function kmBass(m,t,d){const o=M.A.createOscillator(),g=M.A.createGain();o.type="sine";o.frequency.value=mtof(m+12);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.12,t+.08);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g);g.connect(M.out);o.start(t);o.stop(t+d+.05);}
function kmBar(i,t0){const b=kmBeat(),k=i%16,C=KM.ch[k],T=p=>t0+p*b,pass=Math.floor(i/16);
  KM.arp.forEach((ix,s)=>{if(pass%2===1&&s%2===1)return;kmTine(C[0][ix]+12,T(s*.5)+(s%2?.012:0),s===0?.17:.11,s%2?.25:-.2,.5);});
  if(k%2===0){C[1].forEach(m=>kmPad(m,T(0),b*8,.03));kmBass(C[2],T(0),b*7.5);}
  let p=0;KM.mel[k].forEach(([m,d])=>{if(m)kmTine(pass%2===1&&p===0&&d>=2?m-12:m,T(p),.38,(m-74)*.03,.42);p+=d;});}
function kmTick(){if(!M.playing)return;const bd=kmBeat()*4;while(M.t<M.A.currentTime+.8){kmBar(M.bar,M.t);M.t+=bd;M.bar++;}}
function kmGo(fi){M.out.gain.setValueAtTime(.0001,M.A.currentTime);M.out.gain.exponentialRampToValueAtTime(.7,M.A.currentTime+fi);
  M.rev=kmRev();M.t=M.A.currentTime+.2;M.bar=0;kmTick();M.timer=setInterval(kmTick,200);}

/* ---------- «Egshiglyn - Whisper of the Heart»: ../khaldun-ay.mp3, 90.6 сек залгаасгүй давталт ---------- */
const KH={url:"../khaldun-ay.mp3",a:1,len:3993963/44100,vol:.45};
function khBuf(){if(M.buf)return Promise.resolve(M.buf);
  if(!M.raw)M.raw=fetch(KH.url).then(r=>{if(!r.ok)throw new Error("HTTP "+r.status);return r.arrayBuffer();});
  return M.raw.then(ab=>new Promise((ok,no)=>{const p=M.A.decodeAudioData(ab.slice(0),ok,no);if(p&&p.catch)p.catch(no);})).then(b=>{M.buf=b;M.raw=null;return b;});}
function khPlay(g,fi){M.out.gain.value=.7;
  khBuf().then(b=>{if(!M.playing||M.gen!==g)return;const A=M.A,s=A.createBufferSource(),v=A.createGain(),t=A.currentTime+.05;
    s.buffer=b;s.loop=true;s.loopStart=KH.a;s.loopEnd=KH.a+KH.len;v.gain.setValueAtTime(.0001,t);v.gain.exponentialRampToValueAtTime(KH.vol,t+fi);
    s.connect(v);v.connect(M.out);s.start(t,KH.a);M.src=s;})
  .catch(()=>{M.raw=null;if(M.playing&&M.gen===g)kmGo(fi);});}

M.start=function(fi){if(!M.on||M.playing||typeof SND==="undefined"||!SND.ctx)return;M.A=SND.ctx;
  try{if(M.A.state!=="running"&&M.A.state!=="closed")M.A.resume();}catch(e){}
  M.out=M.A.createGain();M.out.connect(M.A.destination);M.playing=true;M.gen++;
  if(M.tune==="khaldun")khPlay(M.gen,fi||3);else kmGo(fi||3);};
M.stop=function(fo){if(!M.playing)return;fo=fo||.8;M.playing=false;M.gen++;clearInterval(M.timer);const o=M.out,s=M.src,A=M.A;M.src=null;
  try{o.gain.cancelScheduledValues(A.currentTime);o.gain.setValueAtTime(Math.max(o.gain.value,.0001),A.currentTime);o.gain.exponentialRampToValueAtTime(.0001,A.currentTime+fo);
    setTimeout(()=>{try{o.disconnect();}catch(e){}try{s&&s.stop();}catch(e){}},(fo+.2)*1000);}catch(e){}};
M.set=function(on){M.on=on;try{localStorage.setItem("jalair-music",on?"on":"off");}catch(e){}if(on){SND.start();M.start(1.5);}else M.stop();};

/* хөтөч дууг зөвхөн товч дарсны дараа зөвшөөрнө: SND.start (Эхлэх, алхах, чирэх) бүрт хөгжим ч эхэлнэ */
if(typeof SND!=="undefined"){const s0=SND.start;SND.start=function(){s0.apply(SND,arguments);M.start();};}
document.addEventListener("visibilitychange",()=>{if(document.hidden){if(M.playing){M.stop(.3);M.resume=true;}}else if(M.resume){M.resume=false;M.start(1.5);}});
/* тохиргоо: «Хөгжим» унтраалга нь аппын «Дэвсгэр хөгжим»-тэй нэг */
const sw=document.getElementById("musSw");if(sw){sw.checked=M.on;sw.addEventListener("change",e=>M.set(e.target.checked));
  const st=document.getElementById("setBtn");if(st)st.addEventListener("click",()=>{sw.checked=M.on;});}
})();
