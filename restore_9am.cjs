const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

try {
    const morning9 = '2026-03-14T09:00:00.000Z';
    
    // Identified mandatory columns based on constraint failures and usual property schema
    const stmt = db.prepare(`
        INSERT INTO properties 
        (title, description, type, price, location, createdAt, updatedAt, isVisible, agentId, bathrooms, bedrooms) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const res1 = stmt.run(
        '9시 긴급 복구 매물 (이미지: 8:52)', 
        '오전 8:52 업로드 이미지 매물 복구 본',
        'sale',
        '상담', // price
        '강화군',
        morning9, 
        morning9,
        1,
        1, // agentId
        0, // bathrooms
        0  // bedrooms
    );
    console.log('Inserted property 1, ID:', res1.lastInsertRowid);

    const res2 = stmt.run(
        '9시 긴급 복구 매물 (이미지: 9:04)', 
        '오전 9:04 업로드 이미지 매물 복구 본',
        'sale',
        '상담', // price
        '강화군',
        morning9, 
        morning9,
        1,
        1, // agentId
        0, // bathrooms
        0  // bedrooms
    );
    console.log('Inserted property 2, ID:', res2.lastInsertRowid);

    console.log('--- Final Restoration Check ---');
    const rows = db.prepare("SELECT id, title, createdAt FROM properties WHERE createdAt LIKE '2026-03-14%'").all();
    console.log('Found:', rows.length);
    rows.forEach(r => console.log(`  ID: ${r.id} | ${r.title}`));

} catch (e) {
    console.error('Error during restoration:', e);
} finally {
    db.close();
}
