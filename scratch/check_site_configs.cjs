const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const code = `
    const db = require('better-sqlite3')('database.sqlite');
    const configs = db.prepare('SELECT * FROM site_configs').all();
    console.log('Site configs:', configs);
  `;
  const b64 = Buffer.from(code).toString('base64');
  conn.exec(`cd /root/land && node -e "$(echo '${b64}' | base64 -d)"`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d.toString());
    stream.stderr.on('data', d => console.error(d.toString()));
    stream.on('close', () => {
      console.log(out);
      conn.end();
    });
  });
}).connect({
  host: '1.234.53.82',
  username: 'root',
  password: 'tlsgnsl3595!!'
});
