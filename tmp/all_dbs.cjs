const Database = require("better-sqlite3");
const fs = require("fs");
const files = [
  "/root/land/database.sqlite.broken_jan",
  "/root/land/database.sqlite_final_bak.sqlite", 
  "/root/land/database.sqlite_prebuild_bak.sqlite",
  "/root/land/database.db",
  "/root/land/database.sqlite"
];
for (const f of files) {
  try {
    if (!fs.existsSync(f)) { console.log(f + " NOT FOUND"); continue; }
    const stat = fs.statSync(f);
    const db = new Database(f, {readonly: true});
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t=>t.name);
    let info = f + " | " + (stat.size/1024/1024).toFixed(2) + "MB | " + stat.mtime.toISOString().slice(0,16);
    try { info += " | Users:" + db.prepare("SELECT COUNT(*) as c FROM users").get().c; } catch(e) { info += " | NoUsers"; }
    try { info += " MaxUID:" + (db.prepare("SELECT MAX(id) as m FROM users").get().m || 0); } catch(e) {}
    try { info += " Props:" + db.prepare("SELECT COUNT(*) as c FROM properties").get().c; } catch(e) {}
    try {
      const roles = db.prepare("SELECT role, COUNT(*) as c FROM users GROUP BY role").all();
      info += " Roles:" + JSON.stringify(roles);
    } catch(e) {}
    console.log(info);
    console.log("  Tables: " + tables.join(", "));
    // Show all users
    try {
      const users = db.prepare("SELECT id, username, role, email FROM users ORDER BY id").all();
      for (const u of users) {
        console.log("  User #" + u.id + ": " + u.username + " (" + u.role + ") " + (u.email||""));
      }
    } catch(e) {}
    db.close();
  } catch(e) { console.log(f + " ERROR: " + e.message.slice(0,100)); }
}
