const { Client } = require('ssh2');
const { execSync } = require('child_process');

// node deploy.cjs test  => 네이버 크롤링 차단 여부 테스트
// node deploy.cjs       => 일반 배포
const isTest = process.argv[2] === 'test';

if (!isTest) {
  try {
    console.log('\n📦 [1/2] 로컬 변경사항을 깃허브에 안전하게 동기화합니다...');
    execSync('git add .', { stdio: 'inherit' });
    try {
      execSync('git commit -m "Auto-deploy: sync local to github"', { stdio: 'ignore' });
      console.log('📝 새로운 변경사항 커밋 완료.');
    } catch (e) {
      console.log('ℹ️ 커밋할 새로운 변경사항이 없습니다 (이미 최신상태).');
    }
    console.log('🚀 깃허브(origin main) 연동 중...');
    execSync('git push origin main', { stdio: 'inherit' });
    console.log('✅ 깃허브 안전 동기화 완료.\n');
  } catch (error) {
    console.error('❌ 깃허브 푸시 중 치명적 오류 발생. 무결성을 위해 배포를 즉각 중단합니다.');
    console.error(error.message);
    process.exit(1);
  }
}

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
  
  // =============================================
  // 배포 명령어 (3중 DB 보호 체계)
  // =============================================
  const deployCmd = [
    'cd /root/land',

    // ── 단계 1: DB 백업 (타임스탬프 + 고정 위치) ──
    'echo "━━━ [1/6] DB 백업 ━━━"',
    'TIMESTAMP=$(date +%Y%m%d_%H%M%S)',
    'if [ -f database.sqlite ]; then ' +
      'cp database.sqlite /tmp/database_backup.sqlite && ' +
      'cp database.sqlite /root/db_backups/database_${TIMESTAMP}.sqlite 2>/dev/null; ' +
      'mkdir -p /root/db_backups; ' +
      'cp database.sqlite /root/db_backups/database_${TIMESTAMP}.sqlite; ' +
      'echo "✅ DB 백업 완료: /tmp/database_backup.sqlite + /root/db_backups/database_${TIMESTAMP}.sqlite"; ' +
    'else echo "⚠️ database.sqlite 없음 (첫 배포)"; fi',

    // ── 단계 2: Git 강제 동기화 (깃허브 기준 덮어쓰기) ──
    'echo "━━━ [2/6] Git 완벽 동기화 ━━━"',
    'git fetch origin main',
    'git reset --hard origin/main',

    // ── 단계 3: Git에서 유입된 DB 파일 제거 ──
    'echo "━━━ [3/6] DB 보호 확인 ━━━"',
    // git pull로 database.sqlite가 유입됐는지 확인하고 즉시 제거
    'if git ls-files --cached | grep -q "database.sqlite"; then ' +
      'echo "🚨 경고: git에서 database.sqlite 유입 감지! 즉시 제거합니다."; ' +
      'git rm --cached database.sqlite database.sqlite-shm database.sqlite-wal 2>/dev/null; ' +
      'git commit -m "emergency: remove database.sqlite from tracking" --no-verify 2>/dev/null; ' +
    'fi',

    // ── 단계 4: DB 복원 ──
    'echo "━━━ [4/6] DB 복원 ━━━"',
    'if [ -f /tmp/database_backup.sqlite ]; then ' +
      'cp /tmp/database_backup.sqlite database.sqlite && ' +
      'rm -f database.sqlite-shm database.sqlite-wal && ' +
      'echo "✅ DB 복원 완료 (WAL 파일 정리됨)"; ' +
    'else echo "⚠️ 백업 파일 없음 - 새 DB로 진행"; fi',

    // ── 단계 5: 빌드 및 재시작 ──
    'echo "━━━ [5/6] 빌드 및 재시작 ━━━"',
    'npm install',
    'npm run build',
    'pm2 restart ecosystem.config.cjs',

    // ── 단계 6: DB 무결성 검증 ──
    'echo "━━━ [6/6] DB 무결성 검증 ━━━"',
    'node -e "' +
      'const db = require(\\\"better-sqlite3\\\")(\\\"database.sqlite\\\"); ' +
      'const p = db.prepare(\\\"SELECT COUNT(*) as c FROM properties\\\").get(); ' +
      'const u = db.prepare(\\\"SELECT COUNT(*) as c FROM users\\\").get(); ' +
      'const b = db.prepare(\\\"SELECT COUNT(*) as c FROM banners\\\").get(); ' +
      'const n = db.prepare(\\\"SELECT COUNT(*) as c FROM notices\\\").get(); ' +
      'console.log(\\\"📊 DB 상태: 매물=\\\" + p.c + \\\" 회원=\\\" + u.c + \\\" 배너=\\\" + b.c + \\\" 공지=\\\" + n.c); ' +
      'db.close(); ' +
    '"',

    // 오래된 백업 정리 (30일 이상)
    'find /root/db_backups -name "database_*.sqlite" -mtime +30 -delete 2>/dev/null',
    'echo "🎉 배포 완료!"'
  ].join(' && ');

  conn.exec(deployCmd, (err, stream) => {
    if (err) {
      console.error('명령어 실행 중 오류 발생:', err);
      conn.end();
      return;
    }

    stream.on('close', (code, signal) => {
      if (code === 0) {
        console.log('\n🎉 [배포 완료] 최신 버전으로 갱신 후 서버를 리스타트했습니다.');
      } else {
        console.error(`\n❌ [배포 실패] 종료 코드: ${code}`);
      }
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).connect({
  host: '1.234.53.82',
  port: 22,
  username: 'root',
  password: 'tlsgnsl3595!!' 
});
