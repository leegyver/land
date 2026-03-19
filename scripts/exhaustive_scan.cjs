const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..');
const files = fs.readdirSync(dir).filter(f => 
    (f.toLowerCase().includes('sqlite') || f.toLowerCase().includes('bak') || f.toLowerCase().includes('db')) && 
    !fs.lstatSync(path.join(dir, f)).isDirectory() &&
    fs.statSync(path.join(dir, f)).size > 0
);

console.log(`Exhaustive search in ${files.length} non-zero files...`);

files.forEach(f => {
    const dbPath = path.join(dir, f);
    try {
        const db = new Database(dbPath, { readonly: true, timeout: 2000 });
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
        
        tables.forEach(t => {
            try {
                const count = db.prepare(`SELECT count(*) as c FROM "${t}"`).get().c;
                if (count === 1 || count === 3 || count === 4) {
                    console.log(`[${f}] Table [${t}]: ${count} rows`);
                    
                    // Sample titles if possible
                    try {
                        const cols = db.prepare(`PRAGMA table_info("${t}")`).all().map(c => c.name);
                        if (cols.includes('title')) {
                            const titles = db.prepare(`SELECT title FROM "${t}" LIMIT 5`).all().map(r => r.title);
                            console.log(`  Titles: ${titles.join(', ')}`);
                        } else if (cols.includes('content')) {
                            const content = db.prepare(`SELECT content FROM "${t}" LIMIT 1`).get()?.content;
                            console.log(`  Content: ${content?.substring(0, 50)}...`);
                        }
                    } catch (e) {}
                }
            } catch (e) {}
        });
        db.close();
    } catch (e) {}
});
