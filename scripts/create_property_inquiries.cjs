const sqlite3 = require('better-sqlite3');
const db = new sqlite3('database.sqlite');

try {
    console.log("Creating property_inquiries table...");
    // schema.ts의 정의에 따라 생성
    db.prepare(`
        CREATE TABLE IF NOT EXISTS property_inquiries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            propertyId INTEGER NOT NULL,
            userId INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            isReply INTEGER NOT NULL DEFAULT 0,
            parentId INTEGER,
            isReadByAdmin INTEGER NOT NULL DEFAULT 0,
            createdAt TEXT
        )
    `).run();

    console.log("Successfully created property_inquiries table.");
    
    // 테이블 정보 다시 확인
    const info = db.prepare('PRAGMA table_info(property_inquiries)').all();
    console.log('Table Structure:', JSON.stringify(info, null, 2));

} catch (error) {
    console.error("Error creating property_inquiries table:", error.message);
} finally {
    db.close();
}
