const Database = require('better-sqlite3');
const { scrypt, timingSafeEqual } = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied, stored) {
    try {
        const [hashed, salt] = stored.split(".");
        const hashedBuf = Buffer.from(hashed, "hex");
        const suppliedBuf = await scryptAsync(supplied, salt, 64);
        return timingSafeEqual(hashedBuf, suppliedBuf);
    } catch (e) {
        console.error("Compare Error:", e);
        return false;
    }
}

async function run() {
    console.log("--- Diagnosing Admin Logic ---");
    // Connect to DB (using read-only if possible, or default)
    const db = new Database('database.sqlite');

    const user = db.prepare("SELECT * FROM users WHERE username = 'admin'").get();

    if (!user) {
        console.log("❌ Admin user NOT FOUND");
        return;
    }

    console.log(`✅ Admin user found (ID: ${user.id})`);
    console.log(`🔑 Stored Password Hash: ${user.password.substring(0, 20)}...`);

    const testPw = 'admin123';
    const isMatch = await comparePasswords(testPw, user.password);

    if (isMatch) {
        console.log(`✅ SUCCESS: Password '${testPw}' MATCHES the stored hash.`);
    } else {
        console.log(`❌ FAILURE: Password '${testPw}' DOES NOT MATCH.`);
    }
}

run();
