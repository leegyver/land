import { Property, Post } from "@shared/schema";

export interface GeneratedBlogPost {
  title: string;
  content: string;
  tags: string[];
  images: string[];
}

/**
 * Gemini API를 사용하여 매물 데이터를 네이버 블로그 친화적인 글로 재작성
 */
export async function generateBlogPostFromProperty(
  property: Property,
  customInstructions?: string
): Promise<GeneratedBlogPost> {
  const apiKey = process.env.GEMINI_API_KEY;

  // 매물 이미지 목록 취합
  const images: string[] = [];
  if (property.imageUrl) images.push(property.imageUrl);
  if (property.imageUrls) {
    try {
      const parsed = typeof property.imageUrls === 'string' ? JSON.parse(property.imageUrls) : property.imageUrls;
      if (Array.isArray(parsed)) {
        for (const img of parsed) {
          if (img && !images.includes(img)) images.push(img);
        }
      }
    } catch (e) {
      if (typeof property.imageUrls === 'string') {
        property.imageUrls.split(',').forEach(img => {
          const trimmed = img.trim();
          if (trimmed && !images.includes(trimmed)) images.push(trimmed);
        });
      }
    }
  }

  // 매물 상세 정보 문자열 구성
  const propertyDetails = `
[매물 정보]
- 매물명: ${property.title}
- 매물유형: ${property.type || "부동산"}
- 거래유형: ${Array.isArray(property.dealType) ? property.dealType.join(", ") : property.dealType || "매매/임대"}
- 가격: ${property.price || "협의"} (보증금: ${property.deposit || property.depositAmount || "-"} / 월세: ${property.monthlyRent || "-"})
- 소재지: ${property.address || property.district || "위치 문의"}
- 면적: 공급 ${property.supplyArea || property.size || "-"} / 전용 ${property.privateArea || "-"}
- 층수: ${property.floor ? `${property.floor}층` : ""} ${property.totalFloors ? `(총 ${property.totalFloors}층)` : ""} (${property.floorLevel || ""})
- 방/욕실: 방 ${property.bedrooms ?? "-"}개 / 욕실 ${property.bathrooms ?? "-"}개
- 방향: ${property.direction || "남향/채광우수"}
- 엘리베이터: ${property.elevator ? "있음" : "없음"}
- 주차: ${property.parking || "가능"}
- 관리비: ${property.maintenanceFee || "문의"}
- 난방방식: ${property.heatingSystem || "개별난방"}
- 입주가능일/특징: ${property.specialNote || property.description || ""}
- 상세설명: ${property.propertyDescription || ""}
- 중개사/문의: ${property.agentName || "공인중개사사무소"}
  `.trim();

  // Gemini API Key가 있는 경우 AI 호출
  if (apiKey) {
    try {
      return await callGeminiForProperty(propertyDetails, property, images, customInstructions, apiKey);
    } catch (err) {
      console.error("[NaverBlogAI] Gemini API 호출 실패, 스마트 템플릿으로 대체합니다:", err);
    }
  }

  // API Key가 없거나 호출 실패 시 고품질 템플릿 생성기 사용
  return generateTemplateBlogPostFromProperty(property, images);
}

/**
 * Gemini API를 사용하여 커뮤니티 게시글을 네이버 블로그 글로 재작성
 */
export async function generateBlogPostFromPost(
  post: Post,
  customInstructions?: string
): Promise<GeneratedBlogPost> {
  const apiKey = process.env.GEMINI_API_KEY;

  const images: string[] = [];
  if (post.imageUrls && Array.isArray(post.imageUrls)) {
    images.push(...post.imageUrls);
  }

  if (apiKey) {
    try {
      return await callGeminiForPost(post, images, customInstructions, apiKey);
    } catch (err) {
      console.error("[NaverBlogAI] Gemini API 호출 실패, 스마트 템플릿으로 대체합니다:", err);
    }
  }

  return generateTemplateBlogPostFromPost(post, images);
}

