const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

try {
    const now = '2026-03-18 18:30:00';
    
    // 1. Insert Notice
    db.prepare(`INSERT OR REPLACE INTO notices (id, title, content, isPinned, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`).run(
        1,
        '[공지] 이가이버부동산 홈페이지 오픈 안내',
        '안녕하세요. 이가이버부동산입니다. 더 나은 서비스를 위해 홈페이지를 오픈하였습니다. 많은 이용 부탁드립니다.',
        1,
        now,
        now
    );

    // 2. Insert Posts
    const posts = [
        { id: 1, title: '강화도 전원주택 매물 문의드립니다', content: '강화도 쪽에 조용한 전원주택 매물을 찾고 있습니다. 추천 부탁드려요.', authorId: 1, authorName: '강화사랑' },
        { id: 2, title: '안녕하세요! 가입했습니다.', content: '좋은 매물 정보 많이 부탁드릴게요. 반갑습니다!', authorId: 2, authorName: '꿈꾸는집' },
        { id: 3, title: '매물 등록 문의드려요', content: '제 땅을 매물로 등록하고 싶은데 절차가 어떻게 되나요?', authorId: 1, authorName: '토지주인' }
    ];

    for (const p of posts) {
        db.prepare(`INSERT OR REPLACE INTO posts (id, title, content, authorId, authorName, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
            p.id, p.title, p.content, p.authorId, p.authorName, now, now
        );
    }

    console.log('--- Manual Data Injection Complete ---');
    console.log('Notices inserted: 1');
    console.log('Posts inserted: 3');

} catch (err) {
    console.error('Data Injection Error:', err.message);
} finally {
    db.close();
}
