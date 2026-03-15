import { storage } from "./server/storage";

async function exhaustiveCheck() {
    try {
        console.log("--- Properties Check ---");
        const allProperties = await storage.getAllProperties();
        const oldNameProps = allProperties.filter(p => p.agentName === "이가이버");
        console.log(`Properties with exact '이가이버': ${oldNameProps.length}`);
        if (oldNameProps.length > 0) {
            console.log("IDs:", oldNameProps.map(p => p.id));
        }

        const partialNameProps = allProperties.filter(p => p.agentName?.includes("이가이버") && !p.agentName?.includes("공인중개사"));
        console.log(`Properties with '이가이버' but NOT '공인중개사': ${partialNameProps.length}`);
        if (partialNameProps.length > 0) {
            console.log("Values:", [...new Set(partialNameProps.map(p => p.agentName))]);
        }

        console.log("\n--- Users Check ---");
        const allUsers = await storage.getAllUsers();
        for (const u of allUsers) {
            if (u.realtorName?.includes("이가이버") || u.businessName?.includes("이가이버") || u.username.includes("이가이버")) {
                console.log(`User ID ${u.id}: username=${u.username}, realtorName=${u.realtorName}, businessName=${u.businessName}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

exhaustiveCheck();
