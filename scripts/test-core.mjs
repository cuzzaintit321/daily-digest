import ts from "typescript";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import assert from "node:assert/strict";
await mkdir(".sites-runtime",{recursive:true});
for(const [input,output] of [["lib/public-sources.ts","source-tests.mjs"],["lib/digest.ts","digest-tests.mjs"]]){
 const source=await readFile(input,"utf8");
 await writeFile(".sites-runtime/"+output,ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
}
const {parseFeed,plain,feeds}=await import("../.sites-runtime/source-tests.mjs");
const {DigestSchema,SettingsSchema,markdown}=await import("../.sites-runtime/digest-tests.mjs");
const now=Date.parse("2026-10-26T12:00:00Z");
function feed(link,date){return "<rss><channel><item><title>Fedora release</title><link>"+link+"</link><pubDate>"+date+"</pubDate><description>&lt;strong&gt;Update&lt;/strong&gt;</description></item></channel></rss>";}
assert.equal(parseFeed(feed("https://fedoramagazine.org/release","Mon, 26 Oct 2026 08:00:00 GMT"),feeds[0],now).length,1);
assert.equal(parseFeed(feed("javascript:alert(1)","Mon, 26 Oct 2026 08:00:00 GMT"),feeds[0],now).length,0);
assert.equal(parseFeed(feed("https://evil.example/a","Mon, 26 Oct 2026 08:00:00 GMT"),feeds[0],now).length,0);
assert.equal(parseFeed(feed("https://fedoramagazine.org/old","Mon, 01 Jun 2026 08:00:00 GMT"),feeds[0],now).length,0);
assert.equal(parseFeed(feed("https://fedoramagazine.org/future","Mon, 26 Oct 2027 08:00:00 GMT"),feeds[0],now).length,0);
assert.equal(plain("<script>alert(1)</script><b>Useful</b>"),"Useful");
assert.equal(plain("&lt;strong&gt;Update&lt;/strong&gt;"),"Update");
assert.equal(SettingsSchema.safeParse({name:"",gmail:true}).success,false);
assert.equal(DigestSchema.safeParse({id:"../test"}).success,false);
const d={id:"2026-10-26-am",date:"2026-10-26",title:"Daily",intro:"Hello",kind:"sample",generatedAt:"2026-10-26T12:00:00Z",items:[],weather:null,sources:[],prepare:["Check mail"]};
assert.ok(markdown(DigestSchema.parse(d)).includes("What to prepare"));
console.log("10 core checks passed: dates, source URL restrictions, HTML stripping, validation, export.");
