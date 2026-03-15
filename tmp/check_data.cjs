const Database = require("better-sqlite3");
const db = new Database("/root/land/database.sqlite", {readonly: true});

console.log("=== 매물 총 개수 ===");
console.log(db.prepare("SELECT COUNT(*) as c FROM properties").get().c);

console.log("\n=== 최근 등록 매물 10개 ===");
const recent = db.prepare("SELECT id, title, createdAt FROM properties ORDER BY id DESC LIMIT 10").all();
recent.forEach(r => console.log(`#${r.id} | ${r.createdAt || 'N/A'} | ${r.title?.slice(0,40)}`));

console.log("\n=== 가장 오래된 매물 3개 ===");
const oldest = db.prepare("SELECT id, title, createdAt FROM properties ORDER BY id ASC LIMIT 3").all();
oldest.forEach(r => console.log(`#${r.id} | ${r.createdAt || 'N/A'} | ${r.title?.slice(0,40)}`));

console.log("\n=== 모든 테이블 데이터 수 ===");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'").all();
tables.forEach(t => {
  try {
    const c = db.prepare(`SELECT COUNT(*) as c FROM "${t.name}"`).get().c;
    if (c > 0) console.log(`${t.name}: ${c}건`);
  } catch(e) {}
});

console.log("\n=== 뉴스 최근 5개 ===");
try {
  const news = db.prepare("SELECT id, title, createdAt FROM news ORDER BY id DESC LIMIT 5").all();
  news.forEach(r => console.log(`#${r.id} | ${r.createdAt || 'N/A'} | ${r.title?.slice(0,40)}`));
} catch(e) {}

db.close();
