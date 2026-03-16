
const { NodeSSH } = require('E:/server/match table/node_modules/node-ssh');
const ssh = new NodeSSH();

async function listRemoteFiles() {
    try {
        await ssh.connect({
            host: '1.234.53.82',
            username: 'root',
            password: 'tlsgnsl00'
        });

        const remotePath = '/root/land';
        
        console.log("Listing files in /root/land...");
        const result = await ssh.execCommand('ls -R', { cwd: remotePath });
        console.log("Remote File List:\n", result.stdout);

    } catch (err) {
        console.error('❌ REMOTE LS FAILED:', err.message);
    } finally {
        ssh.dispose();
    }
}

listRemoteFiles();
