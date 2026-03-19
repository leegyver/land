const Database = require('better-sqlite3');
const path = require('path');

const sourceDbPath = path.join(__dirname, 'database.sqlite_final_bak.sqlite');

try {
  const sourceDb = new Database(sourceDbPath, { readonly: true });
  const tables = sourceDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
  console.log('Tables:', tables);

  for (const table of tables) {
    const count = sourceDb.prepare(`SELECT COUNT(*) as count FROM "${table}"`).get().count;
    console.log(`Table [${table}] - Count: ${count}`);
    if (count > 0) {
        const columns = sourceDb.prepare(`PRAGMA table_info("${table}")`).all().map(c => c.name);
        console.log(`  Columns: ${columns.join(', ')}`);
        const sample = sourceDb.prepare(`SELECT * FROM "${table}" LIMIT 1`).get();
        console.log(`  Sample:`, JSON.stringify(sample, null, 2));
    }
  }
  sourceDb.close();
} catch (err) {
  console.error('Error:', err.message);
}
