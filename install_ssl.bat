@echo off
echo [1/2] Uploading SSL setup script...
scp -i deploy_key -o StrictHostKeyChecking=no -P 22 setup_ssl.sh root@1.234.53.82:/root/land/

echo [2/2] Running SSL installer on server...
ssh -i deploy_key -o StrictHostKeyChecking=no -p 22 root@1.234.53.82 "bash /root/land/setup_ssl.sh"
pause
