const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const code = Buffer.from(`
const { storage } = require('./server/storage');
storage.getWeeklyNewsletterData().then(data => {
  console.log('=== Properties ===');
  data.properties.forEach(p => console.log(p.title));
  console.log('=== Posts ===');
  data.posts.forEach(p => console.log(p.title));
  console.log('=== News ===');
  data.news.forEach(p => console.log(p.title));
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