/**
 * Gemini API 호출 (매물용)
 */
async function callGeminiForProperty(
  propertyDetails: string,
  property: Property,
  images: string[],
  customInstructions: string | undefined,
  apiKey: string
): Promise<GeneratedBlogPost> {
  const prompt = `
당신은 네이버 블로그에서 수많은 이웃과 소통하며 신뢰를 얻고 있는 베테랑 공인중개사 블로거입니다.
아래 제공된 [매물 정보]를 바탕으로, 네이버 검색 상위 노출에 최적화되고 방문자가 실제로 문의하고 싶게 만드는 매력적인 블로그 포스팅을 작성해주세요.

${propertyDetails}

${customInstructions ? `[추가 요청사항]: ${customInstructions}` : ""}

[작성 가이드라인]
1. 제목: 클릭을 부르는 매력적인 제목 (지역명, 핵심 키워드, 매물 특징 포함, 25~35자 내외)
2. 서론: 친절한 인사말, 최근 해당 지역 부동산 분위기나 계절/날씨 이야기로 시작
3. 본론:
   - 매물의 특장점 3~4가지를 소제목(■ 또는 [소제목])과 함께 친근하게 설명
   - 입지 조건(교통, 학군, 상권, 편의시설) 강조
   - 매물 기본 스펙 요약 (깔끔한 불렛포인트 형식)
4. 결론: 이런 분들께 추천한다는 요약, 방문 예약 및 문의 안내, 따뜻한 마무리 인사
5. 말투: 친절하고 신뢰감 있는 ~해요, ~답니다, ~입니다 체
6. 이모지(✨, 🏠, 🌿, 📍, 📞 등)를 적절히 활용하여 가독성을 높여주세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 설명은 포함하지 마세요:
{
  "title": "블로그 제목",
  "content": "블로그 전체 본문 텍스트 (줄바꿈 포함)",
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5", "태그6", "태그7", "태그8", "태그9", "태그10"]
}
  `.trim();

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7
      }
    })
  });

  if (!res.ok) {
    throw new Error(`Gemini API Error: ${res.status} ${await res.text()}`);
  }

  const data: any = await res.json();
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResponse) throw new Error("Empty response from Gemini");

  const parsed = JSON.parse(textResponse);
  return {
    title: parsed.title || `${property.district || ""} ${property.title} 매물 안내`,
    content: parsed.content || "",
    tags: Array.isArray(parsed.tags) ? parsed.tags : [`${property.district}부동산`, `${property.type}`, "부동산매물"],
    images
  };
}

/**
 * Gemini API 호출 (커뮤니티 글용)
 */
async function callGeminiForPost(
  post: Post,
  images: string[],
  customInstructions: string | undefined,
  apiKey: string
): Promise<GeneratedBlogPost> {
  const prompt = `
당신은 네이버 블로그 전문 에디터입니다. 아래 홈페이지 커뮤니티 글을 읽고, 네이버 블로그에 맞게 풍성하고 가독성 좋은 포스팅으로 재작성해주세요.

[원문 제목]: ${post.title}
[원문 내용]:
${post.content}

${customInstructions ? `[추가 요청사항]: ${customInstructions}` : ""}

반드시 아래 JSON 형식으로만 응답하세요:
{
  "title": "네이버 블로그용 매력적인 제목",
  "content": "재작성된 본문 텍스트",
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"]
}
  `.trim();

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7
      }
    })
  });

  if (!res.ok) {
    throw new Error(`Gemini API Error: ${res.status} ${await res.text()}`);
  }

  const data: any = await res.json();
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResponse) throw new Error("Empty response from Gemini");

  const parsed = JSON.parse(textResponse);
  return {
    title: parsed.title || post.title,
    content: parsed.content || post.content,
    tags: Array.isArray(parsed.tags) ? parsed.tags : ["부동산정보", "부동산소식", "소통", "커뮤니티"],
    images
  };
}

