const sqlite3 = require('better-sqlite3');
const db = new sqlite3('database.sqlite');

try {
    // 테이블 내 데이터 삭제
    console.log("Cleaning notices table...");
    db.prepare('DELETE FROM notices').run();
    db.prepare("DELETE FROM sqlite_sequence WHERE name='notices'").run();

    console.log("Cleaning posts table...");
    // posts 테이블이 없을 수도 있으므로 체크 후 삭제
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='posts'").get();
    if (tableCheck) {
        db.prepare('DELETE FROM posts').run();
        db.prepare("DELETE FROM sqlite_sequence WHERE name='posts'").run();
    } else {
        console.log("Table 'posts' does not exist. It will be created by Drizzle on startup.");
    }

    console.log("Cleaning inquiries table (as requested implicitly)...");
    db.prepare('DELETE FROM inquiries').run();
    db.prepare("DELETE FROM sqlite_sequence WHERE name='inquiries'").run();

    console.log("Successfully cleaned all requested boards.");
} catch (error) {
    console.error("Error during cleanup:", error.message);
} finally {
    db.close();
}
