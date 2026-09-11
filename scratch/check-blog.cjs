const https = require('https');

https.get('https://blog.naver.com/PostList.naver?blogId=9551304&categoryNo=0&from=postList', {
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Includes 연동 테스트?', d.includes('연동 테스트'));
    const matches = d.match(/title="[^"]*"/g);
    if (matches) console.log('Titles found:', matches.slice(0, 10));
    else console.log('No titles found');
  });
});
