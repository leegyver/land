import Database from 'better-sqlite3';

// Direct path to security.db
const dbPath = 'C:/Users/user/.antigravity_tools/security.db';

try {
    const db = new Database(dbPath);
    console.log('--- Tables in security.db ---');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log(tables);

    for (const table of tables as any[]) {
        console.log(`--- Table: ${table.name} ---`);
        try {
            const rows = db.prepare(`SELECT * FROM ${table.name} LIMIT 10`).all();
            console.log(rows);
        } catch (err: any) {
            console.log(`Error reading table ${table.name}: ${err.message}`);
        }
    }
    db.close();
} catch (err: any) {
    console.error('Error opening security.db:', err.message);
}
