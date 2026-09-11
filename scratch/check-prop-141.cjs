const Database = require('better-sqlite3');
const db = new Database('/root/land/database.sqlite');
const prop = db.prepare('SELECT * FROM properties WHERE id = 141').get();
console.log(JSON.stringify(prop, null, 2));
