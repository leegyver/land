const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`curl -X POST http://localhost:5000/api/admin/newsletter/test -H "Content-Type: application/json" -d '{"target":"master"}'`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
      .on('data', d => process.stdout.write(d.toString()))
      .stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect({ host: '1.234.53.82', username: 'root', password: 'tlsgnsl3595!!' });
