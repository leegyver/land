
const { NodeSSH } = require('E:/server/match table/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkPm2Json() {
    try {
        await ssh.connect({
            host: '1.234.53.82',
            username: 'root',
            password: 'tlsgnsl00'
        });

        console.log("Getting PM2 process list in JSON format...");
        const result = await ssh.execCommand('pm2 jlist');
        console.log("PM2 jlist:\n", result.stdout);

    } catch (err) {
        console.error('❌ REMOTE PM2 CHECK FAILED:', err.message);
    } finally {
        ssh.dispose();
    }
}

checkPm2Json();
