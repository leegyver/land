import { db } from './server/db';

async function runDiagnostics() {
    console.log('--- Internal Properties (properties table) ---');
    try {
        const internal = db.prepare('SELECT id, title, price, deposit, depositAmount, monthlyRent, dealType FROM properties WHERE isVisible = 1 LIMIT 20').all();
        console.log('ID | Title | Price | Deposit | DepositAmt | Monthly | DealType');
        internal.forEach((p: any) => {
            console.log(`${p.id} | ${p.title} | ${p.price} | ${p.deposit} | ${p.depositAmount} | ${p.monthlyRent} | ${p.dealType}`);
        });
    } catch (e) {
        console.error('Error querying properties:', e.message);
    }

    console.log('\n--- Crawled Properties (crawled_properties table) ---');
    try {
        const crawled = db.prepare('SELECT atclNo, atclNm, prc, rentPrc, depositPrc, tradTpNm FROM crawled_properties LIMIT 20').all();
        console.log('AtclNo | Title | Prc | RentPrc | DepositPrc | TradTpNm');
        crawled.forEach((p: any) => {
            console.log(`${p.atclNo} | ${p.atclNm} | ${p.prc} | ${p.rentPrc} | ${p.depositPrc} | ${p.tradTpNm}`);
        });
    } catch (e) {
        console.error('Error querying crawled_properties:', e.message);
    }
}

runDiagnostics();
