const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dir = '/root/land';
const files = [
    'database.sqlite',
    'database.sqlite_final_bak.sqlite',
    'database.sqlite_before_merge_bak',
    'database.sqlite_prebuild_bak.sqlite',
    'database.db',
    'data.db'
];

console.log('Case-insensitive table scan starting...');

for (const file of files) {
    const fullPath = path.join(dir, file);
    if (!fs.existsSync(fullPath)) continue;

    try {
        const db = new Database(fullPath, { readonly: true });
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
        
        console.log(`\nFile: ${file}`);
        for (const t of tables) {
            const tl = t.toLowerCase();
            if (tl.includes('notice') || tl.includes('post') || tl.includes('commu') || tl.includes('board')) {
                const count = db.prepare(`SELECT COUNT(*) as c FROM "${t}"`).get().c;
                console.log(`  Table [${t}]: ${count} rows`);
                if (count > 0) {
                    const sample = db.prepare(`SELECT * FROM "${t}" LIMIT 1`).get();
                    console.log(`    Sample:`, JSON.stringify(sample, null, 2));
                }
            }
        }
        db.close();
    } catch (e) {
        // console.log(`  Error reading ${file}: ${e.message}`);
    }
}
