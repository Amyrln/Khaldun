/* Жалайр — нэг том газрын зураг.
   Миний нутаг (гэр 0,0) ба Хүслийн мод нэг хөндийд, хооронд нь жим. Энд:
   • газрын өндөр (хоёр газар, жим, толгод, уулс), тоглогч явж болох хүрээ;
   • газрын mesh: хоёр газар ба жимийн орчим нягт, алс уулс сийрэг;
   • өвс тоглогчийг дагана: хөдлөхөд шинэ өвсийг хэдэн кадрт хувааж бэлдээд солино;
   • Хүслийн мод: холоос энгийн дүрс, ойртоход бургасны бүтэн загвар ачаална, холдоход GPU-аас суллана.
   world.js-ийн дараа, nutag.js-ийн өмнө ачаална. */
"use strict";
const W3MAP=(()=>{
  const A=[0,0],B=[-40,-125],L=Math.hypot(B[0]-A[0],B[1]-A[1]),U=[(B[0]-A[0])/L,(B[1]-A[1])/L],N=[-U[1],U[0]],WALK=46;
  /* хөндийн тэнхлэгийн координат: s — гэрээс Хүслийн мод руу, t — хажуу тийш */
  const st=(x,z)=>{const dx=x-A[0],dz=z-A[1];return [dx*U[0]+dz*U[1],dx*N[0]+dz*N[1]];};
  const xz=(s,t)=>[A[0]+U[0]*s+N[0]*t,A[1]+U[1]*s+N[1]*t];
  /* жим: гэрийн баруун талаас эхэлж, ганц хайлаас ба алсын хайлаасын хооронд зөөлөн муруйж, модны өмнө ирнэ */
  const TS0=3.5,TS1=L-4.2,T0=-5.6;
  const trailT=s=>{const k=Math.max(0,Math.min(1,(s-TS0)/(TS1-TS0)));return T0*(1-k)+5.5*Math.sin(2*Math.PI*k)-2*Math.sin(Math.PI*k);};
  const trailD=(s,t)=>s<TS0?Math.hypot(s-TS0,t-T0):s>TS1?Math.hypot(s-TS1,t):Math.abs(t-trailT(s));
  const trailPt=k=>{const s=TS0+(TS1-TS0)*k;return xz(s,trailT(s));};
  /* Салхит толгод: жимийн даваанаас баруун тийш, салаа жимээр 25 м өгсөхөд оройд нь хийморь, суух чулуу.
     Тэндээс нар жаргах зүг (баруун хойд) уулс, тал харагдана */
  const HILL=xz(70,-30),HS=13,SD=(()=>{const l=Math.hypot(.86,.5);return [-.86/l,-.5/l];})(),HSEAT=[HILL[0]+SD[0]*1.6,HILL[1]+SD[1]*1.6];
  /* суугаад харах зүг: нар жаргах зүгээс 35° хойш (нар харааны зүүн захад, уулс хажуугаас гэрэлтэнэ) */
  const HVIEW=(()=>{const a=Math.atan2(SD[1],SD[0])+35*Math.PI/180;return [Math.cos(a),Math.sin(a)];})();
  const BR=(()=>{const a=xz(62,trailT(62)),c=xz(62,-17),b=[HILL[0]-SD[0]*1.4+3.2*SD[1],HILL[1]-SD[1]*1.4-3.2*SD[0]],o=[];
    for(let i=0;i<=24;i++){const u=i/24,v=1-u;o.push([v*v*a[0]+2*u*v*c[0]+u*u*b[0],v*v*a[1]+2*u*v*c[1]+u*u*b[1]]);}return o;})();
  const BRB=[Math.min(...BR.map(p=>p[0]))-3,Math.max(...BR.map(p=>p[0]))+3,Math.min(...BR.map(p=>p[1]))-3,Math.max(...BR.map(p=>p[1]))+3];
  function braD(x,z){if(x<BRB[0]||x>BRB[1]||z<BRB[2]||z>BRB[3])return 99;let d=99;
    for(let i=0;i<BR.length-1;i++){const a=BR[i],b=BR[i+1],ex=b[0]-a[0],ez=b[1]-a[1],l2=ex*ex+ez*ez,u=Math.max(0,Math.min(1,((x-a[0])*ex+(z-a[1])*ez)/l2));d=Math.min(d,Math.hypot(x-a[0]-ex*u,z-a[1]-ez*u));}return d;}
  const PERP=[-SD[1],SD[0]],POLE=[HILL[0]-SD[0]*.6+PERP[0]*2.2,HILL[1]-SD[1]*.6+PERP[1]*2.2],STAKE=[HILL[0]+PERP[0]*7.5,HILL[1]+PERP[1]*7.5],ROCK=[HSEAT[0]-SD[0]*.95,HSEAT[1]-SD[1]*.95];
  const dsp=(x,z)=>{const p=st(x,z),s=p[0];return Math.hypot(p[1],s<0?s:s>L?s-L:0);};

  function h(x,z){const p=st(x,z),s=p[0],t=p[1],sc=s<0?s:s>L?s-L:0,d=Math.hypot(t,sc),
      rh=Math.hypot(x-A[0],z-A[1]),rw=Math.hypot(x-B[0],z-B[1]),rb=Math.min(rh,rw*1.15),tr=trailD(s,t);
    const swell=.32*W3F(x*1.3,z*1.3)*ss3(5,14,rb),hills=ss3(22,70,rb)*(3.2+2.6*W3F(x*.55+7,z*.55-3))*(1-.45*ss3(18,3,tr));
    const rid=1-Math.abs(Math.sin(x*.018+Math.sin(z*.011)*2)*Math.cos(z*.016+Math.sin(x*.013)*1.7));
    const ca=d>1e-3?Math.abs(sc)/d:0,ew=1-.55*Math.pow(ca,6),ex=x-W3TREE[0],ez=z-W3TREE[1];
    const hx=x-HILL[0],hz=z-HILL[1];
    let y=swell+hills+4.2*Math.exp(-(ex*ex+ez*ez)/190)+3*Math.exp(-rw*rw/320)+8.5*Math.exp(-(hx*hx+hz*hz)/(2*HS*HS))+ss3(85,150,d)*(6+17*rid*rid+4*W3F(x*.2,z*.2))*ew;
    const pe=Math.hypot((x-W3POND[0])/W3POND[2],(z-W3POND[1])/W3POND[3]);if(pe<1.9)y=y*(1-ss3(1.85,1.2,pe))-1.1*ss3(1.15,.5,pe);
    {const g=W3GERS[0],rg=Math.hypot(x-g[0],z-g[1]);if(rg<6&&(g[0]||g[1]))y*=1-ss3(6,3.9,rg);}   /* гэр барьсан газрыг тэгшилнэ */
    return y;}

  /* тоглогч, морь хөндийгөөс гарахгүй */
  function clamp(x,z){const p=st(x,z),s=p[0],t=p[1],sc=s<0?s:s>L?s-L:0,d=Math.hypot(t,sc);if(d<=WALK)return [x,z];
    const k=WALK/d;return xz(Math.max(0,Math.min(L,s))+sc*k,t*k);}
  /* өвс ургахгүй газар: жим, модны эргэн тойрон гишгэгдсэн цагираг, их бие, овоо */
  const OVOO=xz(79.5,trailT(79.5)-5.5);
  function bare(x,z){const p=st(x,z);if(p[0]<-60||p[0]>L+40)return 0;const tr=trailD(p[0],p[1]),rw=Math.hypot(x-B[0],z-B[1]);
    if(rw<1.5||Math.hypot(x-OVOO[0],z-OVOO[1])<1.7||Math.hypot(x-POLE[0],z-POLE[1])<.7||Math.hypot(x-ROCK[0],z-ROCK[1])<.8)return 1;
    return Math.max(.85*ss3(1.25,.45,tr)*ss3(TS0-3,TS0+2,p[0]),.7*ss3(1.5,.5,Math.abs(rw-3)),.8*ss3(1.1,.4,braD(x,z)));}
  function colT(col,x,z,y,n){const c=col(x,z,y,n),p=st(x,z),tr=trailD(p[0],p[1]),rw=Math.hypot(x-B[0],z-B[1]),
      w=Math.max(.72*ss3(1.3,.35,tr)*ss3(TS0-3,TS0+2,p[0]),.5*ss3(1.6,.4,Math.abs(rw-3)),.6*ss3(2.2,1.2,Math.hypot(x-OVOO[0],z-OVOO[1])),.62*ss3(1.15,.35,braD(x,z)),.4*ss3(2.4,1.2,Math.hypot(x-HSEAT[0],z-HSEAT[1])));
    return w>0?V3.lerp(c,SOIL,w):c;}
  const SOIL=V3.lerp(W3C.soil,W3C.dry,.3);

  /* газрын mesh: тэнхлэгийг тойрсон «цэнгэлдэх» хэлбэрийн цагиргууд. Тэнхлэгийн дагуу хоёр газрын ойролцоо нягт,
     тэнхлэгээс холдох тусам цагираг хооронд сийрэгжиж, 60 м, 160 м-ээс цэгийн тоо хоёр дахин цөөрнө */
  function terrain(T,col,Hn){const q=W3Q.terrain||1,Ns=2*Math.round(90*q),Nc=2*Math.round(48*q),NR=2*(Ns+Nc);
    const g=s=>1.15-.75*ss3(30,8,s)-.65*ss3(L-26,L-6,s),M=1200,cum=[0];for(let i=1;i<=M;i++)cum.push(cum[i-1]+L/M/g((i-.5)/M*L));
    const S=[];for(let k=0,i=0;k<=Ns;k++){const want=cum[M]*k/Ns;while(i<M-1&&cum[i+1]<want)i++;const f=(want-cum[i])/((cum[i+1]-cum[i])||1);S.push(Math.min(L,(i+f)/M*L));}
    const P=[];for(let k=0;k<Ns;k++)P.push([S[k],Math.PI/2]);for(let j=0;j<Nc;j++)P.push([L,Math.PI/2-Math.PI*j/Nc]);
    for(let k=0;k<Ns;k++)P.push([S[Ns-k],-Math.PI/2]);for(let j=0;j<Nc;j++)P.push([0,-Math.PI/2-Math.PI*j/Nc]);
    const ds=[0];for(let d=.35;d<320;d+=Math.max(.35,d*(d<60?.055:.085)))ds.push(d);
    const lv=d=>d>160?4:d>60?2:1;
    const ring=d=>{const sp=lv(d),out=[];for(let j=0;j<NR;j+=sp){const s=P[j][0],a=P[j][1],ca=Math.cos(a),sa=Math.sin(a),
        x=A[0]+U[0]*s+(U[0]*ca+N[0]*sa)*d,z=A[1]+U[1]*s+(U[1]*ca+N[1]*sa)*d,y=h(x,z),n=Hn(x,z);out.push([[x,y,z],n,colT(col,x,z,y,n)]);}return out;};
    let prev=ring(0);
    for(let i=1;i<ds.length;i++){const cur=ring(ds[i]),a=prev.length,b=cur.length;
      if(a===b){for(let j=0;j<a;j++){const j1=(j+1)%a,p=prev[j],qq=prev[j1],r=cur[j1],o=cur[j];for(const v of [p,qq,r,p,r,o])T.vx(v[0],v[1],v[2]);}}
      else{for(let m=0;m<b;m++){const i0=2*m,i1=(2*m+1)%a,i2=(2*m+2)%a,m1=(m+1)%b;
        for(const v of [prev[i0],prev[i1],cur[m],prev[i1],prev[i2],cur[m1],prev[i1],cur[m1],cur[m]])T.vx(v[0],v[1],v[2]);}}
      prev=cur;}
    W3MAP.terrainTris=T.v.length/30;}

  /* Хүслийн модны орчны жижиг зүйлс: холоос харагдах энгийн мод (бургас ачаалагдаагүй үед), овоо, чулуу, цэцэг */
  function decor(){const C=W3C,X=B[0],Z=B[1],D={};
    const TR=new Geo(43);w3Tree(TR,X,Z,1.25,11);D.tree=TR;
    const g=new Geo(44);
    {const ox=OVOO[0],oz=OVOO[1],oy=h(ox,oz);g.at([ox,oy,oz],{},q=>{for(let i=0;i<30;i++){const a=g.r()*6.28,d=g.r()*1.4,y=g.r()*1.3*(1-d/1.7);
      q.at([Math.cos(a)*d,y,Math.sin(a)*d],{s:[.36,.26,.31]},w=>w.sph(1,8,g.r()<.5?C.rock:C.rock2));}
      q.at([0,0,0],{},w=>w.cyl(.05,.03,3.3,6,C.wood));q.at([0,2.9,0],{},w=>w.box(.64,.05,.05,[.25,.5,.8]));
      w3Ribbon(q,[.3,2.88,0],.7,.2,[.25,.5,.8],1.1);w3Ribbon(q,[-.28,2.86,.02],.6,.4,[.94,.92,.86],2.3);});}
    for(let i=0;i<22;i++){const k=g.r(),s=TS0+12+(TS1-TS0-20)*k,side=g.r()<.5?-1:1,t=trailT(s)+side*(2+g.r()*7),p=xz(s,t),sz=.18+g.r()*.38;
      g.at([p[0],h(p[0],p[1])-.06,p[1]],{ry:g.r()*3,s:[sz*1.4,sz*.6,sz]},q=>q.sph(1,9,g.r()<.5?C.rock:C.rock2,.08));}
    for(let i=0;i<7;i++){const a=g.r()*6.28,d=6+g.r()*9,x=X+Math.cos(a)*d,z=Z+Math.sin(a)*d,sz=.25+g.r()*.4;
      g.at([x,h(x,z)-.06,z],{ry:g.r()*3,s:[sz*1.4,sz*.6,sz]},q=>q.sph(1,9,g.r()<.5?C.rock:C.rock2,.08));}
    /* Салхит толгод: хийморь (шон, олс, таван өнгийн далбаа), суух хавтгай чулуу, хэдэн чулуу */
    {const py=h(POLE[0],POLE[1]),top=[POLE[0],py+3.3,POLE[1]],sy=h(STAKE[0],STAKE[1])+.35,FC=[[.18,.42,.78],[.94,.93,.88],[.78,.2,.17],[.2,.55,.3],[.95,.78,.22]];
      g.at([POLE[0],py-.1,POLE[1]],{},q=>{q.cyl(.06,.045,3.45,7,C.wood,true,.05);q.at([0,3.42,0],{},w=>w.sph(.08,6,[.85,.7,.3],0));});
      for(let i=0;i<10;i++){const a=i/10*6.283,d=.35+g.r()*.3;g.at([POLE[0]+Math.cos(a)*d,py+.05,POLE[1]+Math.sin(a)*d],{s:[.2,.14,.17]},q=>q.sph(1,7,g.r()<.5?C.rock:C.rock2));}
      const L=Math.hypot(STAKE[0]-top[0],STAKE[1]-top[2]),N=16,up=[0,1,0];
      for(let i=0;i<=N;i++){const u=i/N,x=top[0]+(STAKE[0]-top[0])*u,z=top[2]+(STAKE[1]-top[2])*u,y=top[1]+(sy-top[1])*u-Math.sin(u*Math.PI)*.35;
        if(i<N){const u2=(i+1)/N,x2=top[0]+(STAKE[0]-top[0])*u2,z2=top[2]+(STAKE[1]-top[2])*u2,y2=top[1]+(sy-top[1])*u2-Math.sin(u2*Math.PI)*.35,rc=[.62,.55,.42];
          g.vx([x,y,z],up,rc,.05);g.vx([x2,y2,z2],up,rc,.05);g.vx([x,y-.025,z],up,rc,.05);}
        if(i>0&&i<N){const col=FC[(i-1)%5],dx=(STAKE[0]-top[0])/L,dz=(STAKE[1]-top[2])/L,hw=.13,fh=.3,n=[-dz,0,dx],a0=[x-dx*hw,y,z-dz*hw],a1=[x+dx*hw,y,z+dz*hw],b0=[a0[0],y-fh,a0[2]],b1=[a1[0],y-fh,a1[2]];
          g.vx(a0,n,col,.15);g.vx(a1,n,col,.15);g.vx(b1,n,V3.mul(col,.9),1.6);g.vx(a0,n,col,.15);g.vx(b1,n,V3.mul(col,.9),1.6);g.vx(b0,n,V3.mul(col,.9),1.6);}}
      g.at([STAKE[0],h(STAKE[0],STAKE[1])-.05,STAKE[1]],{},q=>q.cyl(.035,.03,.45,5,C.wood2,true,.04));
      g.at([ROCK[0],h(ROCK[0],ROCK[1])-.12,ROCK[1]],{ry:Math.atan2(SD[0],SD[1]),s:[.75,.32,.55]},q=>q.sph(1,10,C.rock2,.06));
      for(let i=0;i<9;i++){const a=g.r()*6.28,d=3+g.r()*9,x=HILL[0]+Math.cos(a)*d,z=HILL[1]+Math.sin(a)*d,sz=.2+g.r()*.45;
        g.at([x,h(x,z)-.08,z],{ry:g.r()*3,s:[sz*1.4,sz*.6,sz]},q=>q.sph(1,9,g.r()<.5?C.rock:C.rock2,.08));}}
    D.props=g;
    /* элээ: далавчаа дэлгээд тойрог эргэж нисдэг шувуу (урагшаа +x) */
    {const b=new Geo(46),up=[0,1,0],cb=hex("#3A2D24"),cw=hex("#4A3A2E"),ct=hex("#2E241D"),T=(p,q,r,c)=>{b.vx(p,up,c,0);b.vx(q,up,c,0);b.vx(r,up,c,0);};
      for(const sg of [1,-1]){T([.16,0,0],[-.12,0,0],[-.02,.05,.42*sg],cw);T([.06,0,.12*sg],[-.12,0,0],[-.02,.05,.42*sg],cw);
        T([-.02,.05,.42*sg],[-.16,.03,.4*sg],[-.08,.12,.86*sg],cw);T([.04,.04,.4*sg],[-.02,.05,.42*sg],[-.08,.12,.86*sg],ct);}
      T([.34,0,0],[0,.02,.07],[0,.02,-.07],cb);T([0,.02,.07],[-.3,0,0],[0,.02,-.07],cb);T([-.26,0,0],[-.5,0,.14],[-.5,0,-.14],ct);D.bird=b;}
    /* цэцэг: модны эргэн тойрон ба жимийн хажуугаар (гэрийн орчны цэцэгтэй ижил хэлбэр) */
    const FL=new Geo(45),FC=[hex("#F6F3EA"),hex("#F7D44A"),hex("#5E80DA"),hex("#F4A9C0"),hex("#9C86E0"),hex("#E0502F")],stem=hex("#3E6B24"),up=[0,1,0];
    const flower=(x,z,s,ci)=>{if(FL.r()<w3Bare(x,z))return;const y=h(x,z)-.01,top=[x+(FL.r()-.5)*.07*s,y+(.2+FL.r()*.24)*s,z+(FL.r()-.5)*.07*s],sw=.006*s,th=FL.r()*Math.PI;
      FL.vx([x-Math.cos(th)*sw,y,z-Math.sin(th)*sw],up,V3.mul(stem,.9),0);FL.vx([x+Math.cos(th)*sw,y,z+Math.sin(th)*sw],up,V3.mul(stem,.9),0);FL.vx(top,up,V3.mul(stem,1.25),1);
      const pr=(.03+FL.r()*.022)*s,rot=FL.r()*6.283,np=ci===2?6:5,Pt=(an,r,dy)=>[top[0]+Math.cos(an)*r,top[1]+dy,top[2]+Math.sin(an)*r];
      for(let k=0;k<np;k++){const a=rot+k/np*6.283,c=FL.jc(FC[ci],.1),cm=V3.mul(c,.8);
        FL.vx(top,up,cm,1);FL.vx(Pt(a,pr*1.15,pr*.3),up,c,1);FL.vx(Pt(a-.42,pr*.85,pr*.22),up,c,1);FL.vx(top,up,cm,1);FL.vx(Pt(a+.42,pr*.85,pr*.22),up,c,1);FL.vx(Pt(a,pr*1.15,pr*.3),up,c,1);}
      const cc=ci===5?hex("#2A1A14"):hex("#F2B93A"),cr=pr*.34;for(let k=0;k<3;k++){const a=k/3*6.283;FL.vx(Pt(0,0,.005),up,cc,1);FL.vx(Pt(a+2.094,cr,.005),up,cc,1);FL.vx(Pt(a,cr,.005),up,cc,1);}};
    for(let p=0;p<26;p++){const a=FL.r()*6.283,r=4+15*Math.pow(FL.r(),1.1),px=X+Math.sin(a)*r,pz=Z-Math.cos(a)*r,ci=FL.r()<.08?5:Math.floor(FL.r()*5),n=12+Math.floor(FL.r()*34),rad=.7+FL.r()*2;
      for(let i=0;i<n;i++){const b=FL.r()*6.283,d=Math.sqrt(FL.r())*rad;flower(px+Math.cos(b)*d,pz+Math.sin(b)*d,.9+FL.r()*.3,FL.r()<.85?ci:Math.floor(FL.r()*5));}}
    for(let i=0;i<260;i++){const k=FL.r(),s=TS0+8+(TS1-TS0-8)*k,t=trailT(s)+(FL.r()<.5?-1:1)*(1.1+FL.r()*3.5),p=xz(s,t);flower(p[0],p[1],.95,Math.floor(FL.r()*5));}
    D.flowers=FL;return D;}

  const PLACES=[{id:"home",name:"Миний нутаг",x:A[0],z:A[1],r:34},{id:"wish",name:"Хүслийн мод",x:B[0],z:B[1],r:26},{id:"hills",name:"Салхит толгод",x:HILL[0],z:HILL[1],r:15}];
  return {A,B,L,U,N,WALK,h,clamp,bare,dsp,terrain,decor,trailPt,HILL,HSEAT,SD,HVIEW,POLE,ROCK,BR,braD,trailD:(x,z)=>{const p=st(x,z);return trailD(p[0],p[1]);},st,xz,OVOO,PLACES,
    inside:(x,z)=>dsp(x,z)<=WALK+.01};
})();
/* world.js-ийн бүх код энэ өндрийн функцийг ашиглана (хуучин нь w3H0 нэрээр үлдсэн) */
function w3H(x,z){return W3MAP.h(x,z);}
W3GERS.splice(1);   /* нэг гэр хангалттай */
/* гэрийн газар: анхны гурван гэрийн байрын аль нэг (тоглогч сонгоно; солиход тоглоом дахин ачаална) */
const W3GSPOTS=[[0,0],[-8.5,-5],[-15,1.5]];
{let k=0;try{const S=JSON.parse(localStorage.getItem("jalair-nutag-v1")||"{}")||{};k=S.ger&&W3GSPOTS[S.ger.spot|0]?S.ger.spot|0:0;}catch(e){}
  W3GERS[0]=[W3GSPOTS[k][0],W3GSPOTS[k][1],1];self.W3GSPOT=k;}

