import { storage } from "./storage";

async function run() {
    console.log("Starting ownerId backfill on server...");
    try {
        const allProperties = await storage.getAllProperties();
        const allUsers = await storage.getAllUsers();

        const realtors = allUsers.filter(u => u.role === 'realtor' || u.role === 'admin');
        let updatedCount = 0;

        for (const prop of allProperties) {
            if (!prop.ownerId && prop.agentName) {
                const agentName = prop.agentName;
                const matchedRealtor = realtors.find(r =>
                    (r.realtorName && r.realtorName.includes(agentName)) ||
                    (r.businessName && r.businessName.includes(agentName)) ||
                    (r.username && r.username.includes(agentName)) ||
                    (agentName.includes(r.realtorName || '')) ||
                    (agentName.includes(r.businessName || '')) ||
                    (agentName.includes('이가이버') && r.username === 'leegyver')
                );

                if (matchedRealtor) {
                    await storage.updateProperty(prop.id, { ownerId: matchedRealtor.id });
                    updatedCount++;
                    console.log(`Updated Property ID ${prop.id}: matched agentName '${agentName}' to Realtor ID ${matchedRealtor.id}`);
                }
            }
        }

        console.log(`Finished ownerId backfill. Updated ${updatedCount} properties.`);
        process.exit(0);
    } catch (err) {
        console.error("Error running backfill", err);
        process.exit(1);
    }
}

run();
