import { SettingsSchema,DigestSchema,ItemSchema,Digest,SourceStatus,easternDate } from "@/lib/digest";
import { getSettings,saveSettings,listIssues,saveIssue,listSaved,setSaved } from "@/lib/store";
import { fetchWeather,fetchNews } from "@/lib/public-sources";
export const dynamic="force-dynamic";
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
const fail=(e:unknown,status=400)=>json({error:e instanceof Error?e.message.slice(0,300):"Something went wrong. Please retry."},status);
export async function GET(r:Request){
 try{const path=new URL(r.url).pathname;
 if(path==="/api/settings")return json(await getSettings());
 if(path==="/api/digests")return json({issues:await listIssues()});
 if(path==="/api/state"){const [settings,issues,saved]=await Promise.all([getSettings(),listIssues(),listSaved()]);return json({settings,issues,saved});}
 return json({error:"Not found"},404);
 }catch(e){return fail(e,503);}
}
export async function POST(r:Request){
 try{
 // Owner-private Sites dispatch authenticates browser AND service requests.
 // Never change this app to public without adding independent authorization.
 const origin=r.headers.get("origin");if(origin&&origin!==new URL(r.url).origin)return json({error:"Cross-origin write denied"},403);
 if(!r.headers.get("content-type")?.includes("application/json"))return json({error:"JSON required"},415);
 const text=await r.text();if(text.length>64000)return json({error:"Request too large"},413);
 const b=JSON.parse(text),path=new URL(r.url).pathname;
 if(path==="/api/settings"){const settings=SettingsSchema.parse(b);await saveSettings(settings);return json({settings});}
 if(path==="/api/digests"){const d=DigestSchema.parse(b);await saveIssue(d);return json({ok:true,id:d.id});}
 if(path==="/api/bookmarks"){const item=ItemSchema.parse(b.item);if(typeof b.saved!=="boolean")throw new Error("Choose saved or unsaved.");await setSaved(item,item.id,b.saved);return json({ok:true});}
 if(path==="/api/refresh")return await refresh();
 return json({error:"Not found"},404);
 }catch(e){return fail(e);}
}
async function refresh(){
 const [s,history]=await Promise.all([getSettings(),listIssues()]);
 const date=easternDate(),previous=history.find(d=>d.date===date)??history[0],now=new Date().toISOString();
 const [w,n]=await Promise.allSettled([s.weather?fetchWeather():Promise.resolve(null),s.news?fetchNews():Promise.resolve(null)]);
 const inbox=previous?.sources.find(v=>v.id==="gmail");
 const sources:SourceStatus[]=[
 {id:"gmail",state:!s.gmail?"disabled":inbox?"stale":"unavailable",detail:!s.gmail?"Excluded in source settings.":"Gmail is collected by your morning ChatGPT task. Web refresh keeps its last checked timestamp.",checkedAt:inbox?.checkedAt},
 {id:"weather",state:!s.weather?"disabled":w.status==="fulfilled"?"fresh":previous?.weather?"stale":"unavailable",detail:!s.weather?"Excluded in source settings.":w.status==="fulfilled"?"National Weather Service forecast and active alerts.":"Weather refresh failed. Previous data, if any, is retained.",checkedAt:w.status==="fulfilled"&&w.value?now:previous?.weather?.checkedAt},
 {id:"news",state:!s.news?"disabled":n.status==="fulfilled"?(n.value?.items.length?"fresh":"empty"):previous?.items.some(i=>i.category==="linux"||i.category==="cloud")?"stale":"unavailable",detail:!s.news?"Excluded in source settings.":n.status==="fulfilled"?(n.value?.partial?"Some official feeds were unavailable. Results from working feeds are shown.":"Official Fedora, Ubuntu and AWS feeds; dated items from the last seven days."):"News refresh failed. Previous headlines, if any, retain their dates.",checkedAt:n.status==="fulfilled"?now:previous?.sources.find(v=>v.id==="news")?.checkedAt}
 ];
 if(!((s.weather&&w.status==="fulfilled")||(s.news&&n.status==="fulfilled")))return json({error:"No sources refreshed. Your previous digest has been kept.",sources},502);
 const digest:Digest={id:date+"-am",date,title:"Your daily digest",intro:"Your priorities, a little perspective, and the day ahead. All in one place.",generatedAt:now,kind:"manual",items:[...(s.gmail?previous?.items.filter(i=>i.category==="inbox")??[]:[]),...(s.news?(n.status==="fulfilled"?n.value?.items??[]:previous?.items.filter(i=>i.category==="linux"||i.category==="cloud")??[]):[])],weather:s.weather?(w.status==="fulfilled"?w.value:previous?.weather??null):null,sources,prepare:previous?.date===date?previous.prepare:[]};
 await saveIssue(digest);return json({digest});
}

