@echo off
chcp 65001 > nul
echo ==============================================
echo  leegyver.com 도메인 자동 연결 마법사
echo ==============================================
echo.
echo [1/2] 설정 파일을 서버로 보냅니다.
echo 비밀번호를 입력해주세요...
scp -o StrictHostKeyChecking=no setup_nginx.sh root@1.234.53.82:/root/

echo.
echo [2/2] 서버 설정을 적용합니다.
echo 비밀번호를 한번 더 입력해주세요...
ssh -p 22 root@1.234.53.82 "chmod +x /root/setup_nginx.sh && /root/setup_nginx.sh && rm /root/setup_nginx.sh"

echo.
echo ==============================================
echo  모든 설정이 완료되었습니다!
echo  이제 도메인 구입처에서 네임서버 연결이 끝나면
echo  http://leegyver.com 으로 접속될 것입니다.
echo ==============================================
pause
