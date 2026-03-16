const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

function checkTable(tableName) {
  const info = db.prepare(`PRAGMA table_info(${tableName})`).all();
  console.log(`--- ${tableName} table ---`);
  console.table(info.map(c => ({ name: c.name, type: c.type })));
}

try {
  checkTable('users');
  checkTable('newsletter_subscriptions');
} catch (err) {
  console.error('Check failed:', err);
} finally {
  db.close();
}
