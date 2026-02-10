@echo off
echo Checking Nginx Configuration (leegyver.com)...
ssh -i deploy_key -o StrictHostKeyChecking=no -p 22 root@1.234.53.82 "cat /etc/nginx/sites-enabled/leegyver.com"
pause
