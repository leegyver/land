import { type IStorage } from "./storage";

function escapeHtml(str: any): string {
  if (str === null || str === undefined) return "";
  const s = typeof str === "string" ? str : String(str);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(str: any): string {
  if (str === null || str === undefined) return "";
  const s = typeof str === "string" ? str : String(str);
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function stripHtml(html: any): string {
  if (!html) return "";
  const s = typeof html === "string" ? html : String(html);
  return s
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function formatKoreanPrice(price: string | number | null | undefined): string {
  if (price === null || price === undefined || price === "") return "";
  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice === 0) return String(price);

  const billion = 100000000;
  const tenThousand = 10000;

  if (numPrice >= billion) {
    const uk = Math.floor(numPrice / billion);
    const rest = numPrice % billion;
    if (rest === 0) return `${uk}억원`;
    const man = Math.floor(rest / tenThousand);
    if (man > 0) return `${uk}억 ${man.toLocaleString()}만원`;
    return `${uk}억원`;
  } else if (numPrice >= tenThousand) {
    const man = Math.floor(numPrice / tenThousand);
    return `${man.toLocaleString()}만원`;
  }
  return numPrice.toLocaleString() + "원";
}

export interface SeoMetadata {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  keywords?: string;
  canonicalUrl: string;
  imageUrl: string;
  imageWidth?: number;
  imageHeight?: number;
  imageAlt?: string;
  type?: string;
  noIndex?: boolean;
  structuredDataJson?: string;
  initialBodyHtml?: string;
}

const CATEGORY_MAP: Record<string, string> = {
  qa: "궁금해요 부동산",
  architecture: "건축과 리모델링",
  stories: "강화도 이야기",
  free: "자유게시판",
};

async function buildHomePrerenderHtml(storage: IStorage): Promise<string> {
  let propertyRows = "";
  try {
    const props = await storage.getProperties();
    const visibleProps = props.filter(p => p.isVisible !== false && p.isActive !== false).slice(0, 15);
    propertyRows = visibleProps.map(p => {
      const priceText = formatKoreanPrice(p.price) || String(p.price || "협의");
      const desc = stripHtml(p.propertyDescription || p.description || "").slice(0, 140);
      return `
        <li style="margin-bottom: 16px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; list-style: none; background: #ffffff;">
          <h3 style="font-size: 17px; font-weight: bold; margin: 0 0 6px 0;">
            <a href="/properties/${p.id}" style="color: #1d4ed8; text-decoration: none;">[${escapeHtml(p.district || "강화도")} ${escapeHtml(p.type || "부동산")}] ${escapeHtml(p.title)}</a>
          </h3>
          <div style="color: #dc2626; font-weight: bold; margin-bottom: 6px;">매매가: ${escapeHtml(priceText)}</div>
          <div style="font-size: 13px; color: #4b5563; margin-bottom: 8px;">
            <span>위치: 강화군 ${escapeHtml(p.district || "")}</span> | 
            <span>면적: ${escapeHtml(p.size || "-")}</span> | 
            <span>매물유형: ${escapeHtml(p.type || "-")}</span>
          </div>
          <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
            ${escapeHtml(desc || "강화도 실매물 정보입니다. 상세 정보 및 현장 답사는 전화 문의 바랍니다.")}...
          </p>
        </li>
      `;
    }).join("");
  } catch (e) {
    console.error("[SEO] Error building home prerender HTML:", e);
  }

  return `
    <main style="max-width: 960px; margin: 0 auto; padding: 24px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', Roboto, sans-serif; color: #1f2937; line-height: 1.7;">
      <header style="margin-bottom: 28px; border-bottom: 2px solid #2563eb; padding-bottom: 16px;">
        <h1 style="font-size: 26px; font-weight: 800; color: #1e3a8a; margin: 0 0 8px 0;">강화 이가이버 부동산 - 강화도 전원주택·토지·농가주택·상가 전문 중개</h1>
        <p style="font-size: 15px; color: #4b5563; margin: 0;">
          인천광역시 강화도 전 지역(강화읍, 길상면, 화도면, 선원면, 내가면, 양도면, 불은면, 하점면, 삼산면 등)의 엄선된 현장 검증 실매물 정보와 전문 경매·풍수 맞춤 컨설팅을 제공합니다.
        </p>
      </header>

      <section style="margin-bottom: 32px; background: #f8fafc; padding: 20px 24px; border-radius: 10px; border: 1px solid #e2e8f0;">
        <h2 style="font-size: 19px; font-weight: bold; color: #0f172a; margin-top: 0; margin-bottom: 12px;">강화도 부동산 거래 핵심 가이드 & 전문 분석</h2>
        <div style="font-size: 14px; color: #334155; line-height: 1.8;">
          <p style="margin-bottom: 10px;">
            <strong>1. 강화도 토지 매매 시 필수 체크포인트:</strong> 강화도 토지는 계획관리지역, 생산관리지역, 보전관리지역, 농림지역(농업진흥구역·농업보호구역)에 따라 건축 가능한 건폐율과 용적률이 크게 달라집니다. 특히 진입 도로가 사도인지 국공유지인지, 도로 폭이 4m 이상 확보되어 건축허가가 가능한지 여부를 사전 현장 답사를 통해 철저히 검증해야 합니다.
          </p>
          <p style="margin-bottom: 10px;">
            <strong>2. 강화도 전원주택 및 세컨하우스 선정 기준:</strong> 수도권(서울·인천·경기)과의 접근성(강화대교 및 초지대교 인근 생활권)과 더불어 지하수 개발 상태, 상수도 인입 여부, 오수처리시설(정화조) 허가 조건, 향(남향·동남향) 및 조망권을 입체적으로 분석하여 실수요자 맞춤형 주택을 추천해 드립니다.
          </p>
          <p style="margin: 0;">
            <strong>3. 농가주택 및 구옥 매입 유의사항:</strong> 무허가 건축물 대장 유무, 지상권 설정 여부, 경계 침범 여부를 사전 측량 및 공적 장부를 통해 안전하게 확인 후 중개합니다.
          </p>
        </div>
      </section>

      <section style="margin-bottom: 32px;">
        <h2 style="font-size: 20px; font-weight: bold; color: #1e3a8a; margin-bottom: 16px; border-left: 4px solid #2563eb; padding-left: 10px;">
          실시간 추천 확인 매물 리스트
        </h2>
        <ul style="padding: 0; margin: 0;">
          ${propertyRows || "<p>현재 추천 매물을 조회하고 있습니다.</p>"}
        </ul>
      </section>

      <section style="margin-bottom: 32px; background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
        <h2 style="font-size: 19px; font-weight: bold; color: #111827; margin-top: 0; margin-bottom: 14px;">강화도 주요 읍·면별 지역 특성 안내</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; font-size: 13px; color: #4b5563;">
          <div style="padding: 12px; background: #f9fafb; border-radius: 8px;">
            <strong style="color: #1e40af; font-size: 14px;">강화읍 / 선원면</strong>
            <p style="margin: 6px 0 0 0;">강화대교 인접, 군청 및 병원·대형마트·학군 등 도시 인프라가 집중되어 편리한 실주거 및 수익형 상가·원룸 수요가 풍부한 지역입니다.</p>
          </div>
          <div style="padding: 12px; background: #f9fafb; border-radius: 8px;">
            <strong style="color: #1e40af; font-size: 14px;">길상면 / 불은면</strong>
            <p style="margin: 6px 0 0 0;">초지대교 진입로 인근으로 김포·인천·서울 출퇴근이 용이하며 온수리 상권과 전원주택 단지가 잘 발달되어 귀촌 1순위로 선호됩니다.</p>
          </div>
          <div style="padding: 12px; background: #f9fafb; border-radius: 8px;">
            <strong style="color: #1e40af; font-size: 14px;">화도면 / 내가면</strong>
            <p style="margin: 6px 0 0 0;">마니산과 동막해수욕장, 고려저수지 등 천혜의 자연경관과 서해 낙조 조망을 품고 있어 카페, 펜션, 휴양형 전원주택 입지로 각광받습니다.</p>
          </div>
          <div style="padding: 12px; background: #f9fafb; border-radius: 8px;">
            <strong style="color: #1e40af; font-size: 14px;">삼산면(석모도) / 교동면</strong>
            <p style="margin: 6px 0 0 0;">석모대교 및 교동대교 개통으로 차량 접근이 자유로우며 온천, 바다 조망, 조용한 전원생활 및 힐링 부지로 높은 가치를 지닙니다.</p>
          </div>
        </div>
      </section>

      <footer style="margin-top: 32px; padding: 20px; background: #f1f5f9; border-radius: 8px; font-size: 13px; color: #64748b; line-height: 1.8;">
        <h3 style="font-size: 14px; font-weight: bold; color: #334155; margin-top: 0; margin-bottom: 8px;">강화 이가이버 공인중개사사무소 안내</h3>
        <div>상호: 이가이버공인중개사사무소 | 소재지: 인천광역시 강화군 강화읍 남문로 51 (남산리 96-1)</div>
        <div>대표전화: 032-934-3120 | 휴대전화: 010-4787-3120 | 전문분야: 토지, 전원주택, 상가, 공장, 경매 컨설팅</div>
        <div style="margin-top: 6px;">Copyright © 이가이버부동산. All rights reserved.</div>
      </footer>
    </main>
  `;
}

async function buildPropertiesPrerenderHtml(storage: IStorage): Promise<string> {
  let propertyRows = "";
  try {
    const props = await storage.getProperties();
    const visibleProps = props.filter(p => p.isVisible !== false && p.isActive !== false);
    propertyRows = visibleProps.map(p => {
      const priceText = formatKoreanPrice(p.price) || String(p.price || "협의");
      const desc = stripHtml(p.propertyDescription || p.description || "").slice(0, 160);
      return `
        <li style="margin-bottom: 16px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; list-style: none; background: #ffffff;">
          <h3 style="font-size: 17px; font-weight: bold; margin: 0 0 6px 0;">
            <a href="/properties/${p.id}" style="color: #1d4ed8; text-decoration: none;">[${escapeHtml(p.district || "강화도")} ${escapeHtml(p.type || "부동산")}] ${escapeHtml(p.title)}</a>
          </h3>
          <div style="color: #dc2626; font-weight: bold; margin-bottom: 6px;">매매가: ${escapeHtml(priceText)}</div>
          <div style="font-size: 13px; color: #4b5563; margin-bottom: 8px;">
            <span>위치: 강화군 ${escapeHtml(p.district || "")}</span> | 
            <span>면적: ${escapeHtml(p.size || "-")}</span> | 
            <span>매물유형: ${escapeHtml(p.type || "-")}</span>
          </div>
          <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
            ${escapeHtml(desc || "강화도 부동산 실매물 정보입니다.")}
          </p>
        </li>
      `;
    }).join("");
  } catch (e) {
    console.error("[SEO] Error building properties prerender HTML:", e);
  }

  return `
    <main style="max-width: 960px; margin: 0 auto; padding: 24px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', Roboto, sans-serif; color: #1f2937; line-height: 1.7;">
      <header style="margin-bottom: 24px; border-bottom: 2px solid #2563eb; padding-bottom: 12px;">
        <h1 style="font-size: 24px; font-weight: bold; color: #1e3a8a; margin: 0 0 8px 0;">강화도 부동산 매물 전체보기 - 토지, 전원주택, 상가, 아파트</h1>
        <p style="font-size: 14px; color: #4b5563; margin: 0;">
          강화도 전 지역 실시간 확인 매물 리스트입니다. 현장 검증을 완료한 정직한 실매물만 등록됩니다.
        </p>
      </header>
      <ul style="padding: 0; margin: 0;">
        ${propertyRows || "<p>등록된 매물이 없습니다.</p>"}
      </ul>
    </main>
  `;
}

function buildAboutPrerenderHtml(): string {
  return `
    <main style="max-width: 960px; margin: 0 auto; padding: 24px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', Roboto, sans-serif; color: #1f2937; line-height: 1.8;">
      <h1 style="font-size: 26px; font-weight: bold; color: #1e3a8a; margin-bottom: 16px; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
        이가이버부동산 소개 - 강화도 No.1 공인중개사사무소
      </h1>
      <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
        강화 이가이버 공인중개사사무소는 인천광역시 강화도 전 지역의 토지, 전원주택, 농가주택, 상가 및 창고를 전문으로 중개하는 신뢰할 수 있는 공인중개사사무소입니다.
      </p>
      <h2 style="font-size: 20px; font-weight: bold; color: #0f172a; margin-top: 24px; margin-bottom: 12px;">주요 업무 및 전문 컨설팅 분야</h2>
      <ul style="padding-left: 20px; color: #4b5563; font-size: 15px;">
        <li>강화도 전 지역 토지(전·답·임야·대지) 개발행위 인허가 및 맞춤 매물 중개</li>
        <li>전원주택, 세컨하우스, 주말농장 부지 실매물 발굴 및 권리분석</li>
        <li>강화도 구옥, 농가주택 리모델링 및 지상권·경계 분쟁 사전 검토</li>
        <li>법원 부동산 경매 권리분석 및 맞춤형 경매 입찰 컨설팅</li>
        <li>풍수지리와 개인 사주를 결합한 명당 터 맞춤 추천 서비스</li>
      </ul>
      <h2 style="font-size: 20px; font-weight: bold; color: #0f172a; margin-top: 24px; margin-bottom: 12px;">사무소 위치 및 연락처</h2>
      <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px; color: #334155;">
        <div><strong>주소:</strong> 인천광역시 강화군 강화읍 남문로 51 (남산리 96-1)</div>
        <div><strong>대표전화:</strong> 032-934-3120 | <strong>휴대전화:</strong> 010-4787-3120</div>
      </div>
    </main>
  `;
}

async function buildCommunityPrerenderHtml(storage: IStorage): Promise<string> {
  let postRows = "";
  try {
    const posts = await storage.getPosts();
    postRows = posts.map(p => {
      const categoryName = (p.category && CATEGORY_MAP[p.category]) ? CATEGORY_MAP[p.category] : "커뮤니티";
      const desc = stripHtml(p.content || "").slice(0, 160);
      return `
        <li style="margin-bottom: 16px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; list-style: none; background: #ffffff;">
          <div style="font-size: 13px; color: #2563eb; font-weight: bold; margin-bottom: 4px;">[${escapeHtml(categoryName)}]</div>
          <h3 style="font-size: 17px; font-weight: bold; margin: 0 0 6px 0;">
            <a href="/community/${p.id}" style="color: #111827; text-decoration: none;">${escapeHtml(p.title)}</a>
          </h3>
          <div style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">
            <span>작성자: ${escapeHtml(p.authorName || "회원")}</span> | <span>등록일: ${escapeHtml(p.createdAt || "-")}</span>
          </div>
          <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
            ${escapeHtml(desc)}...
          </p>
        </li>
      `;
    }).join("");
  } catch (e) {
    console.error("[SEO] Error building community prerender HTML:", e);
  }

  return `
    <main style="max-width: 960px; margin: 0 auto; padding: 24px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', Roboto, sans-serif; color: #1f2937; line-height: 1.7;">
      <header style="margin-bottom: 24px; border-bottom: 2px solid #2563eb; padding-bottom: 12px;">
        <h1 style="font-size: 24px; font-weight: bold; color: #1e3a8a; margin: 0 0 8px 0;">강화도 부동산 커뮤니티 및 정보 소통 공간</h1>
        <p style="font-size: 14px; color: #4b5563; margin: 0;">
          강화도 부동산에 대한 궁금증, 전원주택 건축과 리모델링 노하우, 강화도 생활 이야기와 유용한 정보를 나누는 열린 소통 공간입니다.
        </p>
      </header>

      <section style="margin-bottom: 24px; background: #f8fafc; padding: 16px 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <h2 style="font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 0; margin-bottom: 8px;">커뮤니티 카테고리 안내</h2>
        <div style="font-size: 14px; color: #475569; line-height: 1.6;">
          <span>• <strong>궁금해요 부동산:</strong> 강화도 부동산 거래, 세무, 토지 분할, 인허가 등 전문 상담과 질의응답</span><br/>
          <span>• <strong>건축과 리모델링:</strong> 전원주택 설계·시공 경험담, 구옥 리모델링 비법, 단열 및 정화조 팁 공유</span><br/>
          <span>• <strong>강화도 이야기:</strong> 강화도 맛집, 전원생활 일기, 숨은 명소와 축제 소식</span>
        </div>
      </section>

      <ul style="padding: 0; margin: 0;">
        ${postRows || "<p>등록된 게시글이 없습니다.</p>"}
      </ul>
    </main>
  `;
}

export async function resolveSeoMetadata(
  urlPath: string,
  storage: IStorage
): Promise<SeoMetadata> {
  const cleanPath = urlPath.split("?")[0].split("#")[0];
  const baseUrl = "https://leegyver.com";
  const defaultImage = "https://leegyver.com/images/og-main.jpg";
  const defaultKeywords = "강화도 부동산, 강화도 토지, 강화도 전원주택, 강화도 매물, 이가이버, 이가이버부동산, 강화도 중개, 인천 강화";

  // 0. 관리자/인증/작성 등 비공개 페이지 및 타사 스크랩 뉴스 noindex 처리
  // (607개의 네이버 1줄 요약 뉴스는 구글 애드센스 저품질/스크랩 판정 원인이므로 색인 차단)
  if (
    cleanPath.startsWith("/admin") ||
    cleanPath.startsWith("/auth") ||
    cleanPath.startsWith("/profile") ||
    cleanPath === "/community/new" ||
    cleanPath.startsWith("/community/edit") ||
    cleanPath.startsWith("/news")
  ) {
    return {
      title: "이가이버부동산",
      description: "강화도 부동산 전문 중개 서비스",
      canonicalUrl: `${baseUrl}${cleanPath}`,
      imageUrl: defaultImage,
      noIndex: true,
    };
  }

  // 1. 매물 상세 페이지 (/properties/:id)
  const propertyMatch = cleanPath.match(/^\/properties\/(\d+)$/);
  if (propertyMatch) {
    const id = parseInt(propertyMatch[1], 10);
    try {
      const property = await storage.getProperty(id);
      if (property) {
        const priceFormatted = formatKoreanPrice(property.price);
        const district = property.district || "강화도";
        const type = property.type || "부동산";
        const title = `[${district} ${type}] ${property.title}${priceFormatted ? ` (${priceFormatted})` : ""} | 이가이버부동산`;

        let descParts: string[] = [];
        if (property.district) descParts.push(`위치: 강화군 ${property.district}`);
        if (property.type) descParts.push(`구분: ${property.type}`);
        if (priceFormatted) descParts.push(`가격: ${priceFormatted}`);
        if (property.size) descParts.push(`면적: ${property.size}`);

        const rawContent = property.propertyDescription || property.description || "";
        const cleanContent = stripHtml(rawContent);
        if (cleanContent) {
          descParts.push(cleanContent.slice(0, 120));
        } else {
          descParts.push("강화도 부동산 전문 이가이버부동산의 실시간 확인 추천 매물입니다.");
        }

        const description = descParts.join(" | ");

        let imageUrl = property.imageUrl || defaultImage;
        if (imageUrl && !imageUrl.startsWith("http")) {
          imageUrl = `${baseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
        }

        const structuredData = {
          "@context": "https://schema.org",
          "@type": "RealEstateListing",
          "name": property.title,
          "description": description,
          "url": `${baseUrl}/properties/${property.id}`,
          "image": imageUrl,
          "offers": {
            "@type": "Offer",
            "price": property.price || "0",
            "priceCurrency": "KRW",
            "availability": property.isSold ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
          },
          "address": {
            "@type": "PostalAddress",
            "addressLocality": property.district || "강화군",
            "addressRegion": "인천광역시",
            "addressCountry": "KR",
          },
        };

        const initialBodyHtml = `
          <div style="padding: 24px; max-width: 800px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 12px; color: #111;">${escapeHtml(property.title)}</h1>
            <div style="font-size: 18px; font-weight: bold; color: #e11d48; margin-bottom: 16px;">매매가: ${escapeHtml(priceFormatted || property.price)}</div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #e5e7eb;">
              <tbody>
                <tr style="border-bottom: 1px solid #e5e7eb;"><th style="padding: 10px; text-align: left; background: #f9fafb; width: 120px;">위치</th><td style="padding: 10px;">강화군 ${escapeHtml(property.district)} ${escapeHtml(property.address || "")}</td></tr>
                <tr style="border-bottom: 1px solid #e5e7eb;"><th style="padding: 10px; text-align: left; background: #f9fafb;">매물유형</th><td style="padding: 10px;">${escapeHtml(property.type)}</td></tr>
                <tr style="border-bottom: 1px solid #e5e7eb;"><th style="padding: 10px; text-align: left; background: #f9fafb;">면적</th><td style="padding: 10px;">${escapeHtml(property.size || "-")}</td></tr>
                <tr style="border-bottom: 1px solid #e5e7eb;"><th style="padding: 10px; text-align: left; background: #f9fafb;">방/욕실수</th><td style="padding: 10px;">방 ${property.bedrooms}개 / 욕실 ${property.bathrooms}개</td></tr>
                <tr style="border-bottom: 1px solid #e5e7eb;"><th style="padding: 10px; text-align: left; background: #f9fafb;">중개업소</th><td style="padding: 10px;">이가이버부동산 (032-934-3120 / 010-4787-3120)</td></tr>
              </tbody>
            </table>
            <div style="margin-top: 20px; line-height: 1.8; color: #374151; font-size: 16px;">
              <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">매물 상세 설명</h2>
              <div>${escapeHtml(cleanContent || "강화도 부동산 전문 이가이버부동산의 실매물 정보입니다.")}</div>
            </div>
          </div>
        `;

        return {
          title,
          description,
          keywords: `${property.district} 부동산, ${property.district} ${property.type}, 강화도 ${property.type}, ${property.title}, 이가이버부동산`,
          canonicalUrl: `${baseUrl}/properties/${property.id}`,
          imageUrl,
          imageAlt: property.title,
          type: "article",
          structuredDataJson: JSON.stringify(structuredData),
          initialBodyHtml,
        };
      }
    } catch (e) {
      console.error("[SEO] Error fetching property", e);
    }
  }

  // 2. 뉴스/칼럼 상세 페이지 (/news/:id)
  const newsMatch = cleanPath.match(/^\/news\/(\d+)$/);
  if (newsMatch) {
    const id = parseInt(newsMatch[1], 10);
    try {
      const newsItem = await storage.getNewsById(id);
      if (newsItem) {
        const title = `${newsItem.title} | 강화도 부동산 뉴스 - 이가이버부동산`;
        const cleanContent = stripHtml(newsItem.content || newsItem.summary || "");
        const description = cleanContent.slice(0, 160) || "강화도 부동산 최신 시장 동향 및 유용한 부동산 뉴스 정보를 전해드립니다.";

        let imageUrl = newsItem.imageUrl || defaultImage;
        if (imageUrl && !imageUrl.startsWith("http")) {
          imageUrl = `${baseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
        }

        const structuredData = {
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          "headline": newsItem.title,
          "description": description,
          "image": [imageUrl],
          "datePublished": newsItem.createdAt || new Date().toISOString(),
          "author": {
            "@type": "Organization",
            "name": "이가이버부동산",
          },
          "publisher": {
            "@type": "Organization",
            "name": "이가이버부동산",
            "logo": {
              "@type": "ImageObject",
              "url": defaultImage,
            },
          },
        };

        const initialBodyHtml = `
          <article style="padding: 24px; max-width: 800px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <h1 style="font-size: 26px; font-weight: bold; margin-bottom: 12px; color: #111;">${escapeHtml(newsItem.title)}</h1>
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
              <span>작성: 이가이버부동산</span> · <span>카테고리: ${escapeHtml(newsItem.category || "부동산정보")}</span>
            </div>
            <div style="font-size: 16px; line-height: 1.8; color: #374151;">
              ${escapeHtml(cleanContent)}
            </div>
          </article>
        `;

        return {
          title,
          description,
          keywords: `강화도 뉴스, 강화도 부동산 소식, ${newsItem.title}, 이가이버부동산`,
          canonicalUrl: `${baseUrl}/news/${newsItem.id}`,
          imageUrl,
          imageAlt: newsItem.title,
          type: "article",
          structuredDataJson: JSON.stringify(structuredData),
          initialBodyHtml,
        };
      }
    } catch (e) {
      console.error("[SEO] Error fetching news", e);
    }
  }

  // 3. 커뮤니티 게시글 상세 페이지 (/community/:id)
  const communityMatch = cleanPath.match(/^\/community\/(\d+)$/);
  if (communityMatch) {
    const id = parseInt(communityMatch[1], 10);
    try {
      const post = await storage.getPost(id);
      if (post) {
        const categoryName = (post.category && CATEGORY_MAP[post.category]) ? CATEGORY_MAP[post.category] : "커뮤니티";
        const title = `[${categoryName}] ${post.title} | 강화도 부동산 커뮤니티 - 이가이버부동산`;
        const cleanContent = stripHtml(post.content || "");
        const description = cleanContent.slice(0, 160) || `강화도 부동산 커뮤니티 ${categoryName} 게시글입니다.`;

        let imageUrl = defaultImage;
        if (post.imageUrls) {
          let imgs: string[] = [];
          if (Array.isArray(post.imageUrls)) {
            imgs = post.imageUrls;
          } else if (typeof post.imageUrls === "string") {
            try {
              imgs = JSON.parse(post.imageUrls);
            } catch (err) {
              imgs = [];
            }
          }
          if (imgs.length > 0 && imgs[0]) {
            imageUrl = imgs[0].startsWith("http") ? imgs[0] : `${baseUrl}${imgs[0].startsWith("/") ? "" : "/"}${imgs[0]}`;
          }
        }

        const structuredData = {
          "@context": "https://schema.org",
          "@type": "DiscussionForumPosting",
          "headline": post.title,
          "articleBody": cleanContent,
          "datePublished": String(post.createdAt || new Date().toISOString()),
          "author": {
            "@type": "Person",
            "name": post.authorName || "이가이버 회원",
          },
          "publisher": {
            "@type": "Organization",
            "name": "이가이버부동산",
            "logo": {
              "@type": "ImageObject",
              "url": defaultImage,
            },
          },
        };

        const initialBodyHtml = `
          <article style="padding: 24px; max-width: 800px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="font-size: 14px; color: #3b82f6; font-weight: bold; margin-bottom: 6px;">[${escapeHtml(categoryName)}]</div>
            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 12px; color: #111;">${escapeHtml(post.title)}</h1>
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
              <span>작성자: ${escapeHtml(post.authorName || "회원")}</span> · <span>등록일: ${escapeHtml(post.createdAt || "-")}</span> · <span>조회수: ${post.viewCount || 0}</span>
            </div>
            <div style="font-size: 16px; line-height: 1.8; color: #374151;">
              ${escapeHtml(cleanContent)}
            </div>
          </article>
        `;

        return {
          title,
          description,
          keywords: `강화도 커뮤니티, ${categoryName}, ${post.title}, 강화도 부동산, 이가이버부동산`,
          canonicalUrl: `${baseUrl}/community/${post.id}`,
          imageUrl,
          imageAlt: post.title,
          type: "article",
          structuredDataJson: JSON.stringify(structuredData),
          initialBodyHtml,
        };
      }
    } catch (e) {
      console.error("[SEO] Error fetching community post", e);
    }
  }

  // 4. 고정 주요 페이지별 맞춤 메타데이터
  switch (cleanPath) {
    case "/properties":
      return {
        title: "강화도 부동산 매물 전체보기 - 토지, 전원주택, 상가, 아파트 | 이가이버부동산",
        description: "강화도 전 지역(강화읍, 길상면, 화도면, 선원면, 내가면 등) 추천 부동산 매물. 토지, 전원주택, 농가주택, 상가 실시간 매물 정보를 확인하세요.",
        canonicalUrl: `${baseUrl}/properties`,
        imageUrl: defaultImage,
        keywords: "강화도 토지 매매, 강화도 전원주택 매매, 강화도 농가주택, 강화도 부동산 매물, 이가이버부동산",
        initialBodyHtml: await buildPropertiesPrerenderHtml(storage),
      };

    case "/news":
      return {
        title: "강화도 부동산 소식 및 정보 | 이가이버부동산",
        description: "강화도 부동산 정보입니다.",
        canonicalUrl: `${baseUrl}/news`,
        imageUrl: defaultImage,
        noIndex: true,
      };

    case "/community":
      return {
        title: "강화도 부동산 커뮤니티 및 소통 공간 | 이가이버부동산",
        description: "강화도 생활 정보, 전원생활 후기, 건축/리모델링 노하우, 부동산 질문과 답변을 함께 나누는 소통 공간입니다.",
        canonicalUrl: `${baseUrl}/community`,
        imageUrl: defaultImage,
        keywords: "강화도 커뮤니티, 강화도 전원생활, 강화도 전원주택 건축, 강화도 부동산 질문",
        initialBodyHtml: await buildCommunityPrerenderHtml(storage),
      };

    case "/reviews":
      return {
        title: "이가이버부동산 고객 이용 후기 및 계약 리뷰",
        description: "강화도 토지, 전원주택, 농가주택 매매 거래 고객님들의 생생한 실제 계약 후기와 고객 만족도 리뷰를 확인하세요.",
        canonicalUrl: `${baseUrl}/reviews`,
        imageUrl: defaultImage,
        keywords: "강화도 부동산 후기, 이가이버부동산 후기, 강화도 전원주택 매매 후기",
      };

    case "/saju":
      return {
        title: "강화도 부동산 풍수·사주 맞춤 매물 진단 | 이가이버부동산",
        description: "나에게 꼭 맞는 강화도 명당 터와 방위를 찾아주는 부동산 사주·풍수 맞춤 매물 분석 및 추천 서비스입니다.",
        canonicalUrl: `${baseUrl}/saju`,
        imageUrl: defaultImage,
        keywords: "부동산 사주, 부동산 풍수지리, 강화도 명당, 나에게 맞는 집",
      };

    case "/about":
      return {
        title: "이가이버부동산 소개 - 강화도 No.1 공인중개사사무소",
        description: "정직과 신뢰를 바탕으로 강화도 전 지역 토지, 전원주택, 상가 중개 및 맞춤형 컨설팅을 제공하는 이가이버부동산입니다.",
        canonicalUrl: `${baseUrl}/about`,
        imageUrl: defaultImage,
        initialBodyHtml: buildAboutPrerenderHtml(),
      };

    case "/contact":
      return {
        title: "매물 문의 및 방문 예약 상담 | 이가이버부동산",
        description: "강화도 부동산 매물 접수, 매수 상담, 현장 답사 예약. 친절하고 정확하게 상담해 드립니다. 전화: 032-934-3120",
        canonicalUrl: `${baseUrl}/contact`,
        imageUrl: defaultImage,
      };

    case "/pricing":
      return {
        title: "중개 수수료 및 서비스 안내 | 이가이버부동산",
        description: "이가이버부동산의 중개 보수 요율 및 특별 매물 홍보 컨설팅 서비스 안내입니다.",
        canonicalUrl: `${baseUrl}/pricing`,
        imageUrl: defaultImage,
      };

    case "/youtube":
      return {
        title: "이가이버 유튜브 부동산 영상 매물 | 이가이버부동산",
        description: "영상으로 생생하게 확인하는 강화도 토지, 전원주택 추천 매물 현장 임장 영상 및 분석 자료입니다.",
        canonicalUrl: `${baseUrl}/youtube`,
        imageUrl: defaultImage,
      };

    case "/privacy":
      return {
        title: "개인정보처리방침 | 이가이버부동산",
        description: "이가이버부동산의 개인정보 수집, 이용 및 보호 정책에 관한 안내입니다.",
        canonicalUrl: `${baseUrl}/privacy`,
        imageUrl: defaultImage,
      };

    case "/terms":
      return {
        title: "이용약관 | 이가이버부동산",
        description: "이가이버부동산 서비스 이용약관 안내입니다.",
        canonicalUrl: `${baseUrl}/terms`,
        imageUrl: defaultImage,
      };

    default:
      // 홈 / 메인 페이지
      return {
        title: "강화 이가이버 부동산 - 강화도 주택·상가·토지 매매/임대 전문 & 전문 경매 컨설팅",
        description: "강화도 전 지역 전원주택, 토지, 구옥/농가주택 실매물 정보. 현장 검증을 거친 정직한 매물과 매매·임대 실시간 맞춤 상담을 제공합니다.",
        ogTitle: "강화도 부동산 이가이버 - 전원주택·토지 매매/임대 전문 & 경매 컨설팅",
        ogDescription: "강화도 전 지역 전원주택, 토지, 농가주택 맞춤물건발굴 및 친절·정확한 전문 중개 상담",
        keywords: defaultKeywords + ", 강화도 경매",
        canonicalUrl: baseUrl,
        imageUrl: defaultImage,
        imageWidth: 1200,
        imageHeight: 670,
        imageAlt: "강화도 부동산 이가이버 대표이미지",
        initialBodyHtml: await buildHomePrerenderHtml(storage),
      };
  }
}

export async function injectSeoIntoHtml(
  urlPath: string,
  rawHtml: string,
  storage: IStorage
): Promise<string> {
  const seo = await resolveSeoMetadata(urlPath, storage);

  let html = rawHtml;

  // 0. noIndex 처리 (관리자, 로그인 등 비공개 페이지)
  if (seo.noIndex) {
    if (html.includes('name="robots"')) {
      html = html.replace(/<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i, '<meta name="robots" content="noindex, nofollow" />');
    } else {
      html = html.replace("</head>", '  <meta name="robots" content="noindex, nofollow" />\n</head>');
    }
  }

  // 1. Title 교체
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);

  // 2. Meta description 교체
  if (html.includes('name="description"')) {
    html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeAttr(seo.description)}" />`);
  } else {
    html = html.replace("</head>", `  <meta name="description" content="${escapeAttr(seo.description)}" />\n</head>`);
  }

  // 3. Keywords 교체 (있을 경우)
  if (seo.keywords) {
    if (html.includes('name="keywords"')) {
      html = html.replace(/<meta\s+name="keywords"\s+content="[^"]*"\s*\/?>/i, `<meta name="keywords" content="${escapeAttr(seo.keywords)}" />`);
    }
  }

  // 4. Open Graph 태그 교체
  const ogTitle = seo.ogTitle || seo.title;
  const ogDescription = seo.ogDescription || seo.description;

  html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${escapeAttr(ogTitle)}" />`);
  html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${escapeAttr(ogDescription)}" />`);
  html = html.replace(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${escapeAttr(seo.imageUrl)}" />`);
  html = html.replace(/<meta\s+property="og:image:secure_url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:image:secure_url" content="${escapeAttr(seo.imageUrl)}" />`);
  html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${escapeAttr(seo.canonicalUrl)}" />`);
  if (seo.type) {
    html = html.replace(/<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:type" content="${escapeAttr(seo.type)}" />`);
  }

  // 5. Twitter Card 교체
  html = html.replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${escapeAttr(ogTitle)}" />`);
  html = html.replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${escapeAttr(ogDescription)}" />`);
  html = html.replace(/<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:image" content="${escapeAttr(seo.imageUrl)}" />`);
  html = html.replace(/<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:url" content="${escapeAttr(seo.canonicalUrl)}" />`);

  // 6. Canonical URL 교체
  html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${escapeAttr(seo.canonicalUrl)}" />`);

  // 7. Structured Data (JSON-LD) 교체/주입
  if (seo.structuredDataJson) {
    const jsonLdTag = `  <script type="application/ld+json">\n  ${seo.structuredDataJson}\n  </script>`;
    if (html.includes('<script type="application/ld+json">')) {
      html = html.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i, jsonLdTag);
    } else {
      html = html.replace("</head>", `${jsonLdTag}\n</head>`);
    }
  }

  // 8. Crawler & AdSense Pre-rendered Content 주입
  if (seo.initialBodyHtml && html.includes('<div id="root"></div>')) {
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root">${seo.initialBodyHtml}</div><noscript>${seo.initialBodyHtml}</noscript>`
    );
  }

  return html;
}
