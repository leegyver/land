import fetch from 'node-fetch';
import { storage } from '../storage';
import { insertCrawledPropertySchema } from '@shared/schema';

// Naver Land API Headers
const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://m.land.naver.com/",
};

// Ganghwa-gun Full Region Bounds (Approximate)
// West end (Gyodong): 126.25
// East end (Bridge): 126.55
// South end (Mani-san): 37.58
// North end (Checkpoints): 37.80
const GANGHWA_FULL_BOUNDS = {
    minLat: 37.580,
    minLon: 126.250,
    maxLat: 37.800,
    maxLon: 126.550
};

export class NaverCrawler {
    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async fetchAndSave(bounds?: { minLat: number, minLon: number, maxLat: number, maxLon: number }, mode: 'single' | 'grid' = 'single') {
        // Default to a small area around Ganghwa-eup if no bounds provided
        const defaultBounds = {
            minLat: 37.730,
            minLon: 126.470,
            maxLat: 37.760,
            maxLon: 126.500
        };

        // If grid mode is requested without bounds, use the FULL Ganghwa region
        let targetBounds = bounds;
        if (!targetBounds) {
            targetBounds = mode === 'grid' ? GANGHWA_FULL_BOUNDS : defaultBounds;
        }

        if (mode === 'grid') {
            return this.crawlGrid(targetBounds);
        } else {
            return this.crawlSingle(targetBounds);
        }
    }

    async crawlGrid(bounds: { minLat: number, minLon: number, maxLat: number, maxLon: number }) {
        console.log(`[Crawler] Starting GRID crawl for: ${JSON.stringify(bounds)}`);

        // Let's use 4x4 grid (16 requests)
        const ROWS = 4;
        const COLS = 4;

        const latStep = (bounds.maxLat - bounds.minLat) / ROWS;
        const lonStep = (bounds.maxLon - bounds.minLon) / COLS;

        let totalSaved = 0;
        let totalFetched = 0;
        const processedSet = new Set<string>();

        for (let i = 0; i < ROWS; i++) {
            for (let j = 0; j < COLS; j++) {
                const fileMinLat = bounds.minLat + (i * latStep);
                const fileMaxLat = fileMinLat + latStep;
                const fileMinLon = bounds.minLon + (j * lonStep);
                const fileMaxLon = fileMinLon + lonStep;

                const sectorBounds = {
                    minLat: fileMinLat,
                    minLon: fileMinLon,
                    maxLat: fileMaxLat,
                    maxLon: fileMaxLon
                };

                console.log(`[Crawler] Sector ${i}-${j}: ${JSON.stringify(sectorBounds)}`);

                try {
                    // Crawl this sector
                    const result = await this.crawlSingle(sectorBounds, processedSet);
                    totalSaved += result.count;
                    totalFetched += result.totalFetched;

                    // Sleep to avoid blocking (1 second between sectors if paginated)
                    await this.sleep(1000);
                } catch (err) {
                    console.error(`[Crawler] Sector ${i}-${j} failed:`, err);
                }
            }
        }

        return { success: true, count: totalSaved, totalFetched: totalFetched, message: "Grid crawl completed" };
    }

    async crawlSingle(bounds: { minLat: number, minLon: number, maxLat: number, maxLon: number }, processedSet?: Set<string>) {
        const url = "https://m.land.naver.com/cluster/ajax/articleList";
        const localSet = processedSet || new Set<string>();

        // Define category groups to fetch separately to ensure diversity
        const categoryGroups = [
            { rletTpCd: "DDD:SGJT:VL", label: "House" }, // Residence/Villa
            { rletTpCd: "SG:SMS", label: "Comm" },       // Commercial
            { rletTpCd: "TJ:JGC:JW", label: "Land/Ind" } // Land/Industrial
        ];

        let savedCount = 0;
        let totalFetchedCount = 0;

        for (const group of categoryGroups) {
            console.log(`[Crawler] Fetching category group: ${group.label} (${group.rletTpCd})`);
            let page = 1;
            let hasMore = true;

            // Fetch up to 3 pages per category group per sector to stay within limits but get depth
            while (hasMore && page <= 3) {
                const params = new URLSearchParams({
                    rletTpCd: group.rletTpCd,
                    tradTpCd: "A1:B1:B2",
                    z: "12",
                    lat: String((bounds.minLat + bounds.maxLat) / 2),
                    lon: String((bounds.minLon + bounds.maxLon) / 2),
                    btm: String(bounds.minLat),
                    lft: String(bounds.minLon),
                    top: String(bounds.maxLat),
                    rgt: String(bounds.maxLon),
                    sort: "rank",
                    page: String(page),
                });

                try {
                    const response = await fetch(`${url}?${params.toString()}`, {
                        headers: HEADERS
                    });

                    if (!response.ok) {
                        console.error(`[Crawler] ${group.label} Page ${page} failed: ${response.statusText}`);
                        break;
                    }

                    const data = await response.json() as any;
                    const articles = data.body || [];
                    totalFetchedCount += articles.length;

                    for (const article of articles) {
                        const atclNo = String(article.atclNo);
                        if (localSet.has(atclNo)) continue;

                        try {
                            const crawledItem = {
                                atclNo,
                                atclNm: article.atclFetrDesc || article.atclNm || "제목 없음",
                                rletTpNm: article.rletTpNm,
                                tradTpNm: article.tradTpNm,
                                flrInfo: article.flrInfo,
                                prc: String(article.prc),
                                spc1: article.spc1 ? String(article.spc1) : null,
                                spc2: article.spc2 ? String(article.spc2) : null,
                                direction: article.direction,
                                lat: Number(article.lat),
                                lng: Number(article.lng),
                                imgUrl: article.repImgUrl ? `https://landthumb-phinf.pstatic.net${article.repImgUrl}` : null,
                                rltrNm: article.rltrNm || null,
                                landType: article.atclNm || null,
                                zoneType: article.flrInfo || null,
                            };

                            await storage.createCrawledProperty(crawledItem);
                            savedCount++;
                            localSet.add(atclNo);
                        } catch (err) {
                            // ignore duplicate errors or parse errors
                        }
                    }

                    hasMore = data.more === true && articles.length > 0;
                    if (hasMore) {
                        page++;
                        await this.sleep(300); // Smaller delay between pages
                    } else {
                        break;
                    }
                } catch (error) {
                    console.error(`[Crawler] Error in ${group.label} page ${page}:`, error);
                    break;
                }
            }
            // Small delay between category groups
            await this.sleep(500);
        }

        return { success: true, count: savedCount, totalFetched: totalFetchedCount };
    }
}

export const naverCrawler = new NaverCrawler();
