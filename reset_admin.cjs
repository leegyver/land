const Database = require('better-sqlite3');
const { scrypt, randomBytes } = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const buf = await scryptAsync(password, salt, 64);
    return `${buf.toString('hex')}.${salt}`;
}

async function run() {
    const db = new Database('database.sqlite');
    const password = 'admin123';
    const hashed = await hashPassword(password);
    db.prepare("UPDATE users SET password = ? WHERE username = 'admin'").run(hashed);
    console.log('Password reset to:', password);
}

run();
