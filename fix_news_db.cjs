const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`cd /root/land && node -e "const Database = require('better-sqlite3'); const db = new Database('database.sqlite'); try { db.exec('ALTER TABLE news ADD COLUMN viewCount INTEGER DEFAULT 0;'); console.log('Column added to news'); } catch (e) { console.error('Error adding column', e.message); }"`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
      .on('data', d => process.stdout.write(d.toString()))
      .stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect({ host: '1.234.53.82', username: 'root', password: 'tlsgnsl3595!!' });
