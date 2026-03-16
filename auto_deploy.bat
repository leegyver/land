@echo off
echo ==============================================
echo  Auto Deploy Script (with Safety Git Backup)
echo ==============================================

echo 0. Backing up to GitHub first...
git add .
git commit -m "Auto-backup before deployment: %date% %time%"
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo Git backup failed! Deployment cancelled for safety.
    exit /b %ERRORLEVEL%
)
echo Git backup successful.

echo 1. Building server...
call node_modules\.bin\esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js --alias:@shared=./shared
if %ERRORLEVEL% NEQ 0 (
    echo Server build failed!
    exit /b %ERRORLEVEL%
)

echo 2. Uploading update.tar to server...
tar -cf update.tar dist package.json server shared scripts
node scripts/deploy_to_production.cjs
if %ERRORLEVEL% NEQ 0 (
    echo Deployment script failed!
    exit /b %ERRORLEVEL%
)

echo 4. Cleaning up...
del update.tar

echo ==============================================
echo  Deployment Finished!
echo ==============================================
