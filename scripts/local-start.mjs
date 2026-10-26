import {spawnSync} from "node:child_process";
import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
function run(args){const r=spawnSync(process.execPath,args,{stdio:"inherit",env:process.env});if(r.status!==0)process.exit(r.status??1);}
run(["scripts/run-framework.mjs","build"]);
const path="dist/server/wrangler.json",config=JSON.parse(readFileSync(path,"utf8"));
for(const binding of config.d1_databases??[])binding.migrations_dir=resolve("drizzle");
writeFileSync(path,JSON.stringify(config));
run(["--import","./scripts/sites-env.mjs","./node_modules/wrangler/bin/wrangler.js","d1","migrations","apply","DB","--local","--config",path,"--persist-to",".wrangler/state"]);
run(["--import","./scripts/sites-env.mjs","./node_modules/wrangler/bin/wrangler.js","dev","--config",path,"--local","--persist-to",".wrangler/state","--ip","127.0.0.1","--port","8787","--inspector-port","0"]);
