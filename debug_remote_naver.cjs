
const { NodeSSH } = require('E:/server/match table/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkNaverLogs() {
    try {
        await ssh.connect({
            host: '1.234.53.82',
            username: 'root',
            password: 'tlsgnsl00'
        });

        console.log("Searching for 'Naver' or 'Crawler' errors in PM2 logs...");
        const result = await ssh.execCommand('grep -iE "naver|crawler" /root/.pm2/logs/leegyver-v2-error-4.log | tail -n 50');
        console.log("Naver Error Logs:\n", result.stdout);
        
        console.log("Checking Naver API keys in .env...");
        const envResult = await ssh.execCommand('grep -i "naver" .env', { cwd: '/root/land' });
        console.log("Remote .env Naver settings (masked):\n", envResult.stdout.replace(/[a-zA-Z0-9_\-]{10,}/g, '********'));

    } catch (err) {
        console.error('❌ REMOTE NAVER LOG CHECK FAILED:', err.message);
    } finally {
        ssh.dispose();
    }
}

checkNaverLogs();
