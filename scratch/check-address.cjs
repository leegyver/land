const Database = require('better-sqlite3');
const db = new Database('database.sqlite');
const rows = db.prepare("SELECT id, title, type, address, district FROM properties LIMIT 5").all();
console.log(JSON.stringify(rows, null, 2));
db.close();
