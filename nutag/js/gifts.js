/* ---------- ааруул бэлэглэх: багийн гишүүд, бэлэн мэндчилгээ, «Баярлалаа» ----------
   Одоохондоо зөвхөн энэ төхөөрөмж дээрх жишээ өгөгдөл (localStorage «jalair-nutag-gifts-v1»). Сүлжээ рүү юу ч илгээхгүй.
   Supabase-д холбохдоо энэ файлын функцуудыг (members, send, inbox, sent, open, keep, thank) ижил хэлбэртэйгээр сольно;
   хязгаар, шалгалт нь supabase/gifts_draft.sql-ийн RLS ба trigger-тэй ижил.
   Оноо, streak, заавал хариу бэлэглэх зүйл байхгүй. Чөлөөт текст байхгүй: мэндчилгээ, талархал нь зөвхөн бэлэн сонголт. */
const GIFTS=(()=>{
  const KEY="jalair-nutag-gifts-v1",DAY=864e5;
  const MSG=["Сайхан амраарай!","Чи чадна!","Ааруул идээд хүч ороорой!","Чамтай нэг багт байгаадаа баяртай байна.","Өдрийг сайхан өнгөрүүлээрэй!"];
  const THANKS=["Баярлалаа!"];
  const LIM={perDay:5,perFriendDay:2,maxItems:10};
  const SHAPES=["orig","zuss","khev","baz"];
  /* Жалайрын жишээ баг (анхны аппын DEMO_TEAM-ийн нэрс) */
  const seed=()=>({me:"me",team:{code:"DEMO",name:"Жишээ баг",members:[{id:"me",name:"Би"},{id:"d2",name:"Бөртэ"},{id:"d3",name:"Тэмүүжин"},{id:"d4",name:"Ану"}]},
    seq:2,gifts:[{id:1,from:"d2",to:"me",items:{khev:3},msg:0,at:Date.now()-36e5,opened:null,kept:false,thanked:null}]});
  let S=null;
  const load=()=>{if(S)return S;try{S=JSON.parse(localStorage.getItem(KEY)||"null");}catch(e){S=null;}if(!S||!S.team)S=seed();return S;};
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}};
  const name=id=>(load().team.members.find(m=>m.id===id)||{name:"?"}).name;
  const count=it=>Object.values(it||{}).reduce((a,b)=>a+b,0);
  const today=now=>load().gifts.filter(g=>g.from===S.me&&now-g.at<DAY);
  /* илгээхээс өмнөх шалгалт (сервер дээр ч ижил): багийн гишүүн, өөртөө биш, 1–10 ширхэг, бэлэн мэндчилгээ, өдрийн хязгаар */
  function check(to,items,msg,now){const s=load(),n=count(items);
    if(to===s.me||!s.team.members.some(m=>m.id===to))return "Энэ хүн манай багт байхгүй байна.";
    if(!(n>=1&&n<=LIM.maxItems)||Object.keys(items).some(k=>!SHAPES.includes(k)||!(items[k]>0)))return `Нэг бэлэгт 1–${LIM.maxItems} ааруул.`;
    if(!(msg>=0&&msg<MSG.length))return "Мэндчилгээгээ сонгоорой.";
    const t=today(now);if(t.length>=LIM.perDay)return `Өнөөдөр ${LIM.perDay} бэлэг илгээлээ. Маргааш дахин илгээж болно.`;
    if(t.filter(g=>g.to===to).length>=LIM.perFriendDay)return `${name(to)}: өнөөдөр ${LIM.perFriendDay} бэлэг илгээчихлээ. Маргааш дахиад.`;
    return null;}
  return {MSG,THANKS,LIM,SHAPES,name,count,
    members:async()=>load().team.members.filter(m=>m.id!==S.me),
    team:()=>load().team,
    left:(now=Date.now())=>LIM.perDay-today(now).length,
    check:(to,items,msg,now=Date.now())=>check(to,items,msg,now),
    send:async(to,items,msg,now=Date.now())=>{const e=check(to,items,msg,now);if(e)throw new Error(e);const s=load(),g={id:++s.seq,from:s.me,to,items:{...items},msg,at:now,opened:null,kept:false,thanked:null};s.gifts.push(g);save();return g;},
    inbox:async()=>load().gifts.filter(g=>g.to===S.me).sort((a,b)=>b.at-a.at),
    sent:async()=>load().gifts.filter(g=>g.from===S.me).sort((a,b)=>b.at-a.at),
    unopened:()=>load().gifts.filter(g=>g.to===S.me&&!g.opened),
    open:async(id,now=Date.now())=>{const g=load().gifts.find(x=>x.id===id&&x.to===S.me);if(!g)throw new Error("Бэлэг олдсонгүй.");if(!g.opened){g.opened=now;save();}return g;},
    keep:async id=>{const g=load().gifts.find(x=>x.id===id&&x.to===S.me);if(!g||!g.opened||g.kept)return null;g.kept=true;save();return g.items;},
    thank:async(id,now=Date.now())=>{const g=load().gifts.find(x=>x.id===id&&x.to===S.me);if(!g||!g.opened||g.thanked)return false;g.thanked=now;save();return true;},
    /* жишээ багийн гишүүд: бэлгээ ~20 секундын дараа нээж, «Баярлалаа» гэнэ (жинхэнэ хүмүүс хариулахгүй байж ч болно) */
    tick:(now=Date.now())=>{let ch=false;for(const g of load().gifts)if(g.from===S.me&&!g.thanked&&now-g.at>2e4){g.opened=g.opened||now;g.thanked=now;ch=true;}if(ch)save();return ch;},
    reset:()=>{S=seed();save();}};
})();
