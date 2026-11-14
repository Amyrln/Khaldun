/* «Миний нутаг» — Жалайрын 3D тоглоомын эхний prototype.
   world.js (Жалайрын өөрийн WebGL1 рендерер) дээр ажиллана. Энд: нутгийн байршил, хашаа, гадна гал, хонь хариулах,
   морь унах, галын дэргэдэх амралт, удирдлага, тохиргоо, хадгалалт, context сэргээх.
   Дүрэм: цаг хэмжихгүй, оноо байхгүй, хожигдохгүй, шагнал байхгүй, «Гарах» үргэлж харагдана. */
"use strict";
(()=>{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const cv=$("#cv"),SAVE=w3LoadSave();
/* гэрийн газар (map.js-д сонгосон): гэрийн доторх бүх цэг GX, GZ-ээр шилжинэ */
const GX=W3GERS[0][0],GZ=W3GERS[0][1];
/* гэр барьсан эсэх: шинэ тоглогч өөрөө барина; өмнө нь тоглож байсан хүний гэр хэвээр */
const GB=(()=>{const g=SAVE.ger;if(g&&typeof g==="object")return {built:!!g.built,spot:g.spot|0,stage:Math.max(0,Math.min(11,g.stage|0)),go:!!g.go};return {built:Object.keys(SAVE).length>0,spot:0,stage:0,go:false};})();
let FINE=false;try{FINE=matchMedia("(pointer:fine)").matches;}catch(e){}if(FINE)document.body.classList.add("fine");
const RM=(()=>{try{return matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){return false;}})();

/* ---------- нутгийн байршил (гэр 0,0-д, хаалга урагшаа +z, зүүн зүг +x) ---------- */
const FIRE=[4.7,7.0],SEAT=[5.75,8.55];
const PEN={x0:12.6,x1:17.6,z0:-12.2,z1:-8.0,gx0:14.25,gx1:15.95};          /* хашаа гэрийн зүүн хойно, 15 м зайтай (малчид хонины хашаагаа гэрийн зүүн хойно, салхи багатай газар барьдаг); хаалга нь урд хананд */
const GATE_IN=[(PEN.gx0+PEN.gx1)/2,PEN.z1-1.3],GATE_OUT=[(PEN.gx0+PEN.gx1)/2,PEN.z1+1.8];
const FENCE=[[PEN.x0,PEN.z0,PEN.x1,PEN.z0],[PEN.x1,PEN.z0,PEN.x1,PEN.z1],[PEN.x1,PEN.z1,PEN.gx1,PEN.z1],[PEN.gx0,PEN.z1,PEN.x0,PEN.z1],[PEN.x0,PEN.z1,PEN.x0,PEN.z0]];
const PASTURES=[[25,-3],[29,3],[23,-15],[31,-9],[27,14],[21,19]];
/* хашааны дотор хонь гишгэж, идээд өвс намхан/шороотой — өндөр өвсөнд хэвтсэн хонь «живж» харагдахгүй */
{const cx=(PEN.x0+PEN.x1)/2,cz=(PEN.z0+PEN.z1)/2;for(const [dx,dz] of [[-1.35,-1.05],[1.35,-1.05],[-1.35,.85],[1.35,.85],[0,0],[0,2.7]])W3BARE.push([cx+dx,cz+dz,1.55]);}

/* ---------- өдөр бүрийн жижиг өөрчлөлт: өдрийн тогтмол санамсаргүй тоо (нэг өдөр дахин орвол адилхан) ---------- */
const dkey=d=>d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();
function dayPlan(k){const r=chRng(k*7919+17),idx=[0,1,2,3,4,5].map(i=>[i,r()]).sort((a,b)=>a[1]-b[1]).map(a=>a[0]);return {past:idx,wind:.8+r()*.45,cloud:.85+r()*.35,horse:r()};}
const DAY=(()=>{const T=dayPlan(dkey(new Date())),Y=dayPlan(dkey(new Date(Date.now()-864e5)));
  T.spots=T.past.filter(i=>i!==Y.past[0]).slice(0,2).map(i=>PASTURES[i]);return T;})();   /* өчигдрийн бэлчээрийг давтахгүй */

/* ---------- төлөв ---------- */
const G={on:false,W:null,P:null,cam:{pos:CAM0.slice(),yaw:0,pitch:0},look:null,drag:null,mv:{f:0,s:0},keys:{},sm:{f:0,s:0},tw:[],
  ride:null,glide:null,inGer:false,horseBase:null,horseRy:.15,horseRun:0,hx:null,hz:null,eye:CAM0[1]-w3H(CAM0[0],CAM0[2]),
  t0:0,lt:0,tsec:0,flock:null,rest:null,tod:(SAVE.todV===3&&["cycle","dawn","day","night"].includes(SAVE.tod)&&SAVE.tod)||"cycle",cycT:0,snd:SAVE.sound!==false,showPerf:!!SAVE.perf,ready:{},act:null,lost:false,exiting:false};
window.__nutag={G,PERF,DAY,W3MAP,W3GRASS,W3WISH};   /* туршилтын скрипт уншина */
/* эхлэх байрлал: хадгалсан байрлал хөндий дотор байвал тэндээс, эс бөгөөс гэрийн өмнөөс */
function startPos(){const p=SAVE.pos;if(p&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&W3MAP.inside(p[0],p[1]))return {x:p[0],z:p[1],yaw:SAVE.yaw||0,saved:true};
  const L=yp(CAM0,[0,1.4,0]);return {x:CAM0[0],z:CAM0[2],yaw:L.yaw,pitch:L.pitch,saved:false};}
const START=startPos();
let KHADAG=Array.isArray(SAVE.khadag)?SAVE.khadag.filter(i=>Number.isInteger(i)&&i>=0&&i<10).slice(-24):[];W3WISH.S.khadag=KHADAG;

/* ---------- тэнгэр: 30 минутын өдөр ----------
   Тоглоом нар жаргаж буйгаар эхэлнэ. Дараа нь: орой (нар жаргаад, бүрэнхий, шөнө — од, сүүн зам) 10 мин → өглөө (нар мандах) 10 мин → өдөр 10 мин → дахин нар жаргана.
   Тохиргоо: Солигдоно (энэ эргэлт) / Өглөө / Өдөр / Орой (харанхуй шөнө, од) — сонгосон цаг тогтмол байна. */
Object.assign(SKY3.sunset,{zen:hex("#2E3A70"),hor:hex("#F39A6B"),fog:hex("#D9A48F"),lc:hex("#F7B67E"),sky:hex("#8384AC"),gnd:hex("#57493A"),
  dir:sunDir(210,6),sunC:hex("#FFB474"),fogR:[36,370],cloud:.55,ray:.5,wind:.045,glow:1,photo:.22});
/* нар тэнгэрийн хаяанд хүрэх агшин: ягаан улбар шар туяа хамгийн тод */
SKY3.sunset2=Object.assign({},SKY3.sunset,{zen:hex("#272C62"),hor:hex("#F0866A"),fog:hex("#C98F88"),lc:hex("#F29560"),sky:hex("#6F6C9A"),gnd:hex("#463D34"),
  dir:sunDir(214,1.2),sunC:hex("#FF9A5E"),fogR:[32,340],cloud:.6,ray:.35,glow:1,photo:.1});
/* шөнө: бүр харанхуй, сарны бүдэг хөх гэрэл, од тод харагдана */
Object.assign(SKY3.night,{zen:hex("#03081A"),hor:hex("#122348"),fog:hex("#0C1730"),lc:hex("#51648F"),sky:hex("#152542"),gnd:hex("#0A0F19"),fogR:[16,210],cloud:.18});
const CYC=2400;   /* өглөө 15 мин, өдөр (оройтой) 15 мин, шөнө 10 мин */   /* секунд: 30 минут */
const CYCKEYS=[[0,"sunset"],[90,"sunset2"],[170,"dusk"],[260,"night"],[700,"night"],[790,"dawn"],[920,"dawnday"],[1250,"morning"],[1690,"day"],[2150,"day"],[2290,"day2"],[2400,"sunset"]];
const SK=k=>k==="dusk"?skyMix(SKY3.sunset2,SKY3.night,.5):k==="dawnday"?skyMix(SKY3.dawn,SKY3.day,.4):k==="morning"?skyMix(SKY3.dawn,SKY3.day,.78):skyMix(SKY3[k],SKY3[k],0);
const TODS=["cycle","dawn","day","night"];
function envAt(u){u=((u%CYC)+CYC)%CYC;let i=0;while(i<CYCKEYS.length-2&&CYCKEYS[i+1][0]<=u)i++;const a=CYCKEYS[i],b=CYCKEYS[i+1];return skyMix(SK(a[1]),SK(b[1]),ss3(0,1,(u-a[0])/(b[0]-a[0])));}
function envNow(){let e;
  if(G.tod==="dawn")e=skyMix(SKY3.dawn,SKY3.day,.22);else if(G.tod==="day")e=SK("day");else if(G.tod==="night")e=SK("night");else e=envAt(G.cycT||0);
  e.wind*=DAY.wind;e.cloud=Math.min(.8,e.cloud*DAY.cloud);return e;}
for(const k in SKY3)if(SKY3[k])SKY3[k].ray=0;   /* тэнгэрт босоо гэрлийн зурвас гаргахгүй */
window.__nutag.envAt=envAt;window.__nutag.CYC=CYC;

/* ---------- шинэ жижиг загварууд: хашаа, гадна гал (кодоор, Жалайрын өнгөөр) ---------- */
function fenceGeo(){const g=new Geo(203),C=W3C,post=(x,z,thick)=>g.at([x,w3H(x,z)-.05,z],{ry:g.r()*.6},q=>q.cyl(thick?.075:.055,thick?.065:.045,thick?1.2:1.05,7,g.r()<.5?C.wood:C.wood2,true,.05));
  const rail=(ax,az,bx,bz,y)=>{const mx=(ax+bx)/2,mz=(az+bz)/2,L=Math.hypot(bx-ax,bz-az),ry=-Math.atan2(bz-az,bx-ax),h=(w3H(ax,az)+w3H(bx,bz))/2;
    g.at([mx,h+y,mz],{ry,rz:(g.r()-.5)*.03},q=>q.box(L+.08,.07,.05,C.wood));};
  for(const [ax,az,bx,bz] of FENCE){const L=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.round(L/1.25));
    for(let i=0;i<=n;i++){const k=i/n,x=ax+(bx-ax)*k,z=az+(bz-az)*k;post(x,z,Math.abs(z-PEN.z1)<.01&&(Math.abs(x-PEN.gx0)<.01||Math.abs(x-PEN.gx1)<.01));}
    [.42,.82].forEach(y=>rail(ax,az,bx,bz,y));}
  return g;}
function fireBaseGeo(){const g=new Geo(204),C=W3C,[fx,fz]=FIRE,y0=w3H(fx,fz);
  g.at([fx,y0+.005,fz],{},q=>q.cyl(.44,.44,.012,20,[.16,.14,.13],true));                        /* үнс */
  for(let i=0;i<11;i++){const a=i/11*Math.PI*2+g.r()*.2,r=.5+g.r()*.04,s=.09+g.r()*.04;g.at([fx+Math.cos(a)*r,y0+.03,fz+Math.sin(a)*r],{ry:g.r()*3,s:[s*1.35,s*.75,s]},q=>q.sph(1,9,g.r()<.5?C.rock:C.rock2,.1));}
  [0,2.1,4.2].forEach((a,i)=>g.at([fx,y0+.06,fz],{ry:a,rz:Math.PI/2-.5},q=>q.at([0,-.3,0],{},w=>w.cyl(.04,.032,.6,7,i%2?C.wood2:C.dark,true))));
  g.at([fx+1.15,y0,fz-.45],{ry:.4},q=>{[[-.05,.045],[.05,.045],[0,.12]].forEach(([z,y])=>q.at([0,y,z],{rz:Math.PI/2},w=>w.at([0,-.27,0],{},v=>v.cyl(.045,.04,.54,7,C.wood,true))));}); /* түлээ */
  return g;}
/* зэл: хоёр гадас, урт олс, унагыг уях богино олс; дэргэд нь модон хувин */
function zelGeo(){const g=new Geo(207),C=W3C,up=[0,1,0],rc=[.58,.48,.34];
  [ZEL_A,ZEL_B].forEach(([x,z])=>g.at([x,w3H(x,z)-.05,z],{ry:g.r()},q=>q.cyl(.06,.05,1.08,7,C.wood2,true,.05)));
  const line=(a,b,sag,n)=>{for(let i=0;i<n;i++){const u0=i/n,u1=(i+1)/n,P=u=>[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u-Math.sin(u*Math.PI)*sag,a[2]+(b[2]-a[2])*u];const p0=P(u0),p1=P(u1);
    g.vx(p0,up,rc,0);g.vx(p1,up,rc,0);g.vx([p0[0],p0[1]-.03,p0[2]],up,rc,0);g.vx(p1,up,rc,0);g.vx([p1[0],p1[1]-.03,p1[2]],up,rc,0);g.vx([p0[0],p0[1]-.03,p0[2]],up,rc,0);}};
  const ya=w3H(ZEL_A[0],ZEL_A[1])+.98,yb=w3H(ZEL_B[0],ZEL_B[1])+.98;line([ZEL_A[0],ya,ZEL_A[1]],[ZEL_B[0],yb,ZEL_B[1]],.22,18);
  FOALS.forEach(([fx,fz],i)=>{const u=i?.68:.32,rx=ZEL_A[0]+ZDIR[0]*ZDIR[2]*u,rz=ZEL_A[1]+ZDIR[1]*ZDIR[2]*u,ry=ya+(yb-ya)*u-Math.sin(u*Math.PI)*.22,
    hx=rx+(fx-rx)*.55,hz=rz+(fz-rz)*.55;line([rx,ry,rz],[hx,w3H(hx,hz)+.82,hz],.08,6);});
  return g;}
function flameGeo(core){const g=new Geo(core?206:205);
  const L=core?[[0,0,.06,.3,[1,.86,.45]],[.03,.02,.035,.2,[1,.96,.75]],[-.025,-.02,.04,.22,[1,.9,.55]]]
    :[[0,0,.1,.44,[1,.45,.1]],[.08,.04,.065,.33,[1,.5,.12]],[-.07,-.03,.07,.36,[1,.42,.08]],[.02,-.08,.055,.27,[1,.58,.16]],[-.035,.075,.05,.25,[1,.62,.2]]];
  L.forEach(([x,z,r,h,c])=>g.at([x,0,z],{rz:(g.r()-.5)*.3,rx:(g.r()-.5)*.3},q=>q.cyl(r,0,h,7,c,false,.08)));
  if(!core)g.at([0,.012,0],{},q=>q.cyl(.3,.3,.008,16,[.85,.22,.05],true));return g;}
/* ---------- ертөнцийг алхам алхмаар бүтээх (утас гацахгүйн тулд) ---------- */
function sceneSteps(W,P){let M;return [
  ()=>{M=w3World(!W.gr);},
  ()=>{P.m={};P.m.sky=w3Mesh(W,M.sky,{sky:1,nofog:1});P.m.terrain=w3Mesh(W,M.terrain,{tex:.5,sheen:1,brush:1,brushS:1.6});if(!W.gr)P.m.grass=w3Mesh(W,M.grass,{tex:.2});},
  ()=>{const p=G.started?[G.cam.pos[0],G.cam.pos[2]]:[START.x,START.z];W3GRASS.init(W,p[0],p[1],"near");W3GRASS.init(W,p[0],p[1],"far");},
  ()=>{const m=P.m;m.flowers=w3Mesh(W,M.flowers,{flip:0});m.props=w3Mesh(W,M.props,{cast:1,tex:.6,brush:.9,brushS:4});m.gerOld=w3Mesh(W,M.gerOld,{cast:1,tex:.6,brush:.9,brushS:4});
    m.tree=w3Mesh(W,M.tree,{tex:.6,brush:1,brushS:2.2});m.tree.on=false;   /* хүүхэлдэйн модны оронд жижиг бургаснууд (W3WISH) */m.glow=w3Mesh(W,M.glow,{emit:1,on:false});
    m.clouds=M.clouds.map(c=>({mesh:w3Mesh(W,c.g,{cld:1,nofog:1,brush:1,brushS:.22}),yaw:c.yaw,d:c.d,y:c.y}));
    P.hz=w3HorseMeshes(W,M.horse);P.horseBase=[-5.6,w3H(-5.6,3.65)+landLift(-5.6,3.65),3.65];w3HorsePose(P.hz,M4.trs(P.horseBase,{ry:.15}),null,0);
    m.puffs=Array.from({length:10},()=>w3Mesh(W,M.puff,{emit:.35,alpha:.5}));m.fpuffs=Array.from({length:7},()=>w3Mesh(W,M.puff,{emit:.25,alpha:.4}));
    const PD=w3Pond();m.water=w3Mesh(W,PD.water,{water:1});m.pond=w3Mesh(W,PD.deco,{flip:0,tex:.3,brush:.5,brushS:5});m.herd=w3Mesh(W,M.herd,{tex:.1,brush:.6,brushS:5});
    const BG=w3Butterfly(),BC=["#F4F1E8","#F2D04A","#E98A3A","#86A8EA","#F1E2A0","#F4F1E8","#E98A3A"];
    P.bf=BC.map((h,i)=>({m:w3Mesh(W,BG,{flip:0,tint:hex(h)}),a:i/7*Math.PI*2+.4,r:3+(i%3)*2.2,ph:i*1.73,c:CAM0}));
    ["#86A8EA","#F4F1E8","#F2D04A"].forEach((h,i)=>P.bf.push({m:w3Mesh(W,BG,{flip:0,tint:hex(h)}),a:i*2.1+.9,r:4+i*1.6,ph:i*2.3+.4,c:[W3WISH.X,0,W3WISH.Z]}));
    /* Хүслийн мод орчим: холоос харагдах мод, овоо, чулуу, цэцэг, хадаг (бургас ачаалагдмагц уягдана) */
    {const D=W3MAP.decor();m.wtTree=w3Mesh(W,D.tree,{tex:.6,brush:1,brushS:2.2});m.wtProps=w3Mesh(W,D.props,{cast:1,tex:.6,brush:.9,brushS:4});
     m.wtFlowers=w3Mesh(W,D.flowers,{flip:0});P.eagles=[0,1].map(i=>({m:w3Mesh(W,D.bird,{flip:0,tex:.1}),ph:i*2.9,dir:i?-1:1}));m.khadag=w3Mesh(W,new Geo(1),{tex:.12,brush:.2,brushS:3,emit:.2,on:false});m.khadag.on=false;W3WISH.reset();}
    m.inner=w3Mesh(W,M.inner,{cast:1,tex:.35,brush:.45,brushS:6,emit:.24,tint:[1.04,.98,.9]});m.fire=w3Mesh(W,M.fire,{emit:1,flip:0});
    m.aarR=w3Mesh(W,M.aarRack,{cast:1,tex:.4});m.aarP=w3Mesh(W,M.aarPlate,{tex:.4,emit:.2});
    /* шинэ: хашаа, гадна гал */
    m.fence=w3Mesh(W,fenceGeo(),{cast:1,tex:.7,brush:.9,brushS:4});
    m.zel=w3Mesh(W,zelGeo(),{cast:1,tex:.6,brush:.8,brushS:4});m.press=w3Mesh(W,pressGeo(),{cast:1,tex:.5,brush:.6,brushS:5});m.press.on=false;m.gift=w3Mesh(W,giftGeo(),{tex:.3,brush:.3,brushS:5,emit:.12});m.gift.on=false;m.gate=w3Mesh(W,gateGeo(),{cast:1,tex:.7,brush:.9,brushS:4});m.potL=w3Mesh(W,potLiqGeo(),{tex:.15,brush:.2,brushS:5,sheen:.35});m.potC=w3Mesh(W,potCurdGeo(),{tex:.2,brush:.3,brushS:5});m.potL.on=m.potC.on=false;
    m.pail=w3Mesh(W,pailGeo(),{cast:1,tex:.5,brush:.6,brushS:5});m.arag=w3Mesh(W,aragGeo(),{cast:1,tex:.5,brush:.6,brushS:5});m.aragFill=w3Mesh(W,aragFillGeo(),{tex:.4,brush:.5,brushS:5});
    m.wbowl=w3Mesh(W,wbowlGeo(),{tex:.3,brush:.3,brushS:5,emit:.1});m.door=w3Mesh(W,doorGeo(),{cast:1,tex:.35,brush:.45,brushS:5,emit:.06});m.wwater=w3Mesh(W,discGeo("#86B6DC"),{tex:.1,sheen:.5,emit:.12});m.vases=w3Mesh(W,vaseFillGeo(),{tex:.2,brush:.3,brushS:5,emit:.1,m:M4.T(GX,0,GZ)});
    m.cups=w3Mesh(W,cupsGeo(),{tex:.3,brush:.3,brushS:5,emit:.1});m.cupsA=w3Mesh(W,cupsFillGeo(),{tex:.1,emit:.12});m.argal=w3Mesh(W,new Geo(1),{tex:.4,brush:.6,brushS:5});m.argal.on=false;
    m.stream=w3Mesh(W,streamGeo(),{water:1});
    {const sp=new Geo(238);sp.sph(1,18,hex("#FFFFFF"),0);m.wAura=w3Mesh(W,sp,{emit:1,alpha:.3,nofog:1,flip:0,on:false});m.wAura2=w3Mesh(W,orbsGeo(),{emit:1,alpha:.5,nofog:1,flip:0,on:false});
     m.wStars=w3Mesh(W,starsGeo(),{emit:1,alpha:.95,nofog:1,flip:0,on:false});m.spl=w3Mesh(W,new Geo(1),{});m.spl.on=false;m.splSpot=w3Mesh(W,new Geo(1),{alpha:.8});m.splSpot.on=false;m.gbMark=[0,1,2].map(k=>w3Mesh(W,gbMarkGeo(k),{cast:1,tex:.5,brush:.6,brushS:5}));m.gbRing=[0,1,2].map(k=>w3Mesh(W,gbRingGeo(k),{emit:1,alpha:.3,nofog:1,flip:0}));P.streaks=[0,1,2].map(()=>({m:w3Mesh(W,streakGeo(),{emit:1,alpha:.9,nofog:1,flip:0,on:false})}));}
    m.sur=w3Mesh(W,surGeo(),{cast:1,tex:.5,brush:.6,brushS:5});m.shootLine=w3Mesh(W,lineGeo(),{tex:.4,brush:.5,brushS:5});m.range=w3Mesh(W,rangeGeo(),{tex:.6,brush:.5,brushS:3});m.arrow=w3Mesh(W,arrowGeo(),{cast:1,tex:.3,on:false});
    m.stuck=w3Mesh(W,new Geo(1),{tex:.3,on:false});G.stuckDirty=true;m.shMat=w3Mesh(W,shMatGeo(),{tex:.5,brush:.6,brushS:5,emit:.05,on:false});m.trough=w3Mesh(W,troughGeo(),{cast:1,tex:.5,brush:.6,brushS:5});m.fireBase=w3Mesh(W,fireBaseGeo(),{cast:1,tex:.5,brush:.8,brushS:5});
    m.flame=w3Mesh(W,flameGeo(false),{emit:1,flip:0,brush:.2,alpha:.92});m.flame2=w3Mesh(W,flameGeo(true),{emit:1.3,flip:0,brush:0,alpha:.9});
    /* сүрэг: 8–10 хонь, 2 хурга */
    const o={cast:1,tex:.1,brush:.6,brushS:5,on:false},base=[w3Mesh(W,M.sheepG[0],o),w3Mesh(W,M.sheepG[1],o)];
    if(!G.flock)G.flock=makeFlock(W3Q.sheep);
    P.flock=G.flock;P.flock.forEach((a,i)=>{const mm=Object.assign({},base[i%2],{on:true,m:M4.trs([a.x,w3H(a.x,a.z),a.z],{ry:a.ry,s:a.sc})});W.meshes.push(mm);a.m=mm;a.k=null;});},
  ()=>{M=null;w3GerAttach(W,P);w3HorseAttach(W,P);w3SheepAttach(W,P);w3LandAttach(W);w3SkyAttach(W);}];}
function makeFlock(n){const r=chRng(dkey(new Date())+5),F=[];
  for(let i=0;i<n;i++){const sp=DAY.spots[i%2],a=r()*6.283,d=.8+r()*3.4,x=sp[0]+Math.cos(a)*d,z=sp[1]+Math.sin(a)*d;
    F.push({i,x,z,ry:r()*6.283,st:0,t:1+r()*4,tx:x,tz:z,ph:i*1.7,wk:0,sc:.94+r()*.12,lamb:false,mode:"meadow",home:[x,z],off:[(r()-.5)*5,(r()-.5)*4],sp:.3,baaT:10+r()*30});}
  [0,3].forEach((mi,j)=>{const m=F[mi];F.push({i:n+j,x:m.x+.9,z:m.z+.6,ry:m.ry,st:0,t:1,tx:m.x,tz:m.z,ph:(n+j)*1.7+.5,wk:0,sc:.6,lamb:true,mom:m,mode:"meadow",home:m.home,sp:.3,baaT:6+r()*20});});
  return F;}

/* ---------- мөргөлдөөн: хашаа, гадна гал, хонь (хүн хонины биеэр нэвтрэхгүй) ---------- */
function segPush(x,z,s,r){const [ax,az,bx,bz]=s,dx=bx-ax,dz=bz-az,L2=dx*dx+dz*dz;let k=((x-ax)*dx+(z-az)*dz)/L2;k=Math.max(0,Math.min(1,k));
  const px=ax+dx*k,pz=az+dz*k,ex=x-px,ez=z-pz,d=Math.hypot(ex,ez);if(d<r){if(d>1e-4){x=px+ex/d*r;z=pz+ez/d*r;}else{const nl=Math.sqrt(L2);x=px-dz/nl*r;z=pz+dx/nl*r;}}return [x,z];}
/* хашааны хаалга: нугас нь баруун талын шонд, гадагшаа (урагш) аажуухан нээгдэнэ. Хаалттай үед хонь, хүн нэвтрэхгүй */
const GATE={a:1,want:1},gateRy=()=>{const k=GATE.a*GATE.a*(3-2*GATE.a);return Math.PI*(1+.96*k);};   /* нугас зүүн шонд; нээхэд гадагшаа эргэж хашаа дагуу хэвтэнэ */
function gateSeg(){const ry=gateRy(),L=PEN.gx1-PEN.gx0;return [PEN.gx1,PEN.z1,PEN.gx1+Math.cos(ry)*L,PEN.z1-Math.sin(ry)*L];}
function gateGeo(){const g=new Geo(211),C=W3C,L=PEN.gx1-PEN.gx0;
  [.06,L-.06].forEach(x=>g.at([x,.02,0],{},q=>q.cyl(.045,.045,1.0,7,C.wood2,true,.05)));[.3,.62,.9].forEach(y=>g.at([L/2,y,0],{},q=>q.box(L-.04,.07,.045,C.wood)));
  g.at([L/2,.6,0],{rz:Math.atan2(.6,L-.2)},q=>q.box(Math.hypot(L-.2,.6),.06,.04,C.wood2));return g;}
function fenceCollide(x,z,r){for(const s of FENCE)[x,z]=segPush(x,z,s,r);return segPush(x,z,gateSeg(),r);}
/* сүргийн өдрийн хэсэг: өглөө-өдөр бэлчинэ, орой гэрийн зүг ойртоно, шөнө амарна */
const EVE=[GATE_OUT[0],GATE_OUT[1]+6.8],MEAD=[26,2],DRIFT=(()=>{const a=chRng(dkey(new Date())+11)()*6.283;return [Math.cos(a),Math.sin(a)];})();
function flockPhaseAt0(){if(G.tod==="night")return "night";if(G.tod!=="cycle")return "day";return "eve";}
function flockPhase(){if(G.tod==="night")return "night";if(G.tod!=="cycle")return "day";const u=((G.cycT%CYC)+CYC)%CYC;return u>=2250||u<260?"eve":u<790?"night":"day";}
function penAll(){const F=G.flock;if(!F)return;let k=0;for(const a of F){if(a.lamb)continue;const c=k%4,r=Math.floor(k/4);k++;
    a.x=PEN.x0+.95+c*((PEN.x1-PEN.x0-1.9)/3)+(Math.random()-.5)*.3;a.z=PEN.z0+.9+r*1.15+(Math.random()-.5)*.3;a.mode="pen";a.st=0;a.t=1+Math.random()*4;a.penT=G.tsec||0;a.calm=0;}
  for(const a of F)if(a.lamb){a.x=Math.min(PEN.x1-.5,a.mom.x+.6);a.z=Math.min(PEN.z1-.5,a.mom.z+.5);a.mode="pen";}G.allIn=true;G.gateAuto=0;}   /* шөнийн эхлэл: мэдэгдэлгүй */
function releaseFlock(){const F=G.flock.filter(s=>!s.lamb&&s.mode==="pen").sort((a,b)=>Math.hypot(a.x-GATE_IN[0],a.z-GATE_IN[1])-Math.hypot(b.x-GATE_IN[0],b.z-GATE_IN[1]));
  F.forEach((s,i)=>{const sp=DAY.spots[i%2];s.home=[sp[0]+(Math.random()-.5)*4,sp[1]+(Math.random()-.5)*4];startLeave(s,.8+i*2.1);});return F.length;}
/* ---------- айраг: зэл, унага, гэрийн хөхүүр ----------
   Эх сурвалж (хэрэглэгчийн өгсөн): «Хоёр гадсанд урт зэл татаж, унагыг барин уях бөгөөд гүү саахдаа унагыг нэг хүн татаж, өөр нэг хүн саана» (Рубрук, XIII зуун);
   зун саамаа хийнгүүт 5000–7000 удаа жигд хэмээр, цалгиулахгүй бүлнэ; сайн бүлсэн айраг 7–8 цагт исэнэ; бүлээд шаагиа зогстол хөдөлгөхгүй;
   өглөө гүүгээ барьж өдөрт 6–8 удаа саана, орой нар жаргахад гүүгээ тавьж адуугаа бэлчээнэ. Тоглоомд айраг уухгүй — зөвхөн хийх, аягалах. */
const ZEL_A=[-24.5,5.5],ZEL_B=[-18.2,8.6],ZEL=[...ZEL_A,...ZEL_B],ZDIR=(()=>{const dx=ZEL_B[0]-ZEL_A[0],dz=ZEL_B[1]-ZEL_A[1],l=Math.hypot(dx,dz);return [dx/l,dz/l,l];})();
const FOALS=[.32,.68].map(u=>{const x=ZEL_A[0]+ZDIR[0]*ZDIR[2]*u-ZDIR[1]*1.35,z=ZEL_A[1]+ZDIR[1]*ZDIR[2]*u+ZDIR[0]*1.35;return [x,z,Math.atan2(ZDIR[0],ZDIR[1])];});
const KH=[-2.05+GX,1.85+GZ],KHS=[-1.05+GX,1.0+GZ],PAIL=[ZEL_A[0]+.7,ZEL_A[1]+.9],FERM=562;   /* хөхүүр: гэрийн загварт аль хэдийн байгаа ширэн хөхүүр (баруун тал, үүдний дэргэд); исэх 7.5 цаг = тоглоомын 562 сек (30 мин = 24 цаг) */
let AIR=Object.assign({ph:"churn",n:0,t0:0,done:0},SAVE.airag||{}),MILK=!!SAVE.milk;
/* барьж явах зүйл: гарт нэг (хувин / саамтай хувин), нуруундаа араг (аргалтай). Доод жижиг хайрцагт зураг нь харагдана */
const INV=Object.assign({hand:MILK?"pail_milk":null,arag:false,argal:6,jar:0,bowls:0,chest:{}},SAVE.inv||{});
function airSave(){MILK=INV.hand==="pail_milk";w3Save({airag:AIR,milk:MILK,inv:INV});}
function zelOpen(){if(G.tod==="night")return false;if(G.tod!=="cycle")return true;const u=((G.cycT%CYC)+CYC)%CYC;return u>=800&&u<2390;}
/* ---------- ааруул: гэрийн тулган дээр тараг буцалгах → аарцаа уутанд хийж банз, чулуугаар дарах → зүсэх / хэвлэх / базах → тавиур дээр нар салхинд хатаах → хураах ----------
   Эх сурвалж (вэб): тарагийг зөөлөн гал дээр тасралтгүй хутгаж 20–30 мин буцалгана; хөргөөд даавуун уутанд шар усыг нь шүүнэ; хоёр хавтгай чулуу, банзны хооронд
   хүнд зүйлээр 10 гаруй цаг дарна; шахагдаж хэвшсэн аарцыг нарийн утсаар зүсэх, хэвэнд шахах, гараар базах; модон тавиур эсвэл гэрийн дээвэр дээр нар салхинд
   хэдэн өдөр (7–14 хоног) хатаана. Тавиур, ширээн дээрх таваг нь анхны Жалайр аппынх. */
const RACK=[5.1,1.9],PRESS=[6.2,2.5],PRESS_T=90,SUN_T=60,BOIL_T=20;   /* хүүхдэд зориулж богиносгосон: шахах 90 сек, наранд хатаах 60 сек (жинхэнэдээ 10+ цаг, 7–14 хоног) */
const ASTY={zuss:{n:24,per:3,b:"Зүсэх",tip:"Нарийн утсаар аарцаа нимгэн зүснэ. Товчийг дарах бүрт гурван ширхэг."},
  khev:{n:21,per:3,b:"Шахах",tip:"Аарцнаас бага багаар авч, хээтэй модон хэвэнд дарж гаргана."},
  baz:{n:18,per:2,b:"Базах",tip:"Аарцнаас атгаж аваад алган дээрээ базна. Хурууны мөр нь үлдэнэ."}};
let AARU=Object.assign({r:{st:"dry",sty:"orig",sun:0,n:18},p:{ph:"idle",t0:0},bk:0,made:0,basket:{}},SAVE.aaruul||{});AARU.basket=AARU.basket||{};
const ANAME={orig:"Шоо",zuss:"Зүсмэл",khev:"Хэвтэй",baz:"Базмал"},AFACT_EAT=["Ам амттай! Ааруул кальци ихтэй тул яс, шүдийг бэхжүүлнэ.","Монголчууд эрт дээр үеэс ааруулыг аянд авч явдаг байжээ. Удаан хадгалагддаг.",
  "Хатуу ааруулыг удаан зажилбал эрүү чангарч, анхаарал төвлөрдөг.","Ааруул уураг ихтэй, удаан цадна. Завсарлагаар идэхэд тохиромжтой.","Нэг, хоёр ширхэг хангалттай! Ус уухаа мартуузай."];   /* анхны Жалайр аппын AAR_FACTS */
const STOVE={fuel:+SAVE.stoveFuel||0,k:0};   /* тулгын гал: түлш (сек), гэрэлтэлт 0..1 */
const bkTotal=()=>Object.values(AARU.basket).reduce((a,b)=>a+(b||0),0);
function aaruSave(){w3Save({aaruul:AARU});}
function sunUp(){const e=G.env;return !!e&&(e.night||0)<.5&&e.dir[1]>.02;}
function aarRackGeo(sty,n){if(sty==="orig")return w3AaruulRack(n);const g=new Geo(57),R=chRng(57),C=W3C.cream,cols=sty==="zuss"?8:sty==="khev"?7:6;
  g.at([RACK[0],w3H(RACK[0],RACK[1]),RACK[1]],{ry:-.5},q=>{for(let i=0;i<n;i++){const x=-.46+(i%cols)*(.92/(cols-1)),z=-.2+Math.floor(i/cols)*.2;
    if(sty==="zuss")q.at([x,.775,z],{ry:(R()-.5)*.2},w=>w.box(.03,.02,.13,C));
    else if(sty==="khev")q.at([x,.762,z],{ry:R()*6},w=>{w.cyl(.042,.04,.024,10,C,true);w.at([0,.026,0],{},v=>{v.box(.05,.004,.008,W3C.felt2);v.box(.008,.004,.05,W3C.felt2);});});
    else q.at([x+(R()-.5)*.03,.778,z+(R()-.5)*.03],{ry:R()*3,s:[1.5+R()*.3,.55,.75]},w=>w.sph(.04,8,C,.06));}});
  return g;}
/* аарц шахах: доод банз, аарцтай даавуун уут, дээд банз, хүнд чулуу — тавиурын зүүн талд */
function pressGeo(){const g=new Geo(58),C=W3C;g.at([PRESS[0],w3H(PRESS[0],PRESS[1]),PRESS[1]],{ry:-.5},q=>{q.at([0,.03,0],{},w=>w.box(.62,.06,.5,C.wood2));
    q.at([0,.1,0],{s:[1.35,.42,1.05]},w=>w.sph(.2,12,hex("#EFE9DC"),.05));q.at([0,.19,0],{},w=>w.box(.56,.045,.44,C.wood));
    q.at([.02,.3,-.02],{ry:.7,s:[1.25,.75,1]},w=>w.sph(.15,10,C.rock,.12));});return g;}
/* тулган дээрх тогоо (гэрийн загварынх): тараг хутгахад бага багаар дүүрч, дээр нь ээдэм тунаж харагдана.
   тогооны дотор ёроол ~0.30 м, амсар 0.49 м (радиус 0.31); тогооны доторх загварын бараан хавтгайг (0.44 м) энэ үед нууна */
const POT={y0:.34,y1:.51,r:y=>(.22+(y-.34)*(.31-.22)/(.53-.34))*.95};   /* гэрийн загвар +0.04 м өргөгдсөн */
function potLiqGeo(){const g=new Geo(213);g.at([0,-.003,0],{},q=>q.cyl(1,1,.006,28,hex("#F3EFE4"),true,.01));return g;}
function potCurdGeo(){const g=new Geo(214),R=chRng(214),C=hex("#FFFDF6");for(let i=0;i<16;i++){const a=R()*6.283,d=Math.sqrt(R())*.78,s=.07+R()*.08;
    g.at([Math.cos(a)*d,-.004,Math.sin(a)*d],{ry:R()*3,s:[s*(1+R()*.6),s*.45,s]},q=>q.sph(1,8,C,.06));}return g;}
function potStep(t){const P=G.P.m;if(!P.potL)return;if(G.potW!==G.W||!G.potDisc){G.potW=G.W;G.potDisc=(G.W.gerParts||[]).find(m=>m.gst==="broth")||null;}
  const k=G.boil?G.boil.k:G.bag?(G.bag.st===1?1-G.bag.k*.97:0):(AARU.p.ph==="idle"?AARU.bk||0:0),on=k>.02;P.potL.on=on;
  const D=G.potDisc;if(D){if(!D.m0)D.m0=D.m;D.m=on?(D.mDown||(D.mDown=M4.mul(D.m0,M4.T(0,-.2,0)))):D.m0;}   /* загварын бараан хавтгайг тогооны ёроол руу нууна (G.inner нь .on-г дахин тохируулдаг) */
  if(!on){P.potC.on=false;return;}const f=Math.min(1,k/.3),c=Math.max(0,(k-.3)/.7),wob=G.boil&&G.boil.hold?Math.sin(t*7)*.002:0,y=POT.y0+f*(POT.y1-POT.y0)+wob,r=POT.r(y);
  P.potL.m=M4.trs([GX,y,GZ],{s:[r,1,r]});P.potL.tint=[1-.08*c,1-.1*c,1-.26*c];   /* сүү цагаан → шар ус шаргал */
  P.potC.on=c>0;if(c>0)P.potC.m=M4.trs([GX,y,GZ],{ry:G.boil&&G.boil.hold?t*.9:0,s:[r,.25+.75*c,r]});}
/* ирсэн бэлэг: хадгаар боосон жижиг боодол, гэрийн намхан ширээн дээр (ааруултай тавагны хажууд) */
const GIFT_AT=[.08+GX,.4,-1.8+GZ];
function giftGeo(){const g=new Geo(59),B=hex("#2F7BE0"),L=hex("#8FC3FF");g.at(GIFT_AT,{ry:.4},q=>{q.at([0,.07,0],{s:[1.25,.72,1]},w=>w.sph(.1,12,B,.04));
  q.at([0,.145,0],{},w=>w.sph(.032,8,L,.03));q.at([.03,.15,0],{rz:-.8,s:[1,.35,1]},w=>w.sph(.035,8,L,.02));q.at([-.03,.15,0],{rz:.8,s:[1,.35,1]},w=>w.sph(.035,8,L,.02));});return g;}
function plateSync(){const m=G.P.m.aarP;if(!m)return;const n=Math.min(6,bkTotal());if(G.plateN===n&&G.plateM===m)return;G.plateN=n;G.plateM=m;w3Rebuf(G.W,m,w3AaruulPlate(n));m.on=n>0;}
/* адууны усны тэвш (сүргийн бэлчээрт) ба уяан дээрх морины хувин — модон, ус нь цэнхэр гялгар */
const TROUGH=[-32.5,6.2],WBUCK=[-4.15,3.7];
function troughGeo(){const g=new Geo(212),C=W3C,Wt=hex("#5F8FB4");
  g.at([TROUGH[0],w3H(TROUGH[0],TROUGH[1]),TROUGH[1]],{},q=>{[[-.85,-.22],[.85,-.22],[-.85,.22],[.85,.22]].forEach(([x,z])=>q.at([x,0,z],{},w=>w.box(.09,.5,.09,C.wood2)));
    q.at([0,.42,.25],{},w=>w.box(2,.26,.05,C.wood));q.at([0,.42,-.25],{},w=>w.box(2,.26,.05,C.wood));q.at([-.98,.42,0],{},w=>w.box(.05,.26,.52,C.wood));q.at([.98,.42,0],{},w=>w.box(.05,.26,.52,C.wood));
    q.at([0,.3,0],{},w=>w.box(2,.04,.52,C.wood2));q.at([0,.5,0],{},w=>w.box(1.9,.01,.46,Wt));});
  g.at([WBUCK[0],w3H(WBUCK[0],WBUCK[1]),WBUCK[1]],{},q=>{q.cyl(.2,.17,.34,12,C.wood,true,.04);q.at([0,.31,0],{},w=>w.cyl(.185,.185,.01,12,Wt,true));
    [.08,.26].forEach(y=>q.at([0,y,0],{},w=>w.cyl(.205,.205,.025,12,C.band,false)));});return g;}
/* ---- гэр ахуйн жижиг загварууд (хөнгөн, кодоор) ---- */
const WBOWL=[1.408+GX,.66,2.649+GZ];   /* хаалганы дэргэдэх усны торхны таган дээр: загварын хөмөрсөн аягыг нууж, оронд нь устай дээшээ харсан аяга */
const discGeo=c=>{const g=new Geo(216);g.cyl(1,1,.004,20,hex(c),true,.01);return g;};
function pailGeo(){const g=new Geo(217),C=W3C;g.cyl(.15,.12,.3,10,C.wood,true,.04);g.at([0,.09,0],{},w=>w.cyl(.155,.155,.03,10,C.band));g.at([0,.22,0],{},w=>w.cyl(.152,.152,.03,10,C.band));return g;}
function aragGeo(){const g=new Geo(218),A=hex("#B88A55"),B=hex("#8A6236");for(let i=0;i<7;i++)g.at([0,i*.08,0],{},q=>q.cyl(.2+i*.012,.2+(i+1)*.012,.08,14,i%2?A:B,false,.05));
  g.cyl(.2,.2,.01,14,B,true);[0,2.1,4.2].forEach(a=>g.at([Math.cos(a)*.27,.3,Math.sin(a)*.27],{rz:Math.cos(a)*.08,rx:-Math.sin(a)*.08},q=>q.cyl(.012,.012,.62,5,B,false)));return g;}
function aragFillGeo(){const g=new Geo(219),C=[hex("#5A4632"),hex("#4A3A2A"),hex("#6B5540")],R=chRng(219);for(let i=0;i<12;i++){const a=R()*6.283,d=R()*.16;
  g.at([Math.cos(a)*d,i*.004,Math.sin(a)*d],{ry:R()*3,s:[.09,.04,.075]},q=>q.sph(1,7,C[i%3],.12));}return g;}
function wbowlGeo(){const g=new Geo(220),c=hex("#A87A4C");g.cyl(.05,.085,.06,18,c,false,.02);g.cyl(.05,.05,.006,18,c,true,.02);g.at([0,.06,0],{},q=>q.cyl(.085,.088,.006,18,hex("#8E6438"),false,.02));return g;}
/* гэрийн хаалга: нэг хавтгай, улбар шар, хээтэй; баруун талын нугаснаас гадагшаа нээгдэнэ. Нугасны тэнхлэг эх цэг дээр, хаалга +x тийш */
const DOOR={x:-.45+GX,z:3.49+GZ,w:.9,h:1.54,y:.07,k:0};
function doorGeo(){const g=new Geo(223),O=hex("#EE7F22"),Rd=hex("#B8461E"),B=hex("#2E5C9A"),Wt=hex("#F3E6C8"),Gn=hex("#3E8A5A"),Dk=hex("#5A3420"),w=DOOR.w,h=DOOR.h;
  g.at([w/2,h/2,0],{},q=>q.box(w,h,.045,O));
  [1,-1].forEach(sd=>{const z=sd*.026;
    [[w/2,.03,w,.06],[w/2,h-.03,w,.06],[.03,h/2,.06,h],[w-.03,h/2,.06,h],[w/2,h*.56,w-.1,.05]].forEach(([x,y,bw,bh])=>g.at([x,y,z],{},q=>q.box(bw,bh,.008,Rd)));
    /* дээд хавтан: дугуй хээ (хөх, цагаан, ногоон) */
    g.at([w/2,h*.78,z],{rx:Math.PI/2},q=>{q.cyl(.2,.2,.008,24,B,true,.01);q.at([0,sd*.004,0],{},r=>r.cyl(.15,.15,.008,24,Wt,true,.01));q.at([0,sd*.008,0],{},r=>r.cyl(.1,.1,.008,20,Gn,true,.01));q.at([0,sd*.012,0],{},r=>r.cyl(.045,.045,.008,14,Rd,true,.01));});
    /* доод хавтан: хөх хээтэй хоёр эгнээ дөрвөлжин */
    for(let i=0;i<5;i++)[h*.36,h*.18].forEach((y,j)=>g.at([.13+i*.16,y,z],{rz:Math.PI/4},q=>q.box(.075,.075,.008,(i+j)%2?B:Wt)));
    /* бариул */
    g.at([w-.1,h*.5,sd*.04],{rx:Math.PI/2},q=>q.cyl(.03,.03,.02,10,Dk,true,.01));});
  return g;}
function vaseFillGeo(){const g=new Geo(221),T=hex("#F5F1E6");   /* ваарнууд: тараг (том ваар), сүү (шүүгээн дээрх домбо), ааруул (аяганд) */
  g.at([2.248,.50,-1.932],{},q=>q.cyl(.11,.11,.006,16,T,true));g.at([2.195,1.195,2.096],{},q=>q.cyl(.048,.048,.005,12,hex("#FBF8F0"),true));
  const R=chRng(221);for(let i=0;i<6;i++)g.at([2.572+(R()-.5)*.08,.955+R()*.01,1.523+(R()-.5)*.08],{ry:R()*3},q=>q.box(.035,.022,.028,W3C.cream));return g;}
function cupsGeo(){const g=new Geo(222);g.at([-.42+GX,.43,-1.86+GZ],{},q=>q.cyl(.05,.075,.055,14,hex("#A87A4C"),true,.03));return g;}
function cupsFillGeo(){const g=new Geo(223),A=hex("#EFEADB");g.at([-.42+GX,.478,-1.86+GZ],{},q=>q.cyl(.068,.068,.004,14,A,true));g.at([.26+GX,.465,-1.98+GZ],{},q=>q.cyl(.085,.085,.004,14,A,true));return g;}
/* адууны тэвшнээс урсах жижиг горхи */
const STREAM=[[-33.6,6.6],[-35.6,8.8],[-37.4,11.8],[-39.8,14.6],[-41.4,18.4],[-44.2,21.8],[-46.4,26]];
function streamPt(u){const n=STREAM.length-1,f=Math.min(n-1e-6,Math.max(0,u*n)),i=Math.floor(f),k=f-i,a=STREAM[i],b=STREAM[i+1];return [a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k];}
function streamGeo(){const g=new Geo(224),N=90,up=[0,1,0],c=hex("#6E9EC4");let prev=null;
  for(let i=0;i<=N;i++){const u=i/N,p=streamPt(u),q=streamPt(Math.min(1,u+.01)),dx=q[0]-p[0],dz=q[1]-p[1],l=Math.hypot(dx,dz)||1,w=.28+.22*u+.06*Math.sin(u*17),nx=-dz/l*w,nz=dx/l*w;
    const L=[p[0]+nx,p[1]+nz],Rr=[p[0]-nx,p[1]-nz],yl=w3H(L[0],L[1])+.035,yr=w3H(Rr[0],Rr[1])+.035,cur=[[L[0],yl,L[1]],[Rr[0],yr,Rr[1]]];
    if(prev){g.vx(prev[0],up,c,0);g.vx(cur[0],up,c,0);g.vx(cur[1],up,c,0);g.vx(prev[0],up,c,0);g.vx(cur[1],up,c,0);g.vx(prev[1],up,c,0);}prev=cur;}return g;}
for(let i=0;i<=24;i++){const p=streamPt(i/24);W3BARE.push([p[0],p[1],.75]);}
/* гэрийн загварын аргалтай савыг (хувин) нууж, оронд нь араг тавина */
/* бас усны торхны таган дээрх хөмөрсөн аяга (WaterBarrel_Ladle) — оронд нь устай аяга тавина */
const HIDE=()=>[[ARAG_AT[0]-GX,ARAG_AT[1]-GZ,.4,-9,.42],[1.408,2.649,.075,.565,9]];
function hideGerBucket(){const W=G.W;if(G.bucketW===W||!GERX.on||!W3GLB)return;G.bucketW=W;G.bowMeshes=[];W3GLB.then(D=>{if(G.W!==W)return;const gl=W.gl;
  D.main.forEach(B=>{if(!B.inner)return;const v=B.v;let hit=false;const o=new Float32Array(v);
    const HZ=HIDE(),inB=j=>v[j]<-3.06&&v[j]>-3.55&&v[j+1]>.68&&v[j+1]<1.5&&v[j+2]>.03&&v[j+2]<1.22,inZ=(j,Z)=>Math.hypot(v[j]-Z[0],v[j+2]-Z[1])<Z[2]&&v[j+1]>Z[3]&&v[j+1]<Z[4];let hitB=false;const ob=new Float32Array(v);
    for(let t=0;t<v.length;t+=36){let all=false;for(const Z of HZ)if(inZ(t,Z)&&inZ(t+12,Z)&&inZ(t+24,Z)){all=true;break;}
      if(all){hit=true;for(let k=1;k<3;k++)for(let q=0;q<3;q++){o[t+k*12+q]=v[t+q];ob[t+k*12+q]=v[t+q];}}
      else if(inB(t)&&inB(t+12)&&inB(t+24)){hitB=true;for(let k=1;k<3;k++)for(let q=0;q<3;q++)ob[t+k*12+q]=v[t+q];}}   /* нум сум: авахад хананаас алга болно */
    if(!hit&&!hitB)return;const m=B.mesh&&!B.mesh.bucketDone?B.mesh:null;if(!m)return;m.bucketDone=1;
    if(hitB){m.gvS=o;m.gvB=ob;(G.bowMeshes=G.bowMeshes||[]).push(m);}
    gl.bindBuffer(gl.ARRAY_BUFFER,m.b);gl.bufferData(gl.ARRAY_BUFFER,hitB&&INV.hand==="bow"?ob:o,gl.STATIC_DRAW);});}).catch(()=>{});}
/* хаалга: ойртоход аажуухан гадагшаа нээгдэж, холдоход хаагдана */
function doorStep(dt,c){const P=G.P.m;if(!P.door)return;P.door.on=!!GERX.on;if(!GERX.on)return;const x=c.pos[0],z=c.pos[2];
  const want=(G.inGer?z-GZ>1.3:Math.hypot(x-GX,z-DOOR.z)<3.2&&!G.ride)?1:0,k0=DOOR.k;DOOR.k+=(want-DOOR.k)*Math.min(1,dt*2.6);
  if(SND.burst&&SND.ctx&&((want&&k0<.03&&DOOR.k>=.03)||(!want&&k0>.97&&DOOR.k<=.97)))SND.burst(SND.ctx.currentTime,.45,{f:want?380:300,q:7,v:.02,type:"bandpass"});
  P.door.m=M4.trs([DOOR.x,DOOR.y,DOOR.z],{ry:-DOOR.k*1.72});}
/* кадр бүр: хувин, араг, аргал, тулгын гал, гэрийн гэрэл */
function houseStep(dt,t,c){const P=G.P.m;if(!P.pail)return;hideGerBucket();
  const M=G.milkC&&G.milkC.mare;P.pail.on=!INV.hand||!!M;if(M)P.pail.m=M4.trs([M.x+ZDIR[0]*.3,w3H(M.x,M.z)-.02,M.z+ZDIR[1]*.3],{});else P.pail.m=M4.trs([PAIL[0],w3H(PAIL[0],PAIL[1])-.02,PAIL[1]],{});
  const ay=.04;P.arag.on=!INV.arag;P.arag.m=M4.trs([ARAG_AT[0],ay,ARAG_AT[1]],{});P.aragFill.on=!INV.arag&&INV.argal>0;
  P.aragFill.m=M4.trs([ARAG_AT[0],ay+.1+Math.min(1,INV.argal/20)*.4,ARAG_AT[1]],{});
  const wl=G.hold&&G.hold.icon==="cup"?1-G.hold.k*.8:1;P.wbowl.m=M4.trs([WBOWL[0],WBOWL[1],WBOWL[2]],{});P.wwater.m=M4.trs([WBOWL[0],WBOWL[1]+.01+.042*wl,WBOWL[2]],{s:[.052+.026*wl,1,.052+.026*wl]});
  doorStep(dt,c);
  P.cupsA.on=INV.bowls>0;
  if(G.started&&t>(G.argalT||8)){G.argalT=t+18+Math.random()*14;argalDrop(t);}
  if(G.argalDirty){G.argalDirty=false;w3Rebuf(G.W,P.argal,argalGeo());P.argal.on=ARGAL.length>0;}
  /* тулгын гал */
  if(STOVE.fuel>0){STOVE.fuel=Math.max(0,STOVE.fuel-dt);if(Math.floor(STOVE.fuel/20)!==Math.floor((STOVE.fuel+dt)/20))w3Save({stoveFuel:Math.round(STOVE.fuel)});}
  const want=STOVE.fuel>0?Math.min(1,STOVE.fuel/12):0;STOVE.k+=(want-STOVE.k)*Math.min(1,dt*1.5);}
function aarRebuild(){const m=G.P.m.aarR;if(!m)return;const R=AARU.r;w3Rebuf(G.W,m,R.st==="empty"?new Geo(1):aarRackGeo(R.sty,R.n));m.on=R.st!=="empty";G.aarBuilt=m;}
function aarAct(){const A=AARU;if(A.r.st==="dry")return {k:"aarGet",t:"Ааруул хураах"};
  if(A.p.ph==="pressed"&&A.r.st==="empty")return {k:"aarCut",t:"Ааруул тавих"};
  return {k:"aarInfo",t:A.p.ph==="press"?`Аарц шахагдаж байна · ${dur(PRESS_T-(G.played-A.p.t0))}`:A.r.st==="wet"?`Ааруул хатаж байна · ${dur(SUN_T-A.r.sun)}`:"Ааруулын тавиур"};}
function aarInfo(){const A=AARU,pc=v=>Math.round(Math.min(1,Math.max(0,v))*100)+"%";
  if(A.p.ph==="press")return `Аарц хоёр банзны хооронд чулуун дор шахагдаж, шар ус нь гарч байна (${pc((G.played-A.p.t0)/PRESS_T)}). Жинхэнэдээ 10 гаруй цаг дардаг; тоглоомд ${dur(PRESS_T)} — ${dur(PRESS_T-(G.played-A.p.t0))} үлдлээ.`;
  if(A.r.st==="wet")return `Ааруул нар, салхинд хатаж байна (${pc(A.r.sun/SUN_T)}). Жинхэнэдээ 7–14 хоног хатдаг; тоглоомд нар гарсан үед ${dur(SUN_T)} — ${dur(SUN_T-A.r.sun)} үлдлээ.`+(sunUp()?"":" Шөнө хатахгүй, нар гарахыг хүлээе.")+(A.p.ph==="pressed"?" Шахсан аарц бэлэн, тавиур чөлөөлөгдмөгц тавина.":"");
  return "Тавиур хоосон. Гэрт ороод тулган дээр тараг буцалгаж, ааруул хийж эхэлээрэй.";}
function circlePush(x,z,cx,cz,r){const dx=x-cx,dz=z-cz,d=Math.hypot(dx,dz);if(d<r){const k=d>1e-4?r/d:0;return d>1e-4?[cx+dx*k,cz+dz*k]:[cx+r,cz];}return [x,z];}
function collide(x,z){let p=w3Collide(x,z,G);const r=G.ride?.55:.3;p=fenceCollide(p[0],p[1],r);if(0)p=circlePush(p[0],p[1],FIRE[0],FIRE[1],G.ride?1.3:.95);
  if(!G.ride&&G.flock)for(const a of G.flock)p=circlePush(p[0],p[1],a.x,a.z,a.lamb?.38:.55);
  if(G.hx)for(const h of G.hx.herd)p=circlePush(p[0],p[1],h.x,h.z,1.2+(G.ride?.5:0));
  const rr=G.ride?.5:0;p=circlePush(p[0],p[1],W3WISH.X,W3WISH.Z,(W3WISH.S.st==="ready"?W3WISH.S.trunk:.75)+rr);
  if(!G.inGer){p=segPush(p[0],p[1],[TROUGH[0]-.9,TROUGH[1],TROUGH[0]+.9,TROUGH[1]],.4+rr);p=circlePush(p[0],p[1],WBUCK[0],WBUCK[1],.3+rr);if(AARU.p.ph!=="idle")p=circlePush(p[0],p[1],PRESS[0],PRESS[1],.5+rr);p=circlePush(p[0],p[1],ZEL_A[0],ZEL_A[1],.3+rr);p=circlePush(p[0],p[1],ZEL_B[0],ZEL_B[1],.3+rr);p=segPush(p[0],p[1],ZEL,.2+rr);
    if(G.foals&&zelOpen())for(const f of G.foals.concat(G.mares))p=circlePush(p[0],p[1],f.x,f.z,(f.mare?.85:.6)+rr);}
  p=circlePush(p[0],p[1],W3MAP.OVOO[0],W3MAP.OVOO[1],1.5+rr);p=circlePush(p[0],p[1],26,-34,1.4+rr);
  p=circlePush(p[0],p[1],W3MAP.POLE[0],W3MAP.POLE[1],.65+rr);
  if(GERX.on&&GERX.wall!==false&&!G.inGer&&DOOR.k>.85){const a=DOOR.k*1.72;p=segPush(p[0],p[1],[DOOR.x,DOOR.z,DOOR.x+Math.cos(a)*DOOR.w,DOOR.z+Math.sin(a)*DOOR.w],.16+rr);}   /* онгорхой хаалгаар нэвтрэхгүй */
  return p;}
/* гэрт байгаа эсэх: хана дотор, эсвэл хаалганы нүхэнд (гэрээс гарч яваа) */
function gerIn(x,z){if(!GB.built)return false;x-=GX;z-=GZ;const d=Math.hypot(x,z),R=GERX.on?3.3:2.2;return d<R||(G.inGer&&Math.abs(x)<.5&&z>0&&z<(GERX.on?3.95:2.8));}
const inPen=(x,z,m)=>x>PEN.x0+m&&x<PEN.x1-m&&z>PEN.z0+m&&z<PEN.z1-m;

/* ---------- хонь хариулах: таван төлөв (бэлчих, алхах, зөөлөн зайлах, хашаанд тайван, нуга руу буцах) ---------- */
function flockStep(dt,t,c){const F=G.flock;if(!F)return;const R=G.ride,hp=R?[R.x,R.z]:null,hv=R?Math.abs(R.v):0,px=c.pos[0],pz=c.pos[2];
  let cx=0,cz=0,cn=0;for(const a of F)if(!a.lamb&&a.mode==="meadow"){cx+=a.x;cz+=a.z;cn++;}if(cn){cx/=cn;cz/=cn;}
  const riderNear=(a,r)=>hp&&Math.hypot(a.x-hp[0],a.z-hp[1])<r,fph=flockPhase(),gOpen=GATE.a>.9;
  for(const a of F){a.t-=dt;a.baaT-=dt;
    /* хашаанд орсон уу */
    if(a.mode==="meadow"&&!a.lamb&&fph==="day"&&!R&&inPen(a.x,a.z,.1))startLeave(a,.4);   /* өдөр онгорхой хашаанд орчихсон хонь өөрөө буцаж гарна */
      if(a.mode==="meadow"&&inPen(a.x,a.z,.25)&&(fph!=="day"||R)){a.mode="pen";a.penT=t;a.st=1;a.tx=PEN.x0+.9+Math.random()*(PEN.x1-PEN.x0-1.8);a.tz=PEN.z0+.8+Math.random()*1.6;a.sp=.32;a.t=8;a.calm=t+3;}   /* орсон хонь хаалганаас цааш орж, дараагийнхандаа зай тавина */
    /* айлгах зүйл: унаж яваа морь ойртох, эсвэл хүн яг хажууд нь ирэх */
    let thr=0,fx=0,fz=0;
    if(hp){const dx=a.x-hp[0],dz=a.z-hp[1],d=Math.hypot(dx,dz),RR=4.6+Math.min(1.4,hv*.25);if(d<RR){const k=(1-d/RR)*(.45+.55*Math.min(1,hv/2.5));thr=Math.max(thr,k);fx+=dx/(d||1)*k;fz+=dz/(d||1)*k;}}
    if(!R&&!G.inGer){const dx=a.x-px,dz=a.z-pz,d=Math.hypot(dx,dz),RR=1.9;if(d<RR&&!(a.calm>t)){const k=(1-d/RR)*.6;thr=Math.max(thr,k);fx+=dx/(d||1)*k;fz+=dz/(d||1)*k;}}
    if(a.lamb){const m=a.mom,lin=inPen(a.x,a.z,.1);a.mode=m.mode==="pen"?(lin?"pen":"meadow"):m.mode;
      let bx=m.x-Math.cos(m.ry)*.95+Math.sin(m.ry)*.35,bz=m.z+Math.sin(m.ry)*.95+Math.cos(m.ry)*.35,route=false;
      /* эх нь хашааны нөгөө талд байвал хурга хашаа даван гүйхгүй, хаалгаар нь тойрч орж гарна */
      if(inPen(m.x,m.z,.1)!==lin&&Math.hypot(m.x-a.x,m.z-a.z)>.9){const gm=(PEN.gx0+PEN.gx1)/2,ax=Math.abs(a.x-gm);
        const T=lin?(ax<.6&&(a.z>PEN.z1-1.4||Math.hypot(a.x-GATE_IN[0],a.z-GATE_IN[1])<.6)?GATE_OUT:GATE_IN):(ax<.7&&a.z>PEN.z1-.2&&a.z<PEN.z1+2.4?GATE_IN:GATE_OUT);bx=T[0];bz=T[1];route=true;}
      const d=Math.hypot(bx-a.x,bz-a.z);
      if(d>1.3||thr>.2||(route&&d>.25)){a.st=1;a.tx=bx;a.tz=bz;a.sp=Math.min(.78,.32+d*.18+thr*.3);a.t=2;}else if(a.st===1&&d<.5){a.st=0;a.t=1.5+Math.random()*3;}}
    else if(thr>.04&&a.mode!=="pen"){
      let dx=fx,dz=fz;const L=Math.hypot(dx,dz)||1;dx/=L;dz/=L;
      if(cn&&a.mode==="meadow"){const ox=cx-a.x,oz=cz-a.z,ol=Math.hypot(ox,oz);if(ol>.5){dx+=ox/ol*.28;dz+=oz/ol*.28;}}   /* сүргээсээ холдохгүй */
      const gm=(PEN.gx0+PEN.gx1)/2,fun=Math.abs(a.x-gm)>.6&&a.z>PEN.z1+.3,GT=fun?[gm,PEN.z1+1.0]:GATE_IN;   /* эхлээд хаалганы өмнө, дараа нь дотогш (юүлүүр) */
      const gx=GT[0]-a.x,gz=GT[1]-a.z,gd=Math.max(.3,Math.hypot(GATE_IN[0]-a.x,GATE_IN[1]-a.z)),gl=Math.hypot(gx,gz)||1;   /* хаалганы ойролцоо бол хашаа руу чиглэнэ */
      const gR=fph==="day"?7.5:13;   /* орой хонь гэрээ мэднэ: тууж ирэхэд хаалга руу илүү хялбар чиглэнэ */
      if(gOpen&&gd<gR&&a.z>PEN.z1-.3&&(fph!=="day"||R)){const w=(fph==="day"?.9:1.25)*(1-gd/gR);dx+=gx/gl*w*2;dz+=gz/gl*w*2;}
      {const gr=Math.hypot(a.x-GX,a.z-GZ);if(GB.built&&gr<6.5&&gr>.1){const rx=(a.x-GX)/gr,rz=(a.z-GZ)/gr,dp=dx*rx+dz*rz;if(dp<0){dx-=dp*rx*1.15;dz-=dp*rz*1.15;}}}   /* гэрийн ханыг тойрч гүйнэ, наалдаж гацахгүй */
      const l2=Math.hypot(dx,dz)||1;a.st=2;a.tx=a.x+dx/l2*2.2;a.tz=a.z+dz/l2*2.2;a.sp=.38+.37*Math.min(1,thr*1.4);a.t=.9+Math.random()*.7;a.lk=0;}
    else if(a.st===2&&a.t<=0){a.st=0;a.t=1.2+Math.random()*3;if(a.mode==="meadow")a.home=[a.x,a.z];}   /* туусан газартаа бэлчинэ (буцаж гүйхгүй) */
    else if(a.mode==="pen"&&thr>.04){if(a.st!==1){a.st=1;a.tx=PEN.x0+.9+Math.random()*(PEN.x1-PEN.x0-1.8);a.tz=PEN.z0+.8+Math.random()*(PEN.z1-PEN.z0-2.6);a.sp=.3;a.t=5;}}
    /* юу хийхээ өөрөө шийднэ, хүн бүр өөр хугацаатай */
    if(!a.lamb&&a.st===0&&a.t<=0){
      if(a.mode==="pen"){if(Math.random()<.45){a.st=1;a.tx=PEN.x0+.9+Math.random()*(PEN.x1-PEN.x0-1.8);a.tz=PEN.z0+.8+Math.random()*(PEN.z1-PEN.z0-2.6);a.sp=.24;a.t=9;}else a.t=4+Math.random()*7;}
      else if(a.mode==="leave"){const nx=a.path.shift();if(nx){a.st=1;a.tx=nx[0];a.tz=nx[1];a.sp=.36;a.t=25;}else{a.mode="meadow";a.t=2;}}
      else{let h=a.home;if(cn&&Math.hypot(cx-a.x,cz-a.z)>9)h=[a.x+(cx-a.x)*.6,a.z+(cz-a.z)*.6];   /* сүргээсээ хэт холдохгүй */
        const an=Math.random()*6.283,rr=Math.random()*(fph==="night"?1.2:6.5);a.st=1;a.tx=h[0]+Math.cos(an)*rr;a.tz=h[1]+Math.sin(an)*rr;a.sp=.27+Math.random()*.1;a.t=10;
        if(a.tx>PEN.x0-1.5&&a.tx<PEN.x1+1.5&&a.tz>PEN.z0-1.5&&a.tz<PEN.z1+1.5){a.tx=2*h[0]-a.tx;a.tz=2*h[1]-a.tz;}}}   /* өдөр онгорхой хашаа руу өөрөө буцаж орохгүй */
    /* бэлчээр өдрөөс өдөрт өөр чиглэлд аажуухан нүүнэ; орой гэрийн зүг (хаалганаас 7 м зайд) ойртоно — хашаанд өөрөө орохгүй */
    if(!a.lamb&&a.mode==="meadow"&&a.st!==2){const h=a.home;
      if(fph==="day"){h[0]+=DRIFT[0]*dt*.035;h[1]+=DRIFT[1]*dt*.035;const mx=h[0]-MEAD[0],mz=h[1]-MEAD[1],md=Math.hypot(mx,mz);if(md>20){h[0]-=mx/md*dt*.08;h[1]-=mz/md*dt*.08;}}
      else{const ex=EVE[0]+a.off[0],ez=EVE[1]+Math.abs(a.off[1]);   /* туусан хонь хаалганд ойр байвал буцаж холдохгүй */
        if(Math.hypot(h[0]-GATE_OUT[0],h[1]-GATE_OUT[1])>Math.hypot(ex-GATE_OUT[0],ez-GATE_OUT[1])+.5){const k=Math.min(1,dt*(fph==="eve"?.025:.01));h[0]+=(ex-h[0])*k;h[1]+=(ez-h[1])*k;}}
      if(h[0]>PEN.x0-1.5&&h[0]<PEN.x1+1.5&&h[1]>PEN.z0-1.5&&h[1]<PEN.z1+2.5)h[1]=PEN.z1+2.5;}
    if(!a.lamb&&a.mode==="leave"&&a.st===1&&Math.hypot(a.tx-a.x,a.tz-a.z)<(a.path.length?.8:.35)){a.st=0;a.t=.1;}   /* дундын цэгт яг хүрэх албагүй (хаалганд бөөгнөрч гацахгүй) */
    /* хөдлөх: эргэлт удаан, хурд зөөлөн (хиймлээр үсрэхгүй, хэт хурдан гүйхгүй) */
    if(a.st>=1){const dx=a.tx-a.x,dz=a.tz-a.z,d=Math.hypot(dx,dz);
      if(d<.12||a.t<=0){if(a.mode!=="leave"){a.st=0;a.t=2+Math.random()*6;}
        else if(!a.lamb&&d>=.35){a.stuck=(a.stuck||0)+1;a.t=6;if(a.stuck>3){a.stuck=0;startLeave(a,.5);}}}   /* гацвал дахин замаа сонгоно */
      else{let dr=Math.atan2(-dz,dx)-a.ry;dr=Math.atan2(Math.sin(dr),Math.cos(dr));const tr=(a.st===2?2.6:1.8)*dt;a.ry+=Math.max(-tr,Math.min(tr,dr));
        if(Math.abs(dr)<1.1){const v=a.sp*(1-.5*Math.abs(dr));a.x+=Math.cos(a.ry)*v*dt;a.z-=Math.sin(a.ry)*v*dt;a.wk+=v*dt;}}}
    /* хүн ойртвол харна */
    const dp=Math.hypot(a.x-px,a.z-pz),near=a.st===0&&dp<3.4&&!G.inGer;
    if(near){let dr=Math.atan2(-(pz-a.z),px-a.x)-a.ry;dr=Math.atan2(Math.sin(dr),Math.cos(dr));a.ry+=dr*Math.min(1,dt*1.6);a.lk=Math.min(1,(a.lk||0)+dt*1.4);
      if(!a.baa&&dp<2.4){a.baa=1;SND.baa(.7,a.lamb);}}else{a.lk=Math.max(0,(a.lk||0)-dt*1.2);if(dp>4)a.baa=0;}
    if(a.baaT<=0){a.baaT=25+Math.random()*45;if(dp<26&&!G.inGer)SND.baa(Math.max(.15,.7-dp/40),a.lamb);}
    /* мөргөлдөөн: гэр, хашаа, гал, бусад хонь */
    let p=w3AnimalCollide(a.x,a.z,.42*a.sc);p=fenceCollide(p[0],p[1],.36*a.sc+.06);a.x=p[0];a.z=p[1];
    let hop=0,wig=0;if(a.joy!=null){const k=(t-a.joy)/1.1;if(k>=1||k<0)a.joy=null;else{hop=Math.abs(Math.sin(k*Math.PI*2))*.16*(1-k*.45);wig=Math.sin(k*26)*.08*(1-k);}}
    if(a.k&&G.W.sh)w3ShStep(G.W.sh,a,t,c,hop,wig,G.inGer);
    else if(a.m){const mv=a.st>=1,ph=a.wk*10;a.m.m=M4.trs([a.x,w3H(a.x,a.z)+(mv?Math.abs(Math.sin(ph))*.03:0)+hop,a.z],{ry:a.ry+wig,rx:mv?Math.sin(ph)*.05:0,s:a.sc});a.m.on=!G.inGer;}}
  w3Spread(F,.74,"x","z");
  /* бүгд хашаанд орвол тайван мэдэгдэл, хаалга аажуухан хаагдана */
  const all=F.every(a=>a.mode==="pen");if(all&&!G.allIn){G.allIn=true;showPlace("Хонинууд гэртээ ирлээ");G.gateAuto=t+3;}if(!all&&F.some(a=>!a.lamb&&a.mode!=="pen")){G.allIn=false;G.gateAuto=0;}
  if(G.gateAuto&&t>G.gateAuto){if(F.every(a=>!a.lamb||inPen(a.x,a.z,.1))){G.gateAuto=0;GATE.want=0;}else G.gateAuto=t+1;}   /* хурга бүгд дотор орсны дараа л хаана */
  if(fph==="day"&&G.lastPh&&G.lastPh!=="day"&&F.some(a=>a.mode==="pen"))hint("Өглөө боллоо. Хашааны хаалгыг нээж хонио бэлчээрт гаргаарай. Гэрийн баруун талд зэл татлаа — гүү саах боломжтой.",7000);
  G.lastPh=fph;}
function startLeave(a,delay){const h=[a.home[0]+(Math.random()-.5)*3,a.home[1]+(Math.random()-.5)*3],P=[];
  if(inPen(a.x,a.z,.1)){if(Math.hypot(a.x-GATE_IN[0],a.z-GATE_IN[1])>1.6)P.push(GATE_IN);P.push(GATE_OUT);}else if(a.z<PEN.z1+1.5&&a.x>PEN.x0-1&&a.x<PEN.x1+1)P.push(GATE_OUT);
  if(h[1]<PEN.z1+1.5&&(h[0]<PEN.x0-.5||h[0]>PEN.x1+.5))P.push([h[0]<PEN.x0?PEN.x0-1.6:PEN.x1+1.6,PEN.z1+2.2]);   /* хашааг тойрч гарна */
  P.push(h);a.mode="leave";a.path=P;a.st=0;a.t=delay??Math.random()*3;a.stuck=0;}
function gateAct(){const n=penCount();if(GATE.want){if(n>0&&flockPhase()!=="night")return {k:"free",t:"Хонио бэлчээрт гаргах"};return {k:"gate",t:"Хашаа хаах"};}return {k:"gate",t:"Хашаа нээх"};}
const penCount=()=>G.flock?G.flock.filter(a=>!a.lamb&&a.mode==="pen").length:0;

/* ---------- морь унах (Жалайрын 13-р зууны аяллаас) ---------- */
function rideStep(dt,c){const R=G.ride,K=G.keys,GT=RIDE[R.gait];
  const jy=G.mv.f+((K.w||K.arrowup)?1:0)-((K.s||K.arrowdown)?1:0),jx=G.mv.s+(K.d?1:0)-(K.a?1:0)+(K.arrowright?1:0)-(K.arrowleft?1:0);
  const tv=jy>.15?GT.v*Math.min(1,jy*1.15):jy<-.35?-1:0;R.v+=(tv-R.v)*(1-Math.exp(-dt*(Math.abs(tv)>Math.abs(R.v)?1.5:2.6)));if(!tv&&Math.abs(R.v)<.03)R.v=0;
  const tr=Math.abs(jx)>.12?Math.max(-1,Math.min(1,jx))*GT.turn*(.55+.45*Math.min(1,Math.abs(R.v)/2.5))*dt:0;if(tr){R.h+=tr;c.yaw+=tr;if(G.look)G.look.yaw+=tr;}
  const fx=Math.sin(R.h),fz=-Math.cos(R.h),ox=R.x,oz=R.z,p=collide(R.x+fx*R.v*dt,R.z+fz*R.v*dt);R.x=p[0];R.z=p[1];
  if(Math.abs(R.v)>.8&&Math.hypot(R.x-ox,R.z-oz)<Math.abs(R.v)*dt*.35)R.v*=Math.exp(-dt*5);
  R.amp=Math.min(1,Math.abs(R.v)/GT.v*1.3);const p0=R.ph;if(Math.abs(R.v)>.05)R.ph+=G.hx?dt*Math.abs(R.v)/HX.gallop:dt*GT.f*(.45+.55*R.amp);if(G.hx)R.pw=(R.pw||0)+dt*R.v/HX.walk;
  if(R.amp>.15&&Math.floor(R.ph*GT.nb)!==Math.floor(p0*GT.nb))SND.hoof(R.amp);
  G.inGer=false;const B=s3RideBob(R),hy=w3H(R.x,R.z),want=[R.x+fx*.06,hy+(G.hx?G.hx.seat+.66:2.2+B.y*.85),R.z+fz*.06];
  if(R.mt<1){R.mt=Math.min(1,R.mt+dt/.8);const e=R.mt<.5?2*R.mt*R.mt:1-Math.pow(-2*R.mt+2,2)/2;for(let i=0;i<3;i++)c.pos[i]=R.from[i]+(want[i]-R.from[i])*e;c.pos[1]+=Math.sin(e*Math.PI)*.35;}
  else{c.pos[0]=want[0];c.pos[2]=want[2];c.pos[1]+=(want[1]-c.pos[1])*(1-Math.exp(-dt*16));}}
function mount(){if(G.ride||!G.W)return;const c=G.cam,hb=G.horseBase,h=Math.PI/2-(G.horseRy??.15);
  G.ride={h,x:hb[0],z:hb[2],v:0,gait:1,ph:0,amp:0,mt:0,from:c.pos.slice()};G.tw=[];G.glide=null;G.inGer=false;
  let dy=h-c.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));G.look={yaw:c.yaw+dy,pitch:-.12};SND.snort();gaitUI();
  hint(FINE?"W — урагш, A / D — эргэх. Буухдаа E эсвэл «Буух».":"Дугуйг урагш түлхвэл морь явна, хажуу тийш хазайлгавал эргэнэ.",5000);}
