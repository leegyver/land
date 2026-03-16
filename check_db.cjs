const Database = require('better-sqlite3');
const db = new Database('database.sqlite');
console.log("--- users table ---");
console.log(JSON.stringify(db.prepare("PRAGMA table_info(users)").all(), null, 2));
console.log("\n--- newsletter_subscriptions table ---");
console.log(JSON.stringify(db.prepare("PRAGMA table_info(newsletter_subscriptions)").all(), null, 2));
db.close();

