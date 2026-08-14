const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const code = Buffer.from(`
require('dotenv').config();
const { sendWeeklyNewsletter } = require('./server/newsletter');
sendWeeklyNewsletter('9551304@naver.com').then(() => {
  console.log("Newsletter sent successfully!");
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
