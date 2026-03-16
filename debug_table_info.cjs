
const { sqlite } = require('./server/db');

function checkTable() {
  try {
    const tableInfo = sqlite.prepare("PRAGMA table_info(newsletter_subscriptions)").all();
    console.log("newsletter_subscriptions Table Info:");
    console.table(tableInfo);
    
    // Check if it exists at all
    const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='newsletter_subscriptions'").all();
    console.log("Table check:", tables);
    
  } catch (err) {
    console.error("Error checking table:", err);
  }
}

checkTable();
