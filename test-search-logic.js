
const testKeywords = [
    "강화읍 토지",
    "길상면 주택",
    "불은면 아파트",
    "급매물 강화읍",
    "화도면 펜션"
];

async function testSearch(keyword) {
    const url = `http://localhost:5000/api/search?keyword=${encodeURIComponent(keyword)}&includeCrawled=false`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log(`Keyword: "${keyword}" -> Found: ${data.length} items`);
        if (data.length > 0) {
            // 첫 번째 결과의 district와 type 확인
            const item = data[0];
            console.log(`  Sample result - District: ${item.district}, Type: ${item.type}`);
        }
    } catch (err) {
        console.error(`Error for "${keyword}":`, err.message);
    }
}

async function run() {
    console.log("Starting intelligent search logic verification...");
    for (const kw of testKeywords) {
        await testSearch(kw);
    }
}

run();
