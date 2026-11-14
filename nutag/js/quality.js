/* «Миний нутаг» — графикийн тохиргоо (Low / Medium / High / Авто).
   world.js-ээс өмнө ачаалагдана: рендерер W3Q, W3BASE, W3URL-ийг эндээс уншина. */
"use strict";
const W3PRESETS={
  low:   {name:"Бага",  dprMax:.75,shadow:0,   post:false,grass:.22,tex1k:true, ger:"half", herd:1,cloudsHalf:true, sheepLod:1,sheep:8, terrain:.7, lock:true},
  medium:{name:"Дунд",  dprMax:1,  shadow:1024,post:true, grass:.6, tex1k:true, ger:"props",herd:2,cloudsHalf:false,sheepLod:0,sheep:10,terrain:1, lock:true},
  high:  {name:"Өндөр", dprMax:2,  shadow:2048,post:true, grass:1,  tex1k:false,ger:"full", herd:4,cloudsHalf:false,sheepLod:0,sheep:10,terrain:1, lock:true}
};
const W3SAVE_KEY="jalair-nutag-v1";
function w3LoadSave(){try{return JSON.parse(localStorage.getItem(W3SAVE_KEY)||"{}")||{};}catch(e){return {};}}
function w3Save(patch){try{const o=Object.assign(w3LoadSave(),patch);localStorage.setItem(W3SAVE_KEY,JSON.stringify(o));}catch(e){}}
/* Авто: утсанд Дунд, компьютерт Өндөр-өөс эхэлж, удаан бол рендерер өөрөө бууруулна */
function w3PickQuality(){const qs=new URLSearchParams(location.search).get("q");const saved=w3LoadSave().quality||"auto";const want=qs||saved;
  if(W3PRESETS[want])return {key:want,auto:false,p:Object.assign({},W3PRESETS[want])};
  let coarse=false;try{coarse=matchMedia("(pointer:coarse)").matches;}catch(e){}
  const base=Object.assign({},W3PRESETS[coarse?"medium":"high"]);base.lock=false;return {key:"auto",auto:true,p:base,start:coarse?"medium":"high"};}
const W3QSEL=w3PickQuality();
const W3Q=W3QSEL.p;
window.__w3lock=!!W3Q.lock;   /* тодорхой тохиргоо сонговол рендерер өөрөө өөрчлөхгүй */
const W3BASE="assets/";
/* бага, дунд тохиргоонд морь, газрын хөнгөн зургийг ачаална (эх файлууд хэвээрээ) */
const W3LITE={"horse/T_HorseBay_Albedo.webp":"lite/horse/T_HorseBay_Albedo.webp","horse/T_HorseBuckskin_Albedo.webp":"lite/horse/T_HorseBuckskin_Albedo.webp",
  "horse/T_HorseBay_Normal.webp":"lite/horse/T_HorseBay_Normal.webp","horse/T_HorseHair_Dark.webp":"lite/horse/T_HorseHair_Dark.webp",
  "horse/T_HorseHair_Normal.webp":"lite/horse/T_HorseHair_Normal.webp","land.webp":"lite/land.webp","land_g1.webp":"lite/land_g1.webp",
  ...Object.fromEntries(["T_Horse_Coat_v13","T_Horse_Normal_v13","T_HairCards_v13","T_HorseHair_Normal"].map(n=>["horse_bs/"+n+".webp","lite/horse_bs/"+n+".webp"]))};
/* гэрийн 1024 px зургууд: Бага тохиргоонд бүгд 512 px, Дунд тохиргоонд жижиг эд зүйлсийнх л 512 px */
const W3GER_HALF=new Set(["04_T_AgedWood_Base","07_T_DoorFrame_Base","10_T_BaganaFork_Base","13_T_Bagana_Shaft_Base","16_T_Blanket_East_Base","19_T_Bed_Atlas_Base","22_T_FeltExt_Base",
  "24_T_Blanket_West_Base","29_T_Chest_Atlas_Base","32_T_Walnut_Base","36_T_Cupboard_Base","44_T_DoorLeaf_Base","47_T_EarthFloor_Base","50_T_IronForged_Base","56_T_HearthGround_Base",
  "66_T_ShirdegB_Base","69_T_ShirdegA_Base"].map(n=>"ger_lite/"+n+".webp"));
const W3GER_PROPS=new Set(["04_T_AgedWood_Base","32_T_Walnut_Base","36_T_Cupboard_Base","50_T_IronForged_Base","56_T_HearthGround_Base"].map(n=>"ger_lite/"+n+".webp"));
/* Хүслийн модны бургас: Бага чанарт хагас хэмжээтэй зураг */
const W3WLITE=new Set(["willow/bark.webp","willow/bark_n.webp","willow/leaves.webp"]);
const W3URL=p=>{if(W3WLITE.has(p)&&W3Q.ger==="half")return W3BASE+"lite/"+p;if(W3GER_HALF.has(p)&&(W3Q.ger==="half"||W3Q.ger==="props"&&W3GER_PROPS.has(p)))return W3BASE+"lite/"+p;return W3BASE+(W3Q.tex1k&&W3LITE[p]?W3LITE[p]:p);};

/* ---------- өнгө аяс: тайван, намуухан ----------
   Бүх shader (газар, өвс, гэр, мал, мод, тэнгэр, үүл) эцсийн өнгөө w3Grade-ээр гаргана:
   sat — өнгөний ханалт (1 = анхны), haze — дулаан бүдэг туяа, lift — харанхуйг бага зэрэг цайруулна.
   post — Дунд/Өндөр чанарын зурагт шүүлтүүрийн ханалт (анх 1.22), grass — өвсний ханалт (анх 1.18). */
/* Бага чанарт зурагт шүүлтүүр (ACES) байхгүй тул өнгийг арай илүү намдаана */
/* skySat — тэнгэр, үүлний ханалт: газраас бага намдаана, нар жаргах туяа тод үлдэнэ */
const W3GRADE=W3Q.post?{sat:.8,haze:.07,lift:.012,post:1.0,grass:1.04,skySat:.97}:{sat:.72,haze:.09,lift:.03,post:1.0,grass:1.0,skySat:.9};
const W3GRADE_GLSL=`vec3 w3Grade(vec3 c){float l=dot(c,vec3(.3,.55,.15));c=mix(vec3(l),c,${W3GRADE.sat.toFixed(3)});c=mix(c,vec3(l)*vec3(1.07,1.,.86),${W3GRADE.haze.toFixed(3)});return c+${W3GRADE.lift.toFixed(3)}*(1.-c);}
vec3 w3GradeSky(vec3 c){float l=dot(c,vec3(.3,.55,.15));return mix(vec3(l),c,${W3GRADE.skySat.toFixed(3)});}
`;
