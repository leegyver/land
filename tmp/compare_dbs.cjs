const Database = require("better-sqlite3");
const files = [
  "/root/land/database.sqlite",
  "/root/land/database.sqlite_final_bak.sqlite",
  "/root/land/database.sqlite_prebuild_bak.sqlite",
  "/root/land/database.db",
  "/root/database.sqlite"
];
const fs = require("fs");

for (const f of files) {
  try {
    const stat = fs.statSync(f);
    const db = new Database(f, { readonly: true });
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
    let userCount = 0;
    try { userCount = db.prepare("SELECT COUNT(*) as c FROM users").get().c; } catch(e) {}
    let propCount = 0;
    try { propCount = db.prepare("SELECT COUNT(*) as c FROM properties").get().c; } catch(e) {}
    let maxUserId = 0;
    try { maxUserId = db.prepare("SELECT MAX(id) as m FROM users").get().m || 0; } catch(e) {}
    console.log(`\n=== ${f} ===`);
    console.log(`Size: ${(stat.size/1024/1024).toFixed(2)} MB`);
    console.log(`Modified: ${stat.mtime.toISOString()}`);
    console.log(`Tables: ${tables.join(", ")}`);
    console.log(`Users: ${userCount}, Max User ID: ${maxUserId}`);
    console.log(`Properties: ${propCount}`);
    db.close();
  } catch(e) {
    console.log(`\n=== ${f} === ERROR: ${e.message}`);
  }
}
