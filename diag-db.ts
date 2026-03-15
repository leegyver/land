import Database from 'better-sqlite3';

const sqlite = new Database('database.sqlite');
try {
    const rows = sqlite.prepare("SELECT id, imageUrls FROM properties").all();
    let errorCount = 0;
    for (const row of rows) {
        if (typeof row.imageUrls === 'string') {
            try {
                if (row.imageUrls.trim() === '') {
                   // Empty string is not valid JSON
                   console.log(`ID ${row.id}: Empty string found in imageUrls`);
                   errorCount++;
                   continue;
                }
                JSON.parse(row.imageUrls);
            } catch (e) {
                console.log(`ID ${row.id}: Invalid JSON in imageUrls -> "${row.imageUrls}"`);
                errorCount++;
            }
        }
    }
    console.log('Total invalid JSON rows:', errorCount);

    // Check tables existence
    const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Existing tables:', tables.map(t => t.name).join(', '));

} catch (e) {
    console.error('Diagnostic failed:', e);
} finally {
    sqlite.close();
}
