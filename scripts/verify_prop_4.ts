
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

const row = db.prepare('SELECT id, specialNote, propertyDescription, privateNote FROM properties WHERE id = 4').get();
console.log("Property 4 Data:", JSON.stringify(row, null, 2));
