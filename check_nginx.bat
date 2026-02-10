@echo off
echo Checking Nginx Configuration...
ssh -i deploy_key -o StrictHostKeyChecking=no -p 22 root@1.234.53.82 "ls -l /etc/nginx/sites-enabled/ && echo '--- DEFAULT CONFIG ---' && cat /etc/nginx/sites-enabled/default"
pause
