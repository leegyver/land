const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

try {
    const morning9 = '2026-03-14T09:00:00.000Z';
    
    // Schema-accurate insertion based on NOT NULL audit and previous 'location' error
    // Re-checking schema: it likely uses 'address' or similar if 'location' is missing
    const stmt = db.prepare(`
        INSERT INTO properties 
        (title, description, type, price, address, createdAt, updatedAt, isVisible) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const res1 = stmt.run(
        '9시 긴급 복구 매물 (이미지: 8:52)', 
        '오전 8:52 업로드 이미지 매물 복구 본',
        'sale',
        '상담환영',
        '강화군', // using 'address' column instead of 'location'
        morning9, 
        morning9,
        1
    );
    console.log('Inserted property 1, ID:', res1.lastInsertRowid);

    const res2 = stmt.run(
        '9시 긴급 복구 매물 (이미지: 9:04)', 
        '오전 9:04 업로드 이미지 매물 복구 본',
        'sale',
        '상담환영',
        '강화군', 
        morning9, 
        morning9,
        1
    );
    console.log('Inserted property 2, ID:', res2.lastInsertRowid);

    console.log('--- Final Restoration SUCCESS ---');
    const rows = db.prepare("SELECT id, title, createdAt FROM properties WHERE createdAt LIKE '2026-03-14%'").all();
    console.log('Confirmed properties from today:', rows.length);
    rows.forEach(r => console.log(`  ID: ${r.id} | ${r.title}`));

} catch (e) {
    console.error('Final Restoration Failed:', e.message);
} finally {
    db.close();
}
