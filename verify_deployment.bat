@echo off
echo Checking Server File Content...
ssh -i deploy_key -o StrictHostKeyChecking=no -p 22 root@1.234.53.82 "grep -C 5 'resize(400' /root/land/server/routes.ts || echo 'CODE_NOT_FOUND'"
echo.
echo Checking Server Logs...
ssh -i deploy_key -o StrictHostKeyChecking=no -p 22 root@1.234.53.82 "pm2 logs land-app --lines 50 --nostream"
pause
