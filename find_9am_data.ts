import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const files = [
  'database.sqlite',
  'database.sqlite_final_bak.sqlite',
  'database.sqlite_prebuild_bak.sqlite',
  'database.db',
  'replit_db.sqlite'
];

console.log(`Current Time: ${new Date().toISOString()}`);
console.log(`Target Recovery: 2026-03-14 09:00:00 (Local)\n`);

for (const file of files) {
  if (!fs.existsSync(file)) continue;

  const stats = fs.statSync(file);
  console.log(`--- Analyzing ${file} ---`);
  console.log(`Last Modified: ${stats.mtime.toISOString()}`);
  console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  try {
    const db = new Database(file);
    
    // Check properties created today
    const propsToday = db.prepare(`
      SELECT count(*) as count 
      FROM properties 
      WHERE createdAt LIKE '2026-03-14%'
    `).get().count;

    // Check properties updated today
    const propsUpdatedToday = db.prepare(`
      SELECT count(*) as count 
      FROM properties 
      WHERE updatedAt LIKE '2026-03-14%'
    `).get().count;

    // Check records specifically near 9:00 AM
    const propsNear9 = db.prepare(`
      SELECT count(*) as count 
      FROM properties 
      WHERE createdAt >= '2026-03-14T08:00:00' AND createdAt <= '2026-03-14T10:00:00'
    `).get().count;

    console.log(`Properties Created Today: ${propsToday}`);
    console.log(`Properties Updated Today: ${propsUpdatedToday}`);
    console.log(`Properties near 9:00 AM: ${propsNear9}`);

    if (propsToday > 0 || propsNear9 > 0) {
      const sample = db.prepare(`
        SELECT id, title, createdAt 
        FROM properties 
        WHERE createdAt LIKE '2026-03-14%' 
        ORDER BY createdAt DESC LIMIT 3
      `).all();
      console.log('Sample Data from Today:', sample);
    }

    db.close();
  } catch (e) {
    console.log(`Error reading ${file}: ${e.message}`);
  }
  console.log('\n');
}
