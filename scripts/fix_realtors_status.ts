import Database from 'better-sqlite3';

const dbPath = '/root/land/database.sqlite';
const db = new Database(dbPath);

console.log('--- REPAIRING STUCK REALTORS ---');
const affectedUsers = db.prepare("SELECT id, username FROM users WHERE role = 'realtor' AND businessLicenseStatus != 'approved'").all() as any[];

console.log(`Found ${affectedUsers.length} users stuck in pending status. Fixing...`);

const stmt = db.prepare("UPDATE users SET businessLicenseStatus = 'approved' WHERE role = 'realtor' AND businessLicenseStatus != 'approved'");
const info = stmt.run();

console.log(`Successfully fixed ${info.changes} users.`);

db.close();
