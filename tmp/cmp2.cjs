const Database = require("better-sqlite3");
const fs = require("fs");
const files = [
  "/root/land/database.sqlite",
  "/root/land/database.sqlite_final_bak.sqlite",
  "/root/land/database.sqlite_prebuild_bak.sqlite",
  "/root/land/database.db",
  "/root/database.sqlite"
];
const out = [];
for (const f of files) {
  try {
    const stat = fs.statSync(f);
    const db = new Database(f, { readonly: true });
    let uc = 0, pc = 0, mui = 0;
    try { uc = db.prepare("SELECT COUNT(*) as c FROM users").get().c; } catch(e) {}
    try { pc = db.prepare("SELECT COUNT(*) as c FROM properties").get().c; } catch(e) {}
    try { mui = db.prepare("SELECT MAX(id) as m FROM users").get().m || 0; } catch(e) {}
    out.push(f + " | " + (stat.size/1024/1024).toFixed(2) + "MB | " + stat.mtime.toISOString().slice(0,16) + " | Users:" + uc + " MaxUID:" + mui + " Props:" + pc);
    db.close();
  } catch(e) {
    out.push(f + " | ERROR: " + e.message.slice(0,50));
  }
}
console.log(out.join("\n"));