function dismount(quick){const R=G.ride;if(!R)return;const c=G.cam;G.horseBase=[R.x,w3H(R.x,R.z),R.z];G.horseRy=Math.PI/2-R.h;G.ride=null;
  const p=collide(R.x-Math.cos(R.h)*1.6,R.z-Math.sin(R.h)*1.6);
  if(quick){c.pos[0]=p[0];c.pos[2]=p[1];c.pos[1]=w3H(p[0],p[1])+G.eye;G.glide=null;}else G.glide={from:[c.pos[0],c.pos[2]],to:p,t:0,dur:.6};gaitUI();}
function glideStep(dt,c){const g=G.glide;g.t=Math.min(1,g.t+dt/g.dur);const e=g.t<.5?2*g.t*g.t:1-Math.pow(-2*g.t+2,2)/2;c.pos[0]=g.from[0]+(g.to[0]-g.from[0])*e;c.pos[2]=g.from[1]+(g.to[1]-g.from[1])*e;
  const want=g.inGer?1.3:w3H(c.pos[0],c.pos[2])+G.eye;c.pos[1]+=(want-c.pos[1])*(1-Math.exp(-dt*8));if(g.t>=1){G.glide=null;if(g.then)g.then();}}
function gaitUI(){const on=!!G.ride;$("#gait").hidden=!on;$$("#gait button").forEach(b=>b.setAttribute("aria-pressed",String(on&&+b.dataset.g===G.ride.gait)));}
function lookAt(p,ms){const t=yp(G.cam.pos,p);let dy=t.yaw-G.cam.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));G.tw=[{t0:performance.now(),dur:RM?1:ms,from:{yaw:G.cam.yaw,pitch:G.cam.pitch},to:{yaw:G.cam.yaw+dy,pitch:t.pitch}}];G.look=null;}

