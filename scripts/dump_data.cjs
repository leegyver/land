const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const sourceDbPath = path.join(__dirname, 'database.sqlite_final_bak.sqlite');

try {
  const sourceDb = new Database(sourceDbPath, { readonly: true });
  const tables = sourceDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
  
  const allData = {};
  for (const t of tables) {
      try {
          const rows = sourceDb.prepare(`SELECT * FROM "${t}"`).all();
          if (rows.length > 0) {
              allData[t] = rows;
          }
      } catch (e) {}
  }
  
  fs.writeFileSync(path.join(__dirname, 'dumped_data.json'), JSON.stringify(allData, null, 2));
  console.log('Dump completed. Tables found:', Object.keys(allData).join(', '));
  sourceDb.close();
} catch (err) {
  console.error('Dump Error:', err.message);
}
