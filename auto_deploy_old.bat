@echo off
:: 영문 모드로 강제 변경 (한글 입력 방지)
chcp 437 > nul
echo ==============================================
echo  Auto Deploy Script (with Safety Git Backup)
echo ==============================================

echo 0. Backing up to GitHub first...
git add .
git commit -m "Auto-backup before deployment: %date% %time%"
git push origin main
if %errorlevel% neq 0 (
    echo [ERROR] Git push failed. Please resolve conflicts before deploying.
    pause
    exit /b %errorlevel%
)
echo Git backup successful.

echo.
echo 1. Packing files into update.tar...
tar -cvf update.tar client/src server scripts client/public client/index.html tailwind.config.ts vite.config.ts package.json tsconfig.json postcss.config.js

echo.
echo 2. Uploading update.tar to server...
:: Using -i deploy_key for authentication
scp -o StrictHostKeyChecking=no -i deploy_key -P 22 "update.tar" root@1.234.53.82:/root/land/

echo.
echo 3. Executing deployment commands on server...
:: Unpack, Install, Migrate, Build, Restart
ssh -o StrictHostKeyChecking=no -i deploy_key -p 22 root@1.234.53.82 "cd /root/land && tar -xvf update.tar && rm update.tar && echo 'Running Database Migration...' && node scripts/migrate_schema.cjs && echo 'Running npm install...' && npm install --include=dev && echo 'Running build...' && npm run build && echo 'Restarting PM2...' && pm2 restart leegyver-v2"

echo.
echo 4. Cleaning up...
del update.tar

echo.
echo ==============================================
echo  Deployment Finished!
echo ==============================================