/* ---------- өвс тоглогчийг дагана ----------
   Өвсний өгөгдлийг 16 м-ийн хавтангаар (1 м тутам өндөр, налуу, өнгө) кэшлэнэ. Тоглогч 6 м (ойрын өвс), 22 м (алсын өвс) холдоход
   шинэ багцыг хэдэн кадрт хувааж бэлдээд, бэлэн болмогц хуучныг нь сольж GPU-аас устгана. */
const W3GRASS=(()=>{
  const TS=16,TILES=new Map(),NF=9,KB=64,KH=sd=>{const q=Math.sin(sd*3.3+.7)*43758.5453;return q-Math.floor(q);};let gen=0;
  const SPEC={near:{N:44000,r0:.8,r1:20,far:false,move:6,lead:.8},far:{N:42000,r0:14,r1:105,far:true,move:22,lead:2.2}};
  const S={sets:{near:null,far:null},job:null,seed:100,W:null,jobs:0,lastMs:0,genMs:0,finMs:0};
  /* хавтан: 1 м тутамд өндөр, налуу, өнгө, нүцгэн газар, богино өвс, өндөр өвс */
  function tile(ti,tj){const key=ti*100003+tj;let T=TILES.get(key);if(T){T.used=gen;return T;}
    const n=TS+1,m=n+2,H=new Float32Array(m*m),F=new Float32Array(n*n*NF),x0=ti*TS,z0=tj*TS;
    for(let b=0;b<m;b++)for(let a=0;a<m;a++)H[b*m+a]=w3H(x0+a-1,z0+b-1);
    for(let b=0;b<n;b++)for(let a=0;a<n;a++){const i=(b+1)*m+a+1,x=x0+a,z=z0+b,c=w3GrassCol(x,z),o=(b*n+a)*NF;
      F[o]=H[i];F[o+1]=H[i-1]-H[i+1];F[o+2]=H[i-m]-H[i+m];F[o+3]=c[0];F[o+4]=c[1];F[o+5]=c[2];
      F[o+6]=w3Bare(x,z);F[o+7]=w3Short(x,z);F[o+8]=Math.max(0,W3F(x*.5+4,z*.5-2)-.2);}
    T={F,n,x0,z0,used:gen};TILES.set(key,T);
    if(TILES.size>460){let k0=null,u0=Infinity;for(const [k,v] of TILES)if(v.used<u0){u0=v.used;k0=k;}TILES.delete(k0);}
    return T;}
  function sample(x,z,o){const ti=Math.floor(x/TS),tj=Math.floor(z/TS),T=tile(ti,tj),fx=x-T.x0,fz=z-T.z0,a=Math.min(TS-1,fx|0),b=Math.min(TS-1,fz|0),u=fx-a,v=fz-b,n=T.n,F=T.F,
      i00=(b*n+a)*NF,i10=i00+NF,i01=i00+n*NF,i11=i01+NF,w00=(1-u)*(1-v),w10=u*(1-v),w01=(1-u)*v,w11=u*v;
    for(let k=0;k<NF;k++)o[k]=F[i00+k]*w00+F[i10+k]*w10+F[i01+k]*w01+F[i11+k]*w11;return o;}
  function job(kind,cx,cz){const P=SPEC[kind],q=Math.max(.05,W3Q.grass||1),N=Math.round(P.N*q);S.seed++;
    return {kind,cx,cz,N,r0:P.r0,r1:P.r1,far:P.far,q,R:chRng(S.seed*7919+(P.far?78:77)),i:0,made:0,o:new Float32Array(NF),
      rec:new Float32Array(N*13),sec:new Uint8Array(N),u:new Float32Array(N),kh:new Float32Array(N),ms:0};}
  /* өвсний ширхэг: байрлал, өндөр, өргөн, хэмжээ, өнгө, налуу (world.js-ийн w3GrassData-тай ижил дүрэм) */
  function step(J,ms){const t0=performance.now(),R=J.R,TAU=Math.PI*2,o=J.o,lim=J.N*2.4,lr=Math.log(J.r1/J.r0);gen++;
    while(J.made<J.N&&J.i<lim){for(let c=0;c<64&&J.made<J.N&&J.i<lim;c++){J.i++;
        const a=R()*TAU,u=R(),r=J.far?J.r0*Math.exp(lr*u):J.r0+(J.r1-J.r0)*Math.pow(u,1.25),x=J.cx+Math.sin(a)*r,z=J.cz-Math.cos(a)*r;
        sample(x,z,o);let bare=o[6];if(bare>=.98)continue;if(bare>.02)bare=w3Bare(x,z);if(R()<bare)continue;
        const il=1/Math.hypot(o[1],2,o[2]);if(2*il<.8)continue;
        const k=Math.max(1,r/7),fade=J.far?ss3(J.r1,J.r1*.85,r):1;
        let sd=R()*100,kh=KH(sd);for(let g=0;g<60&&kh>J.q;g++){sd=R()*100;kh=KH(sd);}
        const hh=(.2+R()*.07+o[8]*.1)*o[7]*Math.pow(k,J.far?.4:.33)*fade,w=(.017+R()*.008)*Math.pow(k,.85)*(J.far?1.7:1),i=J.made,p=i*13,D=J.rec;
        D[p]=x;D[p+1]=o[0]-.02;D[p+2]=z;D[p+3]=sd;D[p+4]=hh;D[p+5]=w;D[p+6]=k;D[p+7]=R();D[p+8]=o[3];D[p+9]=o[4];D[p+10]=o[5];D[p+11]=o[1]*il;D[p+12]=o[2]*il;
        J.sec[i]=Math.min(23,Math.floor(a/TAU*24));J.u[i]=u;J.kh[i]=kh;J.made++;}
      if(performance.now()-t0>ms){J.ms+=performance.now()-t0;return false;}}
    J.ms+=performance.now()-t0;return true;}
  /* багцлах: 24 өнцөг × зайн бүс (≈420 ширхэг), бүс дотор keep-hash-аар (64 сагс) эрэмбэлнэ — бүгд шугаман хугацаатай */
  function finish(J){const t0=performance.now(),n=J.made,SEC=24,cnt=new Int32Array(SEC);for(let i=0;i<n;i++)cnt[J.sec[i]]++;
    const nb=new Int32Array(SEC),base=new Int32Array(SEC+1);for(let s=0;s<SEC;s++){nb[s]=Math.max(J.far?2:4,Math.ceil(cnt[s]/420));base[s+1]=base[s]+nb[s];}   /* дор хаяж 4 зайн бүс: камерын ард, хажуугийнхыг зурахгүй */
    const NBk=base[SEC],kc=new Int32Array(NBk*KB+1),key=new Int32Array(n);
    for(let i=0;i<n;i++){const s=J.sec[i],b=Math.min(nb[s]-1,(J.u[i]*nb[s])|0),kb=Math.min(KB-1,(J.kh[i]/J.q*KB)|0),k=(base[s]+b)*KB+kb;key[i]=k;kc[k+1]++;}
    for(let k=1;k<=NBk*KB;k++)kc[k]+=kc[k-1];
    const pos=kc.slice(0,NBk*KB),order=new Int32Array(n);for(let i=0;i<n;i++)order[pos[key[i]]++]=i;
    const d=new Float32Array(n*13),hsAll=new Float32Array(n),rng=[];
    const rec=J.rec;for(let i=0;i<n;i++){const src=order[i]*13,dst=i*13;for(let k=0;k<13;k++)d[dst+k]=rec[src+k];hsAll[i]=(key[order[i]]%KB)/KB*J.q;}
    for(let b=0;b<NBk;b++){const st=kc[b*KB],en=kc[(b+1)*KB];if(en<=st)continue;let mx=0,mz=0;for(let i=st;i<en;i++){mx+=d[i*13];mz+=d[i*13+2];}mx/=en-st;mz/=en-st;
      let rr=0;for(let i=st;i<en;i++)rr=Math.max(rr,Math.hypot(d[i*13]-mx,d[i*13+2]-mz));rng.push([st,en-st,mx,mz,rr+.6,hsAll.subarray(st,en)]);}
    S.finMs=performance.now()-t0;S.genMs=J.ms;return {d,rng,SEC,n,far:J.far};}
  function put(W,J,D){const gl=W.gl,Gr=W.gr,old=S.sets[J.kind];const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,D.d,gl.STATIC_DRAW);
    const set={buf,rng:D.rng,SEC:24,n:D.n,t:Gr.t[D.far?1:0],cx:J.cx,cz:J.cz,kind:J.kind};
    if(old){const i=Gr.sets.indexOf(old);if(i>=0)Gr.sets[i]=set;else Gr.sets.push(set);gl.deleteBuffer(old.buf);}else Gr.sets.push(set);
    S.sets[J.kind]=set;Gr.n=Gr.sets.reduce((s,z)=>s+z.n,0);}
  /* ачаалах үед: тоглогчийн байрлалд хоёр багцыг шууд бэлдэнэ */
  function init(W,x,z,kind){if(!W.gr)return;if(kind==="near"){S.W=W;S.job=null;S.sets={near:null,far:null};W.gr.sets=[];W.gr.n=0;}
    const J=job(kind,x,z);step(J,1e9);put(W,J,finish(J));}
  /* кадр бүр: шаардлагатай бол шинэ багцыг хэдэн мс-ээр хувааж бэлдэнэ */
  function update(W,x,z,vx,vz,budget){if(!W.gr||S.W!==W)return;
    if(S.job){const t0=performance.now();if(step(S.job,budget||3)){const J=S.job;S.job=null;put(W,J,finish(J));S.jobs++;}S.lastMs=performance.now()-t0;return;}
    for(const kind of ["near","far"]){const P=SPEC[kind],cur=S.sets[kind];if(!cur)continue;
      if(Math.hypot(x-cur.cx,z-cur.cz)>P.move){let lx=vx*P.lead,lz=vz*P.lead;const l=Math.hypot(lx,lz),mx=P.move;if(l>mx){lx*=mx/l;lz*=mx/l;}
        S.job=job(kind,x+lx,z+lz);return;}}}
  return {init,update,S,TILES,sample,_job:job,_step:step,_finish:finish};
})();

