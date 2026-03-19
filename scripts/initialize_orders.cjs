const Database = require('better-sqlite3');
const path = require('path');

// 환경에 따라 DB 경로 조정
const dbPath = process.env.DB_PATH || path.resolve('database.sqlite');
console.log('Initializing orders in database at:', dbPath);

const db = new Database(dbPath);

try {
  db.pragma('journal_mode = WAL');

  const initializeCategoryOrder = (orderField, conditionField) => {
    console.log(`\n--- Initializing ${orderField} for ${conditionField} ---`);
    const items = db.prepare(`SELECT id FROM properties WHERE ${conditionField} = 1 ORDER BY id DESC`).all();
    
    const updateStmt = db.prepare(`UPDATE properties SET ${orderField} = ? WHERE id = ?`);
    
    db.transaction(() => {
      items.forEach((item, index) => {
        updateStmt.run(index, item.id);
      });
    })();
    
    console.log(`Updated ${items.length} items for ${conditionField}.`);
  };

  // 1. 일반 노출 순서 초기화 (displayOrder) - 기존 값이 0인 것들만 처리하거나 전체 재정렬
  initializeCategoryOrder('displayOrder', 'isVisible');
  
  // 2. 특수 카테고리 순서 초기화
  initializeCategoryOrder('urgentOrder', 'isUrgent');
  initializeCategoryOrder('negotiableOrder', 'isNegotiable');
  initializeCategoryOrder('longTermOrder', 'isLongTerm');
  
  // 3. 추천 매물 순서는 displayOrder를 따르므로 별도 처리 불필요 (필요시 추가 가능)

  console.log('\nOrdering initialization completed successfully.');

} catch (err) {
  console.error('Error during initialization:', err);
  process.exit(1);
} finally {
  db.close();
}
