import Database from 'better-sqlite3';

const db = new Database('./database.sqlite');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];

console.log('--- DATABASE SCHEMA REPORT ---');
for (const table of tables) {
  const columns = db.prepare(`PRAGMA table_info(${table.name})`).all() as { name: string, type: string, notnull: number }[];
  console.log(`Table: ${table.name}`);
  columns.forEach(col => {
    console.log(`  - ${col.name} (${col.type})${col.notnull ? ' NOT NULL' : ''}`);
  });
}
console.log('--- END OF REPORT ---');

db.close();
