const db = require('better-sqlite3')('database.sqlite');
console.log(db.prepare("SELECT atclNm, tradTpNm, prc, rentPrc, depositPrc FROM crawled_properties WHERE tradTpNm = '월세' LIMIT 5").all());
db.close();
