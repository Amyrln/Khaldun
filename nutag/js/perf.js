/* «Миний нутаг» — хэмжилт: FPS, frame ms, draw call, гурвалжин, GPU-д ачаалсан зураг ба буферийн хэмжээ, татсан MB, ачаалах хугацаа.
   WebGL context-ийг ороож тоолно; рендерерийн кодыг өөрчлөхгүй. */
"use strict";
const PERF={byProg:new Map(),lastProg:new Map(),calls:0,tris:0,frameCalls:0,frameTris:0,tex:0,buf:0,rb:0,fps:0,frames:0,fpsT:performance.now(),ms:[],marks:{},maxTex:0};
PERF.mark=k=>{if(PERF.marks[k]==null)PERF.marks[k]=Math.round(performance.now());};
(function(){
  const orig=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,opts){const gl=orig.call(this,type,opts);
    if(!gl||this.id!=="cv"||!/webgl/.test(type)||gl.__perf)return gl;gl.__perf=true;
    const tSize=new WeakMap(),bSize=new WeakMap(),rSize=new WeakMap(),bound={tex:null,buf:{},rb:null};
    const wrap=(name,fn)=>{const o=gl[name].bind(gl);gl[name]=function(){return fn(o,arguments);};};
    let prog=null;const acc=(n)=>{PERF.calls++;PERF.tris+=n;const e=PERF.byProg.get(prog)||{calls:0,tris:0};e.calls++;e.tris+=n;PERF.byProg.set(prog,e);};
    wrap("useProgram",(o,a)=>{prog=a[0];return o(...a);});
    wrap("drawArrays",(o,a)=>{acc(a[2]/3);return o(...a);});
    wrap("drawElements",(o,a)=>{acc(a[1]/3);return o(...a);});
    wrap("bindTexture",(o,a)=>{bound.tex=a[1];return o(...a);});
    const setT=(t,b)=>{if(!t)return;PERF.tex+=b-(tSize.get(t)||0);tSize.set(t,b);PERF.maxTex=Math.max(PERF.maxTex,PERF.tex);};
    wrap("texImage2D",(o,a)=>{let w,h;if(a.length>=9){w=a[3];h=a[4];}else{const s=a[5];w=s.naturalWidth||s.videoWidth||s.width;h=s.naturalHeight||s.videoHeight||s.height;}
      const bpp=a[a.length>=9?7:4]===gl.FLOAT?16:4;if(a[1]===0)setT(bound.tex,w*h*bpp);return o(...a);});
    wrap("generateMipmap",(o,a)=>{const t=bound.tex;if(t)setT(t,Math.round((tSize.get(t)||0)*4/3));return o(...a);});
    wrap("deleteTexture",(o,a)=>{setT(a[0],0);return o(...a);});
    wrap("bindBuffer",(o,a)=>{bound.buf[a[0]]=a[1];return o(...a);});
    wrap("bufferData",(o,a)=>{const b=bound.buf[a[0]],n=typeof a[1]==="number"?a[1]:(a[1]&&a[1].byteLength)||0;if(b){PERF.buf+=n-(bSize.get(b)||0);bSize.set(b,n);}return o(...a);});
    wrap("deleteBuffer",(o,a)=>{const b=a[0];if(b){PERF.buf-=bSize.get(b)||0;bSize.set(b,0);}return o(...a);});
    wrap("bindRenderbuffer",(o,a)=>{bound.rb=a[1];return o(...a);});
    wrap("renderbufferStorage",(o,a)=>{const r=bound.rb,n=a[2]*a[3]*2;if(r){PERF.rb+=n-(rSize.get(r)||0);rSize.set(r,n);}return o(...a);});
    wrap("deleteRenderbuffer",(o,a)=>{const r=a[0];if(r){PERF.rb-=rSize.get(r)||0;rSize.set(r,0);}return o(...a);});
    wrap("getExtension",(o,a)=>{const x=o(...a);if(x&&a[0]==="ANGLE_instanced_arrays"&&!x.__perf){x.__perf=true;const d=x.drawElementsInstancedANGLE.bind(x);
      x.drawElementsInstancedANGLE=(m,c,t,off,n)=>{acc(c/3*n);return d(m,c,t,off,n);};}return x;});
    PERF.reset=()=>{PERF.tex=0;PERF.buf=0;PERF.rb=0;};
    return gl;};
})();
PERF.frame=()=>{const now=performance.now();PERF.lastProg=PERF.byProg;PERF.byProg=new Map();PERF.frameCalls=PERF.calls;PERF.frameTris=PERF.tris;PERF.calls=0;PERF.tris=0;PERF.frames++;
  if(PERF.last)PERF.ms.push(now-PERF.last);if(PERF.ms.length>120)PERF.ms.shift();PERF.last=now;
  if(now-PERF.fpsT>=1000){PERF.fps=PERF.frames*1000/(now-PERF.fpsT);PERF.frames=0;PERF.fpsT=now;}};
PERF.download=()=>{let n=0,c=0;try{for(const e of performance.getEntriesByType("resource")){n+=e.transferSize||e.encodedBodySize||0;c++;}
  const nav=performance.getEntriesByType("navigation")[0];if(nav)n+=nav.transferSize||nav.encodedBodySize||0;}catch(e){}return {bytes:n,files:c};};
PERF.pct=p=>{const a=PERF.ms.slice().sort((x,y)=>x-y);return a.length?a[Math.min(a.length-1,Math.floor(a.length*p))]:0;};
PERF.snapshot=()=>{const d=PERF.download(),mem=performance.memory?performance.memory.usedJSHeapSize:null;
  return {fps:+PERF.fps.toFixed(1),msP50:+PERF.pct(.5).toFixed(1),msP95:+PERF.pct(.95).toFixed(1),drawCalls:PERF.frameCalls,triangles:Math.round(PERF.frameTris),
    gpuTexturesMB:+(PERF.tex/1048576).toFixed(1),gpuTexturesPeakMB:+(PERF.maxTex/1048576).toFixed(1),gpuBuffersMB:+(PERF.buf/1048576).toFixed(1),gpuRenderbuffersMB:+(PERF.rb/1048576).toFixed(1),
    downloadedMB:+(d.bytes/1048576).toFixed(2),files:d.files,jsHeapMB:mem?+(mem/1048576).toFixed(1):null,marks:Object.assign({},PERF.marks)};};
PERF.text=(extra)=>{const s=PERF.snapshot(),M=s.marks;
  return `FPS ${s.fps}   frame p50 ${s.msP50} ms · p95 ${s.msP95} ms\n`+
    `draw call ${s.drawCalls}   гурвалжин ${(s.triangles/1000).toFixed(0)}k\n`+
    `GPU зураг ${s.gpuTexturesMB} MB · буфер ${s.gpuBuffersMB} MB · бусад ${s.gpuRenderbuffersMB} MB\n`+
    `татсан ${s.downloadedMB} MB (${s.files} файл)`+(s.jsHeapMB!=null?`   JS ${s.jsHeapMB} MB`:"")+`\n`+
    `эхний зураг ${M.firstFrame!=null?(M.firstFrame/1000).toFixed(1)+" с":"—"} · бүрэн ${M.allReady!=null?(M.allReady/1000).toFixed(1)+" с":"—"}`+(extra?"\n"+extra:"");};
