const { db } = require('./server/db');
const { crawledProperties } = require('./shared/schema');

async function check() {
    try {
        const res = await db.select().from(crawledProperties);
        const target = res.find(p => p.atclNm && p.atclNm.includes('여고근처 1층매'));
        console.log(JSON.stringify(target, null, 2));
    } catch (e) {
        console.error(e);
    }
}
check();
