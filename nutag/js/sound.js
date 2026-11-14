/* «Миний нутаг» — байгалийн намуухан чимээ: салхи, шувуу, галын шажигнаа, хонины майлах, алхам, туурай.
   Бүгд хөтөч дотор үүснэ, дууны файл татахгүй. Хүүхэд товч дарсны дараа л эхэлнэ (хөтчийн дүрэм). */
"use strict";
const SND={on:true,ctx:null,master:null,wind:null,windG:null,windF:null,birdT:0,crackT:0,ready:false};
SND.start=function(){if(SND.ctx){if(SND.ctx.state==="suspended")SND.ctx.resume();return;}
  try{SND.ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return;}
  const A=SND.ctx;SND.master=A.createGain();SND.master.gain.value=SND.on?.9:0;SND.master.connect(A.destination);
  /* wind: brown noise through a low-pass filter, its loudness drifting slowly */
  const len=A.sampleRate*4,buf=A.createBuffer(1,len,A.sampleRate),d=buf.getChannelData(0);let last=0;
  for(let i=0;i<len;i++){const w=Math.random()*2-1;last=(last+.02*w)/1.02;d[i]=last*3.2;}
  SND.noise=buf;const src=A.createBufferSource();src.buffer=buf;src.loop=true;
  SND.windF=A.createBiquadFilter();SND.windF.type="lowpass";SND.windF.frequency.value=480;SND.windG=A.createGain();SND.windG.gain.value=0;
  src.connect(SND.windF);SND.windF.connect(SND.windG);SND.windG.connect(SND.master);src.start();SND.ready=true;};
SND.set=function(on){SND.on=on;if(SND.master)SND.master.gain.setTargetAtTime(on?.9:0,SND.ctx.currentTime,.2);};
const live=()=>SND.ready&&SND.on&&SND.ctx.state==="running";
/* a short burst of filtered noise (crackle, step, hoof) */
SND.burst=function(t,dur,{f=1200,q=1,v=.05,type="bandpass"}={}){if(!live())return;const A=SND.ctx,s=A.createBufferSource();s.buffer=SND.noise;
  const fl=A.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=A.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  s.connect(fl);fl.connect(g);g.connect(SND.master);s.start(t,Math.random()*3);s.stop(t+dur+.05);};
SND.tone=function(t,f0,f1,dur,v,type){if(!live())return;const A=SND.ctx,o=A.createOscillator(),g=A.createGain();o.type=type||"sine";o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(SND.master);o.start(t);o.stop(t+dur+.02);};
/* a songbird: three to six quick rising and falling notes */
SND.bird=function(v){if(!live())return;const t=SND.ctx.currentTime+.02,n=3+(Math.random()*4|0),base=2400+Math.random()*1400;
  for(let i=0;i<n;i++){const t0=t+i*(.09+Math.random()*.05),f=base*(.85+Math.random()*.35);SND.tone(t0,f,f*(Math.random()<.5?1.35:.75),.07,.018*v);}};
/* a sheep: sawtooth through a band-pass, with a wobble (from chapter 1's «baa») */
SND.baa=function(v,lamb){if(!live())return;const A=SND.ctx,t=A.currentTime+.01,b=(lamb?390:250)*(.92+Math.random()*.16),o=A.createOscillator(),f=A.createBiquadFilter(),g=A.createGain(),l=A.createOscillator(),lg=A.createGain();
  o.type="sawtooth";o.frequency.setValueAtTime(b,t);o.frequency.linearRampToValueAtTime(b*.9,t+.55);l.frequency.value=7;lg.gain.value=b*.06;l.connect(lg);lg.connect(o.frequency);
  f.type="bandpass";f.frequency.value=1100;f.Q.value=1.3;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05*v,t+.05);g.gain.linearRampToValueAtTime(.035*v,t+.4);g.gain.exponentialRampToValueAtTime(.0001,t+.65);
  o.connect(f);f.connect(g);g.connect(SND.master);o.start(t);l.start(t);o.stop(t+.7);l.stop(t+.7);};
SND.snort=function(){if(!live())return;const t=SND.ctx.currentTime+.01;SND.burst(t,.35,{f:700,q:.6,v:.05,type:"lowpass"});SND.tone(t,140,90,.25,.02,"triangle");};
SND.step=function(soft){if(!live())return;SND.burst(SND.ctx.currentTime,.11,{f:soft?600:1500,q:.8,v:soft?.012:.018,type:"bandpass"});};
SND.hoof=function(a){if(!live())return;const t=SND.ctx.currentTime;SND.burst(t,.07,{f:320,q:.7,v:.03+.04*a,type:"lowpass"});SND.tone(t,150,70,.08,.03+.03*a,"sine");};
/* a khadag tied to the wish tree: two soft bell tones */
SND.chime=function(){if(!live())return;const t=SND.ctx.currentTime+.02;[[880,.0],[1318,.12],[1760,.26]].forEach(([f,d])=>{SND.tone(t+d,f,f*.995,1.6,.022,"sine");SND.tone(t+d,f*2.01,f*2,0.7,.006,"sine");});};
/* every frame: wind loudness, birds by day, the fire's crackle when you are near it */
SND.update=function(dt,s){if(!live())return;const A=SND.ctx,now=A.currentTime;
  const w=(s.inGer?.012:.05)*(.6+.8*s.wind)*(1+.35*Math.sin(now*.23)*Math.sin(now*.071));SND.windG.gain.setTargetAtTime(w,now,.5);
  SND.windF.frequency.setTargetAtTime(s.inGer?300:380+260*s.wind,now,.8);
  SND.birdT-=dt;if(SND.birdT<=0){SND.birdT=4+Math.random()*9;if(!s.inGer&&s.day>.3)SND.bird(s.day*(s.resting?.7:1));}
  const fire=Math.max(s.fireNear||0,s.inGer?.45:0);if(fire>.02){SND.crackT-=dt*(2+6*fire);if(SND.crackT<=0){SND.crackT=Math.random();SND.burst(now,.03+Math.random()*.05,{f:1800+Math.random()*2200,q:1.4,v:.035*fire});
    if(Math.random()<.25)SND.burst(now+.04,.18,{f:400,q:.6,v:.02*fire,type:"lowpass"});}}};
/* хөхүүрт айраг бүлэх: бүлүүр доош ороход гарах зөөлөн шалчигнах чимээ (v: 1 = жигд, бага = цалгисан) */
SND.slosh=function(v){if(!live())return;const t=SND.ctx.currentTime+.01,k=v||1;
  SND.burst(t,.22,{f:420+Math.random()*80,q:1.4,v:.05*k,type:"bandpass"});SND.burst(t+.05,.3,{f:900,q:3,v:.018*k,type:"bandpass"});
  SND.tone(t+.03,180,120,.18,.012*k,"sine");};
/* ааруул: тогоонд тараг хутгах — намуухан бурлих, хутгуур тогоонд хүрэх чимээ */
SND.stir=function(){if(!live())return;const t=SND.ctx.currentTime+.01;
  SND.burst(t,.35,{f:260+Math.random()*60,q:1.2,v:.03,type:"bandpass"});SND.tone(t+.05,110+Math.random()*30,80,.22,.01,"sine");
  if(Math.random()<.5)SND.tone(t+.12,420+Math.random()*120,300,.08,.006,"sine");};
