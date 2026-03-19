const sqlite3 = require('better-sqlite3');
const db = new sqlite3('database.sqlite');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
const keywords = ['계양', '궁금해요', '리모델링', '강화도 이야기'];

tables.forEach(t => {
  try {
    const rows = db.prepare(`SELECT * FROM "${t.name}"`).all();
    rows.forEach(row => {
      const content = JSON.stringify(row);
      if (keywords.some(k => content.includes(k))) {
        console.log(`MATCH FOUND In TABLE: ${t.name}`);
        console.log(JSON.stringify(row, null, 2));
      }
    });
  } catch(e) {}
});
db.close();
