const Database = require('better-sqlite3');
const db = new Database('database.sqlite');
try {
    const info = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='crawled_properties'").get();
    console.log(info ? "Table crawled_properties exists" : "Table crawled_properties does NOT exist");
    if (info) {
        const count = db.prepare("SELECT COUNT(*) as count FROM crawled_properties").get();
        console.log(`Row count: ${count.count}`);
    }
} catch (e) {
    console.error(e);
}
db.close();
