import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

console.log('--- Checking Users ---');
const users = db.prepare("SELECT id, username, realtorName, businessName FROM users WHERE username LIKE '%이가이버%' OR realtorName LIKE '%이가이버%'").all();
console.log(users);

console.log('\n--- Checking Properties ---');
const properties = db.prepare("SELECT id, title, agentName FROM properties WHERE agentName LIKE '%이가이버%'").all();
console.log(properties);

console.log('\n--- Checking Agents ---');
try {
    const agents = db.prepare("SELECT id, realtorName FROM agents WHERE realtorName LIKE '%이가이버%'").all();
    console.log(agents);
} catch (e) {
    console.log('Agents table might not exist or schema is different.');
}

db.close();
