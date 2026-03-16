
const { NodeSSH } = require('E:/server/match table/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkCrawlerLogs() {
    try {
        await ssh.connect({
            host: '1.234.53.82',
            username: 'root',
            password: 'tlsgnsl00'
        });

        console.log("Searching for crawler logs in out-log...");
        const result = await ssh.execCommand('grep -iE "fetch|crawler|starting|saving" /root/.pm2/logs/leegyver-v2-out-4.log | tail -n 100');
        console.log("Crawler Out Logs:\n", result.stdout);

    } catch (err) {
        console.error('❌ REMOTE CRAWLER LOG CHECK FAILED:', err.message);
    } finally {
        ssh.dispose();
    }
}

checkCrawlerLogs();
