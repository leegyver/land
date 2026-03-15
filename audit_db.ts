import Database from 'better-sqlite3';

function audit() {
    const db = new Database('database.sqlite');
    
    console.log('--- Database Audit (Crawled Properties) ---');
    try {
        const latest: any[] = db.prepare("SELECT atclNo, atclNm, crawledAt FROM crawled_properties ORDER BY crawledAt DESC LIMIT 10").all();
        latest.forEach(p => {
            console.log(`AtclNo: ${p.atclNo} | ${p.crawledAt} | ${p.atclNm}`);
        });
    } catch (e: any) {
        console.log('Error fetching latest crawled properties:', e.message);
    }
    db.close();
}

audit();
