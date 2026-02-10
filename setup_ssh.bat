@echo off
chcp 437 > nul
echo ========================================================
echo  SSH Key Setup for Password-less Deployment
echo ========================================================

:: 1. Generate Key (if not exists)
if not exist deploy_key (
    echo [1/3] Generating 'deploy_key'...
    ssh-keygen -t rsa -b 4096 -f deploy_key -N ""
) else (
    echo [1/3] 'deploy_key' already exists. Skipping generation.
)

:: 2. Upload Public Key
echo.
echo [2/3] Uploading key to server...
echo (Please enter your server password)
scp -o StrictHostKeyChecking=no -P 22 deploy_key.pub root@1.234.53.82:~/temp_key.pub

:: 3. Install Key
echo.
echo [3/3] Installing key on server...
echo (Please enter your server password ONE LAST TIME)
ssh -o StrictHostKeyChecking=no -p 22 root@1.234.53.82 "mkdir -p ~/.ssh && cat ~/temp_key.pub >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && rm ~/temp_key.pub"

echo.
echo ========================================================
echo  Setup Complete! 
echo  Now you can use 'deploy_map.bat' without passwords.
echo ========================================================
pause