/* ---------- нэг товч: ойр байгаа зүйлээс хамаарч өөрчлөгдөнө ---------- */
function busy(){return !!(G.build||G.rest||G.wish||G.churn||G.milkC||G.boil||G.bag||G.arch||G.shg||G.cut||G.bk||G.gift||G.hold||G.chestO||G.sleep);}
function pickAct(c){if(busy()||!G.W)return null;const x=c.pos[0],z=c.pos[2];
  if(G.ride)return {k:"down",t:"Буух"};
  if(!GB.built&&!G.inGer){const s=gbNear(x,z);if(s>=0)return {k:"gbuild",t:GB.stage>0?"Гэрээ үргэлжлүүлэн барих":"Энд гэр барих",spot:s};}
  if(G.inGer){const dK=Math.hypot(x-KH[0],z-KH[1]),dH=Math.hypot(x-GX,z-GZ),C=[],fx=Math.sin(c.yaw),fz=-Math.cos(c.yaw);
    /* ойр + харж буй чиглэлдээ байгаа зүйлийг сонгоно */
    const add=(tx,tz,r,act)=>{const dx=tx-x,dz=tz-z,d=Math.hypot(dx,dz);if(act&&d<r)C.push([d/r-.5*(d>.05?(dx*fx+dz*fz)/d:1),act]);};
    if(GIFTS.unopened().length)add(GIFT_AT[0],GIFT_AT[2],1.0,{k:"giftOpen",t:"Бэлэг нээх"});
    if(INV.jar>0)add(GX,-2.0+GZ,1.5,{k:"cups",t:"Айраг аягалах"});
    add(WBOWL[0],WBOWL[2],1.25,{k:"drink",t:"Ус уух"});
    add(ARAG_AT[0],ARAG_AT[1],.9,INV.arag?{k:"aragPut",t:"Араг тавих"}:{k:"aragTake",t:"Араг үүрэх"});
    CHESTS.forEach(q=>add(q[0],q[1],1.0,{k:"chest",t:"Авдар нээх"}));
    [[-1.75+GX,-.45+GZ],[1.75+GX,-.45+GZ]].forEach(q=>add(q[0],q[1],1.0,canSleep()?{k:"sleep",t:"Унтах"}:{k:"sleepinfo",t:"Орон"}));
    add(BOW_AT[0],BOW_AT[1],1.15,INV.hand==="bow"?{k:"bowPut",t:"Нум сум тавих"}:{k:"bowTake",t:"Нум сум авах"});
    if(SHG.mat&&SHG.mat[3])add(SHG.mat[0],SHG.mat[1],1.5,{k:"shagai",t:"Шагай тоглох"});
    if(dH<1.3){const fire=STOVE.fuel>0;add(GX,GZ,1.3,!fire&&INV.argal>=2?{k:"light",t:"Гал түлэх"}:fire&&(x-GX<-.25||AARU.p.ph!=="idle")?{k:"restIn",t:"Галын дэргэд амрах"}:
      AARU.p.ph==="idle"&&!(dK<1.7&&dK<dH)?{k:"boil",t:"Тараг буцалгах"}:null);}
    if(C.length&&!(dK<1.7&&dK<.8)){C.sort((a,b)=>a[0]-b[0]);return C[0][1];}
    if(INV.shagai&&G.matArm&&!SHG.mat&&dK>=1.7)return {k:"matPut",t:"Дэвсгэр дэлгэх"};
    if(dK<1.7){const ph=AIR.ph;
      if(ph==="empty")return INV.hand==="pail_milk"?{k:"pour",t:"Саам хийх"}:{k:"khinfo",t:"Хөхүүр"};
      if(ph==="churn")return {k:"churn",t:"Айраг бүлэх"};if(ph==="ferment")return {k:"khinfo",t:`Айраг исэж байна · ${dur(FERM-(G.played-AIR.t0))}`};return {k:"serve",t:"Айраг утгах"};}
    return null;}
  const hb=G.horseBase,hr=G.horseRy??.15;if(hb&&Math.hypot(x-(hb[0]+Math.cos(hr)*.25),z-(hb[2]-Math.sin(hr)*.25))<2.7)return {k:"ride",t:"Морь унах"};
  if(Math.hypot(x-RACK[0],z-RACK[1])<2.6||(AARU.p.ph!=="idle"&&Math.hypot(x-PRESS[0],z-PRESS[1])<1.9))return aarAct();
  if(Math.hypot(x-GATE_OUT[0],z-GATE_OUT[1])<3.6&&!G.ride)return gateAct();
  if(Math.hypot(x-W3WISH.X,z-W3WISH.Z)<4.4)return {k:"wish",t:"Хадаг уях"};
  if(SHG.mat&&!SHG.mat[3]&&Math.hypot(x-SHG.mat[0],z-SHG.mat[1])<1.8)return {k:"shagai",t:"Шагай тоглох"};
  if(Math.hypot(x-SHOOT[0],z-SHOOT[1])<2.6)return INV.hand==="bow"?{k:"arch",t:"Сур харвах"}:{k:"archinfo",t:"Харвааны зурвас"};
  const zq=segPush(x,z,ZEL,3.2),nearP=Math.hypot(x-PAIL[0],z-PAIL[1])<1.7;if(zq[0]!==x||zq[1]!==z||nearP){const H=INV.hand;
    if(!H&&nearP)return {k:"pailTake",t:"Хувин авах"};if(!zelOpen())return H==="pail"&&nearP?{k:"pailPut",t:"Хувин тавих"}:{k:"zelinfo",t:"Зэл"};
    if(H==="pail")return {k:"milk",t:"Гүү саах"};if(H==="pail_milk")return {k:"milkinfo",t:"Саамаа хөхүүрт хийх"};return {k:"pailinfo",t:"Гүү саах"};}
  if(Math.hypot(x-W3MAP.HSEAT[0],z-W3MAP.HSEAT[1])<3.6)return {k:"rest",t:"Салхинд амрах",spot:"hill"};
  if(argalNear(x,z,1.7).length)return INV.arag?{k:"argal",t:"Аргал түүх"}:{k:"argalinfo",t:"Аргал"};
  if(INV.shagai&&G.matArm&&!SHG.mat)return {k:"matPut",t:"Дэвсгэр дэлгэх"};
  return null;}
function doAct(){const a=G.act;if(!a)return;SND.start();
  if(a.k==="ride")mount();else if(a.k==="down")dismount(false);else if(a.k==="rest")restOpen(a.spot);
  else if(a.k==="in"){lookAt([GX,1.2,-1.5+GZ],1000);G.glide={from:[G.cam.pos[0],G.cam.pos[2]],to:[GX,4.35+GZ],t:0,dur:.6,then:()=>{G.inGer=true;G.glide={from:[GX,4.35+GZ],to:[GX,1.6+GZ],t:0,dur:1.1,inGer:true};}};}
  else if(a.k==="out"){lookAt([GX,1.5,12+GZ],1000);G.glide={from:[G.cam.pos[0],G.cam.pos[2]],to:[GX,2.9+GZ],t:0,dur:.6,inGer:true,then:()=>{G.inGer=false;G.glide={from:[GX,2.9+GZ],to:[GX,5.4+GZ],t:0,dur:1.1};}};}
  else if(a.k==="gbuild")gbChoose(a.spot);else if(a.k==="wish")wishOpen();
  else if(a.k==="sleepinfo")sleepInfo();else if(a.k==="arch")archOpen();else if(a.k==="shagai")shOpen();else if(a.k==="matPut")matPut();
  else if(a.k==="archinfo")hint("Энд сур харвана. Гэрт, баруун талын хананд өлгөөтэй нум сумаа аваад ирээрэй.",5000);
  else if(a.k==="bowTake"){if(INV.hand&&INV.hand!=="bow")hint("Гартаа хувинтай байна. Эхлээд хувингаа тавиарай.",4000);else{INV.hand="bow";airSave();itemsShow();bowWall(false);hint("Нум сумаа авлаа. Гэрийн урд, харвааны цагаан зурвас дээр очоод «Сур харвах».",5500);}}
  else if(a.k==="bowPut"){INV.hand=null;airSave();itemsShow();bowWall(true);}
  else if(a.k==="milk")milkOpen();else if(a.k==="churn")churnOpen();
  else if(a.k==="boil")boilOpen();else if(a.k==="aarCut")cutOpen();else if(a.k==="aarInfo")hint(aarInfo(),6000);
  else if(a.k==="aarGet"){const n=AARU.r.n,st=AARU.r.sty||"orig";AARU.made=(AARU.made||0)+n;AARU.basket[st]=(AARU.basket[st]||0)+n;AARU.r={st:"empty",sty:"",sun:0,n:0};aaruSave();aarRebuild();bkBadge();if(SND.chime)SND.chime();
    hint(`${n} ааруулаа сагсандаа хийлээ. Баруун дээд «Сагс»-аас амталж, багийнхандаа бэлэглэж болно.`,6500);}
  else if(a.k==="giftOpen")giftOpenCard();
  else if(a.k==="pour"){INV.hand="pail";AIR={ph:"churn",n:0,t0:0,done:AIR.done};airSave();carryShow();SND.slosh&&SND.slosh(1);hint("Саамаа хөхүүрт хийлээ. Одоо жигд хэмээр бүлэх хэрэгтэй.",4200);}
  else if(a.k==="serve")holdOpen({title:"Айраг утгах",tip:"Шанагаар хөхүүрээс утгаж, ширээн дээрх домбонд хийнэ. Товчийг дарж барина.",icon:"ladle",btn:"Утгах",dur:3.5,look:[KH[0],.6,KH[1]],
    done:()=>{AIR={ph:"empty",n:0,t0:0,done:(AIR.done||0)+1};INV.jar=1;airSave();hint("Айраг домбонд орлоо. Ширээн дээрээс аяганд аягалаарай. Жаахныг нь хөхүүрт үлдээв — дараагийн саамны хөрөнгө болно.",6000);}});
  else if(a.k==="cups")holdOpen({title:"Айраг аягалах",tip:"Домбоноос аяганд аажуухан аягална. Цалгиулахгүй.",icon:"bowl",btn:"Аягалах",dur:3,look:[GX,.45,-2.0+GZ],
    done:()=>{INV.jar=0;INV.bowls=2;airSave();hint("Айргаа аяганд аягалж ширээн дээр тавилаа. Ирсэн зочдод барина.",5000);}});
  else if(a.k==="pailTake"){INV.hand="pail";airSave();itemsShow();hint("Хувин авлаа. Зэлд уясан унаганы дэргэд «Гүү саах».",4000);}
  else if(a.k==="pailPut"){INV.hand=null;airSave();itemsShow();}
  else if(a.k==="pailinfo")hint("Гүү саахад хувин хэрэгтэй. Зэлийн баруун гадасны дэргэдээс хувин аваарай.",4500);
  else if(a.k==="drink")holdOpen({title:"Ус уух",tip:"Аягаа өргөөд ус уугаарай. Товчийг дарж барина.",icon:"cup",btn:"Уух",dur:2.5,look:[WBOWL[0],WBOWL[1],WBOWL[2]],
    done:()=>{G.drank=(G.drank||0)+1;hint("Ус уулаа. Цангаа гарлаа.",3500);}});
  else if(a.k==="chest")chestOpen();
  else if(a.k==="sleep")sleepStart();
  else if(a.k==="aragTake"){INV.arag=true;airSave();itemsShow();hint("Араг үүрлээ. Гадаа мал бэлчсэн газраас аргал түүгээрэй.",4500);}
  else if(a.k==="aragPut"){INV.arag=false;airSave();itemsShow();hint(`Араг тулганы дэргэд тавилаа. ${INV.argal} аргалтай.`,3500);}
  else if(a.k==="argal")argalPick();
  else if(a.k==="argalinfo")hint("Аргал түүхэд араг хэрэгтэй. Гэрт, тулганы дэргэд араг бий.",4500);
  else if(a.k==="light")stoveLight();
  else if(a.k==="restIn")restOpen("fire");
  else if(a.k==="khinfo")hint(AIR.ph==="ferment"?`Айраг исэж байна. Шаагиа зогстол хөдөлгөхгүй байя. Жинхэнэдээ 7–8 цаг; тоглоомд ${dur(FERM)} — ${dur(FERM-(G.played-AIR.t0))} үлдлээ.`:"Хөхүүр хоосон. Өдөр зэлд гүүгээ сааж, саамаа энд хийгээрэй.",4500);
  else if(a.k==="milkinfo")hint("Хувин саамтай байна. Гэрт ороод хөхүүрт хийгээрэй.",3800);
  else if(a.k==="zelinfo")hint("Орой нар жаргахад гүүгээ тавьж, адуугаа бэлчээдэг. Өглөө нар гарахад дахин зэл татаж, гүүгээ барина.",5500);
  else if(a.k==="free"){releaseFlock();hint("Хонь чинь нэг нэгээрээ бэлчээр рүүгээ гарч байна.",3500);}
  else if(a.k==="gate"){GATE.want=GATE.want?0:1;G.gateAuto=0;if(SND.burst&&SND.ctx)SND.burst(SND.ctx.currentTime,.5,{f:300,q:3,v:.03,type:"bandpass"});
    if(GATE.want&&penCount()>0&&flockPhase()!=="night"){releaseFlock();hint("Хаалга нээгдлээ. Хонь чинь нэг нэгээрээ бэлчээр рүүгээ гарч байна.",4000);}
    else if(GATE.want&&penCount()>0)hint("Шөнө хонь хашаандаа амарна. Өглөө гаргаарай.",4000);}}

/* ---------- галын дэргэд: 2D сонголтууд, камер зөөлөн тогтоно ---------- */
/* сунгалтын алхам бүрийн зураг (энгийн дүрс, зөөлөн хөдөлгөөнтэй) */
const FIG=(arms,extra,cls)=>`<svg viewBox="0 0 120 120" class="${cls||""}"><g fill="none" stroke="#F4EEE2" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><circle cx="60" cy="24" r="10" fill="#F4EEE2" stroke="none"/><path d="M60 36v38M60 74l-14 34M60 74l14 34"/>${arms}</g>${extra||""}</svg>`;
const EXFIG=[FIG('<path d="M60 44l-16-30M60 44l16-30"/>','','up'),
  FIG('<path d="M60 46l-20 22M60 46l20 22"/>','<path d="M38 40a12 12 0 1 1 6 12M82 40a12 12 0 1 0-6 12" fill="none" stroke="#FFC24A" stroke-width="3"/>','roll'),
  FIG('<path d="M60 46l-20 22M60 46l20 22"/>','<path d="M38 18q-8 6-4 14M82 18q8 6 4 14" fill="none" stroke="#FFC24A" stroke-width="3"/>','tilt'),
  FIG('<path d="M60 44l18-26M60 44l-22 16"/>','<path d="M86 30q10 14 2 30" fill="none" stroke="#FFC24A" stroke-width="3"/>','side')];
const EX={
  stretch:{title:"1 минут сунгалт",steps:[["Хоёр гараа толгой дээгүүрээ аажуухан сунгаад, урт амьсгал ав.",15],["Мөрөө урагш, хойш зөөлөн эргүүл.",15],["Толгойгоо баруун, зүүн тийш зөөлөн хазайлга. Өвдвөл зогсоорой.",15],["Гараа дээш сунгаад биеэ хажуу тийш зөөлөн тат.",15]]},
  breath:{title:"Амьсгалаа ажиглах",breath:true,steps:Array.from({length:6},()=>[["Аажуухан амьсгал ав…",4],["Аажуухан гарга…",6]]).flat()},
  goal:{title:"Өнөөдрийн жижиг зорилго",steps:[["Өнөөдөр хийж чадах нэг жижиг зүйлээ бодоорой.",10],["Жишээ нь: ус уух, гэрийнхэндээ туслах, 10 минут ном унших.",10],["Бичих шаардлагагүй. Бодоход л хангалттай.",10]]}};
/* амрах газрууд: галын дэргэд, Салхит толгодын орой. Дасгалууд нь ижил */
const SPOTS={
  fire:{seat:[-1.2+GX,-.25+GZ],ger:1,look:()=>[GX,.25,GZ],lift:[.05,.08],title:"Галын дэргэд",sub:"Хүсвэл нэгийг сонго. Хүсэхгүй бол зүгээр л суугаад аргалын галаа харж болно.",sit:"Галын шажигнах чимээ"},
  hill:{seat:W3MAP.HSEAT,look:()=>{const S=W3MAP.HSEAT,D=W3MAP.HVIEW;return [S[0]+D[0]*80,w3H(S[0],S[1])+G.eye-4.2,S[1]+D[1]*80];},lift:[.12,.16],
    title:"Салхит толгод дээр",sub:"Хүсвэл нэгийг сонго. Хүсэхгүй бол зүгээр л суугаад салхи сонсоорой, алс харагдах уулсаа ажиглаарай.",sit:"Салхи, шувууны чимээ"}};
