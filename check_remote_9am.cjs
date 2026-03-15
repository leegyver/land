const Database = require('better-sqlite3');

const files = [
    'database.sqlite_final_bak.sqlite',
    'database.sqlite_prebuild_bak.sqlite'
];

files.forEach(file => {
    try {
        const db = new Database(file);
        console.log(`--- Checking ${file} ---`);
        const result = db.prepare("SELECT count(*) as count FROM properties WHERE createdAt LIKE '2026-03-14%'").get();
        console.log(`Today's properties count: ${result.count}`);
        
        if (result.count > 0) {
            const latest = db.prepare("SELECT id, title, createdAt FROM properties WHERE createdAt LIKE '2026-03-14%' ORDER BY createdAt DESC LIMIT 5").all();
            latest.forEach(r => console.log(`  ID: ${r.id} | ${r.createdAt} | ${r.title}`));
        } else {
            console.log('No properties found from today in this file.');
            const overallLatest = db.prepare("SELECT id, title, createdAt FROM properties ORDER BY createdAt DESC LIMIT 3").all();
            console.log('Overall latest records:');
            overallLatest.forEach(r => console.log(`  ID: ${r.id} | ${r.createdAt} | ${r.title}`));
        }
        db.close();
    } catch (e) {
        console.log(`Error checking ${file}: ${e.message}`);
    }
});
