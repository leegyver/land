import { storage } from "./storage";

const KAKAO_CLIENT_ID = process.env.KAKAO_API_KEY || "c10ff047acab69c70dd45f74c8055db0";
const REDIRECT_URI = process.env.NODE_ENV === "production"
  ? "https://leegyver.com/api/admin/kakao/callback"
  : "http://localhost:5000/api/admin/kakao/callback";

// 1. 카카오 인증 인가코드 요청 URL
export function getKakaoAuthUrl(): string {
  const scope = "talk_message";
  return `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scope}`;
}

// 2. 인가코드로 토큰 발급 및 저장
export async function exchangeCodeForTokens(code: string): Promise<{ success: boolean; error?: string }> {
  try {
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("client_id", KAKAO_CLIENT_ID);
    params.append("redirect_uri", REDIRECT_URI);
    params.append("code", code);

    const res = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: params.toString(),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      console.error("카카오 토큰 발급 실패:", data);
      return { success: false, error: data.error_description || data.error };
    }

    // DB에 access_token, refresh_token 저장
    await saveKakaoTokens(data.access_token, data.refresh_token);
    return { success: true };
  } catch (error: any) {
    console.error("카카오 토큰 교환 예외:", error);
    return { success: false, error: error.message };
  }
}

// 토큰 DB 저장
async function saveKakaoTokens(accessToken: string, refreshToken?: string) {
  await storage.setSiteConfig("kakao_alert_access_token", accessToken);
  if (refreshToken) {
    await storage.setSiteConfig("kakao_alert_refresh_token", refreshToken);
  }
  await storage.setSiteConfig("kakao_alert_updated_at", new Date().toISOString());
}

// 토큰 가져오기 (만료 시 자동 갱신)
export async function getValidKakaoAccessToken(): Promise<string | null> {
  const token = await storage.getSiteConfig("kakao_alert_access_token");
  const refreshToken = await storage.getSiteConfig("kakao_alert_refresh_token");

  if (!refreshToken) {
    return token || null;
  }

  // 항상 최신의 안정성을 위해 토큰 갱신 시도
  try {
    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("client_id", KAKAO_CLIENT_ID);
    params.append("refresh_token", refreshToken);

    const res = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: params.toString(),
    });

    const data = await res.json();
    if (res.ok && data.access_token) {
      await saveKakaoTokens(data.access_token, data.refresh_token);
      return data.access_token;
    }
  } catch (e) {
    console.error("카카오 토큰 갱신 오류, 기존 토큰 사용 시도:", e);
  }

  return token || null;
}

// 3. 카카오톡 [나에게 보내기] 메시지 전송 함수
export async function sendKakaoAlertToMe(options: {
  title: string;
  name: string;
  phone: string;
  message: string;
  linkUrl?: string;
  imageUrl?: string;
}): Promise<boolean> {
  try {
    const accessToken = await getValidKakaoAccessToken();
    if (!accessToken) {
      console.log("카카오 알림 미전송: 카카오톡 나에게 보내기 연동이 되어있지 않습니다.");
      return false;
    }

    const targetUrl = options.linkUrl || "https://leegyver.com/admin";

    // 카카오톡 텍스트형 기본 템플릿
    const templateObject = {
      object_type: "text",
      text: `[${options.title}]\n\n👤 고객명: ${options.name}\n📞 연락처: ${options.phone}\n\n📝 접수내용:\n${options.message.length > 200 ? options.message.substring(0, 200) + '...' : options.message}`,
      link: {
        web_url: targetUrl,
        mobile_web_url: targetUrl,
      },
      button_title: "관리자에서 확인하기",
    };

    const res = await fetch("https://kapi.kakao.com/v2/api/talk/memo/default/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `template_object=${encodeURIComponent(JSON.stringify(templateObject))}`,
    });

    const result = await res.json();
    if (res.ok && result.result_code === 0) {
      console.log("✅ 카카오톡 [나에게 보내기] 알림 전송 성공!");
      return true;
    } else {
      console.error("❌ 카카오톡 나에게 보내기 전송 실패:", result);
      return false;
    }
  } catch (error) {
    console.error("카카오톡 메시지 전송 중 예외 발생:", error);
    return false;
  }
}
