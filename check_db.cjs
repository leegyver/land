const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`cd /root/land && node -e "const db=require('better-sqlite3')('database.sqlite'); console.log(JSON.stringify(db.prepare('SELECT id, title, isPinned, category, createdAt FROM posts ORDER BY isPinned DESC, createdAt DESC LIMIT 10').all(), null, 2))"`, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => console.log(d.toString()));
    stream.stderr.on('data', d => console.error(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '1.234.53.82',
  username: 'root',
  password: 'tlsgnsl3595!!'
});
