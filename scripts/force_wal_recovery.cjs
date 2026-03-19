const Database = require('better-sqlite3');
const fs = require('fs');

// 1. Create a clean base
if (fs.existsSync('database_temp_base.sqlite')) fs.unlinkSync('database_temp_base.sqlite');
const db = new Database('database_temp_base.sqlite');

try {
    // Create tables
    db.exec(`
        CREATE TABLE IF NOT EXISTS notices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            imageUrls TEXT,
            isPinned INTEGER DEFAULT 0,
            viewCount INTEGER DEFAULT 0,
            createdAt TEXT,
            updatedAt TEXT
        );
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT DEFAULT 'free',
            authorId INTEGER NOT NULL,
            authorName TEXT,
            imageUrls TEXT,
            viewCount INTEGER DEFAULT 0,
            likeCount INTEGER DEFAULT 0,
            commentCount INTEGER DEFAULT 0,
            isPinned INTEGER DEFAULT 0,
            createdAt TEXT,
            updatedAt TEXT
        );
    `);
    
    console.log('Base tables created.');
    db.close();

    // 2. Mock the WAL merge by using the 18:32 WAL file
    // Actually, better-sqlite3 handles WAL automatically if the file is named database.sqlite-wal.
    // So we copy the Mar 18 18:44 database (which we know is clean but has correct schema) 
    // and let it merge with the 18:32 WAL.
    
    // WAIT! I don't have the 13MB database.sqlite anymore? (Yes I do, Step 1340).
    
    const targetDb = 'database_recovered_final_v10.sqlite';
    if (fs.existsSync(targetDb)) fs.unlinkSync(targetDb);
    fs.copyFileSync('database.sqlite', targetDb);
    
    // Copy the WAL file
    const targetWal = targetDb + '-wal';
    if (fs.existsSync(targetWal)) fs.unlinkSync(targetWal);
    fs.copyFileSync('database.sqlite-wal', targetWal);
    
    console.log(`Copied database and WAL to ${targetDb}`);
    
    // Open it to trigger recovery
    const recoveredDb = new Database(targetDb);
    const noticeCount = recoveredDb.prepare('SELECT count(*) as count FROM notices').get().count;
    const postCount = recoveredDb.prepare('SELECT count(*) as count FROM posts').get().count;
    
    console.log(`RECOVERY RESULT -> Notices: ${noticeCount}, Posts: ${postCount}`);
    
    if (noticeCount === 1 && postCount === 3) {
        console.log('!!! 100% SUCCESS !!! DATA RECOVERED!');
    } else {
        console.log('Recovery failed to find the 1 notice and 3 posts.');
    }
    recoveredDb.close();

} catch (err) {
    console.error('CRITICAL RECOVERY ERROR:', err.message);
}
