const Database = require('better-sqlite3');
const db = new Database('/root/land/database.sqlite');
try {
    const notices = db.prepare('SELECT count(*) as count FROM notices').get();
    const posts = db.prepare('SELECT count(*) as count FROM posts').get();
    console.log('--- REMOTE DB CHECK ---');
    console.log('Notices:', notices.count);
    console.log('Posts:', posts.count);
    if (notices.count > 0) {
        console.log('Latest Notice:', db.prepare('SELECT title FROM notices LIMIT 1').get().title);
    }
} catch (err) {
    console.error('Remote DB Check Error:', err.message);
} finally {
    db.close();
}
