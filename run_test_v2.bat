@echo off
echo Uploading test script v2...
scp -i deploy_key -o StrictHostKeyChecking=no -P 22 test_resize_jimp_v2.js root@1.234.53.82:/root/land/
echo.
echo Running test script v2 on server...
ssh -i deploy_key -o StrictHostKeyChecking=no -p 22 root@1.234.53.82 "cd land && node test_resize_jimp_v2.js"
pause
