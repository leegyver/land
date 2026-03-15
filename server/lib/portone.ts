import fetch from "node-fetch";

const PORTONE_V1_API_URL = "https://api.iamport.kr";
const PORTONE_V2_API_URL = "https://api.portone.io/v2";

export async function getPortOneToken() {
  const impKey = process.env.PORTONE_API_KEY;
  const impSecret = process.env.PORTONE_API_SECRET;

  if (!impKey || !impSecret) {
    throw new Error("PortOne V1 API key or secret is missing.");
  }

  const response = await fetch(`${PORTONE_V1_API_URL}/users/getToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imp_key: impKey,
      imp_secret: impSecret,
    }),
  });

  const data = await response.json() as any;
  if (!response.ok || data.code !== 0) {
    throw new Error(`Failed to get PortOne V1 token: ${data.message || "Unknown error"}`);
  }

  return data.response.access_token;
}

export async function verifyPayment(impUid: string) {
  const STORE_ID = process.env.VITE_PORTONE_STORE_ID || "";
  const isV2 = STORE_ID.startsWith('store-');

  if (isV2) {
    // PortOne V2 검증
    const v2Secret = process.env.PORTONE_V2_API_SECRET;
    if (!v2Secret) {
      throw new Error("PortOne V2 API Secret이 설정되지 않았습니다. (.env의 PORTONE_V2_API_SECRET 확인)");
    }

    const response = await fetch(`${PORTONE_V2_API_URL}/payments/${impUid}`, {
      method: "GET",
      headers: { 
        "Authorization": `PortOne ${v2Secret}`,
        "Content-Type": "application/json"
      },
    });

    const data = await response.json() as any;
    if (!response.ok) {
      throw new Error(`PortOne V2 검증 실패: ${data.message || "알 수 없는 오류"}`);
    }

    // V2 응답 스키마 맞춤 (V1과 호환되도록 필드 매핑)
    return {
      amount: data.amount.total,
      status: data.status === 'PAID' ? 'paid' : data.status.toLowerCase(),
      merchant_uid: data.id,
      ...data
    };
  } else {
    // PortOne V1 (Legacy) 검증
    const accessToken = await getPortOneToken();
    const response = await fetch(`${PORTONE_V1_API_URL}/payments/${impUid}`, {
      method: "GET",
      headers: { "Authorization": accessToken },
    });

    const data = await response.json() as any;
    if (!response.ok || data.code !== 0) {
      throw new Error(`PortOne V1 검증 실패: ${data.message || "알 수 없는 오류"}`);
    }

    return data.response;
  }
}

export async function cancelPayment(paymentId: string, reason: string) {
  const STORE_ID = process.env.VITE_PORTONE_STORE_ID || "";
  const isV2 = STORE_ID.startsWith('store-');

  if (isV2) {
    const v2Secret = process.env.PORTONE_V2_API_SECRET;
    if (!v2Secret) {
      throw new Error("PortOne V2 API Secret이 설정되지 않았습니다.");
    }

    const response = await fetch(`${PORTONE_V2_API_URL}/payments/${paymentId}/cancel`, {
      method: "POST",
      headers: { 
        "Authorization": `PortOne ${v2Secret}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ reason })
    });

    const data = await response.json() as any;
    if (!response.ok) {
      throw new Error(`PortOne V2 취소 실패: ${data.message || "알 수 없는 오류"}`);
    }
    return data;
  } else {
    const accessToken = await getPortOneToken();
    const response = await fetch(`${PORTONE_V1_API_URL}/payments/cancel`, {
      method: "POST",
      headers: { 
        "Authorization": accessToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        imp_uid: paymentId,
        reason: reason
      }),
    });

    const data = await response.json() as any;
    if (!response.ok || data.code !== 0) {
      throw new Error(`PortOne V1 취소 실패: ${data.message || "알 수 없는 오류"}`);
    }
    return data.response;
  }
}
