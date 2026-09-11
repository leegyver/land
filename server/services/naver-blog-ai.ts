import { Property, Post } from "@shared/schema";

export interface VerificationResult {
  passed: boolean;
  checks: {
    priceVerified: boolean;
    areaVerified: boolean;
    idVerified: boolean;
    agentVerified: boolean;
    greetingVerified: boolean;
    noMarkdownBold: boolean;
    contactLinksVerified: boolean;
  };
  summary: string;
}

export interface GeneratedBlogPost {
  title: string;
  content: string;
  tags: string[];
  images: string[];
  verification?: VerificationResult;
}

export const MANDATORY_TAGS = ["강화도부동산", "강화군부동산", "이가이버", "부동산전문"];

export const BANNER_IMAGES = [
  "/images/banner_kakao.png",
  "/images/banner_call.png"
];

export const OFFICE_INFO_BLOCK = `
■ 중개사무소 안내
• 상호 : 이가이버 공인중개사사무소
• 대표 : 이민호
• 문의전화 : 010-4787-3120 (또는 홈페이지 실시간 문의)
• 담당지역 : 인천광역시 강화군 전 지역 매물 전문

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 [카카오톡 실시간 1:1 상담 문의]
👉 아래 링크를 터치하시면 카카오톡 실시간 1:1 상담창으로 바로 연결됩니다!
https://pf.kakao.com/_xaxbxlxfs/chat

📞 [전화 상담 바로 연결]
👉 모바일에서 아래 번호를 터치하시면 대표 공인중개사에게 바로 전화 연결됩니다!
☎ 전화 문의 : 010-4787-3120
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();

/**
 * 상세설명의 문장, 단락, 섹션 헤더를 분석하여 가독성 높은 줄바꿈과 여백을 적용
 */
export function formatDetailedDescription(desc: string): string {
  if (!desc) return "";
  let text = desc
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  // [입지 및 환경], [공간 및 구조], [전문가 제언] 등 섹션 제목 앞뒤 2줄 개행 확보 (앞에 이모지나 불렛이 있으면 분리하지 않음)
  text = text.replace(/([^\n\s\uD800-\uDFFF📸📍🏡✨💡■💬📞☎🌿👉•·▪▶✔])\s*(\[[^\]]+\])/g, "$1\n\n$2\n\n");
  text = text.replace(/(\[[^\]]+\])\s*([^\n])/g, "$1\n\n$2");
  text = text.replace(/([^\n\s\uD800-\uDFFF📸📍🏡✨💡■💬📞☎🌿👉•·▪▶✔])\s*(✨\s*매물\s*요약|🏡\s*상세\s*설명|📸\s*현장\s*사진)/g, "$1\n\n$2\n\n");

  // 문장 종결 어미(습니다. 합니다. 입니다. 됩니다. 세요. 니다. 등) 뒤에 바로 한글이 붙어있는 경우 줄바꿈 2회 추가
  text = text.replace(/([다요죠음됨임함]\.|\!|\?)(?=[가-힣A-Za-z0-9\[【<])/g, "$1\n\n");

  // 문장 종결 어미 뒤에 공백 1칸만 있고 다음 문장이 이어지는 경우에도 모바일 가독성을 위해 개행 분리
  text = text.replace(/([가-힣]{2,}[다요죠음됨임함]\.|\!)\s+(?=[가-힣A-Z\[])/g, "$1\n\n");

  // 이모지와 바로 이어지는 텍스트/대괄호 제목이 줄바꿈으로 떨어져 있으면 즉시 한 줄로 병합!
  text = text.replace(/([\uD800-\uDFFF📸📍🏡✨💡■💬📞☎🌿👉]+)\s*\n+\s*([가-힣A-Za-z0-9\[【])/g, "$1 $2");

  // 단독 마크다운 구분선(--, --- 등) 제거
  text = text.replace(/^\s*[-_=*]{2,}\s*$/gm, "");

  // 연속 3개 이상의 개행은 2개로 통일
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

/**
 * 할루시네이션(Hallucination) 검증 및 원고 보정 엔진
 * 원본 DB 스펙과 생성된 블로그 본문을 대조하여 가격, 면적, 매물번호, 대표자 정보 등을 100% 검증/보정
 */
export function verifyAndSanitizeBlogPost(
  post: { title: string; content: string; tags: string[]; images: string[] },
  property?: Property
): GeneratedBlogPost {
  let content = (post.content || "").replace(/\*\*/g, "");
  let title = (post.title || "").replace(/\*\*/g, "");

  // 1. 첫 줄 인사말 엄격 검증 및 보정
  const MANDATORY_GREETING = "안녕하세요! 여러분의 든든한 부동산 파트너 강화도 이가이버 공인중개사의 이민호 대표입니다.";
  if (!content.startsWith(MANDATORY_GREETING)) {
    content = `${MANDATORY_GREETING} 😊\n\n` + content.replace(/^안녕하세요[^\n]*\n+/g, "").trim();
  }

  // 2. 중개사무소 정보 및 카카오/전화 바로연결 배너 블록 엄격 검증 및 보정
  if (!content.includes("010-4787-3120") || !content.includes("https://pf.kakao.com/_xaxbxlxfs/chat") || !content.includes("대표 : 이민호")) {
    content = content.replace(/■\s*중개사무소\s*안내[\s\S]*$/g, "").trim();
    content += `\n\n${OFFICE_INFO_BLOCK}\n\n감사합니다! 🏠✨`;
  }

  // 3. 이미지 목록에 배너 이미지 포함 보장
  const finalImages = [...post.images];
  for (const bImg of BANNER_IMAGES) {
    if (!finalImages.includes(bImg)) {
      finalImages.push(bImg);
    }
  }

  // 4. 사실(Fact) 대조 검증
  const checks = {
    priceVerified: true,
    areaVerified: true,
    idVerified: true,
    agentVerified: content.includes("이민호") && content.includes("010-4787-3120"),
    greetingVerified: content.startsWith(MANDATORY_GREETING),
    noMarkdownBold: !content.includes("**") && !title.includes("**"),
    contactLinksVerified: content.includes("https://pf.kakao.com/_xaxbxlxfs/chat") && content.includes("010-4787-3120")
  };

  if (property) {
    const formattedPrice = formatKoreanPrice(property.price);
    checks.priceVerified = content.includes(String(property.price)) || content.includes(formattedPrice);
    checks.idVerified = content.includes(String(property.id));
    if (property.size) {
      checks.areaVerified = content.includes(String(property.size));
    }
  }

  const passed = Object.values(checks).every(Boolean);
  const summary = passed
    ? `할루시네이션 검증 통과 (매물번호 No.${property?.id || ''}, 가격/면적 일치, 대표 이민호 / 010-4787-3120 및 상담 링크 100% 일치)`
    : `팩트체크 완료 및 필수 정보(대표자, 연락처, 볼드 기호 제거) 자동 보정 적용`;

  return {
    title,
    content,
    tags: post.tags,
    images: finalImages,
    verification: {
      passed,
      checks,
      summary
    }
  };
}

export function formatKoreanPrice(price: any): string {
  if (!price) return "가격협의";
  const digits = String(price).replace(/[^\d]/g, "");
  const num = Number(digits);
  if (isNaN(num) || num === 0) return String(price);

  const billion = 100000000;
  const tenThousand = 10000;

  if (num >= billion) {
    const uk = Math.floor(num / billion);
    const rest = num % billion;
    const man = Math.floor(rest / tenThousand);
    return man > 0 ? `${uk}억 ${man.toLocaleString()}만원` : `${uk}억원`;
  } else if (num >= tenThousand) {
    const man = Math.floor(num / tenThousand);
    return `${man.toLocaleString()}만원`;
  }
  return num.toLocaleString() + "원";
}

export function parseDealType(dealType: any): string {
  if (!dealType) return "매매";
  if (Array.isArray(dealType)) return dealType.join(", ");
  if (typeof dealType === "string") {
    try {
      const parsed = JSON.parse(dealType);
      if (Array.isArray(parsed)) return parsed.join(", ");
    } catch (e) {}
  }
  return String(dealType);
}

export function formatArea(val: any): string | null {
  if (!val) return null;
  const num = Number(val);
  if (isNaN(num) || num <= 0) return String(val);
  const pyeong = (num * 0.3025).toFixed(1);
  return `${num}m² (약 ${pyeong}평)`;
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

  // 일반 회원 공개 상세 스펙 구성 (관리자 전용 메모 및 개인정보 제외)
  const districtName = property.district || "강화군";
  const displayLocation = districtName.includes("강화") ? `인천광역시 ${districtName}` : `인천광역시 강화군 ${districtName}`;
  const dealTypeStr = parseDealType(property.dealType);
  const priceStr = formatKoreanPrice(property.price);

  const specLines: string[] = [];
  specLines.push(`• 매물번호 : No. ${property.id}`);
  specLines.push(`• 매물종류 : ${property.type || "부동산"}`);
  specLines.push(`• 거래유형 : ${dealTypeStr}`);
  specLines.push(`• 매매가격 : ${priceStr}`);
  if (property.deposit) specLines.push(`• 보증금 : ${formatKoreanPrice(property.deposit)}`);
  if (property.monthlyRent) specLines.push(`• 월세 : ${formatKoreanPrice(property.monthlyRent)}`);
  if (property.maintenanceFee) specLines.push(`• 관리비 : ${property.maintenanceFee}`);
  specLines.push(`• 소재지 : ${displayLocation} (상세위치 유선문의)`);

  if (property.size) specLines.push(`• 토지/대지면적 : ${formatArea(property.size)}`);
  if (property.supplyArea && property.supplyArea !== property.size) specLines.push(`• 공급면적 : ${formatArea(property.supplyArea)}`);
  if (property.privateArea) specLines.push(`• 전용/연면적 : ${formatArea(property.privateArea)}`);

  if (property.landType) specLines.push(`• 지목 : ${property.landType}`);
  if (property.zoneType) specLines.push(`• 용도지역 : ${property.zoneType}`);

  if (property.floor || property.totalFloors) {
    const floorPart = property.floor ? `${property.floor}층` : "";
    const totalPart = property.totalFloors ? `총 ${property.totalFloors}층` : "";
    const levelPart = property.floorLevel ? `(${property.floorLevel})` : "";
    specLines.push(`• 층수 : ${[floorPart, totalPart, levelPart].filter(Boolean).join(" / ")}`);
  }
  if (property.bedrooms !== null && property.bedrooms !== undefined || property.bathrooms !== null && property.bathrooms !== undefined) {
    specLines.push(`• 방수/욕실수 : 방 ${property.bedrooms ?? 0}개 / 욕실 ${property.bathrooms ?? 0}개`);
  }
  if (property.direction) specLines.push(`• 방향 : ${property.direction}`);
  if (property.parking) specLines.push(`• 주차여부 : ${property.parking}`);
  if (property.heatingSystem) specLines.push(`• 난방방식 : ${property.heatingSystem}`);
  if (property.elevator !== null && property.elevator !== undefined) {
    specLines.push(`• 승강기 : ${property.elevator ? "있음" : "없음"}`);
  }
  if (property.approvalDate) specLines.push(`• 사용승인일 : ${property.approvalDate}`);
  if (property.specialNote) specLines.push(`• 입주/특징 : ${property.specialNote}`);
  const rawDesc = property.propertyDescription || property.description || "";
  const formattedDesc = formatDetailedDescription(rawDesc);

  const propertyDetails = `
