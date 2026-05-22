const Database = require('better-sqlite3');
const db = new Database('database.sqlite');
const rows = db.prepare("SELECT title, price, deposit, depositAmount, monthlyRent, dealType FROM properties WHERE title LIKE '%관청리%여고%'").all();
console.log(JSON.stringify(rows, null, 2));
db.close();
