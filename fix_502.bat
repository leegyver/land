@echo off
chcp 65001 > nul
echo ==============================================
echo  Server Recovery Script
echo ==============================================

echo 1. Connecting to server to fix issues...
ssh -p 22 root@1.234.53.82 "cd /root/land && echo 'Re-installing dependencies...' && npm install && echo 'Re-building project...' && npm run build && echo 'Restarting application...' && pm2 restart land-app && echo 'Checking status...' && pm2 status land-app"

echo.
echo ==============================================
echo  Recovery process finished.
echo  If the status is 'online', try refreshing your website.
echo  If it says 'errored' or 'stopped', please check logs with:
echo  ssh -p 22 root@1.234.53.82 "pm2 logs land-app --lines 50"
echo ==============================================
pause
