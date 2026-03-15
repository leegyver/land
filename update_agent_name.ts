import { storage } from "./server/storage";

async function updateAgentName() {
    console.log("Updating agentName field: '이가이버' -> '이가이버 공인중개사'...");
    try {
        // 1. Update Properties (strictly agentName)
        const allProperties = await storage.getAllProperties();
        let propertyUpdates = 0;
        for (const prop of allProperties) {
            if (prop.agentName === "이가이버") {
                await storage.updateProperty(prop.id, {
                    agentName: "이가이버 공인중개사"
                });
                propertyUpdates++;
                console.log(`Updated Property ID ${prop.id}: agentName updated.`);
            }
        }
        console.log(`Updated ${propertyUpdates} properties.`);

        // 2. Update Users (strictly realtorName)
        const allUsers = await storage.getAllUsers();
        let userUpdates = 0;
        for (const user of allUsers) {
            if (user.realtorName === "이가이버") {
                await storage.updateUser(user.id, {
                    realtorName: "이가이버 공인중개사"
                });
                userUpdates++;
                console.log(`Updated User ${user.username}: realtorName updated.`);
            }
        }
        console.log(`Updated ${userUpdates} users.`);

        process.exit(0);
    } catch (err) {
        console.error("Agent name update failed:", err);
        process.exit(1);
    }
}

updateAgentName();