function restOpen(k){if(G.rest)return;const S=SPOTS[k]||SPOTS.fire;if(G.ride)dismount(true);G.rest={ex:null,spot:k||"fire"};document.body.classList.add("resting");G.mv.f=G.mv.s=0;G.keys={};
  G.glide={from:[G.cam.pos[0],G.cam.pos[2]],to:S.seat,t:0,dur:1.3,inGer:!!S.ger};
  $("#restTitle").textContent=S.title;$("#restSub").textContent=S.sub;$("#sitSub").textContent=S.sit;$("#rest").setAttribute("aria-label",S.title);
  {const L=S.look(),sy=S.ger?1.3:w3H(S.seat[0],S.seat[1])+G.eye,t=yp([S.seat[0],sy,S.seat[1]],L);let dy=t.yaw-G.cam.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));
   G.tw=[{t0:performance.now(),dur:RM?1:1400,from:{yaw:G.cam.yaw,pitch:G.cam.pitch},to:{yaw:G.cam.yaw+dy,pitch:t.pitch-(innerHeight>innerWidth?S.lift[0]:S.lift[1])}}];G.look=null;}   /* харах зүйл 2D цонхны дээр харагдана */
  $("#rest").hidden=false;$("#restMenu").hidden=false;$("#restRun").hidden=true;$("#standBtn").hidden=true;setTimeout(()=>{try{$("#restMenu button[data-ex]").focus({preventScroll:true});}catch(e){}},50);}
function restClose(){if(!G.rest)return;exStop();G.rest=null;document.body.classList.remove("resting");$("#rest").hidden=true;}
function exStart(k){if(!G.rest)return;const E=EX[k];if(k==="sit"){$("#restMenu").hidden=true;$("#standBtn").hidden=false;G.rest.ex={k};return;}
  const total=E.steps.reduce((s,x)=>s+x[1],0);G.rest.ex={k,E,i:0,left:E.steps[0][1],total,done:0,paused:false};
  $("#restMenu").hidden=true;$("#restRun").hidden=false;$("#exTitle").textContent=E.title;$("#exPause").textContent="Түр зогсоох";$("#exDone").textContent="Дуусгах";exShow();}
function exShow(){const X=G.rest&&G.rest.ex;if(!X||!X.E)return;const [txt]=X.E.steps[X.i]||["",0];$("#exText").textContent=txt;$("#exFig").innerHTML=X.k==="stretch"&&EXFIG[X.i]?EXFIG[X.i]:"";$("#exBig").textContent=Math.ceil(X.left);
  $("#exArc").style.strokeDashoffset=String(326.7*(1-X.done/X.total));
  const ring=$("#exRing");if(X.E.breath){ring.classList.add("breath");ring.style.transitionDuration=X.E.steps[X.i][1]+"s";ring.style.transform=X.i%2?"scale(.78)":"scale(1.08)";}else{ring.classList.remove("breath");ring.style.transform="";}}
function exTick(dt){const X=G.rest&&G.rest.ex;if(!X||!X.E||X.paused||X.fin)return;X.left-=dt;X.done=Math.min(X.total,X.done+dt);
  if(X.left<=0){X.i++;if(X.i>=X.E.steps.length){X.fin=true;$("#exText").textContent="Сайхан байлаа. Хүссэн үедээ дахин хийж болно.";$("#exBig").textContent="✓";$("#exArc").style.strokeDashoffset="0";
      $("#exPause").textContent="Дахин";$("#exDone").textContent="Буцах";return;}X.left=X.E.steps[X.i][1];exShow();}
  else{const b=Math.ceil(X.left);if($("#exBig").textContent!==String(b))$("#exBig").textContent=b;$("#exArc").style.strokeDashoffset=String(326.7*(1-X.done/X.total));}}
function exStop(){if(G.rest)G.rest.ex=null;$("#restRun").hidden=true;$("#standBtn").hidden=true;$("#restMenu").hidden=false;const r=$("#exRing");r.style.transform="";r.classList.remove("breath");}

/* ---------- хонь, морийг илэх (хуруугаар дарах) ---------- */
function tap(cx,cy){const c=G.cam;if(!G.W||!c.VP||G.rest)return;const asp=c.W/c.H,foc=c.H/2/Math.tan((asp<1?62:50)*Math.PI/360);
  let best=null,bs=1;const T=(p,rad,o)=>{if(Math.hypot(p[0]-c.pos[0],p[1]-c.pos[1],p[2]-c.pos[2])>22)return;const q=w3Proj(c,p);if(!q)return;const rp=Math.max(30,rad*foc/q.w*1.2),dd=Math.hypot(q.x-cx,q.y-cy)/rp;if(dd<bs){bs=dd;best=o;}};
  (G.flock||[]).forEach(a=>T([a.x,w3H(a.x,a.z)+.55*a.sc,a.z],.45*a.sc,{a}));if(!G.ride&&G.hm)T(m4p(G.hm,[.25,1.3,0]),1.05,{horse:1});
  if(!best)return;const t=G.tsec;SND.start();
  if(best.a){const a=best.a;a.joy=t;a.calm=t+12;a.lk=1;
    if(a.mode!=="leave"&&!G.ride){const px=G.cam.pos[0],pz=G.cam.pos[2],d=Math.hypot(a.x-px,a.z-pz);   /* баярлаад наашаа ойртоно */
      if(d>1.4){a.st=1;a.tx=px+(a.x-px)/d*1.15;a.tz=pz+(a.z-pz)/d*1.15;a.sp=.4;a.t=8;a.come=t;}else{a.st=0;a.t=5;}}SND.baa(.8,a.lamb);const hp=w3Proj(c,[a.x,w3H(a.x,a.z)+.9*a.sc,a.z]);if(hp)hearts(hp.x,hp.y,4);}
  else{G.hjoy=t;SND.snort();const hp=w3Proj(c,m4p(G.hm,[1.0,2.05,0]));if(hp)hearts(hp.x,hp.y,5);}}
function hearts(x,y,n){const box=$("#hearts");for(let i=0;i<n;i++){const h=document.createElement("i");h.style.left=(x-11+(Math.random()-.5)*36)+"px";h.style.top=(y-11+(Math.random()-.5)*14)+"px";
  h.style.setProperty("--dx",((Math.random()-.5)*60).toFixed(0)+"px");h.style.animationDelay=(i*.12)+"s";box.appendChild(h);setTimeout(()=>h.remove(),1800+i*120);}}
let hintT=0;function hint(txt,ms){const h=$("#hint");clearTimeout(hintT);if(!txt){h.hidden=true;return;}h.textContent=txt;h.hidden=false;hintT=setTimeout(()=>{h.hidden=true;},ms||4000);}

/* ---------- кадр бүр ---------- */
let envT=-9,ENV=null,perfT=0,saveT=0;
/* тохиргооны нэмэлт: алсын адуу, үүл, гэрийн дотор талыг холоос зурахгүй */
function applyExtras(){const W=G.W;
  if(G.hx&&!G.hx.cut){G.hx.cut=1;G.hx.herd.splice(W3Q.herd).forEach(h=>{h.h.on=false;});
    /* шинэ морины дэлний нарийн ширхэг (lod:0, 204 мянган гурвалжин) зөвхөн унадаг морьд; сүрэг, унага, Бага чанарт хөнгөн дэл (hair card) */
    G.hx.herd.forEach(h=>{h.h.lod=1;});if(W3Q.sheepLod>0)G.hx.main.h.lod=1;}
  if(W.skyD&&!W.skyD.cut){W.skyD.cut=1;W.skyD.puffs.forEach((q,i)=>{q.skip=!!(W3Q.cloudsHalf&&i%2);});}
  if(GERX.on&&!G.inner&&W.gerParts){G.inner=W.gerParts.filter(m=>m.emit>0);}}
function update(dt,t,now){const c=G.cam;G.tsec=t;if(!G.hx&&G.W.hx)G.hx=G.W.hx;applyExtras();
  G.tw=G.tw.filter(w=>{const k=Math.min(1,Math.max(0,(now-w.t0)/w.dur)),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;c.yaw=w.from.yaw+(w.to.yaw-w.from.yaw)*e;c.pitch=w.from.pitch+(w.to.pitch-w.from.pitch)*e;return k<1;});
  if(G.look){const k=1-Math.exp(-dt*26),L=G.look,dy=L.yaw-c.yaw,dp=L.pitch-c.pitch;c.yaw+=dy*k;c.pitch+=dp*k;if(!G.drag&&Math.abs(dy)<.0015&&Math.abs(dp)<.0015){c.yaw=L.yaw;c.pitch=L.pitch;G.look=null;}}
  if(G.started)G.cycT+=dt;   /* өдрийн эргэлт: тоглоом эхэлснээс хойш л явна */
  if(t-envT>(G.tod==="cycle"?.2:2)||!ENV){envT=t;ENV=envNow();}const env=Object.assign({},ENV,{wind:ENV.wind*(1+.28*Math.sin(t*.13)*Math.sin(t*.047+1))});G.env=env;
  if(G.ride)rideStep(dt,c);else if(G.glide)glideStep(dt,c);
  else if(!busy()){const K=G.keys,kf=(K.w||K.arrowup?1:0)-(K.s||K.arrowdown?1:0),ks=(K.d?1:0)-(K.a?1:0),rot=(K.arrowright?1:0)-(K.arrowleft?1:0);if(rot){G.look=null;c.yaw+=rot*1.8*dt;}
    let f=G.mv.f+kf,sx=G.mv.s+ks,mag=Math.hypot(f,sx);if(mag>1){f/=mag;sx/=mag;mag=1;}{const g=mag<.1?0:Math.min(1,mag*1.2)/mag;f*=g;sx*=g;}
    const run=K.shift?1.7:1,sm=G.sm,ka=1-Math.exp(-dt*(mag>.1?7:10));sm.f+=(f*run-sm.f)*ka;sm.s+=(sx*run-sm.s)*ka;const v=Math.hypot(sm.f,sm.s);
    if(v>.02){const sp=2.4,fx=Math.sin(c.yaw),fz=-Math.cos(c.yaw),rx=Math.cos(c.yaw),rz=Math.sin(c.yaw);const p=collide(c.pos[0]+(fx*sm.f+rx*sm.s)*sp*dt,c.pos[2]+(fz*sm.f+rz*sm.s)*sp*dt);
      c.pos[0]=p[0];c.pos[2]=p[1];G.inGer=gerIn(p[0],p[1]);G.step=(G.step||0)+v*sp*dt;G.moving=1;
      if(G.step>(G.lastStep||0)+1.1){G.lastStep=G.step;SND.step(G.inGer);}}else{G.moving=0;sm.f=sm.s=0;}
    G.bobA=(G.bobA||0)+((G.moving?Math.min(1,v):0)-(G.bobA||0))*Math.min(1,dt*6);
    /* хаалгаар шууд орж гарна (товчгүй) */
    if(GERX.on&&GB.built){const x=c.pos[0]-GX,z=c.pos[2]-GZ;if(!G.inGer&&Math.abs(x)<.5&&z<3.45&&z>2)G.inGer=true;else if(G.inGer&&z>3.55)G.inGer=false;}
    const want=(G.inGer?1.3:w3H(c.pos[0],c.pos[2])+G.eye)+Math.sin((G.step||0)*5.2)*.02*(G.bobA||0);c.pos[1]+=(want-c.pos[1])*(1-Math.exp(-dt*12));}
  const m=G.P.m;m.sky.m=M4.T(c.pos[0],0,c.pos[2]);
  if(m.fire)m.fire.m=M4.trs([GX,0,GZ],{s:[1+.06*Math.sin(t*11),.8+.24*Math.abs(Math.sin(t*6.3))+.08*Math.sin(t*17.1),1+.06*Math.cos(t*9)]});
  /* гэрийн тулгын гал (аргал түлэхэд): дөл тогооны доор, утаа тооноор гарна */
  {const L=STOVE.k,on=L>.02,fl=RM?1:1+.12*Math.sin(t*12.3)+.08*Math.sin(t*19.1),f2=RM?1:1+.15*Math.sin(t*15.7+1)+.1*Math.sin(t*23.3),s0=.36*L,y=.07;
    m.flame.on=m.flame2.on=on;if(on){m.flame.m=M4.trs([GX,y,GZ],{ry:t*.6,s:[s0*(1+.06*Math.cos(t*9.7)),s0*fl*.8,s0*(1+.06*Math.sin(t*8.3))]});
      m.flame2.m=M4.trs([GX,y,GZ],{ry:-t*.9,s:[s0*(1+.08*Math.sin(t*11.1)),s0*f2*.75,s0*(1+.08*Math.cos(t*10.3))]});m.flame.emit=1.2;m.flame2.emit=1.5;}
    m.fpuffs.forEach((p,i)=>{const k=((t*.1+i/7)%1),sz=.25+k*1.4;p.on=on&&!G.inGer;if(!p.on)return;p.alpha=.3*L*(1-k)*Math.min(1,k*8);
      p.m=M4.trs([GX+Math.sin(k*3+i)*.15+k*k*1.4*env.wind*10,3.45+k*3.2,GZ-k*.3],{s:[sz,sz*.85,sz]});p.tint=V3.lerp([.85,.85,.85],env.sunC,.3);});}
  m.glow.on=false;   /* тооно гэрэл шиг гэрэлтэхгүй: тооноор тэнгэр харагдана */
  if(m.fireBase)m.fireBase.on=false;   /* гадна гал байхгүй */
  m.puffs.forEach((p,i)=>{const k=((t*.1+i/10)%1),s=.45+k*2.4;p.alpha=.5*(1-k)*Math.min(1,k*8);p.m=M4.trs([GX+Math.sin(k*3+i)*.25+k*k*2.2,(GERX.on?3.45:2.4)+k*4.2,GZ-k*.6],{s:[s,s*.85,s]});p.tint=V3.lerp([1,1,1],env.sunC,.35);});
  m.clouds.forEach(q=>{q.mesh.on=!G.W.skyOn;const a=q.yaw+t*.0025;q.mesh.m=M4.trs([c.pos[0]+Math.sin(a)*q.d,q.y,c.pos[2]-Math.cos(a)*q.d],{ry:-a});});
  flockStep(dt,t,c);
  let hm=null,gp=null,amp=1;
  if(G.ride){const R=G.ride,B=G.hx?{y:0,rz:0}:s3RideBob(R);hm=M4.trs([R.x,w3H(R.x,R.z)+landLift(R.x,R.z)+B.y,R.z],{ry:Math.PI/2-R.h,rz:B.rz});gp=Math.abs(R.v)>.05?R.ph:null;amp=R.amp||0;}
  if(!hm){let rz=0;if(G.hjoy!=null){const k=(t-G.hjoy)/1.3;if(k>=1||k<0)G.hjoy=null;else rz=Math.abs(Math.sin(k*Math.PI*2))*.075*(1-k*.4);}hm=M4.trs(G.horseBase,{ry:G.horseRy??.15,rz});}
  G.hm=hm;if(G.hx)w3HxStep(G,hm,gp,amp,t,dt,c);else w3HorsePose(G.hz,hm,gp,t,amp,!!(G.ride&&G.ride.gait===1));
  const day=env.night<.5;
  G.P.bf.forEach(b=>{const P=q=>{const tt=q+b.ph,cx=b.c[0]+Math.sin(b.a)*b.r,cz=b.c[2]-Math.cos(b.a)*b.r;return [cx+Math.sin(tt*.37)*1.3+Math.sin(tt*.91)*.4,cz+Math.cos(tt*.29+1.7)*1.3+Math.sin(tt*.71)*.3];};
    const p0=P(t),p1=P(t+.05),tt=t+b.ph,fl=.15+.85*Math.abs(Math.sin(tt*17));const by=w3H(p0[0],p0[1])+.5+.22*Math.sin(tt*1.9)+.08*Math.sin(tt*5.3);
    const kd=Math.max(0,Math.min(1,(Math.hypot(p0[0]-c.pos[0],by-c.pos[1],p0[1]-c.pos[2])-2)/1.2)),bs=1.7*kd;   /* камерт ойртвол аажуухан жижгэрч алга болно, дэлгэц дүүргэхгүй */
    b.m.on=day&&!G.inGer&&kd>0;
    b.m.m=M4.trs([p0[0],by,p0[1]],{ry:Math.atan2(-(p1[1]-p0[1]),p1[0]-p0[0]),s:[bs,bs,bs*fl]});});
  {const px=G.ride?G.ride.x:c.pos[0],pz=G.ride?G.ride.z:c.pos[2],V=G.vel||(G.vel=[0,0]);
   if(G.lastP){const k=1-Math.exp(-dt*3),ivt=1/Math.max(dt,1e-3);V[0]+=((px-G.lastP[0])*ivt-V[0])*k;V[1]+=((pz-G.lastP[1])*ivt-V[1])*k;}G.lastP=[px,pz];
   W3SHC[0]=Math.round(px/2)*2;W3SHC[2]=Math.round(pz/2)*2;W3SHC[1]=w3H(W3SHC[0],W3SHC[2]);
   W3GRASS.update(G.W,px,pz,V[0],V[1],G.grassBudget||3);W3WISH.step(G.W,G.P,c,t,G.inGer);
   if(G.started)placeStep(px,pz);horseHome(px,pz);
   /* Салхит толгод: салхи хүчтэй (өвс илүү найгана, салхины чимээ чанга), дээгүүр хоёр элээ эргэлдэнэ */
   const hd=Math.hypot(px-W3MAP.HILL[0],pz-W3MAP.HILL[1]);G.windK=1+1.3*ss3(34,10,hd);
   if(G.P.eagles){const H=W3MAP.HILL,hy=w3H(H[0],H[1]);G.P.eagles.forEach((e,i)=>{const a=t*.13*e.dir+e.ph,r=15+5*Math.sin(t*.05+i*1.7),x=H[0]+Math.cos(a)*r,z=H[1]+Math.sin(a)*r,y=hy+17+3*Math.sin(t*.07+i*2);
     const vx=-Math.sin(a)*e.dir,vz=Math.cos(a)*e.dir;e.m.m=M4.trs([x,y,z],{ry:Math.atan2(-vz,vx),rx:-.32*e.dir,s:[1.5,1.5,1.5]});e.m.on=!G.inGer;});}}
  /* айраг: тоглосон хугацаа (исэх), унага, бүлүүр, хөөс */
  if(G.started){G.played=(G.played||0)+dt;if(AIR.ph==="ferment"&&G.played-AIR.t0>=FERM){AIR.ph="ready";airSave();if(!G.churn)hint("Айраг исэж бэлэн боллоо. Гэрийн хөхүүрээс аягалаарай.",4500);if(SND.chime)SND.chime();}}
  /* ааруул: шахах, нар салхинд хатаах, тараг хутгах */
  if(G.started){const A=AARU;if(A.p.ph==="press"&&G.played-A.p.t0>=PRESS_T){A.p.ph="pressed";aaruSave();}
    if(A.r.st==="wet"&&sunUp()){A.r.sun+=dt;if(Math.floor(A.r.sun/30)!==Math.floor((A.r.sun-dt)/30))aaruSave();
      if(A.r.sun>=SUN_T){A.r.st="dry";aaruSave();if(!G.churn&&!G.boil&&!G.cut)hint("Тавиур дээрх ааруул хатлаа! Хураагаад даавуун уутанд хийгээрэй.",5000);if(SND.chime)SND.chime();}}}
  boilStep(dt);bagStep(dt);splStep(dt);potStep(t);holdStep(dt);houseStep(dt,t,c);playStep(dt,t);gbStep(dt,t,c);
  {const P=G.P.m;if(P.aarR){if(G.aarBuilt!==P.aarR)aarRebuild();P.press.on=AARU.p.ph!=="idle";const R=AARU.r,k=R.st==="wet"?Math.min(1,R.sun/SUN_T):1;
    const sh=R.st==="wet"&&sunUp()?.03*Math.sin(t*5):0;P.aarR.tint=R.sty==="orig"?[1,1,1]:[1.06-.06*k+sh,1.06-.09*k+sh,1.07-.17*k+sh];
    plateSync();P.gift.on=GIFTS.unopened().length>0;if(P.gift.on)P.gift.m=M4.trs([0,Math.abs(Math.sin(t*1.6))*.012,0],{});}}
  if(t-(G.giftT||0)>3){G.giftT=t;if(GIFTS.tick())bkBadge();}
  {const P=G.P.m;GATE.a=Math.max(0,Math.min(1,GATE.a+(GATE.want?1:-1)*dt/2.4));if(P.gate)P.gate.m=M4.trs([PEN.gx1,w3H(PEN.gx1,PEN.z1)-.02,PEN.z1],{ry:gateRy()});}
  /* адуу ус уух: хааяа нэг морь тэвш рүү алхаж очоод толгойгоо гудайлгана */
  if(G.hx&&t>(G.drinkT||20)){G.drinkT=t+28+Math.random()*25;const H0=G.hx.herd.filter(h=>h.st!==1),H=H0.length?H0:G.hx.herd;const h=H[Math.floor(Math.random()*H.length)];
    if(h){const k=Math.random()<.5?-1:1;h.tx=TROUGH[0]+k*.55+(Math.random()-.5)*.3;h.tz=TROUGH[1]+(h.z>TROUGH[1]?.95:-.95);h.st=1;h.until=t+20;hxSwitch(h,"Walk",t);G.drinks=(G.drinks||0)+1;}}
  /* зэл: унага уяатай, гүү нь унаганыхаа хажууд зогсоно (гүүг саана) */
  if(G.hx&&(!G.foals||G.foals.K!==G.hx.K)){const H=G.hx,CO=["#6B3A1E","#D9CDB6"],MC=["#7A4A2A","#8F8C86"],n=W3Q.herd>=2?2:1;
    G.foals=FOALS.slice(0,n).map((f,i)=>({x:f[0],z:f[1],ry:f[2],s:.55,a:"Idle_1",t0:-Math.random()*5,until:1+Math.random()*4,prev:null,h:H.K.inst(0,[...hex(CO[i]),1])}));
    G.foals.forEach(f=>{f.h.lod=1;});
    G.mares=FOALS.slice(0,n).map((f,i)=>({x:f[0]+ZDIR[0]*1.2,z:f[1]+ZDIR[1]*1.2,ry:f[2],s:1,mare:1,a:"Idle_1",t0:-Math.random()*5,until:1+Math.random()*4,prev:null,h:H.K.inst(1,[...hex(MC[i]),1])}));
    G.mares.forEach(f=>{f.h.lod=W3Q.sheepLod>0?1:0;});G.foals.K=H.K;}   /* WebGL сэргэсний дараа шинэ морины kit-д дахин үүсгэнэ */
  if(G.foals){const H=G.hx,J=H.J,open=zelOpen();for(const f of G.foals.concat(G.mares)){const d=Math.hypot(f.x-c.pos[0],f.z-c.pos[2]);f.h.on=open&&!G.inGer&&d<140;f.h.far=d>70;
    if(f.h.on){if(t>f.until){const nx=f.a==="Eat"?"Idle_1":Math.random()<.5?"Eat":"Idle_1";hxSwitch(f,nx,t);f.until=t+J.anims[nx].d*(1+(Math.random()*2|0));}
      hxPose(J,hxSlots(f,t),f.h.B);f.h.dirty=true;f.h.m=M4.mul(M4.trs([f.x,w3H(f.x,f.z),f.z],{ry:f.ry,s:f.s}),H.A);}}}
  /* шөнө гэрийн дотор: дэнлүүний дулаан бүдэг гэрэл */
  if(G.inner&&G.env){const n=G.env.night||0,f=STOVE.k,key=n+f*7;if(Math.abs((G.innerN??-1)-key)>.01){G.innerN=key;   /* аргал түлэхэд гэр шар дулаан гэрлээр гэрэлтэнэ */
    const T=[(1-.2*n)*(1+.42*f),(1-.36*n)*(1+.26*f),(1-.55*n)*(1+.08*f)];G.inner.forEach(m=>{m.tint=T;if(m.emit0===undefined)m.emit0=m.emit;m.emit=m.emit0+.24*f;});}}
  if(G.inner){const see=G.inGer||(Math.hypot(c.pos[0]-GX,c.pos[2]-GZ-4)<11&&c.pos[2]-GZ>1.8)||!!G.build;for(const m of G.inner)m.on=see&&m.gbOn!==false;}}
/* газрын нэр: ирэхэд хэсэг гарна (гарч яваад буцаж ирэхэд дахин) */
let placeT=0;
function placeStep(x,z){const cur=W3MAP.PLACES.find(P=>Math.hypot(x-P.x,z-P.z)<P.r);
  if(cur&&cur.id!==G.place){G.place=cur.id;showPlace(cur.name);}
  else if(!cur&&G.place){const P=W3MAP.PLACES.find(q=>q.id===G.place);if(!P||Math.hypot(x-P.x,z-P.z)>P.r+12)G.place=null;}}
function showPlace(name){const el=$("#place");clearTimeout(placeT);el.textContent=name;el.hidden=false;requestAnimationFrame(()=>el.classList.add("on"));
  placeT=setTimeout(()=>{el.classList.remove("on");placeT=setTimeout(()=>{el.hidden=true;},900);},2800);}
/* морь: хол орхисон бол өөрөө гэр лүүгээ буцна (тоглогчийн харагдахгүй зайд) */
function horseHome(px,pz){const hb=G.horseBase,home=G.P&&G.P.horseBase;if(G.ride||!hb||!home)return;
  if(Math.hypot(hb[0]-home[0],hb[2]-home[2])>4&&Math.hypot(px-hb[0],pz-hb[2])>70&&Math.hypot(px-home[0],pz-home[2])>40){G.horseBase=home.slice();G.horseRy=.15;}}
/* Хүслийн мод: 2D цонх. Юу ч бичүүлэхгүй; зөвхөн хадгийн өнгө энэ төхөөрөмжид хадгалагдана */
function wishOpen(){if(G.wish)return;if(G.ride)dismount(true);G.wish=true;document.body.classList.add("resting");G.mv.f=G.mv.s=0;G.keys={};
  lookAt([W3WISH.X,w3H(W3WISH.X,W3WISH.Z)+(innerHeight>innerWidth?3.4:3),W3WISH.Z],1100);
  $("#wish").hidden=false;setTimeout(()=>{try{$("#wish [data-kh]").focus({preventScroll:true});}catch(e){}},50);}
function wishClose(){if(!G.wish)return;G.wish=false;document.body.classList.remove("resting");$("#wish").hidden=true;}
function tieKhadag(ci){KHADAG.push(ci);if(KHADAG.length>24)KHADAG.shift();W3WISH.S.khadag=KHADAG;w3Save({khadag:KHADAG});W3WISH.rebuildKhadag(G.P);
  if(SND.chime)SND.chime();wishClose();
  G.wishFx={t:0};hint("Хадгаа уялаа. Хүслийн мод өнгө өнгийн туяагаар гэрэлтэж, тэнгэрт од нисэж байна…",6000);}
function frame(){if(!G.on||G.lost)return;G.raf=requestAnimationFrame(frame);
  const now=performance.now(),c=G.cam,t=(now-G.t0)/1000,dt=Math.min(.1,(now-(G.lt||now))/1000);G.lt=now;
  update(dt,t,now);const env=G.windK>1.01?Object.assign({},G.env,{wind:G.env.wind*G.windK}):G.env;
  w3Draw(G.W,c,env,t);PERF.frame();
  if(!G.firstDrawn){G.firstDrawn=true;PERF.mark("firstFrame");}
  if(!PERF.marks.allReady&&GERX.on&&G.W.hx&&G.W.sh&&G.W.skyOn)PERF.mark("allReady");
  /* товч, чимээ, хэмжилт */
  const a=pickAct(c);if((a&&a.k)!==(G.act&&G.act.k)){G.act=a;const b=$("#actBtn");b.hidden=!a;if(a)b.textContent=a.t+(FINE?"  (E)":"");}
  SND.update(dt,{inGer:G.inGer,wind:env.wind/.07,day:1-env.night*1.6-(env.glow>.6?.3:0),fireNear:G.inGer?STOVE.k*.9:0,resting:!!G.rest});
  exTick(dt);
  if(G.showPerf&&now-perfT>500){perfT=now;const q=G.W.q;$("#perf").textContent=PERF.text(`чанар ${W3QSEL.auto?"Авто":W3PRESETS[W3QSEL.key].name} · dpr ${q.dpr} · өвс ${q.grass} · сүүдэр ${q.shadows?(W3Q.shadow||1024)+"px":"үгүй"} · зурагт ${q.post?"тийм":"үгүй"}\n${W3INFO.gpu||""}`);}
  if(now-saveT>5000){saveT=now;savePos();}}
function savePos(){const c=G.cam;if(!G.W)return;const p=G.ride?[G.ride.x,G.ride.z]:[c.pos[0],c.pos[2]];w3Save({pos:G.inGer?[0,5.4]:p,yaw:+c.yaw.toFixed(3),played:Math.round(G.played||0),airag:AIR});}
/* ---------- айраг: 2D цонхнууд ---------- */
const AFACTS=["Монголчууд айргийг ширэн хөхүүрт бүлж исгэдэг. 800 гаруй жилийн өмнө Рубрук: «гүүний сүүг том ширэн хөхүүрт хийж, нүхтэй модон бүлүүрээр бүлж исгэдэг» гэж бичжээ.",
  "Зун саамаа хийнгүүт 5000–7000 удаа бүлдэг. Энэ нь 2–3 цаг үргэлжилнэ. Тоглоомд аажуухан, жигд хэмээр 35 орчим дарна.","Жигд хэмээр, цалгиулж үсчүүлэхгүй бүлэх нь айраг сайхан исэхэд хамгийн чухал.",
  `Бүлэхийг нь тааруулсан айраг 7–8 цагт исэж гүйцдэг. Тоглоомд ${dur(FERM)} хүлээнэ.`,"Бүлж дуусаад айргийн шаагиа зогстол аль болох хөдөлгөхгүй.",
  "Халуун өдөр айргийг халахаас, хүйтэнд даарахаас хамгаална. Айргийг дааруулбал хөрөнгө нь төөрдөг гэдэг.",
  "Хэдэн жил айраг исгэсэн хөхүүр өөрөө шимийг шингээсэн тул тусгай хөрөнгө шаарддаггүй.",
  "Хөрөнгөөр исгэх арга ч бий: хонь, ямааны шинэхэн таргаар хөрөнгөлж болно — саамны литр бүрт 100–150 гр тараг."];
const MFACTS=["Хоёр гадсанд урт зэл татаж, унагыг уядаг.","Гүү саахдаа нэг хүн унагыг татаж, нөгөө хүн саадаг (Рубрук, XIII зуун).",
  "Зун гүүгээ өдөрт 6–8 удаа, 40 минутаас 1 цагийн зайтай саадаг. Тоглоомд хүлээх хэрэггүй: өдөр зэлтэй үед хүссэн үедээ саана.","Орой нар жаргахад гүүгээ тавьж, адуугаа бэлчээдэг."];
function carryShow(){itemsShow();}
/* хэвтээ дэлгэцэнд цонх баруун талд гарна, тиймээс харах цэгийг баруун тийш шилжүүлж, эд зүйлийг зүүн талд үлдээнэ */
function sideLook(p,from){const L=innerWidth>innerHeight*1.15;if(!L)return p;const f=from||[G.cam.pos[0],G.cam.pos[2]],dx=p[0]-f[0],dz=p[2]-f[1],d=Math.hypot(dx,dz)||1,k=d*Math.tan(.3);
  return [p[0]-dz/d*k,p[1],p[2]+dx/d*k];}
function cardOpen(id,look){document.body.classList.add("resting");G.mv.f=G.mv.s=0;G.keys={};if(look)lookAt(sideLook(look),900);$(id).hidden=false;}
function cardClose(id){$(id).hidden=true;if(!busy())document.body.classList.remove("resting");}
function milkOpen(){if(G.milkC||INV.hand!=="pail")return;const px=G.cam.pos[0],pz=G.cam.pos[2],M=(G.mares||[]).slice().sort((a,b)=>Math.hypot(a.x-px,a.z-pz)-Math.hypot(b.x-px,b.z-pz))[0];
  G.milkC={n:0,f:0,mare:M};cardOpen("#milk",M?[M.x,w3H(M.x,M.z)+.9,M.z]:[ZEL_A[0],1,ZEL_A[1]]);milkShow();}
function milkShow(txt){const M=G.milkC;if(!M)return;$("#milkFill").style.transform=`scaleY(${Math.min(1,M.n/8)})`;$("#milkN").textContent=M.n>=8?"Хувин дүүрлээ":`${M.n} / 8`;
  if(txt)$("#milkText").textContent=txt;$("#milkFact").textContent=MFACTS[M.f%MFACTS.length];}
function milkTap(){const M=G.milkC;if(!M||M.n>=8)return;M.n++;if(SND.burst&&SND.ctx)SND.burst(SND.ctx.currentTime,.14,{f:2400,q:2,v:.014,type:"bandpass"});
  if(M.n%3===0)M.f++;if(M.n>=8){INV.hand="pail_milk";airSave();carryShow();milkShow("Хувин дүүрлээ. Саамаа гэрийн хөхүүрт хийгээрэй.");setTimeout(milkClose,1400);}else milkShow();}
