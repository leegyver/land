const Database = require('better-sqlite3');
const path = require('path');

const dbPath = '/root/land/database.sqlite_before_merge_bak';

try {
    const db = new Database(dbPath, { readonly: true });
    // Look at the columns first
    const columns = db.prepare('PRAGMA table_info(news)').all().map(c => c.name);
    console.log('Columns:', columns);

    const rows = db.prepare('SELECT * FROM news ORDER BY id DESC LIMIT 20').all();
    for (const row of rows) {
        console.log(`\nID: ${row.id} - Title: ${row.title}`);
        if (row.title && row.title.includes('공지')) {
            console.log('  *** CANDIDATE NOTICE FOUND ***');
        }
    }
    db.close();
} catch (e) {
    console.error('Error:', e.message);
}
