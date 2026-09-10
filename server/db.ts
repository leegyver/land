import Database from 'better-sqlite3';
import path from 'path';

// SQLite 데이터베이스 파일 경로 설정
const dbPath = path.join(process.cwd(), 'database.sqlite');

// DB 연결 (파일이 없으면 생성됨)
console.log(`[DB] Connecting to SQLite at: ${dbPath}`);
export const db = new Database(dbPath, {
  verbose: console.log
});

// 동시성 및 쓰기 성능 향상을 위한 WAL 모드 활성화 (서버 속도 최적화 3단계)
db.pragma('journal_mode = WAL');

// 성능 최적화를 위한 인덱스 생성
try {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_visit_logs_created_at ON visit_logs(createdAt);
    CREATE INDEX IF NOT EXISTS idx_visit_logs_path ON visit_logs(path);
    CREATE INDEX IF NOT EXISTS idx_visit_logs_ip ON visit_logs(ip);
    CREATE INDEX IF NOT EXISTS idx_visit_logs_keyword ON visit_logs(keyword);
    CREATE INDEX IF NOT EXISTS idx_visit_logs_created_at_ip ON visit_logs(createdAt, ip);
    CREATE INDEX IF NOT EXISTS idx_visit_logs_created_at_path ON visit_logs(createdAt, path);
    CREATE INDEX IF NOT EXISTS idx_properties_is_visible ON properties(isVisible);
    CREATE INDEX IF NOT EXISTS idx_properties_display_order ON properties(displayOrder);
    CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(createdAt);
    CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(createdAt);
  `);
} catch (e) {
  console.warn('[DB] Index creation warning:', e);
}

// 프로세스 종료 시 DB 연결 해제
process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));