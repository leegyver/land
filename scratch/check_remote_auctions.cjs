const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`cd /root/land && node -e "const db = require('better-sqlite3')('database.sqlite'); console.log(JSON.stringify(db.prepare('SELECT id, caseNumber, title, address, district, appraisalPrice, minimumPrice, deposit, discountRate FROM auctions').all(), null, 2)); db.close();"`, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '1.234.53.82', port: 22, username: 'root', password: 'tlsgnsl3595!!' });
