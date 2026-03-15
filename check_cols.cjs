const Database = require('better-sqlite3');
const db = new Database('database.sqlite');
const cols = db.prepare("PRAGMA table_info(properties)").all();
cols.forEach(c => console.log(c.cid + ': ' + c.name + ' (' + c.type + ')'));
console.log('---AGENTS---');
const acols = db.prepare("PRAGMA table_info(agents)").all();
acols.forEach(c => console.log(c.cid + ': ' + c.name + ' (' + c.type + ')'));
db.close();
