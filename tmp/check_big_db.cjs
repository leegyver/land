const Database = require("better-sqlite3");
const files = ["/tmp/database.sqlite", "/tmp/database.sqlite_wise_bak.sqlite"];
for (const f of files) {
  try {
    const db = new Database(f, {readonly: true});
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log("\n=== " + f + " ===");
    console.log("Tables:", tables.map(t=>t.name).join(", "));
    try { console.log("Users:", db.prepare("SELECT COUNT(*) as c FROM users").get().c); } catch(e) {}
    try { console.log("Max User ID:", db.prepare("SELECT MAX(id) as m FROM users").get().m); } catch(e) {}
    try { console.log("Properties:", db.prepare("SELECT COUNT(*) as c FROM properties").get().c); } catch(e) {}
    try { 
      const users = db.prepare("SELECT id, username, role FROM users ORDER BY id DESC LIMIT 10").all();
      console.log("Recent Users:", JSON.stringify(users));
    } catch(e) {}
    try {
      const subs = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%sub%'").all();
      console.log("Sub tables:", JSON.stringify(subs));
    } catch(e) {}
    db.close();
  } catch(e) { console.log(f + " ERROR: " + e.message.slice(0,100)); }
}
