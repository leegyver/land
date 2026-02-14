const Database = require('better-sqlite3');
const db = new Database('/root/land/database.sqlite');

console.log("--- DB Table Verification ---");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Tables:", tables.map(t => t.name).join(", "));

const hasSessions = tables.some(t => t.name === 'sessions');
if (hasSessions) {
    console.log("✅ 'sessions' table EXISTS. Persistent storage is active.");
    const sessionCount = db.prepare("SELECT COUNT(*) as count FROM sessions").get();
    console.log(`📊 Current session count: ${sessionCount.count}`);
} else {
    console.log("❌ 'sessions' table NOT FOUND. Store initialization might have failed.");
}

const admin = db.prepare("SELECT * FROM users WHERE username = 'admin'").get();
console.log(`👤 Admin User: ${admin ? 'Exists' : 'NOT FOUND'}`);
if (admin) {
    console.log(`🔑 Admin Hash: ${admin.password.substring(0, 20)}...`);
    console.log(`🏷️ Admin Role: ${admin.role}`);
}
