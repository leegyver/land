
const { NodeSSH } = require('E:/server/match table/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkRemoteDb() {
    try {
        await ssh.connect({
            host: '1.234.53.82',
            username: 'root',
            password: 'tlsgnsl00'
        });

        const remotePath = '/root/land';
        
        console.log("Checking remote newsletter_subscriptions table structure...");
        const result = await ssh.execCommand('sqlite3 database.sqlite "PRAGMA table_info(newsletter_subscriptions);"', { cwd: remotePath });
        console.log("Remote Table Info:\n", result.stdout);
        
        const tablesResult = await ssh.execCommand('sqlite3 database.sqlite ".tables"', { cwd: remotePath });
        console.log("Remote Tables:\n", tablesResult.stdout);

    } catch (err) {
        console.error('❌ REMOTE CHECK FAILED:', err.message);
    } finally {
        ssh.dispose();
    }
}

checkRemoteDb();
