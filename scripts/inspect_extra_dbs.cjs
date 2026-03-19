const Database = require('better-sqlite3');
const path = require('path');

const files = ['data.db', 'database.db'];

files.forEach(f => {
    const dbPath = path.join('/root/land', f);
    console.log(`\n--- Inspecting ${f} ---`);
    try {
        const db = new Database(dbPath, { readonly: true });
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
        console.log('Tables:', tables);
        
        tables.forEach(t => {
            const count = db.prepare(`SELECT count(*) as c FROM "${t}"`).get().c;
            console.log(`  Table [${t}]: ${count} rows`);
            if (count > 0 && (t.includes('notice') || t.includes('post'))) {
                const rows = db.prepare(`SELECT * FROM "${t}"`).all();
                console.log('  Rows:', JSON.stringify(rows, null, 2));
            }
        });
        db.close();
    } catch (e) {
        console.error(`Error in ${f}:`, e.message);
    }
});
