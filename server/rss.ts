import { type IStorage } from "./storage";

function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
}

function toRfc822Date(rawDate: any): string {
  try {
    const d = rawDate ? new Date(rawDate) : new Date();
    if (!isNaN(d.getTime())) {
      return d.toUTCString();
    }
  } catch (e) {
    // ignore
  }
  return new Date().toUTCString();
}

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
  category?: string;
  author?: string;
}

export async function generateRssXml(storage: IStorage): Promise<string> {
  const baseUrl = "https://leegyver.com";
  const channelTitle = "이가이버부동산";
  const channelLink = baseUrl;
  const channelDesc = "강화도 부동산 전문 중개 - 토지, 주택, 아파트, 상가 매물 및 부동산 최신 뉴스 정보";
  const channelPubDate = new Date().toUTCString();

  const items: RssItem[] = [];

  // 1. 최신 부동산 매물 (최대 30개)
  try {
    const properties = await storage.getProperties();
    // 최신 등록/수정순
    const sortedProps = [...properties]
      .filter((p) => p.isVisible !== false && p.isActive !== false)
      .sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      })
      .slice(0, 30);

    for (const prop of sortedProps) {
      const propTitle = prop.title || `${prop.district || "강화"} ${prop.type || "부동산"} 매물`;
      const propDesc = prop.description || prop.propertyDescription || `${prop.district || "강화"} 매물 상세 정보`;
      const cleanDesc = stripHtml(propDesc);
      const link = `${baseUrl}/properties/${prop.id}`;
      const pubDate = toRfc822Date(prop.updatedAt || prop.createdAt);

      items.push({
        title: propTitle,
        link,
        guid: link,
        description: cleanDesc,
        pubDate,
        category: prop.type || "부동산매물",
        author: "이가이버부동산",
      });
    }
  } catch (e) {
    console.error("[RSS] Error fetching properties for rss", e);
  }

  // 2. 최신 뉴스 (최대 20개)
  try {
    const newsList = await storage.getNews();
    const sortedNews = [...newsList]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 20);

    for (const news of sortedNews) {
      const link = `${baseUrl}/news/${news.id}`;
      const content = news.content || news.description || news.summary || "";
      const cleanDesc = stripHtml(content);
      const pubDate = toRfc822Date(news.createdAt);

      items.push({
        title: news.title || "부동산 뉴스",
        link,
        guid: link,
        description: cleanDesc,
        pubDate,
        category: news.category || "부동산뉴스",
        author: news.source || "이가이버부동산",
      });
    }
  } catch (e) {
    console.error("[RSS] Error fetching news for rss", e);
  }

  // 3. 커뮤니티 게시글 (최대 10개)
  try {
    const posts = await storage.getPosts();
    const sortedPosts = [...posts]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 10);

    for (const post of sortedPosts) {
      const link = `${baseUrl}/community/${post.id}`;
      const cleanDesc = stripHtml(post.content || "");
      const pubDate = toRfc822Date(post.createdAt);

      items.push({
        title: post.title || "커뮤니티 글",
        link,
        guid: link,
        description: cleanDesc,
        pubDate,
        category: "커뮤니티",
        author: post.authorName || "이가이버부동산",
      });
    }
  } catch (e) {
    console.error("[RSS] Error fetching posts for rss", e);
  }

  // 전체 통합 최신순 정렬 후 상위 50개 유지
  items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  const finalItems = items.slice(0, 50);

  const itemsXml = finalItems
    .map(
      (item) => `    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.guid}</guid>
      <description><![CDATA[${item.description}]]></description>
      <pubDate>${item.pubDate}</pubDate>
      ${item.category ? `<category><![CDATA[${item.category}]]></category>` : ""}
      ${item.author ? `<author><![CDATA[${item.author}]]></author>` : ""}
    </item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${channelTitle}]]></title>
    <link>${channelLink}</link>
    <description><![CDATA[${channelDesc}]]></description>
    <language>ko-kr</language>
    <pubDate>${channelPubDate}</pubDate>
    <lastBuildDate>${channelPubDate}</lastBuildDate>
    <atom:link href="${baseUrl}/rss" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;
}
