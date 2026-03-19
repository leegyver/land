const sqlite3 = require('better-sqlite3');
const db = new sqlite3('database.sqlite');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
tables.forEach(t => {
  try {
    const rows = db.prepare(`SELECT * FROM "${t.name}"`).all();
    if (rows.length > 0) {
      console.log(`TABLE: ${t.name}`);
      console.log(Buffer.from(JSON.stringify(rows)).toString('base64'));
    }
  } catch(e) {}
});
db.close();
