import { storage } from "./server/storage";

async function rebrand() {
    console.log("Starting full database rebranding...");
    try {
        // 1. Update Users
        const allUsers = await storage.getAllUsers();
        let userUpdates = 0;
        for (const user of allUsers) {
            let updated = false;
            const newRealtorName = user.realtorName?.replace(/이가이버(?! 공인중개사)/g, "이가이버 공인중개사");
            const newBusinessName = user.businessName?.replace(/이가이버(?! 공인중개사)/g, "이가이버 공인중개사");

            if (newRealtorName !== user.realtorName || newBusinessName !== user.businessName) {
                await storage.updateUser(user.id, {
                    realtorName: newRealtorName,
                    businessName: newBusinessName
                });
                updated = true;
                userUpdates++;
                console.log(`Updated user ${user.username}: Name rebranded.`);
            }
        }
        console.log(`Updated ${userUpdates} users.`);

        // 2. Update Properties
        const allProperties = await storage.getAllProperties();
        let propertyUpdates = 0;
        for (const prop of allProperties) {
            let updated = false;
            const updates: any = {};

            const newAgentName = prop.agentName?.replace(/이가이버(?! 공인중개사)/g, "이가이버 공인중개사");
            if (newAgentName !== prop.agentName) {
                updates.agentName = newAgentName;
                updated = true;
            }

            const newDescription = prop.description?.replace(/이가이버(?! 공인중개사)/g, "이가이버 공인중개사");
            if (newDescription !== prop.description) {
                updates.description = newDescription;
                updated = true;
            }

            const newPropDesc = prop.propertyDescription?.replace(/이가이버(?! 공인중개사)/g, "이가이버 공인중개사");
            if (newPropDesc !== prop.propertyDescription) {
                updates.propertyDescription = newPropDesc;
                updated = true;
            }

            if (updated) {
                await storage.updateProperty(prop.id, updates);
                propertyUpdates++;
                console.log(`Updated property ID ${prop.id}: Names rebranded.`);
            }
        }
        console.log(`Updated ${propertyUpdates} properties.`);

        process.exit(0);
    } catch (err) {
        console.error("Rebranding failed:", err);
        process.exit(1);
    }
}

rebrand();
