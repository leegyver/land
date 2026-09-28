const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const code = `
    const db = require('better-sqlite3')('database.sqlite');
    
    // 비정상 키워드 정리 쿼리
    const updateResult = db.prepare(\`
      UPDATE visit_logs 
      SET keyword = NULL 
      WHERE keyword IS NOT NULL AND (
        keyword LIKE 'site:%' 
        OR keyword LIKE 'http:%' 
        OR keyword LIKE 'https:%' 
        OR keyword LIKE '%<%' 
        OR keyword LIKE '%>%' 
        OR keyword LIKE '%"%' 
        OR keyword LIKE '%\\\\%' 
        OR LOWER(keyword) IN ('wordpress', 'leegyver', 'test', '테스트', '테스트키워드')
      )
    \`).run();
    console.log('Cleaned invalid keyword rows:', updateResult.changes);

    const remainingKeywords = db.prepare(\`
      SELECT keyword, count(*) as count 
      FROM visit_logs 
      WHERE keyword IS NOT NULL AND TRIM(keyword) != '' 
      GROUP BY keyword 
      ORDER BY count DESC 
      LIMIT 15
    \`).all();
    console.log('Remaining Clean Keywords:');
    console.log(JSON.stringify(remainingKeywords, null, 2));
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
