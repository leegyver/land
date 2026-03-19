const Database = require('better-sqlite3');
const fs = require('fs');

const dbFile = process.argv[2] || 'database.sqlite';
if (!fs.existsSync(dbFile)) {
    console.error(`Error: ${dbFile} not found.`);
    process.exit(1);
}

try {
    const db = new Database(dbFile, { readonly: true });
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    
    console.log(`--- Audit Result: ${dbFile} ---`);
    tables.forEach(t => {
        try {
            const count = db.prepare(`SELECT count(*) as c FROM "${t}"`).get().c;
            console.log(`${t}: ${count} rows`);
        } catch (e) {
            console.log(`${t}: ERROR [${e.message}]`);
        }
    });
    db.close();
} catch (e) {
    console.error(`Critical error: ${e.message}`);
}
