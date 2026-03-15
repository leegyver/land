const Database = require("better-sqlite3");
const db = new Database("/root/land/database.sqlite");

// Add new columns to users table (if not exists)
const addCol = (table, col, type, def) => {
  try {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${col} ${type} ${def || ''}`).run();
    console.log(`  + ${table}.${col} added`);
  } catch(e) {
    if (e.message.includes('duplicate column')) console.log(`  = ${table}.${col} already exists`);
    else console.log(`  ! ${table}.${col} ERROR: ${e.message.slice(0,50)}`);
  }
};

console.log("=== Adding user columns ===");
addCol("users", "nickname", "TEXT");
addCol("users", "profileImage", "TEXT");
addCol("users", "birthDate", "TEXT");
addCol("users", "birthTime", "TEXT");
addCol("users", "isLunar", "INTEGER", "DEFAULT 0");
addCol("users", "businessName", "TEXT");
addCol("users", "businessLicenseNo", "TEXT");
addCol("users", "businessAddress", "TEXT");
addCol("users", "isVerified", "INTEGER", "DEFAULT 0");
addCol("users", "subscriptionTier", "TEXT", "DEFAULT 'free'");
addCol("users", "subscriptionExpiresAt", "TEXT");
addCol("users", "createdAt", "TEXT");

console.log("\n=== Recreating realtor_subscriptions table ===");
try {
  db.prepare("DROP TABLE IF EXISTS realtor_subscriptions").run();
  db.prepare(`CREATE TABLE realtor_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    planType TEXT NOT NULL,
    amount INTEGER NOT NULL,
    impUid TEXT,
    merchantUid TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    startDate TEXT,
    endDate TEXT,
    createdAt TEXT
  )`).run();
  console.log("  + realtor_subscriptions table created");
} catch(e) { console.log("  ! " + e.message.slice(0,80)); }

console.log("\n=== Final check ===");
const cols = db.prepare("PRAGMA table_info(users)").all();
console.log("Users columns:", cols.map(c => c.name).join(", "));

const subCols = db.prepare("PRAGMA table_info(realtor_subscriptions)").all();
console.log("Subscriptions columns:", subCols.map(c => c.name).join(", "));

db.close();
console.log("\n✅ DB migration complete!");
