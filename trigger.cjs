const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`cd /root/land && node -e "const { sendWeeklyNewsletter } = require('./server/newsletter.js'); sendWeeklyNewsletter('9551304@naver.com').then(() => console.log('Done')).catch(console.error);"`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
      .on('data', d => process.stdout.write(d.toString()))
      .stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect({ host: '1.234.53.82', username: 'root', password: 'tlsgnsl3595!!' });
