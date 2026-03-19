const Database = require('better-sqlite3');
const path = require('path');

const backups = [
    'database.sqlite',
    'database.sqlite_final_bak.sqlite',
    'database.sqlite_before_merge_bak',
    'database.sqlite_prebuild_bak.sqlite',
    'database.sqlite.broken_jan'
];

for (const b of backups) {
    console.log(`\n\n=== ${b} ===`);
    try {
        const db = new Database(path.join('/root/land', b), { readonly: true });
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
        
        if (tables.includes('notices')) {
            const rows = db.prepare('SELECT id, title FROM notices').all();
            console.log(`Notice rows (${rows.length}):`, rows);
        } else {
            console.log('Table notices: MISSING');
        }

        if (tables.includes('posts')) {
            const rows = db.prepare('SELECT id, title FROM posts').all();
            console.log(`Post rows (${rows.length}):`, rows);
        } else {
            console.log('Table posts: MISSING');
        }
        db.close();
    } catch (e) {
        console.log('Error:', e.message);
    }
}
