import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import * as schema from '@shared/schema';

// SQLite 데이터베이스 파일 경로 설정 (e:\server\homepage\database.sqlite)
const dbPath = path.join(process.cwd(), 'database.sqlite');

console.log(`[DB] Connecting to SQLite at: ${dbPath} (Bridging to modern UI)`);

export const sqlite = new Database(dbPath, {
  verbose: console.log
});

export const db = drizzle(sqlite, { schema });

// 세션 등을 위한 원시 풀 시뮬레이션 (필요시)
export const pool = sqlite; 