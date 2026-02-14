import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

console.log('--- Database Metadata ---');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name).join(', '));

console.log('\n--- Row Counts ---');
for (const table of tables) {
    try {
        const count = db.prepare(`SELECT count(*) as count FROM ${table.name}`).get().count;
        console.log(`${table.name}: ${count}`);
    } catch (e) { }
}

console.log('\n--- Sample properties ---');
try {
    const props = db.prepare("SELECT id, title, district FROM properties LIMIT 50").all();
    props.forEach(p => {
        console.log(`[${p.id}] ${p.title} (${p.district})`);
    });
} catch (e) {
    console.log('Error querying properties:', e.message);
}

db.close();
