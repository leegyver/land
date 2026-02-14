const Database = require('better-sqlite3');
const db = new Database('/root/land/database.sqlite');

console.log("--- Comprehensive Auth Diagnostic ---");

// Check Users
const users = db.prepare("SELECT id, username, role, email FROM users").all();
console.log("Users in DB:");
users.forEach(u => {
    console.log(`- ID: ${u.id}, Username: ${u.username}, Role: [${u.role}], Email: ${u.email}`);
});

// Check Sessions
const sessions = db.prepare("SELECT * FROM sessions").all();
console.log(`\nActive Sessions count: ${sessions.length}`);
sessions.forEach(s => {
    try {
        const data = JSON.parse(s.sess);
        const passport = data.passport || {};
        const userId = passport.user;
        console.log(`- SID: ${s.sid.substring(0, 8)}..., UserID: ${userId}, Expires: ${new Date(s.expired).toLocaleString()}`);
        if (userId) {
            const user = db.prepare("SELECT username, role FROM users WHERE id = ?").get(userId);
            console.log(`  - Linked User: ${user ? user.username : 'NOT FOUND'}, Role: [${user ? user.role : 'N/A'}]`);
        }
    } catch (e) {
        console.log(`- SID: ${s.sid.substring(0, 8)}... (Failed to parse JSON)`);
    }
});

console.log("\n--- Verification Complete ---");
