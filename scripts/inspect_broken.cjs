const Database = require('better-sqlite3');
const path = require('path');

const dbPath = '/root/land/database.sqlite.broken_jan';

try {
    const db = new Database(dbPath, { readonly: true });
    const rows = db.prepare('SELECT id, title, createdAt FROM news ORDER BY id DESC LIMIT 10').all();
    console.log('--- News Table Sample from Broken DB ---');
    console.log(JSON.stringify(rows, null, 2));
    db.close();
} catch (e) {
    console.error('Error:', e.message);
}
