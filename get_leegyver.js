const Database = require('better-sqlite3');
const db = new Database('database.sqlite');
const user = db.prepare('SELECT username, businessName, realtorName, realtorPhone, realtorPhoto, realtorAddress, realtorLicenseNo from users WHERE username = ?').get('leegyver');
console.log(JSON.stringify(user));
