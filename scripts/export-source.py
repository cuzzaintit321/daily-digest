"""Create a portable source download without private data or deployment identity."""
import json
import sys
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
destination = Path(sys.argv[1]).resolve()
excluded = {"node_modules", ".git", "dist", ".next", ".vinext", ".wrangler", ".sites-runtime", ".agents", ".codex", "outputs", "work", "coverage", "out"}
allowed_roots = {"app", "components", "hooks", "lib", "db", "drizzle", "scripts", "public", "vendor", "worker", ".openai"}
destination.parent.mkdir(parents=True, exist_ok=True)
count = 0
with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for file in sorted(root.rglob("*")):
        relative = file.relative_to(root)
        if not file.is_file() or file.is_symlink() or any(part in excluded for part in relative.parts):
            continue
        if len(relative.parts) > 1 and relative.parts[0] not in allowed_roots:
            continue
        if file.suffix in {".zip", ".gz", ".sqlite", ".pem", ".log", ".tsbuildinfo"} or file.name.startswith((".env", ".dev.vars")) or file.name == "next-env.d.ts":
            continue
        if relative.parts[0] == ".openai":
            if str(relative) != ".openai/hosting.json":
                continue
            content = json.dumps({"d1": "DB", "r2": None}, indent=2).encode()
        else:
            content = file.read_bytes()
        archive.writestr("Daily-Digest/" + str(relative), content)
        count += 1
print(f"Exported {count} source files to {destination.name}")
