
const { NodeSSH } = require('E:/server/match table/node_modules/node-ssh');
const ssh = new NodeSSH();

async function findRemoteDb() {
    try {
        await ssh.connect({
            host: '1.234.53.82',
            username: 'root',
            password: 'tlsgnsl00'
        });

        const remotePath = '/root/land';
        
        console.log("Searching for .sqlite files in /root/land and subdirectories...");
        const result = await ssh.execCommand('find . -name "*.sqlite"', { cwd: remotePath });
        console.log("Found SQLite files:\n", result.stdout);
        
        console.log("Checking current working directory of the running app...");
        const pm2Result = await ssh.execCommand('pm2 show land-app');
        console.log("PM2 land-app info:\n", pm2Result.stdout);

    } catch (err) {
        console.error('❌ REMOTE FIND FAILED:', err.message);
    } finally {
        ssh.dispose();
    }
}

findRemoteDb();
