
const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

try {
  const tableInfo = db.prepare("PRAGMA table_info(newsletter_subscriptions)").all();
  console.log("newsletter_subscriptions Table Info:");
  console.table(tableInfo);
  
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log("All Tables:", tables.map(t => t.name));
} catch (err) {
  console.error("Error:", err);
} finally {
  db.close();
}
