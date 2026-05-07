const Database = require('better-sqlite3');
const db = new Database('database.sqlite');
try {
  const users = db.prepare("SELECT id, username, nickname, provider, providerId FROM users WHERE provider IS NOT NULL").all();
  console.log("Social Login Users:");
  console.log(JSON.stringify(users, null, 2));
} catch (err) {
  console.error("Error querying users:", err.message);
} finally {
  db.close();
}
