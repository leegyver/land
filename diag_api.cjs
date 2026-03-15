const Database = require('better-sqlite3');
const { drizzle } = require('drizzle-orm/better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database.sqlite');
console.log('DB Path:', dbPath);

const sqlite = new Database(dbPath);
console.log('DB opened');

// Try raw query first
try {
  const raw = sqlite.prepare("SELECT id, title FROM properties LIMIT 3").all();
  console.log('RAW QUERY OK:', raw);
} catch(e) {
  console.log('RAW QUERY ERROR:', e.message);
}

// Check columns
try {
  const cols = sqlite.prepare("PRAGMA table_info(properties)").all();
  console.log('COLUMNS:', cols.map(c => c.name).join(', '));
} catch(e) {
  console.log('PRAGMA ERROR:', e.message);
}

sqlite.close();
