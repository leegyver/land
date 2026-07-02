const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  const script = `
const fs = require('fs');
let env = fs.readFileSync('/root/land/.env', 'utf8');
env = env.replace(/\\\\nNAVER_EMAIL=9551304@naver.com\\\\nNAVER_APP_PASSWORD=XJ3Y5QUN1U4G/g, '');
env += "\\nNAVER_EMAIL=9551304@naver.com\\nNAVER_APP_PASSWORD=XJ3Y5QUN1U4G\\n";
fs.writeFileSync('/root/land/.env', env);
`;
  conn.exec(`node -e "${script.replace(/"/g, '\\"')}" && pm2 restart homepage-server --update-env`, (err, stream) => { 
    if (err) throw err; 
    stream.on('close', () => { 
      conn.end(); 
    }).on('data', d => process.stdout.write(d.toString())); 
  }); 
}).connect({ host: '1.234.53.82', port: 22, username: 'root', password: 'tlsgnsl3595!!' });
