
const { NodeSSH } = require('E:/server/match table/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkPm2Names() {
    try {
        await ssh.connect({
            host: '1.234.53.82',
            username: 'root',
            password: 'tlsgnsl00'
        });

        console.log("Checking for processes with 'land' in name...");
        const result = await ssh.execCommand("pm2 jlist | grep -o '\"name\":\"[^\"]*\"'");
        console.log("PM2 Names found:\n", result.stdout);

    } catch (err) {
        console.error('❌ REMOTE PM2 NAME CHECK FAILED:', err.message);
    } finally {
        ssh.dispose();
    }
}

checkPm2Names();
