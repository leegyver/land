const db = require("better-sqlite3")("/root/land/database.sqlite", {readonly: true});
const r = db.prepare("SELECT id, title, substr(createdAt,1,16) as d FROM properties ORDER BY id DESC LIMIT 20").all();
r.forEach(x => console.log(x.id + " | " + x.d + " | " + (x.title || "").slice(0, 50)));
console.log("\n=== TOTAL ===");
console.log(db.prepare("SELECT COUNT(*) as c FROM properties").get().c + " properties");
console.log("\n=== DATE RANGE ===");
console.log("Earliest:", db.prepare("SELECT MIN(createdAt) as m FROM properties").get().m);
console.log("Latest:", db.prepare("SELECT MAX(createdAt) as m FROM properties").get().m);
db.close();
