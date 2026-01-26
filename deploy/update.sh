#!/bin/bash

# 에러 발생 시 중단
set -e

echo "=== 앱 배포/업데이트 시작 ==="

# 1. 최신 코드 가져오기
echo "1. Git Pull..."
git pull origin main

# 2. 의존성 설치
echo "2. NPM Install..."
npm install

# 3. 빌드 (TypeScript -> JS)
echo "3. Build..."
npm run build

# 4. PM2로 서버 재시작
echo "4. PM2 Reload..."
if pm2 list | grep -q "land-app"; then
    pm2 reload land-app
else
    pm2 start ecosystem.config.cjs
    pm2 save
fi

echo "=== 배포 완료! ==="
