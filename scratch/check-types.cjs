const Database = require('better-sqlite3');
const db = new Database('database.sqlite');
const rows = db.prepare("SELECT DISTINCT type FROM properties").all();
console.log(JSON.stringify(rows, null, 2));
db.close();
