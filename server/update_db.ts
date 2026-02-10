
import { db } from "./db";

console.log("Updating DB with mock data...");

try {
    // Set 4 properties as Urgent
    db.prepare("UPDATE properties SET isUrgent = 1 WHERE id IN (SELECT id FROM properties ORDER BY RANDOM() LIMIT 4)").run();

    // Set 4 properties as Negotiable
    db.prepare("UPDATE properties SET isNegotiable = 1 WHERE id IN (SELECT id FROM properties ORDER BY RANDOM() LIMIT 4)").run();

    const urgent = db.prepare("SELECT COUNT(*) as count FROM properties WHERE isUrgent = 1").get() as { count: number };
    console.log(`Urgent properties now: ${urgent.count}`);

    const negotiable = db.prepare("SELECT COUNT(*) as count FROM properties WHERE isNegotiable = 1").get() as { count: number };
    console.log(`Negotiable properties now: ${negotiable.count}`);

} catch (error) {
    console.error("Error updating DB:", error);
}
