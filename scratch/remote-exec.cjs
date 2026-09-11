const { Client } = require('ssh2');

const cmd = process.argv.slice(2).join(' ') || 'echo "Connected!"';

const conn = new Client();
conn.on('ready', () => {
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
    stream.on('close', (code) => {
      conn.end();
      process.exit(code || 0);
    });
    stream.on('data', (data) => process.stdout.write(data.toString()));
    stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
  });
}).connect({
  host: '1.234.53.82',
  port: 22,
  username: 'root',
  password: 'tlsgnsl3595!!'
});
