import Database from 'better-sqlite3';
import path from 'path';

// Production path for SQLite
const dbPath = '/root/land/database.sqlite';
const db = new Database(dbPath);

const pattern = '%이가이버%';
const users = db.prepare("SELECT id, username, nickname, role, businessLicenseStatus FROM users WHERE username LIKE ? OR nickname LIKE ?").all(pattern, pattern);

console.log('--- PRODUCTION USERS ---');
console.log(JSON.stringify(users, null, 2));
console.log('-------------------------');
db.close();
