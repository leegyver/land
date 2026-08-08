const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
  const code = `
const fs = require('fs');
const routesTsPath = '/root/land/server/routes.ts';
let code = fs.readFileSync(routesTsPath, 'utf8');
if (!code.includes('/api/test-query')) {
  const insertCode = \`
  app.get('/api/test-query', (req, res) => {
    res.json({
      url: req.url,
      originalUrl: req.originalUrl,
      query: req.query,
      path: req.path
    });
  });
  \`;
  code = code.replace('export async function registerRoutes(app: Express): Promise<Server> {', 'export async function registerRoutes(app: Express): Promise<Server> {' + insertCode);
  fs.writeFileSync(routesTsPath, code);
  console.log('Injected /api/test-query');
  require('child_process').execSync('cd /root/land && npm run build && pm2 restart homepage-server');
  console.log('Restarted');
} else {
  console.log('Already injected');
}
`;
  conn.exec(`node -e ${JSON.stringify(code)}`, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => console.log(d.toString()));
    stream.stderr.on('data', d => console.error(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '1.234.53.82',
  username: 'root',
  password: 'tlsgnsl3595!!'
});
