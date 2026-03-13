import { naverCrawler } from './server/services/naver-crawler.js';

console.log('Starting manual crawl test...');
naverCrawler.fetchAndSave(null, 'full')
    .then(result => {
        console.log('Crawl completed:', result);
        process.exit(0);
    })
    .catch(err => {
        console.error('Crawl failed:', err);
        process.exit(1);
    });
