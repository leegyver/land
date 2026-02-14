@echo off
:: 영문 모드로 강제 변경 (한글 입력 방지)
chcp 437 > nul
echo ==============================================
echo  Auto Deploy Script (with SSH Key)
echo ==============================================

echo 1. Packing files into update.tar...
tar -cvf update.tar client/src server client/public client/index.html tailwind.config.ts vite.config.ts package.json tsconfig.json postcss.config.js

echo.
echo 2. Uploading update.tar to server...
:: Using -i deploy_key for authentication
scp -o StrictHostKeyChecking=no -i deploy_key -P 22 "update.tar" root@1.234.53.82:/root/land/

echo.
echo 3. Executing deployment commands on server...
:: Unpack, Install, Build, Restart
ssh -o StrictHostKeyChecking=no -i deploy_key -p 22 root@1.234.53.82 "cd /root/land && tar -xvf update.tar && rm update.tar && echo 'Checking for changes...' && grep -c HoverCard client/src/components/saju/SajuResult.tsx || echo 'HoverCard NOT FOUND in source' && echo 'Running npm install...' && npm install && echo 'Running build...' && npm run build && echo 'Restarting PM2...' && pm2 restart land-app"

echo.
echo 4. Cleaning up...
del update.tar

echo.
echo ==============================================
echo  Deployment Finished!
echo ==============================================
