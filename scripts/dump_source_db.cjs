const Database = require('better-sqlite3');
const path = require('path');

const dbPath = '/root/land/database.sqlite_final_bak.sqlite';

try {
    const db = new Database(dbPath, { readonly: true });
    
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    console.log('Tables:', tables);

    for (const t of tables) {
        const count = db.prepare(`SELECT count(*) as c from "${t}"`).get().c;
        if (count > 0) {
            console.log(`\n--- TABLE: ${t} (${count} rows) ---`);
            const rows = db.prepare(`SELECT * FROM "${t}"`).all();
            console.log(JSON.stringify(rows, null, 2));
        }
    }
    db.close();
} catch (e) {
    console.error('Error:', e.message);
}
