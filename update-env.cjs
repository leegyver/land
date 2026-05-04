const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  // 먼저 .env 파일 위치 찾기
  const findCmd = 'find /root -name ".env" 2>/dev/null | head -10';
  conn.exec(findCmd, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    let output = '';
    stream.on('data', d => { output += d.toString(); process.stdout.write(d.toString()); })
      .stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => {
      const envPath = output.trim().split('\n').find(p => p.includes('.env') && !p.includes('.env.')) || '';
      console.log('\n찾은 .env 경로:', envPath);
      if (!envPath) { console.log('경로 없음'); conn.end(); return; }

      const updateCmd = [
        `sed -i "s|YOUTUBE_API_KEY=.*|YOUTUBE_API_KEY=AIzaSyB6B62pmwCPKr_a_HaP14L8NtbzrRHuyj0|" ${envPath}`,
        `grep YOUTUBE ${envPath}`,
        'pm2 restart homepage-server --update-env',
        'echo "✅ 완료"'
      ].join(' && ');

      conn.exec(updateCmd, (err2, stream2) => {
        if (err2) { console.error(err2); conn.end(); return; }
        stream2.on('close', (code) => { console.log('Exit:', code); conn.end(); })
          .on('data', d => process.stdout.write(d.toString()))
          .stderr.on('data', d => process.stderr.write(d.toString()));
      });
    });
  });
}).connect({
  host: '1.234.53.82',
  port: 22,
  username: 'root',
  password: 'tlsgnsl00'
});

