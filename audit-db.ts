import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

console.log('--- Database Audit ---');
const propCount = db.prepare('SELECT count(*) as count FROM properties').get().count;
const crawledCount = db.prepare('SELECT count(*) as count FROM crawled_properties').get().count;

console.log(`Internal Properties: ${propCount}`);
console.log(`Crawled Properties: ${crawledCount}`);

if (propCount > 100) {
    console.log('\nWarning: Unexpectedly high number of internal properties.');
    const samples = db.prepare("SELECT id, title, district FROM properties WHERE district = '수집매물' OR title LIKE '%naver%' LIMIT 5").all();
    if (samples.length > 0) {
        console.log('Detected leaked Naver properties in the properties table:');
        console.log(JSON.stringify(samples, null, 2));
    }
}

db.close();
