
const { NodeSSH } = require('E:/server/match table/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function runRemoteDiagnostic() {
    try {
        await ssh.connect({
            host: '1.234.53.82',
            username: 'root',
            password: 'tlsgnsl00'
        });

        const remotePath = '/root/land';
        const localFile = 'e:/server/homepage/remote_db_check_node.cjs';
        const remoteFile = path.join(remotePath, 'remote_db_check_node.cjs');

        console.log("Uploading diagnostic script...");
        await ssh.putFile(localFile, remoteFile);
        
        console.log("Running diagnostic script...");
        const result = await ssh.execCommand('node remote_db_check_node.cjs', { cwd: remotePath });
        console.log("Diagnostic Output:\n", result.stdout);
        console.error("Diagnostic Error (if any):\n", result.stderr);

        // Clean up
        await ssh.execCommand('rm remote_db_check_node.cjs', { cwd: remotePath });

    } catch (err) {
        console.error('❌ REMOTE DIAGNOSTIC FAILED:', err.message);
    } finally {
        ssh.dispose();
    }
}

runRemoteDiagnostic();
