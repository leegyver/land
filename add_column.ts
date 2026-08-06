import 'dotenv/config';
import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    db.run(sql`ALTER TABLE news ADD COLUMN viewCount INTEGER DEFAULT 0`);
    console.log("Added viewCount to news");
  } catch (e) {
    console.log("Already exists or error:", e);
  }
}
run();
