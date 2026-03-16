const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath, { verbose: console.log });

/**
 * Adds a column to a table if it doesn't already exist.
 */
function addColumnIfNotExists(tableName, columnName, columnType, defaultValue = null) {
  const info = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const exists = info.some(col => col.name === columnName);
  
  if (!exists) {
    console.log(`[Migration] Adding column ${columnName} to table ${tableName}...`);
    let query = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`;
    if (defaultValue !== null) {
      query += ` DEFAULT ${defaultValue}`;
    }
    db.prepare(query).run();
    console.log(`[Migration] Column ${columnName} added successfully.`);
  } else {
    console.log(`[Migration] Column ${columnName} already exists in table ${tableName}.`);
  }
}

try {
  console.log('[Migration] Starting database schema sync...');
  
  // 1. Check/Add columns to users table
  addColumnIfNotExists('users', 'nickname', 'TEXT');
  addColumnIfNotExists('users', 'profileImage', 'TEXT');
  addColumnIfNotExists('users', 'isVerified', 'INTEGER', '0');
  
  // 2. Check/Add columns to newsletter_subscriptions table
  addColumnIfNotExists('newsletter_subscriptions', 'name', 'TEXT');
  addColumnIfNotExists('newsletter_subscriptions', 'isActive', 'INTEGER', '1');
  
  console.log('[Migration] Database schema sync completed successfully.');
} catch (err) {
  console.error('[Migration] Error during schema sync:', err);
  process.exit(1);
} finally {
  db.close();
}