/* ---------- Хүслийн мод: ойртоход бургасны бүтэн загвар, холдоход суллана ---------- */
const W3WISH=(()=>{
  const X=W3MAP.B[0],Z=W3MAP.B[1],SC=1,RY=2.6,NEAR=1e9,FAR=2e9;   /* үргэлж ачаалагдана: уулан дээрх жижиг бургаснууд мөн энэ загвар */
  const GROVE=[[W3TREE[0],W3TREE[1],.42,1.3],[-13.8,-65.8,.36,.6],[52,-30,.4,4.1]];
  const S={st:"far",sp:null,K:null,W:null,trunk:.7,loads:0,unloads:0,khadag:[],fallbackOn:true};
  function trunkY(J,x=X,z=Z,sc=SC){const T=J.info.trunk,r=T[2]*sc;return Math.min(...[[0,0],[1,0],[-1,0],[0,1],[0,-1]].map(([a,b])=>w3H(x+a*r,z+b*r)))-.05;}
  function kfFrame(){const sp=S.sp;if(!sp)return null;const I=sp.J.info;return {m:sp.list[0].k.m,s:SC,tk:I.trunk,band:Math.min(.85,I.trunk[3]*.8),slots:I.slots||[]};}
  /* хадагнууд: эртний цайвар 4 хадаг + тоглогчийн уясан хадгууд (зөвхөн өнгө нь хадгалагдана) */
  function rebuildKhadag(P){const m=P.m&&P.m.khadag;if(!m||!S.W)return;
    if(S.st!=="ready"){m.on=false;return;}const keep=W3KF;try{W3KF=kfFrame();w3Rebuf(S.W,m,w3KhadagW(S.khadag));m.on=true;}catch(e){console.warn("khadag",e);m.on=false;}finally{W3KF=keep;}}
  function load(W,P){S.st="loading";S.W=W;
    w3SkinData("willow4").then(J=>{const gl=W.gl;if(W!==S.W||!gl||(gl.isContextLost&&gl.isContextLost()))return;
      if(S.st==="cancel"){S.st="far";return;}
      const K=w3SkinKit(W,J,1+GROVE.length);if(!K.ok){S.st="fail";S.why=K.why;return;}
      const A=J.anims.Animation,k=K.inst(0),y=trunkY(J);k.m=M4.trs([X,y,Z],{ry:RY,s:SC});k.on=false;
      const list=[{o:{x:X,z:Z},k,y,ph:3.3,lodD:60,r:J.info.crown[3]*SC+3}];
      GROVE.forEach(([gx,gz,gs,gr],i)=>{const kk=K.inst(0),gy=trunkY(J,gx,gz,gs);kk.m=M4.trs([gx,gy,gz],{ry:gr,s:gs});kk.on=false;list.push({o:{x:gx,z:gz},k:kk,y:gy,ph:1.1+i*2.3,lodD:30,r:J.info.crown[3]*gs+3});});
      S.sp={J,K,T:A.ch[0].T,d:A.d,fr:[],list};S.K=K;
      (W.sks=W.sks||[]).push(K);S.trunk=J.info.trunk[2]*SC+.28;S.st="ready";S.loads++;S.readyAt=performance.now();
      if(P.m&&P.m.wtTree)P.m.wtTree.on=false;S.fallbackOn=false;rebuildKhadag(P);})
    .catch(e=>{console.warn("wish tree",e);S.st="fail";});}
  function unload(W,P){const sp=S.sp,K=S.K;if(!sp||!K){S.st="far";return;}const gl=W.gl;
    W.sks=(W.sks||[]).filter(k=>k!==K);
    if(gl&&!(gl.isContextLost&&gl.isContextLost())){const bufs=new Set();K.prims.forEach(p=>{bufs.add(p.fb);bufs.add(p.jb);bufs.add(p.ib);});bufs.forEach(b=>gl.deleteBuffer(b));
      const tx=new Set();K.mats.forEach(m=>{if(m.map)tx.add(m.map);if(m.nrm)tx.add(m.nrm);});tx.forEach(t=>gl.deleteTexture(t));
      if(W.imT)for(const [im,t] of [...W.imT])if(tx.has(t))W.imT.delete(im);if(K.bt)gl.deleteTexture(K.bt);
      [K.L,K.S].forEach(p=>{if(p&&p.p)gl.deleteProgram(p.p);});}
    sp.J.mats.forEach(m=>{["map","nrm"].forEach(k=>{if(m[k])delete W3IMG[m[k]];});});delete W3SKD.willow4;
    S.sp=null;S.K=null;S.st="far";S.unloads++;if(P.m&&P.m.wtTree)P.m.wtTree.on=true;S.fallbackOn=true;if(P.m&&P.m.khadag)P.m.khadag.on=false;}
  /* кадр бүр: зай шалгах, салхинд найгах */
  function step(W,P,c,t,inGer){if(S.W!==W){S.W=W;S.st="far";S.sp=null;S.K=null;}
    const d=Math.hypot(c.pos[0]-X,c.pos[2]-Z);
    if(S.st==="far"&&d<NEAR)load(W,P);
    else if(S.st==="loading"&&d>FAR)S.st="cancel";
    else if(S.st==="cancel"&&d<NEAR)S.st="loading";
    else if(S.st==="ready"&&d>FAR)unload(W,P);
    if(S.st==="ready"&&S.sp)w3TreeStep({sp:[S.sp]},t,c,inGer);}
  function reset(){S.st="far";S.sp=null;S.K=null;S.W=null;S.fallbackOn=true;}
  return {S,X,Z,step,rebuildKhadag,reset,NEAR,FAR};
})();
