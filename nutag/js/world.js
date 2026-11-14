/* «Миний нутаг» — Жалайрын өөрийн WebGL1 рендерер ба ертөнц.
   index.html (artifact 1794491298-0c38)-ээс tools/build_world.py-аар хуулав. Гараар бүү засаарай: build_world.py-г засаад дахин үүсгэнэ.
   Өөрчлөлтүүд: asset зам (assets/), хөнгөн texture, Low/Medium/High, хурганы хэмжээ, хонины LOD, нэг том газрын зураг (js/map.js). */
"use strict";
/* гэр барих алхмууд: загварын үндсэн зангилааны нэрээр */
function W3STAGE(r,n){if(n==="Hearth_Cauldron_Broth")return "broth";if(/^Floor_|^Rug_UnderFelt/.test(r))return "floor";if(/^Door_Frame|^Door_Pivot|^Door_Handle/.test(r))return "door";if(r==="Khana_LatticeWall")return "khana";if(r==="Khana_TopRope")return "krope";if(/^Bagana_/.test(r))return "bagana";if(/^Toono_|^Rope_Toono/.test(r))return "toono";if(/^Uni_/.test(r))return "uni";if(r==="Felt_Wall"||r==="Felt_Roof"||r==="Felt_DoorEdge_Thickness")return "felt";if(/_Exterior$|^Door_FeltCover/.test(r))return "cover";if(/^Rope_Roof|^Rope_Wall/.test(r))return "rope";return "f:"+r;}
const W3SECN={khana:8,uni:8,felt:8,cover:8};
function wishCols(){return [];}
let W3MAXR=40,W3SURS=false,W3SHC=[1,0,3];
const W3BARE=[];
/* ---- index.html 2644–2644: chRng ---- */
function chRng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
/* ---- index.html 5837–6872: renderer + world (13-р зууны аялал: 3D ертөнц) ---- */
/* ---------- 13-р зууны аялал: 3D ертөнц ----------
   Own WebGL renderer, no outside library. Smooth-shaded land and props, ~500k soft grass blades on the GPU in a near and a far layer
   (ground-matched shading, painted patches, wind waves), flower drifts, a lone elm, puffy cumulus, a lofted horse with a real gallop,
   woolly sheep, see-through smoke, sun shadows, stars, then a painting pass in the manner of Monet: brush strokes
   along a flow field (level in the sky, upright in the grass), violet shadows, pastel light, broken warm/cool colour,
   canvas weave, plus light shafts from the sun and soft glow. Quality drops on its own on slow phones. */
const V3={sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],mul:(a,s)=>[a[0]*s,a[1]*s,a[2]*s],
  cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  norm:a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];},lerp:(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]};
const M4={
 id(){const m=new Float32Array(16);m[0]=m[5]=m[10]=m[15]=1;return m;},
 mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s;}return o;},
 persp(fy,as,n,f,sy){const t=1/Math.tan(fy/2),m=new Float32Array(16);m[0]=t/as;m[5]=t;m[9]=sy||0;m[10]=(f+n)/(n-f);m[11]=-1;m[14]=2*f*n/(n-f);return m;},
 ortho(l,r,b,t,n,f){const m=new Float32Array(16);m[0]=2/(r-l);m[5]=2/(t-b);m[10]=-2/(f-n);m[12]=-(r+l)/(r-l);m[13]=-(t+b)/(t-b);m[14]=-(f+n)/(f-n);m[15]=1;return m;},
 look(e,c){const z=V3.norm(V3.sub(e,c)),x=V3.norm(V3.cross([0,1,0],z)),y=V3.cross(z,x);
   return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-V3.dot(x,e),-V3.dot(y,e),-V3.dot(z,e),1]);},
 T(x,y,z){const m=M4.id();m[12]=x;m[13]=y;m[14]=z;return m;},
 Ry(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]);},
 Rx(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]);},
 Rz(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]);},
 S(x,y,z){const m=M4.id();m[0]=x;m[5]=y;m[10]=z;return m;},
 trs(t,o){o=o||{};let m=M4.T(t[0],t[1],t[2]);if(o.ry)m=M4.mul(m,M4.Ry(o.ry));if(o.rx)m=M4.mul(m,M4.Rx(o.rx));if(o.rz)m=M4.mul(m,M4.Rz(o.rz));
   if(o.s){const s=typeof o.s==="number"?[o.s,o.s,o.s]:o.s;m=M4.mul(m,M4.S(s[0],s[1],s[2]));}return m;}
};
const hex=h=>[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255];
const ss3=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
/* geometry builder: position, normal, colour, sway (grass tips move with the wind) */
function Geo(seed){this.v=[];this.m=M4.id();this.nm=null;this.r=chRng(seed||7);}
Geo.prototype.at=function(t,o,fn){const pm=this.m,pn=this.nm;this.m=M4.mul(pm,M4.trs(t,o));this.nm=null;fn(this);this.m=pm;this.nm=pn;return this;};
Geo.prototype.p=function(q){const m=this.m,x=q[0],y=q[1],z=q[2];return [m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14]];};
Geo.prototype.n=function(q){if(!this.nm){const m=this.m;this.nm=[m[5]*m[10]-m[9]*m[6],-(m[1]*m[10]-m[9]*m[2]),m[1]*m[6]-m[5]*m[2],-(m[4]*m[10]-m[8]*m[6]),m[0]*m[10]-m[8]*m[2],-(m[0]*m[6]-m[4]*m[2]),m[4]*m[9]-m[8]*m[5],-(m[0]*m[9]-m[8]*m[1]),m[0]*m[5]-m[4]*m[1]];}
  const c=this.nm;return V3.norm([c[0]*q[0]+c[1]*q[1]+c[2]*q[2],c[3]*q[0]+c[4]*q[1]+c[5]*q[2],c[6]*q[0]+c[7]*q[1]+c[8]*q[2]]);};
Geo.prototype.vx=function(p,n,c,s){this.v.push(p[0],p[1],p[2],n[0],n[1],n[2],c[0],c[1],c[2],s||0);};
Geo.prototype.jc=function(col,jit){const j=1+(this.r()-.5)*(jit??.06);return [col[0]*j,col[1]*j,col[2]*j];};
Geo.prototype.tri=function(a,b,c,col,jit){a=this.p(a);b=this.p(b);c=this.p(c);const n=V3.norm(V3.cross(V3.sub(b,a),V3.sub(c,a))),k=this.jc(col,jit);this.vx(a,n,k);this.vx(b,n,k);this.vx(c,n,k);return this;};
Geo.prototype.triS=function(a,b,c,na,nb,nc,col,jit){const k=this.jc(col,jit);this.vx(this.p(a),this.n(na),k);this.vx(this.p(b),this.n(nb),k);this.vx(this.p(c),this.n(nc),k);return this;};
Geo.prototype.quad=function(a,b,c,d,col,jit){this.tri(a,b,c,col,jit);this.tri(a,c,d,col,jit);return this;};
Geo.prototype.box=function(w,h,d,col){const x=w/2,y=h/2,z=d/2,P=[[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z],[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]];
  [[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]].forEach(f=>this.quad(P[f[0]],P[f[1]],P[f[2]],P[f[3]],col,.03));return this;};
Geo.prototype.cyl=function(r0,r1,h,seg,col,caps,jit){const N=a=>V3.norm([Math.cos(a)*h,r0-r1,Math.sin(a)*h]);
  for(let i=0;i<seg;i++){const a0=i/seg*Math.PI*2,a1=(i+1)/seg*Math.PI*2,c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1),n0=N(a0),n1=N(a1);
    const A=[c0*r0,0,s0*r0],B=[c1*r0,0,s1*r0],C=[c1*r1,h,s1*r1],D=[c0*r1,h,s0*r1];this.triS(A,B,C,n0,n1,n1,col,jit??.02);this.triS(A,C,D,n0,n1,n0,col,jit??.02);
    if(caps!==false){if(r1>0)this.tri([0,h,0],D,C,col,.02);this.tri([0,0,0],B,A,col,.02);}}return this;};
Geo.prototype.sph=function(r,seg,col,jit){const la=Math.max(3,seg>>1),U=(t,p)=>[Math.sin(t)*Math.cos(p),Math.cos(t),Math.sin(t)*Math.sin(p)],P=(t,p)=>V3.mul(U(t,p),r);
  for(let i=0;i<la;i++){const t0=i/la*Math.PI,t1=(i+1)/la*Math.PI;for(let j=0;j<seg;j++){const p0=j/seg*Math.PI*2,p1=(j+1)/seg*Math.PI*2;
    if(i>0)this.triS(P(t0,p0),P(t0,p1),P(t1,p1),U(t0,p0),U(t0,p1),U(t1,p1),col,jit??.03);if(i<la-1)this.triS(P(t0,p0),P(t1,p1),P(t1,p0),U(t0,p0),U(t1,p1),U(t1,p0),col,jit??.03);}}return this;};

/* smooth lofted shapes: rings along a path (x,y,z + two radii) eased with Catmull-Rom; normals come from the surface itself */
function loft(pts){const n=pts.length,cr=(a,b,c,d,t)=>{const t2=t*t,t3=t2*t;return .5*(2*b+(c-a)*t+(2*a-5*b+4*c-d)*t2+(3*b-a-3*c+d)*t3);};
  return u=>{const f=Math.min(n-1.0001,Math.max(0,u*(n-1))),i=Math.floor(f),t=f-i,P=k=>pts[Math.max(0,Math.min(n-1,k))],o=[];
    for(let k=0;k<5;k++)o.push(cr(P(i-1)[k],P(i)[k],P(i+1)[k],P(i+2)[k],t));o[3]=Math.max(o[3],.0004);o[4]=Math.max(o[4],.0004);return o;};}
function loftFrames(at,R){const F=[];let U=null;for(let i=0;i<=R;i++){const u=i/R,q=at(u),a=at(Math.max(0,u-.003)),b=at(Math.min(1,u+.003));
    const T=V3.norm([b[0]-a[0],b[1]-a[1],b[2]-a[2]]);
    if(!U)U=Math.abs(T[2])<.9?V3.norm([-T[1],T[0],0]):V3.norm(V3.cross(T,[1,0,0]));else U=V3.norm(V3.sub(U,V3.mul(T,V3.dot(U,T))));
    F.push({q,T,U,Z:V3.cross(T,U)});}return F;}
Geo.prototype.tube=function(at,R,S,o){o=o||{};const F=loftFrames(at,R),P=[],C=[],K=[],e=o.sq||1,pw=v=>Math.sign(v)*Math.pow(Math.abs(v),e);
  const open=o.a1!=null,a0=o.a0||0,a1=open?o.a1:Math.PI*2,SS=open?S+1:S,gr=o.grow||0;
  F.forEach((f,i)=>{const u=i/R,row=[],cr=[];for(let j=0;j<SS;j++){const a=a0+(a1-a0)*j/S,cu=pw(Math.cos(a))*(f.q[3]+gr),cz=pw(Math.sin(a))*(f.q[4]+gr);
      row.push([f.q[0]+f.U[0]*cu+f.Z[0]*cz,f.q[1]+f.U[1]*cu+f.Z[1]*cz,f.q[2]+f.U[2]*cu+f.Z[2]*cz]);cr.push(o.col?o.col(u,a,f):o.c);}
    P.push(row);C.push([f.q[0],f.q[1],f.q[2]]);K.push(cr);});
  return this.grid(P,C,K,!open,o.sw);};
Geo.prototype.grid=function(P,C,K,wrap,sw){const R=P.length,S=P[0].length,N=[],mi=R>>1,mj=S>>1;
  const raw=(i,j)=>{const du=V3.sub(P[Math.min(i+1,R-1)][j],P[Math.max(i-1,0)][j]),jn=wrap?(j+1)%S:Math.min(j+1,S-1),jp=wrap?(j+S-1)%S:Math.max(j-1,0);
    return V3.cross(du,V3.sub(P[i][jn],P[i][jp]));};
  const sg=V3.dot(raw(mi,mj),V3.sub(P[mi][mj],C[mi]))<0?-1:1;
  for(let i=0;i<R;i++){const row=[];for(let j=0;j<S;j++){let n=raw(i,j);
      if(Math.hypot(n[0],n[1],n[2])<1e-12){const T=V3.sub(C[Math.min(i+1,R-1)],C[Math.max(i-1,0)]);n=i<mi?V3.mul(T,-1):T;}else n=V3.mul(n,sg);row.push(V3.norm(n));}N.push(row);}
  const J=wrap?S:S-1;
  for(let i=0;i<R-1;i++)for(let j=0;j<J;j++){const j1=wrap?(j+1)%S:j+1,v=(a,b)=>this.vx(this.p(P[a][b]),this.n(N[a][b]),K[a][b],sw?sw(a/(R-1),P[a][b]):0);
    v(i,j);v(i+1,j);v(i+1,j1);v(i,j);v(i+1,j1);v(i,j1);}
  return this;};
/* a cluster of puffs (tree crowns, cumulus clouds): normals lean away from one centre so the whole cluster shades softly as one form */
Geo.prototype.blobs=function(list,ctr,k,seg,colf,sw,floor){const la=Math.max(3,seg>>1);
  list.forEach(([x,y,z,r],bi)=>{const pt=(t,p)=>{const d=[Math.sin(t)*Math.cos(p),Math.cos(t),Math.sin(t)*Math.sin(p)],P=[x+d[0]*r,y+d[1]*r,z+d[2]*r];
      let n=V3.norm(V3.lerp(d,V3.norm(V3.sub(P,ctr)),k));if(floor!=null&&P[1]<floor){P[1]=floor;n=V3.norm(V3.lerp(n,[0,-1,0],.75));}return [P,n];};
    const tri=(...q)=>q.forEach(([P,n])=>this.vx(this.p(P),this.n(n),colf(P,n,bi),sw?sw(P):0));
    for(let i=0;i<la;i++){const t0=i/la*Math.PI,t1=(i+1)/la*Math.PI;for(let j=0;j<seg;j++){const p0=j/seg*Math.PI*2,p1=(j+1)/seg*Math.PI*2,A=pt(t0,p0),B=pt(t0,p1),C=pt(t1,p1),D=pt(t1,p0);
      if(i>0)tri(A,B,C);if(i<la-1)tri(A,C,D);}}});
  return this;};

/* the land: flat around the gers, gentle swells, rolling hills, a green knoll with a lone elm, then a ring of ridged mountains */
const W3F=(x,z)=>Math.sin(x*.05+1.3)*Math.sin(z*.045+.7)+.5*Math.sin(x*.11+z*.07)+.25*Math.sin(x*.23-z*.19+2.1)+.12*Math.sin(x*.47+z*.41+.3);
const W3TREE=[-22.4,-29.7],W3POND=[17,6,6.5,4.2],W3WL=-.22;
/* Amy's willows: Willow4 is the wish tree, Willow1–3 stand around the land (two replace the old cartoon trees).
   per kind: trunk centre x,z and radius, crown centre x,z and radius, in the model's own metres */
const W3WT={willow1:[-.007,.182,1.13,.33,.52,13.8],willow2:[.193,0,.6,-.47,.04,6.63],willow3:[-1.059,.698,1.575,-2.56,8.29,12.61],willow4:[.045,.003,.21,-.27,.37,4.28]};
const W3WIL=[{n:"willow4",x:W3TREE[0],z:W3TREE[1],s:.9,ry:2.2,wish:1},{n:"willow1",x:-13.8,z:-65.8,s:.5,ry:.6},{n:"willow3",x:52,z:-30,s:.6,ry:4.1},
  {n:"willow2",x:25.5,z:10.5,s:.72,ry:1.3},{n:"willow2",x:-31,z:-13,s:.62,ry:5},{n:"willow1",x:36,z:30,s:.44,ry:3.3},{n:"willow3",x:-46,z:-44,s:.55,ry:1.9}].map(o=>{
  const m=M4.trs([0,0,0],{ry:o.ry}),T=W3WT[o.n],p=(x,z)=>[o.x+(m[0]*x+m[8]*z)*o.s,o.z+(m[2]*x+m[10]*z)*o.s];return Object.assign(o,{t:p(T[0],T[1]),tr:T[2]*o.s*.8,c:p(T[3],T[4]),cr:T[5]*o.s});});
function w3H0(x,z){const r=Math.hypot(x,z),swell=.32*W3F(x*1.3,z*1.3)*ss3(5,14,r),hills=ss3(22,70,r)*(3.2+2.6*W3F(x*.55+7,z*.55-3));
  const rid=1-Math.abs(Math.sin(x*.018+Math.sin(z*.011)*2)*Math.cos(z*.016+Math.sin(x*.013)*1.7));
  const ew=1-.6*Math.pow(Math.abs(x)/(r||1),8),dx=x-W3TREE[0],dz=z-W3TREE[1];
  let h=swell+hills+4.2*Math.exp(-(dx*dx+dz*dz)/190)+ss3(85,150,r)*(6+17*rid*rid+4*W3F(x*.2,z*.2))*ew;
  const pe=Math.hypot((x-W3POND[0])/W3POND[2],(z-W3POND[1])/W3POND[3]);if(pe<1.9)h=h*(1-ss3(1.85,1.2,pe))-1.1*ss3(1.15,.5,pe);return h;}
const W3GERS=[[0,0,1],[-8.5,-5,.85],[-15,1.5,.8]];
const GERX={on:false};
const W3C={g1:hex("#3C7D36"),g2:hex("#74AE47"),g3:hex("#2B6230"),dry:hex("#C4B660"),soil:hex("#8C7650"),rock:hex("#7D7266"),rock2:hex("#9A8D78"),
  felt:hex("#EDE6D6"),felt2:hex("#DDD3BE"),rope:hex("#6B4A2E"),band:hex("#4D5F73"),wood:hex("#8E5A2E"),wood2:hex("#6B4122"),dark:hex("#2C211A"),
  flap:hex("#6E2A1C"),gold:hex("#C99A3A"),bay:hex("#7A4522"),bay2:hex("#3A2414"),black:hex("#231C17"),wool:hex("#E9E3D6"),goat:hex("#7E5F45"),
  leather:hex("#8A4E26"),cream:hex("#F6ECD2"),red:hex("#8E2A20")};
/* where grass may not grow (1) or grows thin (0..1): the gers, the felt mat, the archery targets, the path */
function w3Bare(x,z){if(Math.hypot((x-W3POND[0])/W3POND[2],(z-W3POND[1])/W3POND[3])<1.07)return 1;for(const g of W3GERS)if(Math.hypot(x-g[0],z-g[1])<3.9*g[2])return 1;
  {const dx=x-2.3,dz=z-5.4,c=Math.cos(.25),s=Math.sin(.25);if(Math.abs(c*dx-s*dz)<1.08&&Math.abs(s*dx+c*dz)<.8)return 1;}if(W3SURS&&x>6.3&&x<10.7&&z>-9.75&&z<-8.25)return 1;for(const b of W3BARE)if(Math.hypot(x-b[0],z-b[1])<b[2])return 1;
  if(Math.hypot(x-1.1,z-2.75)<.45||Math.hypot(x-W3TREE[0],z-W3TREE[1])<1.2)return 1;
  return Math.max(Math.max(0,1-Math.abs(x-(z*.42))/.9)*ss3(2.2,3,z)*ss3(16,9,z)*.85,landBare(x,z),W3MAP.bare(x,z));}
/* grazed short around the gers and where the horse stands */
function w3Short(x,z){let s=1;for(const g of W3GERS)s=Math.min(s,.45+.55*ss3(3.9,5.6,Math.hypot(x-g[0],z-g[1])/g[2]));
  s=Math.min(s,.55+.45*ss3(.9,1.8,Math.hypot((x+3.3)*.55,z-2.7)));
  const ax=x-5.6,az=z-11.8,bx=2.9,bz=-20.8,k=Math.max(0,Math.min(1,(ax*bx+az*bz)/(bx*bx+bz*bz))),dl=Math.hypot(ax-bx*k,az-bz*k);
  return Math.min(s,.3+.7*ss3(1.4,3.2,dl));}
/* one colour field shared by the ground and the grass, so they always agree */
function w3GrassCol(x,z){const C=W3C;let c=V3.lerp(C.g1,C.g2,.5+.5*Math.sin(x*.21+Math.sin(z*.17)*2));
  const f2=W3F(x*.37-11,z*.37+5);if(f2>.45)c=V3.lerp(c,C.g3,Math.min(1,(f2-.45)*1.6)*.7);
  const f=W3F(x*.8+3,z*.8);if(f>.98)c=V3.lerp(c,C.dry,Math.min(1,(f-.98)*1.4)*.5);
  for(const o of W3WIL)if(!o.wish){const ex=x-o.c[0],ez=z-o.c[1];c=V3.mul(c,1-.3*Math.exp(-(ex*ex+ez*ez)/(o.cr*o.cr*.3)));}
  const dx=x-W3TREE[0],dz=z-W3TREE[1];return V3.mul(c,1-.42*Math.exp(-(dx*dx+dz*dz)/26));}
/* grass tufts for the GPU: position, seed, height, width, size, colour; sorted into wedges around the camera so only the wedge in view is drawn */
function w3GrassData(cx,cz,N,r0,r1,far,seed){const R=chRng(seed),SEC=24,TAU=Math.PI*2,B=Array.from({length:SEC},()=>[]);let made=0;
  for(let i=0;i<N*1.8&&made<N;i++){const a=R()*TAU,u=R(),r=far?r0*Math.pow(r1/r0,u):r0+(r1-r0)*Math.pow(u,1.25),x=cx+Math.sin(a)*r,z=cz-Math.cos(a)*r,ro=Math.hypot(x,z);
    if(ro>96||R()<w3Bare(x,z))continue;const y=w3H(x,z),e=.35,gn=V3.norm([y-w3H(x+e,z),e,y-w3H(x,z+e)]);if(gn[1]<.8)continue;
    const k=Math.max(1,r/7),fade=far?ss3(r1,r1*.85,r):1,tall=Math.max(0,W3F(x*.5+4,z*.5-2)-.2);
    const h=(.2+R()*.07+tall*.1)*w3Short(x,z)*Math.pow(k,far?.4:.33)*fade,w=(.017+R()*.008)*Math.pow(k,.85)*(far?1.7:1),c=w3GrassCol(x,z);
    B[Math.min(SEC-1,Math.floor(a/TAU*SEC))].push([r,x,y-.02,z,R()*100,h,w,k,R(),c[0],c[1],c[2],gn[0],gn[2]]);made++;}
  const d=new Float32Array(made*13),rng=[],CH=420;let o=0;B.forEach(b=>{b.sort((p,q)=>p[0]-q[0]);
    for(let s0=0;s0<b.length;s0+=CH){const c=b.slice(s0,s0+CH),KH=v=>{const q=Math.sin(v[4]*3.3+.7)*43758.5453;return q-Math.floor(q);};c.sort((p,q)=>KH(p)-KH(q));let mx=0,mz=0;c.forEach(v=>{mx+=v[1];mz+=v[3];});mx/=c.length;mz/=c.length;let rr=0;c.forEach(v=>{rr=Math.max(rr,Math.hypot(v[1]-mx,v[3]-mz));});
      rng.push([o/13,c.length,mx,mz,rr+.6,Float32Array.from(c.map(KH))]);c.forEach(v=>{for(let i=1;i<14;i++)d[o++]=v[i];});}});
  return {d,rng,SEC,n:made,far};}
/* one clump = six soft blades fanning out like a fountain */
function w3GrassTpl(far){const v=[],ix=[];if(far){for(let b=0;b<6;b++){v.push(-1,0,b,1,0,b,0,1,b);ix.push(b*3,b*3+1,b*3+2);}return {v:new Float32Array(v),i:new Uint16Array(ix)};}
  const T=[0,.33,.67,1];for(let b=0;b<6;b++){const o=b*8;T.forEach(t=>v.push(-1,t,b,1,t,b));
    for(let l=0;l<3;l++){const a=o+l*2,c=a+2;ix.push(a,a+1,c+1,a,c+1,c);}}
  return {v:new Float32Array(v),i:new Uint16Array(ix)};}
/* a Siberian elm (хайлаас): flared trunk, a few limbs and a soft round crown */
function w3Tree(g,x,z,s,seed){const R=chRng(seed),bark=hex("#5E4A39"),bark2=hex("#3B2F25"),lo=hex("#2C5620"),hi=hex("#7BA83E");
  g.at([x,w3H(x,z)-.25,z],{s,ry:R()*6.28},q=>{
    q.tube(loft([[0,-.3,0,.66,.62],[0,.2,0,.5,.47],[.06,1.2,0,.36,.34],[.14,2.3,.06,.31,.3],[.06,3.1,.1,.27,.26],[-.06,3.8,.05,.2,.2],[-.12,4.6,0,.12,.12],[-.14,5.1,0,.004,.004]]),44,12,
      {col:(u,a)=>V3.lerp(bark2,bark,.5+.5*Math.sin(a*3+u*11+Math.sin(a*7)*.8))});
    [[2.1,.5,.9],[2.5,2.3,1.05],[2.9,4.2,.8],[2.6,1.4,.95],[3.2,3.2,.9],[3.5,5.4,1.1]].forEach(([sy,an,lift])=>{const dx=Math.cos(an),dz=Math.sin(an),L=2.3+R()*.9;
      q.tube(loft([[0,sy,0,.17,.16],[dx*L*.35,sy+L*.35*lift+.2,dz*L*.35,.12,.11],[dx*L*.7,sy+L*.6*lift+.5,dz*L*.7,.075,.07],[dx*L,sy+L*.75*lift+.7,dz*L,.004,.004]]),16,8,{c:bark});});
    const bl=[];for(let i=0;i<46;i++){const a=R()*6.283,rr=Math.sqrt(R()),bx=Math.cos(a)*rr*3.8,bz=Math.sin(a)*rr*3.8,by=4.9+(R()-.35)*2.2*(1-rr*.5)+(1-rr)*1.3;bl.push([bx,by,bz,1.05+R()*.85*(1.25-rr*.5)]);}
    q.blobs(bl,[0,4.6,0],.6,10,(P,n,bi)=>V3.mul(V3.lerp(lo,hi,Math.min(1,Math.max(0,(P[1]-3.4)/3.8))*.65+Math.max(0,n[1])*.35),.9+.2*((bi*37%11)/11)),P=>Math.max(0,P[1]-4)*.22);});}
/* the wish tree (хүслийн мод): the elm on the hill wears khadag ribbons, one for every wish you leave.
   w3TreeFrame repeats the tree's own random draws, so the ribbons sit exactly on its branches */
