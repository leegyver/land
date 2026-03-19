const Database = require('better-sqlite3');
const path = require('path');

const files = [
    'database.sqlite',
    'database.sqlite_final_bak.sqlite',
    'database.sqlite_prebuild_bak.sqlite'
];

files.forEach(f => {
    const dbPath = path.resolve(process.cwd(), f);
    console.log(`\n--- Inspecting ${f} ---`);
    try {
        const db = new Database(dbPath, { readonly: true });
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
        
        tables.forEach(t => {
            try {
                const count = db.prepare(`SELECT count(*) as c FROM "${t}"`).get().c;
                if (count > 0) {
                    console.log(`  Table [${t}]: ${count} rows`);
                    // If table name suggests posts or notices, show them
                    if (t.toLowerCase().includes('post') || t.toLowerCase().includes('notice') || t.toLowerCase().includes('inquiry')) {
                        const rows = db.prepare(`SELECT * FROM "${t}"`).all();
                        console.log(`    Data:`, JSON.stringify(rows, null, 2));
                    }
                }
            } catch (err) {}
        });
        db.close();
    } catch (e) {
        console.error(`Error in ${f}:`, e.message);
    }
});
