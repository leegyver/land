import Database from 'better-sqlite3';

const db = new Database('./database.sqlite');

function addColumn(table: string, column: string, type: string, defaultValue?: string) {
  try {
    const defaultClause = defaultValue !== undefined ? ` DEFAULT ${defaultValue}` : '';
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}${defaultClause}`);
    console.log(`[PASS] ${table}.${column} added.`);
  } catch (e: any) {
    if (e.message.includes('duplicate column name')) {
      console.log(`[SKIP] ${table}.${column} already exists.`);
    } else {
      console.log(`[FAIL] ${table}.${column}: ${e.message}`);
    }
  }
}

// 1. Users Table Columns
console.log('Patching Users Table...');
addColumn('users', 'businessLicenseNo', 'TEXT');
addColumn('users', 'businessAddress', 'TEXT');
addColumn('users', 'subscriptionTier', "TEXT", "'free'");
addColumn('users', 'subscriptionExpiresAt', 'TEXT');
addColumn('users', 'isVerified', 'INTEGER', '0');
addColumn('users', 'nickname', 'TEXT');
addColumn('users', 'profileImage', 'TEXT');
addColumn('users', 'birthDate', 'TEXT');
addColumn('users', 'birthTime', 'TEXT');
addColumn('users', 'isLunar', 'INTEGER', '0');
addColumn('users', 'businessName', 'TEXT');

// 2. Banners Table Columns
console.log('Patching Banners Table...');
addColumn('banners', 'isActive', 'INTEGER', '1');
addColumn('banners', 'openNewWindow', 'INTEGER', '0');
addColumn('banners', 'displayOrder', 'INTEGER', '0');
addColumn('banners', 'createdAt', 'TEXT');

// 3. Properties Table Columns
console.log('Patching Properties Table...');
addColumn('properties', 'isActive', 'INTEGER', '1');

// 4. Users Table Columns
console.log('Patching Users Table (isActive)...');
addColumn('users', 'isActive', 'INTEGER', '1');

// 5. Properties Table Fix
console.log('Fixing Properties Table Data...');
try {
  db.exec("UPDATE properties SET description = '' WHERE description IS NULL");
  console.log('[PASS] properties.description NULL values cleared.');
} catch (e: any) {
  console.log(`[FAIL] properties fix: ${e.message}`);
}

console.log('Database patch complete.');
db.close();
