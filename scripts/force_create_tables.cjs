const sqlite3 = require('better-sqlite3');
const db = new sqlite3('database.sqlite');

try {
    console.log("Creating/Ensuring notices table...");
    db.prepare(`
        CREATE TABLE IF NOT EXISTS notices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            imageUrls TEXT,
            isPinned INTEGER DEFAULT 0,
            viewCount INTEGER DEFAULT 0,
            createdAt TEXT,
            updatedAt TEXT
        )
    `).run();

    console.log("Creating/Ensuring posts table...");
    db.prepare(`
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'free',
            authorId INTEGER NOT NULL,
            authorName TEXT,
            imageUrls TEXT,
            viewCount INTEGER DEFAULT 0,
            likeCount INTEGER DEFAULT 0,
            commentCount INTEGER DEFAULT 0,
            isPinned INTEGER DEFAULT 0,
            createdAt TEXT,
            updatedAt TEXT
        )
    `).run();

    console.log("Creating/Ensuring inquiries table...");
    db.prepare(`
        CREATE TABLE IF NOT EXISTS inquiries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            message TEXT NOT NULL,
            inquiryType TEXT NOT NULL,
            propertyId INTEGER,
            createdAt TEXT
        )
    `).run();

    // 혹시 데이터가 남아있을 수 있으니 한 번 더 삭제 (Clean Slate)
    db.prepare('DELETE FROM notices').run();
    db.prepare('DELETE FROM posts').run();
    db.prepare('DELETE FROM inquiries').run();
    
    // Auto increment 초기화
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('notices', 'posts', 'inquiries')").run();

    console.log("Successfully created and cleaned all tables.");
} catch (error) {
    console.error("Error during table creation:", error.message);
} finally {
    db.close();
}
