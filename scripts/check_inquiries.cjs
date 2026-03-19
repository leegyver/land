const sqlite3 = require('better-sqlite3');
const db = new sqlite3('database.sqlite');
const tables = ['notices', 'inquiries'];

tables.forEach(t => {
    try {
        const rows = db.prepare(`SELECT * FROM "${t}"`).all();
        console.log(`--- TABLE: ${t} ---`);
        console.log(JSON.stringify(rows, null, 2));
    } catch(e) {
        console.log(`Error reading ${t}: ${e.message}`);
    }
});
db.close();
