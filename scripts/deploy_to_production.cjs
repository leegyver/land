const { NodeSSH } = require('E:/server/match table/node_modules/node-ssh');
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

        console.log('📤 Uploading dist.tar.gz...');
        await ssh.putFile(path.join(localPath, 'dist.tar.gz'), path.join(remotePath, 'dist.tar.gz'));

        console.log('📦 Cleaning remote dist and server folders and extracting tarball...');
        // We keep uploads/ and database.sqlite
        await ssh.execCommand('rm -rf dist/ server/ shared/ package.json', { cwd: remotePath });
        await ssh.execCommand('tar -xzf dist.tar.gz', { cwd: remotePath });
        await ssh.execCommand('rm dist.tar.gz', { cwd: remotePath });

        console.log('⚙️ Installing dependencies on server...');
        const installResult = await ssh.execCommand('npm install --production', { cwd: remotePath });
        console.log('npm install output:', installResult.stdout);

        console.log('🔄 Restarting site with PM2...');
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
