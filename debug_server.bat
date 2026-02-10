@echo off
echo Checking server status...
ssh -i deploy_key -o StrictHostKeyChecking=no -p 22 root@1.234.53.82 "echo '--- PM2 STATUS ---' && pm2 list && echo '' && echo '--- NGINX STATUS ---' && systemctl status nginx --no-pager && echo '' && echo '--- FIREWALL STATUS ---' && ufw status && echo '' && echo '--- LOCALHOST TEST ---' && curl -I http://localhost:5000"
pause
