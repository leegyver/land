
import { db } from "./server/db";

async function migrate() {
    console.log("Starting migration...");

    try {
        // Add isUrgent column
        try {
            db.prepare("ALTER TABLE properties ADD COLUMN isUrgent INTEGER DEFAULT 0").run();
            console.log("Added isUrgent column");
        } catch (e: any) {
            if (!e.message.includes("duplicate column name")) console.error(e.message);
        }

        // Add isNegotiable column
        try {
            db.prepare("ALTER TABLE properties ADD COLUMN isNegotiable INTEGER DEFAULT 0").run();
            console.log("Added isNegotiable column");
        } catch (e: any) {
            if (!e.message.includes("duplicate column name")) console.error(e.message);
        }

        // Add urgentOrder column
        try {
            db.prepare("ALTER TABLE properties ADD COLUMN urgentOrder INTEGER DEFAULT 0").run();
            console.log("Added urgentOrder column");
        } catch (e: any) {
            if (!e.message.includes("duplicate column name")) console.error(e.message);
        }

        // Add negotiableOrder column
        try {
            db.prepare("ALTER TABLE properties ADD COLUMN negotiableOrder INTEGER DEFAULT 0").run();
            console.log("Added negotiableOrder column");
        } catch (e: any) {
            if (!e.message.includes("duplicate column name")) console.error(e.message);
        }

        // Create banners table (storage.ts handles this usually, but force it here)
        db.prepare(`
      CREATE TABLE IF NOT EXISTS banners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location TEXT NOT NULL, 
        imageUrl TEXT NOT NULL,
        linkUrl TEXT,
        openNewWindow INTEGER DEFAULT 0,
        displayOrder INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
        console.log("Ensured banners table exists");

        console.log("Migration complete.");
    } catch (error) {
        console.error("Migration failed:", error);
    }
}

migrate();
