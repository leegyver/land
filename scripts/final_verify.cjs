const sqlite3 = require('better-sqlite3');
const db = new sqlite3('database.sqlite');

try {
    const counts = {
        posts: db.prepare('SELECT count(*) as c FROM posts').get().c,
        notices: db.prepare('SELECT count(*) as c FROM notices').get().c,
        inquiries: db.prepare('SELECT count(*) as c FROM inquiries').get().c
    };
    console.log('Final Table Counts:', JSON.stringify(counts, null, 2));

    const admin = db.prepare('SELECT username, role FROM users WHERE username="admin"').get();
    console.log('Admin User Verification:', JSON.stringify(admin, null, 2));

    const tableList = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Current Tables:', tableList.map(t => t.name).join(', '));

} catch (error) {
    console.error('Verification Error:', error.message);
} finally {
    db.close();
}
