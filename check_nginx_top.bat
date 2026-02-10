@echo off
echo Checking Nginx Configuration (Top)...
ssh -i deploy_key -o StrictHostKeyChecking=no -p 22 root@1.234.53.82 "head -n 20 /etc/nginx/sites-enabled/leegyver.com"
pause
