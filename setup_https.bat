@echo off
chcp 65001 > nul
echo ==============================================
echo  HTTPS (자물쇠) 보안 설정 마법사
echo ==============================================
echo.
echo [중요] 이 작업은 반드시 사이트 접속이 될 때 실행해야 합니다.
echo 아직 사이트가 안 열린다면, 나중에 실행해주세요!
echo.
pause

echo.
echo [1/2] 설정 스크립트를 서버로 보냅니다.
echo 비밀번호를 입력해주세요...
scp -o StrictHostKeyChecking=no setup_ssl.sh root@1.234.53.82:/root/

echo.
echo [2/2] SSL 인증서를 발급받습니다.
echo 비밀번호를 한번 더 입력해주세요...
ssh -p 22 root@1.234.53.82 "chmod +x /root/setup_ssl.sh && /root/setup_ssl.sh && rm /root/setup_ssl.sh"

echo.
echo ==============================================
echo  작업이 완료되었습니다.
echo  이제 https://leegyver.com 으로 접속해보세요.
echo ==============================================
pause
