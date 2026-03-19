const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dir = '/root/land';
const files = fs.readdirSync(dir).filter(f => !fs.lstatSync(path.join(dir, f)).isDirectory());

console.log(`Checking ${files.length} files in ${dir}...`);

files.forEach(file => {
    const dbPath = path.join(dir, file);
    process.stdout.write(`Evaluating ${file}... `);

    try {
        const db = new Database(dbPath, { readonly: true, timeout: 500 });
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
        
        process.stdout.write(`Success (${tables.length} tables)\n`);
        
        for (const t of tables) {
            const tl = t.toLowerCase();
            const count = db.prepare(`SELECT COUNT(*) as c FROM "${t}"`).get().c;
            if (count > 0) {
                if (tl.includes('notice') || tl.includes('post') || tl.includes('commu') || tl.includes('board')) {
                    console.log(`  >>> [!!! FOUND !!!] Table [${t}]: ${count} rows`);
                    const sample = db.prepare(`SELECT * FROM "${t}" LIMIT 1`).get();
                    console.log(`      Sample:`, JSON.stringify(sample, null, 2));
                }
            }
        }
        db.close();
    } catch (e) {
        process.stdout.write(`Skip (Not a DB or Error)\n`);
    }
});
