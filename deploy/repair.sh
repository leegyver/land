#!/bin/bash

set -e

echo "=== 서버 환경 복구 및 최적화 스크립트 ==="
echo "이 스크립트는 Cafe24 가상서버 환경에 맞춰 의존성을 처음부터 깔끔하게 다시 설치합니다."

# 1. 기존 모듈 정리 (가장 확실한 방법)
echo "[1/5] 기존 설치된 모듈 정리 중..."
rm -rf node_modules
rm -f package-lock.json

# 2. 필수 빌드 도구 및 라이브러리 설치 (글로벌)
echo "[2/5] 빌드 도구(node-gyp) 및 이미지 라이브러리(libvips) 설치 중..."
npm install -g node-gyp
# sharp 빌드를 위한 필수 시스템 라이브러리
apt-get update
apt-get install -y libvips-dev

# 3. 프로젝트 의존성 설치 (스크립트 실행 방지)
echo "[3/5] 프로젝트 패키지 설치 중 (기반 설치)..."
# sharp 제외하고 설치 시도 (오류 방지)
npm install --ignore-scripts

# 4. Sharp (이미지 처리) 라이브러리 맞춤형 빌드
# 중요: 가상서버 CPU 호환성을 위해 소스코드에서 직접 빌드
echo "[4/5] 서버 CPU에 맞춰 Sharp 라이브러리 직접 빌드 중..."
echo "시간이 조금 걸립니다 (약 1~3분)..."
npm install node-addon-api --save
npm install sharp --build-from-source

# 5. 나머지 스크립트 빌드 및 서버 재시작
echo "[5/5] 앱 빌드 및 재시작..."
npm rebuild
npm run build
pm2 restart ecosystem.config.cjs --update-env

echo "=== 복구 완료! ==="
echo "이제 정상적으로 작동해야 합니다. pm2 list 명령어로 status가 online인지 확인하세요."
