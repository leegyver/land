import { storage } from './dist/index.js';

async function run() {
  console.log('--- Starting Production Image Migration (Bundled) ---');
  try {
    if (storage && typeof storage.migrateAllPropertyImages === 'function') {
      const result = await storage.migrateAllPropertyImages();
      console.log('SUCCESS: Migration Result:', JSON.stringify(result));
    } else {
      console.error('FAILURE: migrateAllPropertyImages function not found in dist package');
    }
    process.exit(0);
  } catch (err) {
    console.error('FAILURE: Migration failed:', err);
    process.exit(1);
  }
}

run();
