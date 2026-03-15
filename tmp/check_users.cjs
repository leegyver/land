const db = require("better-sqlite3")("/root/land/database.sqlite");
const rows = db.prepare("SELECT id, username, email, phone, role FROM users ORDER BY id").all();
console.log(JSON.stringify(rows, null, 2));
db.close();