const KH_COL=["#2F7BE0","#5AA6F2","#2F7BE0","#F4F0E4","#2F7BE0","#F2C744","#7FBDF5","#3BA55C","#2F7BE0","#E2483D"];
function w3TreeFrame(){const R=chRng(7),ry=R()*6.28,P=[];
  [[2.1,.5,.9],[2.5,2.3,1.05],[2.9,4.2,.8],[2.6,1.4,.95],[3.2,3.2,.9],[3.5,5.4,1.1]].forEach(([sy,an,lift],b)=>{const dx=Math.cos(an),dz=Math.sin(an),L=2.3+R()*.9,
    A=[0,sy,0],B=[dx*L*.35,sy+L*.35*lift+.2,dz*L*.35],C=[dx*L*.7,sy+L*.6*lift+.5,dz*L*.7],lp=(a,c,f)=>a.map((v,i)=>v+(c[i]-v)*f);
    [lp(A,B,.5),lp(A,B,.8),lp(B,C,.15),lp(A,B,.65),lp(B,C,.4),lp(A,B,.95)].forEach((q,k)=>{if(q[1]<4.3&&Math.hypot(q[0],q[2])>.4)P.push({q,an,k,b});});});
  P.sort((a,b)=>a.k-b.k||a.b-b.b);return {ry,slots:P};}
function w3Ribbon(q,A,len,th,col,ph){const N=9,w=.075;let prev=null;
  for(let i=0;i<=N;i++){const u=i/N,sw=Math.sin(u*3+ph)*.06*u,tw=th+u*.7*Math.sin(ph*3),c=[A[0]-Math.sin(th)*sw,A[1]-u*len,A[2]+Math.cos(th)*sw],ww=w*(1-u*.2),
      ex=Math.cos(tw)*ww,ez=Math.sin(tw)*ww,pa=q.p([c[0]-ex,c[1],c[2]-ez]),pb=q.p([c[0]+ex,c[1],c[2]+ez]),n=q.n([-Math.sin(tw),0,Math.cos(tw)]),sv=Math.pow(u,1.2)*2.6,cc=V3.mul(col,.9+.1*Math.cos(u*9+ph));
    if(prev){q.vx(prev.pa,n,prev.c,prev.s);q.vx(prev.pb,n,prev.c,prev.s);q.vx(pb,n,cc,sv);q.vx(prev.pa,n,prev.c,prev.s);q.vx(pb,n,cc,sv);q.vx(pa,n,cc,sv);}
    prev={pa,pb,c:cc,s:sv};}
  q.at(A,{},v=>v.sph(.05,6,V3.mul(col,.85),0));}
let W3KF=null;
function w3KhadagW(cols){const F=W3KF,g=new Geo(57),R=chRng(58),blue=hex(KH_COL[0]),old=[hex("#EDE8DA"),hex("#9CC3E6"),hex("#E8E2D0"),hex("#B7D3EC")],m=F.m,
    P=q=>[m[0]*q[0]+m[4]*q[1]+m[8]*q[2]+m[12],m[1]*q[0]+m[5]*q[1]+m[9]*q[2]+m[13],m[2]*q[0]+m[6]*q[1]+m[10]*q[2]+m[14]],tc=P([F.tk[0],F.band,F.tk[1]]),tr=F.tk[2]*F.s,
    fa=Math.atan2(-tc[2],-tc[0]),fx=Math.cos(fa),fz=Math.sin(fa);
  g.at([0,0,0],{},q=>{q.at(tc,{},w=>w.cyl(tr*1.16,tr*1.1,.15,20,blue,false));
    w3Ribbon(q,[tc[0]+fx*(tr+.05)-fz*.05,tc[1]+.01,tc[2]+fz*(tr+.05)+fx*.05],.62,fa+1.57,blue,1.3);w3Ribbon(q,[tc[0]+fx*(tr+.05)+fz*.06,tc[1]-.02,tc[2]+fz*(tr+.05)-fx*.06],.52,fa+1.9,blue,2.4);
    const sl=F.slots.map(v=>{const p=P(v);return {q:[p[0],p[1]-.03,p[2]],an:Math.atan2(p[2]-tc[2],p[0]-tc[0])};}),list=old.concat(cols.map(i=>hex(KH_COL[i%KH_COL.length]))).slice(-sl.length*2);
    list.forEach((c,i)=>{const S=sl[i%sl.length],o=i<sl.length?0:.14*(i%2?1:-1),q0=[S.q[0]+Math.cos(S.an)*o,S.q[1]-(i<sl.length?0:.05),S.q[2]+Math.sin(S.an)*o];
      w3Ribbon(q,q0,.75+R()*.55,S.an,c,R()*6.28);});});
  return g;}
function w3Khadag(cols){if(W3KF)return w3KhadagW(cols);const g=new Geo(57),R=chRng(58),T=w3TreeFrame(),x=W3TREE[0],z=W3TREE[1],old=[hex("#EDE8DA"),hex("#9CC3E6"),hex("#E8E2D0"),hex("#B7D3EC")],blue=hex(KH_COL[0]);
  g.at([x,w3H(x,z)-.25,z],{s:1.12,ry:T.ry},q=>{
    q.at([.08,1.5,0],{},w=>w.cyl(.39,.375,.17,24,blue,false));w3Ribbon(q,[.46,1.52,.1],.95,1.8,blue,1.3);w3Ribbon(q,[.44,1.49,.2],.82,2.1,blue,2.4);
    const sl=T.slots,list=old.map(c=>c).concat(cols.map(i=>hex(KH_COL[i%KH_COL.length]))).slice(-sl.length*2);
    list.forEach((c,i)=>{const S=sl[i%sl.length],o=i<sl.length?0:.14*(i%2?1:-1),q0=[S.q[0]+Math.cos(S.an)*o,S.q[1]-(i<sl.length?0:.05),S.q[2]+Math.sin(S.an)*o];
      w3Ribbon(q,q0,.75+R()*.55,S.an,c,R()*6.28);});});
  return g;}
/* the horse: a lofted body (rump, barrel, withers, neck, head), jointed legs and a long tail, so it can really gallop */
function w3HorseGeo(){const C=W3C,bay=hex("#8C4C22"),bayD=hex("#4C2913"),bayL=hex("#A86A3B"),blk=hex("#1C1612"),hoof=hex("#34302C"),wood=hex("#7A4A26"),silver=hex("#D9D6CC");
  const body=loft([[-.8,1.27,0,.004,.004],[-.77,1.27,0,.12,.11],[-.68,1.27,0,.25,.22],[-.53,1.25,0,.32,.27],[-.35,1.21,0,.33,.29],[-.08,1.13,0,.31,.28],[.18,1.13,0,.32,.27],
    [.38,1.17,0,.33,.25],[.53,1.3,0,.27,.2],[.65,1.44,0,.21,.15],[.78,1.61,0,.16,.115],[.91,1.79,0,.12,.09],[1.03,1.73,0,.12,.09],[1.15,1.6,0,.095,.08],[1.25,1.49,0,.08,.07],
    [1.31,1.43,0,.065,.06],[1.34,1.4,0,.035,.035],[1.35,1.39,0,.004,.004]]);
  const B=new Geo(11);
  B.tube(body,130,28,{sq:.92,col:(u,a)=>{let c=V3.lerp(bay,bayD,.38*Math.pow(Math.max(0,Math.cos(a)),2));c=V3.lerp(c,bayL,.22*Math.max(0,-Math.cos(a)));
    if(u>.82)c=V3.lerp(c,blk,Math.min(1,(u-.82)*6)*.8);return c;}});
  const mp=[];for(let k=0;k<=10;k++){const u=.44+k/10*.215,q=body(u),q2=body(u+.004),T=V3.norm([q2[0]-q[0],q2[1]-q[1],0]),o=q[3]*.88,th=Math.sin(k/10*Math.PI);
    mp.push([q[0]-T[1]*o,q[1]+T[0]*o,.02*th,.012+.075*th,.01+.038*th]);}
  B.tube(loft(mp),34,10,{c:blk});
  B.tube(loft([[.88,1.93,0,.004,.004],[.93,1.92,0,.035,.03],[.99,1.87,.01,.04,.028],[1.04,1.81,.01,.004,.004]]),12,8,{c:blk});
  [1,-1].forEach(sd=>{B.at([.87,1.89,.055*sd],{rz:-.18,rx:.28*sd},q=>q.tube(loft([[0,0,0,.038,.026],[0,.07,0,.03,.02],[.01,.15,0,.004,.004]]),8,8,{col:u=>V3.lerp(bay,blk,u)}));
    B.at([.992,1.772,.07*sd],{},q=>q.sph(.046,12,[1,1,1],0));B.at([1.004,1.768,.1*sd],{},q=>q.sph(.032,10,blk,0));
    B.at([1.012,1.79,.126*sd],{},q=>q.sph(.011,6,[1,1,1],0));B.at([.998,1.752,.127*sd],{},q=>q.sph(.005,5,[1,1,1],0));
    B.at([1.1,1.665,.076*sd],{s:[1,.7,.45]},q=>q.sph(.036,8,hex("#EE8E92"),0));
    const K=[[1.15,1.6,.095,.08],[1.25,1.49,.08,.07],[1.31,1.43,.065,.06]],at=x=>{const i=x<1.25?0:1,a=K[i],b=K[i+1],f=(x-a[0])/(b[0]-a[0]);return [a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f,a[3]+(b[3]-a[3])*f];};
    for(let k=0;k<5;k++){const x=1.2+k*.025,[cy,ry,rz]=at(x),f=.7-.28*Math.pow((1.3-x)/.1,2),y=cy-ry*f,zz=rz*Math.sqrt(Math.max(0,1-f*f))+.002;B.at([x,y,zz*sd],{},q=>q.sph(.0062,5,hex("#F2A6AC"),0));}});
  [[.99,1.8765,.03],[1.06,1.81,.029],[1.13,1.722,.026],[1.2,1.6325,.022],[1.265,1.553,.019]].forEach(([x,y,w])=>B.at([x,y-.006,0],{rz:-.85,s:[.06,.014,w]},q=>q.sph(1,10,hex("#F3EEE4"),0)));
  B.tube(u=>body(.795+u*.016),2,24,{grow:.012,c:C.leather});B.tube(u=>body(.648+u*.014),2,24,{grow:.012,c:C.leather});
  B.tube(u=>body(.27+u*.145),16,26,{a0:-1.32,a1:1.32,grow:.014,col:(u,a)=>u<.1||u>.9||Math.abs(a)>1.14?C.gold:(Math.abs(a)<.45&&u>.3&&u<.7?hex("#1F4E79"):C.red)});
  B.at([.12,1.465,0],{s:[.27,.075,.19]},q=>q.sph(1,16,wood,0));
  B.at([.34,1.5,0],{rz:Math.PI/2},q=>q.cyl(.13,.13,.05,22,wood));B.at([-.08,1.48,0],{rz:Math.PI/2},q=>q.cyl(.125,.125,.05,22,wood));
  B.at([.335,1.635,0],{},q=>q.sph(.022,8,silver,0));B.at([-.105,1.61,0],{},q=>q.sph(.02,8,silver,0));
  [1,-1].forEach(sd=>{B.at([.12,1.17,.305*sd],{},q=>q.box(.035,.42,.012,C.leather));B.at([.12,.95,.31*sd],{},q=>{q.box(.12,.025,.07,silver);q.at([-.055,.04,0],{},w=>w.box(.012,.08,.06,silver));q.at([.055,.04,0],{},w=>w.box(.012,.08,.06,silver));});});
  const legCol=(u)=>u<.5?V3.lerp(bay,bayD,u*1.6):blk,lowCol=u=>u>.84?hoof:blk;
  const fu=new Geo(12).tube(loft([[0,.06,0,.11,.1],[.01,-.12,0,.12,.095],[0,-.3,0,.08,.065],[0,-.5,0,.056,.05],[0,-.53,0,.004,.004]]),24,14,{col:legCol});
  const fl=new Geo(13);fl.sph(.058,12,blk,0);fl.tube(loft([[0,.03,0,.004,.004],[0,0,0,.055,.05],[0,-.08,0,.045,.04],[0,-.33,0,.04,.035],[0,-.4,0,.052,.046],[.02,-.45,0,.04,.038],[.03,-.47,0,.056,.05],[.04,-.515,0,.066,.058],[.04,-.52,0,.004,.004]]),30,12,{col:lowCol});
  const hu=new Geo(14).tube(loft([[0,.08,0,.15,.12],[-.04,-.14,0,.135,.1],[-.08,-.34,0,.08,.06],[-.1,-.5,0,.06,.05],[-.1,-.53,0,.004,.004]]),24,14,{col:legCol});
  const hl=new Geo(15);hl.sph(.06,12,blk,0);hl.tube(loft([[0,.03,0,.004,.004],[0,0,0,.06,.05],[0,-.08,0,.045,.04],[.03,-.36,0,.04,.035],[.04,-.42,0,.052,.046],[.06,-.47,0,.04,.038],[.07,-.49,0,.056,.05],[.08,-.535,0,.066,.058],[.08,-.54,0,.004,.004]]),30,12,{col:lowCol});
  const tail=new Geo(16).tube(loft([[0,.02,0,.004,.004],[-.03,0,0,.06,.05],[-.1,-.08,0,.085,.065],[-.16,-.28,0,.1,.075],[-.18,-.52,0,.105,.072],[-.17,-.74,0,.085,.06],[-.15,-.88,0,.05,.035],[-.145,-.92,0,.004,.004]]),34,12,
    {col:(u,a)=>V3.lerp(blk,hex("#33261C"),.5+.5*Math.sin(a*5+u*7))});
  return {body:B,fu,fl,hu,hl,tail,tp:[-.76,1.3],legs:[{piv:[.36,1.02,.14],lp:[0,-.5],ph:.42},{piv:[.36,1.02,-.14],lp:[0,-.5],ph:.52},
    {piv:[-.42,1.04,.15],lp:[-.1,-.5],ph:0,hind:1},{piv:[-.42,1.04,-.15],lp:[-.1,-.5],ph:.1,hind:1,rest:1}]};}
/* Mongolian fat-tailed sheep (a woolly cloud on legs, dark head down grazing) and a brown goat with swept-back horns */
/* cute faces: big front-facing eyes with two sparkles, rosy cheeks, a little nose and a smile, laid on an egg-shaped head */
function w3Cute(q,hc,hr,o){const Wt=hex("#FFFFFF"),Bk=hex("#17110E"),e=o.er,
  S=(c,r,th,ph,off)=>[c[0]+(r[0]+off)*Math.cos(ph)*Math.cos(th),c[1]+(r[1]+off)*Math.sin(ph),c[2]+(r[2]+off)*Math.cos(ph)*Math.sin(th)];
  [1,-1].forEach(sd=>{const th=o.th*sd;
    q.at(S(hc,hr,th,o.ph,-e*.42),{},w=>w.sph(e,12,Wt,0));
    q.at(S(hc,hr,th*.9,o.ph-.05,e*.14),{},w=>w.sph(e*.66,10,Bk,0));
    q.at(S(hc,hr,th*.78,o.ph+.08,e*.8),{},w=>w.sph(e*.25,6,Wt,0));
    q.at(S(hc,hr,th*.98,o.ph-.2,e*.74),{},w=>w.sph(e*.11,5,Wt,0));
    if(o.blush)q.at(S(hc,hr,th*1.16,o.ph-.5,-.006),{s:[.5,.4,1]},w=>w.sph(e*.9,8,o.blush,0));});
  const n=o.sn;if(n){q.at(S(n.c,n.r,0,n.nph,-.003),{s:[.8,.62,1.3]},w=>w.sph(n.nr,8,n.nc,0));
    for(let i=-3;i<=3;i++){const a=i/3;q.at(S(n.c,n.r,a*n.span,n.mph+n.curve*a*a,.0015),{},w=>w.sph(.0064,5,n.mc,0));}}}
/* Mongolian fat-tailed sheep (a woolly cloud on short legs, round dark face, woolly fringe, floppy ears) and a brown goat with swept-back horns */
function w3Sheep(q,goat,R){const C=W3C,hoof=hex("#2A201A");
  if(!goat){const face=hex("#4B3A31"),snout=hex("#6E584A"),leg=hex("#3A2D25");
    [[-.16,-.1],[.17,-.1],[-.16,.1],[.17,.1]].forEach(([lx,lz])=>q.at([lx,0,lz],{},w=>{w.cyl(.04,.044,.38,8,leg);w.cyl(.049,.049,.05,8,hoof,true);}));
    const bl=[];for(let i=0;i<16;i++){const u=R()*2-1,v=R()*2-1,w=R()*2-1;bl.push([u*.27,.56+v*.09,w*.15,.15+R()*.06]);}
    q.blobs(bl,[0,.47,0],.5,10,(P,n)=>V3.mul(C.wool,.84+.16*Math.max(0,n[1])),null,null);q.at([-.35,.5,0],{s:[.11,.13,.13]},w=>w.sph(1,12,C.wool,0));
    const hc=[.41,.61,0],hr=[.13,.125,.118];q.at(hc,{s:hr},w=>w.sph(1,16,face,0));
    const sc=[.512,.556,0],sr=[.058,.05,.07];q.at(sc,{s:sr},w=>w.sph(1,12,snout,0));
    [[.37,.725,0,.085],[.4,.71,.055,.06],[.4,.71,-.055,.06],[.33,.71,.03,.065],[.33,.71,-.03,.065]].forEach(([x,y,z,r])=>q.at([x,y,z],{s:[r,r*.75,r]},w=>w.sph(1,10,C.wool,0)));
    [1,-1].forEach(sd=>q.at([.38,.63,.15*sd],{rx:.45*sd,ry:.2*sd},w=>{w.at([0,0,0],{s:[.034,.018,.075]},v=>v.sph(1,10,face,0));w.at([.012,.004,0],{s:[.02,.01,.055]},v=>v.sph(1,8,hex("#E9A0A6"),0));}));
    w3Cute(q,hc,hr,{er:.047,th:.6,ph:.17,blush:hex("#F38B98"),sn:{c:sc,r:sr,nph:.32,nr:.017,nc:hex("#F2A0A8"),mph:-.55,curve:.38,span:.55,mc:hex("#2A1712")}});}
  else{const gt=C.goat,gd=hex("#5A4030"),snout=hex("#B39274");
    [[-.2,-.1],[.2,-.1],[-.2,.1],[.2,.1]].forEach(([lx,lz])=>q.at([lx,0,lz],{},w=>{w.cyl(.032,.038,.46,8,hex("#4A3828"));w.cyl(.042,.042,.05,8,hoof,true);}));
    q.tube(loft([[-.36,.58,0,.004,.004],[-.33,.58,0,.11,.09],[-.2,.58,0,.16,.13],[.1,.56,0,.16,.13],[.28,.6,0,.13,.1],[.36,.66,0,.004,.004]]),30,14,{sq:.9,col:(u,a)=>V3.lerp(gt,gd,.3*Math.max(0,Math.cos(a)))});
    q.tube(loft([[.22,.62,0,.075,.065],[.32,.7,0,.07,.06],[.4,.76,0,.06,.05]]),14,10,{c:gt});
    const hc=[.44,.79,0],hr=[.115,.108,.1];q.at(hc,{s:hr},w=>w.sph(1,16,gt,0));
    const sc=[.535,.742,0],sr=[.06,.05,.062];q.at(sc,{s:sr},w=>w.sph(1,12,snout,0));
    [1,-1].forEach(sd=>q.tube(loft([[.41,.87,.035*sd,.02,.02],[.37,.96,.055*sd,.016,.016],[.3,1.0,.075*sd,.011,.011],[.24,.97,.085*sd,.004,.004]]),10,6,{c:hex("#3A3128")}));
    [1,-1].forEach(sd=>q.at([.42,.8,.115*sd],{rx:.35*sd,ry:.15*sd},w=>{w.at([0,0,0],{s:[.03,.016,.08]},v=>v.sph(1,10,gt,0));w.at([.01,.004,0],{s:[.018,.009,.058]},v=>v.sph(1,8,hex("#E9A0A6"),0));}));
    q.at([.51,.7,0],{rz:Math.PI+.3},w=>w.cyl(.022,.004,.1,6,gd));q.at([-.36,.62,0],{rz:.9},w=>w.cyl(.025,.005,.12,6,gd));
    w3Cute(q,hc,hr,{er:.041,th:.64,ph:.2,blush:hex("#F3A0A0"),sn:{c:sc,r:sr,nph:.34,nr:.014,nc:hex("#3A2A22"),mph:-.5,curve:.32,span:.5,mc:hex("#2A1712")}});}}
/* ---- small things that make the steppe feel alive ---- */
/* a pond like Monet's: water that mirrors the sky, lily pads with flowers, reeds and cattails on the shore */
function w3Pond(){const g=new Geo(61),P=W3POND,R=g.r,up=[0,1,0],wl=W3WL;
  const pd=(a,e)=>[P[0]+Math.cos(a)*P[2]*e,P[1]+Math.sin(a)*P[3]*e];
  /* lily pads: a disc with a notch, clustered in drifts */
  const pads=[];for(let c=0;c<7;c++){const a=R()*6.283,e=Math.sqrt(R())*.6;const [cx,cz]=pd(a,e);for(let i=0;i<9;i++){const b=R()*6.283,d=R()*1.4;const x=cx+Math.cos(b)*d,z=cz+Math.sin(b)*d;
    if(Math.hypot((x-P[0])/P[2],(z-P[1])/P[3])<.86)pads.push([x,z,.16+R()*.2,R()*6.283]);}}
  const pc=[hex("#4F7F3A"),hex("#6A9444"),hex("#3E6E3A"),hex("#7FA04E")];
  pads.forEach(([x,z,r,rot],i)=>{const c=pc[i%4],y=wl+.012+(i%3)*.002,N=14;for(let k=0;k<N;k++){if(k===0)continue;const a0=rot+k/N*6.283,a1=rot+(k+1)/N*6.283;
      g.vx([x,y,z],up,V3.mul(c,.9),0);g.vx([x+Math.cos(a1)*r,y,z+Math.sin(a1)*r],up,c,0);g.vx([x+Math.cos(a0)*r,y,z+Math.sin(a0)*r],up,c,0);}
    if(i%4===1){const fc=i%8===1?hex("#F2B6C8"):hex("#F7F2E8"),cc=hex("#F2C94C"),fy=y+.02;
      for(let k=0;k<8;k++){const a=rot+k/8*6.283,o=r*.16,ux=Math.cos(a),uz=Math.sin(a),tx=-uz,tz=ux;
        g.vx([x+ux*o*.2,fy,z+uz*o*.2],up,V3.mul(fc,.85),0);g.vx([x+ux*o*1.6+tx*o*.45,fy+o*.9,z+uz*o*1.6+tz*o*.45],up,fc,0);g.vx([x+ux*o*1.6-tx*o*.45,fy+o*.9,z+uz*o*1.6-tz*o*.45],up,fc,0);}
      g.at([x,fy+.01,z],{},q=>q.sph(r*.07,8,cc,0));}});
  /* reeds and cattails standing in the shallows */
  const reed=hex("#6E8F3E"),reed2=hex("#9DAF5A"),cat=hex("#5A3A22");
  for(let i=0;i<90;i++){const a=R()*6.283,e=.93+R()*.28;const [cx,cz]=pd(a,e),n=4+Math.floor(R()*5);
    for(let k=0;k<n;k++){const x=cx+(R()-.5)*.35,z=cz+(R()-.5)*.35,y=Math.max(w3H(x,z),wl)-.05,h=.7+R()*.8,th=R()*Math.PI,w=.012+R()*.01,lx=(R()-.5)*.25,lz=(R()-.5)*.25,c=V3.lerp(reed,reed2,R());
      g.vx([x-Math.cos(th)*w,y,z-Math.sin(th)*w],up,V3.mul(c,.7),0);g.vx([x+Math.cos(th)*w,y,z+Math.sin(th)*w],up,V3.mul(c,.7),0);g.vx([x+lx,y+h,z+lz],up,c,1);
      if(R()<.18){const top=[x+lx*.7,y+h*.72,z+lz*.7];g.at(top,{},q=>q.cyl(.022,.022,.14,8,cat));}}}
  /* the water itself */
  const w=new Geo(62),RS=[0,.15,.3,.45,.6,.72,.84,.95,1.05,1.15,1.3],SG=72;
  for(let i=0;i<RS.length-1;i++)for(let j=0;j<SG;j++){const a0=j/SG*6.283,a1=(j+1)/SG*6.283,q=(a,e)=>{const [x,z]=pd(a,e);return [x,wl,z];};
    const A=q(a0,RS[i]),B=q(a1,RS[i]),C=q(a1,RS[i+1]),D=q(a0,RS[i+1]),col=[.12,.22,.24];
    [A,C,B,A,D,C].forEach(p=>w.vx(p,up,col,0));}
  return {deco:g,water:w};}
/* Stipa feather grass (хялгана): silky plumes that lean with the wind */
function w3Stipa(G,cx,cz){const R=G.r,up=[0,1,0],stem=hex("#8EA35A"),pl=hex("#DCD8C0"),pl2=hex("#C9C6A4"),wd=[.944,.33];
  for(let p=0;p<22;p++){const a=R()*6.283,r=2.5+38*Math.pow(R(),1.3),px=cx+Math.sin(a)*r,pz=cz-Math.cos(a)*r,n=10+Math.floor(R()*24),rad=.8+R()*2.4;
    for(let i=0;i<n;i++){const b=R()*6.283,d=Math.sqrt(R())*rad,x=px+Math.cos(b)*d,z=pz+Math.sin(b)*d;if(R()<w3Bare(x,z))continue;
      const rc=Math.hypot(x-cx,z-cz),s=Math.pow(Math.max(1,rc/9),.55),y=w3H(x,z)-.01,h=(.45+R()*.3)*s,lx=(R()-.5)*.08*s,top=[x+lx+wd[0]*.05*s,y+h,z+wd[1]*.05*s],sw=.005*s,th=R()*Math.PI;
      G.vx([x-Math.cos(th)*sw,y,z-Math.sin(th)*sw],up,V3.mul(stem,.8),0);G.vx([x+Math.cos(th)*sw,y,z+Math.sin(th)*sw],up,V3.mul(stem,.8),0);G.vx(top,up,stem,.8);
      const L=(.28+R()*.16)*s,W=.012*s,c=V3.lerp(pl,pl2,R());let prev=null;
      for(let k=0;k<=4;k++){const f=k/4,pt=[top[0]+wd[0]*L*f*.9,top[1]+L*(.25*f-.75*f*f)*.5,top[2]+wd[1]*L*f*.9],ww=W*(1-f*.8),pa=[pt[0]-wd[1]*ww,pt[1],pt[2]+wd[0]*ww],pb=[pt[0]+wd[1]*ww,pt[1],pt[2]-wd[0]*ww],sv=.8+f*.6;
        if(prev){G.vx(prev[0],up,c,prev[2]);G.vx(prev[1],up,c,prev[2]);G.vx(pb,up,c,sv);G.vx(prev[0],up,c,prev[2]);G.vx(pb,up,c,sv);G.vx(pa,up,c,sv);}prev=[pa,pb,sv];}}}}
