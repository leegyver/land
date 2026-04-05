const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  // better-sqlite3로 직접 조회
  const cmd = `cd /root/land && node -e "const D=require('better-sqlite3')('./database.sqlite');const r=D.prepare('SELECT COUNT(*) as c FROM properties').get();console.log('COUNT:'+r.c)"`;
  conn.exec(cmd, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => { conn.end(); });
  });
}).connect({ host: '1.234.53.82', port: 22, username: 'root', password: 'tlsgnsl00' });
