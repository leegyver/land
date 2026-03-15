import Database from 'better-sqlite3';
import fs from 'fs';

const dbFiles = [
    'database.sqlite',
    'database.sqlite_final_bak.sqlite',
    'database.sqlite_prebuild_bak.sqlite'
];

for (const file of dbFiles) {
    if (!fs.existsSync(file)) {
        console.log(`\n--- File ${file} does not exist ---`);
        continue;
    }
    
    console.log(`\n--- Analyzing ${file} ---`);
    const db = new Database(file);
    try {
        const usersCount = db.prepare("SELECT count(*) as count FROM users").get().count;
        const propertiesCount = db.prepare("SELECT count(*) as count FROM properties").get().count;
        const agentsCount = db.prepare("SELECT count(*) as count FROM agents").get().count;
        
        console.log(`Users: ${usersCount}`);
        console.log(`Properties: ${propertiesCount}`);
        console.log(`Agents: ${agentsCount}`);
        
        if (usersCount > 0) {
            console.log('Sample User Roles:', db.prepare("SELECT username, role FROM users LIMIT 5").all());
        }
        
        if (propertiesCount > 0) {
           console.log('Latest Property:', db.prepare("SELECT id, title, createdAt FROM properties ORDER BY id DESC LIMIT 1").get());
        }

    } catch (e) {
        console.log(`Error analyzing ${file}:`, e.message);
    } finally {
        db.close();
    }
}