/* butterflies (wings fold as they flap) and soaring kites */
function w3Butterfly(){const g=new Geo(71),up=[0,1,0],wc=[1,1,1],bd=[.12,.1,.09];
  [1,-1].forEach(s=>{g.vx([.01,0,0],up,wc,0);g.vx([.05,0,.075*s],up,wc,0);g.vx([-.025,0,.085*s],up,wc,0);g.vx([-.005,0,0],up,wc,0);g.vx([-.03,0,.06*s],up,wc,0);g.vx([-.05,0,.03*s],up,wc,0);});
  g.at([0,0,0],{rz:Math.PI/2},q=>q.cyl(.006,.004,.05,5,bd));return g;}
function w3Kite(){const g=new Geo(72),up=[0,1,0],c=hex("#3B2E26"),c2=hex("#5A463A");
  [1,-1].forEach(s=>{g.vx([.18,0,0],up,c,0);g.vx([-.16,0,0],up,c,0);g.vx([.02,.12,1.05*s],up,c2,0);g.vx([.18,0,0],up,c,0);g.vx([.02,.12,1.05*s],up,c2,0);g.vx([.12,.06,.55*s],up,c2,0);});
  g.vx([-.12,0,0],up,c,0);g.vx([-.42,0,.12],up,c2,0);g.vx([-.42,0,-.12],up,c2,0);g.at([.2,0,0],{},q=>q.sph(.07,6,c,0));return g;}
/* bake a whole horse (body, legs, tail) into one mesh for the distant herd, with its own coat */
function w3MergeInto(dst,src,m,recol){const v=src.v;for(let i=0;i<v.length;i+=10){const x=v[i],y=v[i+1],z=v[i+2],nx=v[i+3],ny=v[i+4],nz=v[i+5];
    const p=[m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14]],n=V3.norm([m[0]*nx+m[4]*ny+m[8]*nz,m[1]*nx+m[5]*ny+m[9]*nz,m[2]*nx+m[6]*ny+m[10]*nz]);
    dst.vx(p,n,recol([v[i+6],v[i+7],v[i+8]]),0);}}
function w3Herd(HG){const g=new Geo(81),R=g.r,coats=[hex("#8C4C22"),hex("#E8E2D4"),hex("#5A3420"),hex("#C9A46A"),hex("#2A2420"),hex("#B0703A"),hex("#9A9690")];
  for(let i=0;i<7;i++){const x=-36+(R()-.5)*14,z=9+(R()-.5)*12,coat=coats[i],hm=M4.trs([x,w3H(x,z),z],{ry:R()*6.28});
    const rc=c=>{const l=c[0]*.3+c[1]*.55+c[2]*.15;return l<.16?c:V3.mul(coat,Math.min(1.25,l/.36));};
    w3MergeInto(g,HG.body,hm,rc);w3MergeInto(g,HG.tail,M4.mul(hm,M4.T(HG.tp[0],HG.tp[1],0)),rc);
    HG.legs.forEach(L=>{const a1=(R()-.5)*.2,up=M4.mul(hm,M4.mul(M4.T(L.piv[0],L.piv[1],L.piv[2]),M4.Rz(a1)));w3MergeInto(g,L.hind?HG.hu:HG.fu,up,rc);
      w3MergeInto(g,L.hind?HG.hl:HG.fl,M4.mul(up,M4.mul(M4.T(L.lp[0],L.lp[1],0),M4.Rz(-a1*.5))),rc);});}
  return g;}
function w3HorseMeshes(W,G){const o={cast:1,tex:.1,brush:.55,brushS:6},H={body:w3Mesh(W,G.body,o),tail:w3Mesh(W,G.tail,o),tp:G.tp,legs:[]};
  G.legs.forEach(L=>H.legs.push(Object.assign({},L,{up:w3Mesh(W,L.hind?G.hu:G.fu,o),lo:w3Mesh(W,L.hind?G.hl:G.fl,o)})));return H;}
/* stand (one hind hoof resting) or gallop: legs swing from hip and shoulder, knees and hocks fold, the tail streams out */
function w3HorsePose(H,hm,g,t,amp,trot){const run=g!=null;amp=run?(amp??1):0;H.body.m=hm;
  H.legs.forEach((L,i)=>{let a1=0,a2=0;if(run){const p=(g+(trot?[0,.5,.5,0][i]:L.ph))*Math.PI*2,s=Math.sin(p),c=Math.max(0,Math.cos(p));
      if(L.hind){a1=(trot?.3*s-.03:.42*s-.06)*amp;a2=c*(trot?.75:.95)*amp;}else{a1=(trot?.36*s+.04:.52*s+.06)*amp;a2=-c*(trot?1.05:1.35)*amp;}}
    else if(L.rest){a1=.05;a2=.24+.04*Math.sin(t*.7);}
    const up=M4.mul(hm,M4.mul(M4.T(L.piv[0],L.piv[1],L.piv[2]),M4.Rz(a1)));L.up.m=up;L.lo.m=M4.mul(up,M4.mul(M4.T(L.lp[0],L.lp[1],0),M4.Rz(a2)));});
  const sw=run?Math.sin(g*Math.PI*2)*.08:Math.sin(t*1.7)*.24*Math.max(0,Math.sin(t*.37)),lift=(trot?-.3:-.55)*amp;
  H.tail.m=M4.mul(hm,M4.mul(M4.T(H.tp[0],H.tp[1],0),M4.mul(M4.Ry(sw),M4.Rz(lift))));}
/* ---- inside the main ger. The door faces south (+z), the place of honour (хоймор) is north (−z), the men's side is west (−x),
   the women's side east (+x), the hearth in the very middle. William of Rubruck (1253–55) saw the master's couch at the north,
   women on the east and men on the west, a bench with a skin of drink and cups at the entry, and men milking the mares.
   Smaller things (chest painting, the cupboard) follow today's tradition and are only a likely picture of that time. ---- */
const GER_DOOR=.23;
const GER_SPOTS=[
 {id:"hearth",p:[0,.45,0],r:1.05,t:"Гал голомт",d:"Гал голомт гэрийн яг төвд байрладаг. Хоол хийж, гэрийг дулаацуулдаг тул айлын амьдралын төв гэж хүндэлдэг байжээ. XIII зууны гэрийн төвд гал түлдэг байсныг Рубрук тэмдэглэсэн."},
 {id:"pillar",p:[0,1.2,-.22],r:.75,t:"Багана",d:"Хоёр багана тоонын доор зогсож, дээврийн бүтцийг тулж тогтооно. Хоёр баганын дундуур гарахыг цээрлэдэг уламжлал бий."},
 {id:"khoimor",p:[0,.5,-1.6],r:1.2,t:"Хоймор",d:"Хоймор нь хаалганы эсрэг, хойд талд байрлах гэрийн хамгийн хүндтэй хэсэг. Айлын эзэн, хүндтэй зочид энд суудаг, үнэт зүйлээ авдарт хадгалдаг. XIII зуунд айлын эзний суудал хойд талд байсныг Рубрук тэмдэглэжээ."},
 {id:"west",p:[-1.55,.6,.55],r:1.05,t:"Баруун тал: эрэгтэй тал",d:"Гэрийн баруун тал уламжлал ёсоор эрэгтэй тал. Эмээл, хазаар, нум сум зэрэг эрчүүдийн эдлэлийг энд байрлуулдаг. Морь, мал маллах нь малчин айлын өдөр тутмын амьдралын гол хэсэг байв."},
 {id:"churn",p:[-1.2,.5,1.45],r:.85,t:"Хөхүүр, айраг",d:"Хөхүүр бол айраг исгэдэг арьсан сав. Рубрукийн тэмдэглэлээр тэр үед гүүг эрчүүд сааж, хаалганы дэргэд ундаатай арьсан сав, аяга тавьдаг байжээ. Өнөөдөр ч хөхүүрийг баруун талд, хаалганы ойролцоо байрлуулдаг."},
 {id:"east",p:[1.5,.6,.8],r:1.05,t:"Зүүн тал: эмэгтэй тал",d:"Гэрийн зүүн тал уламжлал ёсоор эмэгтэй тал. Хоол хийх, сүү цагаан идээ боловсруулах, ус хадгалах сав суулгыг энд байрлуулдаг. Рубрукийн тэмдэглэлээр үнээг эмэгтэйчүүд саадаг байжээ."},
 {id:"table",p:[0,.4,-.95],r:.7,t:"Намхан ширээ",d:"Хоймрын өмнөх намхан ширээн дээр цай, хоол, цагаан идээгээ тавина. Ааруул идээд үзээрэй!"},
 {id:"door",p:[0,1,1.75],r:.8,t:"Хаалга",d:"Гэрийн хаалга урд зүг рүү харсан байдаг. Ингэснээр хойд, баруун хойд зүгийн хүйтэн салхинаас хамгаалагдаж, өдрийн турш нарны гэрэл гэрт тусдаг."},
 {id:"wall",p:null,r:0,t:"Хана, унь",d:"Хана бол эвхэж, дэлгэдэг сараалжин модон хэрээс. Унь нь тооно болон хананы толгойг холбож, дээврийн хэлбэрийг үүсгэнэ. Ийм бүтэцтэй учраас гэрийг хурдан буулгаж, нүүлгэж болдог."},
 {id:"toono",p:[0,2.14,0],r:0,t:"Тооно",d:"Тооно бол дээврийн төвд байрлах дугуй цагираг. Тооноор гэрэл нэвтэрч, агаар сэлгэгдэн, галын утаа гадагшилна. Тооноор туссан нарны гэрлээр өдрийн цагийг баримжаалдаг байжээ."}];
function w3GerInside(){const I=new Geo(41),F=new Geo(42),P=Math.PI,
  K={felt:hex("#EFE4CC"),rug:hex("#A3312A"),rug2:hex("#E3B347"),rug3:hex("#284C8C"),khana:hex("#C7843F"),uni:hex("#D4602C"),uni2:hex("#B84A22"),bag:hex("#E0782C"),
     paint:hex("#2E68B4"),paint2:hex("#22A090"),gold:hex("#E7B53F"),bl:hex("#3456A8"),bl2:hex("#C23B2E"),pil:hex("#F1E3C4"),iron:hex("#2B2A2E"),iron2:hex("#45444A"),
     stone:hex("#6E655C"),ash:hex("#3A322C"),wood:hex("#9A6232"),wood2:hex("#6B4122"),leather:hex("#7A4520"),leather2:hex("#5A3216"),cream:hex("#F6ECD2"),bowl:hex("#C9B48A"),rope:hex("#E9DFC6")};
  const inDoor=a=>Math.abs(Math.atan2(Math.sin(a-P/2),Math.cos(a-P/2)))<GER_DOOR+.08;
  /* the ry that turns a thing's front (+z) toward the hearth */
  const face=(x,z)=>Math.atan2(-x,-z);
  /* floor: felt and a big round rug */
  I.at([0,.004,0],{},q=>q.cyl(2.27,2.27,.008,48,K.felt,true));
  [[1.5,K.rug],[1.38,K.rug2],[1.3,K.rug],[.62,K.rug3],[.55,K.rug]].forEach(([r,c],i)=>I.at([0,.013+i*.004,0],{},q=>q.cyl(r,r,.004,40,c,true)));
  /* lattice wall (хана) with a gap for the door, a band along its top, and roof poles (унь) that rest on it and reach the crown (тооно) */
  for(let k=0;k<46;k++){const a=k/46*P*2;if(inDoor(a))continue;[1,-1].forEach(sg=>I.at([Math.cos(a)*2.24,.66,Math.sin(a)*2.24],{ry:-a-P/2,rz:sg*.62},q=>q.box(.022,1.5,.022,K.khana)));}
  for(let k=0;k<64;k++){const a=(k+.5)/64*P*2;if(inDoor(a))continue;I.at([Math.cos(a)*2.225,1.285,Math.sin(a)*2.225],{ry:-a-P/2},q=>q.box(2.225*2*P/64+.01,.05,.03,K.rope));}
  for(let k=0;k<40;k++){const a=k/40*P*2;I.at([Math.cos(a)*1.42,1.72,Math.sin(a)*1.42],{ry:-a,rz:-.483},q=>q.box(1.81,.032,.032,k%2?K.uni:K.uni2));}
  I.at([0,2.14,0],{},q=>q.cyl(.62,.62,.07,28,K.uni2,false));
  /* painted door frame on the inside */
  [-.5,.5].forEach(x=>I.at([x,.63,2.16],{},q=>q.box(.08,1.26,.08,K.bag)));I.at([0,1.28,2.16],{},q=>{q.box(1.08,.09,.09,K.bag);q.at([0,0,-.046],{},w=>w.box(.7,.05,.004,K.gold));});
  I.at([0,.03,2.12],{},q=>q.box(1.0,.06,.14,K.wood2));
  /* two pillars (багана) beside the hearth, up to the crown */
  [-.42,.42].forEach(x=>{I.at([x,1.07,-.22],{},q=>q.box(.1,2.14,.1,K.bag));[.45,.95,1.45,1.9].forEach((y,i)=>I.at([x,y,-.22],{},q=>q.box(.112,.07,.112,i%2?K.gold:K.paint)));});
  /* hearth: stone ring, ashes, iron tripod (тулга) and cauldron (тогоо) */
  I.at([0,0,0],{},q=>{q.cyl(.44,.42,.12,20,K.stone,true);q.at([0,.121,0],{},w=>w.cyl(.34,.34,.004,20,K.ash,true));
    for(let k=0;k<3;k++){const a=k/3*P*2+.5;q.at([Math.cos(a)*.27,.36,Math.sin(a)*.27],{ry:-a,rz:-.32},w=>w.box(.03,.5,.03,K.iron));}
    q.at([0,.56,0],{},w=>w.cyl(.27,.27,.035,20,K.iron2,false));q.at([0,.6,0],{s:[1,.62,1]},w=>w.sph(.27,16,K.iron,0));q.at([0,.75,0],{},w=>w.cyl(.24,.24,.01,18,hex("#C9C1A8"),true));});
  for(let k=0;k<6;k++){const a=k/6*P*2;F.at([Math.cos(a)*.14,.12,Math.sin(a)*.14],{},q=>q.cyl(.07,0,.2+(k%3)*.06,8,k%2?hex("#FF9A2E"):hex("#FFC93D"),false,0));}
  F.at([0,.12,0],{},q=>q.cyl(.09,0,.34,8,hex("#FFE07A"),false,0));
  /* хоймор: the householder's couch along the north wall, painted chests on both sides of it */
  I.at([0,0,-1.62],{},q=>{q.at([0,.15,0],{},w=>w.box(1.5,.3,.7,K.bag));q.at([0,.16,.352],{},w=>{w.box(1.36,.2,.008,K.paint);[-.45,0,.45].forEach(x=>w.at([x,0,.006],{rz:.785},v=>v.box(.11,.11,.006,K.gold)));});
    q.at([0,.34,0],{},w=>w.box(1.46,.08,.66,K.pil));q.at([0,.4,.05],{},w=>w.box(1.48,.04,.56,K.bl2));q.at([0,.425,.05],{},w=>w.box(1.49,.012,.1,K.gold));
    [-.56,.56].forEach(x=>q.at([x,.5,-.18],{},w=>w.box(.32,.14,.24,K.cream)));});
  [[-1.28,-1.46,0],[1.28,-1.46,1]].forEach(([x,z,i])=>I.at([x,0,z],{ry:face(x,z)},q=>{q.at([0,.27,0],{},w=>w.box(.82,.54,.44,K.bag));q.at([0,.3,.222],{},w=>{w.box(.62,.34,.01,i?K.paint2:K.paint);w.at([0,0,.006],{rz:.785},v=>v.box(.16,.16,.006,K.gold));});
    q.at([0,.545,0],{},w=>w.box(.84,.02,.46,K.wood2));
    if(i)q.at([0,.6,0],{},w=>{w.cyl(.09,.06,.07,14,K.bowl);w.at([0,.07,0],{},v=>v.cyl(.08,.08,.004,14,hex("#F4EEDC"),true));});
    else q.at([-.15,.57,0],{},w=>w.box(.3,.04,.2,hex("#7FB6E8")));}));
  /* a low table in front of the couch */
  I.at([0,0,-.95],{},q=>{[[-.33,-.17],[.33,-.17],[-.33,.17],[.33,.17]].forEach(([x,z])=>q.at([x,.15,z],{},w=>w.box(.05,.3,.05,K.wood2)));q.at([0,.315,0],{},w=>w.box(.8,.04,.46,K.bag));
    q.at([0,.317,.232],{},w=>w.box(.6,.03,.008,K.gold));q.at([.25,.335,0],{},w=>{w.cyl(.07,.05,.06,12,K.bowl);w.at([0,.06,0],{},v=>v.cyl(.065,.065,.004,12,hex("#E9DDBE"),true));});
    q.at([-.05,.335,0],{},w=>w.cyl(.15,.14,.015,18,hex("#D8C79C")));});
  /* sleeping places along the west and east walls, north of the middle */
  [-1,1].forEach(sd=>{const x=sd*1.6;I.at([x,0,-.3],{},q=>{q.at([0,.15,0],{},w=>w.box(.62,.3,1.1,K.bag));
    q.at([-sd*.32,.15,0],{},w=>{w.box(.012,.22,1.0,K.paint);[-.33,0,.33].forEach(z=>w.at([0,0,z],{rx:.785},v=>v.box(.014,.11,.11,K.gold)));});
    q.at([0,.34,0],{},w=>w.box(.58,.08,1.06,K.pil));q.at([0,.4,.12],{},w=>w.box(.6,.04,.72,sd<0?K.bl:K.rug2));q.at([0,.42,-.4],{},w=>w.box(.44,.11,.22,K.cream));});});
  /* men's side (west), by the door: saddle on its stand, bridle on the lattice, bow and quiver */
  I.at([-1.62,0,.62],{ry:P/2},q=>{q.at([0,.25,0],{},w=>w.box(.12,.5,.5,K.wood2));q.at([0,.55,0],{},w=>w.box(.36,.08,.55,K.leather));q.at([0,.63,.2],{},w=>w.box(.3,.12,.08,K.leather2));q.at([0,.62,-.22],{},w=>w.box(.3,.1,.08,K.leather2));
    [-1,1].forEach(sd=>q.at([sd*.2,.38,0],{},w=>w.box(.02,.32,.1,K.leather2)));q.at([0,.6,0],{},w=>w.box(.38,.02,.3,K.bl2));});
  I.at([-2.14,1.05,.05],{ry:P/2+.05},q=>{for(let i=0;i<9;i++){const a=i/8*P;q.at([Math.cos(a)*.16,-Math.sin(a)*.32,0],{rz:a},w=>w.box(.02,.08,.012,K.leather2));}q.at([0,.02,0],{},w=>w.box(.36,.025,.02,K.leather));});
  I.at([-2.12,1.0,1.0],{ry:P/2+.3},q=>{for(let i=0;i<7;i++){const u=i/6-.5,y=u*1.0,x=-.12*(1-4*u*u);q.at([x,y,0],{rz:-u*.9},w=>w.box(.03,.16,.03,i===3?K.leather:K.wood2));}q.at([-.12,0,0],{},w=>w.box(.004,1.0,.004,hex("#E8E0C8")));});
  I.at([-2.02,.8,1.3],{ry:P/2+.4,rz:.25},q=>{q.cyl(.07,.06,.55,10,K.leather);q.at([0,.55,0],{},w=>{for(let i=0;i<4;i++)w.at([(i-1.5)*.03,0,0],{},v=>{v.cyl(.006,.006,.16,4,K.wood);v.at([0,.16,0],{},u=>u.box(.03,.04,.004,hex("#EDE6D6")));});});});
  /* by the entry on the men's side: the leather bag for airag (хөхүүр) with its stirring stick, and a bench with cups */
  I.at([-1.2,0,1.45],{},q=>{q.at([0,.32,0],{s:[1,1.25,1]},w=>w.sph(.24,14,K.leather,.04));q.at([0,.58,0],{},w=>w.cyl(.08,.08,.1,10,K.leather2));q.at([0,.6,0],{rz:.12},w=>w.cyl(.018,.018,.75,6,K.wood));});
  I.at([-.82,0,1.78],{ry:-.5},q=>{[[-.2,-.07],[.2,-.07],[-.2,.07],[.2,.07]].forEach(([x,z])=>q.at([x,.1,z],{},w=>w.box(.04,.2,.04,K.wood2)));q.at([0,.21,0],{},w=>w.box(.5,.03,.2,K.wood));
    [-.13,0,.13].forEach(x=>q.at([x,.225,0],{},w=>{w.cyl(.035,.028,.04,10,K.bowl);w.at([0,.04,0],{},v=>v.cyl(.032,.032,.003,10,hex("#F3EAD2"),true));}));});
  /* women's side (east): cupboard with bowls, a milk bucket, the water barrel by the door */
  I.at([1.76,0,.72],{ry:face(1.76,.72)},q=>{q.at([0,.38,0],{},w=>w.box(.62,.76,.34,K.bag));q.at([0,.4,.172],{},w=>{w.box(.5,.26,.008,K.paint2);w.at([0,0,.005],{rz:.785},v=>v.box(.1,.1,.005,K.gold));});
    q.at([0,.77,0],{},w=>w.box(.64,.02,.36,K.wood2));[-.18,0,.18].forEach(x=>q.at([x,.8,0],{},w=>{w.cyl(.06,.04,.05,12,K.bowl);w.at([0,.05,0],{},v=>v.cyl(.055,.055,.003,12,hex("#F4EEDC"),true));}));});
  I.at([1.3,0,1.1],{},q=>{q.cyl(.13,.11,.3,14,K.wood);q.at([0,.3,0],{},w=>w.cyl(.12,.12,.004,14,hex("#F8F2E2"),true));[.06,.24].forEach(y=>q.at([0,y,0],{},w=>w.cyl(.135,.135,.02,14,K.iron2,false)));});
  I.at([1.0,0,1.62],{},q=>{q.cyl(.22,.2,.6,16,K.wood);[.12,.48].forEach(y=>q.at([0,y,0],{},w=>w.cyl(.225,.225,.03,16,K.iron2,false)));q.at([0,.6,0],{},w=>w.cyl(.2,.2,.006,16,hex("#3A6E8A"),true));});
  return {I,F};}
function w3AaruulRack(n){const g=new Geo(55),R=chRng(55);g.at([5.1,w3H(5.1,1.9),1.9],{ry:-.5},q=>{for(let i=0;i<18;i++){const ry=R();if(i>=n)continue;q.at([-.48+(i%9)*.12,.79,-.18+Math.floor(i/9)*.32],{ry},w=>w.box(.09,.05,.07,W3C.cream));}});return g;}
function w3AaruulPlate(n){const g=new Geo(56),R=chRng(56);g.at([-.05,.35,-.95],{},q=>{for(let i=0;i<6;i++){const ry=R(),a=i/6*Math.PI*2;if(i>=n)continue;q.at([Math.cos(a)*.07,0,Math.sin(a)*.07],{ry},w=>w.box(.06,.035,.045,W3C.cream));}});return g;}
function w3Rebuf(W,m,geo){const gl=W.gl;gl.bindBuffer(gl.ARRAY_BUFFER,m.b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(geo.v.length?geo.v:[0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0]),gl.STATIC_DRAW);m.n=Math.max(3,geo.v.length/10);if(!geo.v.length)m.on=false;}
/* ---------- Amy's ger from Blender (glTF, ch1/ger_lite.json) replaces the drawn gers ----------
   Read once per page: the main ger keeps everything, its doors swung open; the two neighbours get only the outside, doors shut.
   Triangles are merged per material and stored as pos,normal,colour,sway,uv (48 bytes) so the world's own shader draws them. */
