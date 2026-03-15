import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

const users = db.prepare("SELECT id, username, nickname, role, businessLicenseStatus FROM users WHERE id IN (3, 4)").all();

console.log('--- TARGET USERS ---');
console.log(JSON.stringify(users, null, 2));
console.log('--------------------');
db.close();
