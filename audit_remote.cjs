const Database = require('better-sqlite3');
const db = new Database('database.sqlite');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('--- Remote DB Audit ---');
tables.forEach(table => {
    const count = db.prepare(`SELECT count(*) as count FROM ${table.name}`).get().count;
    console.log(`Table: ${table.name.padEnd(20)} | Count: ${count}`);
});
db.close();