let W3GLB=null;
function w3GerData(){if(W3GLB)return W3GLB;
  W3GLB=(async()=>{const r=await fetch(W3BASE+"ger_lite.json");if(!r.ok)throw new Error("ger "+r.status);const J=await r.json();
    const u=J.buffers[0].uri,s=atob(u.slice(u.indexOf(",")+1)),u8=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u8[i]=s.charCodeAt(i);const bin=u8.buffer;
    const acc=i=>{const a=J.accessors[i],bv=J.bufferViews[a.bufferView],nc={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],T={5126:Float32Array,5125:Uint32Array,5123:Uint16Array,5121:Uint8Array}[a.componentType],
      bs=T.BYTES_PER_ELEMENT,off=(bv.byteOffset||0)+(a.byteOffset||0),st=bv.byteStride||nc*bs;let d;
      if(st===nc*bs&&off%bs===0)d=new T(bin,off,a.count*nc);else{d=new T(a.count*nc);const dv=new DataView(bin);for(let k=0;k<a.count;k++)for(let c=0;c<nc;c++){const o=off+k*st+c*bs;d[k*nc+c]=T===Float32Array?dv.getFloat32(o,true):bs===4?dv.getUint32(o,true):bs===2?dv.getUint16(o,true):dv.getUint8(o);}}
      if(a.normalized&&T!==Float32Array){const f=new Float32Array(d.length),mx=bs===2?65535:255;for(let k=0;k<d.length;k++)f[k]=d[k]/mx;d=f;}return d;};
    const trs=n=>{if(n.matrix)return n.matrix.slice();const [x,y,z,w]=n.rotation||[0,0,0,1],[sx,sy,sz]=n.scale||[1,1,1],[tx,ty,tz]=n.translation||[0,0,0];
      return [(1-2*(y*y+z*z))*sx,(2*(x*y+z*w))*sx,(2*(x*z-y*w))*sx,0,(2*(x*y-z*w))*sy,(1-2*(x*x+z*z))*sy,(2*(y*z+x*w))*sy,0,(2*(x*z+y*w))*sz,(2*(y*z-x*w))*sz,(1-2*(x*x+y*y))*sz,0,tx,ty,tz,1];};
    const mul=(a,b)=>{const o=new Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let v=0;for(let k=0;k<4;k++)v+=a[k*4+r]*b[c*4+k];o[c*4+r]=v;}return o;};
    const EXT=/^(Felt_Roof_Exterior|Felt_Wall_Exterior|Felt_Skirt_Exterior|Felt_DoorEdge_Thickness|Rope_|Door_|Toono_)/,CAST=/^(Felt_|Rope_|Door_|Toono_|Uni_|Khana_)/;
    const sets={main:new Map(),ext:new Map()};
    const put=(set,key,mat,cast,inner,st,sec)=>{let B=sets[set].get(key);if(!B){B={mat,cast,inner,st,sec,a:[]};sets[set].set(key,B);}return B.a;};
    const walk=(ni,P,root)=>{const n=J.nodes[ni],M=mul(P,trs(n)),r=root||n.name||"";
      if(n.mesh!=null){const ext=EXT.test(r),cast=CAST.test(r)?1:0,dl=/^Door_Leaf_Left/.test(r),dr=/^Door_Leaf_Right/.test(r),gs=W3STAGE(r,n.name||""),NS=W3SECN[gs]||0;
        for(const pr of J.meshes[n.mesh].primitives){if(pr.mode!=null&&pr.mode!==4)continue;const pos=acc(pr.attributes.POSITION),nrm=pr.attributes.NORMAL!=null?acc(pr.attributes.NORMAL):null,uv=pr.attributes.TEXCOORD_0!=null?acc(pr.attributes.TEXCOORD_0):null,
          idx=pr.indices!=null?acc(pr.indices):null,cnt=idx?idx.length:pos.length/3,mi=pr.material!=null?pr.material:-1;
          const emit=(set,open)=>{const kk=mi+"|"+cast+"|"+(ext?0:1)+"|"+gs,o0=NS?null:put(set,kk,mi,cast,!ext,gs,-1),tri=[];const out={push:(...a)=>{if(!NS){o0.push(...a);return;}tri.push(a);if(tri.length<3)return;const cx=(tri[0][0]+tri[1][0]+tri[2][0])/3,cz=(tri[0][2]+tri[1][2]+tri[2][2])/3,sc=Math.min(NS-1,Math.floor((Math.atan2(cx,cz)+Math.PI)/(2*Math.PI)*NS));const o=put(set,kk+"|"+sc,mi,cast,!ext,gs,sc);for(const q of tri)o.push(...q);tri.length=0;}};
            for(let k=0;k<cnt;k++){const v=idx?idx[k]:k;let x=pos[v*3],y=pos[v*3+1],z=pos[v*3+2],X=M[0]*x+M[4]*y+M[8]*z+M[12],Y=M[1]*x+M[5]*y+M[9]*z+M[13],Z=M[2]*x+M[6]*y+M[10]*z+M[14];
              let nx=0,ny=1,nz=0;if(nrm){const a=nrm[v*3],b=nrm[v*3+1],c=nrm[v*3+2];nx=M[0]*a+M[4]*b+M[8]*c;ny=M[1]*a+M[5]*b+M[9]*c;nz=M[2]*a+M[6]*b+M[10]*c;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;}
              if(open&&(dl||dr)){const hx=dl?-.43:.43,hz=3.49,t=(dl?-95:95)*Math.PI/180,cs=Math.cos(t),sn=Math.sin(t),qx=X-hx,qz=Z-hz;X=hx+qx*cs+qz*sn;Z=hz-qx*sn+qz*cs;const ax=nx*cs+nz*sn;nz=-nx*sn+nz*cs;nx=ax;}
              out.push(X,Y,Z,nx,ny,nz,1,1,1,0,uv?uv[v*2]:0,uv?uv[v*2+1]:0);}};
          if(!(dl||dr)){emit("main",true);if(ext)emit("ext",false);}}}
      (n.children||[]).forEach(c=>walk(c,M,r));};
    const I=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];(J.scenes[J.scene||0].nodes).forEach(ni=>walk(ni,I,null));
    const texImg=ti=>{if(ti==null)return null;const t=J.textures[ti],src=(t.extensions&&t.extensions.EXT_texture_webp&&t.extensions.EXT_texture_webp.source)??t.source;return src==null?null:J.images[src].uri;};
    const mats=(J.materials||[]).map(m=>{const p=m.pbrMetallicRoughness||{},em=m.emissiveTexture?texImg(m.emissiveTexture.index):null,base=p.baseColorTexture?texImg(p.baseColorTexture.index):null;
      const f=(p.baseColorFactor||[1,1,1,1]).slice(0,3);return {uri:em||base,f,emit:!!em};});
    mats.push({uri:null,f:[.8,.8,.8],emit:false});
    await Promise.all(mats.map(m=>m.uri?new Promise(ok=>{const im=new Image();im.decoding="async";im.onload=()=>{m.img=im;ok();};im.onerror=()=>ok();im.src=W3URL(m.uri);}):null));
    const pack=set=>[...sets[set].values()].map(B=>({mat:B.mat<0?mats.length-1:B.mat,cast:B.cast,inner:B.inner,st:B.st,sec:B.sec,v:new Float32Array(B.a),n:B.a.length/12}));
    return {main:pack("main"),ext:pack("ext"),mats};})();
  W3GLB.catch(()=>{W3GLB=null;});return W3GLB;}
function w3GerAttach(W,P){w3GerData().then(D=>{const gl=W.gl;if(!gl||(gl.isContextLost&&gl.isContextLost())||!P.m||!P.m.gerOld)return;
  const pot=v=>v>0&&(v&(v-1))===0;
  const tex=D.mats.map(m=>{if(!m.img)return null;const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,m.img);
    if(pot(m.img.width)&&pot(m.img.height)){gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);}
    else{gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);}
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);if(W.aniso)gl.texParameterf(gl.TEXTURE_2D,W.aniso.TEXTURE_MAX_ANISOTROPY_EXT,4);return t;});
  const up=L=>L.map(B=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,B.v,gl.STATIC_DRAW);return {b,B};});
  const bm=up(D.main),be=up(D.ext);
  W3GERS.forEach(([x,z,s],i)=>{const mm=M4.trs([x,w3H(x,z)*(i?1:0)+.04,z],{s:[s,s,s]});
    (i?be:bm).forEach(({b,B})=>{const mt=D.mats[B.mat],o={b,n:B.n,m:mm,st:48,uv:1,map:tex[B.mat],emit:mt.emit?.9:(B.inner?.17:0),tint:mt.f.slice(),on:true,sky:0,nofog:0,cast:B.cast,tex:0,cld:0,sheen:0,alpha:1,flip:1,water:0,brush:.45,brushS:5};W.meshes.push(o);if(!i){o.gst=B.st;o.gsec=B.sec;o.m0=mm;B.mesh=o;(W.gerParts||(W.gerParts=[])).push(o);}});});
  const m=P.m;m.gerOld.on=false;if(m.inner)m.inner.on=false;if(m.fire)m.fire.on=false;
  if(m.glow)m.glow.m=M4.trs([W3GERS[0][0],.725,W3GERS[0][1]],{s:[1.64,1,1.64]});if(m.aarP)m.aarP.m=M4.trs([.05+W3GERS[0][0],.05,-1.1+W3GERS[0][1]],{});
  Object.assign(S3LOOK,{ger:[0,1.6,0],door:[0,.9,3.5],toono:[0,3.1,0]});
  const SP={hearth:[[0,.5,0],.95],pillar:[[0,1.5,0],.8],khoimor:[[0,.55,-2.95],1.25],west:[[-2.6,.6,-.45],1.25],churn:[[-2.05,.9,1.85],.85],east:[[2.6,.6,-.45],1.25],table:[[0,.42,-2.05],.65],door:[[0,1,3.45],.85],toono:[[0,3.05,0],0]};
  GER_SPOTS.forEach(g=>{const v=SP[g.id];if(v){g.p=v[0];g.r=v[1];}});
  GERX.on=true;}).catch(()=>{});}

/* ---- Amy's Blender horse (MongolianHorse.glb): 70 bones skinned on the GPU, Idle / Eat / Walk / Gallop mixed by speed.
   The old saddle rides on its back and follows the spine. If loading fails the old drawn horses stay. ---- */
const W3INFO={gpu:"",horse:"—",sheep:"—",q:null,ms:0},HX={s:1.15,walk:.81,gallop:3.39},SHX={s:1.02,walk:.5},W3SKD={};
function w3HorseData(){return w3SkinData("horse_bs");}
function w3SkinData(nm){if(W3SKD[nm])return W3SKD[nm];
  const pr=(async()=>{const r=await fetch(W3BASE+""+nm+".json");if(!r.ok)throw new Error(nm+" "+r.status);const J=await r.json();
    const s=atob(J.buf),u8=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u8[i]=s.charCodeAt(i);const bin=u8.buffer;delete J.buf;
    const N=J.nodes.length;J.N=N;J.ibm=new Float32Array(bin,J.ibm,(N-1)*16);J.base=new Float32Array(J.base);
    const dq={};J.prims.forEach(p=>{p.F=p.pq==null?new Float32Array(bin,p.fv,p.nv*8):dq[p.pq]||(dq[p.pq]=hxDeq(bin,p));p.Bt=new Uint8Array(bin,p.bv,p.nv*8);p.I=new Uint16Array(bin,p.ix,p.ni);});
    for(const k in J.anims)J.anims[k].ch=J.anims[k].ch.map(([n,pa,st,to,cnt,vo,q])=>({o:n*10+[0,3,7][pa],d:pa===1?4:3,st,T:new Float32Array(bin,to,cnt),
      V:q?new Int16Array(bin,vo,cnt*4):new Float32Array(bin,vo,cnt*(pa===1?4:3)),k:q?1/32767:1}));
    J.rest=new Float32Array(N*10);J.nodes.forEach((n,i)=>J.rest.set([...n.t,...n.r,...n.s],i*10));
    J.L=new Float32Array(N*10);J.P=new Float32Array(N*10);J.Wm=new Float32Array(N*16);J.tm=new Float32Array(16);
    await Promise.all(J.mats.flatMap(m=>[["map","img"],["nrm","nimg"]].map(([k,o])=>m[k]?(W3IMG[m[k]]||(W3IMG[m[k]]=new Promise(ok=>{const im=new Image();im.decoding="async";
      im.onload=()=>ok(im);im.onerror=()=>ok(null);im.src=W3URL(m[k]);}))).then(im=>{if(im)m[o]=im;}):null)));
    return J;})();
  W3SKD[nm]=pr;pr.catch(()=>{delete W3SKD[nm];});return pr;}
const W3IMG={};
/* positions/normals/uvs stored as 16/8-bit integers (the willows): back to the float layout the skinning shader reads */
function hxDeq(bin,p){const n=p.nv,F=new Float32Array(n*8),Q=new Int16Array(bin,p.pq,n*3),N=new Int8Array(bin,p.nq,n*3),U=new Int16Array(bin,p.uq,n*2),[lo,sc]=p.pr,[ul,us]=p.ur;
  for(let i=0;i<n;i++){const o=i*8;for(let k=0;k<3;k++){F[o+k]=lo[k]+(Q[i*3+k]+32768)/65535*sc[k];F[o+3+k]=N[i*3+k]/127;}F[o+6]=ul[0]+(U[i*2]+32768)/65535*us[0];F[o+7]=ul[1]+(U[i*2+1]+32768)/65535*us[1];}return F;}
function hxMul(a,ao,b,bo,o,oo){for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[ao+k*4+r]*b[bo+c*4+k];o[oo+c*4+r]=s;}}
function hxInv(m){const a=m[0],b=m[1],c=m[2],d=m[4],e=m[5],f=m[6],g=m[8],h=m[9],i=m[10],x=m[12],y=m[13],z=m[14];
  const r0=e*i-f*h,r1=c*h-b*i,r2=b*f-c*e,id=1/(a*r0+d*r1+g*r2),o=new Float32Array(16);
  o[0]=r0*id;o[1]=r1*id;o[2]=r2*id;o[4]=(f*g-d*i)*id;o[5]=(a*i-c*g)*id;o[6]=(c*d-a*f)*id;o[8]=(d*h-e*g)*id;o[9]=(b*g-a*h)*id;o[10]=(a*e-b*d)*id;
  o[12]=-(o[0]*x+o[4]*y+o[8]*z);o[13]=-(o[1]*x+o[5]*y+o[9]*z);o[14]=-(o[2]*x+o[6]*y+o[10]*z);o[15]=1;return o;}
/* one clip at time t into L (local translation, rotation, scale of every node) */
function hxLocal(J,an,t,L){L.set(J.rest);const A=J.anims[an];if(!A)return;t=A.d>0?((t%A.d)+A.d)%A.d:0;
  for(const c of A.ch){const T=c.T,n=T.length,V=c.V,d=c.d,o=c.o;let i=0,j=0,f=0;
    if(n>1&&t>T[0]){if(t>=T[n-1])i=j=n-1;else{let lo=0,hi=n-1;while(hi-lo>1){const m=(lo+hi)>>1;if(T[m]<=t)lo=m;else hi=m;}i=lo;j=hi;f=c.st?0:(t-T[lo])/(T[hi]-T[lo]);}}
    for(let k=0;k<d;k++)L[o+k]=(V[i*d+k]*(1-f)+V[j*d+k]*f)*c.k;
    if(d===4){const l=1/(Math.hypot(L[o],L[o+1],L[o+2],L[o+3])||1);for(let k=0;k<4;k++)L[o+k]*=l;}}}
/* mix clips [[name,time,weight],…], build the world matrices, and pack each bone as three rows for the shader */
function hxPose(J,list,out){const N=J.N,P=J.P,L=J.L,Wm=J.Wm;P.fill(0);let tw=0;
  for(const [a,t,w] of list){if(!(w>.002))continue;hxLocal(J,a,t,L);tw+=w;
    for(let i=0;i<N;i++){const o=i*10,sg=P[o+3]*L[o+3]+P[o+4]*L[o+4]+P[o+5]*L[o+5]+P[o+6]*L[o+6]<0?-w:w;
      for(let k=0;k<3;k++){P[o+k]+=L[o+k]*w;P[o+7+k]+=L[o+7+k]*w;}for(let k=3;k<7;k++)P[o+k]+=L[o+k]*sg;}}
  if(!tw){P.set(J.rest);tw=1;}const iw=1/tw,M=J.tm;
  for(const i of J.order){const o=i*10;let x=P[o+3],y=P[o+4],z=P[o+5],q=P[o+6];const l=1/(Math.hypot(x,y,z,q)||1);x*=l;y*=l;z*=l;q*=l;
    const sx=P[o+7]*iw,sy=P[o+8]*iw,sz=P[o+9]*iw;
    M[0]=(1-2*(y*y+z*z))*sx;M[1]=2*(x*y+z*q)*sx;M[2]=2*(x*z-y*q)*sx;M[3]=0;M[4]=2*(x*y-z*q)*sy;M[5]=(1-2*(x*x+z*z))*sy;M[6]=2*(y*z+x*q)*sy;M[7]=0;
    M[8]=2*(x*z+y*q)*sz;M[9]=2*(y*z-x*q)*sz;M[10]=(1-2*(x*x+y*y))*sz;M[11]=0;M[12]=P[o]*iw;M[13]=P[o+1]*iw;M[14]=P[o+2]*iw;M[15]=1;
    const p=J.nodes[i].p;hxMul(p<0?J.base:Wm,p<0?0:p*16,M,0,Wm,i*16);}
  if(out)for(let k=0;k<N-1;k++){hxMul(Wm,(k+1)*16,J.ibm,k*16,M,0);const b=k*12;for(let r=0;r<3;r++){out[b+r*4]=M[r];out[b+r*4+1]=M[4+r];out[b+r*4+2]=M[8+r];out[b+r*4+3]=M[12+r];}}}
/* the bones reach the shader through a small float texture (works on iPhones), or a uniform array where float textures are missing */
const hxBW=nb=>nb*3>256?1024:256,w3SkinB=(nb,md)=>(md==="tex"?`uniform highp sampler2D uBT;uniform float uBR;vec4 bt(float i){return texture2D(uBT,vec2((i+.5)/${hxBW(nb)}.,uBR));}
vec3 bp(float j,vec4 p){float i=floor(j+.5)*3.;return vec3(dot(bt(i),p),dot(bt(i+1.),p),dot(bt(i+2.),p));}`:`uniform vec4 uB[${nb*3}];vec3 bp(float j,vec4 p){int i=int(j+.5)*3;return vec3(dot(uB[i],p),dot(uB[i+1],p),dot(uB[i+2],p));}`)+`
vec3 sk(vec4 p){return bp(aJ.x,p)*aW.x+bp(aJ.y,p)*aW.y+bp(aJ.z,p)*aW.z+bp(aJ.w,p)*aW.w;}`;
const w3SkinVS=(nb,md)=>`attribute vec3 aP,aN;attribute vec2 aUV;attribute vec4 aJ,aW;uniform mat4 uVP,uM,uLVP;varying vec3 vN,vC,vW;varying vec4 vL;varying vec2 vUV;`+w3SkinB(nb,md)+`
void main(){vec4 w=uM*vec4(sk(vec4(aP,1.)),1.);vW=w.xyz;vN=(uM*vec4(sk(vec4(aN,0.)),0.)).xyz;vC=vec3(1.);vUV=aUV;vL=uLVP*w;gl_Position=uVP*w;}`;
const w3SkinSVS=(nb,md)=>`attribute vec3 aP;attribute vec4 aJ,aW;uniform mat4 uLVP,uM;varying float vZ;`+w3SkinB(nb,md)+`
void main(){vec4 p=uLVP*(uM*vec4(sk(vec4(aP,1.)),1.));vZ=p.z/p.w*.5+.5;gl_Position=p;}`;
const w3SkinTVS=(nb,md)=>`attribute vec3 aP;attribute vec4 aJ,aW;uniform mat4 uVP;`+w3SkinB(nb,md)+`
void main(){gl_Position=uVP*vec4(sk(vec4(aP,1.)),1.);}`;
function hxBT(gl,K,P){if(K.mode==="tex"){gl.activeTexture(gl.TEXTURE4);gl.bindTexture(gl.TEXTURE_2D,K.bt);gl.uniform1i(P.uBT,4);}}
function hxBind(gl,K,P,h){if(K.mode!=="tex"){gl.uniform4fv(P.uB,h.B);return;}
  if(h.dirty){gl.activeTexture(gl.TEXTURE4);gl.bindTexture(gl.TEXTURE_2D,K.bt);gl.texSubImage2D(gl.TEXTURE_2D,0,0,h.row,K.nb*3,1,gl.RGBA,gl.FLOAT,h.B);h.dirty=false;}gl.uniform1f(P.uBR,(h.row+.5)/K.rows);}
function hxAttr(gl,P,p){gl.bindBuffer(gl.ARRAY_BUFFER,p.jb);gl.vertexAttribPointer(P.aJ,4,gl.FLOAT,false,32,0);gl.vertexAttribPointer(P.aW,4,gl.FLOAT,false,32,16);}
/* draw the horse once, off screen, in plain white: if almost nothing lands, this way of skinning does not work on this phone */
function hxTest(W,J,K,T){const gl=W.gl,F=W.fbo(64,64,gl.NEAREST);if(!F)return .5;const B=new Float32Array(K.nb*12);hxPose(J,[[J.test||"Idle_1",0,1]],B);const b=J.box||[[-.27,0,-.85],[.3,1.49,1.19]],cx=(b[0][0]+b[1][0])/2,cy=(b[0][1]+b[1][1])/2,cz=(b[0][2]+b[1][2])/2,r=Math.max(b[1][1]-b[0][1],b[1][2]-b[0][2])*.6;
  gl.bindFramebuffer(gl.FRAMEBUFFER,F.f);gl.viewport(0,0,64,64);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(T.p);
  gl.uniformMatrix4fv(T.uVP,false,M4.mul(M4.ortho(-r,r,-r,r,.1,20),M4.look([cx+8,cy,cz],[cx,cy,cz])));hxBT(gl,K,T);hxBind(gl,K,T,{B,row:0,dirty:true});
  const p=K.prims.find(q=>!K.mats[q.mat].cut&&!K.mats[q.mat].eye&&!(q.lod>0))||K.prims[0],at=[T.aP,T.aJ,T.aW];at.forEach(a=>gl.enableVertexAttribArray(a));
  gl.bindBuffer(gl.ARRAY_BUFFER,p.fb);gl.vertexAttribPointer(T.aP,3,gl.FLOAT,false,32,0);hxAttr(gl,T,p);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,p.ib);gl.drawElements(gl.TRIANGLES,p.ni,gl.UNSIGNED_SHORT,0);
  at.forEach(a=>gl.disableVertexAttribArray(a));const px=new Uint8Array(64*64*4);gl.readPixels(0,0,64,64,gl.RGBA,gl.UNSIGNED_BYTE,px);let n=0;for(let i=0;i<px.length;i+=4)if(px[i]>127)n++;
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.deleteFramebuffer(F.f);gl.deleteTexture(F.t);gl.deleteRenderbuffer(F.rb);gl.activeTexture(gl.TEXTURE0);return n/4096;}
/* the world's own fragment shader, plus the horse's normal map, the mane's cut-out and a coat colour for the herd */
function w3SkinFS(der){const a="if(!gl_FrontFacing&&uFlip>.5)n=-n;",b="if(uMapOn>.5)base*=texture2D(uMap,vUV).rgb;",u="uniform sampler2D uMap;uniform float uMapOn;";
  if(!W3FS.includes(a)||!W3FS.includes(b)||!W3FS.includes(u))throw new Error("fs");
  let s=W3FS.replace(u,"uniform sampler2D uMap,uNrm;uniform float uMapOn,uNrmOn,uCut,uEye;uniform vec4 uCoat;");
  const e0="vec3 base=vC*uTint;",e1="float dist=distance(vW,uCam);float f=smoothstep(uFogR.x,uFogR.y,dist);float mist";if(!s.includes(e0)||!s.includes(e1))throw new Error("fs2");
  s=s.replace(e0,e0+"float ehl=0.;if(uEye>.5){vec2 e=vUV,ic=e-vec2(.14,.02);float ir=length(ic)/.74,st=vn(vec2(atan(ic.y,ic.x)*7.,ir*3.));vec3 iris=mix(vec3(.15,.085,.04),vec3(.055,.032,.018),smoothstep(.15,1.,ir))*(.85+.3*st);iris=mix(vec3(.012,.01,.008),iris,smoothstep(.9,1.08,length(ic/vec2(.40,.19))));base=mix(iris,vec3(.035,.025,.02),smoothstep(.95,1.05,ir));ehl=smoothstep(.11,.04,length(e-vec2(.28,.36)))*.7+pow(max(dot(reflect(V,n),uL),0.),70.)*.6*(1.-uNight);}").replace(e1,"c+=vec3(ehl)*(1.-uNight*.6);"+e1);
  if(der)s=s.replace(a,a+"if(uNrmOn>.5){vec3 mn=texture2D(uNrm,vUV).xyz*2.-1.;mn.xy*=.9;vec3 nq0=dFdx(vW),nq1=dFdy(vW);vec2 ns0=dFdx(vUV),ns1=dFdy(vUV);"+
    "vec3 nqa=cross(nq1,n),nqb=cross(n,nq0),nT=nqa*ns0.x+nqb*ns1.x,nB=nqa*ns0.y+nqb*ns1.y;float ndt=max(dot(nT,nT),dot(nB,nB));"+
    "if(ndt>0.){float nk=(gl_FrontFacing?1.:-1.)*inversesqrt(ndt);n=normalize(nT*(mn.x*nk)+nB*(mn.y*nk)+n*mn.z);}}");
  s=s.replace(b,"if(uMapOn>.5){vec4 tx=texture2D(uMap,vUV"+(der?");if(uCut>0.){vec2 dd=max(abs(dFdx(vUV)),abs(dFdy(vUV)))*1024.;tx.a*=1.+max(0.,log2(max(dd.x,dd.y)))*.32;}":",uCut>0.?-1.5:0.);")+"if(tx.a<uCut)discard;vec3 tc=tx.rgb;"+
    "if(uCoat.w>0.){float l=dot(tc,vec3(.3,.55,.15));tc=mix(tc,uCoat.rgb*min(1.3,l/.072),smoothstep(.045,.065,l)*(1.-smoothstep(.3,.55,l))*uCoat.w);}base*=tc;}");
  return (der?"#extension GL_OES_standard_derivatives : enable\n":"")+s;}
/* the old saddle, refitted to the new horse's back (measured from the model at rest, in the old horse's frame: +x forward) */
function w3SaddleGeo(){const C=W3C,wood=hex("#7A4A26"),silver=hex("#D9D6CC"),g=new Geo(17);
  const bd=loft([[-.345,1.1,0,.29,.235],[-.23,1.082,0,.293,.246],[-.115,1.04,0,.299,.259],[0,1.015,0,.297,.281],[.115,1.009,0,.31,.279],[.23,1.033,0,.333,.261],[.345,1.065,0,.367,.239],[.46,1.099,0,.375,.23]]);
  g.tube(u=>bd(.18+u*.7),16,26,{a0:-1.32,a1:1.32,grow:.02,col:(u,a)=>u<.1||u>.9||Math.abs(a)>1.14?C.gold:(Math.abs(a)<.45&&u>.3&&u<.7?hex("#1F4E79"):C.red)});
  g.at([.12,1.35,0],{s:[.27,.075,.19]},q=>q.sph(1,16,wood,0));
  g.at([.34,1.45,0],{rz:Math.PI/2},q=>q.cyl(.13,.13,.05,22,wood));g.at([-.08,1.375,0],{rz:Math.PI/2},q=>q.cyl(.125,.125,.05,22,wood));
  g.at([.335,1.585,0],{},q=>q.sph(.022,8,silver,0));g.at([-.105,1.505,0],{},q=>q.sph(.02,8,silver,0));
  [1,-1].forEach(sd=>{g.at([.12,1.05,.315*sd],{},q=>q.box(.035,.42,.012,C.leather));
    g.at([.12,.83,.32*sd],{},q=>{q.box(.12,.025,.07,silver);q.at([-.055,.04,0],{},w=>w.box(.012,.08,.06,silver));q.at([.055,.04,0],{},w=>w.box(.012,.08,.06,silver));});});
  return g;}
