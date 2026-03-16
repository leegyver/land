
const { NodeSSH } = require('E:/server/match table/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkLogs() {
    try {
        await ssh.connect({
            host: '1.234.53.82',
            username: 'root',
            password: 'tlsgnsl00'
        });

        const remotePath = '/root/land';
        
        console.log("Checking last 100 lines of PM2 logs...");
        const result = await ssh.execCommand('pm2 logs --lines 100 --no-daemon', { cwd: remotePath });
        console.log("PM2 Logs:\n", result.stdout);
        
        console.log("Checking system logs for any errors...");
        const dmesg = await ssh.execCommand('tail -n 50 /var/log/syslog');
        console.log("System Logs:\n", dmesg.stdout);

    } catch (err) {
        console.error('❌ REMOTE LOG CHECK FAILED:', err.message);
    } finally {
        ssh.dispose();
    }
}

checkLogs();
