import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve('database.sqlite');
const db = new Database(dbPath);

console.log('--- Properties Table Schema ---');
const columns = db.prepare("PRAGMA table_info(properties)").all();
columns.forEach(col => {
    console.log(`${col.name}: ${col.type}`);
});

db.close();
