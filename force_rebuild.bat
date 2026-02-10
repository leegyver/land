@echo off
echo Running Build on Server...
ssh -i deploy_key -o StrictHostKeyChecking=no -p 22 root@1.234.53.82 "cd land && npm run build"
echo.
echo Restarting PM2...
ssh -i deploy_key -o StrictHostKeyChecking=no -p 22 root@1.234.53.82 "pm2 restart land-app"
pause
