const Database = require('better-sqlite3');
const path = require('path');

const dbPath = '/root/land/database.sqlite_final_bak.sqlite';
const needle = '안녕하세요 이가이버';

console.log(`Deep searching for "${needle}" in ${dbPath}...`);

try {
    const db = new Database(dbPath, { readonly: true });
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    
    for (const t of tables) {
        const columns = db.prepare(`PRAGMA table_info("${t}")`).all().map(c => c.name);
        const rows = db.prepare(`SELECT * FROM "${t}"`).all();
        
        for (const row of rows) {
            const rowStr = JSON.stringify(row);
            if (rowStr.includes(needle)) {
                console.log(`\n[MATCH FOUND] Table: ${t}`);
                console.log(JSON.stringify(row, null, 2));
            }
        }
    }
    db.close();
} catch (e) {
    console.error('Error:', e.message);
}
