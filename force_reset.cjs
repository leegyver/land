const Database = require('better-sqlite3');
const { scrypt, randomBytes } = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    const buf = await scryptAsync(password, salt, 64);
    return `${buf.toString("hex")}.${salt}`;
}

async function run() {
    const db = new Database('/root/land/database.sqlite');
    const newPassword = 'admin123';
    const hash = await hashPassword(newPassword);

    const result = db.prepare("UPDATE users SET password = ? WHERE username = 'admin'").run(hash);

    if (result.changes > 0) {
        console.log(`✅ Admin password successfully reset to '${newPassword}'`);
        console.log(`🔑 New Hash: ${hash.substring(0, 20)}...`);
    } else {
        console.log("❌ Admin user not found. Creating one...");
        const insertHash = await hashPassword(newPassword);
        db.prepare("INSERT INTO users (username, password, role) VALUES ('admin', ?, 'admin')").run(insertHash);
        console.log("✅ Admin user created with password 'admin123'");
    }
}

run();
