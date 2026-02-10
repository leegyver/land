@echo off
echo Testing Public Access...
ssh -i deploy_key -o StrictHostKeyChecking=no -p 22 root@1.234.53.82 "echo '--- HTTP DOMAIN ---' && curl -I http://leegyver.com && echo '--- HTTPS DOMAIN ---' && curl -k -I https://leegyver.com && echo '--- HTTP IP ---' && curl -I http://127.0.0.1"
pause