function milkClose(){if(!G.milkC)return;G.milkC=null;cardClose("#milk");}
function churnOpen(){if(G.churn)return;G.churn={last:0,pd:0,f:0,ft:0,ok:AIR.n>=5000};
  const look=()=>lookAt(sideLook([KH[0],innerHeight>innerWidth?.12:.35,KH[1]],KHS),700);
  G.glide={from:[G.cam.pos[0],G.cam.pos[2]],to:KHS,t:0,dur:.8,inGer:true,then:look};cardOpen("#churn");look();churnShow();}
function churnShow(tip){const C=G.churn;if(!C)return;$("#churnN").textContent=AIR.n.toLocaleString("en-US").replace(/,/g," ");
  $("#churnArc").style.strokeDashoffset=String(326.7*(1-Math.min(1,AIR.n/5000)));if(tip)$("#churnTip").textContent=tip;
  $("#churnDone").hidden=AIR.n<5000;$("#churnFact").textContent=AFACTS[C.f%AFACTS.length];}
function churnTap(){const C=G.churn;if(!C)return;const now=performance.now()/1000,dt=now-C.last;C.last=now;
  if(AIR.n>=7000){churnShow("7000 удаа бүлчихлээ. Одоо исгэе.");return;}
  /* яарвал +10 (цалгина); энгийн +50; цагирагийн хэмээр аажуухан, жигд (0.8–2.5 сек, өмнөхтэйгээ ±0.35 сек) дарвал +150 */
  const steady=dt>=.8&&dt<=2.5&&C.pd>0&&Math.abs(dt-C.pd)<=.35;C.pd=dt<5?dt:0;
  let add=50,tip;if(dt<.42){add=10;tip="Цалгилаа! Яарахад айраг хөхүүрээс үсэрч асгарна, 10-хан тоологдоно. Аажуухан, жигд хэмээр бүлээрэй.";spill();}else if(steady){add=150;if(!C.ok)tip="Яг ийм аажуухан, жигд хэм! Нэг бүлэхэд 150 тоологдож байна.";}else if(!C.ok)tip="Сайн байна. Цагирагийн хэмээр аажуухан, жигд дарвал илүү хурдан бүлэгдэнэ.";
  AIR.n=Math.min(7000,AIR.n+add);if(SND.slosh)SND.slosh(add>10?.6:1);
  if(AIR.n>=5000&&!C.ok){C.ok=true;tip="Хангалттай бүлсэн! «Исгэх»-ийг дараад, хөдөлгөхгүй орхиё.";}
  if(now-C.ft>8){C.ft=now;C.f++;}churnShow(tip);if(AIR.n%500===0)airSave();}
/* яарч бүлэхэд айраг цалгина: 3D-д хөхүүрээс дусал үсэрч, шалан дээр толбо үлдэнэ; цонхонд дусал цацагдаж, товч доргино */
const SPL_Y=.62,SPL_FLOOR=.08;
function spill(){G.spl=G.spl||[];for(let i=0;i<7;i++){const a=Math.random()*Math.PI*2,v=.5+Math.random()*.8;
    G.spl.push({x:KH[0]+Math.cos(a)*.08,y:SPL_Y,z:KH[1]+Math.sin(a)*.08,vx:Math.cos(a)*v,vy:1.1+Math.random()*.9,vz:Math.sin(a)*v,r:.018+Math.random()*.014});}
  const row=$("#churn .churnrow"),btn=$("#churnBtn");if(row){for(let i=0;i<9;i++){const d=document.createElement("i");d.className="drop";const a=-Math.PI*(.1+.8*Math.random());
    d.style.setProperty("--dx",(Math.cos(a)*(40+Math.random()*50)).toFixed(0)+"px");d.style.setProperty("--dy",(Math.sin(a)*(50+Math.random()*40)).toFixed(0)+"px");
    d.style.setProperty("--s",(.6+Math.random()*.8).toFixed(2));row.appendChild(d);setTimeout(()=>d.remove(),750);}}
  if(btn){btn.classList.remove("spill");void btn.offsetWidth;btn.classList.add("spill");}}
function splStep(dt){const P=G.P&&G.P.m;if(!P||!P.spl)return;const L=G.spl||[],S=G.spots=G.spots||[];let ch=false;
  if(L.length){for(const d of L){d.vy-=9.8*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.z+=d.vz*dt;}
    for(let i=L.length-1;i>=0;i--)if(L[i].y<=SPL_FLOOR){const d=L[i];S.push({x:d.x,z:d.z,r:d.r*2.4+Math.random()*.02,t:G.tsec||0});L.splice(i,1);ch=true;}
    if(S.length>28){S.splice(0,S.length-28);}
    const g=new Geo(241),C=hex("#F3ECDB");L.forEach(d=>g.at([d.x,d.y,d.z],{s:d.r},q=>q.sph(1,6,C,0)));if(L.length){w3Rebuf(G.W,P.spl,g);P.spl.on=true;}else P.spl.on=false;}
  const now=G.tsec||0;if(S.length&&now-S[0].t>45){S.shift();ch=true;}
  if(ch){if(S.length){const g=new Geo(242),C=hex("#E2D6B8");S.forEach(o=>g.at([o.x,SPL_FLOOR-.065,o.z],{s:[o.r,.004,o.r*.8]},q=>q.sph(1,8,C,0)));w3Rebuf(G.W,P.splSpot,g);P.splSpot.on=true;}else P.splSpot.on=false;}}
function churnClose(ferment){const C=G.churn;if(!C)return;G.churn=null;
  if(ferment&&AIR.n>=5000&&AIR.ph==="churn"){AIR.ph="ferment";AIR.t0=G.played||0;hint(`Айраг исэж байна. Шаагиа зогстол хөдөлгөхгүй байя. 7–8 цагийн дараа бэлэн болно — тоглоомд ${dur(FERM)}.`,6000);}
  airSave();cardClose("#churn");}
/* ---------- ааруул: 2D цонхнууд ---------- */
const BFACTS=[`Тарагийг зөөлөн гал дээр тасралтгүй хутгаж буцалгадаг. Ихэвчлэн 20–30 минут. Тоглоомд ${dur(BOIL_T)} хутгана.`,"Буцалгахад уураг нь ээдэм болж тунаж, шингэн нь шар ус болж ялгардаг.",
  "Хөргөсөн аарцаа даавуун уутанд хийж шар усыг нь шүүнэ.","Шар усыг зутан, хоолонд нэмж амт оруулдаг.","Аарцанд бага зэрэг сүү нэмж дахин шүүвэл ааруул илүү амттай болдог."];
const CFACTS=["Ааруулыг утсаар зүсэх, хэвэнд шахах, гараар базах зэргээр тавьдаг.","Говь, тал хээрт ааруулыг зузаан, хангайд нимгэн тавьж хатаадаг уламжлалтай.",
  "Хорхой ааруулыг сийрэг шигшүүрээр шахаж, базмал ааруулыг алган дээрээ базаж хийдэг.","Ааруулд элсэн чихэр, нэрс, чацаргана нэмж амталдаг хүмүүс ч бий.",
  "Ааруулыг модон тавиур эсвэл гэрийн дээвэр дээр нар, салхинд хатаадаг.",`Жинхэнэдээ ааруул 7–14 хоног хатдаг. Өдөр наранд гаргаж, оройноос өглөө хүртэл гэртээ оруулдаг. Тоглоомд нар гарсан үед ${dur(SUN_T)} хатна.`];
function boilOpen(){if(G.boil||AARU.p.ph!=="idle")return;G.boil={k:AARU.bk||0,hold:false,f:0,ft:0,snd:0};
  G.glide={from:[G.cam.pos[0],G.cam.pos[2]],to:[.12+GX,1.08+GZ],t:0,dur:.7,inGer:true,then:()=>lookAt(sideLook([GX,innerHeight>innerWidth?.05:.3,GZ],[.12+GX,1.08+GZ]),600)};
  cardOpen("#boil",[GX,.3,GZ]);boilShow(AARU.bk>0?"Үргэлжлүүлэн хутгаарай.":null);}
function boilShow(tip){const B=G.boil;if(!B)return;const k=B.k;$("#boilBar").style.transform=`scaleX(${k})`;$("#boilCurd").style.opacity=String(Math.max(0,(k-.3)/.7));
  $("#boilWhey").style.opacity=String(Math.max(0,(k-.5)/.5)*.85);if(tip)$("#boilTip").textContent=tip;$("#boilDone").hidden=k<1;$("#boilBtn").disabled=k>=1;
  $("#boilFact").textContent=BFACTS[B.f%BFACTS.length];$("#boil .pot").classList.toggle("stir",B.hold&&k<1);}
function boilHold(on){const B=G.boil;if(!B)return;if(on&&!B.hold&&B.k<1)B.k=Math.min(1,B.k+.01);B.hold=!!on&&B.k<1;boilShow();}
function boilStep(dt){const B=G.boil;if(!B||!B.hold)return;const k0=B.k;B.k=Math.min(1,B.k+dt/BOIL_T);
  if(B.k>=1){B.hold=false;boilShow("Ээдэм нь тунаж, шар ус нь ялгарлаа. Одоо уутанд юүлж шүүнэ.");if(SND.chime)SND.chime();return;}
  B.snd-=dt;if(B.snd<=0){B.snd=.45+Math.random()*.35;if(SND.stir)SND.stir();}
  B.ft+=dt;if(B.ft>6){B.ft=0;B.f++;}boilShow(k0<.5&&B.k>=.5?"Ээдэм тунаж эхэллээ. Тасралтгүй хутгасаар.":null);}
function boilClose(done){const B=G.boil;if(!B)return;G.boil=null;AARU.bk=B.k;aaruSave();cardClose("#boil");if(done&&B.k>=1)bagOpen();}
/* тоглоомын хугацааг уншигдахаар: 90 → «1 мин 30 сек» */
function dur(sec){sec=Math.max(0,Math.ceil(sec));const m=Math.floor(sec/60),x=sec%60;return m?`${m} мин${x?` ${x} сек`:""}`:`${x} сек`;}
/* ---------- аарц: уутанд юүлэх (дарж барина) → шар усыг шүүх (хүлээнэ) → банз, чулуугаар дарах ---------- */
const BAG_T=[3,6];
function bagOpen(){if(G.bag)return;G.bag={st:1,k:0,hold:false,p:0,snd:0};cardOpen("#bag",[GX,.3,GZ]);uutShow();}
function uutShow(){const B=G.bag;if(!B)return;const q=$,k=B.k,st=B.st;
  const T=["Аарцаа уутанд юүлэх","Шар усыг шүүх","Банз, чулуугаар дарах"],
    tip=st===1?(k>=1?"":"Тогоогоо зөөлөн хазайлгаж, буцалгасан ээдмээ даавуун уутанд юүлнэ. Товчийг дарж барина."):
      st===2?"Уутныхаа амыг боож өлгөхөд шар ус нь дусаж шүүрнэ. Шар усыг хаяхгүй — зутан, хоолонд нэмж амт оруулдаг.":
      B.p===0?"Шүүрсэн уутаа банзан дээр тавилаа. Дээр нь банз тавиад, хүнд чулуугаар дарна.":B.p===1?"Одоо дээр нь хүнд чулуу тавина.":
      "Чулууны жинд аарц шахагдаж, үлдсэн шар ус нь гарна. Хэвшсэн аарцыг дараа нь зүсэж, хэвлэж, базаж ааруул болгоно.",
    time=st===1?`тоглоомд ${dur(BAG_T[0])} дарж барина`:st===2?`тоглоомд ${dur(BAG_T[1])} хүлээнэ (${dur((1-k)*BAG_T[1])} үлдлээ)`:`жинхэнэдээ 10 гаруй цаг дарна · тоглоомд ${dur(PRESS_T)}`;
  q("#bagTitle").textContent=T[st-1];q("#bagStep").textContent=`${st} / 3`;if(q("#bagTip").textContent!==tip)q("#bagTip").textContent=tip;q("#bagTime").textContent=time;
  q("#bagBar").style.transform=`scaleX(${((st-1)+(st===3?B.p/2:k))/3})`;
  const btn=q("#bagBtn"),lab=st===1?"Юүлэх · дарж барина":st===2?"Шүүрч байна…":["Банз тавих","Чулуу тавих","Гадаа аваачиж тавих"][B.p];if(btn.textContent!==lab)btn.textContent=lab;btn.disabled=st===2;
  q("#bgS1").style.display=st===1?"":"none";q("#bgS2").style.display=st===2?"":"none";q("#bgS3").style.display=st===3?"":"none";
  q("#bgPot").style.transform=`rotate(${-48*Math.min(1,k*1.6)}deg)`;q("#bgStream").setAttribute("opacity",st===1&&B.hold&&k>.08?"1":"0");
  const fh=st===1?44*k:44;q("#bgFill").setAttribute("y",String(132-fh));q("#bgFill").setAttribute("height",String(fh));q("#bgTie").setAttribute("opacity",st>1?"1":"0");
  q("#bgWhey").setAttribute("rx",String(st===2?20*k:0));q("#bagSvg").querySelector(".drip").style.display=st===2&&k<1?"":"none";q("#bagSvg").querySelector(".drip.side").style.display=st===3&&B.p===2?"":"none";
  q("#bgBag").style.transform=st===3?`translateY(${18}px) scaleY(${B.p===2?.42:B.p===1?.55:.62})`:st===2?`scaleY(${1-.12*k})`:"";
  q("#bgBoard").style.transform=`translateY(${B.p>=1?(B.p===2?14:6):-110}px)`;q("#bgStone").style.transform=`translateY(${B.p>=2?14:-130}px)`;}
function bagHold(on){const B=G.bag;if(!B||B.st!==1)return;B.hold=!!on&&B.k<1;uutShow();}
function bagStep(dt){const B=G.bag;if(!B)return;
  if(B.st===1&&B.hold){B.k=Math.min(1,B.k+dt/BAG_T[0]);B.snd-=dt;if(B.snd<=0){B.snd=.5;if(SND.stir)SND.stir();}if(B.k>=1){B.hold=false;B.st=2;B.k=0;}uutShow();}
  else if(B.st===2){B.k=Math.min(1,B.k+dt/BAG_T[1]);if(B.k>=1){B.st=3;B.k=0;if(SND.chime)SND.chime();}uutShow();}}
function bagTap(){const B=G.bag;if(!B||B.st!==3)return;if(B.p<2){B.p++;if(SND.burst&&SND.ctx)SND.burst(SND.ctx.currentTime,.25,{f:B.p===2?160:240,q:2,v:.05,type:"bandpass"});uutShow();return;}bagClose(true);}
function bagClose(done){const B=G.bag;if(!B)return;G.bag=null;cardClose("#bag");
  if(done&&B.st===3&&B.p>=2){AARU.p={ph:"press",t0:G.played||0};AARU.bk=0;aaruSave();
    hint(`Дарсан аарцаа гадаа, ааруулын тавиурын дэргэд тавилаа. ${dur(PRESS_T)} шахагдана (жинхэнэдээ 10 гаруй цаг). Дараа нь тавиурын дэргэд «Ааруул тавих».`,8000);}
  else{AARU.bk=1;aaruSave();hint("Ээдэм тогоонд хүлээж байна. Тулганы дэргэд «Тараг буцалгах» → «Уутанд юүлж шахах».",5000);}}
function cutOpen(){if(G.cut)return;G.cut={sty:null,n:0,f:0};cardOpen("#cut",[RACK[0],.8,RACK[1]]);$("#cutOpts").hidden=false;$("#cutWork").hidden=true;$("#cutSlab").innerHTML="";
  cutShow("Шахагдаж хэвшсэн аарцаа банзан дээр гаргалаа. Яаж хэлбэржүүлэх вэ?");}
function cutPick(sty){const C=G.cut;if(!C||!ASTY[sty])return;C.sty=sty;$("#cutOpts").hidden=true;$("#cutWork").hidden=false;$("#cutBtn").textContent=ASTY[sty].b;cutShow(ASTY[sty].tip);}
function cutTap(){const C=G.cut;if(!C||!C.sty)return;const S=ASTY[C.sty];if(C.n>=S.n)return;const k=Math.min(S.per,S.n-C.n),sl=$("#cutSlab");
  for(let i=0;i<k;i++){const e=document.createElement("i");e.className=C.sty;sl.appendChild(e);}C.n+=k;C.f++;
  if(SND.burst&&SND.ctx)SND.burst(SND.ctx.currentTime,.09,{f:C.sty==="zuss"?3200:900,q:2,v:.03,type:"bandpass"});
  cutShow(C.n>=S.n?"Бүгдийг нь хэлбэржүүллээ. Одоо тавиур дээр дэлгэе.":null);}
function cutShow(tip){const C=G.cut;if(!C)return;if(tip)$("#cutTip").textContent=tip;const S=C.sty&&ASTY[C.sty];$("#cutN").textContent=S?`${C.n} / ${S.n} ·`:"";
  $("#cutFact").textContent=CFACTS[C.f%CFACTS.length];$("#cutDone").hidden=!S||C.n<S.n;$("#cutBtn").disabled=!!S&&C.n>=S.n;}
function cutClose(done){const C=G.cut;if(!C)return;G.cut=null;
  if(done&&C.sty&&C.n>=ASTY[C.sty].n&&AARU.r.st==="empty"){AARU.r={st:"wet",sty:C.sty,sun:0,n:C.n};AARU.p={ph:"idle",t0:0};aaruSave();aarRebuild();
    hint("Ааруулаа тавиур дээр дэлгэлээ. Нар, салхинд хатна, шөнө нь хатахгүй.",5500);}
  cardClose("#cut");}
