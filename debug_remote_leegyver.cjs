
const { NodeSSH } = require('E:/server/match table/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkLeegyverV2() {
    try {
        await ssh.connect({
            host: '1.234.53.82',
            username: 'root',
            password: 'tlsgnsl00'
        });

        console.log("Showing PM2 info for leegyver-v2...");
        const result = await ssh.execCommand('pm2 show leegyver-v2');
        console.log("PM2 leegyver-v2 info:\n", result.stdout);
        
        console.log("Reading last 50 lines of leegyver-v2 logs...");
        const logResult = await ssh.execCommand('pm2 logs leegyver-v2 --lines 50 --no-daemon & sleep 5; kill $!');
        console.log("PM2 leegyver-v2 logs:\n", logResult.stdout);

    } catch (err) {
        console.error('❌ REMOTE PM2 CHECK FAILED:', err.message);
    } finally {
        ssh.dispose();
    }
}

checkLeegyverV2();
