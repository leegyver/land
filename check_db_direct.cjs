const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
    const row = db.prepare('SELECT * FROM crawled_properties LIMIT 1').get();
    console.log("Sample Naver Property:", JSON.stringify(row, null, 2));

    const counts = db.prepare('SELECT rletTpNm, count(*) as count FROM crawled_properties GROUP BY rletTpNm').all();
    console.log("Property Types Distribution:", counts);
} catch (err) {
    console.error("Error:", err);
} finally {
    db.close();
}
