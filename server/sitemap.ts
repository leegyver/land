import { type IStorage } from "./storage";

function formatToIsoDate(rawDate: any, fallbackDate: string): string {
  if (!rawDate) return fallbackDate;
  try {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
  } catch (e) {
    // Ignore and fallback to regex check
  }

  // YYYY-MM-DD 형태 추출 시도
  const match = String(rawDate).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  return fallbackDate;
}

export async function generateSitemapXml(storage: IStorage): Promise<string> {
  const baseUrl = "https://leegyver.com";
  const today = new Date().toISOString().split("T")[0];

  let urls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [
    { loc: `${baseUrl}/`, lastmod: today, changefreq: "daily", priority: "1.0" },
    { loc: `${baseUrl}/properties`, lastmod: today, changefreq: "daily", priority: "0.9" },
    { loc: `${baseUrl}/community`, lastmod: today, changefreq: "daily", priority: "0.8" },
    { loc: `${baseUrl}/reviews`, lastmod: today, changefreq: "weekly", priority: "0.7" },
    { loc: `${baseUrl}/saju`, lastmod: today, changefreq: "weekly", priority: "0.7" },
    { loc: `${baseUrl}/about`, lastmod: today, changefreq: "weekly", priority: "0.8" },
    { loc: `${baseUrl}/contact`, lastmod: today, changefreq: "monthly", priority: "0.7" },
    { loc: `${baseUrl}/youtube`, lastmod: today, changefreq: "weekly", priority: "0.7" },
  ];

  try {
    const properties = await storage.getProperties();
    for (const prop of properties) {
      if (prop.isVisible !== false && prop.isActive !== false) {
        const lastmod = formatToIsoDate(prop.updatedAt || prop.createdAt, today);
        urls.push({
          loc: `${baseUrl}/properties/${prop.id}`,
          lastmod,
          changefreq: "weekly",
          priority: prop.featured ? "0.9" : "0.8",
        });
      }
    }
  } catch (e) {
    console.error("[Sitemap] Error fetching properties for sitemap", e);
  }

  // NOTE: 타사 네이버 뉴스 검색 자동 수집 페이지(607개)는 1~2줄 단문 요약(Thin/Scraped Content)이므로
  // 구글 애드센스 심사 통과 및 검색 품질을 위해 사이트맵에서 완전 제외합니다.

  try {
    const posts = await storage.getPosts();
    for (const post of posts) {
      const lastmod = formatToIsoDate(post.updatedAt || post.createdAt, today);
      urls.push({
        loc: `${baseUrl}/community/${post.id}`,
        lastmod,
        changefreq: "weekly",
        priority: post.isPinned ? "0.8" : "0.7",
      });
    }
  } catch (e) {
    console.error("[Sitemap] Error fetching community posts for sitemap", e);
  }

  const xmlEntries = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
}
