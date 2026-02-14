import Database from 'better-sqlite3';
const db = new Database('database.sqlite');
console.log('--- ALL PROPERTIES ---');
const props = db.prepare('SELECT id, title, district FROM properties').all();
console.log(`Count: ${props.length}`);
props.slice(0, 10).forEach(p => console.log(`  [${p.id}] ${p.title} (${p.district})`));
if (props.length > 50) {
    console.log('  ...');
    props.slice(-10).forEach(p => console.log(`  [${p.id}] ${p.title} (${p.district})`));
}

console.log('\n--- ALL CRAWLED PROPERTIES ---');
const crawled = db.prepare('SELECT id, atclNo, atclNm FROM crawled_properties').all();
console.log(`Count: ${crawled.length}`);
crawled.slice(0, 10).forEach(p => console.log(`  [${p.id}] ${p.atclNo} ${p.atclNm}`));
db.close();
