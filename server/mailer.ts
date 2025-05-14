import nodemailer from "nodemailer";

// 네이버 SMTP 서버를 사용한 메일 전송기 설정
const transporter = nodemailer.createTransport({
  host: "smtp.naver.com",
  port: 465,  // 포트 465로 변경 (SSL/TLS 사용)
  secure: true, // true는 포트 465를 사용할 때, false는 다른 포트에서 사용
  auth: {
    user: process.env.NAVER_EMAIL,
    pass: process.env.NAVER_APP_PASSWORD // 애플리케이션 비밀번호 사용
  },
  debug: true, // 디버깅 모드 활성화
  logger: true // 로깅 활성화
});

// 초기화 시 확인
console.log('SMTP 설정 정보:', {
  host: "smtp.naver.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.NAVER_EMAIL ? "설정됨" : "미설정",
    pass: process.env.NAVER_APP_PASSWORD ? "설정됨" : "미설정"
  }
});

// 이메일 전송 함수
export async function sendEmail(
  to: string, 
  subject: string, 
  htmlContent: string
): Promise<boolean> {
  try {
    console.log("이메일 전송 시도...");
    
    if (!process.env.NAVER_EMAIL || !process.env.NAVER_APP_PASSWORD) {
      console.error("네이버 메일 인증 정보가 없습니다.");
      return false;
    }
    
    // 수신자 이메일 검증
    if (!to || to.trim() === '') {
      console.error("수신자 이메일 주소가 비어있습니다.");
      return false;
    }
    
    console.log(`발신자: ${process.env.NAVER_EMAIL}`);
    console.log(`수신자: ${to}`);
    console.log(`제목: ${subject}`);
    
    // 발신자 이메일 주소 설정 (RFC 5322 형식을 준수)
    const naverEmail = process.env.NAVER_EMAIL || '';
    
    // 이메일 형식 검증
    if (!naverEmail.includes('@')) {
      console.error("발신자 이메일 주소 형식이 올바르지 않습니다:", naverEmail);
      return false;
    }
    
    // 메일 옵션 설정 (RFC 5322 준수를 위한 형식)
    const mailOptions = {
      from: naverEmail, // 단순 이메일 주소만 사용
      to: to.trim(),
      subject,
      html: htmlContent
    };
    
    console.log("SMTP 서버로 전송 중...");
    const info = await transporter.sendMail(mailOptions);
    console.log("이메일 전송 성공:", info);
    return true;
  } catch (error) {
    console.error("이메일 전송 실패 - 상세 오류:", error);
    if (error instanceof Error) {
      console.error("오류 메시지:", error.message);
      console.error("오류 스택:", error.stack);
    }
    return false;
  }
}

// 문의 이메일 템플릿 생성
export function createInquiryEmailTemplate(data: {
  name: string;
  email: string;
  phone: string;
  message: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
      <h2 style="color: #3b82f6; margin-bottom: 20px;">새로운 문의가 등록되었습니다</h2>
      
      <div style="margin-bottom: 15px;">
        <strong>이름:</strong> ${data.name}
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>이메일:</strong> ${data.email}
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>전화번호:</strong> ${data.phone}
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>문의내용:</strong>
        <p style="background-color: #f9f9f9; padding: 10px; border-radius: 4px;">${data.message.replace(/\n/g, '<br>')}</p>
      </div>
      
      <div style="font-size: 12px; color: #666; margin-top: 30px; padding-top: 10px; border-top: 1px solid #e1e1e1;">
        <p>이 이메일은 이가이버부동산 웹사이트의 문의 폼에서 자동으로 전송되었습니다.</p>
      </div>
    </div>
  `;
}