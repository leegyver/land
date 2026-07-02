const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  conn.exec('cat /root/land/.env', (err, stream) => { 
    if (err) throw err; 
    stream.on('close', () => { 
      conn.end(); 
    }).on('data', d => process.stdout.write(d.toString())); 
  }); 
}).connect({ host: '1.234.53.82', port: 22, username: 'root', password: 'tlsgnsl3595!!' });
