
const { NodeSSH } = require('E:/server/match table/node_modules/node-ssh');
const ssh = new NodeSSH();

async function readLogFiles() {
    try {
        await ssh.connect({
            host: '1.234.53.82',
            username: 'root',
            password: 'tlsgnsl00'
        });

        const logPath = '/root/.pm2/logs';
        
        console.log("Listing PM2 log files...");
        const lsResult = await ssh.execCommand('ls -lh', { cwd: logPath });
        console.log("Log Files:\n", lsResult.stdout);
        
        console.log("Reading last 50 lines of land-app-out.log...");
        const outLog = await ssh.execCommand('tail -n 50 land-app-out.log', { cwd: logPath });
        console.log("land-app-out.log:\n", outLog.stdout);

        console.log("Reading last 50 lines of land-app-error.log...");
        const errLog = await ssh.execCommand('tail -n 50 land-app-error.log', { cwd: logPath });
        console.log("land-app-error.log:\n", errLog.stdout);

    } catch (err) {
        console.error('❌ REMOTE LOG READ FAILED:', err.message);
    } finally {
        ssh.dispose();
    }
}

readLogFiles();
