const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`tail -n 200 /root/.pm2/logs/homepage-server-out.log && echo "--- ERROR LOG ---" && tail -n 200 /root/.pm2/logs/homepage-server-error.log`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
      .on('data', d => process.stdout.write(d.toString()))
      .stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect({ host: '1.234.53.82', username: 'root', password: 'tlsgnsl3595!!' });
