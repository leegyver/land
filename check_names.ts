import { storage } from "./server/storage";

async function check() {
    try {
        const allProperties = await storage.getAllProperties();
        const leegyverProp = allProperties.find(p => p.agentName?.includes("이가이버"));
        console.log("Sample Property AgentName:", leegyverProp?.agentName);

        const allUsers = await storage.getAllUsers();
        const admin = allUsers.find(u => u.username === "leegyver" || u.role === "admin");
        console.log(`Admin User -> RealtorName: ${admin?.realtorName}, BusinessName: ${admin?.businessName}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
