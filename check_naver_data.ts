import { storage } from './server/storage';

async function check() {
    const props = await storage.listCrawledProperties();
    console.log("Total Naver Properties:", props.length);
    if (props.length > 0) {
        console.log("Sample Naver Property:", JSON.stringify(props[0], null, 2));
    }
}

check().catch(console.error);
