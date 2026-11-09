import {DurableObject} from "cloudflare:workers";
import {mergeDoc,gc,emptyDoc} from "./merge.js";

// По един Durable Object за всеки код на общо пространство. Пази един документ.
export class Space extends DurableObject{
  async fetch(request){
    const body=await request.json();
    let doc=await this.ctx.storage.get("doc");
    if(body.check)return Response.json({exists:!!doc});
    doc=mergeDoc(doc||emptyDoc(),body.data);
    gc(doc,Date.now());
    const size=JSON.stringify(doc).length;
    if(size>900000)return new Response("too large",{status:413});
    await this.ctx.storage.put("doc",doc);
    return Response.json(doc);
  }
}

const CODE_RE=/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/;

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==="/api/sync"&&request.method==="POST"){
      const text=await request.text();
      if(text.length>900000)return new Response("too large",{status:413});
      let body;try{body=JSON.parse(text);}catch(e){return new Response("bad request",{status:400});}
      const code=String(body.code||"").toUpperCase();
      if(!CODE_RE.test(code))return new Response("bad code",{status:400});
      const stub=env.SPACE.get(env.SPACE.idFromName(code));
      return stub.fetch("https://space/sync",{method:"POST",body:JSON.stringify({check:!!body.check,data:body.data})});
    }
    return new Response("Not found",{status:404});
  }
};
