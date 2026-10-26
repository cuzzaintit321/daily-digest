import { z } from "zod";
const url = z.string().url().max(2000).refine(v => new URL(v).protocol === "https:", "HTTPS source links are required");
export const SettingsSchema = z.object({
 name:z.string().trim().min(1).max(50).default("Jason"),gmail:z.boolean().default(true),weather:z.boolean().default(true),news:z.boolean().default(true),
 topics:z.string().trim().max(250).default("Linux, Fedora, Ubuntu, Docker, AWS, Azure"),readingMinutes:z.union([z.literal(2),z.literal(3)]).default(3)
});
export const ItemSchema=z.object({
 id:z.string().regex(/^[A-Za-z0-9_-]{1,100}$/),category:z.enum(["inbox","weather","linux","cloud"]),title:z.string().min(1).max(180),summary:z.string().min(1).max(1000),
 source:z.string().min(1).max(80),url,publishedAt:z.string().max(50).optional(),action:z.string().max(300).optional(),priority:z.boolean().default(false)
});
export const SourceSchema=z.object({id:z.enum(["gmail","weather","news"]),state:z.enum(["fresh","stale","unavailable","empty","disabled"]),detail:z.string().max(350),checkedAt:z.string().datetime().optional()});
export const WeatherSchema=z.object({temperature:z.number().nullable(),high:z.number().nullable(),low:z.number().nullable(),precipitation:z.number().min(0).max(100).nullable(),wind:z.string().max(60),condition:z.string().max(180),alerts:z.array(z.string().max(500)).max(5),url,checkedAt:z.string().datetime()});
export const DigestSchema=z.object({id:z.string().regex(/^\d{4}-\d{2}-\d{2}(-[a-z0-9]+)?$/),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),title:z.string().min(1).max(180),intro:z.string().max(500),generatedAt:z.string().datetime(),kind:z.enum(["scheduled","manual","sample"]),items:z.array(ItemSchema).max(12),weather:WeatherSchema.nullable(),sources:z.array(SourceSchema).max(3),prepare:z.array(z.string().max(300)).max(3)});
export type Settings=z.infer<typeof SettingsSchema>;
export type DigestItem=z.infer<typeof ItemSchema>;
export type Digest=z.infer<typeof DigestSchema>;
export type SourceStatus=z.infer<typeof SourceSchema>;
export type Weather=z.infer<typeof WeatherSchema>;
export const defaults=SettingsSchema.parse({});
export function easternDate(date=new Date()){return new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"}).format(date);}
export function markdown(d:Digest){
 const out=["# "+d.title,"*"+d.date+" | "+d.kind+" issue | Eastern time*",d.intro];
 for(const i of d.items)out.push("## "+i.title,i.summary,i.action?"**Next step:** "+i.action:"","["+i.source+"]("+i.url+")"+(i.publishedAt?" | "+i.publishedAt:""));
 if(d.weather)out.push("## Mims weather",d.weather.condition+". High: "+(d.weather.high??"unavailable")+" F; low: "+(d.weather.low??"unavailable")+" F.",...d.weather.alerts,"[Weather source]("+d.weather.url+")");
 if(d.prepare.length)out.push("## What to prepare",...d.prepare.map(v=>"- "+v));
 out.push("## Source status",...d.sources.map(s=>"- "+s.id+": "+s.state+". "+s.detail),"Generated: "+d.generatedAt);
 return out.filter(Boolean).join("\n\n");
}

