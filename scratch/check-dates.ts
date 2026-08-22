import Database from 'better-sqlite3';

const db = new Database('database.sqlite');

console.log('--- news columns ---');
console.log(db.prepare('PRAGMA table_info(news)').all());

console.log('--- news samples ---');
const news = db.prepare('SELECT * FROM news LIMIT 10').all() as any[];
console.log(news.map(n => ({ id: n.id, title: n.title, createdAt: n.createdAt })));

console.log('--- all news dates validation ---');
const allNews = db.prepare('SELECT id, createdAt FROM news').all() as any[];
for (const n of allNews) {
  const d = n.createdAt;
  if (!d || isNaN(new Date(d).getTime()) || !/^\d{4}-\d{2}-\d{2}/.test(d)) {
    console.log(`News ID ${n.id} invalid createdAt: "${d}"`);
  }
}

console.log('--- all property dates validation ---');
const allProps = db.prepare('SELECT id, createdAt, updatedAt FROM properties').all() as any[];
for (const p of allProps) {
  const d = p.updatedAt || p.createdAt;
  if (!d || isNaN(new Date(d).getTime()) || !/^\d{4}-\d{2}-\d{2}/.test(d)) {
    console.log(`Prop ID ${p.id} invalid date: createdAt="${p.createdAt}", updatedAt="${p.updatedAt}"`);
  }
}

console.log('--- all posts dates validation ---');
const allPosts = db.prepare('SELECT id, createdAt, updatedAt FROM posts').all() as any[];
for (const post of allPosts) {
  const d = post.updatedAt || post.createdAt;
  if (!d || isNaN(new Date(d).getTime()) || !/^\d{4}-\d{2}-\d{2}/.test(d)) {
    console.log(`Post ID ${post.id} invalid date: createdAt="${post.createdAt}", updatedAt="${post.updatedAt}"`);
  }
}
