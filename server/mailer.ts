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
    const rawEmail = process.env.NAVER_EMAIL || '';
    // 완전한 이메일 주소 형식 확인 및 보정
    const naverEmail = rawEmail.includes('@') ? rawEmail : `${rawEmail}@naver.com`;
    
    console.log("보정된 발신자 이메일:", naverEmail);
    
    // 메일 옵션 설정 (RFC 5322 준수를 위한 형식)
    const isMultiple = to.includes(',');
    const mailOptions = {
      from: naverEmail,
      to: isMultiple ? naverEmail : to.trim(),
      bcc: isMultiple ? to.trim() : undefined,
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
  // 메시지에서 첨부 이미지 URL 추출 (/uploads/xxx.jpg 또는 http...)
  const imgMatch = data.message.match(/https?:\/\/[^\s<"']+\.(?:jpg|jpeg|png|webp|gif)|\/uploads\/[^\s<"']+\.(?:jpg|jpeg|png|webp|gif)/i);
  let imageHtml = "";
  if (imgMatch) {
    const rawUrl = imgMatch[0];
    const fullUrl = rawUrl.startsWith("http") ? rawUrl : `https://leegyver.com${rawUrl}`;
    imageHtml = `
      <div style="margin-top: 20px; padding: 15px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
        <div style="font-weight: bold; color: #1e293b; margin-bottom: 8px; font-size: 14px;">📷 현장 첨부 사진</div>
        <a href="${fullUrl}" target="_blank" style="display: inline-block;">
          <img src="${fullUrl}" alt="현장 첨부 사진" style="max-width: 100%; max-height: 400px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); border: 1px solid #cbd5e1;" />
        </a>
        <div style="margin-top: 6px; font-size: 12px; color: #64748b;">
          ※ 사진을 클릭하시면 원본 크기로 크게 확인하실 수 있습니다.
        </div>
      </div>
    `;
  }

  const formattedMessage = data.message.replace(/\n/g, '<br>');

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Malgun Gothic', Dotum, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="border-bottom: 2px solid #f97316; padding-bottom: 12px; margin-bottom: 20px;">
        <span style="background-color: #fff7ed; color: #ea580c; font-size: 12px; font-weight: bold; padding: 3px 8px; rounded: 4px; border: 1px solid #ffedd5;">이가이버부동산 알림</span>
        <h2 style="color: #0f172a; margin: 8px 0 0 0; font-size: 20px; font-weight: 800;">새로운 문의/토탈케어가 접수되었습니다</h2>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 90px; vertical-align: top;"><strong>신청자명</strong></td>
          <td style="padding: 8px 0; color: #0f172a; font-size: 15px; font-weight: bold;">${data.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px; vertical-align: top;"><strong>연락처</strong></td>
          <td style="padding: 8px 0; color: #ea580c; font-size: 16px; font-weight: bold;"><a href="tel:${data.phone}" style="color: #ea580c; text-decoration: none;">${data.phone}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px; vertical-align: top;"><strong>이메일</strong></td>
          <td style="padding: 8px 0; color: #334155; font-size: 14px;">${data.email || '미입력 (전화 문의)'}</td>
        </tr>
      </table>
      
      <div style="margin-bottom: 15px;">
        <strong style="color: #334155; font-size: 14px; display: block; margin-bottom: 6px;">문의 및 접수 상세 내용:</strong>
        <div style="background-color: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px; line-height: 1.6; color: #1e293b;">
          ${formattedMessage}
        </div>
      </div>
      
      ${imageHtml}
      
      <div style="font-size: 12px; color: #94a3b8; margin-top: 30px; padding-top: 14px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0;">이 이메일은 이가이버부동산(leegyver.com) 시스템에서 자동 발송되었습니다.</p>
      </div>
    </div>
  `;
}

// 1. 회원가입 환영 이메일 템플릿
export function createWelcomeEmailTemplate(data: { username: string; name?: string }): string {
  const displayName = data.name || data.username;
  return `
    <div style="font-family: 'Malgun Gothic', Dotum, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eaeaea; border-radius: 8px; border-top: 5px solid #3b82f6;">
      <h2 style="color: #1e293b; margin-bottom: 20px; font-size: 24px; text-align: center;">🎉 환영합니다!</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
        <strong>${displayName}</strong>님, 이가이버 부동산에 가입해 주셔서 진심으로 감사드립니다.<br/>
        앞으로 강화도의 가장 빠르고 정확한 부동산 소식을 전해드리겠습니다.
      </p>
      
      <div style="margin-top: 30px; padding: 20px; background-color: #f8fafc; border-radius: 6px; text-align: center;">
        <p style="color: #64748b; font-size: 14px; margin: 0;">로그인하여 관심 있는 매물을 찜하고 다양한 소식을 받아보세요!</p>
        <a href="https://leegyver.com" style="display: inline-block; margin-top: 15px; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">홈페이지 바로가기</a>
      </div>
      
      <div style="font-size: 12px; color: #94a3b8; margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p>본 메일은 발신 전용이며, 회신되지 않습니다.<br/>© 이가이버 부동산. All rights reserved.</p>
      </div>
    </div>
  `;
}

// 2. 뉴스레터 구독 환영 이메일 템플릿
export function createNewsletterWelcomeTemplate(data: { email: string }): string {
  return `
    <div style="font-family: 'Malgun Gothic', Dotum, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eaeaea; border-radius: 8px; border-top: 5px solid #10b981;">
      <h2 style="color: #047857; margin-bottom: 20px; font-size: 24px; text-align: center;">📰 뉴스레터 구독 완료!</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
        감사합니다!<br/>
        <strong>${data.email}</strong> 주소로 이가이버 부동산의 알찬 구독 소식이 배달될 예정입니다.
      </p>
      
      <div style="margin-top: 30px; padding: 20px; background-color: #ecfdf5; border-radius: 6px; text-align: center;">
        <p style="color: #059669; font-size: 14px; margin: 0; line-height: 1.5;">매월 강화도 핵심 부동산 정보와 최신 뉴스들을 가장 먼저 받아보실 수 있습니다.</p>
      </div>
      
      <div style="font-size: 12px; color: #94a3b8; margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p>본 메일은 발신 전용이며, 회신되지 않습니다.<br/>© 이가이버 부동산. All rights reserved.</p>
      </div>
    </div>
  `;
}

// 3. 문의 접수 확인 이메일 템플릿
export function createInquiryReceiptTemplate(data: { name: string; title?: string }): string {
  const inquiryContext = data.title ? `'[${data.title}]' 에 대한 ` : "작성하신 ";
  return `
    <div style="font-family: 'Malgun Gothic', Dotum, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eaeaea; border-radius: 8px; border-top: 5px solid #f59e0b;">
      <h2 style="color: #b45309; margin-bottom: 20px; font-size: 24px; text-align: center;">✅ 문의가 정상적으로 접수되었습니다.</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">
        안녕하세요, <strong>${data.name}</strong>님.<br/><br/>
        ${inquiryContext}문의가 성공적으로 접수되었습니다.<br/>
        담당자가 확인 후 입력해주신 연락처로 신속히 답변 드리겠습니다.
      </p>
      
      <div style="margin-top: 30px; padding: 20px; background-color: #fffbeb; border-radius: 6px;">
        <p style="color: #b45309; font-size: 14px; margin: 0;">조금만 대기해주시면 친절하고 정확하게 안내해 드리겠습니다. 감사합니다!</p>
      </div>
      
      <div style="font-size: 12px; color: #94a3b8; margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p>본 메일은 발신 전용이며, 회신되지 않습니다.<br/>© 이가이버 부동산. All rights reserved.</p>
      </div>
    </div>
  `;
}