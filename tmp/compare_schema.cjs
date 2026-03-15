const Database = require("better-sqlite3");

const current = new Database("/root/land/database.sqlite", {readonly: true});
const backup = new Database("/tmp/database.sqlite", {readonly: true});

console.log("=== 현재 DB properties 컬럼 ===");
const curCols = current.prepare("PRAGMA table_info(properties)").all();
console.log(curCols.map(c => c.name + "(" + c.type + ")").join(", "));

console.log("\n=== 백업 DB properties 컬럼 ===");
const bakCols = backup.prepare("PRAGMA table_info(properties)").all();
console.log(bakCols.map(c => c.name + "(" + c.type + ")").join(", "));

console.log("\n=== 현재 DB news 컬럼 ===");
const curNewsCols = current.prepare("PRAGMA table_info(news)").all();
console.log(curNewsCols.map(c => c.name + "(" + c.type + ")").join(", "));

console.log("\n=== 백업 DB news 컬럼 ===");
const bakNewsCols = backup.prepare("PRAGMA table_info(news)").all();
console.log(bakNewsCols.map(c => c.name + "(" + c.type + ")").join(", "));

console.log("\n=== 현재 DB agents 컬럼 ===");
const curAgCols = current.prepare("PRAGMA table_info(agents)").all();
console.log(curAgCols.map(c => c.name + "(" + c.type + ")").join(", "));

console.log("\n=== 백업 DB agents 컬럼 ===");
const bakAgCols = backup.prepare("PRAGMA table_info(agents)").all();
console.log(bakAgCols.map(c => c.name + "(" + c.type + ")").join(", "));

// Check for duplicate properties
console.log("\n=== 중복 체크 ===");
const curTitles = current.prepare("SELECT title FROM properties WHERE title != '제목을 입력하세요'").all().map(r => r.title);
const bakProps = backup.prepare("SELECT id, title FROM properties WHERE title != '제목을 입력하세요'").all();
let newCount = 0;
bakProps.forEach(p => {
  if (!curTitles.includes(p.title)) newCount++;
});
console.log("백업에만 있는 매물: " + newCount + "건");

current.close();
backup.close();
