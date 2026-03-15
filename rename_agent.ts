import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

console.log('--- Database Rename Operation: 이가이버 -> 이가이버 공인중개사 ---');

try {
    db.transaction(() => {
        // 1. Update users table
        const userUpdate = db.prepare("UPDATE users SET username = '이가이버 공인중개사' WHERE username = '이가이버'").run();
        console.log(`Updated ${userUpdate.changes} user(s) username.`);

        const realtorUpdate = db.prepare("UPDATE users SET realtorName = '이가이버 공인중개사' WHERE realtorName = '이가이버'").run();
        console.log(`Updated ${realtorUpdate.changes} user(s) realtorName.`);

        // 2. Update properties table
        const propertiesUpdate = db.prepare("UPDATE properties SET agentName = '이가이버 공인중개사' WHERE agentName = '이가이버'").run();
        console.log(`Updated ${propertiesUpdate.changes} property listing(s) agentName.`);

        // 3. Update agents table if it exists
        try {
            const agentsUpdate = db.prepare("UPDATE agents SET realtorName = '이가이버 공인중개사' WHERE realtorName = '이가이버'").run();
            console.log(`Updated ${agentsUpdate.changes} agent(s) info.`);
        } catch (e) {
            console.log('Agents table update skipped (might not exist).');
        }
    })();
    console.log('\n--- Rename operation completed successfully! ---');
} catch (error) {
    console.error('\n--- Rename operation failed! ---');
    console.error(error);
} finally {
    db.close();
}
