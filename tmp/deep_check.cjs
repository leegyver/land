const Database = require("better-sqlite3");
const fs = require("fs");

const files = [
  { path: "/root/land/database.sqlite", label: "현재 DB" },
  { path: "/root/land/database.sqlite_final_bak.sqlite", label: "3/13 23:58 백업" },
  { path: "/root/land/database.sqlite_prebuild_bak.sqlite", label: "3/13 prebuild 백업" },
  { path: "/root/land/database.sqlite.broken_jan", label: "1월 broken 백업" },
  { path: "/tmp/database.sqlite", label: "3/4 백업 (67MB)" },
  { path: "/tmp/database.sqlite_wise_bak.sqlite", label: "wise 백업 (66MB)" },
];

for (const f of files) {
  if (!fs.existsSync(f.path)) { console.log("\n=== " + f.label + " === NOT FOUND"); continue; }
  try {
    const stat = fs.statSync(f.path);
    const db = new Database(f.path, {readonly: true});
    console.log("\n=== " + f.label + " (" + (stat.size/1024/1024).toFixed(1) + "MB) ===");
    
    // Users
    try {
      const users = db.prepare("SELECT id, username, role FROM users ORDER BY id").all();
      console.log("Users (" + users.length + "): " + users.map(u => "#" + u.id + " " + u.username + "(" + u.role + ")").join(", "));
    } catch(e) { console.log("Users: error - " + e.message.slice(0,50)); }
    
    // Properties - check real titles
    try {
      const total = db.prepare("SELECT COUNT(*) as c FROM properties").get().c;
      const real = db.prepare("SELECT COUNT(*) as c FROM properties WHERE title != '제목을 입력하세요'").get().c;
      const latest = db.prepare("SELECT id, title, substr(createdAt,1,10) as d FROM properties WHERE title != '제목을 입력하세요' ORDER BY id DESC LIMIT 5").all();
      console.log("Properties total: " + total + ", 실제 매물(제목있음): " + real);
      if (latest.length > 0) {
        latest.forEach(r => console.log("  #" + r.id + " " + r.d + " " + (r.title||"").slice(0,40)));
      }
    } catch(e) { console.log("Properties: error - " + e.message.slice(0,50)); }
    
    // News
    try {
      const nc = db.prepare("SELECT COUNT(*) as c FROM news").get().c;
      console.log("News: " + nc + "건");
    } catch(e) {}

    // Agents
    try {
      const ac = db.prepare("SELECT COUNT(*) as c FROM agents").get().c;
      console.log("Agents: " + ac + "건");
    } catch(e) {}

    // Sessions
    try {
      const sc = db.prepare("SELECT COUNT(*) as c FROM sessions").get().c;
      console.log("Sessions: " + sc + "건");
    } catch(e) {}

    // Tables list
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'").all();
    console.log("Tables: " + tables.map(t=>t.name).join(", "));
    
    db.close();
  } catch(e) { console.log(f.label + " ERROR: " + e.message.slice(0,80)); }
}
