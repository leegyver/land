const https = require('https');

const CLIENT_ID = 'oQaPNTLGNHOR9h7wT6rX';
const CLIENT_SECRET = 'uXZY4wDjku';
const KEYWORD = '강화군';

const endpoints = [
    { name: 'NEWS', url: `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(KEYWORD)}&display=1` },
    { name: 'BLOG', url: `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(KEYWORD)}&display=1` },
    { name: 'LOCAL', url: `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(KEYWORD)}&display=1` },
    { name: 'WEB', url: `https://openapi.naver.com/v1/search/webkr.json?query=${encodeURIComponent(KEYWORD)}&display=1` }
];

const options = {
    headers: {
        'X-Naver-Client-Id': CLIENT_ID,
        'X-Naver-Client-Secret': CLIENT_SECRET
    }
};

function checkEndpoint(endpoint) {
    return new Promise((resolve) => {
        const req = https.get(endpoint.url, options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                let status = 'UNKNOWN';
                try {
                    const json = JSON.parse(data);
                    if (res.statusCode === 200) {
                        status = 'OK';
                    } else {
                        status = `FAIL (${json.errorCode || res.statusCode})`;
                        if (json.errorMessage) status += ` - ${json.errorMessage}`;
                    }
                } catch (e) {
                    status = `FAIL (Parse Error) - ${res.statusCode}`;
                }
                console.log(`[${endpoint.name}] ${status}`);
                resolve();
            });
        });
        req.on('error', (e) => {
            console.log(`[${endpoint.name}] Network Error: ${e.message}`);
            resolve();
        });
    });
}

async function run() {
    console.log("Starting API Scope Test...");
    for (const ep of endpoints) {
        await checkEndpoint(ep);
    }
    console.log("Done.");
}

run();
