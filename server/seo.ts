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

export async function resolveSeoMetadata(
  urlPath: string,
  storage: IStorage
): Promise<SeoMetadata> {
  const cleanPath = urlPath.split("?")[0].split("#")[0];
  const baseUrl = "https://leegyver.com";
  const defaultImage = "https://leegyver.com/images/thumbnail.png";
  const defaultKeywords = "강화도 부동산, 강화도 토지, 강화도 전원주택, 강화도 매물, 이가이버, 이가이버부동산, 강화도 중개, 인천 강화";

  // 0. 관리자/인증/작성 등 비공개 페이지 noindex 처리
  if (
    cleanPath.startsWith("/admin") ||
    cleanPath.startsWith("/auth") ||
    cleanPath.startsWith("/profile") ||
    cleanPath === "/community/new" ||
    cleanPath.startsWith("/community/edit")
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
          "datePublished": newsItem.publishedAt || new Date().toISOString(),
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
      };

    case "/news":
      return {
        title: "강화도 부동산 뉴스 및 최신 동향 | 이가이버부동산",
        description: "강화도 부동산 최신 시장 동향, 개발 호재, 정책 변화 및 유용한 부동산 가이드와 칼럼을 실시간으로 제공합니다.",
        canonicalUrl: `${baseUrl}/news`,
        imageUrl: defaultImage,
        keywords: "강화도 부동산 동향, 강화도 개발 호재, 강화도 부동산 뉴스, 부동산 칼럼",
      };

    case "/community":
      return {
        title: "강화도 부동산 커뮤니티 및 소통 공간 | 이가이버부동산",
        description: "강화도 생활 정보, 전원생활 후기, 건축/리모델링 노하우, 부동산 질문과 답변을 함께 나누는 소통 공간입니다.",
        canonicalUrl: `${baseUrl}/community`,
        imageUrl: defaultImage,
        keywords: "강화도 커뮤니티, 강화도 전원생활, 강화도 전원주택 건축, 강화도 부동산 질문",
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
        title: "이가이버부동산 - 강화도 부동산 전문 중개 (토지, 전원주택, 매물정보)",
        description: "강화도 부동산 전문 중개 - 강화도 전 지역 토지, 전원주택, 농가주택, 상가 매물 정보 및 매매/임대 실시간 상담 서비스를 제공합니다.",
        keywords: defaultKeywords,
        canonicalUrl: baseUrl,
        imageUrl: defaultImage,
        imageWidth: 1200,
        imageHeight: 600,
        imageAlt: "이가이버부동산 대표이미지",
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
  html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${escapeAttr(seo.title)}" />`);
  html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${escapeAttr(seo.description)}" />`);
  html = html.replace(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${escapeAttr(seo.imageUrl)}" />`);
  html = html.replace(/<meta\s+property="og:image:secure_url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:image:secure_url" content="${escapeAttr(seo.imageUrl)}" />`);
  html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${escapeAttr(seo.canonicalUrl)}" />`);
  if (seo.type) {
    html = html.replace(/<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:type" content="${escapeAttr(seo.type)}" />`);
  }

  // 5. Twitter Card 교체
  html = html.replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${escapeAttr(seo.title)}" />`);
  html = html.replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${escapeAttr(seo.description)}" />`);
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
