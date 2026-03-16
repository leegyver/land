@echo off
:: 영문 모드로 강제 변경
chcp 437 > nul
echo ==============================================
echo  Auto Git Backup Utility
echo ==============================================

echo 1. Adding changes...
git add .

echo 2. Committing changes...
set /p msg="Enter commit message (or press enter for default): "
if "%msg%"=="" set msg="Manual backup: %date% %time%"
git commit -m "%msg%"

echo 3. Pushing to GitHub...
git push origin main

if %errorlevel% equ 0 (
    echo.
    echo ==============================================
    echo  Backup Successful!
    echo ==============================================
) else (
    echo.
    echo [ERROR] Backup failed. Check connection or conflicts.
)
pause
