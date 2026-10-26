import { env } from "cloudflare:workers";
import { defaults,Digest,DigestSchema,Settings,SettingsSchema } from "./digest";
function db(){if(!env.DB)throw new Error("Digest storage is unavailable.");return env.DB;}
export async function getSettings():Promise<Settings>{const r=await db().prepare("SELECT payload FROM digest_settings WHERE id=?").bind("profile").first<{payload:string}>();return r?SettingsSchema.parse(JSON.parse(r.payload)):defaults;}
export async function saveSettings(s:Settings){await db().prepare("INSERT INTO digest_settings (id,payload,updated_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at").bind("profile",JSON.stringify(s),new Date().toISOString()).run();}
export async function listIssues():Promise<Digest[]>{const r=await db().prepare("SELECT payload FROM digest_issues ORDER BY date DESC,updated_at DESC LIMIT 60").all<{payload:string}>();return r.results.map(v=>DigestSchema.parse(JSON.parse(v.payload)));}
export async function saveIssue(d:Digest){await db().prepare("INSERT INTO digest_issues (id,date,payload,updated_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET date=excluded.date,payload=excluded.payload,updated_at=excluded.updated_at").bind(d.id,d.date,JSON.stringify(d),new Date().toISOString()).run();}
export async function listSaved(){const r=await db().prepare("SELECT payload FROM digest_bookmarks ORDER BY created_at DESC LIMIT 200").all<{payload:string}>();return r.results.map(v=>JSON.parse(v.payload));}
export async function setSaved(item:unknown,id:string,saved:boolean){if(saved)await db().prepare("INSERT INTO digest_bookmarks (id,payload,created_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload").bind(id,JSON.stringify(item),new Date().toISOString()).run();else await db().prepare("DELETE FROM digest_bookmarks WHERE id=?").bind(id).run();}

