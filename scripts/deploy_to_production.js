const { NodeSSH } = require('e:/server/match table/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deploy() {
    try {
        console.log('🚀 EMERGENCY RESTORATION: DEPLOYING SQLITE BRIDGE TO PRODUCTION');
        await ssh.connect({
            host: '1.234.53.82',
            username: 'root',
            password: 'tlsgnsl00'
        });

        const remotePath = '/root/land';
        const localPath = 'e:/server/homepage';

        console.log('📦 Cleaning remote dist and server folders...');
        await ssh.execCommand('rm -rf dist/ server/ shared/', { cwd: remotePath });

        console.log('📤 Uploading dist/ folder...');
        await ssh.putDirectory(path.join(localPath, 'dist'), path.join(remotePath, 'dist'));

        console.log('📤 Uploading server/ folder...');
        await ssh.putDirectory(path.join(localPath, 'server'), path.join(remotePath, 'server'));

        console.log('📤 Uploading shared/ folder...');
        await ssh.putDirectory(path.join(localPath, 'shared'), path.join(remotePath, 'shared'));

        console.log('📤 Uploading package.json...');
        await ssh.putFile(path.join(localPath, 'package.json'), path.join(remotePath, 'package.json'));

        console.log('⚙️ Installing new dependencies on server (better-sqlite3)...');
        // We use --production to keep it light
        const installResult = await ssh.execCommand('npm install --production', { cwd: remotePath });
        console.log('npm install output:', installResult.stdout || installResult.stderr);

        console.log('🔄 Restarting site with PM2...');
        // Assuming the process name is 'land' or similar. 
        // We'll try to restart by file if name is unknown.
        await ssh.execCommand('pm2 restart land-app || pm2 restart all', { cwd: remotePath });

        console.log('✨ RESTORATION DEPLOYMENT COMPLETE!');
    } catch (err) {
        console.error('❌ DEPLOYMENT FAILED:', err.message);
        process.exit(1);
    } finally {
        ssh.dispose();
    }
}

deploy();
