const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
    const configs = db.prepare('SELECT * FROM site_configs').all();
    console.log('Site Configs:', JSON.stringify(configs, null, 2));
} catch (e) {
    console.log('Error or table does not exist:', e.message);
}
