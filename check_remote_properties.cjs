const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const code = Buffer.from(`
const { storage } = require('./server/storage');
storage.getWeeklyNewsletterData().then(data => {
  console.log('=== LATEST PROPERTIES ===');
  console.log(JSON.stringify(data.latestProperties.map(p => ({id: p.id, title: p.title})), null, 2));
  console.log('=== POPULAR PROPERTIES (NEW LOGIC) ===');
  console.log(JSON.stringify(data.popularProperties.map(p => ({id: p.id, title: p.title, views: p.viewCount, date: p.createdAt})), null, 2));
}).catch(console.error);
`).toString('base64');
  conn.exec(`cd /root/land && npx tsx -e "eval(Buffer.from('${code}', 'base64').toString('utf8'))"`, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '1.234.53.82',
  username: 'root',
  password: 'tlsgnsl3595!!'
});
