const Database = require('better-sqlite3');
const path = require('path');

const dbPath = '/root/land/database.sqlite';

try {
    const db = new Database(dbPath, { readonly: true });
    const counts = db.prepare('SELECT category, count(*) as c FROM news GROUP BY category').all();
    console.log('--- News Categories ---');
    console.log(JSON.stringify(counts, null, 2));

    console.log('\n--- Recent News ---');
    const recent = db.prepare('SELECT title, category, createdAt FROM news ORDER BY id DESC LIMIT 5').all();
    console.log(JSON.stringify(recent, null, 2));

    db.close();
} catch (e) {
    console.error('Error:', e.message);
}
