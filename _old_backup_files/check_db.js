const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmd = "sqlite3 /root/land/database.sqlite 'SELECT COUNT(*) FROM properties;'";
  conn.exec(cmd, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('data', d => process.stdout.write('매물 수: ' + d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => { conn.end(); });
  });
}).connect({ host: '1.234.53.82', port: 22, username: 'root', password: 'tlsgnsl00' });