/* one animated model on this phone: textures, buffers, and the first way of skinning that passes the off-screen test */
function w3SkinKit(W,J,rows){const gl=W.gl;
  const nb=J.N-1,der=!!gl.getExtension("OES_standard_derivatives"),modes=[];
  if(gl.getExtension("OES_texture_float")&&gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)>0)modes.push("tex");if(gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS)>=nb*3+16)modes.push("uni");
  const TC=W.imT||(W.imT=new Map()),tex=im=>TC.get(im)||TC.set(im,tex1(im)).get(im),tex1=im=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);if(W.aniso)gl.texParameterf(gl.TEXTURE_2D,W.aniso.TEXTURE_MAX_ANISOTROPY_EXT,4);return t;};
  const mats=J.mats.map(m=>({map:m.img?tex(m.img):null,nrm:m.nimg?tex(m.nimg):null,cut:m.cut||0,eye:m.eye||0,ns:m.ns||0,tint:m.map?[1,1,1]:m.col.map(c=>Math.max(c,.035))}));
  const VB=new Map(),IB=new Map(),prims=J.prims.map(p=>{let v=VB.get(p.F);if(!v){const fb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,fb);gl.bufferData(gl.ARRAY_BUFFER,p.F,gl.STATIC_DRAW);
    const f=new Float32Array(p.nv*8);for(let i=0;i<p.nv;i++)for(let k=0;k<4;k++){f[i*8+k]=p.Bt[i*8+k];f[i*8+4+k]=p.Bt[i*8+4+k]/255;}
    const jb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,jb);gl.bufferData(gl.ARRAY_BUFFER,f,gl.STATIC_DRAW);VB.set(p.F,v={fb,jb});}
    let ib=IB.get(p.ix+"/"+p.ni);if(!ib){ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,p.I,gl.STATIC_DRAW);IB.set(p.ix+"/"+p.ni,ib);}
    return {fb:v.fb,jb:v.jb,ib,ni:p.ni,mat:p.mat,lod:p.lod};});
  let K=null;const why=[];
  for(const md of modes){const k={mode:md,nb,der,list:[],mats,prims,rows};
    try{if(md==="tex"){k.bt=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,k.bt);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,hxBW(nb),rows,0,gl.RGBA,gl.FLOAT,null);
        [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER].forEach(q=>gl.texParameteri(gl.TEXTURE_2D,q,gl.NEAREST));[gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T].forEach(q=>gl.texParameteri(gl.TEXTURE_2D,q,gl.CLAMP_TO_EDGE));}
      const BU=md==="tex"?["uBT","uBR"]:["uB"];
      k.L=W.prog(w3SkinVS(nb,md),w3SkinFS(der),["aP","aN","aUV","aJ","aW"],W.mainU.concat(BU,["uNrm","uNrmOn","uCut","uCoat","uEye"]));
      try{k.S=W.prog(w3SkinSVS(nb,md),W3SFS,["aP","aJ","aW"],["uLVP","uM"].concat(BU));}catch(e){k.S=null;}
      const T=W.prog(w3SkinTVS(nb,md),W3HP+"void main(){gl_FragColor=vec4(1.);}",["aP","aJ","aW"],["uVP"].concat(BU)),px=hxTest(W,J,k,T);gl.deleteProgram(T.p);
      if(px>.03&&px<.85){K=k;K.px=px;break;}why.push(md+" "+Math.round(px*100)+"%");}catch(e){why.push(md+" алдаа");console.warn("horse",md,e);}
    if(k.bt)gl.deleteTexture(k.bt);}
    if(!K)return {ok:false,why:why.join(", ")||"дэмжлэггүй"};
  K.ok=true;K.desc=(K.mode==="tex"?"текстур":"массив")+" арга ✓ "+Math.round(K.px*100)+"%";
  K.inst=(cast,coat)=>{const h={m:M4.id(),B:new Float32Array(nb*12),on:true,cast,coat:coat||[1,1,1,0],row:K.list.length,dirty:true,far:false,lod:0};K.list.push(h);return h;};
  return K;}
function w3HorseAttach(W,P){W3INFO.horse="ачаалж байна";w3HorseData().then(J=>{const gl=W.gl;if(!gl||(gl.isContextLost&&gl.isContextLost())||!P.m||!P.hz||!W.prog||P.hx||W.hx)return;
  const K=w3SkinKit(W,J,10);if(!K.ok){W3INFO.horse="хуучин морь ("+K.why+")";return;}W3INFO.horse=K.desc;const inst=K.inst;
  const A=M4.trs([0,0,0],{ry:Math.PI/2,s:HX.s}),sp=J.nodes.findIndex(n=>n.n==="BN_Spine_02_04");hxPose(J,[["Idle_1",0,1]],null);
  const rng=chRng(81),CO=["#8C4C22","#E8E2D4","#5A3420","#2A2420"];
  const herd=CO.map((c,i)=>{const x=-36+(rng()-.5)*14,z=9+(rng()-.5)*12;return {x,z,ry:rng()*6.28,a:i%2?"Idle_1":"Eat",t0:-rng()*7,until:2+rng()*9,prev:null,st:0,h:inst(0,[...hex(c),1])};});
  P.hx={J,K,A,Ai:hxInv(A),sp,J0i:hxInv(J.Wm.slice(sp*16,sp*16+16)),sad:w3Mesh(W,w3SaddleGeo(),{cast:1,tex:.1,brush:.55,brushS:6}),
    main:{h:inst(1),a:"Idle_1",t0:0,until:3,prev:null,mv:false},herd,seat:1.41};
  /* the scene may already be open (slow network): it picks this up from W on its next frame */
  W.hx=P.hx;(W.sks=W.sks||[]).push(K);P.hz.body.on=P.hz.tail.on=false;P.hz.legs.forEach(L=>{L.up.on=L.lo.on=false;});if(P.m.herd)P.m.herd.on=false;}).catch(e=>{W3INFO.horse="ачаалж чадсангүй";console.warn("horse",e);});}
function hxSlots(o,t){const f=o.prev?ss3(0,.6,t-o.prev.f0):1;if(f>=1)o.prev=null;const L=[[o.a,t-o.t0,f]];if(o.prev)L.push([o.prev.a,t-o.prev.t0,1-f]);return L;}
function hxSwitch(o,a,t){if(o.a===a)return;o.prev={a:o.a,t0:o.t0,f0:t};o.a=a;o.t0=t;}
/* every frame: the tied or ridden horse (rest clips crossfade; walk and gallop come in with speed), its saddle, and the grazing herd */
function w3HxStep(S,hm,gp,amp,t,dt,c){const H=S.hx,J=H.J,M=H.main,R=S.ride,mov=!!(R||S.horseRun),D=a=>J.anims[a].d;
  if(mov!==M.mv){M.mv=mov;if(mov)hxSwitch(M,"Idle_1",t);M.until=t+3+Math.random()*4;}
  if(!mov&&t>M.until){const nx=M.a==="Eat"?"Idle_1":Math.random()<.55?"Eat":"Idle_1";hxSwitch(M,nx,t);M.until=t+D(nx)*(1+(Math.random()*2|0));}
  const L=hxSlots(M,t);
  if(mov){let m=amp,g=1,pw=0,pg=gp||0;if(R){const v=Math.abs(R.v);m=Math.min(1,v/.45);g=ss3(1.3,2.4,v);pw=R.pw||0;pg=R.ph;}
    L.forEach(x=>x[2]*=1-m);L.push(["Walk",pw*D("Walk"),m*(1-g)],["Gallop",pg*D("Gallop"),m*g]);}
  hxPose(J,L,M.h.B);M.h.m=M4.mul(hm,H.A);M.h.dirty=true;M.h.on=H.sad.on=!S.inGer;
  const SR=M4.mul(H.A,M4.mul(M4.mul(J.Wm.subarray(H.sp*16,H.sp*16+16),H.J0i),H.Ai));H.sad.m=M4.mul(hm,SR);H.seat=SR[1]*.12+SR[5]*1.425+SR[13];
  const fx=Math.sin(c.yaw),fz=-Math.cos(c.yaw);
  for(const h of H.herd){
    if(h.st===1){const dx=h.tx-h.x,dz=h.tz-h.z,d=Math.hypot(dx,dz);let da=Math.atan2(-dz,dx)-h.ry;da=Math.atan2(Math.sin(da),Math.cos(da));
      h.ry+=Math.max(-1,Math.min(1,da*2))*dt*.9;const sp=.78*(Math.abs(da)<1?1:.35);h.x+=Math.cos(h.ry)*sp*dt;h.z-=Math.sin(h.ry)*sp*dt;
      if(d<.5||t>h.until){h.st=0;hxSwitch(h,Math.random()<.7?"Eat":"Idle_1",t);h.until=t+D(h.a)*(1+(Math.random()*2|0));}}
    else if(t>h.until){if(Math.random()<.45){const a=Math.random()*6.283,r=2+Math.random()*4;h.tx=Math.max(-43,Math.min(-29,h.x+Math.cos(a)*r));h.tz=Math.max(3,Math.min(15,h.z+Math.sin(a)*r));
        h.st=1;hxSwitch(h,"Walk",t);h.until=t+14;}else{const nx=h.a==="Eat"?"Idle_1":"Eat";hxSwitch(h,nx,t);h.until=t+D(nx)*(1+(Math.random()*2|0));}}
    if(h===H.herd[0])w3Spread(H.herd,1.9,"x","z");
    const dx=h.x-c.pos[0],dz=h.z-c.pos[2],d=Math.hypot(dx,dz);h.h.on=!S.inGer&&d<170&&(d<6||(dx*fx+dz*fz)/d>.3);h.h.far=d>70;
    if(h.h.on){hxPose(J,hxSlots(h,t),h.h.B);h.h.dirty=true;h.h.m=M4.mul(M4.trs([h.x,w3H(h.x,h.z),h.z],{ry:h.ry}),H.A);}}}
function w3SkinShadow(W,K,LVP){const gl=W.gl,S=K.S;if(!S||!K.list.some(h=>h.on&&h.cast))return;gl.useProgram(S.p);gl.uniformMatrix4fv(S.uLVP,false,LVP);hxBT(gl,K,S);const at=[S.aP,S.aJ,S.aW];at.forEach(a=>gl.enableVertexAttribArray(a));
  for(const h of K.list){if(!h.on||!h.cast)continue;gl.uniformMatrix4fv(S.uM,false,h.m);hxBind(gl,K,S,h);
    for(const p of K.prims){if(K.mats[p.mat].cut||K.mats[p.mat].ns||(p.lod!=null&&p.lod!==h.lod))continue;gl.bindBuffer(gl.ARRAY_BUFFER,p.fb);gl.vertexAttribPointer(S.aP,3,gl.FLOAT,false,32,0);
      hxAttr(gl,S,p);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,p.ib);gl.drawElements(gl.TRIANGLES,p.ni,gl.UNSIGNED_SHORT,0);}}
  at.forEach(a=>gl.disableVertexAttribArray(a));}
function w3SkinDraw(W,K,glob,env){const gl=W.gl,L=K.L;if(!K.list.some(h=>h.on))return;glob(L);hxBT(gl,K,L);
  gl.uniform1i(L.uNrm,3);gl.uniform1f(L.uEmit,0);gl.uniform1f(L.uSkyM,0);gl.uniform1f(L.uTex,0);gl.uniform1f(L.uCld,0);gl.uniform1f(L.uSheen,0);gl.uniform1f(L.uFlip,1);gl.uniform1f(L.uWater,0);
  gl.uniform1f(L.uBrush,.3);gl.uniform1f(L.uBrushS,6);gl.uniform2fv(L.uFogR,env.fogR);gl.uniform1f(L.uAlpha,1);
  const at=[L.aP,L.aN,L.aUV,L.aJ,L.aW];at.forEach(a=>gl.enableVertexAttribArray(a));
  for(const h of K.list){if(!h.on)continue;gl.uniformMatrix4fv(L.uM,false,h.m);hxBind(gl,K,L,h);gl.uniform4fv(L.uCoat,h.coat);
    for(const p of K.prims){const mt=K.mats[p.mat],nm=!!(mt.nrm&&K.der);if((h.far&&mt.cut)||(p.lod!=null&&p.lod!==h.lod))continue;gl.uniform3fv(L.uTint,mt.tint);gl.uniform1f(L.uCut,mt.cut*(h.ck||1));gl.uniform1f(L.uEye,mt.eye);gl.uniform1f(L.uBrush,mt.eye?0:.3);
      if(mt.map){gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,mt.map);}gl.uniform1f(L.uMapOn,mt.map?1:0);
      if(nm){gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,mt.nrm);}gl.uniform1f(L.uNrmOn,nm?1:0);
      gl.bindBuffer(gl.ARRAY_BUFFER,p.fb);gl.vertexAttribPointer(L.aP,3,gl.FLOAT,false,32,0);gl.vertexAttribPointer(L.aN,3,gl.FLOAT,false,32,12);gl.vertexAttribPointer(L.aUV,2,gl.FLOAT,false,32,24);
      hxAttr(gl,L,p);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,p.ib);gl.drawElements(gl.TRIANGLES,p.ni,gl.UNSIGNED_SHORT,0);}}
  at.forEach(a=>gl.disableVertexAttribArray(a));gl.activeTexture(gl.TEXTURE0);}
/* Amy's sheep (sheep.glb — CC BY 4.0, "Realistic Woolly Sheep" by Pigcraft): 18 bones, three levels of detail; every animal of the flock becomes one */
function w3SheepAttach(W,P){W3INFO.sheep="ачаалж байна";w3SkinData("sheep").then(J=>{const gl=W.gl;if(!gl||(gl.isContextLost&&gl.isContextLost())||!P.flock||!W.prog||W.sh)return;
  const K=w3SkinKit(W,J,16);if(!K.ok){W3INFO.sheep="хуучин хонь ("+K.why+")";return;}W3INFO.sheep=K.desc;
  const CO=[null,null,null,null,[.86,.78,.66,.8],null,null,[.55,.42,.32,.7],null,null,[.86,.78,.66,.8],null,null];
  P.flock.forEach((a,i)=>{a.k=K.inst(1,CO[i%CO.length]);a.an={a:i%3?"Graze":"Idle",t0:-Math.random()*4,until:0,prev:null};a.goat=false;a.m.on=false;});
  W.sh={J,K,A:M4.trs([0,0,0],{ry:Math.PI/2,s:SHX.s})};(W.sks=W.sks||[]).push(K);}).catch(e=>{W3INFO.sheep="ачаалж чадсангүй";console.warn("sheep",e);});}
/* Amy's sky (Sky.glb): its blue gradient goes into skyCol (env.photo), and here: 20 cumulus clouds sharing one light card mesh,
   8 high cirrus cards and the horizon haze band. Clouds turn round the camp (10 min a turn, cirrus 20) and billow; their light follows the time of day */
const W3SKYK=.045,W3SKYY=14,W3CVS=`attribute vec3 aP,aN;attribute vec2 aU;uniform mat4 uVP,uM;varying vec3 vN,vW;varying vec2 vU;
void main(){vec4 w=uM*vec4(aP,1.);vW=w.xyz;vN=mat3(uM)*aN;vU=aU;gl_Position=uVP*w;}`,
W3CFS=`precision mediump float;`+W3GRADE_GLSL+`uniform sampler2D uA,uNm;uniform vec3 uL,uSunC,uZen,uHor,uFog,uCam,uCol;uniform float uNight,uGlow,uExp,uMode,uK;varying vec3 vN,vW;varying vec2 vU;
void main(){vec3 V=normalize(vW-uCam);float el=V.y;vec3 c;float a;
 if(uMode<.5){a=texture2D(uA,vU).r*uK;if(a<.012)discard;vec3 nm=texture2D(uNm,vU).xyz*2.-1.,n=normalize(normalize(vN)+vec3(nm.x,nm.y*.5,nm.y)*.55);
  float w=dot(n,uL)*.5+.5,up=n.y*.5+.5;vec3 amb=mix(mix(uHor,uZen,.4),vec3(1.),.35)*.8;
  c=mix(amb,uSunC*mix(1.15,1.,uGlow),smoothstep(.2,.95,w))*mix(.82,1.05,up);c+=uSunC*pow(max(dot(V,uL),0.),5.)*(1.-a)*.8*(1.-uNight);
  c=mix(c,uZen*.55+uHor*.3,uNight*.85);a*=1.-uNight*.8;}
 else if(uMode<1.5){a=texture2D(uA,vU).r*.85;c=mix(vec3(1.),uSunC,.3+.45*uGlow);c=mix(c,uZen*.7+uHor*.3,uNight*.8);a*=1.-uNight*.6;}
 else{a=texture2D(uA,vU).r*.8*(1.-uNight*.85);c=mix(uFog,uHor,.35)*uCol*1.08;}
 c=mix(c,uHor,(1.-smoothstep(.01,.22,el))*.35*float(uMode<1.5));gl_FragColor=vec4(w3GradeSky(c)*uExp,a);}`;
function w3SkyAttach(W){if(W.sky||!W.gl)return;W.sky=1;W3INFO.sky="ачаалж байна";
  fetch(W3BASE+"sky.json").then(r=>{if(!r.ok)throw new Error("http "+r.status);return r.json();}).then(D=>Promise.all(["a","n","c"].map(k=>new Promise(ok=>{const im=new Image();im.onload=()=>ok(im);im.onerror=()=>ok(null);im.src=W3BASE+""+D.mat.tex[k];}))).then(ims=>{
    const gl=W.gl;if(!gl||(gl.isContextLost&&gl.isContextLost()))return;if(ims.some(i=>!i))throw new Error("tex");
    const L=W.prog(W3CVS,W3CFS,["aP","aN","aU"],["uVP","uM","uA","uNm","uL","uSunC","uZen","uHor","uFog","uCam","uCol","uNight","uGlow","uExp","uMode","uK"]);if(!L||!L.p)throw new Error("shader");
    const u8=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer,buf=(t,d)=>{const b=gl.createBuffer();gl.bindBuffer(t,b);gl.bufferData(t,d,gl.STATIC_DRAW);return b;},
      tex=(src,w,h,fmt)=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);if(w){gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);gl.texImage2D(gl.TEXTURE_2D,0,fmt,w,h,0,fmt,gl.UNSIGNED_BYTE,src);gl.pixelStorei(gl.UNPACK_ALIGNMENT,4);}else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,src);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        if(w)gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);else{gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);}return t;},
      part=(o,st)=>({fb:buf(gl.ARRAY_BUFFER,new Float32Array(u8(o.F))),ib:buf(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(u8(o.I))),ni:o.ni,st});
    const hz=new Uint8Array(D.haze.a.map(v=>Math.round(v*255)));
    W.skyD={L,cl:part(D.cloud,32),ci:part(D.cirrus,20),hz:part(D.haze,20),ta:tex(ims[0]),tn:tex(ims[1]),tc:tex(ims[2]),th:tex(hz,1,hz.length,gl.LUMINANCE),D,
      puffs:D.puffs.map(p=>({p:p.slice(0,3).map(v=>v*W3SKYK),yaw:p[3],s:p[4]*W3SKYK,g:D.groups[p[5]],ph:p[0]*.01,d:0}))};W.skyOn=1;W3INFO.sky="✓ "+D.puffs.length+" үүл";})).catch(e=>{W3INFO.sky="хуучин тэнгэр";console.warn("sky",e);});}
function w3SkyDraw(W,VP,env,cam,t,exp){const gl=W.gl,K=W.skyD,L=K.L,TP=2*Math.PI,cx=cam.pos[0],cz=cam.pos[2];gl.useProgram(L.p);
  gl.uniformMatrix4fv(L.uVP,false,VP);gl.uniform3fv(L.uL,env.dir);gl.uniform3fv(L.uSunC,env.sunC);gl.uniform3fv(L.uZen,env.zen);gl.uniform3fv(L.uHor,env.hor);gl.uniform3fv(L.uFog,env.fog);
  gl.uniform3fv(L.uCam,cam.pos);gl.uniform3fv(L.uCol,K.D.haze.col);gl.uniform1f(L.uNight,env.night);gl.uniform1f(L.uGlow,env.glow||0);gl.uniform1f(L.uExp,exp);gl.uniform1f(L.uK,K.D.mat.cloud[1]*2.1);
  gl.uniform1i(L.uA,1);gl.uniform1i(L.uNm,2);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.enableVertexAttribArray(L.aP);gl.enableVertexAttribArray(L.aU);
  const S=(x,y,z)=>{const m=M4.id();m[0]=x;m[5]=y;m[10]=z;return m;},
    draw=(P,M,mode,ta)=>{gl.uniformMatrix4fv(L.uM,false,M);gl.uniform1f(L.uMode,mode);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,ta);gl.bindBuffer(gl.ARRAY_BUFFER,P.fb);
      gl.vertexAttribPointer(L.aP,3,gl.FLOAT,false,P.st,0);gl.vertexAttribPointer(L.aU,2,gl.FLOAT,false,P.st,P.st===32?24:12);if(P.st===32){gl.enableVertexAttribArray(L.aN);gl.vertexAttribPointer(L.aN,3,gl.FLOAT,false,32,12);}
      else{gl.disableVertexAttribArray(L.aN);gl.vertexAttrib3f(L.aN,0,1,0);}gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,P.ib);gl.drawElements(gl.TRIANGLES,P.ni,gl.UNSIGNED_SHORT,0);};
  const sk=M4.mul(M4.T(cam.pos[0],0,cam.pos[2]),S(W3SKYK,W3SKYK,W3SKYK));draw(K.hz,sk,2,K.th);
  if(env.night<.97)draw(K.ci,M4.mul(M4.mul(M4.T(cam.pos[0],0,cam.pos[2]),M4.Ry(t*TP/K.D.turn.cir)),S(W3SKYK,W3SKYK,W3SKYK)),1,K.tc);
  gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,K.tn);const R=M4.mul(M4.T(cx,W3SKYY,cz),M4.Ry(t*TP/K.D.turn.cum));
  for(const q of K.puffs){const b=.5-.5*Math.cos(TP*(t/q.g[0]+q.ph)),M=M4.mul(M4.mul(M4.mul(R,M4.T(q.p[0],q.p[1],q.p[2])),S(q.s*(1+q.g[1]*b),q.s*(1+q.g[2]*b),q.s*(1+q.g[3]*b))),M4.Ry(q.yaw));
    q.M=M;q.d=-Math.hypot(M[12]-cam.pos[0],M[13]-cam.pos[1],M[14]-cam.pos[2]);}
  K.puffs.sort((a,b)=>a.d-b.d);for(const q of K.puffs)if(!q.skip)draw(K.cl,q.M,0,K.ta);
  gl.disableVertexAttribArray(L.aP);gl.disableVertexAttribArray(L.aU);gl.disableVertexAttribArray(L.aN);gl.depthMask(true);gl.disable(gl.BLEND);gl.activeTexture(gl.TEXTURE0);}
/* Amy's willows (Willow1–4.glb, ~250 bones, one 10 s wind loop each): the loop is posed once per key and cached,
   then every tree blends two cached keys a frame with its own time offset; far trees use the lighter bark */
function w3TreeAttach(W,P){if(W.tr||!W.gl)return;const T=W.tr={sp:[]};W3INFO.trees="ачаалж байна";const kinds=[...new Set(W3WIL.map(o=>o.n))];
  const one=n=>w3SkinData(n).then(J=>{const gl=W.gl;if(!gl||(gl.isContextLost&&gl.isContextLost())||!W.prog)return null;const L=W3WIL.filter(o=>o.n===n),K=w3SkinKit(W,J,L.length);
    if(!K.ok){W3INFO.trees="хуучин мод ("+K.why+")";return null;}const A=J.anims.Animation;
    const sp={J,K,T:A.ch[0].T,d:A.d,fr:[],list:L.map(o=>{const k=K.inst(0),y=Math.min(...[[0,0],[1,0],[-1,0],[0,1],[0,-1]].map(([a,b])=>w3H(o.t[0]+a*o.tr,o.t[1]+b*o.tr)))-.05;
      k.m=M4.trs([o.x,y,o.z],{ry:o.ry,s:o.s});k.on=false;return {o,k,y,ph:Math.abs(o.x*7.3+o.z*3.1)%A.d,lodD:o.wish?60:34,r:J.info.crown[3]*o.s+3};})};
    T.sp.push(sp);(W.sks=W.sks||[]).push(K);return sp;});
  one("willow4").then(sp=>{if(!sp)return;const h=sp.list[0],o=h.o,I=sp.J.info;
    W3KF={m:h.k.m,s:o.s,tk:I.trunk,band:Math.min(.85,I.trunk[3]*.8),slots:I.slots||[]};if(P.m&&P.m.tree)P.m.tree.on=false;
    if(P.m&&P.m.khadag)try{w3Rebuf(W,P.m.khadag,w3Khadag(wishCols()));}catch(e){}W3INFO.trees="хүслийн мод ✓";
    setTimeout(()=>kinds.slice(1).reduce((pr,n)=>pr.then(()=>one(n)),Promise.resolve()).then(()=>{if(T.sp.length===kinds.length)W3INFO.trees=T.sp[0].K.desc+", "+W3WIL.length+" мод";}).catch(e=>console.warn("trees",e)),1200);})
    .catch(e=>{W3INFO.trees="ачаалж чадсангүй";console.warn("trees",e);});}
function hxKey(sp,i){return sp.fr[i]||(sp.fr[i]=(()=>{const o=new Float32Array(sp.K.nb*12);hxPose(sp.J,[["Animation",sp.T[i],1]],o);return o;})());}
function w3TreeStep(T,t,c,inGer){const fx=Math.sin(c.yaw),fz=-Math.cos(c.yaw);
  for(const sp of T.sp){const n=sp.K.nb*12,tk=sp.T,nk=tk.length;
    for(const h of sp.list){const k=h.k,dx=h.o.x-c.pos[0],dz=h.o.z-c.pos[2],d=Math.hypot(dx,dz);k.on=!inGer&&(d<h.r||dx*fx+dz*fz>-h.r);if(!k.on)continue;
      k.lod=d>h.lodD?1:0;k.ck=1-.45*ss3(20,70,d);const u=(t+h.ph)%sp.d;let i=0;while(i<nk-2&&tk[i+1]<=u)i++;
      const f=Math.max(0,Math.min(1,(u-tk[i])/(tk[i+1]-tk[i]))),a=hxKey(sp,i),b=hxKey(sp,i+1),B=k.B;for(let j=0;j<n;j++)B[j]=a[j]+(b[j]-a[j])*f;k.dirty=true;}}}
