import { storage } from "./server/storage";
import fs from "fs";

async function check() {
    try {
        let out = "";
        
        const props = await storage.getAllProperties();
        out += "\nPROPERTIES:\n";
        
        // Find properties where description or propertyDescription contains '이가이버 공인중개사'
        const brokenProps = props.filter(p => p.description?.includes('이가이버 공인중개사') || p.propertyDescription?.includes('이가이버 공인중개사') );
        out += `\nFound ${brokenProps.length} properties with '이가이버 공인중개사' in descriptions.\n`;
        brokenProps.slice(0, 10).forEach(p => out += `ID: ${p.id}, agentName: ${p.agentName}, desc: ${p.description?.substring(0, 50)}..., propDesc: ${p.propertyDescription?.substring(0, 50)}...\n`);
        
        fs.writeFileSync("db_output_utf8.txt", out, "utf8");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
