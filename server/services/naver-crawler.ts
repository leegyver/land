import { storage } from '../storage';
import { log } from '../vite';

// Naver Land API User Agents list for rotation
const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0"
];

// 강화군 전체 경계 (수집용)
const GANGHWA_BOUNDS = {
    minLat: 37.580,
    minLon: 126.150,
    maxLat: 37.865,
    maxLon: 126.550
};

// 네이버 부동산 모바일 API 유효 카테고리 코드 (2026-04 검증 완료)
const CATEGORY_LIST = [
    { code: "APT", label: "아파트" },
    { code: "OPST", label: "오피스텔" },
    { code: "VL", label: "빌라" },
    { code: "DDDGG", label: "단독/다가구" },
    { code: "JWJT", label: "전원주택" },
    { code: "SGJT", label: "상가주택" },
    { code: "OR", label: "원룸" },
    { code: "TJ", label: "토지" },
    { code: "SG", label: "상가" },
    { code: "SMS", label: "사무실" },
    { code: "GM", label: "건물" }
];

export class NaverCrawler {
    public isCrawling: boolean = false;
    private cookies: string = '';
    private currentUA: string = '';

    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 네이버 부동산 페이지 접속하여 쿠키 획득 (봇 차단 우회)
    private async initSession() {
        this.currentUA = userAgents[Math.floor(Math.random() * userAgents.length)];
        
        try {
            // 1차: 모바일 랜드 메인 페이지 접속하여 쿠키 획득
            const initRes = await fetch("https://m.land.naver.com/", {
                headers: {
                    "User-Agent": this.currentUA,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
                    "Accept-Encoding": "gzip, deflate, br",
                    "Connection": "keep-alive",
                    "Upgrade-Insecure-Requests": "1"
                },
                redirect: 'follow'
            });

            // 응답 헤더에서 Set-Cookie 추출
            const setCookies = initRes.headers.getSetCookie?.() || [];
            if (setCookies.length > 0) {
                this.cookies = setCookies.map(c => c.split(';')[0]).join('; ');
                log(`[Crawler] 세션 초기화 완료. 쿠키 ${setCookies.length}개 획득.`, 'info');
            } else {
                // headers.raw()를 사용하는 대체 방법
                const rawHeaders = initRes.headers;
                const allCookies: string[] = [];
                rawHeaders.forEach((value, key) => {
                    if (key.toLowerCase() === 'set-cookie') {
                        allCookies.push(value.split(';')[0]);
                    }
                });
                if (allCookies.length > 0) {
                    this.cookies = allCookies.join('; ');
                    log(`[Crawler] 세션 초기화 완료 (대체방식). 쿠키 획득.`, 'info');
                }
            }

            // 2차: 강화군 지역 검색 페이지 접속으로 지역 쿠키 설정
            await this.sleep(1000 + Math.random() * 1000);
            const regionRes = await fetch("https://m.land.naver.com/search/result/28710", {
                headers: this.getHeaders(),
                redirect: 'follow'
            });
            
            const regionCookies = regionRes.headers.getSetCookie?.() || [];
            if (regionCookies.length > 0) {
                const newCookies = regionCookies.map(c => c.split(';')[0]).join('; ');
                this.cookies = this.cookies ? `${this.cookies}; ${newCookies}` : newCookies;
            }
            
            log(`[Crawler] 지역 세션 설정 완료. (HTTP ${regionRes.status})`, 'info');
        } catch (err) {
            log(`[Crawler] 세션 초기화 실패 (계속 진행): ${err}`, 'error');
        }
    }

    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            "User-Agent": this.currentUA || userAgents[Math.floor(Math.random() * userAgents.length)],
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
            "Accept-Encoding": "gzip, deflate, br",
            "Referer": "https://m.land.naver.com/map/37.7225/126.35",
            "X-Requested-With": "XMLHttpRequest",
            "Connection": "keep-alive",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin"
        };
        if (this.cookies) {
            headers["Cookie"] = this.cookies;
        }
        return headers;
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

            // 세션 초기화 (쿠키 획득 - 307 리다이렉트 차단 우회)
            await this.initSession();
            await this.sleep(2000 + Math.random() * 2000);

            for (const category of CATEGORY_LIST) {
                log(`[Crawler] 카테고리 수집 중: ${category.label} (${category.code})...`, 'info');
                
                try {
                    const saved = await this.crawlByCategory(category.code);
                    totalSaved += saved;
                    
                    const waitTime = 15000 + Math.random() * 10000;
                    log(`[Crawler] ${category.label} 완료 (${saved}건). 다음 수집 전 ${Math.round(waitTime/1000)}초 대기...`, 'info');
                    await this.sleep(waitTime);
                } catch (err) {
                    log(`[Crawler] ${category.label} 수집 실패: ${err}`, 'error');
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
        let consecutiveFailures = 0;

        while (hasMore && page <= 50) {
            const params = new URLSearchParams({
                rletTpCd: categoryCode,
                tradTpCd: "A1:B1:B2",
                z: "11",
                lat: String((GANGHWA_BOUNDS.minLat + GANGHWA_BOUNDS.maxLat) / 2),
                lon: String((GANGHWA_BOUNDS.minLon + GANGHWA_BOUNDS.maxLon) / 2),
                btm: String(GANGHWA_BOUNDS.minLat),
                lft: String(GANGHWA_BOUNDS.minLon),
                top: String(GANGHWA_BOUNDS.maxLat),
                rgt: String(GANGHWA_BOUNDS.maxLon),
                page: String(page)
            });

            const requestUrl = `${url}?${params.toString()}`;
            
            try {
                const response = await fetch(requestUrl, { 
                    headers: this.getHeaders(),
                    redirect: 'manual'
                });

                // 307/302 리다이렉트 = 네이버 봇 차단 감지 (redirect:'manual' 필수)
                if (response.status === 307 || response.status === 302 || response.status === 301) {
                    consecutiveFailures++;
                    log(`[Crawler] ${categoryCode} page ${page}: HTTP ${response.status} 차단 감지 (${consecutiveFailures}회)`, 'info');
                    
                    if (consecutiveFailures >= 3) {
                        log(`[Crawler] ${categoryCode}: 차단 지속. 이 카테고리 건너뜀.`, 'info');
                        break;
                    }
                    
                    // 차단 시 긴 대기 후 세션 재초기화
                    const blockWait = 20000 + Math.random() * 15000;
                    log(`[Crawler] ${Math.round(blockWait/1000)}초 대기 후 세션 재초기화...`, 'info');
                    await this.sleep(blockWait);
                    await this.initSession();
                    await this.sleep(5000 + Math.random() * 3000);
                    continue; // 같은 페이지 재시도
                }
                
                if (!response.ok) {
                    log(`[Crawler] ${categoryCode} page ${page}: HTTP ${response.status}`, 'error');
                    consecutiveFailures++;
                    if (consecutiveFailures >= 3) break;
                    await this.sleep(10000);
                    continue;
                }

                // 응답에서 새 쿠키 갱신
                const newCookies = response.headers.getSetCookie?.() || [];
                if (newCookies.length > 0) {
                    const additional = newCookies.map(c => c.split(';')[0]).join('; ');
                    this.cookies = this.cookies ? `${this.cookies}; ${additional}` : additional;
                }

                const contentType = response.headers.get('content-type') || '';
                let data: any;
                
                if (contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    // HTML 응답 (봇 방어 페이지)인 경우
                    const text = await response.text();
                    try {
                        data = JSON.parse(text);
                    } catch {
                        log(`[Crawler] ${categoryCode} page ${page}: 비 JSON 응답 (봇 방어 페이지 가능). 대기 후 재시도...`, 'info');
                        consecutiveFailures++;
                        if (consecutiveFailures >= 3) break;
                        await this.sleep(20000 + Math.random() * 10000);
                        await this.initSession();
                        await this.sleep(5000);
                        continue;
                    }
                }

                if (!data || typeof data !== 'object') {
                    log(`[Crawler] ${categoryCode} page ${page}: 응답 데이터가 null/비정상입니다. 네이버 차단 가능성 높음.`, 'error');
                    consecutiveFailures++;
                    if (consecutiveFailures >= 3) break;
                    
                    await this.sleep(15000 + Math.random() * 10000);
                    await this.initSession();
                    await this.sleep(5000);
                    continue;
                }

                consecutiveFailures = 0;
                const articles = data.body || [];

                if (articles.length === 0) break;

                for (const article of articles) {
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
                    // 페이지 간 5~8초 대기 (네이버 감시 차단 - 기존 3~5초에서 상향)
                    await this.sleep(5000 + Math.random() * 3000);
                }
            } catch (err) {
                log(`[Crawler] ${categoryCode} page ${page} 네트워크 오류: ${err}`, 'error');
                consecutiveFailures++;
                if (consecutiveFailures >= 3) break;
                await this.sleep(10000 + Math.random() * 5000);
            }
        }

        return savedInCategory;
    }

    // 매일 오전 8시 자동 수집 스케줄러
    setupCrawlerScheduler() {
        log(`[info] 네이버 매물 수집 스케줄러가 활성화되었습니다. (매일 08:00)`, 'info');

        setInterval(async () => {
            const now = new Date();
            const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
            
            if (kstTime.getUTCHours() === 8 && kstTime.getUTCMinutes() === 0) {
                log(`[scheduler] 정기 수집을 시작합니다...`, 'info');
                await storage.clearCrawledProperties();
                await this.fetchAndSave();
            }
        }, 60000);
    }
}

export const naverCrawler = new NaverCrawler();
