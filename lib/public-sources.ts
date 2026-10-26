import { DigestItem,Weather } from "./digest";
async function getJson(url:string){
 if(new URL(url).hostname!=="api.weather.gov")throw new Error("Unexpected weather source.");
 const r=await fetch(url,{headers:{"User-Agent":"MyDailyDigest/1.0 (personal morning briefing)","Accept":"application/geo+json,application/json"},signal:AbortSignal.timeout(14000)});
 if(!r.ok)throw new Error("Weather service returned "+r.status);return r.json() as Promise<any>;
}
export async function fetchWeather():Promise<Weather>{
 const p=await getJson("https://api.weather.gov/points/28.6846,-80.8463");
 const [f,a]=await Promise.all([getJson(p.properties.forecast),getJson("https://api.weather.gov/alerts/active?point=28.6846,-80.8463")]);
 const now=Date.now(),periods=f.properties.periods.filter((v:any)=>Date.parse(v.endTime)>now);
 if(!periods.length||Date.parse(f.properties.generatedAt??f.properties.updateTime)<now-48*3600000)throw new Error("Outdated weather forecast.");
 const current=periods[0],day=periods.find((v:any)=>v.isDaytime),night=periods.find((v:any)=>!v.isDaytime);
 return {temperature:current.temperature,high:day?.temperature??null,low:night?.temperature??null,precipitation:current.probabilityOfPrecipitation?.value??null,wind:current.windSpeed+" "+current.windDirection,condition:current.shortForecast,alerts:a.features.filter((v:any)=>!v.properties.expires||Date.parse(v.properties.expires)>now).map((v:any)=>String(v.properties.headline||v.properties.event).slice(0,500)).slice(0,5),url:"https://forecast.weather.gov/zipcity.php?inputstring=Mims%2CFL",checkedAt:new Date().toISOString()};
}
export const feeds=[{name:"Fedora Magazine",url:"https://fedoramagazine.org/feed/",category:"linux"},{name:"Ubuntu Blog",url:"https://ubuntu.com/blog/feed",category:"linux"},{name:"AWS News",url:"https://aws.amazon.com/blogs/aws/feed/",category:"cloud"}] as const;
export function plain(s:string){return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,"").replace(/<[^>]*>/g," ").replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n))).replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&nbsp;/g," ").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();}
function field(s:string,k:string){return s.match(new RegExp("<"+k+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+k+">","i"))?.[1]??"";}
export function parseFeed(xml:string,feed:typeof feeds[number],now=Date.now()):DigestItem[]{
 return (xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi)??[]).flatMap(b=>{
 const title=plain(field(b,"title")),url=plain(field(b,"link")),published=Date.parse(plain(field(b,"pubDate")));
 if(!title||!Number.isFinite(published)||published<now-7*86400000||published>now+3600000)return [];
 try{const u=new URL(url);if(u.protocol!=="https:"||u.hostname!==new URL(feed.url).hostname)return [];}catch{return [];}
 return [{id:"news-"+published+"-"+title.toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,45),title:title.slice(0,180),summary:plain(field(b,"description")).slice(0,350)||"Read the official announcement for details.",source:feed.name,url,publishedAt:new Date(published).toISOString(),category:feed.category,priority:false}];
 });
}
export async function fetchNews(){
 const r=await Promise.allSettled(feeds.map(async f=>{const r=await fetch(f.url,{headers:{"User-Agent":"MyDailyDigest/1.0"},signal:AbortSignal.timeout(14000)});if(!r.ok)throw new Error(f.name+": "+r.status);const xml=await r.text();if(xml.length>3000000)throw new Error("Feed too large.");return parseFeed(xml,f);}));
 if(r.every(v=>v.status==="rejected"))throw new Error("News sources are temporarily unavailable.");
 const items=r.flatMap(v=>v.status==="fulfilled"?v.value:[]).sort((a,b)=>Date.parse(b.publishedAt!)-Date.parse(a.publishedAt!));
 return {items:[...new Map(items.map(i=>[i.url,i])).values()].slice(0,2),partial:r.some(v=>v.status==="rejected")};
}

