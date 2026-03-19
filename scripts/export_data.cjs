const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = '/root/land/database.sqlite_before_merge_bak';
const outputPath = '/root/land/extracted_final.json';

try {
    const db = new Database(dbPath, { readonly: true });
    const data = {
        notices: db.prepare('SELECT * FROM notices').all(),
        posts: db.prepare('SELECT * FROM posts').all()
    };
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`Successfully exported ${data.notices.length} notices and ${data.posts.length} posts to ${outputPath}`);
    db.close();
} catch (e) {
    console.error('Export Error:', e.message);
}
