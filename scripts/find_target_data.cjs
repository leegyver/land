const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..');
const files = fs.readdirSync(dir).filter(f => 
    (f.toLowerCase().includes('sqlite') || f.toLowerCase().includes('bak') || f.toLowerCase().includes('db')) && 
    !fs.lstatSync(path.join(dir, f)).isDirectory()
);

console.log(`Searching through ${files.length} files in ${dir}...`);

files.forEach(f => {
    const dbPath = path.join(dir, f);
    try {
        const db = new Database(dbPath, { readonly: true, timeout: 2000 });
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
        
        let n = 0;
        let p = 0;
        
        if (tables.includes('notices')) {
            n = db.prepare('SELECT count(*) as c FROM notices').get().c;
        }
        if (tables.includes('posts')) {
            p = db.prepare('SELECT count(*) as c FROM posts').get().c;
        }
        
        if (n > 0 || p > 0) {
            console.log(`${f}: notices=${n}, posts=${p}`);
            
            if (n === 1 && p === 3) {
                console.log(`\n>>> FOUND TARGET! File: ${f} <<<`);
                // List titles for confirmation
                const noticeTitle = db.prepare('SELECT title FROM notices LIMIT 1').get()?.title;
                const postTitles = db.prepare('SELECT title FROM posts LIMIT 3').all().map(r => r.title);
                console.log(`Notice Title: ${noticeTitle}`);
                console.log(`Post Titles: ${postTitles.join(', ')}`);
            }
        }
        
        db.close();
    } catch (e) {
        // Skip
    }
});
