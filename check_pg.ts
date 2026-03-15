import { storage } from "./server/storage";

async function check() {
    try {
        const users = await storage.getAllUsers();
        console.log("USERS (first 5):");
        users.slice(0, 5).forEach(u => console.log(`ID: ${u.id}, name: ${u.username}, realtorName: ${u.realtorName}, businessName: ${u.businessName}`));

        const props = await storage.getAllProperties();
        console.log("\nPROPERTIES (first 10):");
        props.slice(0, 10).forEach(p => console.log(`ID: ${p.id}, agentName: ${p.agentName}, desc: ${p.description?.substring(0, 30)}...`));
        
        // Find properties with "이가이버 공인중개사"
        const brokenProps = props.filter(p => p.agentName?.includes('이가이버') || p.description?.includes('이가이버'));
        console.log(`\nFound ${brokenProps.length} properties with '이가이버'.`);
        brokenProps.slice(0, 5).forEach(p => console.log(`ID: ${p.id}, agentName: ${p.agentName}, desc: ${p.description?.substring(0, 30)}...`));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
