const Database = require('better-sqlite3');
const db = new Database('database.sqlite');
const result = db.prepare('SELECT COUNT(*) as count, MAX(crawledAt) as lastUpdate FROM crawled_properties').get();
console.log(JSON.stringify(result));
