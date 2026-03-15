import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

const targetTables = ['properties', 'agents', 'users', 'news', 'inquiries'];

for (const tableName of targetTables) {
  console.log(`\n--- Schema for ${tableName} ---`);
  try {
    const info = db.prepare(`PRAGMA table_info(${tableName})`).all();
    console.log(JSON.stringify(info, null, 2));
  } catch (e) {
    console.log(`Table ${tableName} not found`);
  }
}

db.close();
