
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

const row = db.prepare('SELECT id, propertyDescription, privateNote FROM properties WHERE id = 1').get();
console.log("Verification Result:", JSON.stringify(row, null, 2));
