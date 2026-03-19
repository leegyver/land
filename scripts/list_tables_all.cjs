const sqlite3 = require('better-sqlite3');
const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.endsWith('.sqlite'));

files.forEach(file => {
    try {
        const db = new sqlite3(file);
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        console.log(`[${file}] Tables: ${tables.map(t => t.name).join(', ')}`);
        db.close();
    } catch(e) {
        console.log(`[${file}] Error: ${e.message}`);
    }
});
