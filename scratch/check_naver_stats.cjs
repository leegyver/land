const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const code = `
    const db = require('better-sqlite3')('database.sqlite');
    const naverLogs = db.prepare("SELECT count(*) as count FROM visit_logs WHERE referer LIKE '%naver.com%'").get();
    console.log('Total naver referer logs:', naverLogs.count);

    const naverPaths = db.prepare("SELECT path, count(*) as count FROM visit_logs WHERE referer LIKE '%naver.com%' GROUP BY path ORDER BY count DESC LIMIT 15").all();
    console.log('Top paths from naver:');
    console.log(JSON.stringify(naverPaths, null, 2));

    const allRefererSummary = db.prepare("SELECT CASE WHEN referer LIKE '%naver.com%' THEN 'naver' WHEN referer LIKE '%google.com%' THEN 'google' WHEN referer LIKE '%daum.net%' THEN 'daum' WHEN referer IS NULL OR referer = '' THEN 'direct' ELSE 'other' END as portal, count(*) as count FROM visit_logs GROUP BY portal ORDER BY count DESC").all();
    console.log('Referer Portal Distribution:');
    console.log(JSON.stringify(allRefererSummary, null, 2));
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
