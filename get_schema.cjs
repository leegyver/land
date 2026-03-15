const Database = require('better-sqlite3');
const db = new Database('database.sqlite');
const info = db.prepare('PRAGMA table_info(properties)').all();
console.log('--- Properties Schema ---');
info.forEach(col => {
    console.log(`${col.name} (${col.type})`);
});
db.close();
