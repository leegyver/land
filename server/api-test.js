// 서버 API 테스트용 스크립트
const fetch = require('node-fetch');

async function testAdminUsers() {
  try {
    // 관리자 로그인 (쿠키 확보)
    const loginRes = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'adminpass'
      })
    });
    
    if (!loginRes.ok) {
      console.error('로그인 실패:', await loginRes.text());
      return;
    }
    
    const cookies = loginRes.headers.raw()['set-cookie'];
    
    // 관리자 API 호출 - 사용자 목록 가져오기
    const usersRes = await fetch('http://localhost:5000/api/admin/users', {
      headers: {
        Cookie: cookies
      }
    });
    
    if (!usersRes.ok) {
      console.error('사용자 목록 가져오기 실패:', await usersRes.text());
      return;
    }
    
    const users = await usersRes.json();
    console.log('사용자 목록 (모든 필드):', users);
    
    // 필드 확인
    if (users.length > 0) {
      console.log('첫 번째 사용자의 모든 필드:', Object.keys(users[0]));
      console.log('전화번호 필드 존재 여부:', users[0].hasOwnProperty('phone'));
      console.log('첫 번째 사용자 전화번호:', users[0].phone);
    }
    
  } catch (error) {
    console.error('API 테스트 오류:', error);
  }
}

testAdminUsers();