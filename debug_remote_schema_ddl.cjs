
const { NodeSSH } = require('E:/server/match table/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkRemoteSchema() {
    try {
        await ssh.connect({
            host: '1.234.53.82',
            username: 'root',
            password: 'tlsgnsl00'
        });

        const remotePath = '/root/land';
        
        console.log("Checking exact DDL for newsletter_subscriptions...");
        const result = await ssh.execCommand('sqlite3 database.sqlite ".schema newsletter_subscriptions"', { cwd: remotePath });
        console.log("Remote DDL:\n", result.stdout);

    } catch (err) {
        console.error('❌ REMOTE SCHEMA CHECK FAILED:', err.message);
    } finally {
        ssh.dispose();
    }
}

checkRemoteSchema();