/* ---------- сагс: ааруулаа хадгалах, амтлах, багийнхандаа бэлэглэх (GIFTS: js/gifts.js) ---------- */
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const itemsTxt=it=>Object.entries(it).filter(([,n])=>n>0).map(([k,n])=>`${n} ${(ANAME[k]||k).toLowerCase()}`).join(", ")+" ааруул";
function bkBadge(){const n=bkTotal(),u=GIFTS.unopened().length;$("#basketN").textContent=String(n);$("#basketBtn").classList.toggle("gift",u>0);$("#inboxN").textContent=u?String(u):"";}
const GV={to:null,sty:null,n:1,msg:null};
function basketOpen(tab){if(busy())return;G.bk=true;cardOpen("#basket");bkTab(tab||"bag");}
function basketClose(){if(!G.bk)return;G.bk=false;cardClose("#basket");}
function bkTab(tab){G.bkTab=tab;$$("#basket [data-tab]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.tab===tab)));$$("#basket [data-pane]").forEach(p=>{p.hidden=p.dataset.pane!==tab;});
  if(tab==="bag")bagShow();else if(tab==="give")giveShow();else inboxShow();}
function bagShow(){const B=AARU.basket,n=bkTotal();
  $("#bkGrid").innerHTML=GIFTS.SHAPES.map(k=>`<div class="bkc${B[k]?"":" none"}"><i class="ic ${k}" aria-hidden="true"></i><b>${B[k]||0}</b><small>${ANAME[k]}</small></div>`).join("");
  $("#bkNote").textContent=n?`Нийт ${n} ааруул. Ааруул хөргөгчгүйгээр жил гаруй хадгалагддаг.`:"Сагс хоосон. Гадаа тавиур дээрх хатсан ааруулаа хураагаарай.";$("#tasteBtn").disabled=!n;$("#bkGive").disabled=!n;}
function taste(){const B=AARU.basket,k=GIFTS.SHAPES.filter(s=>B[s]>0).sort((a,b)=>B[b]-B[a])[0];if(!k)return;B[k]--;aaruSave();bkBadge();bagShow();
  if(SND.burst&&SND.ctx){const t0=SND.ctx.currentTime;[0,.13,.27].forEach((d,i)=>SND.burst(t0+d,.07,{f:2000-i*250,q:.9,v:.05,type:"bandpass"}));}
  G.ate=(G.ate||0)+1;$("#bkNote").textContent=AFACT_EAT[(G.ate-1)%AFACT_EAT.length];}
async function giveShow(note){const M=await GIFTS.members(),B=AARU.basket,have=GIFTS.SHAPES.filter(k=>B[k]>0);if(!have.includes(GV.sty))GV.sty=have[0]||null;
  const max=Math.min(GIFTS.LIM.maxItems,GV.sty?B[GV.sty]:0);GV.n=Math.max(1,Math.min(GV.n,max||1));
  $("#gTo").innerHTML=M.map(m=>`<button type="button" data-to="${esc(m.id)}" aria-pressed="${GV.to===m.id}">${esc(m.name)}</button>`).join("");
  $("#gSty").innerHTML=have.map(k=>`<button type="button" data-st="${k}" aria-pressed="${GV.sty===k}"><i class="ic ${k}" aria-hidden="true"></i>${ANAME[k]} (${B[k]})</button>`).join("")||`<span class="sub small">Сагсанд ааруул алга.</span>`;
  $("#gMsg").innerHTML=GIFTS.MSG.map((t,i)=>`<button type="button" data-msg="${i}" aria-pressed="${GV.msg===i}">${esc(t)}</button>`).join("");
  $("#gN").textContent=String(GV.n);$("#gMinus").disabled=GV.n<=1;$("#gPlus").disabled=GV.n>=max;
  const err=GV.to&&GV.sty&&GV.msg!=null?GIFTS.check(GV.to,{[GV.sty]:GV.n},GV.msg):null;
  $("#gSend").disabled=!(GV.to&&GV.sty&&GV.msg!=null)||!!err||!max;
  $("#gNote").textContent=note||err||`Өнөөдөр дахиад ${GIFTS.left()} бэлэг илгээж болно. Хариу бэлэг заавал биш.`;
  $$("#gTo [data-to]").forEach(b=>b.onclick=()=>{GV.to=b.dataset.to;giveShow();});$$("#gSty [data-st]").forEach(b=>b.onclick=()=>{GV.sty=b.dataset.st;giveShow();});
  $$("#gMsg [data-msg]").forEach(b=>b.onclick=()=>{GV.msg=+b.dataset.msg;giveShow();});}
async function giveSend(){const it={[GV.sty]:GV.n};if((AARU.basket[GV.sty]||0)<GV.n)return;
  try{await GIFTS.send(GV.to,it,GV.msg);}catch(e){giveShow(e.message);return;}
  AARU.basket[GV.sty]-=GV.n;aaruSave();bkBadge();if(SND.chime)SND.chime();const who=GIFTS.name(GV.to);GV.n=1;GV.msg=null;giveShow(`Илгээлээ: ${who} — ${itemsTxt(it)}.`);}
async function inboxShow(){const I=await GIFTS.inbox(),O=await GIFTS.sent(),st=g=>g.thanked?"«Баярлалаа» ✓":g.opened?"Нээсэн":"Илгээсэн";
  $("#gIn").innerHTML=I.map(g=>`<div class="gi"><b>${esc(GIFTS.name(g.from))}</b> · ${esc(itemsTxt(g.items))}<br><small>«${esc(GIFTS.MSG[g.msg])}» · ${g.opened?(g.kept?"Сагсанд":"Нээсэн")+(g.thanked?" · Баярлалаа гэсэн":""):"Гэртээ, ширээн дээр нээгээрэй"}</small></div>`).join("")||`<p class="sub small">Одоохондоо бэлэг ирээгүй.</p>`;
  $("#gOut").innerHTML=O.map(g=>`<div class="gi"><b>${esc(GIFTS.name(g.to))}</b> · ${esc(itemsTxt(g.items))}<br><small>«${esc(GIFTS.MSG[g.msg])}» · ${st(g)}</small></div>`).join("")||`<p class="sub small">Хараахан илгээгээгүй.</p>`;}
function giftOpenCard(){const g=GIFTS.unopened()[0];if(!g||busy())return;GIFTS.open(g.id).then(()=>{G.gift=g.id;cardOpen("#giftOpen",[GIFT_AT[0],GIFT_AT[1],GIFT_AT[2]]);
  $("#goTitle").textContent=`Бэлэг ирлээ! Илгээсэн: ${GIFTS.name(g.from)}`;$("#goItems").textContent=itemsTxt(g.items);$("#goMsg").textContent=`«${GIFTS.MSG[g.msg]}»`;
  $("#goKeep").disabled=false;$("#goThank").disabled=false;$("#goNote").textContent="Сагсандаа хадгалах, «Баярлалаа» гэж хариулах — хоёулаа заавал биш.";if(SND.chime)SND.chime();bkBadge();});}
async function giftKeep(){const it=await GIFTS.keep(G.gift);if(it){for(const k in it)AARU.basket[k]=(AARU.basket[k]||0)+it[k];aaruSave();bkBadge();$("#goKeep").disabled=true;$("#goNote").textContent="Сагсандаа хадгаллаа.";}}
async function giftThank(){const id=G.gift;if(!id)return;if(!$("#goKeep").disabled)await giftKeep();
  if(await GIFTS.thank(id)){$("#goThank").disabled=true;$("#goNote").textContent="«Баярлалаа» гэж хариуллаа. Бэлэг сагсанд чинь орлоо.";if(SND.chime)SND.chime();
    setTimeout(()=>{if(G.gift===id)giftClose();},1300);}}
function giftClose(){if(!G.gift)return;G.gift=null;cardClose("#giftOpen");bkBadge();}
/* ================= гэр ахуй: барьж явах зүйл, хувин, айраг утгах, ус уух, авдар, унтах, аргал, тулгын гал ================= */
const ICON={pail:`<svg viewBox="0 0 40 40"><path d="M9 13h22l-3 20H12z" fill="#9B6A3E"/><path d="M9 13h22" stroke="#4D5F73" stroke-width="2"/><path d="M10 19h20M11 27h18" stroke="#4D5F73" stroke-width="1.6"/><path d="M11 13c2-9 16-9 18 0" fill="none" stroke="#6B4122" stroke-width="1.6"/></svg>`,
  pail_milk:`<svg viewBox="0 0 40 40"><path d="M9 13h22l-3 20H12z" fill="#9B6A3E"/><ellipse cx="20" cy="14" rx="10" ry="2.6" fill="#F7F2E6"/><path d="M10 19h20M11 27h18" stroke="#4D5F73" stroke-width="1.6"/><path d="M11 13c2-9 16-9 18 0" fill="none" stroke="#6B4122" stroke-width="1.6"/></svg>`,
  arag:`<svg viewBox="0 0 40 40"><path d="M10 9h20l-3 25H13z" fill="#B88A55"/><path d="M11 15h18M11 21h17M12 27h16M15 9v25M20 9v25M25 9v25" stroke="#8A6236" stroke-width="1.2"/><circle cx="16" cy="9" r="3" fill="#5A4430"/><circle cx="22" cy="8" r="3.4" fill="#4A3828"/></svg>`,
  ladle:`<svg viewBox="0 0 40 40"><path d="M6 8l18 16" stroke="#8E5A2E" stroke-width="3" stroke-linecap="round"/><ellipse cx="27" cy="27" rx="8" ry="5" fill="#8E5A2E"/><ellipse cx="27" cy="26" rx="6" ry="3" fill="#F3EEDF"/></svg>`,
  bowl:`<svg viewBox="0 0 40 40"><path d="M7 18h26c0 9-6 14-13 14S7 27 7 18z" fill="#A87A4C"/><ellipse cx="20" cy="18" rx="13" ry="3.5" fill="#F3EEDF"/></svg>`,
  bow:`<svg viewBox="0 0 40 40"><path d="M12 5c14 6 14 24 0 30" fill="none" stroke="#8A4B22" stroke-width="3" stroke-linecap="round"/><path d="M12 5v30" stroke="#F3EEDF" stroke-width="1"/><path d="M8 20h26" stroke="#B88A55" stroke-width="1.8"/><path d="M34 20l-5-3v6z" fill="#4A4038"/></svg>`,
  shagai:`<svg viewBox="0 0 40 40"><rect x="4" y="22" width="32" height="12" rx="2" fill="#B8361E"/><rect x="7" y="25" width="26" height="6" fill="#F3E6C8"/><ellipse cx="14" cy="16" rx="6" ry="4.6" fill="#EFE9DA" stroke="#5A4430"/><ellipse cx="26" cy="15" rx="6" ry="4.6" fill="#C0392B" stroke="#5A4430"/></svg>`,
  cup:`<svg viewBox="0 0 40 40"><path d="M7 18h26c0 9-6 14-13 14S7 27 7 18z" fill="#A87A4C"/><ellipse cx="20" cy="18" rx="13" ry="3.5" fill="#9CC7E8"/></svg>`};
function itemsShow(){const el=$("#items");if(!el)return;const H=INV.hand,L={pail:"Хувин",pail_milk:"Саамтай хувин → гэрийн хөхүүрт",bow:"Нум сум → харвааны зурвас"};let h="";
  if(INV.shagai)h+=`<button type="button" class="slot tap" data-mat aria-pressed="${!!G.matArm}">${ICON.shagai}<span>${G.matArm?"Дэвсгэрээ дэлгэх газраа сонго":"Шагай, дэвсгэр · дарж дэлгэнэ"}</span></button>`;
  if(H)h+=`<div class="slot">${ICON[H]}<span>${L[H]}</span></div>`;if(INV.arag)h+=`<div class="slot">${ICON.arag}<span>Араг · ${INV.argal} аргал</span></div>`;
  el.innerHTML=h;el.hidden=!h;
  const m=el.querySelector("[data-mat]");if(m)m.onclick=()=>{G.matArm=!G.matArm;itemsShow();if(G.matArm)hint("Дуртай газраа очоод «Дэвсгэр дэлгэх» товчийг дарна. Болих бол шагай дээр дахин дарна.",5000);};}
/* дарж барих ерөнхий цонх: айраг утгах, аягалах, ус уух */
function holdOpen(o){if(busy())return;G.hold=Object.assign({k:0,on:false},o);$("#holdTitle").textContent=o.title;$("#holdTip").textContent=o.tip;$("#holdIcon").innerHTML=ICON[o.icon]||"";
  $("#holdBtn").firstChild.textContent=o.btn;$("#holdBtn").disabled=false;$("#holdBar").style.transform="scaleX(0)";cardOpen("#hold",o.look);}
function holdPress(on){const H=G.hold;if(!H||H.k>=1)return;H.on=!!on;$("#holdIcon").classList.toggle("act",H.on);}
function holdStep(dt){const H=G.hold;if(!H||!H.on||H.k>=1)return;H.k=Math.min(1,H.k+dt/H.dur);$("#holdBar").style.transform=`scaleX(${H.k})`;
  if(SND.slosh&&Math.random()<dt*2.2)SND.slosh(.35);if(H.k>=1){H.on=false;$("#holdBtn").disabled=true;if(SND.chime)SND.chime();H.done();G.holdEnd=setTimeout(holdClose,900);}}
function holdClose(){clearTimeout(G.holdEnd);if(!G.hold)return;G.hold=null;cardClose("#hold");itemsShow();}
/* газрын зураг (дээрээс харсан, хойд зүг дээш): жим, газрууд, тоглогчийн байрлал */
function mapSvg(){const M=W3MAP,P=[];for(let i=0;i<=60;i++)P.push(M.trailPt(i/60));
  const pl=[[GB.built?"Гэр":"Гэр барих газар",GX,GZ],["Хонины хашаа",(PEN.x0+PEN.x1)/2,(PEN.z0+PEN.z1)/2],["Зэл",(ZEL_A[0]+ZEL_B[0])/2,(ZEL_A[1]+ZEL_B[1])/2],["Адуу, тэвш",TROUGH[0],TROUGH[1]],
    ["Цөөрөм",W3POND[0],W3POND[1]],["Сур харваа",TARGET[0],TARGET[1]],["Хүслийн мод",W3WISH.X,W3WISH.Z],["Салхит толгод",M.HILL[0],M.HILL[1]],["Хонины бэлчээр",MEAD[0],MEAD[1]]];
  const xs=P.map(p=>p[0]).concat(pl.map(p=>p[1])),zs=P.map(p=>p[1]).concat(pl.map(p=>p[2])),x0=Math.min(...xs)-14,x1=Math.max(...xs)+14,z0=Math.min(...zs)-10,z1=Math.max(...zs)+10;
  const W=300,H=Math.round(W*(z1-z0)/(x1-x0)),sx=x=>((x-x0)/(x1-x0)*W).toFixed(1),sz=z=>((z-z0)/(z1-z0)*H).toFixed(1),c=G.cam,px=c.pos[0],pz=c.pos[2];
  const tr=P.map((p,i)=>(i?"L":"M")+sx(p[0])+" "+sz(p[1])).join(""),st=STREAM.map((p,i)=>(i?"L":"M")+sx(p[0])+" "+sz(p[1])).join("");
  return `<svg class="hmap" viewBox="0 0 ${W} ${H}" role="img" aria-label="Газрын зураг"><path d="${tr}" stroke="#C9B48A" stroke-width="3" fill="none" stroke-dasharray="6 4"/>
    <path d="${st}" stroke="#7FB2DC" stroke-width="2.5" fill="none"/><ellipse cx="${sx(W3POND[0])}" cy="${sz(W3POND[1])}" rx="${(W3POND[2]/(x1-x0)*W).toFixed(1)}" ry="${(W3POND[3]/(z1-z0)*H).toFixed(1)}" fill="#6E9EC4"/>
    ${pl.map(([n,x,z],i)=>`<g class="pt"><title>${i+1}. ${n}</title><circle cx="${sx(x)}" cy="${sz(z)}" r="7.5" fill="#FFC24A" stroke="#1E1640" stroke-width="1"/><text x="${sx(x)}" y="${(+sz(z)+3.6).toFixed(1)}" text-anchor="middle" class="n">${i+1}</text></g>`).join("")}
    <g data-me="1" transform="translate(${sx(px)} ${sz(pz)}) rotate(${(c.yaw*180/Math.PI).toFixed(0)})"><path d="M0 -9 L6 6 L0 3 L-6 6Z" fill="#FF6B5B" stroke="#fff" stroke-width="1.5"/></g>
    <text x="${W-14}" y="16" text-anchor="middle">Х</text></svg>`;}
/* авдар: сагс ⇄ авдар (ааруул хадгална) */
const CHESTS=[[-1.72+GX,-1.75+GZ],[1.72+GX,-1.75+GZ]];
function chestOpen(){if(busy())return;G.chestO=true;cardOpen("#chest");chestShow();if(SND.burst&&SND.ctx)SND.burst(SND.ctx.currentTime,.4,{f:260,q:4,v:.03,type:"bandpass"});}
function chestShow(){const B=AARU.basket,C=INV.chest;$("#chestShg").innerHTML=SHG.mat?`<span>Шагай, дэвсгэр: ${SHG.mat[3]?"гэрт":"гадаа"} дэлгээтэй</span>`:INV.shagai?`<span>Шагай, дэвсгэр гартаа байна</span><button type="button" id="shBack">Буцааж хийх</button>`:
    `<span>Шагайн уут, эсгий дэвсгэр</span><button type="button" id="shTake">Авах</button>`;
  if($("#shTake"))$("#shTake").onclick=()=>{INV.shagai=true;airSave();itemsShow();chestShow();hint("Шагай, дэвсгэрээ авлаа. Дуртай газраа «Дэвсгэр дэлгэх».",5000);};if($("#shBack"))$("#shBack").onclick=()=>{INV.shagai=false;airSave();itemsShow();chestShow();};
  $("#chestRows").innerHTML=GIFTS.SHAPES.map(k=>`<div class="crow"><i class="ic ${k}" aria-hidden="true"></i><span>${ANAME[k]}</span>
    <button type="button" data-in="${k}" ${B[k]?"":"disabled"} aria-label="Авдарт хийх">${B[k]||0} →</button><button type="button" data-out="${k}" ${C[k]?"":"disabled"} aria-label="Сагсанд авах">← ${C[k]||0}</button></div>`).join("");
  $$("#chestRows [data-in]").forEach(b=>b.onclick=()=>chestMove(b.dataset.in,1));$$("#chestRows [data-out]").forEach(b=>b.onclick=()=>chestMove(b.dataset.out,-1));}
function chestMove(k,dir){const B=AARU.basket,C=INV.chest;if(dir>0&&B[k]>0){B[k]--;C[k]=(C[k]||0)+1;}else if(dir<0&&C[k]>0){C[k]--;B[k]=(B[k]||0)+1;}aaruSave();airSave();bkBadge();chestShow();}
function chestClose(){if(!G.chestO)return;G.chestO=false;cardClose("#chest");}
/* унтах: ороондоо хэвтэхэд зүүдэндээ нэг уламжлалын баримт сонсоод, сэрэхэд өглөө болно. Баримтууд дарааллаараа, бүгдийг сонсох хүртэл давтагдахгүй */
function sleepStart(){if(busy())return;G.sleep={t:0};document.body.classList.add("resting");const ov=$("#sleep");ov.hidden=false;ov.classList.remove("wake");requestAnimationFrame(()=>ov.classList.add("on"));
  const F=HELP.facts(),i=(+SAVE.dreamI||0)%F.length;SAVE.dreamI=i+1;w3Save({dreamI:i+1});$("#dreamN").textContent=`${i+1} / ${F.length}`;$("#dreamFact").innerHTML=F[i];
  setTimeout(()=>{if(G.sleep)$("#dream").hidden=false;},1300);}
function sleepWake(){if(!G.sleep)return;G.sleep=null;$("#dream").hidden=true;const ov=$("#sleep");ov.classList.add("wake");
  if(G.tod!=="cycle"){G.tod="cycle";w3Save({tod:"cycle",todV:3});$$("#tSeg [data-t]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.t==="cycle")));}
  const u=((G.cycT%CYC)+CYC)%CYC;G.cycT=G.cycT-u+(u<800?0:CYC)+840;envT=-9;STOVE.fuel=0;
  setTimeout(()=>{ov.classList.remove("on");setTimeout(()=>{ov.hidden=true;document.body.classList.remove("resting");},900);hint("Өглөө боллоо. Хашааны хаалгыг нээж хонио бэлчээрт гаргаарай.",5000);},700);}
/* аргал: хонь, адуу бэлчсэн газар үлдээнэ → арагт түүнэ → тулгандаа түлнэ */
const ARGAL=[],ARAG_AT=[.95+GX,.65+GZ];
function argalDrop(t){if(ARGAL.length>=26)return;const src=[];(G.flock||[]).forEach(a=>{if(a.mode==="meadow"&&!a.lamb)src.push([a.x,a.z]);});(G.hx?G.hx.herd:[]).forEach(h=>src.push([h.x,h.z]));
  if(!src.length)return;const p=src[Math.floor(Math.random()*src.length)];ARGAL.push([p[0]+(Math.random()-.5)*.6,p[1]+(Math.random()-.5)*.6,Math.random()*6]);G.argalDirty=true;}
function argalGeo(){const g=new Geo(215),C=[hex("#5A4632"),hex("#4A3A2A"),hex("#6B5540")];ARGAL.forEach(([x,z,r],i)=>g.at([x,w3H(x,z)+.015,z],{ry:r,s:[.1,.035,.085]},q=>q.sph(1,7,C[i%3],.12)));return g;}
function argalNear(x,z,R){return ARGAL.filter(a=>Math.hypot(a[0]-x,a[1]-z)<R);}
function argalPick(){const x=G.cam.pos[0],z=G.cam.pos[2];let n=0;for(let i=ARGAL.length-1;i>=0;i--){if(INV.argal>=20)break;if(Math.hypot(ARGAL[i][0]-x,ARGAL[i][1]-z)<2.3){ARGAL.splice(i,1);INV.argal++;n++;}}
  G.argalDirty=true;airSave();itemsShow();if(SND.burst&&SND.ctx)SND.burst(SND.ctx.currentTime,.12,{f:500,q:1.5,v:.04,type:"bandpass"});
  hint(INV.argal>=20?"Араг дүүрлээ (20 аргал). Гэртээ аваачиж тулгандаа түлээрэй.":`${n} аргал түүлээ. Арагт ${INV.argal} аргал байна.`,3500);}
function stoveLight(){const n=Math.min(3,INV.argal);if(n<2){hint("Гал түлэхэд дор хаяж 2 аргал хэрэгтэй. Гадаа мал бэлчсэн газраас түүгээрэй.",4500);return;}
  INV.argal-=n;STOVE.fuel+=n*110;airSave();itemsShow();w3Save({stoveFuel:Math.round(STOVE.fuel)});if(SND.burst&&SND.ctx)SND.burst(SND.ctx.currentTime,.6,{f:1800,q:.8,v:.03,type:"bandpass"});
  hint(`${n} аргал түллээ. Гал ${dur(STOVE.fuel)} шатна (нэг аргал ≈ ${dur(110)}). Гэр дулаан, гэрэлтэй боллоо.`,5000);}

/* ---------- оролт: чирж эргэн харах, дугуйгаар алхах, гар ---------- */
cv.addEventListener("pointerdown",e=>{if(G.drag||G.rest)return;G.drag={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:(G.look||G.cam).yaw,pitch:(G.look||G.cam).pitch,moved:false};G.tw=[];SND.start();});
window.addEventListener("pointermove",e=>{const D=G.drag;if(!D||e.pointerId!==D.id)return;const dx=e.clientX-D.x,dy=e.clientY-D.y;if(Math.abs(dx)+Math.abs(dy)>4)D.moved=true;
  const k=.0058;G.look={yaw:D.yaw+dx*k,pitch:Math.max(-.55,Math.min(.8,D.pitch-dy*k*.82))};});
window.addEventListener("pointerup",e=>{const D=G.drag;if(D&&e.pointerId===D.id){G.drag=null;if(!D.moved)tap(e.clientX,e.clientY);}});
window.addEventListener("pointercancel",e=>{if(G.drag&&e.pointerId===G.drag.id)G.drag=null;});
const joy=$("#joy"),knob=$("#knob");let joyId=null;
const jmove=e=>{const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,R=r.width/2-18;let dx=e.clientX-cx,dy=e.clientY-cy;const L=Math.hypot(dx,dy);if(L>R){dx*=R/L;dy*=R/L;}
  knob.style.transform=`translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px)`;G.mv.s=dx/R;G.mv.f=-dy/R;};
joy.addEventListener("pointerdown",e=>{e.stopPropagation();e.preventDefault();try{joy.setPointerCapture(e.pointerId);}catch(x){}joyId=e.pointerId;joy.classList.add("on");jmove(e);SND.start();});
joy.addEventListener("pointermove",e=>{if(joyId===e.pointerId)jmove(e);});
const jend=e=>{if(joyId!==e.pointerId)return;joyId=null;G.mv.f=G.mv.s=0;knob.style.transform="";joy.classList.remove("on");};
joy.addEventListener("pointerup",jend);joy.addEventListener("pointercancel",jend);
const WK=["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright","shift"];
window.addEventListener("keydown",e=>{const k=e.key.toLowerCase();if(e.target.closest&&e.target.closest("input,button")&&(k===" "||k==="enter"))return;
  if(G.arch&&["arrowleft","arrowright","arrowup","arrowdown"].includes(k)){e.preventDefault();archDrag(k==="arrowleft"?-16:k==="arrowright"?16:0,k==="arrowup"?-16:k==="arrowdown"?16:0);return;}
  if(k==="escape"){if(!$("#help").hidden)HELP.open(false);else if(!$("#settings").hidden)setOpen(false);else if(G.rest)restClose();else if(G.wish)wishClose();else if(G.churn)churnClose(true);else if(G.milkC)milkClose();else if(G.boil)boilClose(false);else if(G.bag)bagClose(false);else if(G.arch)archClose();else if(G.shg)shClose();else if(G.cut)cutClose(false);else if(G.bk)basketClose();else if(G.gift)giftClose();else if(G.hold)holdClose();else if(G.chestO)chestClose();else if(G.sleep)sleepWake();else if(G.build)gbClose();return;}
  if((k===" "||k==="enter")&&(G.churn||G.milkC||G.boil||G.bag||G.arch||G.cut||G.hold)){e.preventDefault();if(G.churn)churnTap();else if(G.milkC)milkTap();else if(G.boil){if(!e.repeat)boilHold(true);}else if(G.bag){if(!e.repeat){if(G.bag.st===1)bagHold(true);else bagTap();}}else if(G.arch){if(!e.repeat)archHold(true);}else if(G.hold){if(!e.repeat)holdPress(true);}else cutTap();return;}
  if((k==="e"||k===" ")&&G.on&&!G.rest&&!G.wish){e.preventDefault();doAct();return;}
  if(!WK.includes(k)||G.rest||G.wish)return;G.keys[k]=1;SND.start();if(k.startsWith("arrow"))e.preventDefault();});
window.addEventListener("keyup",e=>{const k=e.key.toLowerCase();G.keys[k]=0;if((k===" "||k==="enter")&&G.boil)boilHold(false);if((k===" "||k==="enter")&&G.bag)bagHold(false);if((k===" "||k==="enter")&&G.arch&&(G.arch.ph==="draw"||G.arch.ph==="aim"))archHold(false);if((k===" "||k==="enter")&&G.hold)holdPress(false);});
window.addEventListener("blur",()=>{G.keys={};});
$("#actBtn").onclick=doAct;
$$("#wish [data-kh]").forEach(b=>b.onclick=()=>tieKhadag(+b.dataset.kh));$("#wish [data-wclose]").onclick=wishClose;
$("#milkBtn").onclick=milkTap;$("#milk [data-mclose]").onclick=milkClose;
$("#churnBtn").onclick=churnTap;
{const b=$("#boilBtn"),up=()=>boilHold(false);b.addEventListener("pointerdown",e=>{e.preventDefault();try{b.setPointerCapture(e.pointerId);}catch(_){}boilHold(true);});
  ["pointerup","pointercancel","lostpointercapture"].forEach(t=>b.addEventListener(t,up));b.addEventListener("contextmenu",e=>e.preventDefault());}
$("#boilDone").onclick=()=>boilClose(true);
{/* харваа: товч эсвэл дэлгэцийн хаана ч дарж барина; барьсан хуруугаа чирэхэд онилгоо хөдөлнө, суллахад сум явна */
  const pad=$("#archPad"),btn=$("#archBtn");let last=null;
  const down=(el,e)=>{e.preventDefault();try{el.setPointerCapture(e.pointerId);}catch(_){}last=[e.clientX,e.clientY];archHold(true);};
  const move=e=>{if(!last)return;archDrag(e.clientX-last[0],e.clientY-last[1]);last=[e.clientX,e.clientY];};
  const up=()=>{last=null;if(G.arch&&(G.arch.ph==="draw"||G.arch.ph==="aim"))archHold(false);};
  [pad,btn].forEach(el=>{el.addEventListener("pointerdown",e=>down(el,e));el.addEventListener("pointermove",move);["pointerup","pointercancel","lostpointercapture"].forEach(t=>el.addEventListener(t,up));el.addEventListener("contextmenu",e=>e.preventDefault());});
  $("#archHud [data-arclose]").onclick=archClose;$("#archFix").onclick=archFix;
  $$("#shagai [data-sm]").forEach(x=>x.onclick=()=>shMode(x.dataset.sm));$("#shagai [data-shclose]").onclick=shClose;$("#shTakeMat").onclick=matTake;}
{const b=$("#bagBtn"),up=()=>bagHold(false);b.addEventListener("pointerdown",e=>{if(!G.bag||G.bag.st!==1)return;e.preventDefault();try{b.setPointerCapture(e.pointerId);}catch(_){}bagHold(true);});
  ["pointerup","pointercancel","lostpointercapture"].forEach(t=>b.addEventListener(t,up));b.addEventListener("contextmenu",e=>e.preventDefault());b.addEventListener("click",()=>{if(G.bag&&G.bag.st===3)bagTap();});
  $("#bag [data-gclose]").onclick=()=>bagClose(false);}
$("#basketBtn").onclick=()=>basketOpen();$("#basket [data-kclose]").onclick=basketClose;$$("#basket [data-tab]").forEach(b=>b.onclick=()=>bkTab(b.dataset.tab));
$("#tasteBtn").onclick=taste;$("#bkGive").onclick=()=>bkTab("give");$("#gMinus").onclick=()=>{GV.n--;giveShow();};$("#gPlus").onclick=()=>{GV.n++;giveShow();};$("#gSend").onclick=giveSend;
HELP.init({AFACTS,MFACTS,BFACTS,CFACTS,AFACT_EAT,map:mapSvg});
{const b=$("#holdBtn"),up=()=>holdPress(false);b.addEventListener("pointerdown",e=>{e.preventDefault();try{b.setPointerCapture(e.pointerId);}catch(_){}holdPress(true);});
  ["pointerup","pointercancel","lostpointercapture"].forEach(t=>b.addEventListener(t,up));b.addEventListener("contextmenu",e=>e.preventDefault());}
$("#hold [data-hdclose]").onclick=holdClose;$("#chest [data-chclose]").onclick=chestClose;$("#wakeBtn").onclick=sleepWake;itemsShow();
$("#goKeep").onclick=giftKeep;$("#goThank").onclick=giftThank;$("#giftOpen [data-oclose]").onclick=giftClose;bkBadge();$("#boil [data-bclose]").onclick=()=>boilClose(false);
$$("#cutOpts [data-sty]").forEach(b=>b.onclick=()=>cutPick(b.dataset.sty));$("#cutBtn").onclick=cutTap;$("#cutDone").onclick=()=>cutClose(true);$("#cut [data-tclose]").onclick=()=>cutClose(false);$("#churnDone").onclick=()=>churnClose(true);$("#churn [data-cclose]").onclick=()=>churnClose(true);
$$("#gait button").forEach(b=>b.onclick=()=>{if(!G.ride)return;G.ride.gait=+b.dataset.g;gaitUI();SND.snort();});
$$("#restMenu [data-ex]").forEach(b=>b.onclick=()=>exStart(b.dataset.ex));
$("#restMenu [data-stand]").onclick=restClose;$("#standBtn").onclick=restClose;$("#restRun [data-stop]").onclick=exStop;
$("#exPause").onclick=()=>{const X=G.rest&&G.rest.ex;if(!X)return;if(X.fin){exStart(X.k);return;}X.paused=!X.paused;$("#exPause").textContent=X.paused?"Үргэлжлүүлэх":"Түр зогсоох";};
$("#exDone").onclick=exStop;

/* ---------- тохиргоо ---------- */
function setOpen(on){$("#settings").hidden=!on;$("#setBtn").setAttribute("aria-expanded",String(on));if(on)syncSettings();}
function syncSettings(){$$("#qSeg button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.q===W3QSEL.key)));$$("#tSeg button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.t===G.tod)));
  $("#sndSw").checked=G.snd;$("#perfSw").checked=G.showPerf;
  $("#qNote").textContent=W3QSEL.auto?"Авто: утас удаан бол нягтрал, өвс, сүүдрийг өөрөө багасгана.":"Сонгосон чанараа тогтмол барина. Өөрчлөхөд нутаг дахин ачаалагдана.";}
$("#setBtn").onclick=()=>setOpen($("#settings").hidden);$("#settings [data-close]").onclick=()=>setOpen(false);
$$("#qSeg button").forEach(b=>b.onclick=()=>{if(b.dataset.q===W3QSEL.key)return;w3Save({quality:b.dataset.q});savePos();$("#loadTxt").textContent="Тохиргоог хэрэгжүүлж байна…";location.reload();});
$$("#tSeg button").forEach(b=>b.onclick=()=>{G.tod=b.dataset.t;w3Save({tod:G.tod,todV:3});envT=-9;syncSettings();});
$("#sndSw").onchange=e=>{G.snd=e.target.checked;SND.set(G.snd);if(G.snd)SND.start();w3Save({sound:G.snd});};
$("#perfSw").onchange=e=>{G.showPerf=e.target.checked;$("#perf").hidden=!G.showPerf;w3Save({perf:G.showPerf});};

/* ---------- гарах ---------- */
function exit(){if(G.exiting)return;G.exiting=true;savePos();G.on=false;cancelAnimationFrame(G.raf);restClose();setOpen(false);
  try{if(SND.ctx)SND.ctx.suspend();}catch(e){}try{const x=G.W&&G.W.gl.getExtension("WEBGL_lose_context");if(x)x.loseContext();}catch(e){}
  if(window.NUTAG_GATE){location.href=window.NUTAG_GATE.back;return;}   /* Жалайр апп дотор: «Гарах» → аппын «Өнөөдөр» хуудас */
  $("#bye").hidden=false;try{$("#againBtn").focus();}catch(e){}}
$("#exitBtn").onclick=exit;$("#againBtn").onclick=()=>location.reload();
document.addEventListener("visibilitychange",()=>{if(document.hidden)savePos();});

/* ---------- WebGL context алдагдвал сэргээнэ ---------- */
cv.addEventListener("webglcontextlost",e=>{if(G.exiting)return;e.preventDefault();G.lost=true;cancelAnimationFrame(G.raf);$("#lost").hidden=false;});
cv.addEventListener("webglcontextrestored",()=>{if(G.exiting)return;try{if(PERF.reset)PERF.reset();build(true);}catch(e){console.warn(e);}});

/* ---------- эхлэх ---------- */
function setLoad(p,txt){$("#loadBar").style.width=Math.round(p*100)+"%";if(txt)$("#loadTxt").textContent=txt;}
function build(restore){const W=w3Create(cv);if(!W){$("#noGl").hidden=false;$("#loadTxt").hidden=true;return;}
  W3INFO.q=W.q;G.W=W;G.hx=null;G.P={};const steps=sceneSteps(W,G.P);let k=0;
  const next=()=>{try{steps[k++]();}catch(e){console.error(e);}setLoad(.08+.55*k/steps.length,k<steps.length?"Нутгаа бүтээж байна…":"Гэр, мал ачаалж байна…");
    if(k<steps.length){setTimeout(next,0);return;}
    G.hz=G.P.hz;if(!G.horseBase)G.horseBase=G.P.horseBase;
    if(restore){G.lost=false;$("#lost").hidden=true;G.on=true;G.lt=0;G.raf=requestAnimationFrame(frame);return;}
    G.on=true;G.t0=performance.now();G.raf=requestAnimationFrame(frame);waitAssets();};
  setTimeout(next,0);}
function waitAssets(){const t0=performance.now(),tick=()=>{const r=[GERX.on,!!G.W.hx,!!G.W.sh,!!G.W.skyOn],n=r.filter(Boolean).length;
    setLoad(.63+.37*n/4,n<4?"Гэр, морь, хонь ирж байна… ("+n+"/4)":"Бэлэн боллоо");
    if(n===4||performance.now()-t0>25000){$("#startBtn").hidden=false;$("#loadTxt").textContent=n===4?"Бэлэн боллоо":"Зарим загвар удаан ачаалж байна. Одоо ч эхэлж болно.";try{$("#startBtn").focus();}catch(e){}return;}
    setTimeout(tick,250);};tick();}
function start(){const c=G.cam,S0=START;
  if(S0.saved){const q=collide(S0.x,S0.z);c.pos=[q[0],w3H(q[0],q[1])+G.eye,q[1]];c.yaw=S0.yaw;c.pitch=0;G.inGer=gerIn(q[0],q[1]);if(G.inGer)c.pos[1]=1.3;}
  else{c.pos=CAM0.slice();c.yaw=S0.yaw;c.pitch=S0.pitch;}
  {const ph=G.tod==="dawn"?"dawn":flockPhaseAt0();if(ph==="night"||ph==="dawn"){penAll();GATE.a=GATE.want=0;}else{GATE.a=GATE.want=1;}}
  G.started=true;G.place=null;gbBoot();G.cycT=0;envT=-9;G.played=+SAVE.played||0;carryShow();   /* нар жаргаж буйгаар эхэлнэ */
  setTimeout(()=>{if(G.place==="home"&&!G.rest&&!G.wish&&!G.ride)hint("Гэрийн баруун талаас эхэлсэн жимээр явбал Хүслийн мод бий. Морь унавал хурдан хүрнэ.",6500);},9000);
  SND.on=G.snd;SND.start();$("#load").classList.add("out");setTimeout(()=>{$("#load").hidden=true;},650);$("#perf").hidden=!G.showPerf;
  hint(FINE?"W A S D — алхах · хулганаар чирж эргэн харах · хонь, морин дээр дарж илэх":"Зүүн доорх дугуйгаар алх · дэлгэцийг чирж эргэн хар · хонин дээр дарж илээрэй",6500);}
$("#startBtn").onclick=start;
if(location.protocol==="file:"){$("#loadTxt").textContent="Тоглоомыг вэб серверээр нээнэ үү (README.md-г үзнэ үү).";}
else{setLoad(.04,"Ачаалж байна…");requestAnimationFrame(()=>setTimeout(()=>build(false),30));}
/* ================= шинэ: оройн унтлага, Хүслийн модны гэрэл, шагай, сур харваа =================
   Эх сурвалж (README): шагайн 4 тал (морь, тэмээ, хонь, ямаа), тоглоомд эсгий дэвсгэр дэлгэдэг, морь уралдуулахад 4 шагай хаяж «морь» буусан бүрт
   нэг алхам урагшилна (gomongolia.gov.mn); талын магадлал морь .12, тэмээ .13, хонь .39, ямаа .36 (J. Math. Education 16(3), 2025);
   сур: жижиг арьсан цилиндр, 3 давхар хана, онох бүрт «уухай» (gomongolia.gov.mn); халх харвааны зай эрэгтэй 75 м, эмэгтэй 65 м (culture360). */
/* ---- унтах: зөвхөн орой, шөнө ---- */
function canSleep(){return flockPhase()!=="day";}
function sleepInfo(){if(G.tod!=="cycle"){hint("Тохиргоо → Цаг: «Солигдоно» эсвэл «Орой» үед орондоо орж унтана.",5000);return;}
  const u=((G.cycT%CYC)+CYC)%CYC;hint(`Одоо өдөр байна. Орой нар жаргахад унтаж болно — ${dur(2250-u)} үлдлээ.`,5000);}
/* ---- Хүслийн мод: орой хадаг уяхад өнгөт туяагаар гэрэлтэж, тэнгэрт од нисэнэ ---- */
const WFX_T=16;
function starsGeo(){const g=new Geo(231),R=chRng(231),C=["#FFF6C8","#BFF3FF","#FFD1F0","#D8C8FF"].map(hex);
  for(let i=0;i<46;i++){const a=i*.62+R()*.3,r=1.2+R()*2.8,y=1+i*.2+R()*.4;g.at([Math.cos(a)*r,y,Math.sin(a)*r],{s:.05+R()*.07},q=>q.sph(1,6,C[i%4],0));}return g;}
function orbsGeo(){const g=new Geo(239),R=chRng(239),C=["#3FF0C0","#9B6BFF","#FF5FB8","#FFC53D","#58C8FF"].map(hex);
  for(let i=0;i<26;i++){const a=i*2.4+R()*.5,r=2.2+R()*2.6,y=1.6+R()*5.4;g.at([Math.cos(a)*r,y,Math.sin(a)*r],{s:.18+R()*.26},q=>q.sph(1,10,C[i%5],0));}return g;}
function streakGeo(){const g=new Geo(232);g.at([0,0,0],{s:[1.6,.06,.06]},q=>q.sph(1,8,hex("#FFFBEA"),0));g.at([1.3,0,0],{s:.12},q=>q.sph(1,6,hex("#FFFFFF"),0));return g;}
function wishFxStep(dt,t){const P=G.P.m;if(!P.wAura)return;const F=G.wishFx;
  const SK=G.P.streaks||[];if(!F){if(P.wAura.on){P.wAura.on=P.wAura2.on=P.wStars.on=false;SK.forEach(s=>s.m.on=false);}return;}
  F.t+=dt;const k=F.t<1.5?F.t/1.5:F.t>WFX_T-3?Math.max(0,(WFX_T-F.t)/3):1;if(F.t>=WFX_T){G.wishFx=null;return;}
  const X=W3WISH.X,Z=W3WISH.Z,y0=w3H(X,Z),H=[[.15,.95,.7],[.55,.3,1],[1,.3,.7],[1,.72,.2]],hc=i=>{const a=(t*.18+i)%4,j=Math.floor(a),f=a-j,A=H[j],B=H[(j+1)%4];return [A[0]+(B[0]-A[0])*f,A[1]+(B[1]-A[1])*f,A[2]+(B[2]-A[2])*f];};
  const pul=1+.06*Math.sin(t*2.2);P.wAura.on=P.wAura2.on=P.wStars.on=true;
  P.wAura.m=M4.trs([X,y0+4.4,Z],{s:[6.4*pul,5.6*pul,6.4*pul]});P.wAura.tint=hc(0);P.wAura.alpha=.09*k;
  P.wAura2.m=M4.trs([X,y0+.15*Math.sin(t*1.3),Z],{ry:t*.22,s:[pul,1,pul]});P.wAura2.alpha=(.5+.15*Math.sin(t*3.1))*k;
  P.wStars.m=M4.trs([X,y0+F.t*.9,Z],{ry:t*.55,s:[1+F.t*.05,1+F.t*.05,1+F.t*.05]});P.wStars.alpha=.95*k;
  SK.forEach((s,i)=>{const T=(F.t-i*1.7-1)%5.2;const on=F.t>1&&T>=0&&T<1.6&&k>.2;s.m.on=on;if(!on)return;const ang=.6+i*1.9,cx=X+Math.cos(ang)*30,cz=Z+Math.sin(ang)*30;
    s.m.m=M4.trs([cx-Math.cos(ang+1.2)*(T*28-18),y0+44+i*4-T*7,cz-Math.sin(ang+1.2)*(T*28-18)],{ry:-(ang+1.2),rz:-.25,s:[1.4+i*.3,1,1]});s.m.alpha=Math.min(1,(1.6-T)*1.5)*.95;});}
/* ---- нум сум, сур харваа (гэрийн урд, 13 м; жинхэнэдээ 75 м) ---- */
const BOW_AT=[-2.55+GX,.78+GZ],SHOOT=[3.2,9.6],TARGET=[3.2,22.6],SURS=[];
/* харвааны талбай: байны орчим, сум явах зурвас өвсгүй (өндөр өвсөнд сур харагдахгүй байсан) */
W3BARE.push([TARGET[0],TARGET[1]+.3,2.4]);for(let k=1;k<9;k++)W3BARE.push([SHOOT[0],SHOOT[1]+1+k*1.45,.85]);
/* дэвсгэр дэлгэсэн газрын өвсийг хасна: тухайн хавтангуудыг шинэчилж, ойрын өвсийг дахин ургуулна */
function grassBare(x,z,r,on){const i=W3BARE.findIndex(b=>b[3]==="mat");if(i>=0)W3BARE.splice(i,1);if(on)W3BARE.push([x,z,r,"mat"]);
  const T=W3GRASS.TILES;if(T&&T.clear)T.clear();if(G.W&&G.started)W3GRASS.init(G.W,G.cam.pos[0],G.cam.pos[2],"near");}
function surInit(){SURS.length=0;for(let r=0;r<3;r++)for(let i=0;i<14;i++)SURS.push({x:(i-6.5)*.12,y:.056+r*.106,red:r===1&&(i===6||i===7),on:1,f:null});G.surDirty=true;}
function surGeo(){const g=new Geo(233),L=hex("#C9A57A"),D=hex("#8A6236"),Rd=hex("#B8361E"),y0=w3H(TARGET[0],TARGET[1]);
  g.at([TARGET[0],y0,TARGET[1]],{},q=>{q.at([0,.004,.1],{},w=>w.box(2.4,.01,.8,hex("#B9A27A")));
    [-1.15,1.15].forEach(x=>q.at([x,0,0],{},w=>{w.cyl(.03,.025,1.1,6,hex("#F3EEDF"),true,.03);w.at([x<0?.12:-.12,.95,0],{},v=>v.box(.22,.14,.01,hex("#B8361E")));}));
    SURS.forEach(s=>{if(!s.on&&!s.f)return;const p=s.f?s.f.p:[s.x,s.y,0];q.at(p,{rx:Math.PI/2+(s.f?s.f.r:0),rz:s.f?s.f.r*.7:0},w=>w.at([0,-.055,0],{},u=>u.cyl(.053,.053,.11,8,s.red?Rd:(s.x*31|0)%2?L:D,true,.04)));});});return g;}
function bowWall(show){(G.bowMeshes||[]).forEach(m=>{const gl=G.W.gl;gl.bindBuffer(gl.ARRAY_BUFFER,m.b);gl.bufferData(gl.ARRAY_BUFFER,show?m.gvS:m.gvB,gl.STATIC_DRAW);});}
function arrowGeo(){const g=new Geo(234);g.at([0,0,0],{rz:-Math.PI/2},q=>{q.cyl(.006,.006,.78,5,hex("#B88A55"),true,0);q.at([0,.78,0],{},w=>w.cyl(.014,0,.05,5,hex("#4A4038"),true,0));
  [0,2.1,4.2].forEach(a=>q.at([Math.cos(a)*.012,.05,Math.sin(a)*.012],{ry:-a},w=>w.box(.002,.1,.026,hex("#F3EEDF"))));});return g;}
function stuckGeo(){const g=new Geo(235);(G.stuck||[]).forEach(a=>g.at([a[0],a[1],a[2]],{ry:a[3],rz:a[4]},q=>q.at([0,0,0],{rz:-Math.PI/2},w=>{w.cyl(.006,.006,.6,5,hex("#B88A55"),true,0);[0,2.1,4.2].forEach(b=>w.at([Math.cos(b)*.012,0,Math.sin(b)*.012],{ry:-b},v=>v.box(.002,.1,.026,hex("#F3EEDF"))));})));return g;}
function rangeGeo(){const g=new Geo(240),C=hex("#86744F"),C2=hex("#81704C"),Y=(x,z)=>w3H(x,z)+.012,R=chRng(240);   /* харвааны талбайн гишгэгдсэн шороо */
  const ring=(cx,cz,r,n)=>{for(let i=0;i<n;i++){const a0=i/n*6.283,a1=(i+1)/n*6.283,r0=r*(.92+R()*.12),r1=r*(.92+R()*.12),A=[cx+Math.cos(a0)*r0,0,cz+Math.sin(a0)*r0],B=[cx+Math.cos(a1)*r1,0,cz+Math.sin(a1)*r1];
    A[1]=Y(A[0],A[2]);B[1]=Y(B[0],B[2]);g.tri([cx,Y(cx,cz),cz],B,A,i%2?C:C2,.03);}};
  ring(TARGET[0],TARGET[1]+.3,2.3,28);ring(SHOOT[0],SHOOT[1]+.2,1.3,20);
  for(let k=0;k<12;k++){const z0=SHOOT[1]+1.2+k*1.0,z1=z0+1.05,w=.62,x=SHOOT[0];g.tri([x-w,Y(x-w,z0),z0],[x+w,Y(x+w,z0),z0],[x+w,Y(x+w,z1),z1],k%2?C:C2,.03);g.tri([x-w,Y(x-w,z0),z0],[x+w,Y(x+w,z1),z1],[x-w,Y(x-w,z1),z1],k%2?C:C2,.03);}
  return g;}
function lineGeo(){const g=new Geo(236),y=w3H(SHOOT[0],SHOOT[1]);g.at([SHOOT[0],y+.01,SHOOT[1]+.15],{},q=>{q.box(2.2,.012,.035,hex("#F3EEDF"));[-1.1,1.1].forEach(x=>q.at([x,0,0],{},w=>w.cyl(.025,.02,.3,6,hex("#8A6236"),true,.04)));});return g;}
const ARFACTS=["Сур харваа бол наадмын эрийн гурван наадмын нэг.","Байг жижиг арьсан «сур»-аар гурван давхар өрж, намхан хана шиг тавьдаг. Голын хоёр сур нь улаан.",
  "Сур онох бүрт байны дэргэдэх хүмүүс гараа өргөн «уухай» гэж дуулна.","Халх харвааны зай эрэгтэй 75 м, эмэгтэй 65 м. Энд богиносгоод 13 м.",
  "Хүүхэд насаараа зайгаа тооцно: хөвгүүн насаа 4-өөр, охин 3-аар үржүүлнэ.","Монгол нумыг мод, эвэр, шөрмөс, арьс, цавуугаар хийж, хэлбэржүүлэхэд хагас жилээс жил болдог."];
/* Сур харваа — буудлагын тоглоом шиг: камер байн руу томорно (zoom), онилгоо дэлгэцийн голд, амьсгалын заагч хажууд.
   Дарж барихад нум татагдаж 4 тоолж амьсгаа авна → амьсгаагаа барьж онилно (хуруугаа чирж онилгоог засна) → суллахад сум 3D-ээр нисч, онох нь шууд харагдана → 4 тоолж амьсгаа гаргана. */
function archOpen(){if(busy())return;const R=()=>(Math.random()-.5);G.arch={ph:"ready",k:0,t:0,ex:0,f:0,res:"",ax:R()*.5,ay:R()*.12,sx:0,sy:0};
  G.glide={from:[G.cam.pos[0],G.cam.pos[2]],to:[SHOOT[0],SHOOT[1]],t:0,dur:.6,then:()=>{}};cardOpen("#archHud",null);document.body.classList.add("aiming");archShow();}
function archAimPt(){const A=G.arch,ty=w3H(TARGET[0],TARGET[1]);return [TARGET[0]+A.ax+A.sx,ty+.17+A.ay+A.sy,TARGET[1]];}
function archSway(){const A=G.arch;if(!A)return 1;if(A.ph==="draw")return .7+.3*(1-A.k);if(A.ph!=="aim")return .55;const t=A.t;return t<1.5?1-t/1.5*.85:t<4?.15:Math.min(1.3,.15+(t-4)*.35);}
function archShow(){const A=G.arch;if(!A)return;const q=$,ph=A.ph;
  const tip=ph==="ready"?(A.res||"Товчийг (эсвэл дэлгэцийг) дарж барин нумаа тат. Хуруугаа чирж онилгоогоо засна."):ph==="draw"?"Нумаа татаж байна…":
    ph==="aim"?(archSway()<.4?"Тогтворжлоо — одоо тавь!":A.t>4?"Гар ядарч байна — тавь.":"Онилж байна…"):(A.res||"Сум нисч байна…");
  if(q("#archTip").textContent!==tip)q("#archTip").textContent=tip;
  /* амьсгалын заагч: ав (томорно) → барь → гарга (жижгэрнэ) */
  const ring=ph==="draw"?.4+.6*A.k:ph==="aim"?1:ph==="exhale"?1-.6*A.ex:.4,bt=ph==="draw"?`Амьсгаа ав · ${Math.min(4,1+Math.floor(A.k*4))}`:ph==="aim"?"Амьсгаагаа барь":ph==="exhale"?`Аажуухан гарга · ${Math.max(1,4-Math.floor(A.ex*4))}`:"Бэлэн";
  q("#brRing").setAttribute("r",String(34*ring));if(q("#brText").textContent!==bt)q("#brText").textContent=bt;$$("#archHud .brsteps li").forEach((li,i)=>li.classList.toggle("on",i===(ph==="draw"?0:ph==="aim"?1:ph==="exhale"?2:-1)));
  q("#drawBar").style.transform=`scaleY(${ph==="draw"?A.k:ph==="aim"?1:0})`;
  /* онилгоо: байн дээрх цэгийг дэлгэц рүү буулгана */
  const r=q("#arReticle"),pp=G.cam.VP?w3Proj(G.cam,archAimPt()):null;
  if(pp&&ph!=="exhale"){const sx=pp.x*(innerWidth/(G.cam.W||innerWidth)),sy=pp.y*(innerHeight/(G.cam.H||innerHeight));r.style.transform=`translate(${sx}px,${sy}px) scale(${ph==="aim"?1:1.25})`;r.style.opacity=ph==="ready"?".55":"1";r.classList.toggle("steady",ph==="aim"&&archSway()<.4);}
  else r.style.opacity="0";
  const b=q("#archBtn"),lab=ph==="ready"?"Тат":ph==="exhale"?"…":"Тавь";if(b.textContent!==lab)b.textContent=lab;b.disabled=ph==="exhale";
  const fact=ph==="ready"?ARFACTS[A.f%ARFACTS.length]:"";if(q("#archFact").textContent!==fact)q("#archFact").textContent=fact;q("#archFix").hidden=SURS.filter(x=>!x.on).length<6;}
function archHold(on){const A=G.arch;if(!A)return;if(on&&A.ph==="ready"){A.ph="draw";A.k=0;A.res="";if(SND.burst&&SND.ctx)SND.burst(SND.ctx.currentTime,.6,{f:240,q:5,v:.02,type:"bandpass"});}
  else if(!on&&(A.ph==="draw"||A.ph==="aim"))archRelease();archShow();}
function archDrag(dx,dy){const A=G.arch;if(!A||(A.ph!=="draw"&&A.ph!=="aim"))return;const k=.017/(G.zoom||1);A.ax=Math.max(-2,Math.min(2,A.ax+dx*k));A.ay=Math.max(-.8,Math.min(.8,A.ay-dy*k));}
function archRelease(){const A=G.arch;const full=A.ph==="aim",ty=w3H(TARGET[0],TARGET[1]),c=G.cam,f=camFwd(c),rt=[-f[2],0,f[0]];
  const P=archAimPt(),dx=P[0]-TARGET[0],dy=P[1]-(ty+.17),hit=full&&Math.abs(dx)<.86&&dy>-.2&&dy<.2;
  const to=full?(hit?[P[0],P[1],TARGET[1]-.02]:[P[0],Math.max(ty+.02,P[1]-.25),TARGET[1]+.8+Math.random()*1.4]):[SHOOT[0]+(Math.random()-.5)*.6,ty,SHOOT[1]+3+A.k*6];
  const from=[c.pos[0]+f[0]*.5+rt[0]*.16,c.pos[1]-.14,c.pos[2]+f[2]*.5+rt[2]*.16];
  G.arrow={from,to,t:0,dur:full?.85:.6,h:full?.32:.5,hit,full,dx,dy};A.ph="exhale";A.ex=0;A.f++;A.res="";
  if(SND.burst&&SND.ctx)SND.burst(SND.ctx.currentTime,.18,{f:900,q:1.2,v:.05,type:"bandpass"});}
function archStep(dt){const A=G.arch;
  if(A){if(A.ph==="draw"){A.k=Math.min(1,A.k+dt/4);if(A.k>=1){A.ph="aim";A.t=0;}}else if(A.ph==="aim")A.t+=dt;
    else if(A.ph==="exhale"){A.ex=Math.min(1,A.ex+dt/4);if(A.ex>=1){A.ph="ready";const R=()=>(Math.random()-.5);A.ax=Math.max(-2,Math.min(2,A.ax+R()*.3));A.ay=Math.max(-.8,Math.min(.8,A.ay+R()*.06));}}
    const tt=performance.now()/1000,sw=archSway();A.sx=sw*(Math.sin(tt*2.3)*.55+Math.sin(tt*5.1)*.18);A.sy=sw*(Math.cos(tt*2.9)*.14+Math.sin(tt*6.3)*.05);
    /* камер: байн руу харж, татах тусам томорно */
    const ty=w3H(TARGET[0],TARGET[1]);if(!G.glide){const t=yp(G.cam.pos,[TARGET[0],ty+.2,TARGET[1]]);G.cam.yaw+=Math.atan2(Math.sin(t.yaw-G.cam.yaw),Math.cos(t.yaw-G.cam.yaw))*Math.min(1,dt*6);G.cam.pitch+=(t.pitch-G.cam.pitch)*Math.min(1,dt*6);}
    const zt=A.ph==="ready"?2.4:A.ph==="draw"?2.4+2.2*A.k:A.ph==="aim"?4.8:(G.arrow||A.ex<.45?4.8:2.4);G.zoom=(G.zoom||1)+(zt-(G.zoom||1))*Math.min(1,dt*3);archShow();}
  else if(G.zoom&&G.zoom!==1){G.zoom+=(1-G.zoom)*Math.min(1,dt*5);if(Math.abs(G.zoom-1)<.01)G.zoom=1;}
  self.W3ZOOM=G.zoom||1;
  const R=G.arrow,P=G.P.m;if(!P.arrow)return;if(!R){P.arrow.on=false;}else{R.t=Math.min(1,R.t+dt/R.dur);const k=R.t,p=[R.from[0]+(R.to[0]-R.from[0])*k,R.from[1]+(R.to[1]-R.from[1])*k+R.h*4*k*(1-k),R.from[2]+(R.to[2]-R.from[2])*k];
    const dx=R.to[0]-R.from[0],dz=R.to[2]-R.from[2],vy=(R.to[1]-R.from[1])+R.h*4*(1-2*k),hz=Math.hypot(dx,dz);P.arrow.on=true;P.arrow.m=M4.trs(p,{ry:-Math.atan2(dz,dx),rz:Math.atan2(vy,hz)});
    if(k>=1){G.arrow=null;P.arrow.on=false;const A2=G.arch;
      if(R.hit){/* онилгоо тусгасан газрын хамгийн ойрын сур(ууд) унана */const rel=[R.dx,R.dy+.17];const cand=SURS.filter(s=>s.on).sort((a,b)=>Math.hypot(a.x-rel[0],a.y-rel[1])-Math.hypot(b.x-rel[0],b.y-rel[1]));
        const n=cand.length&&Math.hypot(cand[0].x-rel[0],cand[0].y-rel[1])<.14?1+(Math.random()<.3?1:0):0;
        cand.slice(0,n).forEach(s=>{s.on=0;s.f={p:[s.x,s.y,0],v:[(Math.random()-.5)*.8,1.4+Math.random(),2+Math.random()],r:0,t:0};});G.surDirty=true;
        G.stuck=(G.stuck||[]).concat([[R.to[0],w3H(TARGET[0],TARGET[1])+.03,TARGET[1]+.55+Math.random()*.4,-Math.atan2(dz,dx),-.25]]).slice(-8);G.stuckDirty=true;
        if(n){if(A2)A2.res="Уухай! Сур онов.";if(SND.chime)SND.chime();showPlace("Уухай!");}else if(A2)A2.res="Унасан сурны зайгаар өнгөрлөө — үлдсэн сур руу онил.";}
      else{G.stuck=(G.stuck||[]).concat([[R.to[0],R.to[1]+.02,R.to[2],-Math.atan2(dz,dx),-.35]]).slice(-8);G.stuckDirty=true;
        if(A2)A2.res=R.full?"Сурны хажуугаар өнгөрлөө. Онилгоогоо байн дээр тааруулж, тогтворжтол хүлээгээд тавь.":"Нум бүрэн татаагүй тул ойрхон унав. 4 тоолж аажуухан амьсгаа аваад тат.";}}}
  let fly=false;SURS.forEach(s=>{if(!s.f||s.f.done)return;fly=true;const f=s.f;f.t+=dt;f.v[1]-=9.8*dt;f.p[0]+=f.v[0]*dt;f.p[1]+=f.v[1]*dt;f.p[2]+=f.v[2]*dt;f.r+=dt*7;
    if(f.p[1]<.055&&f.v[1]<0){f.p[1]=.055;f.v=[0,0,0];f.done=1;}});if(fly||G.surDirty){G.surDirty=false;w3Rebuf(G.W,P.sur,surGeo());}
  if(G.stuckDirty){G.stuckDirty=false;w3Rebuf(G.W,P.stuck,stuckGeo());P.stuck.on=!!(G.stuck&&G.stuck.length);}}
function archClose(){if(!G.arch)return;G.arch=null;document.body.classList.remove("aiming");cardClose("#archHud");}
function archFix(){surInit();G.stuck=[];G.stuckDirty=true;archShow();}
/* ---- шагай: авдраас шагай, эсгий дэвсгэр → дуртай газраа дэлгэх → тоглох ---- */
const SHSIDE=[["mori","Морь","#C0392B",.12],["temee","Тэмээ","#C9A227",.13],["khoni","Хонь","#EFE9DA",.39],["yamaa","Ямаа","#6E8BA6",.36]];
const SHG=Object.assign({mat:null},SAVE.shg||{});
function shSave(){w3Save({shg:SHG});}
if(SHG.mat&&!SHG.mat[3])W3BARE.push([SHG.mat[0],SHG.mat[1],1.05,"mat"]);
function shRoll(){let r=Math.random();for(const s of SHSIDE){r-=s[3];if(r<0)return s[0];}return "yamaa";}
const SHICON={mori:"М",temee:"Т",khoni:"Х",yamaa:"Я"},SHN=Object.fromEntries(SHSIDE.map(s=>[s[0],s[1]])),SHC=Object.fromEntries(SHSIDE.map(s=>[s[0],s[2]]));
const SHIMG={},SHASP={mori:1.18,khoni:1.44,temee:1.27,yamaa:1.46};   /* хэрэглэгчийн зурсан 4 шагай (assets/shagai/*.png): морь, хонь, тэмээ, ямаа */
["mori","khoni","temee","yamaa"].forEach(k=>{const im=new Image();im.src=W3BASE+"shagai/shagai_"+k+".png";SHIMG[k]=im;});
function shBone(side,x,y,r){const w=r*2*SHASP[side]/1.3,h=w/SHASP[side];return `<g transform="translate(${x} ${y})"><title>${SHN[side]}</title><ellipse cy="${h*.42}" rx="${w*.42}" ry="${h*.12}" fill="rgba(0,0,0,.22)"/><image href="${W3BASE}shagai/shagai_${side}.png" x="${-w/2}" y="${-h/2}" width="${w}" height="${h}"/></g>`;}
function shLbl(side,x,y){return `<text x="${x}" y="${y}" text-anchor="middle" font-size="9" fill="currentColor" opacity=".85">${SHN[side]}</text>`;}
const SHFACTS=["Шагай газар унахдаа 4 талын нэгээр буудаг: морь, тэмээ, хонь, ямаа.","Хонь, ямаа тал хамгийн олон буудаг: ойролцоогоор морь 12%, тэмээ 13%, хонь 39%, ямаа 36%.",
  "Шагайн тоглоомд шалан дээр эсгий дэвсгэр дэлгэдэг.","Морь уралдуулахад 4 шагай хаяж, «морь» буусан бүрт морио нэг алхам урагшлуулна.",
  "Няслахдаа хониор хонийг, мориор морийг онож авна. Гурав дахь шагайд шүргэвэл ээлж шилжинэ; өөр дүрстэйг оновол нэг шагай буцааж тавина. Нэг хүүхэд ч тоглож болно.","Шагайг өргөн вандан дээр өрөөд тусгай сумаар няслах тоглоом ч бий. Ингэж няслахыг нясамдах, нясанцах, харвах гэж ч нэрлэдэг.","Гэр бүлийн шагай үеэс үед өвлөгдөж, хэдэн зуу хүрдэг."];
const SHEX={mori:["Морь","Мөрөө ар тийш 5 удаа аажуухан эргүүл.",10],temee:["Тэмээ","Хүзүүгээ зөөлөн баруун, зүүн тийш сунга.",12],khoni:["Хонь","4 удаа гүнзгий, аажуухан амьсгаа ав.",16],yamaa:["Ямаа","Гараа дээш сунгаж, өлмий дээрээ 10 тоол.",10]};
function shMatGeo(){const g=new Geo(237),Rd=hex("#B8361E"),W=hex("#F3E6C8"),B=hex("#2E5C9A");g.box(1.3,.02,1.3,Rd);g.at([0,.012,0],{},q=>q.box(1.12,.006,1.12,W));g.at([0,.016,0],{},q=>q.box(1.0,.006,1.0,Rd));
  [[-.42,-.42],[.42,-.42],[-.42,.42],[.42,.42]].forEach(([x,z])=>g.at([x,.02,z],{ry:Math.PI/4},q=>q.box(.1,.006,.1,B)));
  const R=chRng(237);for(let i=0;i<9;i++)g.at([(R()-.5)*.6,.03,(R()-.5)*.6],{ry:R()*3,s:[.035,.022,.026]},q=>q.sph(1,6,hex(["#EFE9DA","#C0392B","#C9A227","#6E8BA6"][i%4]),.05));return g;}
function matPut(){const c=G.cam,f=[Math.sin(c.yaw),-Math.cos(c.yaw)];let x=c.pos[0]+f[0]*1.1,z=c.pos[2]+f[1]*1.1;
  if(G.inGer){x-=GX;z-=GZ;const d=Math.hypot(x,z);if(d>2.5){x*=2.5/d;z*=2.5/d;}if(d<1.2){const k=1.2/(d||1);x*=k;z*=k;}x+=GX;z+=GZ;}
  SHG.mat=[+x.toFixed(2),+z.toFixed(2),+(-c.yaw).toFixed(2),G.inGer?1:0];INV.shagai=false;G.matArm=false;shSave();airSave();itemsShow();if(!G.inGer)grassBare(x,z,1.05,true);hint("Дэвсгэрээ дэлгэлээ. «Шагай тоглох».",3500);}
function matTake(){if(SHG.mat&&!SHG.mat[3])grassBare(0,0,0,false);SHG.mat=null;INV.shagai=true;shSave();airSave();itemsShow();shClose();hint("Дэвсгэр, шагайгаа хураалаа. Дуртай газраа дахин дэлгэж болно.",4000);}
function shMatStep(){const P=G.P.m;if(!P.shMat)return;const M=SHG.mat;P.shMat.on=!!M;if(!M)return;const y=M[3]?.045:w3H(M[0],M[1])+landLift(M[0],M[1])+.005;P.shMat.m=M4.trs([M[0],y,M[1]],{ry:M[2]});}
function shOpen(){if(busy()||!SHG.mat)return;G.shg={mode:"ex",f:0};const M=SHG.mat,y=M[3]?.045:w3H(M[0],M[1]);cardOpen("#shagai",[M[0],y,M[1]]);shMode("ex");}
function shClose(){if(!G.shg)return;G.shg=null;FL.run=false;cardClose("#shagai");}
function shMode(m){const S=G.shg;if(!S)return;S.mode=m;$$("#shagai [data-sm]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.sm===m)));
  $("#shFact").textContent=SHFACTS[S.f++%SHFACTS.length];if(m==="ex")exRender();else if(m==="race")raceRender(true);else flInit();}
/* (а) шагай хаяж, буусан талаар нь дасгал хийнэ */
function exRender(){const S=G.shg,E=S.ex;let h=`<p class="sub small">4 шагай хая — буусан тал бүр нэг жижиг дасгал болно.</p><svg class="shsvg" viewBox="0 0 240 72">`;
  (E&&E.roll||["mori","khoni","temee","yamaa"]).forEach((s,i)=>{h+=shBone(s,36+i*56,30,19);h+=shLbl(s,36+i*56,64);});h+=`</svg>`;
  if(E&&E.list){const cur=E.list[E.i],prep=E.prep>0;h+=`<ol class="shlist">${E.list.map((x,i)=>`<li class="${prep?"":i<E.i?"done":i===E.i?"now":""}"><b>${x[0]}${x[3]>1?` ×${x[3]}`:""}</b> ${x[1]} <small>(${x[2]} сек)</small></li>`).join("")}</ol>`;
    h+=prep?`<p class="shnow">Уншаад бэлдээрэй: <b>${Math.ceil(E.prep)}</b></p><button type="button" class="btn ghost" id="shGo">Одоо эхлэх</button>`:cur?`<p class="shnow">${cur[0]}: <b>${Math.ceil(E.left)}</b></p>`:`<p class="shnow">Сайн байна! Дасгал дууслаа.</p>`;}
  h+=`<button type="button" class="btn" id="shThrow">${E&&E.list&&(E.prep>0||E.list[E.i])?"Дахин хаях":"Шагай хаях"}</button>`;$("#shBody").innerHTML=h;$("#shThrow").onclick=exThrow;if($("#shGo"))$("#shGo").onclick=()=>{S.ex.prep=0;exRender();};}
function exThrow(){const S=G.shg;const roll=[0,1,2,3].map(shRoll),n={};roll.forEach(s=>n[s]=(n[s]||0)+1);
  const list=Object.keys(n).map(s=>[SHEX[s][0],SHEX[s][1],Math.min(30,SHEX[s][2]*n[s]),n[s]]);S.ex={roll,list,i:0,left:list[0][2],prep:10};   /* эхлээд 10 сек уншиж бэлдэнэ */
  if(SND.burst&&SND.ctx)SND.burst(SND.ctx.currentTime,.35,{f:1400,q:2,v:.04,type:"bandpass"});exRender();}
function exStepSh(dt){const S=G.shg;if(!S||S.mode!=="ex"||!S.ex)return;const E=S.ex;
  if(E.prep>0){const p0=Math.ceil(E.prep);E.prep-=dt;if(E.prep<=0){E.prep=0;if(SND.chime)SND.chime();exRender();}else if(Math.ceil(E.prep)!==p0){const el=$("#shBody .shnow b");if(el)el.textContent=Math.ceil(E.prep);}return;}
  if(!E.list[E.i])return;const l0=Math.ceil(E.left);E.left-=dt;
  if(E.left<=0){E.i++;if(E.list[E.i])E.left=E.list[E.i][2];else if(SND.chime)SND.chime();exRender();}else if(Math.ceil(E.left)!==l0){const el=$("#shBody .shnow b");if(el)el.textContent=Math.ceil(E.left);}}
/* (б) морь уралдуулах: 4 морьноос нэгийг сонгоно; товч бүрт морь бүрд 4 шагай хаяж «морь» буусан тоогоор урагшилна; бүгд барианд ортол.
   Цол наадмын ёсоор: түрүү магнай, аман хүзүү, айргийн гурав, айргийн дөрөв */
const RACE_N=8,RACEH=[["Хүрэн","#6B3E22"],["Зээрд","#B85C2A"],["Саарал","#A3A19A"],["Хээр","#8E3B22"]],RTITLE=["Түрүү магнай","Аман хүзүү","Айргийн гурав","Айргийн дөрөв"];
function raceRender(reset){const S=G.shg,keep=S.race?S.race.pick:null;if(reset||!S.race)S.race={pos:[0,0,0,0],last:null,pick:keep,place:[0,0,0,0],next:1,done:false};const R=S.race;
  if(R.pick==null){let h=`<p class="sub small">Аль морио уралдуулах вэ? Нэгийг нь сонго.</p><div class="rpick">`;
    RACEH.forEach(([nm,c],i)=>h+=`<button type="button" data-rp="${i}"><i style="background:${c}"></i>${nm}</button>`);$("#shBody").innerHTML=h+`</div>`;
    $$("#shBody [data-rp]").forEach(b=>b.onclick=()=>racePick(+b.dataset.rp));return;}
  let h=`<p class="sub small">Таны морь: <b>${RACEH[R.pick][0]}</b>. Товч бүрт морь бүрд 4 шагай хаяна — «морь» буусан тоогоор урагшилна.</p><svg class="shsvg" viewBox="0 0 240 140">`;
  RACEH.forEach(([nm,c],i)=>{const y=16+i*30,me=i===R.pick;if(me)h+=`<rect x="0" y="${y-11}" width="240" height="27" rx="6" fill="rgba(255,194,74,.16)"/>`;
    h+=`<text x="2" y="${y+4}" font-size="9" font-weight="${me?700:400}" fill="currentColor">${me?"★ ":""}${nm}</text>`;for(let j=0;j<=RACE_N;j++)h+=`<circle cx="${46+j*22}" cy="${y}" r="3" fill="#C9B48A" opacity=".7"/>`;
    h+=`<path d="M${46+RACE_N*22+8} ${y-9}v18" stroke="#B8361E" stroke-width="2"/><g transform="translate(${46+R.pos[i]*22} ${y})"><ellipse rx="8" ry="6.2" fill="${c}" stroke="${me?"#FFC24A":"#fff"}" stroke-width="${me?2.2:1.2}"/></g>`;
    if(R.place[i])h+=`<text x="${46+RACE_N*22-14}" y="${y+16}" text-anchor="end" font-size="7.5" fill="currentColor" opacity=".85">${RTITLE[R.place[i]-1]}</text>`;
    else if(R.last&&R.last[i])R.last[i].forEach((sd,j)=>h+=`<image href="${W3BASE}shagai/shagai_${sd}.png" x="${44+j*15}" y="${y+6}" width="13" height="${13/SHASP[sd]}"${sd==="mori"?"":' opacity=".55"'}/>`);});
  h+=`</svg>`;
  if(R.done){const ord=[0,1,2,3].sort((a,b)=>R.place[a]-R.place[b]);h+=`<ol class="shlist rres">${ord.map(i=>`<li${i===R.pick?' class="now"':""}><b>${RTITLE[R.place[i]-1]}</b> — ${RACEH[i][0]}${i===R.pick?" (таны морь)":""}</li>`).join("")}</ol>`;
    h+=`<button type="button" class="btn" id="shRace">Дахин уралдуулах</button><button type="button" class="btn ghost" id="shPick">Өөр морь сонгох</button>`;}
  else h+=`<button type="button" class="btn" id="shRace">Шагай хаях</button>`;
  $("#shBody").innerHTML=h;$("#shRace").onclick=()=>{if(R.done)raceRender(true);else raceThrow();};if($("#shPick"))$("#shPick").onclick=()=>{G.shg.race=null;raceRender(true);};}
function racePick(i){const S=G.shg;if(!S.race)raceRender(true);S.race.pick=i;raceRender(false);}
function raceThrow(){const R=G.shg.race;if(!R||R.pick==null||R.done)return;R.last=R.pos.map((p,i)=>R.place[i]?null:[0,1,2,3].map(shRoll));
  const fin=[];R.last.forEach((L,i)=>{if(!L)return;R.pos[i]=Math.min(RACE_N,R.pos[i]+L.filter(s=>s==="mori").length);if(R.pos[i]>=RACE_N)fin.push(i);});
  /* нэг удаад барианд орсон морьдыг илүү «морь» буусан дарааллаар */
  fin.sort((a,b)=>R.last[b].filter(s=>s==="mori").length-R.last[a].filter(s=>s==="mori").length).forEach(i=>{R.place[i]=R.next++;});
  if(fin.length){if(fin.includes(R.pick)&&SND.chime)SND.chime();showPlace(fin.map(i=>`${RACEH[i][0]} — ${RTITLE[R.place[i]-1]}`).join(", "));}
  if(R.place.every(x=>x))R.done=true;if(SND.burst&&SND.ctx)SND.burst(SND.ctx.currentTime,.3,{f:1300,q:2,v:.04,type:"bandpass"});raceRender(false);}
/* (в) няслах. Дүрэм (хэрэглэгчийн бичсэнээр): олон шагайг ширдэг дээр цацна; хониор хонийг, мориор морийг — ижил дүрстэйг хооронд нь няслана.
   Гурав дахь шагайд шүргэх төдийд ээлж дараагийн хүнд шилжинэ (авахгүй). Өөр дүрстэй шагай оновол авсан шагайнаасаа нэгийг буцааж тавина. Нэг хүүхэд ч тоглож болно. */
const FL={P:[],pile:[[],[]],n:1,turn:0,run:false,sel:-1,drag:null,shooter:-1,first:-1,touch:null,msg:""},FR=11;
function flInit(){$("#shBody").innerHTML=`<div class="seg tabs flplayers" role="group" aria-label="Тоглогч"><button type="button" data-fn="1" aria-pressed="${FL.n===1}">Ганцаараа</button><button type="button" data-fn="2" aria-pressed="${FL.n===2}">Хоёулаа</button></div>
  <p class="sub small" id="flMsg">Шагайгаа хуруугаараа дарж, арагш татаад суллана. Хониор хонийг, мориор морийг — ижил дүрстэйг онож авна. Гурав дахь шагайд хүрвэл ээлж шилжинэ; өөр дүрстэйг оновол нэг шагай буцааж тавина.</p>
  <canvas id="flC" class="flc" width="300" height="200"></canvas><div class="flpiles" id="flPile" aria-label="Авсан шагай"></div><button type="button" class="btn ghost" id="flNew">Шинээр цацах</button>`;
  $$("#shBody [data-fn]").forEach(b=>b.onclick=()=>{FL.n=+b.dataset.fn;FL.turn=0;flScatter();flInit();});
  $("#flNew").onclick=()=>{flScatter();flDraw();};flBind($("#flC"));if(!FL.P.length)flScatter();flDraw();}
function flFree(){let x,y,n=0;do{x=26+Math.random()*248;y=26+Math.random()*148;}while(n++<300&&!FL.P.every(p=>Math.hypot(p.x-x,p.y-y)>FR*2.4));return [x,y];}
function flScatter(){FL.P=[];FL.pile=[[],[]];FL.turn=0;for(let i=0;i<14;i++){const [x,y]=flFree();FL.P.push({x,y,vx:0,vy:0,s:shRoll(),a:(Math.random()-.5)*1.2});}FL.msg="";}
function flXY(cv,e){const r=cv.getBoundingClientRect();return [(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height];}
function flBind(cv){cv.onpointerdown=e=>{if(FL.run)return;const [x,y]=flXY(cv,e);const i=FL.P.findIndex(p=>Math.hypot(p.x-x,p.y-y)<FR+6);if(i<0)return;FL.sel=i;FL.drag=[x,y];try{cv.setPointerCapture(e.pointerId);}catch(_){}flDraw();};
  cv.onpointermove=e=>{if(FL.sel<0)return;FL.drag=flXY(cv,e);flDraw();};
  cv.onpointerup=e=>{if(FL.sel<0)return;const p=FL.P[FL.sel],[x,y]=flXY(cv,e),dx=p.x-x,dy=p.y-y,L=Math.hypot(dx,dy);
    if(L>8){const k=Math.min(L,80)/80*8/L;flShootI(FL.sel,dx*k,dy*k);}FL.sel=-1;FL.drag=null;flDraw();};}
function flShootI(i,vx,vy){const p=FL.P[i];p.vx=vx;p.vy=vy;FL.shooter=i;FL.first=-1;FL.touch=new Set([i]);FL.run=true;
  if(SND.burst&&SND.ctx)SND.burst(SND.ctx.currentTime,.07,{f:2600,q:3,v:.04,type:"bandpass"});requestAnimationFrame(flLoop);}
function flLoop(){if(!FL.run||!G.shg)return;const P=FL.P,D=FR*2;for(let st=0;st<2;st++){P.forEach(p=>{p.x+=p.vx*.5;p.y+=p.vy*.5;if(p.x<FR||p.x>300-FR){p.vx*=-.7;p.x=Math.max(FR,Math.min(300-FR,p.x));}if(p.y<FR||p.y>200-FR){p.vy*=-.7;p.y=Math.max(FR,Math.min(200-FR,p.y));}});
    for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const a=P[i],b=P[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>0&&d<D){
      if(i===FL.shooter||j===FL.shooter){const o=i===FL.shooter?j:i;if(FL.first<0)FL.first=o;}
      FL.touch.add(i);FL.touch.add(j);                                   /* хөдөлж буй шагай бүрийн шүргэлт */
      const nx=dx/d,ny=dy/d,rv=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rv<0){a.vx+=rv*nx;a.vy+=rv*ny;b.vx-=rv*nx;b.vy-=rv*ny;if(SND.burst&&SND.ctx)SND.burst(SND.ctx.currentTime,.05,{f:3200,q:4,v:.03,type:"bandpass"});}
      const ov=(D-d)/2;a.x-=nx*ov;a.y-=ny*ov;b.x+=nx*ov;b.y+=ny*ov;}}
    P.forEach(p=>{p.vx*=.975;p.vy*=.975;if(Math.hypot(p.vx,p.vy)<.05){p.vx=p.vy=0;}});}
  flDraw();if(P.some(p=>p.vx||p.vy))requestAnimationFrame(flLoop);else flDone();}
function flDone(){FL.run=false;const P=FL.P,s=P[FL.shooter],me=FL.pile[FL.turn],who=FL.n>1?`${FL.turn+1}-р хүн: `:"";let m,pass=true;
  if(FL.first<0)m="Хүрсэнгүй.";
  else if(P[FL.first].s!==s.s){m=`Өөр дүрстэй шагай (${SHN[P[FL.first].s]}) оновлоо.`;
    if(me.length){const back=me.pop(),[x,y]=flFree();P.push({x,y,vx:0,vy:0,s:back,a:(Math.random()-.5)*1.2});m+=` Авсан шагайнаасаа нэгийг (${SHN[back]}) буцааж тавилаа.`;}}
  else if(FL.touch.size>2)m="Гурав дахь шагайд шүргэлээ — авахгүй.";
  else{me.push(P[FL.first].s);P.splice(FL.first,1);m=`Оновоо! ${SHN[s.s]} шагай авлаа. Дахин няслаарай.`;pass=false;if(SND.chime)SND.chime();}
  if(pass&&FL.n>1){FL.turn=1-FL.turn;m+=` Ээлж ${FL.turn+1}-р хүнд.`;}else if(pass)m+=" Дахин няслаарай.";
  const cnt={};P.forEach(p=>cnt[p.s]=(cnt[p.s]||0)+1);if(!Object.values(cnt).some(v=>v>1))m+=" Ижил дүрстэй шагай үлдсэнгүй — «Шинээр цацах».";FL.msg=who+m;flDraw();}
function flDraw(){const cv=$("#flC");if(!cv)return;const x=cv.getContext("2d"),P=FL.P;x.clearRect(0,0,300,200);x.fillStyle="#9E2E1A";x.fillRect(0,0,300,200);x.strokeStyle="#F3E6C8";x.lineWidth=3;x.strokeRect(5,5,290,190);
  x.strokeStyle="rgba(243,230,200,.35)";x.lineWidth=1.5;x.strokeRect(14,14,272,172);
  P.forEach((p,i)=>{const im=SHIMG[p.s],w=FR*2.5,h=w/SHASP[p.s];x.save();x.translate(p.x,p.y);x.rotate(p.a||0);
    x.fillStyle="rgba(0,0,0,.25)";x.beginPath();x.ellipse(1.5,h*.36,w*.42,h*.16,0,0,6.283);x.fill();
    if(im&&im.complete&&im.naturalWidth)x.drawImage(im,-w/2,-h/2,w,h);else{x.beginPath();x.ellipse(0,0,FR,FR*.8,0,0,6.283);x.fillStyle="#F5EBDD";x.fill();}
    if(i===FL.sel){x.strokeStyle="#FFC24A";x.lineWidth=2.5;x.beginPath();x.ellipse(0,0,w*.56,h*.62,0,0,6.283);x.stroke();}x.restore();});
  if(FL.sel>=0&&FL.drag){const p=P[FL.sel];x.strokeStyle="rgba(255,194,74,.95)";x.lineWidth=2;x.setLineDash([4,4]);x.beginPath();x.moveTo(p.x,p.y);x.lineTo(p.x+(p.x-FL.drag[0]),p.y+(p.y-FL.drag[1]));x.stroke();x.setLineDash([]);}
  const m=$("#flMsg");if(m&&FL.msg)m.textContent=FL.msg;const pl=$("#flPile");
  if(pl)pl.innerHTML=[0,1].slice(0,FL.n).map(k=>`<div class="flpile${FL.n>1&&k===FL.turn?" now":""}">${FL.n>1?`<b>${k+1}-р хүн</b>`:""}${FL.pile[k].map(s=>`<img src="${W3BASE}shagai/shagai_${s}.png" alt="${SHN[s]}">`).join("")}</div>`).join("");}
function playStep(dt,t){wishFxStep(dt,t);archStep(dt);shMatStep();exStepSh(dt);}
surInit();
/* ================= Гэр барих: анх ороход, тохиргооноос шинээр =================
   Дараалал (Indy Guide «Mongolian Ger – Yurt»): хаалгатай нь хана дугуйлан → голд хоёр багана → тоонийг баганын оройд олсоор
   → унь (хананы оройгоос тоонын нүх рүү) → эсгий → бороонаас хамгаалах бүрээс → олсоор бэхлэх. Шал, тохижилтыг тоглоомд нэмсэн.
   Алхам бүр гарын хөдөлгөөнтэй: дарж барих, дээш/доош чирэх, тойруулан чирэх, товших. 3D хэсэг нь хөдөлгөөнийг дагаж байрандаа очно. */
const GBK=["floor","door","khana","krope","bagana","toono","uni","felt","cover","rope","furn"];
const GBS={
  floor:{t:"Шалаа дэвсэх",d:"Гэрийн газраа тэгшилж, дугуй шалаа дэвсэнэ.",f:"Айлын энгийн гэрийг хагас цаг орчимд барьдаг. Тоглоомд хэдхэн минутад барина.",g:"hold",dur:2.6,cam:[[0,4.4,7.6],[0,0,0]]},
  door:{t:"Хаалгаа босгох",d:"Хаалганы хүрээг өргөж, урд зүг рүү харуулан босгоно.",f:"Монгол гэрийн хаалга уламжлал ёсоор урагшаа хардаг.",g:"up",cam:[[1.9,1.9,7.4],[0,1,3.4]]},
  khana:{t:"Ханаа дэлгэх",d:"Хаалганаас эхлэн хананы хэсгүүдийг тойруулан дэлгэж, хооронд нь уяна.",f:"Хана бол оосроор холбосон гурав ба түүнээс олон хэсэг модон сараалж.",g:"circle",cam:[[5.6,3.6,6.9],[0,.8,0]]},
  krope:{t:"Хананы оосор татах",d:"Хананы оройг тойруулан оосроор чангална.",f:"Оосор нь дээврийн униний хүчинд хана тэлж задрахаас сэргийлдэг.",g:"hold",dur:2,cam:[[4.6,2.5,5.8],[0,1.4,0]]},
  bagana:{t:"Хоёр баганаа босгох",d:"Гэрийн голд хоёр баганаа өргөж босгоно.",f:"Багана тоонийг доороос нь тулж барина.",g:"up",cam:[[4.4,2.2,6.4],[0,1.3,0]]},
  toono:{t:"Тоонио өргөх",d:"Тоонийг баганын оройд өргөж, олсоор бэхэлнэ.",f:"Тооноор гэрэл орж, галын утаа гардаг.",g:"up",cam:[[4.4,2.6,6.4],[0,2.3,0]]},
  uni:{t:"Унь суулгах",d:"Унь бүрийн нэг үзүүрийг хананы оройд уяж, нөгөөг нь тоонын нүхэнд суулгана.",f:"Унь тооноос хана руу нарны туяа мэт цацарна.",g:"taps",n:8,cam:[[5.8,4.3,6.6],[0,2,0]]},
  felt:{t:"Эсгий туургаа ороох",d:"Хана, дээврийг эсгийгээр тойруулан хучиж дулаална.",f:"Эсгий 20–30 мм зузаан бөгөөд зун агааржуулахын тулд хормойг нь шуудаг.",g:"circle",cam:[[6.6,3.3,7.6],[0,1.4,0]]},
  cover:{t:"Гадар бүрээс хучих",d:"Эсгийн гадуур цагаан бүрээсээ дээрээс нь татаж хучина.",f:"Гадар бүрээс бороо, салхинаас хамгаална.",g:"down",cam:[[6.6,3.3,7.6],[0,1.4,0]]},
  rope:{t:"Бүслүүрээр бүслэх",d:"Гэрийг гаднаас нь олсоор тойруулан бүслэж чангална.",f:"Гэрийн хэсгүүдийг ноосон олсоор уяж бэхэлдэг.",g:"circle",cam:[[5.8,2.5,6.8],[0,1.3,0]]},
  furn:{t:"Гэрээ тохижуулах",d:"Голд нь тулга, хойморт авдар, ширээ, хоёр талд ор, баруун талд хөхүүрээ байрлуулна.",f:"Хоймор бол гэрийн хамгийн хүндтэй хэсэг.",g:"taps",n:7,cam:[[0,1.35,2.7],[0,.45,-1.3]],inGer:1}};
const GB_HOW={hold:"Дарж барина",up:"Доороос дээш чирнэ",down:"Дээрээс доош чирнэ",circle:"Тойруулан чирнэ",taps:"Товшино"};
const GBF=[/^(f:Hearth|broth)$/,/^f:(Table_Khoimor|Bowl_Table|Pottery_TeaJug)/,/^f:Chest_/,/^f:Bed_/,/^f:Rug_/,/^f:(Airag|Saddle|Bow_Quiver)/,/./];
const gbStage=st=>st==="broth"||/^f:/.test(st||"")?10:GBK.indexOf(st);
const gbFG=st=>GBF.findIndex(r=>r.test(st));
/* хана, унь, эсгийн 8 хэсэг: хаалганаас эхлээд хоёр тийш ээлжлэн */
const GB_ORD=(()=>{const a=[...Array(8).keys()].map(s=>[s,Math.abs(-Math.PI+(s+.5)*Math.PI/4),-Math.PI+(s+.5)*Math.PI/4]);a.sort((p,q)=>p[1]-q[1]||p[2]-q[2]);const o=[];a.forEach((p,i)=>o[p[0]]=i);return o;})();
const gbC=x=>Math.max(0,Math.min(1,x)),gbE=t=>1-Math.pow(1-t,3),gbEB=t=>t<=0?0:1+2.7*Math.pow(t-1,3)+1.7*Math.pow(t-1,2);
const gbSeq=(k,sec,N)=>gbC((k*(N+1.5)-GB_ORD[sec])/2.5);
const gbMul=(...a)=>a.reduce((p,q)=>M4.mul(p,q));
const gbS=(sx,sy,sz)=>M4.trs([0,0,0],{s:[sx,sy,sz]});
/* (cx,cz) цэгийг тойрон u чиглэлд sx, босоо sy дахин сунгана (хана дэлгэгдэх) */
function gbDirS(cx,cz,ux,uz,sx,sy){const m=M4.id(),k=sx-1;m[0]=1+k*ux*ux;m[2]=k*ux*uz;m[8]=k*ux*uz;m[10]=1+k*uz*uz;m[5]=sy;m[12]=cx-(m[0]*cx+m[8]*cz);m[14]=cz-(m[2]*cx+m[10]*cz);return m;}
/* гэрийн өөрийн координатаар (гол нь 0,0, хаалга +z) хэсэг бүрийн хөдөлгөөн; null = хараахан харагдахгүй */
function gbAnim(st,sec,k){
  if(st==="broth"||/^f:/.test(st||"")){const gk=gbC(k*7-gbFG(st));if(gk<=0)return null;return M4.T(0,.7*(1-gbEB(gk)),0);}
  switch(st){
    case "floor":{if(k<=0)return null;const e=gbE(k);return gbMul(M4.T(0,.3*(1-e),0),gbS(.1+.9*e,1,.1+.9*e));}
    case "door":{const e=gbEB(k);return gbMul(M4.T(0,0,3.48),M4.Rx((1-e)*Math.PI/2),M4.T(0,0,-3.48));}
    case "khana":{const ki=gbSeq(k,sec,8);if(ki<=0)return null;const e=gbE(ki),a=-Math.PI+(sec+.5)*Math.PI/4;
      return gbMul(M4.T(0,.08*(1-e),0),gbDirS(3.45*Math.sin(a),3.45*Math.cos(a),Math.cos(a),-Math.sin(a),.07+.93*e,1.2-.2*e));}
    case "krope":{if(k<=0)return null;const e=gbE(k),s=1+.16*(1-e);return gbMul(M4.T(0,.35*(1-e),0),gbS(s,1,s));}
    case "bagana":{const e=gbEB(k);return M4.Rx((1-e)*Math.PI/2);}
    case "toono":{if(k<=0)return null;const e=gbE(k);return gbMul(M4.T(0,-(1-e)*2.3,0),M4.T(0,2.9,0),M4.Rx((1-e)*.45),M4.T(0,-2.9,0));}
    case "uni":{const ki=gbSeq(k,sec,8);if(ki<=0)return null;const d=1-gbEB(ki),a=-Math.PI+(sec+.5)*Math.PI/4;return M4.T(Math.sin(a)*1.3*d,-.6*d,Math.cos(a)*1.3*d);}
    case "felt":{const ki=gbSeq(k,sec,8);if(ki<=0)return null;const d=1-gbE(ki),s=1+.12*d;return gbMul(M4.T(0,1.5*d,0),gbS(s,1,s));}
    case "cover":{const ki=gbSeq(k,sec,8);if(ki<=0)return null;const d=1-gbE(ki),s=1+.18*d;return gbMul(M4.T(0,2.2*d,0),gbS(s,1+.08*d,s));}
    case "rope":{if(k<=0)return null;const e=gbE(k),s=1+.28*(1-e);return gbMul(M4.T(0,.25*(1-e),0),gbS(s,1,s));}}
  return null;}
const gbParts=()=>(G.W&&G.W.gerParts)||[];
/* тэмдэглэсэн газар: гадас, олс, туг (анхны гурван гэрийн байр) */
function gbMarkGeo(k){const g=new Geo(260+k),[x,z]=W3GSPOTS[k],y=k===W3GSPOT?0:w3H(x,z),C=W3C,Rp=hex("#D9C49A"),Fl=hex("#E8742A");
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2,px=x+Math.sin(a)*3.5,pz=z+Math.cos(a)*3.5;g.at([px,(k===W3GSPOT?0:w3H(px,pz))-.05,pz],{},q=>q.cyl(.028,.035,.5,6,C.wood2,true,.06));
    const b=(i+1)/12*Math.PI*2,qx=x+Math.sin(b)*3.5,qz=z+Math.cos(b)*3.5,mx=(px+qx)/2,mz=(pz+qz)/2,L=Math.hypot(qx-px,qz-pz);
    g.at([mx,(k===W3GSPOT?0:w3H(mx,mz))+.36,mz],{ry:Math.atan2(qx-px,qz-pz)},q=>q.box(.012,.012,L,Rp));}
  g.at([x,y,z],{},q=>{q.cyl(.03,.035,1.6,6,C.wood2,true,.05);q.at([.21,1.42,0],{},w=>w.box(.4,.26,.012,Fl));});return g;}
function gbRingGeo(k){const g=new Geo(270+k),[x,z]=W3GSPOTS[k],y=(k===W3GSPOT?0:w3H(x,z))+.03;g.at([x,y,z],{},q=>q.cyl(3.5,3.5,.02,48,hex("#FFD27A"),false,0));return g;}
function gbNear(x,z){if(GB.built)return -1;let best=-1,bd=4.2;W3GSPOTS.forEach(([sx,sz],k)=>{if(GB.stage>0&&k!==GB.spot)return;const d=Math.hypot(x-sx,z-sz);if(d<bd){bd=d;best=k;}});return best;}
function gbSave(){w3Save({ger:{built:GB.built,spot:GB.spot,stage:GB.stage,go:false}});}
function gbChoose(k){if(GB.built||G.build)return;
  if(k!==W3GSPOT){w3Save({ger:{built:false,spot:k,stage:0,go:true}});const L=$("#load");if(L){L.hidden=false;L.classList.remove("out");const t=$("#loadTxt");if(t)t.textContent="Гэрийн газраа бэлдэж байна…";const b=$("#startBtn");if(b)b.hidden=true;}
    setTimeout(()=>location.reload(),300);return;}
  gbStart();}
function gbStart(){if(G.build||GB.built)return;if(G.ride)dismount(true);GB.spot=W3GSPOT;G.build={si:Math.min(GB.stage,10),k:0,kt:0,hold:false,p:null,done:0,cam:null,sec:0};
  G.tw=[];G.look=null;const h=$("#hint");if(h)h.hidden=true;cardOpen("#gbuild",null);gbShow();gbCamGo(true);}
function gbCamGo(first){const B=G.build;if(!B)return;const S=GBS[GBK[B.si]],c=G.cam,land=innerWidth>innerHeight*1.15,
    f=S.inGer?1:land?1:1.5,o=S.cam[0],L=S.cam[1],p=[L[0]+(o[0]-L[0])*f+GX,L[1]+(o[1]-L[1])*f,L[2]+(o[2]-L[2])*f+GZ],l=[L[0]+GX,L[1],L[2]+GZ];
  /* карт баруун талд (хэвтээ) бол гэрийг зүүн талд, доор (босоо) бол дээд хэсэгт харагдуулна */
  {const dx=l[0]-p[0],dz=l[2]-p[2],d=Math.hypot(dx,dz)||1;if(land){const k=d*Math.tan(.38);l[0]-=dz/d*k;l[2]+=dx/d*k;}else l[1]-=Math.hypot(d,l[1]-p[1])*Math.tan(.2);}
  const t=yp(p,l);
  B.cam={fp:c.pos.slice(),fy:c.yaw,fpi:c.pitch,tp:p,ty:t.yaw,tpi:t.pitch,t:0,dur:first?1.6:1.2};}
function gbShow(){const B=G.build;if(!B)return;const id=GBK[B.si],S=GBS[id];
  $("#gbStepN").textContent=`${B.si+1}/${GBK.length}-р алхам`;$("#gbTitle").textContent=S.t;$("#gbText").textContent=S.d;$("#gbFact").textContent=S.f;
  $("#gbHow").textContent=GB_HOW[S.g]+(S.g==="taps"?` · ${S.n} удаа`:"");const pad=$("#gbPad");pad.dataset.g=S.g;pad.setAttribute("aria-label",`${S.t}: ${GB_HOW[S.g]}`);
  $("#gbTaps").innerHTML=S.g==="taps"?Array.from({length:S.n},(_,i)=>`<i${i<Math.round(B.kt*S.n)?' class="on"':""}></i>`).join(""):"";gbBar();}
function gbBar(){const B=G.build;if(!B)return;$("#gbBar").style.transform=`scaleX(${gbC(B.k)})`;const S=GBS[GBK[B.si]];
  if(S.g==="taps")$$("#gbTaps i").forEach((e,i)=>e.classList.toggle("on",i<Math.round(B.kt*S.n)));}
function gbAng(e){const r=$("#gbPad").getBoundingClientRect();return Math.atan2(e.clientY-(r.top+r.height/2),e.clientX-(r.left+r.width/2));}
function gbBind(){const pad=$("#gbPad");if(!pad||pad.dataset.b)return;pad.dataset.b=1;
  pad.addEventListener("pointerdown",e=>{const B=G.build;if(!B||B.done)return;e.preventDefault();try{pad.setPointerCapture(e.pointerId);}catch(_){}const S=GBS[GBK[B.si]];
    B.p={x:e.clientX,y:e.clientY,a:gbAng(e)};if(S.g==="hold")B.hold=true;
    if(S.g==="taps"){B.kt=Math.min(1,B.kt+1/S.n+1e-4);gbBar();pad.classList.remove("tap");void pad.offsetWidth;pad.classList.add("tap");if(SND.burst&&SND.ctx)SND.burst(SND.ctx.currentTime,.18,{f:620,q:3,v:.035,type:"bandpass"});}});
  pad.addEventListener("pointermove",e=>{const B=G.build;if(!B||!B.p||B.done)return;const S=GBS[GBK[B.si]],H=pad.clientHeight||150;
    if(S.g==="up")B.kt=gbC(B.kt+(B.p.y-e.clientY)/(H*1.15));else if(S.g==="down")B.kt=gbC(B.kt+(e.clientY-B.p.y)/(H*1.15));
    else if(S.g==="circle"){const a=gbAng(e);let d=a-B.p.a;d=Math.atan2(Math.sin(d),Math.cos(d));B.kt=gbC(B.kt+Math.abs(d)/(Math.PI*2*1.05));B.p.a=a;}
    B.p.x=e.clientX;B.p.y=e.clientY;});
  const up=()=>{const B=G.build;if(!B)return;B.p=null;B.hold=false;};pad.addEventListener("pointerup",up);pad.addEventListener("pointercancel",up);
  pad.addEventListener("keydown",e=>{if((e.key===" "||e.key==="Enter")&&G.build){e.preventDefault();G.build.hold=true;}});pad.addEventListener("keyup",()=>{if(G.build)G.build.hold=false;});
  $("[data-gbclose]").onclick=gbClose;}
function gbClose(){if(!G.build)return;const fin=G.build.si>=GBK.length;G.build=null;cardClose("#gbuild");G.inGer=false;
  if(!GB.built)hint("Дараа нь үргэлжлүүлэн барина. Гэрийн газар дээр очоод «Гэрээ үргэлжлүүлэн барих» товчийг дараарай.",6000);}
function gbFinish(){GB.built=true;GB.stage=GBK.length;gbSave();GERX.wall=true;G.build=null;cardClose("#gbuild");
  const c=G.cam,p=[GX+.7,0,GZ+6.4];c.pos=[p[0],w3H(p[0],p[2])+G.eye,p[2]];const t=yp(c.pos,[GX,1.5,GZ]);c.yaw=t.yaw;c.pitch=t.pitch;G.inGer=false;G.lastP=null;G.vel=[0,0];
  showPlace("Гэр бэлэн боллоо!");if(SND.chime)SND.chime();hint("Гэр бэлэн боллоо! Хаалгаар нь ороод, гал түлж, айраг, ааруулаа хийгээрэй.",7000);}
/* кадр бүр: хэсгүүдийг харуулж/хөдөлгөж, камерыг удирдана */
function gbStep(dt,t,c){const P=G.P.m,L=gbParts();GERX.wall=GB.built;
  if(GB.built){if(G.gbW!==G.W&&L.length){G.gbW=G.W;for(const o of L){o.gbOn=true;if(o.gst!=="broth"){o.on=true;o.m=o.m0;}}}}
  else{G.gbW=null;const B=G.build,cur=B?B.si:-1;
    if(B){const S=GBS[GBK[B.si]];if(B.hold&&!B.done)B.kt=gbC(B.kt+dt/(S.g==="hold"?S.dur:2.2));
      const pk=B.k;B.k+=(B.kt-B.k)*Math.min(1,dt*(S.g==="taps"?4.5:9));if(B.kt>=1&&B.k>.995)B.k=1;gbBar();
      if((GBK[B.si]==="khana"||GBK[B.si]==="felt"||GBK[B.si]==="cover")&&SND.burst&&SND.ctx){const n0=Math.floor(pk*9.5/1.2),n1=Math.floor(B.k*9.5/1.2);if(n1>n0)SND.burst(SND.ctx.currentTime,.22,{f:GBK[B.si]==="khana"?700:420,q:4,v:.03,type:"bandpass"});}
      if(B.k>=1&&!B.done){B.done=1;if(SND.chime)SND.chime();$("#gbHow").textContent="Сайн байна!";
        setTimeout(()=>{if(G.build!==B)return;GB.stage=B.si+1;gbSave();if(GB.stage>=GBK.length){gbFinish();return;}
          B.si++;B.k=B.kt=0;B.done=0;B.hold=false;B.p=null;G.inGer=!!GBS[GBK[B.si]].inGer;gbShow();gbCamGo(false);},850);}
      /* камер */
      const C=B.cam;if(C){C.t=Math.min(C.dur,C.t+dt);const u=C.t/C.dur,e=u*u*(3-2*u);let dy=C.ty-C.fy;dy=Math.atan2(Math.sin(dy),Math.cos(dy));
        c.pos=[C.fp[0]+(C.tp[0]-C.fp[0])*e,C.fp[1]+(C.tp[1]-C.fp[1])*e,C.fp[2]+(C.tp[2]-C.fp[2])*e];c.yaw=C.fy+dy*e;c.pitch=C.fpi+(C.tpi-C.fpi)*e;G.tw=[];G.look=null;G.lastP=null;}
      G.inGer=!!GBS[GBK[B.si]].inGer&&(!B.cam||B.cam.t>B.cam.dur*.5);}
    for(const o of L){const si=gbStage(o.gst);if(si<GB.stage){o.on=o.gbOn=true;o.m=o.m0;continue;}
      if(si===cur){const A=gbAnim(o.gst,o.gsec,G.build.k);o.on=o.gbOn=!!A;if(A)o.m=M4.mul(o.m0,A);continue;}o.on=o.gbOn=false;}
    /* гэр бэлэн болоогүй: доторх зүйлс, утаа, гал харагдахгүй */
    ["cups","cupsA","gift","potL","potC","glow","fire","flame","flame2","aarP","wbowl","wwater","arag","aragFill","vases","spl","splSpot"].forEach(k=>{if(P[k])P[k].on=false;});
    (P.puffs||[]).forEach(p=>p.on=false);(P.fpuffs||[]).forEach(p=>p.on=false);if(P.shMat&&SHG.mat&&SHG.mat[3])P.shMat.on=false;
    const di=GBK.indexOf("door");if(P.door){P.door.on=GB.stage>di||cur===di;if(cur===di&&G.build){const A=gbAnim("door",-1,G.build.k);P.door.m=gbMul(M4.T(GX,0,GZ),A,M4.T(DOOR.x-GX,DOOR.y,DOOR.z-GZ));}
      else if(P.door.on)P.door.m=M4.trs([DOOR.x,DOOR.y,DOOR.z],{});}}
  /* газрын тэмдэг */
  (P.gbMark||[]).forEach((m,k)=>{const on=!GB.built&&!G.build&&(GB.stage===0||k===GB.spot);m.on=on;const r=P.gbRing[k];r.on=on;if(on)r.alpha=.22+.16*Math.sin(t*2.4+k);});}
function gbReset(){if(G.build)gbClose();if(!GB.built&&GB.stage===0)return;GB.built=false;GB.stage=0;gbSave();GERX.wall=false;
  if(G.inGer){const c=G.cam,p=[GX+.5,GZ+6.5];c.pos=[p[0],w3H(p[0],p[1])+G.eye,p[1]];G.inGer=false;G.lastP=null;}
  setOpen(false);hint("Гэрээ буулгалаа. Тэмдэглэсэн гурван газрын аль нэг дээр очоод шинээр бариарай.",6500);}
function gbBoot(){gbBind();const b=$("#gbReset");if(b)b.onclick=()=>{if(b.dataset.c){delete b.dataset.c;b.textContent="Гэрээ шинээр барих";$("#gbNote").textContent="";gbReset();return;}
    b.dataset.c=1;b.textContent="Тийм, шинээр барих";$("#gbNote").textContent="Гэр буулгагдаж, гурван газрын аль нэгийг сонгоод дахин барина. Гэр доторх айраг, ааруул, авдрын зүйлс хэвээр үлдэнэ.";
    setTimeout(()=>{if(b.dataset.c){delete b.dataset.c;b.textContent="Гэрээ шинээр барих";$("#gbNote").textContent="";}},7000);};
  if(GB.built)return;
  if(GB.go){GB.go=false;gbSave();setTimeout(()=>{if(!GB.built&&!G.build&&!busy())gbStart();},1600);return;}
  setTimeout(()=>{if(!GB.built&&!G.build)hint(GB.stage>0?"Гэр дуусаагүй байна. Гэрийн газар дээр очоод «Гэрээ үргэлжлүүлэн барих» товчийг дараарай.":"Эхлээд гэрээ барина. Тугтай гурван газрын аль нэг дээр очоод «Энд гэр барих» товчийг дараарай.",8500);},2500);}

window.__nutag.api={GB,GBK,gbStart,gbChoose,gbReset,gbParts,gbStage,gbNear,gbB:()=>G.build,pause:on=>{if(on){G.on=false;cancelAnimationFrame(G.raf);}else if(!G.on){G.on=true;G.lt=0;G.raf=requestAnimationFrame(frame);}},
  drawOnce:()=>{w3Draw(G.W,G.cam,G.env,(performance.now()-G.t0)/1000);PERF.frame();},
  sim:(sec,step)=>{step=step||1/30;for(let i=0;i<sec/step;i++){G.t0-=step*1000;update(step,(performance.now()-G.t0)/1000,performance.now());}},
  doAct,mount,dismount,restOpen,restClose,exStart,exit,start,collide,pickAct,PEN,FIRE,GATE_IN,GATE_OUT,wishOpen,wishClose,tieKhadag,
  milkOpen,milkTap,milkClose,churnOpen,churnTap,churnClose,air:()=>({AIR,MILK,played:G.played,zel:zelOpen(),foals:G.foals?G.foals.filter(f=>f.h.on).length:0}),
  flShoot:(i,vx,vy)=>flShootI(i,vx,vy),racePick,race:()=>G.shg&&G.shg.race,canSleep,sleepInfo,SHOOT,TARGET,BOW_AT,SURS,SHG,archOpen,archHold,archClose,archFix,arch:()=>G.arch,arrow:()=>G.arrow,shOpen,shClose,shMode,exThrow,raceThrow,matPut,matTake,FL,flDone,shRoll,wishFx:()=>G.wishFx,
  boilOpen,boilHold,boilClose,bagOpen,bagHold,bagTap,bagClose,bag:()=>G.bag,dur,DOOR,cutOpen,cutPick,cutTap,cutClose,RACK,PRESS,
  PRESS_T,SUN_T,GIFT_AT,GATE,TROUGH,EVE,penAll,releaseFlock,flockPhase,
  INV,STOVE,ARGAL,WBOWL,CHESTS,ARAG_AT,holdOpen,holdPress,holdClose,chestOpen,chestMove,chestClose,sleepStart,sleepWake,argalPick,stoveLight,itemsShow,mapSvg,
  holdFinish:()=>{const H=G.hold;if(H&&H.k<1){H.k=1;H.on=false;H.done();}holdClose();},argalDrop:()=>argalDrop(G.tsec),basketOpen,basketClose,bkTab,taste,giveSend,giftOpenCard,giftKeep,giftThank,giftClose,GV,basket:()=>({...AARU.basket}),
  aaru:()=>({...JSON.parse(JSON.stringify(AARU)),sun:sunUp(),boil:G.boil?+G.boil.k.toFixed(3):null,press:!!(G.P.m.press&&G.P.m.press.on),rackOn:!!(G.P.m.aarR&&G.P.m.aarR.on),rackTris:G.P.m.aarR?G.P.m.aarR.n/3:0}),
  aaruSet:o=>{if(o.r)Object.assign(AARU.r,o.r);if(o.p)Object.assign(AARU.p,o.p);if(o.r||o.p)aarRebuild();},
  airSet:o=>{if(o.AIR)AIR=Object.assign(AIR,o.AIR);if("MILK" in o){MILK=o.MILK;carryShow();}if("played" in o)G.played=o.played;},KH,ZEL_A,ZEL_B,PAIL,FOALS,
  teleport:(x,z,yaw)=>{const c=G.cam;c.pos=[x,w3H(x,z)+G.eye,z];if(yaw!=null){c.yaw=yaw;G.look=null;G.tw=[];}G.inGer=GB.built&&Math.hypot(x-GX,z-GZ)<(GERX.on?3.3:2.2);if(G.inGer)c.pos[1]=1.3;G.lastP=null;G.vel=[0,0];}};
})();
