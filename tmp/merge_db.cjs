const Database = require("better-sqlite3");
const fs = require("fs");

// 1. 현재 DB 백업
console.log("1. 현재 DB 백업 중...");
fs.copyFileSync("/root/land/database.sqlite", "/root/land/database.sqlite_before_merge_bak");
console.log("   -> database.sqlite_before_merge_bak 생성 완료");

// 2. DB 열기
const current = new Database("/root/land/database.sqlite");
const backup = new Database("/tmp/database.sqlite", { readonly: true });

// 3. 매물 병합
console.log("\n2. 매물 데이터 병합 시작...");
const curTitles = new Set(current.prepare("SELECT title FROM properties").all().map(r => r.title));
const bakProps = backup.prepare("SELECT * FROM properties WHERE title != '제목을 입력하세요'").all();

// 공통 컬럼 (백업 DB 기준, ownerId/atclNo 제외)
const commonCols = [
  "title","description","type","price","address","district","size",
  "bedrooms","bathrooms","imageUrl","imageUrls","featuredImageIndex",
  "agentId","featured","displayOrder","isUrgent","urgentOrder",
  "isNegotiable","negotiableOrder","isVisible","createdAt","updatedAt",
  "buildingName","unitNumber","supplyArea","privateArea","areaSize",
  "floor","totalFloors","direction","elevator","parking","heatingSystem",
  "approvalDate","landType","zoneType","dealType","deposit","depositAmount",
  "monthlyRent","maintenanceFee","ownerName","ownerPhone","tenantName",
  "tenantPhone","clientName","clientPhone","specialNote","coListing",
  "agentName","propertyDescription","privateNote","youtubeUrl","isSold",
  "viewCount","isLongTerm","longTermOrder","latitude","longitude"
];

const placeholders = commonCols.map(() => "?").join(", ");
const insertProp = current.prepare(
  `INSERT INTO properties (${commonCols.join(", ")}) VALUES (${placeholders})`
);

let propAdded = 0;
let propSkipped = 0;
const insertMany = current.transaction(() => {
  for (const p of bakProps) {
    if (curTitles.has(p.title)) {
      propSkipped++;
      continue;
    }
    const values = commonCols.map(col => p[col] !== undefined ? p[col] : null);
    insertProp.run(...values);
    propAdded++;
    curTitles.add(p.title);
  }
});
insertMany();
console.log(`   -> 매물 추가: ${propAdded}건, 중복 스킵: ${propSkipped}건`);

// 4. 뉴스 병합
console.log("\n3. 뉴스 데이터 병합 시작...");
const curNewsTitles = new Set(current.prepare("SELECT title FROM news").all().map(r => r.title));
const bakNews = backup.prepare("SELECT * FROM news").all();

const newsCols = ["title","summary","description","content","source","sourceUrl","url","imageUrl","category","isPinned","createdAt"];
const newsPlaceholders = newsCols.map(() => "?").join(", ");
const insertNews = current.prepare(
  `INSERT INTO news (${newsCols.join(", ")}) VALUES (${newsPlaceholders})`
);

let newsAdded = 0;
let newsSkipped = 0;
const insertNewsMany = current.transaction(() => {
  for (const n of bakNews) {
    if (curNewsTitles.has(n.title)) {
      newsSkipped++;
      continue;
    }
    const values = newsCols.map(col => n[col] !== undefined ? n[col] : null);
    insertNews.run(...values);
    newsAdded++;
    curNewsTitles.add(n.title);
  }
});
insertNewsMany();
console.log(`   -> 뉴스 추가: ${newsAdded}건, 중복 스킵: ${newsSkipped}건`);

// 5. 더미 데이터 삭제
console.log("\n4. 더미 매물 삭제...");
const dummyResult = current.prepare("DELETE FROM properties WHERE title = '제목을 입력하세요'").run();
console.log(`   -> 더미 매물 ${dummyResult.changes}건 삭제`);

// 6. 최종 확인
console.log("\n=== 최종 결과 ===");
console.log("매물 총:", current.prepare("SELECT COUNT(*) as c FROM properties").get().c + "건");
console.log("    실제 매물:", current.prepare("SELECT COUNT(*) as c FROM properties WHERE title != '제목을 입력하세요'").get().c + "건");
console.log("뉴스 총:", current.prepare("SELECT COUNT(*) as c FROM news").get().c + "건");
console.log("회원 총:", current.prepare("SELECT COUNT(*) as c FROM users").get().c + "명");

current.close();
backup.close();
console.log("\n✅ 병합 완료!");
