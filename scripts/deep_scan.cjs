const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dir = '/root/land';
const files = fs.readdirSync(dir).filter(f => {
    return (f.includes('database') || f.includes('sqlite') || f.includes('db') || f.includes('bak')) && !fs.lstatSync(path.join(dir, f)).isDirectory();
});

console.log(`Deep scan started on ${files.length} files...`);

files.forEach(file => {
  const dbPath = path.join(dir, file);
  try {
    const db = new Database(dbPath, { readonly: true });
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    
    let noticeCount = 0;
    if (tables.includes('notices')) {
        noticeCount = db.prepare('SELECT COUNT(*) as count FROM notices').get().count;
    }

    let postCount = 0;
    if (tables.includes('posts')) {
        postCount = db.prepare('SELECT COUNT(*) as count FROM posts').get().count;
    }

    if (noticeCount > 0 || postCount > 0) {
      console.log(`\n[FOUND] ${file}`);
      console.log(`  Notices: ${noticeCount}`);
      console.log(`  Posts: ${postCount}`);
      if (noticeCount > 0) {
        const sample = db.prepare('SELECT title FROM notices LIMIT 1').get();
        console.log(`  Sample Notice: ${sample.title}`);
      }
      if (postCount > 0) {
        const sample = db.prepare('SELECT title FROM posts LIMIT 1').get();
        console.log(`  Sample Post: ${sample.title}`);
      }
    }
    db.close();
  } catch (err) {
    // Silently ignore non-db files
  }
});
console.log('\nScan complete.');
