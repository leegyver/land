import nodemailer from "nodemailer";

// 네이버 SMTP 서버를 사용한 메일 전송기 설정
const transporter = nodemailer.createTransport({
  host: "smtp.naver.com",
  port: 587,
  secure: false, // true는 포트 465를 사용할 때, false는 다른 포트에서 사용
  auth: {
    user: process.env.NAVER_EMAIL,
    pass: process.env.NAVER_PASSWORD
  }
});

// 이메일 전송 함수
export async function sendEmail(
  to: string, 
  subject: string, 
  htmlContent: string
): Promise<boolean> {
  try {
    if (!process.env.NAVER_EMAIL || !process.env.NAVER_PASSWORD) {
      console.error("네이버 메일 인증 정보가 없습니다.");
      return false;
    }

    const mailOptions = {
      from: process.env.NAVER_EMAIL,
      to,
      subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("이메일 전송 성공:", info.messageId);
    return true;
  } catch (error) {
    console.error("이메일 전송 실패:", error);
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