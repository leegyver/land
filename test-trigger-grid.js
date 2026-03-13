import fetch from 'node-fetch';

async function trigger() {
    console.log('Triggering grid crawl...');
    try {
        const res = await fetch('http://localhost:5000/api/admin/crawler/run', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': 'connect.sid=DUMMY' // Need auth actually, but localhost might be bypassed or I can use internal method
            },
            body: JSON.stringify({ mode: 'grid' })
        });
        console.log('Trigger response:', await res.text());
    } catch (err) {
        console.error('Trigger failed:', err);
    }
}

// Or just call the crawler directly if possible
import { naverCrawler } from './server/services/naver-crawler.js';
console.log('Calling naverCrawler.fetchAndSave directly...');
naverCrawler.fetchAndSave(null, 'grid')
    .then(r => console.log('Result:', r))
    .catch(e => console.error('Error:', e));
