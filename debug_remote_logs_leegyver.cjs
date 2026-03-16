
const { NodeSSH } = require('E:/server/match table/node_modules/node-ssh');
const ssh = new NodeSSH();

async function readLeegyverLogs() {
    try {
        await ssh.connect({
            host: '1.234.53.82',
            username: 'root',
            password: 'tlsgnsl00'
        });

        const logPath = '/root/.pm2/logs';
        
        console.log("Reading last 100 lines of leegyver-v2-error-4.log...");
        const errLog = await ssh.execCommand('tail -n 100 leegyver-v2-error-4.log', { cwd: logPath });
        console.log("leegyver-v2-error-4.log:\n", errLog.stdout);

        console.log("Reading last 100 lines of leegyver-v2-out-4.log...");
        const outLog = await ssh.execCommand('tail -n 100 leegyver-v2-out-4.log', { cwd: logPath });
        console.log("leegyver-v2-out-4.log:\n", outLog.stdout);

    } catch (err) {
        console.error('❌ REMOTE LOG READ FAILED:', err.message);
    } finally {
        ssh.dispose();
    }
}

readLeegyverLogs();
