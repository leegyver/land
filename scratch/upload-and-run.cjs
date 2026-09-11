const { Client } = require('ssh2');
const fs = require('fs');

const localFile = process.argv[2];
const remoteFile = process.argv[3] || '/tmp/run_task.js';

if (!localFile || !fs.existsSync(localFile)) {
  console.error('Usage: node upload-and-run.cjs <localFile> [remoteFile]');
  process.exit(1);
}

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP error:', err);
      conn.end();
      return;
    }
    const readStream = fs.createReadStream(localFile);
    const writeStream = sftp.createWriteStream(remoteFile);
    writeStream.on('close', () => {
      console.log(`Uploaded ${localFile} -> ${remoteFile}. Running...`);
      conn.exec(`NODE_PATH=/root/land/node_modules node ${remoteFile}`, (err2, stream) => {
        if (err2) {
          console.error('Exec error:', err2);
          conn.end();
          return;
        }
        stream.on('close', (code) => {
          conn.end();
          process.exit(code || 0);
        });
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
      });
    });
    readStream.pipe(writeStream);
  });
}).connect({
  host: '1.234.53.82',
  port: 22,
  username: 'root',
  password: 'tlsgnsl3595!!'
});
