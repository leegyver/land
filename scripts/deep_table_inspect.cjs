const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..');
const backups = fs.readdirSync(dir).filter(f => (f.includes('sqlite') || f.includes('bak') || f.includes('db')) && !fs.lstatSync(path.join(dir, f)).isDirectory());

console.log(`Deep Inspecting ${backups.length} files...`);

backups.forEach(file => {
    const dbPath = path.join(dir, file);
    try {
        const db = new Database(dbPath, { readonly: true, timeout: 500 });
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
        
        console.log(`\nFile: ${file}`);
        for (const t of tables) {
            const count = db.prepare(`SELECT count(*) as c FROM "${t}"`).get().c;
            console.log(`  Table [${t}]: ${count} rows`);
        }
        db.close();
    } catch (e) {
        // console.log(`  File ${file} error: ${e.message}`);
    }
});
console.log('\n--- Deep Inspection Complete ---');
