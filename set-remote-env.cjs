const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  conn.exec('echo "\\nNAVER_EMAIL=9551304@naver.com\\nNAVER_APP_PASSWORD=XJ3Y5QUN1U4G" >> /root/land/.env && pm2 restart homepage-server --update-env', (err, stream) => { 
    if (err) throw err; 
    stream.on('close', () => { 
      console.log("Done updating remote env"); 
      conn.end(); 
    }).on('data', d => console.log(d.toString())); 
  }); 
}).connect({ 
  host: '1.234.53.82', 
  port: 22, 
  username: 'root', 
  password: 'tlsgnsl3595!!' 
});
