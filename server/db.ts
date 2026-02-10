import Database from 'better-sqlite3';
import path from 'path';

// SQLite 데이터베이스 파일 경로 설정
const dbPath = path.join(process.cwd(), 'database.sqlite');

// DB 연결 (파일이 없으면 생성됨)
console.log(`[DB] Connecting to SQLite at: ${dbPath}`);
export const db = new Database(dbPath, {
  verbose: console.log
});

// 프로세스 종료 시 DB 연결 해제
process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));