/* per frame, after the flock's own walking/fleeing/petting logic: pick the clip, lie down now and then, stand up when someone comes */
function w3ShStep(SH,a,t,c,hop,wig,inGer){const J=SH.J,h=a.k,o=a.an,D=n=>J.anims[n].d,near=a.st===0&&(a.lk||0)>.35,lying=o.a==="LieDown"||o.a==="Lie";
  if(a.st>=1)hxSwitch(o,"Walk",t),o.until=t;
  else if(near){if(lying)hxSwitch(o,"GetUp",t),o.until=t+D("GetUp");else if(o.a!=="GetUp"||t>o.until)hxSwitch(o,"Idle",t),o.until=t+1;}
  else if(t>o.until){const r=Math.random();let nx,u;
    if(o.a==="LieDown"){nx="Lie";u=8+Math.random()*14;}else if(o.a==="Lie"){nx="GetUp";u=D("GetUp");}
    else if(r<.5){nx="Graze";u=D("Graze")*(1+(Math.random()*2|0));}else if(r<.75){nx="Eat";u=D("Eat")*(1+(Math.random()*3|0));}
    else if(r<.9||!(a.ph%3<1)){nx="Idle";u=D("Idle");}else{nx="LieDown";u=D("LieDown");}
    hxSwitch(o,nx,t);o.until=t+u;}
  if(o.a==="LieDown"||o.a==="Lie"||(o.a==="GetUp"&&t<o.until))a.t=Math.max(a.t,1);
  const dx=a.x-c.pos[0],dz=a.z-c.pos[2],d=Math.hypot(dx,dz),fx=Math.sin(c.yaw),fz=-Math.cos(c.yaw);
  h.on=!inGer&&d<150&&(d<4||(dx*fx+dz*fz)/d>.3);h.lod=Math.min(2,(d<8?0:d<20?1:2)+(W3Q.sheepLod||0));h.cast=d<12?1:0;if(!h.on)return;
  const L=hxSlots(o,t).map(([n,tt,w])=>n==="Walk"?[n,a.wk/(SHX.walk*SHX.s*(a.sc||1)),w]:n==="Lie"?["LieDown",D("LieDown")-.02,w]:n==="LieDown"||n==="GetUp"?[n,Math.min(tt,D(n)-.02),w]:[n,tt,w]);
  hxPose(J,L,h.B);h.dirty=true;h.m=M4.mul(M4.trs([a.x,w3H(a.x,a.z)+landLift(a.x,a.z)+hop,a.z],{ry:a.ry+wig,rz:hop*.6,s:a.sc||1}),SH.A);}
/* ---- the ground around the camp: Amy's forest-floor scan («Forest landscape», Lassi Kaukonen, CC BY 4.0 — bank cropped off,
   stumps and their roots removed, the 15 m slope flattened). A photo laid over the terrain with a soft, wavy edge; small bumps
   (up to 6 cm) only in that layer; grass grows only where the photo is green. Grid data is inline so the world can be built at once. ---- */
const LAND=(()=>{const D={"cx":-4.0,"cz":0.0,"Lx":28.394,"Lz":25.046,"gx":58,"gz":51,"bump":"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","grass":"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"},dec=s=>{const b=atob(s),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;};
  return {Lx:D.Lx,Lz:D.Lz,x0:D.cx-D.Lx/2,z0:D.cz-D.Lz/2,gx:D.gx,gz:D.gz,B:dec(D.bump),G:dec(D.grass)};})();
function landSrc(x,z){if(Math.hypot(x+8.5,z+5)<3.3)return [x+.5,z+7.5];if(Math.hypot(x+15,z-1.5)<3.3)return [-8-(x+15),2-(z-1.5)];return [x,z];}
function landS(A,x,z){{const q=landSrc(x,z);x=q[0];z=q[1];}const L=LAND,u=(x-L.x0)/L.Lx*(L.gx-1),v=(z-L.z0)/L.Lz*(L.gz-1);if(u<0||v<0||u>L.gx-1||v>L.gz-1)return 0;
  const i=Math.min(L.gx-2,u|0),j=Math.min(L.gz-2,v|0),fu=u-i,fv=v-j,a=A[j*L.gx+i],b=A[j*L.gx+i+1],c=A[(j+1)*L.gx+i],d=A[(j+1)*L.gx+i+1];
  return ((a*(1-fu)+b*fu)*(1-fv)+(c*(1-fu)+d*fu)*fv)/255;}
function landFade(x,z){const L=LAND;if(x<L.x0||z<L.z0||x>L.x0+L.Lx||z>L.z0+L.Lz)return 0;
  return ss3(.2,2.8,Math.min(x-L.x0,L.x0+L.Lx-x,z-L.z0,L.z0+L.Lz-z)+.45*Math.sin(x*.9+Math.sin(z*.7)*1.6)+.3*Math.sin(z*1.3-x*.4));}
/* height of the photo layer above the terrain (feet and hooves stand on it) */
function landLift(x,z){const f=landFade(x,z);return f>0?(.022+landS(LAND.B,x,z)*.255)*f:0;}
function landBare(x,z){const f=landFade(x,z);return f>0?f*(1-.55*Math.min(1,landS(LAND.G,x,z)*2)):0;}
function w3LandAttach(W){const gl=W.gl;if(!gl||W.land)return;const L=LAND,st=.3,nx=Math.ceil(L.Lx/st),nz=Math.ceil(L.Lz/st),
    H=(x,z)=>w3H(x,z)+.022+landS(L.B,x,z)*.255,G=[];
  for(let j=0;j<=nz;j++){const r=[];for(let i=0;i<=nx;i++){const x=L.x0+i/nx*L.Lx,z=L.z0+j/nz*L.Lz,e=.15,y=H(x,z),n=V3.norm([H(x-e,z)-H(x+e,z),2*e,H(x,z-e)-H(x,z+e)]);
    r.push([x,y,z,n[0],n[1],n[2],1,1,1,0,i/nx,j/nz]);}G.push(r);}
  const v=new Float32Array(nx*nz*72);let o=0;
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=G[j][i],b=G[j][i+1],c=G[j+1][i+1],d=G[j+1][i];for(const q of [a,b,c,a,c,d]){v.set(q,o);o+=12;}}
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,v,gl.STATIC_DRAW);
  /* drawn first among the see-through things: after the grass, which it never covers */
  const m={b,n:v.length/12,m:M4.id(),st:48,uv:1,map:null,mapA:1,emit:0,tint:[1,1,1],on:false,sky:0,nofog:0,cast:0,tex:0,cld:0,sheen:0,alpha:.999,flip:0,water:0,brush:.08,brushS:5};
  W.meshes.unshift(m);W.land=m;
  const im=new Image();im.decoding="async";im.onload=()=>{if(gl.isContextLost&&gl.isContextLost())return;const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    if(W.aniso)gl.texParameterf(gl.TEXTURE_2D,W.aniso.TEXTURE_MAX_ANISOTROPY_EXT,8);m.map=t;m.on=!!m.det;};im.src=W3URL("land_g1.webp");
  /* Amy's idea: a clean 3 m patch of the same earth, made seamless and shown 4x smaller, repeated for the fine grain up close */
  const di=new Image();di.onload=()=>{if(gl.isContextLost&&gl.isContextLost())return;const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,gl.LUMINANCE,gl.UNSIGNED_BYTE,di);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);if(W.aniso)gl.texParameterf(gl.TEXTURE_2D,W.aniso.TEXTURE_MAX_ANISOTROPY_EXT,8);m.det=t;if(m.map)m.on=true;};
  di.onerror=()=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,1,1,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,new Uint8Array([140]));m.det=t;if(m.map)m.on=true;};di.src=W3BASE+"land_detail.png";}
