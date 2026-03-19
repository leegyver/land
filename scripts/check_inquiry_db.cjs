const sqlite3 = require('better-sqlite3');
const db = new sqlite3('database.sqlite');

try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    console.log('Available Tables:', tables.join(', '));

    ['property_inquiries', 'inquiries'].forEach(tableName => {
        if (tables.includes(tableName)) {
            const info = db.prepare(`PRAGMA table_info(${tableName})`).all();
            console.log(`\n--- ${tableName} Columns ---`);
            info.forEach(col => {
                console.log(`${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''}`);
            });
            const count = db.prepare(`SELECT count(*) as c FROM ${tableName}`).get().c;
            console.log(`Current Record Count: ${count}`);
        } else {
            console.log(`\n!!! ${tableName} table DOES NOT EXIST !!!`);
        }
    });

} catch (error) {
    console.error('Diagnostic Error:', error.message);
} finally {
    db.close();
}
