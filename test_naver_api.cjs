const https = require('https');

const CLIENT_ID = 'oQaPNTLGNHOR9h7wT6rX';
const CLIENT_SECRET = 'uXZY4wDjku';
const KEYWORD = '강화군 부동산';

const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(KEYWORD)}&display=5&sort=date`;

const options = {
    headers: {
        'X-Naver-Client-Id': CLIENT_ID,
        'X-Naver-Client-Secret': CLIENT_SECRET,
        'Referer': 'http://leegyver.com'
    }
};

console.log(`Fetching: ${url}`);

const req = https.get(url, options, (res) => {
    console.log(`Status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Body Preview:', data.substring(0, 200));
        try {
            const json = JSON.parse(data);
            console.log(`Items count: ${json.items ? json.items.length : 0}`);
            if (json.errorMessage) {
                console.error('Error Message:', json.errorMessage);
            }
        } catch (e) {
            console.error('JSON Parse Error');
        }
    });
});

req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
});
