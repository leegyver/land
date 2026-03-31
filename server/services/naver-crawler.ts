import { storage } from '../storage';
import { log } from '../vite';

// Naver Land API User Agents list for rotation
const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0"
];

const getHeaders = () => {
    return {
        "User-Agent": userAgents[Math.floor(Math.random() * userAgents.length)],
        "Accept": "application/json",
        "Referer": "https://m.land.naver.com/"
    };
};

// 강화군 전체 경계 (수집용)
const GANGHWA_BOUNDS = {
    minLat: 37.580,
    minLon: 126.150,
    maxLat: 37.865,
    maxLon: 126.550
};

// 네이버 부동산 카테고리 (수동 작업 없이 하나씩 순차적으로 수집) - 13개 주요 품목
const CATEGORY_LIST = [
    { code: "APT", label: "아파트" },
    { code: "OPST", label: "오피스텔" },
    { code: "VL", label: "빌라" },
    { code: "TOWN", label: "타운하우스" },
    { code: "JWJT", label: "전원주택" },
    { code: "DDGG", label: "단독주택" },
    { code: "SGJT", label: "상가주택" },
    { code: "HOJT", label: "한옥주택" },
    { code: "TJ", label: "토지" },
    { code: "SG", label: "상가" },
    { code: "SMS", label: "사무실" },
    { code: "GJ", label: "공장" },
    { code: "CG", label: "창고" },
    { code: "GM", label: "건물" }
];

export class NaverCrawler {
    public isCrawling: boolean = false;

    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 메인 수집 함수
    async fetchAndSave() {
        if (this.isCrawling) {
            log(`[Crawler] 이미 수집 작업이 진행 중입니다.`, 'error');
            return { success: false, message: "이미 수집 중입니다." };
        }
        
        this.isCrawling = true;
        let totalSaved = 0;

        try {
            log(`[Crawler] 강화군 전 지역 매물 수집을 시작합니다...`, 'info');

            for (const category of CATEGORY_LIST) {
                log(`[Crawler] 카테고리 수집 중: ${category.label} (${category.code})...`, 'info');
                
                try {
                    const saved = await this.crawlByCategory(category.code);
                    totalSaved += saved;
                    
                    // 네이버 IP 차단 방지를 위해 카테고리 간 10~15초 휴식 (대표님 지시사항)
                    const waitTime = 10000 + Math.random() * 5000;
                    log(`[Crawler] ${category.label} 완료 (${saved}건). 다음 수집 전 ${Math.round(waitTime/1000)}초 대기...`, 'info');
                    await this.sleep(waitTime);
                } catch (err) {
                    console.error(`[Crawler] ${category.label} 수집 실패:`, err);
                }
            }

            log(`[Crawler] 강화군 전체 수집 완료! 총 ${totalSaved}건 저장됨.`, 'info');
            return { success: true, count: totalSaved };
        } finally {
            this.isCrawling = false;
        }
    }

    // 카테고리별 상세 수집
    private async crawlByCategory(categoryCode: string) {
        const url = "https://m.land.naver.com/cluster/ajax/articleList";
        let page = 1;
        let hasMore = true;
        let savedInCategory = 0;

        while (hasMore && page <= 50) { // 최대 50페이지까지 수집
            const params = new URLSearchParams({
                rletTpCd: categoryCode,
                tradTpCd: "A1:B1:B2", // 매매, 전세, 월세 모두 포함
                z: "11", // 수집 범위를 적절히 넓게 설정
                lat: String((GANGHWA_BOUNDS.minLat + GANGHWA_BOUNDS.maxLat) / 2),
                lon: String((GANGHWA_BOUNDS.minLon + GANGHWA_BOUNDS.maxLon) / 2),
                btm: String(GANGHWA_BOUNDS.minLat),
                lft: String(GANGHWA_BOUNDS.minLon),
                top: String(GANGHWA_BOUNDS.maxLat),
                rgt: String(GANGHWA_BOUNDS.maxLon),
                page: String(page)
            });

            const requestUrl = `${url}?${params.toString()}`;
            const response = await fetch(requestUrl, { headers: getHeaders() });

            if (!response.ok) break;

            const data: any = await response.json();
            const articles = data.body || [];

            if (articles.length === 0) break;

            for (const article of articles) {
                // 강화군(28710) 매물인지 최종 확인
                const isGanghwa = article.cortarNo && String(article.cortarNo).startsWith("28710");
                if (!isGanghwa) continue;

                try {
                    await storage.createCrawledProperty({
                        atclNo: String(article.atclNo),
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
                        lat: Number(article.lat),
                        lng: Number(article.lng),
                        imgUrl: article.repImgUrl ? `https://landthumb-phinf.pstatic.net${article.repImgUrl}` : null,
                        rltrNm: article.rltrNm || null,
                        landType: null,
                        zoneType: null,
                    });
                    savedInCategory++;
                } catch (err) {
                    // 중복은 DB에서 알아서 처리됨 (ON CONFLICT)
                }
            }

            hasMore = data.more === true && articles.length >= 20;
            if (hasMore) {
                page++;
                // 페이지 간 3~5초 대기 (네이버 감시 차단)
                await this.sleep(3000 + Math.random() * 2000);
            }
        }

        return savedInCategory;
    }

    // 매일 오전 8시 자동 수집 스케줄러
    setupCrawlerScheduler() {
        log(`[info] 네이버 매물 수집 스케줄러가 활성화되었습니다. (매일 08:00)`, 'info');

        setInterval(async () => {
            const now = new Date();
            // 한국 시간(KST)으로 변환
            const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
            
            if (kstTime.getUTCHours() === 8 && kstTime.getUTCMinutes() === 0) {
                log(`[scheduler] 정기 수집을 시작합니다...`, 'info');
                await storage.clearCrawledProperties(); // 기존 수집 데이터 초기화
                await this.fetchAndSave();
            }
        }, 60000); // 1분마다 체크
    }
}

export const naverCrawler = new NaverCrawler();
