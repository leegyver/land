import { storage } from "./storage";
async function run() {
    const users = await storage.getAllUsers();
    console.log("Users:", users.map(u => ({ id: u.id, username: u.username, role: u.role, businessName: u.businessName, realtorName: u.realtorName })));
    const props = await storage.getAllProperties();
    console.log("No owner props:", props.filter(p => !p.ownerId).map(p => ({ id: p.id, agentName: p.agentName })).slice(0, 10));
}
run();
