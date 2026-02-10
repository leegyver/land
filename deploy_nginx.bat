@echo off
echo Deploying Nginx Config...
scp -i deploy_key -o StrictHostKeyChecking=no -P 22 nginx_update.conf root@1.234.53.82:/root/
ssh -i deploy_key -o StrictHostKeyChecking=no -p 22 root@1.234.53.82 "mv /root/nginx_update.conf /etc/nginx/sites-available/leegyver.com && nginx -t && systemctl reload nginx"
echo Done.
pause
