import { naverCrawler } from './server/services/naver-crawler';

async function testCrawler() {
    console.log("Starting Crawler Optimization Test...");

    // Test small area to see randomized sleep and UA rotation in action
    const testBounds = {
        minLat: 37.730,
        minLon: 126.470,
        maxLat: 37.740,
        maxLon: 126.480
    };

    console.log("Triggering single crawl...");
    const result = await naverCrawler.crawlSingle(testBounds);

    console.log("Crawl Result:", JSON.stringify(result, null, 2));

    if (result.message === "Abuse detected") {
        console.log("SUCCESS: Abuse detection and stopping logic verified.");
    } else if (result.success) {
        console.log(`SUCCESS: Crawl completed without being blocked. Saved ${result.count} items.`);
    } else {
        console.log("FAILED: Unexpected result.");
    }
}

testCrawler().catch(console.error);
