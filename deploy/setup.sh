#!/bin/bash

# 에러 발생 시 중단
set -e

echo "=== Cafe24 VPS 초기 설정 스크립트 시작 ==="

# 1. 시스템 패키지 업데이트
echo "1. 시스템 패키지 업데이트 중..."
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y curl git build-essential

# 2. Node.js v20 (LTS) 설치
echo "2. Node.js v20 설치 중..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# 3. PM2 설치 (프로세스 관리)
echo "3. PM2 설치 중..."
sudo npm install -g pm2

# 4. Nginx 설치
echo "4. Nginx 설치 중..."
sudo apt-get install -y nginx

# 5. 방화벽 설정 (UFW)
echo "5. 방화벽 설정 중 (SSH, HTTP, HTTPS 허용)..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
# 5000번 포트는 외부에서 직접 접근할 필요 없음 (Nginx가 프록시)
# sudo ufw allow 5000 
echo "y" | sudo ufw enable

echo "=== 기본 프로그램 설치 완료 ==="
echo "다음 단계: 프로젝트 클론 및 설정"
