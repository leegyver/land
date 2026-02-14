
import fetch from 'node-fetch';

async function checkApi() {
    try {
        console.log('Fetching from http://localhost:5000/api/search?includeCrawled=false ...');
        const res = await fetch('http://localhost:5000/api/search?includeCrawled=false');
        const data = await res.json();

        console.log(`Status: ${res.status}`);
        if (Array.isArray(data)) {
            console.log(`Total Items: ${data.length}`);
            const naverItems = data.filter((p: any) => p.source === 'naver' || p.district === '수집매물');
            console.log(`Naver Items: ${naverItems.length}`);
            if (data.length > 0) {
                console.log('Sample item:', JSON.stringify(data[0], null, 2));
            }
        } else {
            console.log('Response is not an array:', data);
        }
    } catch (err) {
        console.error('Fetch failed:', err);
    }
}

checkApi();
