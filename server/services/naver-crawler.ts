import fetch from 'node-fetch';
import { storage } from '../storage';
import { insertCrawledPropertySchema } from '@shared/schema';
import { log } from '../vite';

// Naver Land API Headers
// Naver Land API Headers list for rotation
const USER_AGENTS = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
];

const getHeaders = () => ({
    "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://m.land.naver.com/",
    "X-Requested-With": "XMLHttpRequest",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site"
});

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
    maxLat: 37.855, // Slightly increased to catch north edge items
    minLon: 126.250,
    maxLon: 126.535 // Slightly increased to catch east edge items
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
        // Randomize delay between 80% and 150% of base value
        const randomMs = Math.floor(ms * (0.8 + Math.random() * 0.7));
        return new Promise(resolve => setTimeout(resolve, randomMs));
    }

    async fetchAndSave(bounds?: { minLat: number, minLon: number, maxLat: number, maxLon: number }, mode: 'single' | 'grid' = 'single') {
        const defaultBounds = {
            minLat: 37.730,
            minLon: 126.470,
            maxLat: 37.760,
            maxLon: 126.500
        };

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
        console.log(`[Crawler] Starting Advanced Radius-based Grid crawl...`);

        // 핵심 밀집 지역 좌표 (강화읍, 길상면 등 주요 거점)
        const focalPoints = [
            { lat: 37.746, lon: 126.487, radius: 0.02, label: "강화읍 중심" },
            { lat: 37.645, lon: 126.494, radius: 0.03, label: "길상/온수리" },
            { lat: 37.620, lon: 126.400, radius: 0.04, label: "화도/마니산" },
            { lat: 37.705, lon: 126.410, radius: 0.03, label: "양도/내가" },
            { lat: 37.800, lon: 126.440, radius: 0.05, label: "하점/송해" },
            { lat: 37.830, lon: 126.440, radius: 0.03, label: "양사/북단" }, // 북단 추가
            { lat: 37.780, lon: 126.300, radius: 0.04, label: "교동" },
            { lat: 37.700, lon: 126.320, radius: 0.05, label: "삼산/석모" }
        ];

        let totalSaved = 0;
        let totalFetched = 0;
        const processedSet = new Set<string>();

        // 1. 핵심 지역 정밀 수집
        for (const point of focalPoints) {
            console.log(`[Crawler] Focus: ${point.label}...`);
            const sectorBounds = {
                minLat: point.lat - point.radius,
                maxLat: point.lat + point.radius,
                minLon: point.lon - point.radius,
                maxLon: point.lon + point.radius
            };
            const result = await this.crawlSingle(sectorBounds, processedSet);
            if (result.message === "Abuse detected") return result;
            totalSaved += result.count;
            totalFetched += result.totalFetched;
            await this.sleep(3000); // 간격 확대
        }

        // 2. 전체 그리드 보완 수집 (10x10)
        const ROWS = 10;
        const COLS = 10;
        const latStep = (bounds.maxLat - bounds.minLat) / ROWS;
        const lonStep = (bounds.maxLon - bounds.minLon) / COLS;

        for (let i = 0; i < ROWS; i++) {
            for (let j = 0; j < COLS; j++) {
                const sectorBounds = {
                    minLat: bounds.minLat + (i * latStep),
                    maxLat: bounds.minLat + ((i + 1) * latStep),
                    minLon: bounds.minLon + (j * lonStep),
                    maxLon: bounds.minLon + ((j + 1) * lonStep)
                };

                console.log(`[Crawler] Global Sector ${i}-${j}: ${JSON.stringify(sectorBounds)}`);

                try {
                    const result = await this.crawlSingle(sectorBounds, processedSet);
                    if (result.message === "Abuse detected") return result;
                    totalSaved += result.count;
                    totalFetched += result.totalFetched;
                    await this.sleep(2000); // 간격 확대
                } catch (err) {
                    console.error(`[Crawler] Sector ${i}-${j} failed:`, err);
                    await this.sleep(3000);
                }
            }
        }

        console.log(`[Crawler] Advanced crawl finished. Final Saved: ${totalSaved}`);
        return { success: true, count: totalSaved, totalFetched: totalFetched, message: "Advanced crawl completed" };
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
                        headers: getHeaders(),
                        redirect: "manual" // 리다이렉트를 수동으로 체크
                    });

                    if (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
                        const redirectUrl = response.headers.get('location');
                        if (redirectUrl?.includes('error/abuse') || redirectUrl?.includes('nid.naver.com')) {
                            log(`[Crawler] !!! Naver Abuse Detected !!! Stopping crawl to prevent IP ban. URL: ${redirectUrl}`, 'error');
                            return { success: false, count: savedCount, totalFetched: totalFetchedCount, message: "Abuse detected" };
                        }
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
                                rentPrc: article.rentPrc ? String(article.rentPrc) : null,
                                depositPrc: article.dps ? String(article.dps) : null,
                                spc1: article.spc1 ? String(article.spc1) : null,
                                spc2: article.spc2 ? String(article.spc2) : null,
                                direction: article.direction,
                                lat,
                                lng,
                                imgUrl: article.repImgUrl ? `https://landthumb-phinf.pstatic.net${article.repImgUrl}` : null,
                                rltrNm: article.rltrNm || null,
                                landType: null,
                                zoneType: null,
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

    setupCrawlerScheduler() {
        log(`[info] 네이버 매물 자동 수집 스케줄러 초기화`, 'info');

        // 매 분마다 시간 체크하여 오전 8시에 수집 (KST 기준)
        const CHECK_INTERVAL = 60 * 1000; // 1분
        let lastRunDate = "";

        setInterval(async () => {
            const now = new Date();
            const utcNow = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
            const kstOffset = 9 * 60 * 60 * 1000;
            const kstDate = new Date(utcNow + kstOffset);

            const currentHour = kstDate.getHours();
            const currentMinute = kstDate.getMinutes();
            const currentDateString = kstDate.toISOString().split('T')[0];

            // 실행 조건: 오전 8시 00분~05분 사이, 오늘 아직 실행하지 않음
            if (currentHour === 8 && currentMinute < 5 && lastRunDate !== currentDateString) {
                log(`[scheduler] 네이버 매물 자동 수집 시작 (KST 08:00)`, 'info');
                lastRunDate = currentDateString;

                try {
                    // 1. 기존 데이터 초기화 (대표님 요청: 전체 초기화 후 수집)
                    log(`[scheduler] 기존 매물 데이터 초기화 중...`, 'info');
                    await storage.clearCrawledProperties();

                    // 2. 전체 그리드 수집 시작 (10x10)
                    log(`[scheduler] 네이버 전체 지역 정밀 수집(Grid) 시작...`, 'info');
                    await this.crawlGrid(GANGHWA_FULL_BOUNDS);

                    log(`[scheduler] 네이버 매물 자동 수집 완료`, 'info');
                } catch (err) {
                    log(`[scheduler] 네이버 자동 수집 실패: ${err}`, 'error');
                }
            }
        }, CHECK_INTERVAL);

        log(`[info] 네이버 수집 스케줄러 설정 완료 (매일 오전 8시 실행)`, 'info');
    }
}

export const naverCrawler = new NaverCrawler();
