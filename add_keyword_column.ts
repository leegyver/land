import 'dotenv/config';
import { db } from './server/db';

async function run() {
  try {
    db.exec(`ALTER TABLE visit_logs ADD COLUMN keyword TEXT`);
    console.log("Added keyword column to visit_logs");
  } catch (e) {
    console.log("Already exists or error:", (e as Error).message);
  }
}
run();
