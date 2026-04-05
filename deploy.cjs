const { Client } = require('ssh2');

// node deploy.cjs test  => 네이버 크롤링 차단 여부 테스트
// node deploy.cjs       => 일반 배포
const isTest = process.argv[2] === 'test';

const conn = new Client();
conn.on('ready', () => {
  if (isTest) {
    console.log('✅ 서버 접속 성공 - 테스트 스크립트 업로드 중...');
    const testScript = `
const https = require('https');
const options = {
  hostname: 'm.land.naver.com',
  path: '/cluster/ajax/articleList?rletTpCd=APT&tradTpCd=A1:B1:B2&z=11&lat=37.7&lon=126.3&btm=37.5&lft=126.15&top=37.86&rgt=126.55&page=1',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': 'https://m.land.naver.com/map/37.7/126.3'
  }
};
const req = https.request(options, (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('BODY (200자):', data.substring(0, 200));
    if (data.trim() === 'null') {
      console.log('==> 결과: 네이버가 null 반환 중 (IP 차단됨)');
    } else {
      try {
        const json = JSON.parse(data);
        const cnt = (json && json.body) ? json.body.length : 0;
        console.log('==> 결과: 정상 응답. body 건수:', cnt);
      } catch(e) {
        console.log('==> 결과: JSON 파싱 실패 (봇 방어 페이지)');
        console.log('HTML 시작:', data.substring(0, 100));
      }
    }
  });
});
req.on('error', e => console.error('네트워크 에러:', e.message));
req.end();
`;

    conn.sftp((err, sftp) => {
      if (err) { console.error('SFTP 오류:', err); conn.end(); return; }
      const writeStream = sftp.createWriteStream('/tmp/naver_test.js');
      writeStream.write(testScript);
      writeStream.end();
      writeStream.on('close', () => {
        console.log('📤 스크립트 업로드 완료. 실행 중...');
        conn.exec('node /tmp/naver_test.js', (err2, stream) => {
          if (err2) { console.error(err2); conn.end(); return; }
          stream.on('data', d => process.stdout.write(d.toString()));
          stream.stderr.on('data', d => process.stderr.write(d.toString()));
          stream.on('close', () => { conn.end(); });
        });
      });
    });
    return;
  }

  console.log('✅ 서버 접속 성공 (1.234.53.82)');
  console.log('🚀 원격 서버 상태를 정리하고 깃허브에서 동기화합니다...');
  
  // 명령어 실행 (DB 파일 보호: git pull 전에 백업, 후에 복원)
  const deployCmd = [
    'cd /root/land',
    // DB 백업 (존재할 경우만)
    'if [ -f database.sqlite ]; then cp database.sqlite /tmp/database_backup.sqlite; echo "DB 백업 완료"; fi',
    // git 정리 후 pull
    'git stash',
    'git pull origin main',
    // DB 복원 (백업이 있을 경우만)
    'if [ -f /tmp/database_backup.sqlite ]; then cp /tmp/database_backup.sqlite database.sqlite; echo "DB 복원 완료"; fi',
    // 빌드 및 재시작
    'npm install',
    'npm run build',
    'pm2 restart ecosystem.config.cjs'
  ].join(' && ');

  conn.exec(deployCmd, (err, stream) => {
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