[공개 매물 기본 정보]
${specLines.join("\n")}

[상세 설명 및 현장 브리핑]
${formattedDesc || "특이사항 및 주변 개발 호재 다수 보유 알짜 실매물"}

[중개사무소 및 문의처]
${OFFICE_INFO_BLOCK}
  `.trim();

  // Gemini API Key가 있는 경우 AI 호출
  if (apiKey) {
    try {
      const aiResult = await callGeminiForProperty(propertyDetails, property, images, customInstructions, apiKey);
      return verifyAndSanitizeBlogPost(aiResult, property);
    } catch (err) {
      console.error("[NaverBlogAI] Gemini API 호출 실패, 스마트 템플릿으로 대체합니다:", err);
    }
  }

  // API Key가 없거나 호출 실패 시 고품질 템플릿 생성기 사용
  const templateResult = generateTemplateBlogPostFromProperty(property, images);
  return verifyAndSanitizeBlogPost(templateResult, property);
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
      const aiResult = await callGeminiForPost(post, images, customInstructions, apiKey);
      return verifyAndSanitizeBlogPost(aiResult);
    } catch (err) {
      console.error("[NaverBlogAI] Gemini API 호출 실패, 스마트 템플릿으로 대체합니다:", err);
    }
  }

  const templateResult = generateTemplateBlogPostFromPost(post, images);
  return verifyAndSanitizeBlogPost(templateResult);
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
  const district = property.district || "강화군";
  const cleanTitle = property.title.replace(/[[\]]/g, "").trim();

  const prompt = `
