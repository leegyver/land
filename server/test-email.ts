import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";

// .env 로드
dotenv.config({ path: path.join(process.cwd(), ".env") });

async function testEmail() {
    console.log("=== 이메일 발송 테스트 시작 ===");

    const user = process.env.NAVER_EMAIL;
    const pass = process.env.NAVER_APP_PASSWORD;

    console.log(`설정된 이메일: ${user ? user : "없음(설정필요)"}`);
    console.log(`설정된 비밀번호: ${pass ? "****** (설정됨)" : "없음(설정필요)"}`);

    if (!user || !pass) {
        console.error("❌ 오류: .env 파일에 NAVER_EMAIL 또는 NAVER_APP_PASSWORD가 없습니다.");
        return;
    }

    const transporter = nodemailer.createTransport({
        host: "smtp.naver.com",
        port: 465,
        secure: true,
        auth: { user, pass }
    });

    try {
        console.log("SMTP 서버 연결 확인 중...");
        await transporter.verify();
        console.log("✅ SMTP 연결 성공!");

        console.log("테스트 이메일 전송 시도...");
        const info = await transporter.sendMail({
            from: user.includes('@') ? user : `${user}@naver.com`,
            to: '9551304@naver.com', // 사장님 이메일
            subject: "[테스트] 이가이버 부동산 이메일 설정 확인",
            text: "이 메일이 도착했다면 이메일 알림 설정이 정상적으로 완료된 것입니다."
        });

        console.log("✅ 이메일 전송 성공!");
        console.log("Message ID:", info.messageId);
        console.log("지금 '9551304@naver.com' 메일함을 확인해보세요.");
    } catch (error) {
        console.error("❌ 이메일 전송 실패:");
        console.error(error);
    }
}

testEmail();
