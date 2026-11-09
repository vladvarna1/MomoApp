// Сливане на документа на общото пространство. Печели по-новата промяна (по ключ).
export function emptyDoc(){return {plan:null,set:null,shop:{},fav:{},pref:{}};}
export function mergeDoc(doc,inc){
  doc=doc||emptyDoc();
  for(const s of ["plan","set"]){
    const i=inc&&inc[s];
    if(i&&i.data&&(!doc[s]||i.ts>doc[s].ts))doc[s]={ts:i.ts,data:i.data};
  }
  for(const s of ["shop","fav","pref"]){
    doc[s]=doc[s]||{};
    for(const [k,v] of Object.entries((inc&&inc[s])||{})){
      if(!v||typeof v.ts!=="number")continue;
      const e=doc[s][k];
      if(!e||v.ts>e.ts)doc[s][k]={ts:v.ts,d:v.d===undefined?null:v.d};
    }
  }
  return doc;
}
// изтрива много стари „изтрити“ записи
export function gc(doc,now){
  const lim=now-30*864e5;
  for(const s of ["shop","fav","pref"])for(const [k,v] of Object.entries(doc[s]||{}))if((v.d===null||v.d===0)&&v.ts>0&&v.ts<lim)delete doc[s][k];
  return doc;
}
