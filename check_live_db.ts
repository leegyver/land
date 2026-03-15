import { storage } from "./server/storage";

async function run() {
    try {
        const props = await storage.getAllProperties();
        const agentNames = [...new Set(props.map(p => p.agentName))];
        console.log("=== UNIQUE AGENT NAMES IN PROD ===");
        console.log(JSON.stringify(agentNames, null, 2));

        const users = await storage.getAllUsers();
        console.log("\n=== USERS IN PROD ===");
        users.forEach(u => {
            console.log(`User: ${u.username}`);
            console.log(`  realtorName: ${u.realtorName}`);
            console.log(`  businessName: ${u.businessName}`);
        });

        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}
run();
