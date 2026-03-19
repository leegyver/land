const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const targetDbPath = path.join(__dirname, '..', 'database.sqlite');
const candidates = [
  'database.sqlite_final_bak.sqlite',
  'database.sqlite_before_merge_bak',
  'database.sqlite_prebuild_bak.sqlite'
].map(c => path.join(__dirname, '..', '..', c)); // Wait, __dirname is e:\server\homepage\scripts. So .. is root.


console.log('--- Final Recovery Process Started ---');

let sourceDbPath = null;
for (const cand of candidates) {
    const fullPath = path.join(__dirname, cand);
    if (!fs.existsSync(fullPath)) continue;
    
    try {
        const db = new Database(fullPath, { readonly: true });
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
        
        let notices = tables.includes('notices') ? db.prepare('SELECT * FROM notices').all() : [];
        let posts = tables.includes('posts') ? db.prepare('SELECT * FROM posts').all() : [];
        
        console.log(`Checking [${cand}]: Notices=${notices.length}, Posts=${posts.length}`);
        
        if (notices.length === 1 && posts.length === 3) {
            console.log(`*** MATCH FOUND: ${cand} ***`);
            sourceDbPath = fullPath;
            db.close();
            break;
        }
        db.close();
    } catch (e) {
        console.log(`Failed checking [${cand}]: ${e.message}`);
    }
}

if (!sourceDbPath) {
    console.error('Could not find the backup with 1 notice and 3 posts.');
    process.exit(1);
}

try {
    const sourceDb = new Database(sourceDbPath, { readonly: true });
    const targetDb = new Database(targetDbPath);

    // Ensure tables exist in target
    targetDb.prepare(`CREATE TABLE IF NOT EXISTS notices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        imageUrls TEXT,
        isPinned INTEGER DEFAULT 0,
        viewCount INTEGER DEFAULT 0,
        createdAt TEXT,
        updatedAt TEXT
    )`).run();

    targetDb.prepare(`CREATE TABLE IF NOT EXISTS posts (
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
    )`).run();

    const notices = sourceDb.prepare('SELECT * FROM notices').all();
    const posts = sourceDb.prepare('SELECT * FROM posts').all();

    console.log('\nRestoring Notices...');
    for (const item of notices) {
        const { id, ...data } = item;
        const keys = Object.keys(data);
        const placeholders = keys.map(() => '?').join(',');
        targetDb.prepare(`INSERT OR IGNORE INTO notices (${keys.join(',')}) VALUES (${placeholders})`).run(Object.values(data));
        console.log(`[OK] Notice: ${item.title}`);
    }

    console.log('\nRestoring Posts...');
    for (const item of posts) {
        const { id, ...data } = item;
        const keys = Object.keys(data);
        const placeholders = keys.map(() => '?').join(',');
        targetDb.prepare(`INSERT OR IGNORE INTO posts (${keys.join(',')}) VALUES (${placeholders})`).run(Object.values(data));
        console.log(`[OK] Post: ${item.title}`);
    }

    sourceDb.close();
    targetDb.close();
    console.log('\n--- Recovery Completed Successfully ---');
} catch (err) {
    console.error('Recovery Error:', err.message);
}