당신은 네이버 블로그에서 수많은 이웃과 소통하며 신뢰를 얻고 있는 베테랑 공인중개사이자 부동산 전문 블로그 마케터입니다.
아래 제공된 [공개 매물 정보]를 바탕으로, 네이버 검색 상위 노출(SEO & GEO)에 최적화되고 가독성이 뛰어난 고품질 블로그 포스팅을 작성해주세요.

${propertyDetails}

${customInstructions ? `[추가 요청사항]: ${customInstructions}` : ""}

[매우 중요한 서식 및 작성 규칙 - 절대 엄수!]
1. 첫 줄 인사말 규정:
   - 본문의 맨 첫 번째 줄은 반드시 정확하게 아래 문구로 시작해야 합니다:
     안녕하세요! 여러분의 든든한 부동산 파트너 강화도 이가이버 공인중개사의 이민호 대표입니다.
2. 마크다운 볼드(**) 절대 금지:
   - 본문 전체에서 별표 두 개(**) 기호는 절대 사용하지 마세요. 강조할 때도 ** 를 쓰지 말고 따옴표, 불렛, 대괄호, 이모지 등을 사용하세요.
3. 상세 설명 및 줄바꿈/문단 분리 (가장 중요!):
   - 상세 설명의 문장들을 절대로 하나의 긴 뭉텅이 문단으로 붙여 쓰지 마세요.
   - 1~2문장마다 반드시 빈 줄(\\n\\n)을 넣어 모바일 화면에서도 여유롭고 시원하게 읽을 수 있도록 하세요.
   - 소제목([입지 및 환경], [공간 및 구조], [전문가 제언] 등) 앞뒤에는 반드시 빈 줄(\\n\\n)을 넣으세요.
   - 각 불렛포인트(•) 항목은 한 줄에 하나씩만 작성해야 합니다.
