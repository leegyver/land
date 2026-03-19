const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..');
const files = fs.readdirSync(dir).filter(f => 
    (f.toLowerCase().includes('sqlite') || f.toLowerCase().includes('bak') || f.toLowerCase().includes('db') || f.toLowerCase().includes('.sql')) && 
    !fs.lstatSync(path.join(dir, f)).isDirectory() &&
    fs.statSync(path.join(dir, f)).size > 0
);

console.log(`Exhaustive CONTENT search in ${files.length} non-zero files...`);

files.forEach(f => {
    const dbPath = path.join(dir, f);
    try {
        const db = new Database(dbPath, { readonly: true, timeout: 1000 });
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
        
        tables.forEach(t => {
            try {
                const count = db.prepare(`SELECT count(*) as c FROM "${t}"`).get().c;
                if (count > 0) {
                    console.log(`[${f}] Table [${t}]: ${count} rows`);
                    const firstRow = db.prepare(`SELECT * FROM "${t}" LIMIT 1`).get();
                    if (firstRow) {
                        const title = firstRow.title || firstRow.name || firstRow.subject || firstRow.content?.substring(0, 30);
                        console.log(`  Sample: ${title}`);
                    }
                }
            } catch (e) {}
        });
        db.close();
    } catch (e) {}
});
