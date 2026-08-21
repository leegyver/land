import { type IStorage } from "./storage";

export async function generateSitemapXml(storage: IStorage): Promise<string> {
  const baseUrl = "https://leegyver.com";
  const today = new Date().toISOString().split("T")[0];

  let urls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [
    { loc: `${baseUrl}/`, lastmod: today, changefreq: "daily", priority: "1.0" },
    { loc: `${baseUrl}/properties`, lastmod: today, changefreq: "daily", priority: "0.9" },
    { loc: `${baseUrl}/news`, lastmod: today, changefreq: "daily", priority: "0.9" },
    { loc: `${baseUrl}/community`, lastmod: today, changefreq: "daily", priority: "0.8" },
    { loc: `${baseUrl}/reviews`, lastmod: today, changefreq: "weekly", priority: "0.7" },
    { loc: `${baseUrl}/saju`, lastmod: today, changefreq: "weekly", priority: "0.7" },
    { loc: `${baseUrl}/about`, lastmod: today, changefreq: "weekly", priority: "0.7" },
    { loc: `${baseUrl}/contact`, lastmod: today, changefreq: "monthly", priority: "0.6" },
    { loc: `${baseUrl}/youtube`, lastmod: today, changefreq: "weekly", priority: "0.7" },
  ];

  try {
    const properties = await storage.getProperties();
    for (const prop of properties) {
      if (prop.isVisible !== false && prop.isActive !== false) {
        const rawDate = prop.updatedAt || prop.createdAt;
        const lastmod = rawDate ? String(rawDate).split("T")[0].split(" ")[0] : today;
        urls.push({
          loc: `${baseUrl}/properties/${prop.id}`,
          lastmod: lastmod || today,
          changefreq: "weekly",
          priority: prop.featured ? "0.9" : "0.8",
        });
      }
    }
  } catch (e) {
    console.error("[Sitemap] Error fetching properties for sitemap", e);
  }

  try {
    const newsList = await storage.getNews();
    for (const news of newsList) {
      const rawDate = news.publishedAt || news.createdAt;
      const lastmod = rawDate ? String(rawDate).split("T")[0].split(" ")[0] : today;
      urls.push({
        loc: `${baseUrl}/news/${news.id}`,
        lastmod: lastmod || today,
        changefreq: "monthly",
        priority: "0.7",
      });
    }
  } catch (e) {
    console.error("[Sitemap] Error fetching news for sitemap", e);
  }

  try {
    const posts = await storage.getPosts();
    for (const post of posts) {
      const rawDate = post.updatedAt || post.createdAt;
      const lastmod = rawDate ? String(rawDate).split("T")[0].split(" ")[0] : today;
      urls.push({
        loc: `${baseUrl}/community/${post.id}`,
        lastmod: lastmod || today,
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
