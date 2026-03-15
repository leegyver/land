const Database = require('better-sqlite3');
const db = new Database('database.sqlite');
const info = db.prepare('PRAGMA table_info(properties)').all();
console.log('--- Database Columns (Nullable/Default) ---');
info.forEach(col => {
    const nullableIndicator = col.notnull === 1 ? '[NOT NULL]' : '[NULLABLE]';
    const defaultIndicator = col.dflt_value !== null ? `(Default: ${col.dflt_value})` : '';
    console.log(`${col.name.padEnd(20)} | ${col.type.padEnd(10)} | ${nullableIndicator} ${defaultIndicator}`);
});
db.close();
