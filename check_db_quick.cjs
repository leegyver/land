const Database = require('better-sqlite3');
const db = new Database('database.sqlite');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("TABLES:", JSON.stringify(tables));
try {
  const count = db.prepare("SELECT count(1) as c FROM properties").get();
  console.log("PROPERTIES COUNT:", count);
} catch(e) { console.log("No properties table:", e.message); }
try {
  const agents = db.prepare("SELECT count(1) as c FROM agents").get();
  console.log("AGENTS COUNT:", agents);
} catch(e) { console.log("No agents table:", e.message); }
db.close();
