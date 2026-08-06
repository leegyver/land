import 'dotenv/config';
import { db } from './server/db';
import Database from 'better-sqlite3';

async function run() {
  const sqlite = new Database('data/sqlite.db'); // E:\server\homepage\data\sqlite.db
  try {
    sqlite.prepare(`ALTER TABLE news ADD COLUMN viewCount INTEGER DEFAULT 0`).run();
    console.log("Added viewCount to news");
  } catch (e) {
    console.log("Already exists or error:", e);
  }
}
run();
