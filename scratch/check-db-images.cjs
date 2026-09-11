const Database = require('better-sqlite3');
const db = new Database('/root/land/database.sqlite');
const prop = db.prepare('SELECT id, title, imageUrl, imageUrls FROM properties WHERE imageUrl IS NOT NULL LIMIT 3').all();
console.log(JSON.stringify(prop, null, 2));