function w3InfoLine(){const I=W3INFO,q=I.q,c=v=>String(v).replace(/[<>&"]/g,"");return `<p class="small muted" style="font-size:12px;margin:8px 0 0">3D мэдээлэл: ${c(I.gpu||"3D нээгээгүй")} · морь: ${c(I.horse)} · хонь: ${c(I.sheep)}${I.trees?` · мод: ${c(I.trees)}`:""}${I.sky?` · тэнгэр: ${c(I.sky)}`:""}${q?` · нарийвчлал ${q.dpr}, өвс ${q.grass}${q.shadows?"":", сүүдэргүй"}${I.ms?`, ${Math.round(I.ms)} мс`:""}`:""}</p><details class="small muted" style="font-size:11px;margin:6px 0 0;opacity:.85"><summary>3D загваруудын эх сурвалж</summary><p style="margin:4px 0">• «Realistic Woolly Sheep - Thick Curled Fleece» — Pigcraft, Sketchfab · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>. Өөрчилсөн: хэмжээ, хөдөлгөөнийг тоглоомд тааруулж, зарим хонины өнгийг өөрчилсөн.</p><p style="margin:4px 0">• «<a href="https://sketchfab.com/3d-models/forest-landscape-2aeb815bbdd44824a5667cde77e7ca9c" target="_blank" rel="noopener">Forest landscape</a>» — <a href="https://sketchfab.com/thesidekick" target="_blank" rel="noopener">Lassi Kaukonen</a>, Sketchfab · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>. Өөрчилсөн: эрэг, хожуулыг авч, налууг тэгшилж, гэрийн орчны газрын зураг болгосон.</p><p style="margin:4px 0">• «<a href="https://sketchfab.com/3d-models/grass-f2f2bddb2728483a9105c5f5114eb15e" target="_blank" rel="noopener">Grass</a>» — <a href="https://sketchfab.com/Cosmic_dust" target="_blank" rel="noopener">Cosmic_dust</a>, Sketchfab · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>. Өөрчилсөн: навчны зургуудыг тоглоомын өвсний ширхэгт ашигласан.</p></details>`;}
function w3World(baked){
  const C=W3C;
  const M={};
  /* terrain: polar grid, dense near the gers, smooth normals */
  const T=new Geo(3);
  const Hn=(x,z)=>{const e=.25,hx=w3H(x+e,z)-w3H(x-e,z),hz=w3H(x,z+e)-w3H(x,z-e);return V3.norm([-hx,2*e,-hz]);};
  const col=(x,z,h,n)=>{let c=w3GrassCol(x,z);const pe=Math.hypot((x-W3POND[0])/W3POND[2],(z-W3POND[1])/W3POND[3]);if(pe<1.2)c=V3.lerp(c,pe<.97?hex("#2E3A2C"):hex("#6E6A48"),ss3(1.2,1.0,pe));if(!baked)c=V3.mul(c,.84+.16*Math.max(ss3(56,84,W3MAP.dsp(x,z)),(1-w3Short(x,z))*.75));
    let wear=0;for(const g of W3GERS){const d=Math.hypot(x-g[0],z-g[1])/g[2];wear=Math.max(wear,ss3(5.2,3.7,d)*.75+ss3(3.95,3.4,d)*.25);}
    const path=Math.max(0,1-Math.abs(x-(z*.42))/.9)*ss3(2.2,3,z)*ss3(16,9,z)*.5;c=V3.lerp(c,C.soil,Math.max(wear,path));
    const slope=1-n[1];if(slope>.18)c=V3.lerp(c,C.rock,Math.min(1,(slope-.18)*3));if(h>8){const m=.5+.5*Math.sin(x*.09+z*.07+Math.sin(z*.05)*3);c=V3.lerp(c,V3.lerp(V3.lerp(C.rock,C.g1,.45),C.rock2,m*.6),Math.min(1,(h-8)/12));if(h>30)c=V3.lerp(c,C.rock2,Math.min(1,(h-30)/12));}return c;};
  W3MAP.terrain(T,col,Hn);
  M.terrain=T;
  /* grass baked into one mesh (only when the GPU cannot draw tufts) */
  if(baked){const G=new Geo(21);for(let i=0;i<42000;i++){const a=G.r()*Math.PI*2,d=Math.sqrt(G.r())*30,x=Math.cos(a)*d+1.5,z=Math.sin(a)*d+4;
    let skip=false;for(const g of W3GERS)if(Math.hypot(x-g[0],z-g[1])<3.95*g[2])skip=true;if(Math.abs(x-2.3)<1.1&&Math.abs(z-5.4)<.8)skip=true;
    const path=Math.max(0,1-Math.abs(x-(z*.42))/.9)*ss3(2.2,3,z)*ss3(16,9,z);if(skip||G.r()<path*.85)continue;
    const y=w3H(x,z),th=G.r()*Math.PI,w=.011+G.r()*.016,h=(.12+G.r()*.27)*(1-path*.6),dx=Math.cos(th)*w,dz=Math.sin(th)*w,lean=(G.r()-.5)*.12;
    const base=V3.lerp(C.g1,C.dry,G.r()*.35*(G.r()<.15?2:1)),tip=V3.lerp(base,[.86,.86,.5],.35+G.r()*.2),dark=V3.mul(base,.6),up=[0,1,0];
    G.vx([x-dx,y,z-dz],up,dark,0);G.vx([x+dx,y,z+dz],up,dark,0);G.vx([x+lean,y+h,z+lean*.5],up,tip,1);
    if(G.r()<.025){const fc=G.r()<.5?[.95,.82,.3]:[.72,.55,.85];G.at([x+lean,y+h,z],{},q=>q.sph(.025,6,fc,0));}}
  M.grass=G;}
  /* flowers in drifts: white, yellow, violet, pink, a few red poppies */
  const FL=new Geo(31),FC=[hex("#F6F3EA"),hex("#F7D44A"),hex("#5E80DA"),hex("#F4A9C0"),hex("#9C86E0"),hex("#E0502F")],stem=hex("#3E6B24"),up=[0,1,0],fx=CAM0[0],fz=CAM0[2];
  const flower=(x,z,s,ci)=>{if(FL.r()<w3Bare(x,z))return;const y=w3H(x,z)-.01,rc=Math.hypot(x-fx,z-fz);s*=Math.pow(Math.max(1,rc/9),.6);
    const h=(.2+FL.r()*.24)*s,top=[x+(FL.r()-.5)*.07*s,y+h,z+(FL.r()-.5)*.07*s],sw=.006*s,th=FL.r()*Math.PI;
    FL.vx([x-Math.cos(th)*sw,y,z-Math.sin(th)*sw],up,V3.mul(stem,.9),0);FL.vx([x+Math.cos(th)*sw,y,z+Math.sin(th)*sw],up,V3.mul(stem,.9),0);FL.vx(top,up,V3.mul(stem,1.25),1);
    const pr=(.03+FL.r()*.022)*s,rot=FL.r()*6.283,np=ci===2?6:5,P=(an,r,dy)=>[top[0]+Math.cos(an)*r,top[1]+dy,top[2]+Math.sin(an)*r];
    for(let k=0;k<np;k++){const a=rot+k/np*6.283,c=FL.jc(FC[ci],.1),cm=V3.mul(c,.8);
      FL.vx(top,up,cm,1);FL.vx(P(a,pr*1.15,pr*.3),up,c,1);FL.vx(P(a-.42,pr*.85,pr*.22),up,c,1);FL.vx(top,up,cm,1);FL.vx(P(a+.42,pr*.85,pr*.22),up,c,1);FL.vx(P(a,pr*1.15,pr*.3),up,c,1);}
    const cc=ci===5?hex("#2A1A14"):hex("#F2B93A"),cr=pr*.34;for(let k=0;k<3;k++){const a=k/3*6.283;FL.vx(P(0,0,.005),up,cc,1);FL.vx(P(a+2.094,cr,.005),up,cc,1);FL.vx(P(a,cr,.005),up,cc,1);}};
  for(let p=0;p<60;p++){const a=FL.r()*6.283,r=2+30*Math.pow(FL.r(),1.25),px=fx+Math.sin(a)*r,pz=fz-Math.cos(a)*r,ci=FL.r()<.08?5:Math.floor(FL.r()*5),n=14+Math.floor(FL.r()*46),rad=.7+FL.r()*2.3;
    for(let i=0;i<n;i++){const b=FL.r()*6.283,d=Math.sqrt(FL.r())*rad;flower(px+Math.cos(b)*d,pz+Math.sin(b)*d,.85+FL.r()*.3,FL.r()<.85?ci:Math.floor(FL.r()*5));}}
  for(let i=0;i<650;i++){const a=FL.r()*6.283,r=1.6+36*Math.pow(FL.r(),1.6);flower(fx+Math.sin(a)*r,fz-Math.cos(a)*r,.9,Math.floor(FL.r()*5));}
  w3Stipa(FL,fx,fz);M.flowers=FL;
  /* the lone elm on its knoll, and two far ones for depth */
  const TR=new Geo(41);w3Tree(TR,W3TREE[0],W3TREE[1],1.12,7);w3Tree(TR,-13.8,-65.8,.75,9);w3Tree(TR,52,-30,.7,13);M.tree=TR;
  /* cumulus: clusters of puffs with flat, shaded bases, far out around the sky */
  M.clouds=[];const CR=chRng(91);[-25,-58,-100,-150,165,125,40,8,-8,58,-38,108,-122,-178].forEach((yd,i)=>{const yaw=yd*Math.PI/180+(CR()-.5)*.16,d=145+CR()*45,Wd=34+CR()*36,Hd=13+CR()*11,y=22+CR()*16;
    const g=new Geo(100+i),bl=[],n=13+Math.floor(CR()*8);
    for(let k=0;k<n;k++){const u=CR()*2-1,top=1-Math.abs(u)*.75,r=(.15+.12*CR())*Wd*(.45+.55*top);bl.push([u*Wd*.5,CR()*Hd*.45*top+r*.2,(CR()*2-1)*Wd*.17,r]);}
    for(let k=0;k<3;k++){const r=(.2+.08*CR())*Wd;bl.push([(CR()*2-1)*.18*Wd,Hd*.35+CR()*Hd*.3,(CR()*2-1)*Wd*.08,r]);}
    g.blobs(bl,[0,-Wd*.3,0],.4,12,P=>{const k=.84+.16*Math.min(1,Math.max(0,P[1]/Hd));return [k,k,k*1.015];},null,0);M.clouds.push({g,yaw,d,y});});
  /* props that cast shadows */
  const g=new Geo(5);
  const ring=(q,r0,r1,h,col)=>{const sg=48;for(let i=0;i<sg;i++){const a0=i/sg*Math.PI*2,a1=(i+1)/sg*Math.PI*2,am=(a0+a1)/2;if(Math.abs(Math.atan2(Math.sin(am-Math.PI/2),Math.cos(am-Math.PI/2)))<GER_DOOR)continue;
    const c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1),n0=[c0,0,s0],n1=[c1,0,s1];q.triS([c0*r0,0,s0*r0],[c1*r0,0,s1*r0],[c1*r1,h,s1*r1],n0,n1,n1,col,.02);q.triS([c0*r0,0,s0*r0],[c1*r1,h,s1*r1],[c0*r1,h,s0*r1],n0,n1,n0,col,.02);}};
  const ger=(q,main)=>{if(main){ring(q,2.33,2.33,.22,C.rope);q.at([0,.22,0],{},w=>ring(w,2.3,2.3,1.08,C.felt));[.48,.92,1.24].forEach(y=>q.at([0,y,0],{},w=>ring(w,2.325,2.325,.045,C.rope)));}
    else{q.cyl(2.33,2.33,.22,48,C.rope,false);q.at([0,.22,0],{},w=>w.cyl(2.3,2.3,1.08,48,C.felt,false));
    [.48,.92,1.24].forEach(y=>q.at([0,y,0],{},w=>w.cyl(2.325,2.325,.045,48,C.rope,false)));}
    q.at([0,1.3,0],{},w=>w.cyl(2.45,2.28,.12,48,C.band,false));q.at([0,1.42,0],{},w=>w.cyl(2.28,.56,.78,48,C.felt2,false));
    for(let k=0;k<8;k++){const a=k/8*Math.PI*2+.2;q.at([Math.cos(a)*1.43,1.84,Math.sin(a)*1.43],{ry:-a,rz:-.426},w=>w.box(1.86,.03,.04,C.rope));}
    q.at([0,2.2,0],{},w=>w.cyl(.58,.58,.12,24,C.wood));q.at([0,2.32,0],{},w=>{w.box(1.1,.04,.06,C.wood2);w.box(.06,.04,1.1,C.wood2);w.cyl(.46,.46,.012,24,C.dark,true);});
    if(main){[-.53,.53].forEach(x=>q.at([x,.66,2.25],{},w=>w.box(.08,1.32,.12,C.wood2)));q.at([0,.025,2.25],{},w=>w.box(1.12,.05,.14,C.wood2));
      q.at([.52,1.25,2.36],{rz:Math.PI/2},w=>{w.cyl(.085,.085,1.04,14,C.flap);[.08,.96].forEach(y=>w.at([0,y,0],{},v=>v.cyl(.09,.09,.04,14,C.gold,false)));});}
    else q.at([0,.66,2.29],{},w=>{w.box(.98,1.28,.05,C.flap);w.at([0,.6,.03],{},v=>v.box(1.0,.07,.02,C.gold));w.at([0,-.6,.03],{},v=>v.box(1.0,.07,.02,C.gold));
      w.at([-.47,0,.03],{},v=>v.box(.06,1.24,.02,C.gold));w.at([.47,0,.03],{},v=>v.box(.06,1.24,.02,C.gold));w.at([0,.1,.035],{rz:.785},v=>v.box(.26,.26,.015,C.gold));
      w.at([0,.1,.045],{rz:.785},v=>v.box(.14,.14,.012,C.flap));});
    q.at([0,1.31,2.33],{},w=>w.box(1.1,.08,.1,C.wood2));};
  {const gg=new Geo(77);W3GERS.forEach(([x,z,s],i)=>gg.at([x,w3H(x,z)*(i?1:0),z],{s},q=>ger(q,!i)));M.gerOld=gg;}
  /* aaruul drying rack, a milk pail, hitching line, felt mat, a cart and an ovoo on the hill */
  g.at([5.1,w3H(5.1,1.9),1.9],{ry:-.5},q=>{[[-.5,-.25],[.5,-.25],[-.5,.25],[.5,.25]].forEach(([x,z])=>q.at([x,0,z],{},w=>w.cyl(.03,.03,.74,6,C.wood)));q.at([0,.74,0],{},w=>w.box(1.15,.04,.62,C.wood));});
  g.at([2.05,w3H(2.05,4.35),4.35],{},q=>{q.cyl(.16,.19,.28,16,C.wood);q.at([0,.28,0],{},w=>w.cyl(.15,.15,.01,16,C.cream,true));});
  g.at([-5.6,w3H(-5.6,3.0),3.0],{ry:.2},q=>{[-1.3,1.3].forEach(x=>q.at([x,0,0],{},w=>w.cyl(.06,.045,1.2,8,C.wood)));q.at([0,1.08,0],{rz:Math.PI/2},w=>w.cyl(.018,.018,2.6,6,C.rope,false));});
  g.at([2.3,w3H(2.3,5.4)+.012,5.4],{ry:.25},q=>{q.box(1.9,.025,1.35,C.gold);q.at([0,.01,0],{},w=>w.box(1.76,.025,1.22,C.red));q.at([0,.022,0],{rz:0},w=>w.box(.9,.006,.6,C.gold));q.at([0,.026,0],{},w=>w.box(.76,.006,.48,C.red));});
  g.at([-10,w3H(-10,7.5),7.5],{ry:.9},q=>{q.at([0,.55,0],{},w=>w.box(1.6,.08,.9,C.wood));[[-.5,.48],[-.5,-.48]].forEach(([x,z])=>q.at([x,.42,z],{rx:Math.PI/2},w=>w.cyl(.42,.42,.06,16,C.wood2)));q.at([1.2,.5,0],{rz:.1},w=>w.box(1.2,.05,.05,C.wood));});
  {const ox=26,oz=-34,oy=w3H(ox,oz);g.at([ox,oy,oz],{},q=>{for(let i=0;i<26;i++){const a=g.r()*6.28,d=g.r()*1.3,y=g.r()*1.2*(1-d/1.6);q.at([Math.cos(a)*d,y,Math.sin(a)*d],{s:[.35,.25,.3]},w=>w.sph(1,8,g.r()<.5?C.rock:C.rock2));}
    q.at([0,0,0],{},w=>w.cyl(.05,.03,3.2,6,C.wood));q.at([0,2.8,0],{},w=>w.box(.6,.05,.05,[.25,.5,.8]));});}
  /* herd grazing to the south-west */
  M.flock=[];for(let i=0;i<13;i++){const a=Math.PI*(.62+g.r()*.32),d=11.5+g.r()*9,x=Math.cos(a)*d,z=Math.sin(a)*d,goat=g.r()<.35;M.flock.push({hx:x,hz:z,x,z,ry:g.r()*6.28,goat});}
  M.sheepG=[91,92].map(sd=>{const q=new Geo(sd);w3Sheep(q,false,q.r);return q;});M.goatG=(()=>{const q=new Geo(93);w3Sheep(q,true,q.r);return q;})();
  /* rocks */
  for(let i=0;i<16;i++){const a=g.r()*Math.PI*2,d=7+g.r()*28,x=Math.cos(a)*d,z=Math.sin(a)*d,s=.2+g.r()*.45;g.at([x,w3H(x,z)-.05,z],{ry:g.r()*3,s:[s*1.4,s*.6,s]},q=>q.sph(1,10,g.r()<.5?C.rock:C.rock2,.08));}
  M.props=g;
  /* warm firelight around the door flap at night */
  const gl=new Geo(2);gl.at([0,2.335,0],{},q=>q.cyl(.44,.44,.01,24,[1,.6,.25],true));M.glow=gl;
  {const GI=w3GerInside();M.inner=GI.I;M.fire=GI.F;}M.aarRack=w3AaruulRack(18);M.aarPlate=w3AaruulPlate(6);
  M.horse=w3HorseGeo();M.herd=w3Herd(M.horse);
  const s=new Geo(5);s.sph(.22,12,hex("#E6E9EC"),.02);M.puff=s;
  const su=new Geo(9);su.cyl(.1,.1,.3,14,C.leather);su.at([0,.3,0],{},q=>q.cyl(.1,.1,.01,14,C.dark,true));M.sur=su;
  const sk=new Geo(2);sk.sph(240,24,[1,1,1],0);M.sky=sk;
  return M;}

/* time of day: sky, fog, sun light, ambient, clouds, light shafts, wind */
const sunDir=(az,el)=>{az*=Math.PI/180;el*=Math.PI/180;return [Math.cos(el)*Math.cos(az),Math.sin(el),Math.cos(el)*Math.sin(az)];};
const SKY3={
 dawn:{zen:hex("#12296E"),hor:hex("#FF9C55"),fog:hex("#E9B8A2"),lc:hex("#FFB46C"),sky:hex("#8EA8D8"),gnd:hex("#4C5434"),dir:sunDir(-8,6),sunC:hex("#FFC27A"),fogR:[30,320],night:0,cloud:.42,ray:.7,wind:.05,glow:1,photo:.25},
 day:{zen:hex("#2F74D6"),hor:hex("#CFE6F8"),fog:hex("#C6D8EE"),lc:hex("#FFF1D6"),sky:hex("#8DB7D8"),gnd:hex("#56693A"),dir:sunDir(60,48),sunC:hex("#FFF3D0"),fogR:[40,380],night:0,cloud:.58,ray:.45,wind:.075,glow:.12,photo:1},
 day2:{zen:hex("#3A70C4"),hor:hex("#FFD7A8"),fog:hex("#E8D0C2"),lc:hex("#FFDCA2"),sky:hex("#94B3CA"),gnd:hex("#5A6438"),dir:sunDir(128,24),sunC:hex("#FFE0A0"),fogR:[34,340],night:0,cloud:.5,ray:.6,wind:.06,glow:.45,photo:.75},
 sunset:{zen:hex("#262879"),hor:hex("#FF7E4A"),fog:hex("#D08A90"),lc:hex("#FF8E52"),sky:hex("#6E6E9E"),gnd:hex("#43402C"),dir:sunDir(186,7),sunC:hex("#FFA35E"),fogR:[26,300],night:0,cloud:.62,ray:.8,wind:.045,glow:1,photo:.22},
 night:{zen:hex("#050C20"),hor:hex("#1A2E58"),fog:hex("#111E3A"),lc:hex("#6F86BA"),sky:hex("#1E3158"),gnd:hex("#0E1522"),dir:sunDir(110,38),sunC:hex("#DCE6FF"),fogR:[20,240],night:1,cloud:.22,ray:0,wind:.03,glow:0,photo:0}};
function skyMix(a,b,t){const o={};for(const k in a){o[k]=Array.isArray(a[k])?a[k].map((v,i)=>v+(b[k][i]-v)*t):a[k]+(b[k]-a[k])*t;}o.dir=V3.norm(o.dir);return o;}

const W3HP=`#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`+W3GRADE_GLSL;
const W3VS=`attribute vec3 aP,aN,aC;attribute float aS;attribute vec2 aUV;uniform mat4 uVP,uM,uLVP;uniform float uT,uWind;varying vec3 vN,vC,vW;varying vec4 vL;varying vec2 vUV;
void main(){vec4 w=uM*vec4(aP,1.);if(aS>0.){float ph=uT*1.9+w.x*.33+w.z*.27;float gust=.6+.4*sin(uT*.55+w.x*.05);w.xyz+=aS*vec3(sin(ph)+.35*sin(ph*2.7),-.15,cos(ph*.8)*.6)*uWind*gust;}
vW=w.xyz;vN=(uM*vec4(aN,0.)).xyz;vC=aC;vUV=aUV;vL=uLVP*w;gl_Position=uVP*w;}`;
const W3FS=W3HP+`varying vec3 vN,vC,vW;varying vec4 vL;varying vec2 vUV;uniform sampler2D uDet;uniform sampler2D uMap;uniform float uMapOn;
uniform vec3 uL,uLC,uSky,uGnd,uFog,uCam,uTint,uZen,uHor,uSunC;uniform vec2 uFogR;uniform float uPhoto,uEmit,uSkyM,uTf,uNight,uShOn,uTex,uCloud,uExp,uCld,uSheen,uAlpha,uFlip,uWater,uBrush,uBrushS,uGlow;uniform sampler2D uSh;
float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1.,0.)),f.x),mix(hs(i+vec2(0.,1.)),hs(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*vn(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
/* Monet strokes painted onto the surface itself: streaks in three directions, each owning soft patches, so they stay put in 3D */
float brush(vec2 p){float s0=vn(vec2(p.x*.7,p.y*7.)),s1=vn(vec2(dot(p,vec2(.5,.866))*.7,dot(p,vec2(-.866,.5))*7.)+3.1),s2=vn(vec2(dot(p,vec2(-.5,.866))*.7,dot(p,vec2(-.866,-.5))*7.)+7.3);
 vec3 w=pow(vec3(vn(p*.12),vn(p*.12+5.3),vn(p*.12+11.7)),vec3(6.));w/=w.x+w.y+w.z+1e-4;return s0*w.x+s1*w.y+s2*w.z;}
/* Van Gogh sky: the sky is twisted around a few big whirls, then laid in rows of short coloured dashes */
vec2 twirl(vec2 p,vec2 c,float r,float s){vec2 q=p-c;float k=exp(-dot(q,q)/(r*r))*s,cs=cos(k),sn=sin(k);return c+vec2(cs*q.x-sn*q.y,sn*q.x+cs*q.y);}
vec3 vgSky(vec3 d,vec3 c){float az=atan(d.z,d.x),el=asin(clamp(d.y,-1.,1.)),t=uTf*.03;vec2 p0=vec2(az,el)*4.,p=p0;
 p=twirl(p,vec2(-2.,1.45),1.2,5.4+sin(t)*.4);p=twirl(p,vec2(1.4,1.05),.95,-4.8+cos(t*.8)*.35);p=twirl(p,vec2(4.6,1.6),1.1,5.);p=twirl(p,vec2(-5.1,1.1),1.,-4.6);p=twirl(p,vec2(8.8,1.3),1.,4.6);p=twirl(p,vec2(-9.,1.7),1.1,-4.2);
 /* long strokes that follow the swirled flow: soft lanes, with streaks stretched along the flow and thin across it */
 float w=p.y*2.4+sin(p.x*.8+t*2.)*.32+sin(p.x*2.1-t)*.1,lane=.5+.5*sin(w*6.2832);
 float s1=vn(vec2(p.x*.8,w*5.5)),s2=vn(vec2(p.x*1.6+5.3,w*10.)),s3=vn(vec2(p.x*2.8+11.,w*17.));
 float k1=smoothstep(.42,.6,s1),k2=smoothstep(.55,.72,s2),k3=smoothstep(.62,.78,s3);
 vec3 deep=c*vec3(.74,.88,1.2),pale=mix(c,vec3(.93,.96,1.),.42),cyan=c*vec3(.84,1.04,1.26)+vec3(.02,.05,.09),gold=mix(c,uSunC,.42)+.05;
 vec3 dc=mix(deep,pale,smoothstep(.25,.95,lane*.55+s1*.55));dc=mix(dc,cyan,k2*.55);dc=mix(dc,pale*1.05,k3*.45);
 vec3 nd=mix(vec3(.035,.07,.24),vec3(.13,.25,.6),smoothstep(.2,.95,lane*.5+s1*.6));nd=mix(nd,vec3(.3,.5,.88),k2*.42);nd=mix(nd,vec3(.85,.8,.46),k3*.24);
 dc=mix(dc,nd,uNight*.88);
 /* the heart of each whirl glows a little */
 float hw=0.;hw+=exp(-dot(p0-vec2(-2.,1.45),p0-vec2(-2.,1.45))*2.2);hw+=exp(-dot(p0-vec2(1.4,1.05),p0-vec2(1.4,1.05))*2.8);hw+=exp(-dot(p0-vec2(4.6,1.6),p0-vec2(4.6,1.6))*2.4);
 dc=mix(dc,mix(gold,vec3(.95,.92,.62),uNight),hw*.22*(.5+.5*lane));
 float sk=smoothstep(0.,.05,d.y),amt=(.72-.46*uGlow)*sk;c=mix(c,c*.93,sk*.3);
 return mix(c,dc,amt*(.6+.4*max(k1,lane*.8)));}
/* a soft halo that turns slowly in a spiral around a star, the moon or the sun */
float swirlHalo(vec3 d,vec3 S,float R,float k){vec3 q=d-S;float r=length(q);vec3 T1=normalize(cross(S,vec3(0.,1.,0.))+vec3(1e-4,0.,1e-4)),T2=cross(S,T1);float a=atan(dot(q,T2),dot(q,T1));
 return smoothstep(R,0.,r)*(.6+.4*sin(a*2.-r*k+uTf*.5));}
float upk(vec4 c){return dot(c,vec4(1.,1./255.,1./65025.,1./16581375.));}
float shade(){vec3 p=vL.xyz/vL.w*.5+.5;if(p.x<.002||p.x>.998||p.y<.002||p.y>.998||p.z>1.)return 1.;float s=0.;
 for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++){s+=(p.z-.0009>upk(texture2D(uSh,p.xy+vec2(float(i),float(j))*.00075)))?0.:1.;}return s/9.;}
vec3 photoSky(float e){vec3 c=mix(vec3(.663,.706,.725),vec3(.788,.839,.863),smoothstep(-20.,-3.,e));c=mix(c,vec3(.875,.922,.941),smoothstep(-3.,.5,e));
 c=mix(c,vec3(.804,.902,.945),smoothstep(.5,2.,e));c=mix(c,vec3(.714,.855,.937),smoothstep(2.,4.,e));c=mix(c,vec3(.608,.792,.918),smoothstep(4.,7.,e));
 c=mix(c,vec3(.49,.698,.871),smoothstep(7.,12.,e));c=mix(c,vec3(.392,.6,.804),smoothstep(12.,20.,e));c=mix(c,vec3(.322,.518,.725),smoothstep(20.,30.,e));
 c=mix(c,vec3(.294,.478,.69),smoothstep(30.,40.,e));return mix(c,vec3(.267,.447,.651),smoothstep(40.,55.,e));}
vec3 skyCol(vec3 d){float h=max(d.y,0.),sd=max(dot(d,uL),0.);
 vec2 hz=normalize(d.xz+vec2(1e-4)),sz=normalize(uL.xz+vec2(1e-4));float az=dot(hz,sz)*.5+.5;
 /* three bands: warm horizon, a pale lilac-blue belt, deep zenith */
 vec3 mid=mix(uHor,uZen,mix(.5,.64,uGlow))*vec3(.9,1.,1.12)+vec3(.03,.05,.12)*uGlow;
 vec3 c=mix(uHor,mid,smoothstep(0.,.2,h));c=mix(c,uZen,smoothstep(.12,.8,h));
 /* a low sun lights a warm band along the horizon: gold towards the sun, rose away from it */
 float band=exp(-h*6.5);vec3 warm=mix(vec3(.96,.46,.56),uSunC*vec3(1.06,.68,.38),pow(az,2.));
 c=mix(c,warm,band*(.42+.55*pow(az,3.))*uGlow);
 c+=uSunC*vec3(1.,mix(1.,.8,uGlow),mix(1.,.6,uGlow))*(pow(sd,5.)*mix(.14,.07,uGlow)+pow(sd,40.)*.38+pow(sd,350.)*.7)*(1.-uNight*.75);
 c*=mix(1.,.74,uGlow);
 c=mix(vgSky(d,c),c,uNight*.95);
 if(uPhoto>0.){vec3 ph=photoSky(degrees(asin(clamp(d.y,-1.,1.))))+uSunC*(pow(sd,5.)*.08+pow(sd,40.)*.3);c=mix(c,ph,uPhoto);}
 c+=uSunC*mix(.22,.1,uGlow)*swirlHalo(d,uL,.16,70.)*(1.-uNight);
 c=mix(c,uSunC*1.75+vec3(.25),smoothstep(mix(.99935,.9987,uGlow),mix(.99975,.9993,uGlow),sd)*(1.-uNight*.55));
 if(uNight>.01){vec2 sp=d.xz/(d.y+1.)*300.;float r=hs(floor(sp));float st=step(.988,r)*smoothstep(.32,.0,length(fract(sp)-.5))*(.6+.4*sin(uTf*2.6+r*60.))*(.6+r*.4);
  float mw=pow(fbm(d.xz*3.4+vec2(d.y*3.)),2.2)*smoothstep(.42,0.,abs(d.x*.62+d.z*.78-.12))*.35;c+=(vec3(st)+vec3(.5,.56,.9)*mw)*uNight*smoothstep(0.,.18,d.y);
  vec3 big=vec3(0.);for(int i=0;i<7;i++){float fi=float(i),a=-2.3+fi*.83+sin(fi*3.7)*.2,e=.34+.22*fract(sin(fi*12.9)*43.7);vec3 S=vec3(cos(e)*cos(a),sin(e),cos(e)*sin(a));float r=length(d-S);
   big+=vec3(1.,.93,.58)*(swirlHalo(d,S,.08,110.)*.42+smoothstep(.012,.003,r)*1.4);}
  float rm=length(d-uL);big+=vec3(1.,.86,.45)*(swirlHalo(d,uL,.17,60.)*.5+smoothstep(.035,.026,rm)*smoothstep(.0,.02,length(d-uL-vec3(.012,.01,0.))-.026)*1.6);
  c+=big*uNight*smoothstep(0.,.08,d.y);}
 return c;}
void main(){vec3 V=normalize(vW-uCam);
 if(uSkyM>.5){gl_FragColor=vec4(w3GradeSky(skyCol(V))*uExp,1.);return;}
 vec3 n=normalize(vN);if(!gl_FrontFacing&&uFlip>.5)n=-n;
 if(uCld>.5){float k=smoothstep(-.5,.75,dot(n,uL)*.45+n.y*.55+.2);vec3 lit=mix(vec3(1.),uSunC,.38+.4*uGlow)*1.08,dk=mix(mix(uSky,uHor,.5)*.86+vec3(.1),vec3(.62,.48,.74),.45*uGlow);
  vec3 c=mix(dk,lit,k)*vC;if(uBrush>0.){vec3 an=abs(n);vec2 bp=an.y>max(an.x,an.z)?vW.xz:(an.x>an.z?vW.zy:vW.xy);c*=1.+(brush(bp*uBrushS)-.5)*.5*uBrush;}float rim=pow(1.-max(dot(n,-V),0.),2.5)*pow(max(dot(V,uL),0.),3.);c+=uSunC*rim*.8*(1.-uNight);
  c=mix(c,uZen*.5+uHor*.22,uNight*.88);c=mix(c,uHor,.1+.25*smoothstep(130.,230.,distance(vW,uCam)));gl_FragColor=vec4(w3Grade(c)*uExp,1.);return;}
 if(uWater>.5){float tt=uTf*.3;vec2 q=vW.xz*1.7;float h0=vn(q+vec2(tt,tt*.6)),hx=vn(q+vec2(.35+tt,tt*.6)),hz=vn(q+vec2(tt,.35+tt*.6));
  vec3 wn=normalize(vec3((h0-hx)*.45,1.,(h0-hz)*.45)),R=reflect(V,wn);R.y=abs(R.y)+.02;R=normalize(R);
  float fr=.06+.94*pow(1.-max(dot(-V,wn),0.),4.);vec3 c=mix(vec3(.05,.13,.15)*(mix(uGnd,uSky,.8)+uLC*.3),skyCol(R),clamp(fr+.4,0.,1.));
  c=mix(c,uZen*.95+vec3(.03,.06,.08),.32*(1.-uNight*.5));c*=.9+.2*vn(vec2(vW.x*.9,vW.z*9.));c+=uSunC*pow(max(dot(R,uL),0.),220.)*5.*(1.-uNight);c=mix(c,uFog,smoothstep(uFogR.x,uFogR.y,distance(vW,uCam)));gl_FragColor=vec4(w3Grade(c)*uExp,1.);return;}
 vec3 base=vC*uTint;if(uMapOn>.5)base*=texture2D(uMap,vUV).rgb;if(uMapOn>1.5){vec2 q=vW.xz;float gd=texture2D(uDet,q/.75).r*.6+texture2D(uDet,mat2(.8,-.6,.6,.8)*q/.26+.37).r*.4;base*=mix(1.,.4+1.2*gd,smoothstep(22.,2.,distance(vW,uCam)));}
 if(uTex>0.){float t=vn(vW.xz*2.3+vW.y*1.7)*.55+vn(vW.xz*11.+vW.y*7.)*.45;base*=1.+(t-.5)*.32*uTex;}
 if(uBrush>0.){vec3 an=abs(n);vec2 bp=an.y>max(an.x,an.z)?vW.xz:(an.x>an.z?vW.zy:vW.xy);float d0=distance(vW,uCam),f2=smoothstep(28.,52.,d0);
  float st=f2<1.?brush(bp*uBrushS):.5;if(f2>0.)st=mix(st,brush(bp*uBrushS*.2+3.),f2);float db=vn(bp*uBrushS*.35+13.),am=uBrush*(1.-smoothstep(140.,280.,d0));
  base*=1.+(st-.5)*.5*am;base+=(db-.5)*vec3(.14,.04,-.1)*am;}
 if(uSheen>0.){vec2 q=vW.xz;float pm=smoothstep(.3,.7,vn(q*.045)*.6+vn(q*.13+7.)*.4),pd=vn(q*.55);base*=mix(1.,mix(.74,1.14,pm)*mix(.93,1.07,pd),uSheen);base=mix(base,base*vec3(1.06,1.04,.8),pm*.3*uSheen);float ph=vn(q*.028+3.);base=mix(base,base*vec3(1.42,.98,1.0),smoothstep(.6,.88,ph)*.55*uSheen);base=mix(base,base*vec3(1.18,1.06,.68),smoothstep(.4,.12,ph)*.45*uSheen);
  float wv=sin(dot(vW.xz,vec2(.944,.33))*.21-uTf*1.55)*.5+.5;wv*=wv;float fl=smoothstep(.8,.97,n.y)*uSheen;base*=1.+(wv*.2-.04)*fl;base+=vec3(.03,.03,.008)*wv*fl;}
 float d=max(dot(n,uL),0.);float sh=uShOn>.5?shade():1.;float hemi=n.y*.5+.5;vec3 amb=mix(uGnd,uSky,hemi);amb=mix(vec3(dot(amb,vec3(.33))),amb,.55);
 float rim=pow(1.-max(dot(n,-V),0.),3.)*max(dot(V,uL),0.);
 vec3 c=base*(amb*.8+uLC*d*sh*1.15)+uSunC*rim*sh*.35*(1.-uNight);c=mix(c,vec3(dot(c,vec3(.3,.5,.2)))*vec3(.62,.78,1.05),uNight*.5);c=mix(c,base*1.6,uEmit);
 float dist=distance(vW,uCam);float f=smoothstep(uFogR.x,uFogR.y,dist);float mist=exp(-max(vW.y,0.)*.45)*smoothstep(8.,70.,dist)*.2*(1.-uEmit);
 vec3 fc=uFog+uSunC*pow(max(dot(V,uL),0.),12.)*.38*(1.-uNight);c=mix(c,fc,clamp(f+mist,0.,1.));gl_FragColor=vec4(w3Grade(c)*uExp,uMapOn>1.5?texture2D(uMap,vUV).a:uAlpha<.999?uAlpha*pow(max(dot(n,-V),0.),1.4):1.);}`;
const W3SVS=`attribute vec3 aP;uniform mat4 uLVP,uM;varying float vZ;void main(){vec4 p=uLVP*(uM*vec4(aP,1.));vZ=p.z/p.w*.5+.5;gl_Position=p;}`;
const W3SFS=W3HP+`varying float vZ;void main(){vec4 e=fract(vZ*vec4(1.,255.,65025.,16581375.));e-=e.yzww*vec4(1./255.,1./255.,1./255.,0.);gl_FragColor=e;}`;
const W3PVS=`attribute vec2 aQ;varying vec2 v;void main(){v=aQ*.5+.5;gl_Position=vec4(aQ,0.,1.);}`;
const W3PFS=W3HP+`varying vec2 v;uniform sampler2D uS;uniform vec2 uSun,uRes;uniform float uRay,uT,uOut,uPaint,uNt;
float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1.,0.)),f.x),mix(h2(i+vec2(0.,1.)),h2(i+vec2(1.,1.)),f.x),f.y);}
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
void main(){vec2 px=1./uRes;float sc=uRes.y/700.;vec3 c=texture2D(uS,v).rgb;
 float eg=0.;
 if(uPaint>.5)eg=length(texture2D(uS,v+vec2(px.x,0.)*1.5*sc).rgb-c)+length(texture2D(uS,v+vec2(0.,px.y)*1.5*sc).rgb-c);
 if(uRay>.001){vec2 dl=(v-uSun)*(1./30.)*.92;vec2 p=v;float dec=1.;vec3 acc=vec3(0.);
  for(int i=0;i<30;i++){p-=dl;vec3 s=texture2D(uS,clamp(p,.001,.999)).rgb;acc+=s*max(dot(s,vec3(.35,.45,.2))-.56,0.)*dec;dec*=.93;}c+=acc*uRay*.34;}
 vec3 b=vec3(0.);for(int i=0;i<8;i++){float an=float(i)*.785398;vec2 o=vec2(cos(an),sin(an));b+=max(texture2D(uS,v+o*px*3.5).rgb-.58,0.)+max(texture2D(uS,v+o*px*9.).rgb-.58,0.);}
 c+=b*.11;c=aces(c*uOut);float l=dot(c,vec3(.299,.587,.114));c=mix(c,c*vec3(.9,.98,1.1),(1.-l)*.4);c=mix(c,c*vec3(1.07,1.,.9),l*.3);c=mix(vec3(l),c,${W3GRADE.post.toFixed(3)});
 if(uPaint>.5){l=dot(c,vec3(.299,.587,.114));
  float nl=1.-uNt*.75;c+=vec3(.1,.05,.2)*(1.-l)*(1.-l)*.6*nl;c=mix(c,c*.94+vec3(.05,.045,.05),nl*.6);c+=vec3(.035,.02,-.025)*l*l;
  c=mix(c,c*vec3(.56,.5,.72),smoothstep(.14,.42,eg)*.28);c=mix(c,vec3(c.r*.97,c.g,c.b*1.08+.015),.3*nl);}
 vec2 q=v-.5;c*=1.-dot(q,q)*(uPaint>.5?.4:.62);if(uPaint<.5)c+=(fract(sin(dot(v*uRes+uT*61.,vec2(12.9898,78.233)))*43758.5453)-.5)*.028;gl_FragColor=vec4(c,1.);}`;
/* GPU grass: every tuft is drawn from one small template; blades taper, lean, ride wind waves that roll across the steppe, and glow when the sun is behind them */
const W3GVS=`attribute vec3 aV;attribute vec4 aI0,aI1;attribute vec3 aI2;attribute vec2 aI3;uniform mat4 uVP,uLVP;uniform float uT,uWind,uKeep,uTexOn,uFar;uniform vec3 uCamV;varying vec3 vW,vN,vC;varying vec4 vL;varying vec3 vP;varying float vTip;varying vec3 vUVt;
float h1(float n){return fract(sin(n)*43758.5453);}
float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1.,0.)),f.x),mix(hs(i+vec2(0.,1.)),hs(i+vec2(1.,1.)),f.x),f.y);}
void main(){float b=aV.z,sd=aI0.w,t=aV.y,k=aI1.z;if(h1(sd*3.3+.7)>uKeep){gl_Position=vec4(2.,2.,2.,1.);return;}
 vec2 q=aI0.xz;vP=vec3(smoothstep(.3,.7,vn(q*.045)*.6+vn(q*.13+7.)*.4),vn(q*.55),vn(q*.028+3.));
 float r1=h1(sd*1.31+b*7.13),r2=h1(sd*.73+b*3.71+1.7),r3=h1(sd*2.17+b*5.39+3.1);
 float phi=sd*6.2831+b*1.0472+(r1-.5)*.7;vec2 o=vec2(cos(phi),sin(phi)),tg=vec2(-o.y,o.x),wd=vec2(.944,.33);
 float fcm=uFar>.5?smoothstep(10.,15.,distance(aI0.xz,uCamV.xz)):1.;if(fcm<.01){gl_Position=vec4(2.,2.,2.,1.);return;}float h=aI1.x*(.8+.2*r2)*fcm,w=aI1.y*(.8+.4*r3);
 vec3 base=aI0.xyz+vec3(o.x,0.,o.y)*(.25+.75*r3)*.055*k;
 float wave=sin(dot(aI0.xz,wd)*.21-uT*1.55)*.5+.5;wave*=wave;
 float gust=.65+.35*sin(uT*.43+aI0.x*.03),flut=sin(uT*3.7+sd*9.+b*1.3),tt=t*t;
 vec2 disp=o*(.1+.16*r1)*h*t*sqrt(t)+wd*((wave*1.1+.3)*gust+flut*.06)*uWind*4.*h*tt;
 float tx=uTexOn*(1.-uFar),y=h*t*(1.-.22*tt*min(length(disp)/h,1.)),wid=w*(1.-mix(.8,.35,tx)*tt)*aV.x;
 vec3 p=base+vec3(tg.x*wid+disp.x,y,tg.y*wid+disp.y);
 vec3 tn=vec3(aI3.x,sqrt(max(0.,1.-dot(aI3,aI3))),aI3.y);
 vW=p;vN=normalize(tn+vec3(o.x,0.,o.y)*.12*t+vec3(disp.x,0.,disp.y)/h*.25);
 float cv=aI1.w;vec3 c=aI2*mix(.56,1.02,smoothstep(0.,.75,t))*(.985+.03*r2)+vec3(.03,.04,.01)*wave*gust*t;c*=.84+.32*vn(aI0.xz*1.3+21.);c+=(h1(sd*7.7)-.5)*vec3(.16,.05,-.1)+(h1(sd*3.1+.4)-.5)*vec3(-.06,.04,.12);c=max(c,0.);
 float zone=smoothstep(.55,.85,(.5+.5*sin(aI0.x*.083+1.7*sin(aI0.z*.061)))*(.5+.5*sin(aI0.z*.097-.8*sin(aI0.x*.05)))*2.2);
 float fl=step(mix(.965,.78,zone),cv)*step(b,1.5)*step(.7,t)*step(1.6,k);
 float dc=h1(floor(aI0.x/11.)+floor(aI0.z/11.)*57.13);dc=r3<.7?dc:r3;
 vec3 fc=dc<.24?vec3(.36,.5,.92):(dc<.46?vec3(.95,.62,.74):(dc<.68?vec3(.98,.82,.3):(dc<.88?vec3(.97,.95,.9):vec3(.92,.32,.22))));
 c=mix(c,fc,fl);
 vC=c;vTip=t*(1.-fl);vUVt=vec3((floor(h1(sd*5.1+b*2.37)*3.999)+aV.x*.5+.5)*.25,1.-t,fl);vL=uLVP*vec4(p,1.);gl_Position=uVP*vec4(p,1.);}`;
const W3GFS=W3HP+`varying vec3 vW,vN,vC;varying vec4 vL;varying vec3 vP;varying float vTip;varying vec3 vUVt;uniform sampler2D uGT;uniform float uTexOn,uFar;
uniform vec3 uL,uLC,uSky,uGnd,uFog,uCam,uSunC;uniform vec2 uFogR;uniform float uNight,uShOn,uExp;uniform sampler2D uSh;
float upk(vec4 c){return dot(c,vec4(1.,1./255.,1./65025.,1./16581375.));}
float shade(){vec3 p=vL.xyz/vL.w*.5+.5;if(p.x<.002||p.x>.998||p.y<.002||p.y>.998||p.z>1.)return 1.;float s=0.;
 for(int i=0;i<2;i++)for(int j=0;j<2;j++){s+=(p.z-.0012>upk(texture2D(uSh,p.xy+(vec2(float(i),float(j))-.5)*.0011)))?0.:1.;}return s*.25;}
void main(){vec3 n=normalize(vN),V=normalize(vW-uCam);float sh=uShOn>.5?shade():1.;
 float m=vP.x,dd=vP.y;
 vec3 alb=vC*mix(.74,1.14,m)*mix(.93,1.07,dd);alb=mix(alb,alb*vec3(1.06,1.04,.8),m*.3);
 alb=mix(alb,alb*vec3(1.42,.98,1.0),smoothstep(.6,.88,vP.z)*.55);alb=mix(alb,alb*vec3(1.18,1.06,.68),smoothstep(.4,.12,vP.z)*.45);
 if(uTexOn>.5&&uFar<.5&&vUVt.z<.5){vec4 tx=texture2D(uGT,vUVt.xy);if(tx.a<mix(.5,.22,smoothstep(4.,30.,distance(vW,uCam))))discard;alb=mix(alb*1.05,tx.rgb*clamp(alb/vec3(.35,.58,.25),.55,1.6),.75);}
 float d=dot(n,uL)*.5+.5;d*=d;vec3 amb=mix(uGnd,uSky,.35+.5*n.y);amb=mix(vec3(dot(amb,vec3(.33))),amb,.55);
 float bl=pow(max(dot(V,uL),0.),6.)*vTip*(1.-uNight)*.5;
 alb=max(mix(vec3(dot(alb,vec3(.3,.5,.2))),alb,${W3GRADE.grass.toFixed(3)}),0.);vec3 c=alb*(amb*.66+uLC*d*sh*.98)+alb*uSunC*bl*sh*.7;
 c=mix(c,vec3(dot(c,vec3(.3,.5,.2)))*vec3(.62,.78,1.05),uNight*.65)*(1.-uNight*.3);
 float dist=distance(vW,uCam),f=smoothstep(uFogR.x,uFogR.y,dist),mist=exp(-max(vW.y,0.)*.45)*smoothstep(8.,70.,dist)*.2;
 vec3 fc=uFog+uSunC*pow(max(dot(V,uL),0.),12.)*.38*(1.-uNight);c=mix(c,fc,clamp(f+mist,0.,1.));gl_FragColor=vec4(w3Grade(c)*uExp,1.);}`;
function w3Create(cv){let gl=null;try{gl=cv.getContext("webgl",{antialias:true,alpha:false,powerPreference:"high-performance"})||cv.getContext("experimental-webgl");}catch(e){}if(!gl)return null;
  const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o;};
  const prog=(vs,fs,at,un)=>{const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));const L={p};at.forEach(k=>L[k]=gl.getAttribLocation(p,k));un.forEach(k=>L[k]=gl.getUniformLocation(p,k));return L;};
  const W={gl,meshes:[],q:{dpr:Math.min(window.devicePixelRatio||1,W3Q.dprMax),shadows:W3Q.shadow>0,post:W3Q.post,grass:W3Q.grass},ft:[],n:0};
  W.prog=prog;W.main=prog(W3VS,W3FS,["aP","aN","aC","aS","aUV"],W.mainU=["uPhoto","uDet","uMap","uMapOn","uVP","uM","uLVP","uT","uWind","uL","uLC","uSky","uGnd","uFog","uCam","uTint","uZen","uHor","uSunC","uFogR","uEmit","uSkyM","uTf","uNight","uShOn","uTex","uCloud","uExp","uSh","uCld","uSheen","uAlpha","uFlip","uWater","uBrush","uBrushS","uGlow"]);
  try{W.shp=prog(W3SVS,W3SFS,["aP"],["uLVP","uM"]);W.post=prog(W3PVS,W3PFS,["aQ"],["uS","uSun","uRes","uRay","uT","uOut","uPaint","uNt"]);}catch(e){W.q.post=false;W.q.shadows=false;}
  const fbo=(w,h,filter)=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T].forEach(k=>gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filter);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,filter);
    const rb=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,rb);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,w,h);
    const f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,rb);
    const ok=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;gl.bindFramebuffer(gl.FRAMEBUFFER,null);return ok?{f,t,rb,w,h}:null;};
  W.fbo=fbo;if(W.q.shadows){W.shadow=fbo(W3Q.shadow||1024,W3Q.shadow||1024,gl.NEAREST);if(!W.shadow)W.q.shadows=false;}
  W.quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,W.quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  W.blank=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,W.blank);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
  W.inst=gl.getExtension("ANGLE_instanced_arrays");
  if(W.inst){try{const P=prog(W3GVS,W3GFS,["aV","aI0","aI1","aI2","aI3"],["uVP","uLVP","uT","uWind","uCam","uL","uLC","uSky","uGnd","uFog","uSunC","uFogR","uNight","uShOn","uExp","uSh","uKeep","uGT","uTexOn","uFar","uCamV"]);
    const tpl=far=>{const tp=w3GrassTpl(far),tb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,tb);gl.bufferData(gl.ARRAY_BUFFER,tp.v,gl.STATIC_DRAW);
      const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,tp.i,gl.STATIC_DRAW);return {tb,ib,ni:tp.i.length};};
    W.gr={p:P,t:[tpl(false),tpl(true)],sets:[],n:0};
    /* Amy's grass ("Grass" by Cosmic_dust, CC BY 4.0): each blade wears one of four photographed leaves; until they load the plain blades stay */
    const gi=new Image();gi.onload=()=>{if(!W.gr||(gl.isContextLost&&gl.isContextLost()))return;const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,gi);
      gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);W.gr.tex=t;};gi.src=W3BASE+"grass_blades.webp";}catch(e){W.gr=null;}}
  try{const d=gl.getExtension("WEBGL_debug_renderer_info");W3INFO.gpu=String(d?gl.getParameter(d.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)).slice(0,40);}catch(e){}W3INFO.q=W.q;
  W.aniso=gl.getExtension("EXT_texture_filter_anisotropic")||gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic");
  gl.enable(gl.DEPTH_TEST);return W;}
