const db = require("better-sqlite3")("/root/land/database.sqlite", {readonly: true});
console.log("매물 총:", db.prepare("SELECT COUNT(*) as c FROM properties").get().c);
console.log("실제 매물:", db.prepare("SELECT COUNT(*) as c FROM properties WHERE title != '제목을 입력하세요'").get().c);
console.log("뉴스 총:", db.prepare("SELECT COUNT(*) as c FROM news").get().c);
console.log("회원 총:", db.prepare("SELECT COUNT(*) as c FROM users").get().c);
console.log("\n최근 매물 5건:");
db.prepare("SELECT id, substr(createdAt,1,10) as d, substr(title,1,50) as t FROM properties ORDER BY id DESC LIMIT 5").all().forEach(r => console.log("  #" + r.id + " " + r.d + " " + r.t));
console.log("\n백업파일 존재:", require("fs").existsSync("/root/land/database.sqlite_before_merge_bak"));
db.close();