/**
 * API Key가 없을 때 즉시 동작하는 고품질 부동산 블로그 템플릿 생성기
 */
function generateTemplateBlogPostFromProperty(property: Property, images: string[]): GeneratedBlogPost {
  const district = property.district || "인기지역";
  const type = property.type || "매물";
  const price = property.price || "가격협의";
  const title = `[${district}] ${property.title} | ${type} ${price} 실매물 현장 안내✨`;

  const tags = [
    `${district}부동산`,
    `${district}${type}`,
    `${type}매매`,
    `${type}임대`,
    "부동산실매물",
    "내집마련",
    "공인중개사추천",
    `${property.buildingName || district}`,
    "인테리어우수",
    "채광좋은집"
  ].filter(Boolean);

  const content = `안녕하세요! 여러분의 든든한 부동산 파트너입니다. 😊
오늘 소개해드릴 곳은 ${district}에 위치한 강력 추천 매물, **[${property.title}]** 현장입니다!

실제로 임장해보고 실거주 및 투자 가치 모두 꼼꼼하게 검토한 알짜 매물인데요.
사진과 함께 주요 특징을 자세히 살펴보겠습니다. 🌿

━━━━━━━━━━━━━━━━━━━
📍 매물 기본 정보 요약
━━━━━━━━━━━━━━━━━━━
• 매물위치 : ${property.address || district}
• 매물종류 : ${type}
• 거래유형 : ${property.dealType || "매매/임대"}
• 매매/보증금 : ${property.price || property.deposit || "협의"}
${property.monthlyRent ? `• 월세 : ${property.monthlyRent}만원\n` : ""}• 공급/전용면적 : ${property.supplyArea || property.size || "-"} / ${property.privateArea || "-"}
• 해당층/총층 : ${property.floor ? `${property.floor}층` : "-"} / ${property.totalFloors ? `${property.totalFloors}층` : "-"} (${property.floorLevel || ""})
• 방/욕실수 : 방 ${property.bedrooms ?? "-"}개 / 욕실 ${property.bathrooms ?? "-"}개
• 주차여부 : ${property.parking || "가능"}
• 입주가능일 : ${property.specialNote || "즉시입주 가능 (협의)"}

━━━━━━━━━━━━━━━━━━━
✨ 이 매물의 핵심 포인트!
━━━━━━━━━━━━━━━━━━━
1. 우수한 입지와 교통환경
   인근 대중교통 및 생활 편의시설이 잘 갖추어져 있어 생활 만족도가 매우 높습니다.

2. 쾌적한 실내 구조 & 채광
   ${property.direction ? `${property.direction} 방향으로 ` : ""}하루 종일 따뜻한 햇살이 가득하며, 공간 활용도가 뛰어난 구조입니다.

3. 철저한 권리분석 완료
   소유권 및 근저당 등 권리관계를 꼼꼼히 확인하여 안심하고 계약하실 수 있는 안전한 매물입니다.

━━━━━━━━━━━━━━━━━━━
💡 상담 및 현장 방문 안내
━━━━━━━━━━━━━━━━━━━
사진으로 보시는 것보다 실제로 현장을 방문해보시면 훨씬 더 마음에 드실 매물입니다.
해당 매물에 대해 더 궁금하신 점이 있거나 직접 방문을 원하시면 언제든 편하게 문의해주세요!

친절하고 정확하게 안내해 드리겠습니다. 감사합니다! 🏠📞`;

  return {
    title,
    content,
    tags,
    images
  };
}

/**
 * 커뮤니티 글 템플릿 생성기
 */
function generateTemplateBlogPostFromPost(post: Post, images: string[]): GeneratedBlogPost {
  return {
    title: `[소식] ${post.title}`,
    content: `안녕하세요! 오늘의 소식을 전해드립니다. 😊

${post.content}

더 많은 정보와 상담은 언제든 편하게 문의해주세요! 감사합니다. ✨`,
    tags: ["부동산정보", "부동산소식", "소통", "커뮤니티"],
    images
  };
}
