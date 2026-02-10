@echo off
echo Restarting server application and checking logs...
ssh -i deploy_key -o StrictHostKeyChecking=no -p 22 root@1.234.53.82 "pm2 restart land-app && sleep 3 && pm2 list && echo '--- ERROR LOGS (Last 50 lines) ---' && pm2 logs land-app --lines 50 --nostream"
pause
