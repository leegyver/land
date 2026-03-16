import fetch from 'node-fetch';
import { storage } from '../storage';
import { insertCrawledPropertySchema } from '@shared/schema';

// Naver Land API Headers
const HEADERS = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://m.land.naver.com/",
    "X-Requested-With": "XMLHttpRequest",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site"
};

// Ganghwa-gun Full Region Bounds
const GANGHWA_FULL_BOUNDS = {
    minLat: 37.580,
    minLon: 126.250,
    maxLat: 37.850, // 강화 북단(교동, 양사면 등) 포함
    maxLon: 126.540 // 김포 경계까지 넉넉하게 확장 (좌표 필터링에서 정밀 제어)
};

// 정밀 강화도 경계 (좌표 기반 필터링용)
const GANGHWA_PRECISION_BOUNDS = {
    minLat: 37.580,
    maxLat: 37.850,
    minLon: 126.250,
    maxLon: 126.525 // 김포 매물 유입 방지
};

// 지역별 좌표 프리셋
export const REGION_BOUNDS: Record<string, { minLat: number, minLon: number, maxLat: number, maxLon: number, label: string }> = {
    "eup": { label: "강화읍", minLat: 37.730, minLon: 126.470, maxLat: 37.760, maxLon: 126.510 },
    "gilsang": { label: "길상면", minLat: 37.600, minLon: 126.450, maxLat: 37.660, maxLon: 126.530 },
    "hwado": { label: "화도면", minLat: 37.580, minLon: 126.350, maxLat: 37.670, maxLon: 126.460 },
    "bureun": { label: "불은면", minLat: 37.660, minLon: 126.470, maxLat: 37.720, maxLon: 126.530 },
    "seonwon": { label: "선원면", minLat: 37.700, minLon: 126.470, maxLat: 37.740, maxLon: 126.520 },
    "yangdo": { label: "양도면", minLat: 37.650, minLon: 126.370, maxLat: 37.710, maxLon: 126.450 },
    "naega": { label: "내가면", minLat: 37.700, minLon: 126.350, maxLat: 37.760, maxLon: 126.425 },
    "hajeom": { label: "하점면", minLat: 37.750, minLon: 126.370, maxLat: 37.820, maxLon: 126.460 },
    "songhae": { label: "송해면", minLat: 37.770, minLon: 126.440, maxLat: 37.820, maxLon: 126.510 },
    "yangsa": { label: "양사면", minLat: 37.800, minLon: 126.380, maxLat: 37.850, maxLon: 126.480 },
    "gyodong": { label: "교동면", minLat: 37.750, minLon: 126.250, maxLat: 37.840, maxLon: 126.350 },
    "samsan": { label: "삼산면 (석모도)", minLat: 37.640, minLon: 126.290, maxLat: 37.760, maxLon: 126.360 }
};

export class NaverCrawler {
    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async fetchAndSave(bounds?: { minLat: number, minLon: number, maxLat: number, maxLon: number }) {
        const defaultBounds = {
            minLat: 37.730,
            minLon: 126.470,
            maxLat: 37.760,
            maxLon: 126.500
        };

        return this.crawlSingle(bounds || defaultBounds);
    }

    async fetchAndSaveGrid(bounds?: { minLat: number, minLon: number, maxLat: number, maxLon: number }) {
        return this.crawlGrid(bounds || GANGHWA_FULL_BOUNDS);
    }

    async crawlGrid(bounds: { minLat: number, minLon: number, maxLat: number, maxLon: number }) {
        console.log(`[Crawler] Starting GRID crawl for: ${JSON.stringify(bounds)}`);

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

                console.log(`[Crawler] Sector ${i}-${j} started: ${JSON.stringify(sectorBounds)}`);

                try {
                    const result = await this.crawlSingle(sectorBounds, processedSet);
                    totalSaved += result.count;
                    totalFetched += result.totalFetched;
                    console.log(`[Crawler] Sector ${i}-${j} complete. Saved: ${result.count}, Total: ${totalSaved}`);

                    // Sleep 2 seconds between sectors to avoid detection
                    await this.sleep(2000);
                } catch (err) {
                    console.error(`[Crawler] Sector ${i}-${j} failed:`, err);
                    await this.sleep(5000); // Wait longer on error
                }
            }
        }

        console.log(`[Crawler] FULL Grid crawl finished. Final Saved: ${totalSaved}`);
        return { success: true, count: totalSaved, totalFetched: totalFetched, message: "Grid crawl completed" };
    }

    async crawlSingle(bounds: { minLat: number, minLon: number, maxLat: number, maxLon: number }, processedSet?: Set<string>) {
        const url = "https://m.land.naver.com/cluster/ajax/articleList";
        const localSet = processedSet || new Set<string>();

        const categoryGroups = [
            { rletTpCd: "DDD:SGJT:VL:JWJT:HOJT", label: "House" },
            { rletTpCd: "TJ:JGC:JW", label: "Land" },
            { rletTpCd: "SG:SMS", label: "Comm" }
        ];

        let savedCount = 0;
        let totalFetchedCount = 0;

        for (const group of categoryGroups) {
            let page = 1;
            let hasMore = true;

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
                    pgr: String(page) // 더블 파라미터로 페이징 보강
                });

                try {
                    const response = await fetch(`${url}?${params.toString()}`, {
                        method: "GET",
                        headers: HEADERS,
                        redirect: "manual" // 리다이렉트를 수동으로 체크
                    });

                    if (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
                        const redirectUrl = response.headers.get('location');
                        console.error(`[Crawler] ${group.label} P${page} Redirected to: ${redirectUrl}`);
                        break;
                    }

                    if (!response.ok) {
                        console.error(`[Crawler] ${group.label} P${page} Error: ${response.status}`);
                        break;
                    }

                    const data = await response.json() as any;
                    const articles = data.body || [];
                    totalFetchedCount += articles.length;

                    for (const article of articles) {
                        const atclNo = String(article.atclNo);
                        if (localSet.has(atclNo)) continue;

                        const lat = Number(article.lat);
                        const lng = Number(article.lng);

                        // 좌표 기반 강화도 필터링
                        const isInGanghwa =
                            lat >= GANGHWA_PRECISION_BOUNDS.minLat &&
                            lat <= GANGHWA_PRECISION_BOUNDS.maxLat &&
                            lng >= GANGHWA_PRECISION_BOUNDS.minLon &&
                            lng <= GANGHWA_PRECISION_BOUNDS.maxLon;

                        if (!isInGanghwa) continue;

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
                                lat,
                                lng,
                                imgUrl: article.repImgUrl ? `https://landthumb-phinf.pstatic.net${article.repImgUrl}` : null,
                                rltrNm: article.rltrNm || null,
                                landType: article.atclNm || null,
                                zoneType: article.flrInfo || null,
                            };

                            await storage.createCrawledProperty(crawledItem);
                            savedCount++;
                            localSet.add(atclNo);
                        } catch (err) { }
                    }

                    hasMore = data.more === true && articles.length > 0;
                    if (hasMore) {
                        page++;
                        await this.sleep(1000); // 페이지 간 간격 확대
                    } else {
                        break;
                    }
                } catch (error) {
                    console.error(`[Crawler] Request Failed:`, error);
                    break;
                }
            }
            await this.sleep(1000); // 카테고리 간 간격
        }

        return { success: true, count: savedCount, totalFetched: totalFetchedCount };
    }
}

export const naverCrawler = new NaverCrawler();
