
const Database = require('/root/land/node_modules/better-sqlite3');
const db = new Database('/root/land/database.sqlite');

try {
    const tableInfo = db.prepare("PRAGMA table_info(newsletter_subscriptions)").all();
    console.log("TABLE_INFO_START");
    console.log(JSON.stringify(tableInfo));
    console.log("TABLE_INFO_END");
    
    const ddl = db.prepare("SELECT sql FROM sqlite_master WHERE name='newsletter_subscriptions'").get();
    console.log("DDL_START");
    console.log(ddl ? ddl.sql : "NOT FOUND");
    console.log("DDL_END");
} catch (err) {
    console.error("DEBUG_ERROR:", err.message);
} finally {
    db.close();
}
