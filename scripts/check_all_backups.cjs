const Database = require('better-sqlite3');
const path = require('path');

const backups = [
    'database.sqlite_final_bak.sqlite',
    'database.sqlite_before_merge_bak',
    'database.sqlite_prebuild_bak.sqlite',
    'database.sqlite.broken_jan'
];

for (const b of backups) {
    console.log(`\n--- Checking ${b} ---`);
    try {
        const db = new Database(path.join('/root/land', b), { readonly: true });
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
        console.log('Tables:', tables);
        
        for (const t of tables) {
            const count = db.prepare(`SELECT count(*) as c from "${t}"`).get().c;
            if (count > 0) {
                console.log(`  Table ${t}: ${count} rows`);
                if (t.toLowerCase().includes('notice') || t.toLowerCase().includes('post')) {
                    const sample = db.prepare(`SELECT * FROM "${t}" LIMIT 1`).get();
                    console.log(`    SAMPLE:`, JSON.stringify(sample, null, 2));
                }
            }
        }
        db.close();
    } catch (e) {
        console.log(`  Error: ${e.message}`);
    }
}
