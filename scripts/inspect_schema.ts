
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

const columns = db.pragma('table_info(properties)');
console.log("Schema for 'properties':", JSON.stringify(columns, null, 2));
