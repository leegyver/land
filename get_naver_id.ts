
import { storage } from "./server/storage";

async function main() {
    try {
        const props = await storage.getCrawledProperties();
        if (props.length > 0) {
            console.log("Found Naver Property ID:", props[0].atclNo);
            console.log("Test URL: /properties/naver-" + props[0].atclNo);
        } else {
            console.log("No Naver properties found in DB.");
        }
    } catch (e) {
        console.error(e);
    }
}

main();
