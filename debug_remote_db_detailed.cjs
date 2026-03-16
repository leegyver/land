
const { NodeSSH } = require('E:/server/match table/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkRemoteDbDetailed() {
    try {
        await ssh.connect({
            host: '1.234.53.82',
            username: 'root',
            password: 'tlsgnsl00'
        });

        const remotePath = '/root/land';
        
        console.log("Checking remote newsletter_subscriptions table info with absolute path...");
        const result = await ssh.execCommand('sqlite3 /root/land/database.sqlite "PRAGMA table_info(newsletter_subscriptions);"', { cwd: remotePath });
        console.log("Table Info Output:", result.stdout);
        
        console.log("Checking if table exists...");
        const existsResult = await ssh.execCommand('sqlite3 /root/land/database.sqlite "SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'newsletter_subscriptions\';"', { cwd: remotePath });
        console.log("Table Exists Output:", existsResult.stdout);

        console.log("Checking PM2 list...");
        const pm2List = await ssh.execCommand('pm2 list');
        console.log("PM2 List:\n", pm2List.stdout);

    } catch (err) {
        console.error('❌ REMOTE CHECK FAILED:', err.message);
    } finally {
        ssh.dispose();
    }
}

checkRemoteDbDetailed();
