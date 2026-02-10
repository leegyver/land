@echo off
echo Checking Server Logs...
ssh -i deploy_key -o StrictHostKeyChecking=no -p 22 root@1.234.53.82 "pm2 logs land-app --lines 100 --nostream"
pause
