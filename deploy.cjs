const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('✅ 서버 접속 성공 (1.234.53.82)');
  console.log('🚀 원격 서버 상태를 정리하고 깃허브에서 동기화합니다...');
  
  // 명령어 실행 (stash로 기존 임시수정/충돌 덮기)
  conn.exec('cd /root/land && git stash && git pull origin main && npm install && npm run build && pm2 restart ecosystem.config.cjs', (err, stream) => {
    if (err) {
      console.error('명령어 실행 중 오류 발생:', err);
      conn.end();
      return;
    }

    stream.on('close', (code, signal) => {
      console.log('\n🎉 [배포 완료] 최신 버전으로 갱신 후 서버를 리스타트했습니다.');
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      // 일부 오류 메시지가 아닐 수도 있으므로 그냥 출력
      process.stderr.write(data.toString());
    });
  });
}).connect({
  host: '1.234.53.82',
  port: 22,
  username: 'root',
  password: 'tlsgnsl00' 
});
