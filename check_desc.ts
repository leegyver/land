import { storage } from "./server/storage";
import fs from "fs";

async function check() {
    try {
        let out = "";
        const props = await storage.getAllProperties();
        
        // Find properties where description or propertyDescription contains '이가이버 ' or '이가이버'
        const brokenProps = props.filter(p => p.description?.includes('이가이버') || p.propertyDescription?.includes('이가이버'));
        out += `Found ${brokenProps.length} properties with '이가이버' in descriptions.\n`;
        brokenProps.slice(0, 10).forEach(p => out += `ID: ${p.id}, desc: ${p.description?.substring(0, 100).replace(/\n/g, ' ')}\npropDesc: ${p.propertyDescription?.substring(0, 100).replace(/\n/g, ' ')}\n\n`);
        
        fs.writeFileSync("db_output_desc.txt", out, "utf8");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
