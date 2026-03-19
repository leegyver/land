const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
console.log('Checking database for community and notice data at:', dbPath);

try {
  const db = new Database(dbPath);
  
  // Check if tables exist
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
  console.log('Tables:', tables.join(', '));

  const noticeCount = tables.includes('notices') ? db.prepare('SELECT COUNT(*) as count FROM notices').get().count : 'TABLE MISSING';
  const postCount = tables.includes('posts') ? db.prepare('SELECT COUNT(*) as count FROM posts').get().count : 'TABLE MISSING';
  const userCount = tables.includes('users') ? db.prepare('SELECT COUNT(*) as count FROM users').get().count : 'TABLE MISSING';
  
  console.log('--- Data Summary ---');
  console.log('Notices:', noticeCount);
  console.log('Posts (Community):', postCount);
  console.log('Users:', userCount);
  console.log('--------------------');
  
  if (typeof noticeCount === 'number' && noticeCount > 0) {
    const sample = db.prepare('SELECT title, createdAt FROM notices ORDER BY id DESC LIMIT 3').all();
    console.log('Recent Notices:', JSON.stringify(sample, null, 2));
  }
  if (typeof postCount === 'number' && postCount > 0) {
    const sample = db.prepare('SELECT title, authorName, createdAt FROM posts ORDER BY id DESC LIMIT 3').all();
    console.log('Recent Posts:', JSON.stringify(sample, null, 2));
  }
  
  db.close();
} catch (err) {
  console.error('Error checking database:', err.message);
}
