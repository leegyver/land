const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const localFile = '.env';
    const remoteFile = '/root/land/.env';
    sftp.fastPut(localFile, remoteFile, (err) => {
      if (err) throw err;
      console.log('✅ .env upload success');
      conn.exec('pm2 restart homepage-server', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
      });
    });
  });
}).connect({ host: '1.234.53.82', port: 22, username: 'root', password: 'tlsgnsl00' });