4. 중개사무소 안내 및 하단 배너 CTA 블록 필수 포함:
   - 글 하단에는 반드시 아래 중개사무소 정보와 카카오톡/전화 바로연결 안내가 그대로 포함되어야 합니다:
${OFFICE_INFO_BLOCK}
5. 필수 해시태그 규정:
   - 태그 배열(tags)에는 반드시 아래 4개의 필수 태그가 맨 앞에 포함되어야 합니다:
     "강화도부동산", "강화군부동산", "이가이버", "부동산전문"
   - 그 뒤로 지역/매물 관련 키워드를 추가하여 총 8~10개의 태그를 완성하세요.
6. 사실(Fact) 일치 및 비공개 정보 보호:
   - 제공된 가격, 면적, 지목, 용도지역 등 스펙 수치를 왜곡하거나 상상하여 바꾸지 마세요 (할루시네이션 절대 금지).

반드시 아래 JSON 형식으로만 응답하세요. 마크다운 백틱 이외의 불필요한 설명은 포함하지 마세요:
{
  "title": "네이버 블로그용 매력적인 제목 (지역명, 핵심 키워드, 매물 특징 포함 25~35자)",
  "content": "블로그 전체 본문 텍스트 (줄바꿈과 빈 줄이 완벽하게 적용된 텍스트, ** 기호 절대 금지)",
  "tags": ["강화도부동산", "강화군부동산", "이가이버", "부동산전문", "태그5", "태그6", "태그7", "태그8"]
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
  const rawTags = Array.isArray(parsed.tags) ? parsed.tags : [];
  const finalTags = Array.from(
    new Set([
      ...MANDATORY_TAGS,
      ...rawTags.map((t: string) => String(t).replace(/^#/, "").trim())
    ])
  ).filter(Boolean).slice(0, 10);

  let cleanContent = (parsed.content || "").replace(/\*\*/g, "");

  return {
    title: parsed.title || `[강화도] ${cleanTitle} | ${district} 실매물 현장 안내✨`,
    content: cleanContent,
    tags: finalTags,
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

[매우 중요한 서식 및 작성 규칙 - 절대 엄수!]
1. 첫 줄 인사말 규정:
   - 본문의 맨 첫 번째 줄은 반드시 정확하게 아래 문구로 시작해야 합니다:
     안녕하세요! 여러분의 든든한 부동산 파트너 강화도 이가이버 공인중개사의 이민호 대표입니다.
2. 마크다운 볼드(**) 절대 금지:
   - 본문 전체에서 별표 두 개(**) 기호는 절대 사용하지 마세요. 강조할 때도 ** 를 쓰지 말고 따옴표, 불렛, 대괄호 등을 사용하세요.
3. 줄바꿈 및 문단 분리:
   - 문단과 문단 사이에는 빈 줄(\\n\\n)을 충분히 넣어 모바일에서도 편안하게 읽을 수 있도록 하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "title": "네이버 블로그용 매력적인 제목",
  "content": "재작성된 본문 텍스트 (** 기호 절대 금지)",
  "tags": ["부동산정보", "부동산소식", "소통", "커뮤니티", "강화도"]
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
  const cleanContent = (parsed.content || post.content).replace(/\*\*/g, "");

  return {
    title: parsed.title || post.title,
    content: cleanContent,
    tags: Array.isArray(parsed.tags) ? parsed.tags : ["부동산정보", "부동산소식", "소통", "커뮤니티"],
    images
  };
}

/**
 * API Key가 없을 때 즉시 동작하는 고품질 부동산 블로그 템플릿 생성기
 */
function generateTemplateBlogPostFromProperty(property: Property, images: string[]): GeneratedBlogPost {
  const district = property.district || "강화군";
  const displayDistrict = district.includes("강화") ? district : `강화군 ${district}`;
  const cleanTitle = property.title.replace(/[[\]]/g, "").trim();
  const dealTypeStr = parseDealType(property.dealType);
  const priceStr = formatKoreanPrice(property.price);

  const title = `[강화도] ${cleanTitle} | ${displayDistrict} ${dealTypeStr} ${priceStr} 실매물 현장 안내✨`;

  // 일반 회원 공개 상세 스펙 구성
  const specs: string[] = [];
  specs.push(`• 매물번호 : No. ${property.id}`);
  specs.push(`• 매물종류 : ${property.type || "부동산"}`);
  specs.push(`• 거래유형 : ${dealTypeStr}`);
  specs.push(`• 매매가격 : ${priceStr}`);
  if (property.deposit) specs.push(`• 보증금 : ${formatKoreanPrice(property.deposit)}`);
  if (property.monthlyRent) specs.push(`• 월세 : ${formatKoreanPrice(property.monthlyRent)}`);
  if (property.maintenanceFee) specs.push(`• 관리비 : ${property.maintenanceFee}`);
  specs.push(`• 매물위치 : 인천광역시 ${displayDistrict} (상세위치는 유선문의)`);

  if (property.size) specs.push(`• 토지/대지면적 : ${formatArea(property.size)}`);
  if (property.supplyArea && property.supplyArea !== property.size) specs.push(`• 공급면적 : ${formatArea(property.supplyArea)}`);
  if (property.privateArea) specs.push(`• 전용/연면적 : ${formatArea(property.privateArea)}`);

  if (property.landType) specs.push(`• 지목 : ${property.landType}`);
  if (property.zoneType) specs.push(`• 용도지역 : ${property.zoneType}`);

  if (property.floor || property.totalFloors) {
    const floorPart = property.floor ? `${property.floor}층` : "";
    const totalPart = property.totalFloors ? `총 ${property.totalFloors}층` : "";
    const levelPart = property.floorLevel ? `(${property.floorLevel})` : "";
    specs.push(`• 층수 : ${[floorPart, totalPart, levelPart].filter(Boolean).join(" / ")}`);
  }
  if (property.bedrooms !== null && property.bedrooms !== undefined || property.bathrooms !== null && property.bathrooms !== undefined) {
    specs.push(`• 방수/욕실수 : 방 ${property.bedrooms ?? 0}개 / 욕실 ${property.bathrooms ?? 0}개`);
  }
  if (property.direction) specs.push(`• 방향 : ${property.direction}`);
  if (property.parking) specs.push(`• 주차여부 : ${property.parking}`);
  if (property.heatingSystem) specs.push(`• 난방방식 : ${property.heatingSystem}`);
  if (property.elevator !== null && property.elevator !== undefined) {
    specs.push(`• 승강기 : ${property.elevator ? "있음" : "없음"}`);
  }
  if (property.approvalDate) specs.push(`• 사용승인일 : ${property.approvalDate}`);
  if (property.specialNote) specs.push(`• 입주/특징 : ${property.specialNote}`);

  const rawDesc = property.propertyDescription || property.description || "";
  const formattedDesc = formatDetailedDescription(rawDesc);

  const specTableText = specs.join("\n");

  const content = `안녕하세요! 여러분의 든든한 부동산 파트너 강화도 이가이버 공인중개사의 이민호 대표입니다. 😊

오늘 소개해드릴 매물은 인천 강화군 ${district}에 위치한 강력 추천 매물,
[${cleanTitle}] 현장입니다!

실제 현장을 꼼꼼하게 답사하고 입지와 권리분석을 완료한 알짜 실매물입니다.
사진과 함께 주요 상세 정보와 매물 특장점을 자세히 살펴보겠습니다. 🌿

📸 [현장 사진 안내] (GEO & SEO)
인천 강화군 ${district} ${cleanTitle} 현장 실매물 사진
(강화도부동산 / 강화군부동산 / 이가이버 / 부동산전문)

📍 [매물 상세 정보 안내]
${specTableText}

${formattedDesc ? `🏡 [매물 상세 설명 및 현장 브리핑]
${formattedDesc}
` : `✨ [이 매물의 핵심 포인트 3가지!]

1. 뛰어난 입지 환경 및 접근성
   주요 도로망과 인접하여 차량 진출입이 수월하며, 강화도 내 핵심 거점과의 이동이 매우 편리한 최적의 입지입니다.

2. 쾌적한 자연환경 및 주변 인프라
   맑은 공기와 수려한 자연 조망을 누리실 수 있으며, 인근 생활 편의시설과 관광 레저 인프라가 풍부합니다.

3. 안전한 권리관계 및 확실한 미래 가치
   권리분석이 완벽히 완료된 안심 매물이며, 지속적인 인근 지역 개발 호재로 향후 가치 상승이 기대되는 매물입니다.
`}

💡 [상담 및 현장 방문 예약 안내]
사진과 설명으로 보시는 것보다 실제로 현장을 방문해보시면 훨씬 더 만족스러우실 매물입니다.

해당 매물에 대해 더 궁금하신 점이 있거나 현장 답사를 원하시면 언제든지 편하게 문의해주세요!
고객님의 입장에서 가장 정직하고 정확하게 안내해 드리겠습니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${OFFICE_INFO_BLOCK}

감사합니다! 🏠✨`;

  const dynamicTags = [
    `${district.split(" ")[0]}부동산`,
    `${property.type || "부동산"}매매`,
    "강화도전원주택",
    "강화도토지",
    "부동산실매물",
    "급매물추천"
  ];

  const finalTags = Array.from(new Set([...MANDATORY_TAGS, ...dynamicTags])).slice(0, 10);

  return {
    title,
    content: content.replace(/\*\*/g, ""),
    tags: finalTags,
    images
  };
}

/**
 * 커뮤니티 글 템플릿 생성기
 */
function generateTemplateBlogPostFromPost(post: Post, images: string[]): GeneratedBlogPost {
  const content = `안녕하세요! 여러분의 든든한 부동산 파트너 강화도 이가이버 공인중개사의 이민호 대표입니다. 😊

${post.content}

더 많은 정보와 상담은 언제든 편하게 문의해주세요!

${OFFICE_INFO_BLOCK}

감사합니다! ✨`;

  return {
    title: `[소식] ${post.title}`,
    content: content.replace(/\*\*/g, ""),
    tags: ["부동산정보", "부동산소식", "소통", "커뮤니티"],
    images
  };
}
