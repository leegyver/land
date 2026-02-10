
import { db } from "./db";

console.log("Checking DB counts...");

try {
    const result = db.prepare("SELECT COUNT(*) as count FROM properties").get() as { count: number };
    console.log(`Total properties: ${result.count}`);

    const urgent = db.prepare("SELECT COUNT(*) as count FROM properties WHERE isUrgent = 1").get() as { count: number };
    console.log(`Urgent properties: ${urgent.count}`);

    const negotiable = db.prepare("SELECT COUNT(*) as count FROM properties WHERE isNegotiable = 1").get() as { count: number };
    console.log(`Negotiable properties: ${negotiable.count}`);

} catch (error) {
    console.error("Error checking DB:", error);
}
