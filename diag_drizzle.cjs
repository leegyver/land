const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Check actual DB columns vs expected schema columns
const propCols = db.prepare("PRAGMA table_info(properties)").all();
console.log('=== PROPERTIES COLUMNS ===');
propCols.forEach(c => console.log(`  ${c.name} (${c.type})`));

const agentCols = db.prepare("PRAGMA table_info(agents)").all();
console.log('=== AGENTS COLUMNS ===');
agentCols.forEach(c => console.log(`  ${c.name} (${c.type})`));

// Try drizzle
try {
  const { drizzle } = require('drizzle-orm/better-sqlite3');
  const drizzleDb = drizzle(db);
  console.log('=== DRIZZLE OK ===');
  
  // Try a simple raw query through drizzle
  const result = drizzleDb.all(require('drizzle-orm').sql`SELECT id, title FROM properties LIMIT 2`);
  console.log('DRIZZLE RESULT:', result);
} catch(e) {
  console.log('DRIZZLE ERROR:', e.message);
  console.log('STACK:', e.stack);
}

db.close();
