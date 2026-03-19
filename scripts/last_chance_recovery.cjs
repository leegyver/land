const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = '/root/land/database.sqlite_before_merge_bak';
const outPath = '/root/land/final_match.json';

try {
    const db = new Database(dbPath, { readonly: true });
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    
    const results = [];
    for (const t of tables) {
        try {
            const rows = db.prepare(`SELECT * FROM "${t}"`).all();
            for (const row of rows) {
                if (JSON.stringify(row).includes('이가이버')) {
                    results.push({ table: t, data: row });
                }
            }
        } catch (e) {}
    }
    
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
    console.log(`Matched ${results.length} rows. Results in ${outPath}`);
    db.close();
} catch (e) {
    console.error('Error:', e.message);
}
