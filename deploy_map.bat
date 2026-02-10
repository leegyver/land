@echo off
:: 영문 모드로 강제 변경 (한글 입력 방지)
chcp 437 > nul
echo ========================================================
echo  Easy Deploy Script for Cafe24
echo  (Reduces password prompts to 2 times)
echo ========================================================

:: 1. Create a temporary archive locally
echo [1/4] Archiving files into deploy.tar...
:: Delete previous tar if exists
if exist deploy.tar del deploy.tar

:: Create tar with ALL files in one go to avoid append issues
:: Note: We exclude database.sqlite to protect live data
tar -cf deploy.tar package.json ecosystem.config.cjs shared\schema.ts server\index.ts server\db.ts server\storage.ts server\auth.ts server\routes.ts server\news-fetcher.ts server\seeder.ts scripts\migrate-firebase-to-sqlite.ts client\index.html client\src\lib\formatter.ts client\src\components\map\KakaoMap.tsx client\src\components\property\PropertyCard.tsx client\src\components\property\PropertyDetail.tsx client\src\components\property\PropertyInquiryBoard.tsx client\src\components\home\PropertySection.tsx client\src\components\home\BannerSlider.tsx client\src\components\admin\BannerColumn.tsx client\src\components\layout\Footer.tsx client\src\pages\HomePage.tsx client\src\pages\PropertiesPage.tsx client\src\pages\PropertyDetailPage.tsx client\src\pages\admin-page-fixed-new.tsx client\src\pages\PropertyForm.jsx

:: 2. Upload the archive (PASSWORD PROMPT #1)
echo.
echo [2/4] Uploading deploy.tar to VPS...
scp -i deploy_key -o StrictHostKeyChecking=no -P 22 deploy.tar root@1.234.53.82:/root/land/

:: 3. Extract and Restart on Server (PASSWORD PROMPT #2)
echo.
echo [3/4] Extracting and Restarting Server...
ssh -i deploy_key -o StrictHostKeyChecking=no -p 22 root@1.234.53.82 "cd /root/land && tar -xf deploy.tar && rm deploy.tar && rm -rf node_modules && npm install && npm run build && (pm2 delete land-app || true) && pm2 start ecosystem.config.cjs"

:: 4. Cleanup
echo.
echo [4/4] Cleaning up local files...
if exist deploy.tar del deploy.tar

echo.
echo ========================================================
echo  Deployment Complete!
echo ========================================================
pause
