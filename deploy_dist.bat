@echo off
:: 영문 모드로 강제 변경 (한글 입력 방지)
chcp 437 > nul
echo ==============================================
echo  Deploy Dist Script (Upload Local Build)
echo ==============================================

echo 1. Building project locally...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed! Exiting...
    pause
    exit /b %errorlevel%
)

echo.
echo 2. Packing dist folder into dist.tar...
tar -cvf dist.tar dist

echo.
echo 3. Uploading dist.tar to server...
scp -o StrictHostKeyChecking=no -i deploy_key -P 22 "dist.tar" root@1.234.53.82:/root/land/

echo.
echo 4. Unpacking and Restarting on server...
ssh -o StrictHostKeyChecking=no -i deploy_key -p 22 root@1.234.53.82 "cd /root/land && rm -rf dist_backup && mv dist dist_backup && tar -xvf dist.tar && rm dist.tar && echo 'Restarting PM2...' && pm2 restart land-app"

echo.
echo 5. Cleaning up local archive...
del dist.tar

echo.
echo ==============================================
echo  Deployment Finished!
echo ==============================================
