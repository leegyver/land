const Database = require('better-sqlite3');
const fs = require('fs');

const files = [
  'database.sqlite',
  'database.sqlite_prebuild_bak.sqlite'
];

files.forEach(f => {
  const filePath = '/root/land/' + f;
  if (!fs.existsSync(filePath)) {
    console.log(`${f}: Not found`);
    return;
  }
  
  try {
    const db = new Database(filePath);
    const count = db.prepare('SELECT count(*) as c FROM properties').get().c;
    const latest = db.prepare('SELECT id, title, createdAt FROM properties ORDER BY createdAt DESC LIMIT 1').get();
    const near9 = db.prepare("SELECT count(*) as c FROM properties WHERE createdAt LIKE '2026-03-14T09%' OR createdAt LIKE '2026-03-14 09%'").get().c;
    
    console.log(`--- ${f} ---`);
    console.log(`Total Properties: ${count}`);
    console.log(`Latest: ${latest ? latest.title + ' (' + latest.createdAt + ')' : 'None'}`);
    console.log(`Records from 9AM: ${near9}`);
    
    if (near9 > 0) {
       const samples = db.prepare("SELECT title, createdAt FROM properties WHERE createdAt LIKE '2026-03-14T09%' OR createdAt LIKE '2026-03-14 09%' LIMIT 2").all();
       console.log('9AM Samples:', samples);
    }
    
    db.close();
  } catch (e) {
    console.log(`${f} error: ${e.message}`);
  }
});
