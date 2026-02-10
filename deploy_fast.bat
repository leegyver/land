@echo off
:: 영문 모드로 강제 변경 (한글 입력 방지)
chcp 437 > nul
echo ==============================================
echo  Fast Deploy Script (Tar Archive Strategy)
echo ==============================================

echo 1. Packing files into update.tar...
:: Windows 10+ comes with native tar support.
:: We pack all modified files into a single archive.
tar -cvf update.tar client/src server client/public client/index.html tailwind.config.ts vite.config.ts package.json tsconfig.json theme.json postcss.config.js

echo.
echo 2. Uploading update.tar to server (PASSWORD REQUIRED ONCE)...
scp -o StrictHostKeyChecking=no -P 22 "update.tar" root@1.234.53.82:/root/land/

echo.
echo 3. Unpacking on server (PASSWORD REQUIRED TWICE)...
ssh -p 22 root@1.234.53.82 "tar -xvf /root/land/update.tar -C /root/land/ && rm /root/land/update.tar"

echo.
echo 4. Cleaning up local archive...
del update.tar

echo.
echo ==============================================
echo  Deployment Complete!
echo  Don't forget to restart PM2 if you changed backend code:
echo  npm run build ^&^& pm2 restart land-app
echo ==============================================
pause