function w3Mesh(W,geo,o){const gl=W.gl,b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(geo.v),gl.STATIC_DRAW);
  const m=Object.assign({b,n:geo.v.length/10,m:M4.id(),emit:0,tint:[1,1,1],on:true,sky:0,nofog:0,cast:0,tex:0,cld:0,sheen:0,alpha:1,flip:1,water:0,brush:0,brushS:4},o||{});W.meshes.push(m);return m;}
function w3GrassUp(W,D){const gl=W.gl,G=W.gr,buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,D.d,gl.STATIC_DRAW);G.sets.push({buf,rng:D.rng,SEC:D.SEC,n:D.n,t:G.t[D.far?1:0]});G.n+=D.n;}
function w3Bind(gl,L,m,full){const st=m.st||40;gl.bindBuffer(gl.ARRAY_BUFFER,m.b);gl.enableVertexAttribArray(L.aP);gl.vertexAttribPointer(L.aP,3,gl.FLOAT,false,st,0);
  if(full){gl.enableVertexAttribArray(L.aN);gl.vertexAttribPointer(L.aN,3,gl.FLOAT,false,st,12);gl.enableVertexAttribArray(L.aC);gl.vertexAttribPointer(L.aC,3,gl.FLOAT,false,st,24);
    gl.enableVertexAttribArray(L.aS);gl.vertexAttribPointer(L.aS,1,gl.FLOAT,false,st,36);
    if(L.aUV!=null&&L.aUV>=0){if(m.uv){gl.enableVertexAttribArray(L.aUV);gl.vertexAttribPointer(L.aUV,2,gl.FLOAT,false,st,40);}else gl.disableVertexAttribArray(L.aUV);}}}
function w3Draw(W,cam,env,t){const gl=W.gl,cv=gl.canvas,dpr=W.q.dpr,w=Math.max(2,Math.round(cv.clientWidth*dpr)),h=Math.max(2,Math.round(cv.clientHeight*dpr));
  /* slow phone? lower the resolution, then switch off shadows */
  const now=performance.now();if(W.last){W.ft.push(Math.min(150,now-W.last));if(W.ft.length>=30){const a=W.ft.slice().sort((x,y)=>x-y)[Math.floor(W.ft.length*.6)];W.ft=[];W3INFO.ms=a;
    if(!window.__w3lock&&a>34){W.good=0;if(W.up)W.bounce=(W.bounce||0)+1;W.up=0;const q=W.q,L=[["dpr",v=>v>1.5,1.5],["dpr",v=>v>1,1],["grass",v=>v>.6,.6],["shadows",v=>v,false],["grass",v=>v>.38,.38],["post",v=>v,false],["dpr",v=>v>.75,.75],["grass",v=>v>.22,.22],["dpr",v=>v>.6,.6]];
      let steps=a>70?3:a>48?2:1;for(const [k,need,to] of L){if(!steps)break;if(need(q[k])){(W.qs=W.qs||[]).push([k,q[k]]);q[k]=to;steps--;}}}
    /* fast again (inside the ger, say): give back what was taken, one step at a time */
    else if(!window.__w3lock&&a<21&&W.qs&&W.qs.length&&(W.bounce||0)<3){if(++W.good>=3){const [k,v]=W.qs.pop();W.q[k]=v;W.good=0;W.up=1;}}else W.good=0;}}W.last=now;
  if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}
  if(W.q.post&&(!W.scene||W.scene.w!==w||W.scene.h!==h)){if(W.scene){gl.deleteFramebuffer(W.scene.f);gl.deleteTexture(W.scene.t);gl.deleteRenderbuffer(W.scene.rb);}W.scene=W.fbo(w,h,gl.LINEAR);if(!W.scene)W.q.post=false;}
  const asp=w/h,fov=2*Math.atan(Math.tan((asp<1?62:50)*Math.PI/360)/(self.W3ZOOM||1)),P=M4.persp(fov,asp,.1,700,asp<1?-.34:-.18),V=M4.look(cam.pos,V3.add(cam.pos,camFwd(cam))),VP=M4.mul(P,V);
  cam.VP=VP;cam.W=cv.clientWidth;cam.H=cv.clientHeight;
  const ctr=W3SHC,LVP=M4.mul(M4.ortho(-25,25,-25,25,1,170),M4.look(V3.add(ctr,V3.mul(env.dir,80)),ctr)),useSh=W.q.shadows&&env.night<.6;
  if(useSh){const S=W.shp,SB=W.shadow;gl.bindFramebuffer(gl.FRAMEBUFFER,SB.f);gl.viewport(0,0,SB.w,SB.h);gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.useProgram(S.p);gl.uniformMatrix4fv(S.uLVP,false,LVP);for(const m of W.meshes){if(!m.on||!m.cast)continue;gl.uniformMatrix4fv(S.uM,false,m.m);w3Bind(gl,S,m,false);gl.drawArrays(gl.TRIANGLES,0,m.n);}gl.disableVertexAttribArray(S.aP);if(W.sks)for(const K of W.sks)w3SkinShadow(W,K,LVP);}
  const post=W.q.post&&W.scene;gl.bindFramebuffer(gl.FRAMEBUFFER,post?W.scene.f:null);gl.viewport(0,0,w,h);gl.clearColor(env.fog[0],env.fog[1],env.fog[2],1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const glob=L=>{gl.useProgram(L.p);gl.uniformMatrix4fv(L.uVP,false,VP);gl.uniformMatrix4fv(L.uLVP,false,LVP);gl.uniform1f(L.uT,t);gl.uniform1f(L.uTf,t);gl.uniform1f(L.uWind,env.wind);
  gl.uniform3fv(L.uL,env.dir);gl.uniform3fv(L.uLC,env.lc);gl.uniform3fv(L.uSky,env.sky);gl.uniform3fv(L.uGnd,env.gnd);gl.uniform3fv(L.uFog,env.fog);gl.uniform3fv(L.uCam,cam.pos);
  gl.uniform3fv(L.uZen,env.zen);gl.uniform3fv(L.uHor,env.hor);gl.uniform3fv(L.uSunC,env.sunC);gl.uniform1f(L.uNight,env.night);gl.uniform1f(L.uCloud,env.cloud);gl.uniform1f(L.uGlow,env.glow||0);gl.uniform1f(L.uPhoto,W.skyOn?env.photo||0:0);
  gl.uniform1f(L.uShOn,useSh?1:0);gl.uniform1f(L.uExp,post?.62:1);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,useSh?W.shadow.t:W.blank);gl.uniform1i(L.uSh,0);gl.uniform1i(L.uMap,2);gl.uniform1i(L.uDet,5);},L=W.main;glob(L);
  const one=m=>{gl.uniformMatrix4fv(L.uM,false,m.m);gl.uniform1f(L.uEmit,m.emit);gl.uniform1f(L.uSkyM,m.sky);gl.uniform3fv(L.uTint,m.tint);gl.uniform1f(L.uTex,m.tex);gl.uniform1f(L.uCld,m.cld);gl.uniform1f(L.uSheen,m.sheen);gl.uniform1f(L.uFlip,m.flip);gl.uniform1f(L.uWater,m.water);gl.uniform1f(L.uBrush,m.brush);gl.uniform1f(L.uBrushS,m.brushS);
    if(m.map){gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,m.map);gl.uniform1f(L.uMapOn,m.mapA?2:1);if(m.det){gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,m.det);}}else gl.uniform1f(L.uMapOn,0);
    gl.uniform2fv(L.uFogR,m.nofog?[1e5,2e5]:env.fogR);w3Bind(gl,L,m,true);gl.uniform1f(L.uAlpha,m.alpha);gl.drawArrays(gl.TRIANGLES,0,m.n);};
  for(const m of W.meshes)if(m.on&&m.alpha>=1&&!m.sky)one(m);
  if(L.aUV>=0)gl.disableVertexAttribArray(L.aUV);gl.disableVertexAttribArray(L.aP);gl.disableVertexAttribArray(L.aN);gl.disableVertexAttribArray(L.aC);gl.disableVertexAttribArray(L.aS);
  if(W.sks)for(const K of W.sks)w3SkinDraw(W,K,glob,env);
  /* the grass: only the wedges of tufts the camera faces */
  const G=W.gr;if(G&&G.n&&W.q.grass>0){const P=G.p,X=W.inst;gl.useProgram(P.p);gl.uniformMatrix4fv(P.uVP,false,VP);gl.uniformMatrix4fv(P.uLVP,false,LVP);
    gl.uniform1f(P.uT,t);gl.uniform1f(P.uWind,env.wind);gl.uniform3fv(P.uCam,cam.pos);gl.uniform3fv(P.uCamV,cam.pos);gl.uniform3fv(P.uL,env.dir);gl.uniform3fv(P.uLC,env.lc);gl.uniform3fv(P.uSky,env.sky);
    gl.uniform3fv(P.uGnd,env.gnd);gl.uniform3fv(P.uFog,env.fog);gl.uniform3fv(P.uSunC,env.sunC);gl.uniform2fv(P.uFogR,env.fogR);gl.uniform1f(P.uNight,env.night);
    gl.uniform1f(P.uShOn,useSh?1:0);gl.uniform1f(P.uExp,post?.62:1);gl.uniform1i(P.uSh,0);gl.uniform1f(P.uKeep,W.q.grass);gl.uniform1f(P.uTexOn,G.tex?1:0);if(G.tex){gl.activeTexture(gl.TEXTURE6);gl.bindTexture(gl.TEXTURE_2D,G.tex);gl.uniform1i(P.uGT,6);gl.activeTexture(gl.TEXTURE0);}
    const IA=[P.aI0,P.aI1,P.aI2,P.aI3];let drawn=0;gl.enableVertexAttribArray(P.aV);IA.forEach(l=>{gl.enableVertexAttribArray(l);X.vertexAttribDivisorANGLE(l,1);});
    const gfx=Math.sin(cam.yaw),gfz=-Math.cos(cam.yaw),ghf=Math.atan(Math.tan(fov/2)*Math.max(asp,1/asp))+.22+Math.abs(cam.pitch)*.7;
    G.sets.forEach(Z=>{gl.uniform1f(P.uFar,Z.t===G.t[1]?1:0);gl.bindBuffer(gl.ARRAY_BUFFER,Z.t.tb);gl.vertexAttribPointer(P.aV,3,gl.FLOAT,false,12,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,Z.t.ib);gl.bindBuffer(gl.ARRAY_BUFFER,Z.buf);
      Z.rng.forEach(([st,cnt,gx,gz,gr,hs])=>{const dx=gx-cam.pos[0],dz=gz-cam.pos[2],dd=Math.hypot(dx,dz);
        if(dd>gr+1.2){if(dd-gr>150)return;const ang=Math.acos(Math.max(-1,Math.min(1,(dx*gfx+dz*gfz)/dd)));if(ang-Math.asin(Math.min(1,gr/dd))>ghf)return;}
        let n=cnt;if(hs&&W.q.grass<1){let lo=0,hi=hs.length;const g=W.q.grass+.002;while(lo<hi){const md=(lo+hi)>>1;if(hs[md]<=g)lo=md+1;else hi=md;}n=lo;}if(!n)return;const o=st*52;drawn+=Math.round(n*W.q.grass);
        gl.vertexAttribPointer(P.aI0,4,gl.FLOAT,false,52,o);gl.vertexAttribPointer(P.aI1,4,gl.FLOAT,false,52,o+16);gl.vertexAttribPointer(P.aI2,3,gl.FLOAT,false,52,o+32);gl.vertexAttribPointer(P.aI3,2,gl.FLOAT,false,52,o+44);
        X.drawElementsInstancedANGLE(gl.TRIANGLES,Z.t.ni,gl.UNSIGNED_SHORT,0,n);});});
    W.drawn=drawn;IA.forEach(l=>{X.vertexAttribDivisorANGLE(l,0);gl.disableVertexAttribArray(l);});gl.disableVertexAttribArray(P.aV);}
  /* the sky dome after everything solid: covered pixels are rejected early */
  const sk=W.meshes.filter(m=>m.on&&m.sky);if(sk.length){gl.useProgram(L.p);sk.forEach(one);gl.disableVertexAttribArray(L.aP);gl.disableVertexAttribArray(L.aN);gl.disableVertexAttribArray(L.aC);gl.disableVertexAttribArray(L.aS);}
  if(W.skyD)w3SkyDraw(W,VP,env,cam,t,post?.62:1);
  /* see-through things last: smoke */
  const tr=W.meshes.filter(m=>m.on&&m.alpha<1);if(tr.length){gl.useProgram(L.p);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
    tr.forEach(one);gl.depthMask(true);gl.disable(gl.BLEND);gl.disableVertexAttribArray(L.aP);gl.disableVertexAttribArray(L.aN);gl.disableVertexAttribArray(L.aC);gl.disableVertexAttribArray(L.aS);}
  if(post){const Q=W.post;gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,w,h);gl.disable(gl.DEPTH_TEST);gl.useProgram(Q.p);
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,W.scene.t);gl.uniform1i(Q.uS,1);
    const sp=w3Proj(cam,V3.add(cam.pos,V3.mul(env.dir,190)));let ray=0,su=[.5,1.4];
    if(sp){su=[sp.x/cam.W,1-sp.y/cam.H];const dd=Math.hypot(su[0]-.5,(su[1]-.5)*1.4);ray=env.ray*(1-ss3(.55,1.25,dd));}
    gl.uniform2fv(Q.uSun,su);gl.uniform2fv(Q.uRes,[w,h]);gl.uniform1f(Q.uRay,ray*(1-env.night));gl.uniform1f(Q.uT,t%100);gl.uniform1f(Q.uOut,1/.62*1.12);gl.uniform1f(Q.uPaint,W.q.paint===false?0:1);gl.uniform1f(Q.uNt,env.night);
    gl.bindBuffer(gl.ARRAY_BUFFER,W.quad);gl.enableVertexAttribArray(Q.aQ);gl.vertexAttribPointer(Q.aQ,2,gl.FLOAT,false,8,0);gl.drawArrays(gl.TRIANGLES,0,6);gl.disableVertexAttribArray(Q.aQ);gl.enable(gl.DEPTH_TEST);}}
function camFwd(c){return [Math.sin(c.yaw)*Math.cos(c.pitch),Math.sin(c.pitch),-Math.cos(c.yaw)*Math.cos(c.pitch)];}
function w3Proj(cam,p){const m=cam.VP;if(!m)return null;const x=m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],y=m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],w=m[3]*p[0]+m[7]*p[1]+m[11]*p[2]+m[15];
  if(w<=.05)return null;return {x:(x/w*.5+.5)*cam.W,y:(1-(y/w*.5+.5))*cam.H,w};}
/* ---- index.html 6875–6876: CAM0, S3LOOK ---- */
const CAM0=[5.6,1.6,11.8];
const S3LOOK={ger:[0,1.3,0],door:[0,.9,2.3],toono:[0,2.5,0],rack:[5.1,.8,1.9],horse:[-5.6,1.1,3.8],sur:[8.2,.4,-9],mat:[2.3,.1,5.4],herd:[-9,.6,10],sky:[9,22,-14]};
/* ---- index.html 7093–7101: w3AnimalCollide, w3Spread ---- */
function w3AnimalCollide(x,z,r){const out=(cx,cz,rr)=>{const dx=x-cx,dz=z-cz,d=Math.hypot(dx,dz);if(d<rr){const k=d>1e-4?rr/d:0;x=d>1e-4?cx+dx*k:cx+rr;z=d>1e-4?cz+dz*k:cz;}};
  W3GERS.forEach(g=>out(g[0],g[1],(GERX.on?3.95:2.95)*g[2]+r));
  out(5.1,1.9,.72+r);out(-4.33,2.74,.12+r);out(-6.87,3.26,.12+r);out(2.05,4.35,.2+r);out(-10,7.5,1.05+r);W3WIL.forEach(o=>out(o.t[0],o.t[1],(o.wish&&!W3KF?1:o.tr+.2)+r));
  [-6.6,-5.6,-4.6].forEach((hx,i)=>out(hx,3.8-i*.12,.34+r));
  if(x>6.8-r&&x<10.1+r&&z>-9.3-r&&z<-8.7+r){const a=x-(6.8-r),b=10.1+r-x,c=z-(-9.3-r),d=-8.7+r-z,m=Math.min(a,b,c,d);if(m===a)x=6.8-r;else if(m===b)x=10.1+r;else if(m===c)z=-9.3-r;else z=-8.7+r;}
  const P=W3POND,rx=P[2]+.5+r,rz=P[3]+.5+r,ex=(x-P[0])/rx,ez=(z-P[1])/rz,e=Math.hypot(ex,ez);if(e<1){const k=e>1e-4?1/e:0;x=P[0]+ex*k*rx;z=P[1]+ez*k*rz;}
  return [x,z];}
function w3Spread(L,rad,gx,gz){for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){const a=L[i],b=L[j],dx=b[gx]-a[gx],dz=b[gz]-a[gz],d=Math.hypot(dx,dz);
  if(d<rad&&d>1e-4){const k=(rad-d)*.5/d;a[gx]-=dx*k;a[gz]-=dz*k;b[gx]+=dx*k;b[gz]+=dz*k;}}}
/* ---- index.html 7136–7136: m4p ---- */
const m4p=(m,p)=>[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];
/* ---- index.html 7146–7147: RIDE, s3RideBob ---- */
const RIDE={1:{v:3.4,turn:1.75,f:1.55,nb:2},2:{v:7.4,turn:1.25,f:2.3,nb:3}};
function s3RideBob(R){const a=R.amp||0,p=R.ph*Math.PI*2;return R.gait===2?{y:(.03+.05*Math.sin(p+1.2))*a,rz:Math.sin(p)*.05*a}:{y:(.012+.034*Math.abs(Math.sin(p)))*a,rz:Math.sin(p*2)*.012*a};}
/* ---- index.html 7277–7291: w3Collide, yp ---- */
function w3Collide(x,z,S){const rd=S&&S.ride?.55:0,out=(cx,cz,r)=>{const dx=x-cx,dz=z-cz,d=Math.hypot(dx,dz);if(d<r){const k=d>1e-4?r/d:0;x=d>1e-4?cx+dx*k:cx+r;z=d>1e-4?cz+dz*k:cz;}};
  const box=(x0,z0,x1,z1)=>{if(x>x0&&x<x1&&z>z0&&z<z1){const a=x-x0,b=x1-x,c=z-z0,d=z1-z,m=Math.min(a,b,c,d);if(m===a)x=x0;else if(m===b)x=x1;else if(m===c)z=z0;else z=z1;}};
  W3GERS.slice(1).forEach(g=>out(g[0],g[1],(GERX.on?3.95:2.95)*g[2]+rd));
  if(GERX.on&&GERX.wall!==false){const ox=W3GERS[0][0],oz=W3GERS[0][1];x-=ox;z-=oz;const d=Math.hypot(x,z),door=!rd&&z>2.9&&Math.abs(x)<.42,ig=S&&S.inGer&&!rd;
   if(ig){if(!door&&d>3.25){x*=3.25/d;z*=3.25/d;}}else if(!door&&d<3.98+rd){const k=(3.98+rd)/(d||1);x*=k;z*=k;}
   if(ig){out(0,0,.7);out(-.66,0,.24);out(.66,0,.24);box(-.6,-2.4,.6,-1.7);box(-1.15,-3.4,1.15,-2.6);box(-2.2,-3,-1.25,-2.1);box(1.25,-3,2.2,-2.1);out(1.98,-2.12,.3);
     box(-3.25,-1.55,-1.95,.65);box(1.95,-1.55,3.25,.65);out(2.6,1.15,.45);box(1.82,1.26,2.9,2.43);out(1.41,2.65,.42);out(.95,.65,.3);out(-2.05,1.85,.55);box(-3.1,.7,-2.33,1.62);}x+=ox;z+=oz;}
  else if(!GERX.on){const d=Math.hypot(x,z),door=!rd&&z>1.5&&Math.abs(x)<.36,ig=S&&S.inGer&&!rd;
   if(ig){if(!door&&d>1.86){x*=1.86/d;z*=1.86/d;}}else if(!door&&d<2.78+rd){const k=(2.78+rd)/(d||1);x*=k;z*=k;}
   if(ig){out(0,0,.66);out(-.42,-.22,.22);out(.42,-.22,.22);box(-.82,-2.3,.82,-1.2);out(-1.28,-1.46,.55);out(1.28,-1.46,.55);box(-.5,-1.24,.5,-.64);
     box(-2.3,-.92,-1.22,.32);box(1.22,-.92,2.3,.32);out(-1.62,.62,.42);out(-1.2,1.45,.38);out(-.82,1.78,.3);out(1.76,.72,.45);out(1.3,1.1,.26);out(1.0,1.62,.34);}}
  out(5.1,1.9,.72+rd);out(-5.6,3,.2+rd);W3WIL.forEach(o=>out(o.t[0],o.t[1],(o.wish&&!W3KF?1:o.tr+.25)+rd));if(S&&S.horseBase&&!S.horseRun&&!rd)out(S.horseBase[0],S.horseBase[2],1.4);
  const P=W3POND,rx=P[2]+.5+rd,rz=P[3]+.5+rd,ex=(x-P[0])/rx,ez=(z-P[1])/rz,e=Math.hypot(ex,ez);if(e<1){const k=e>1e-4?1/e:0;x=P[0]+ex*k*rx;z=P[1]+ez*k*rz;}
  return W3MAP.clamp(x,z);}
function yp(from,to){const d=V3.sub(to,from);return {yaw:Math.atan2(d[0],-d[2]),pitch:Math.atan2(d[1],Math.hypot(d[0],d[2]))};}
if(!W3Q.trees)W3WIL.length=3;
