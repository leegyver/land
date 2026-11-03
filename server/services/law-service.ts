import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
});

// 환경변수에서 OC(사용자 아이디) 또는 API 키 로드
const LAW_API_OC = process.env.LAW_API_OC || process.env.LAW_API_KEY || "sample";

export interface LawSearchResult {
  id: string;
  type: "law" | "prec";
  title: string;
  subtitle?: string;
  date?: string;
  court?: string; // 판례인 경우 (대법원, 서울고등법원 등)
  caseNumber?: string; // 사건번호
  caseType?: string; // 사건명 (예: 건물명도, 전세보증금반환)
  summary?: string; // 판결요지 또는 법령 목적
  issue?: string; // 판시사항
  fullContent?: string; // 판례 전문 내용
  articles?: string[]; // 관련 조문
  detailUrl?: string;
}

function cleanHtml(text?: string): string {
  if (!text) return "";
  return String(text)
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .trim();
}

export interface CurationTheme {
  id: string;
  title: string;
  badge: string;
  description: string;
  keywords: string[];
  sampleCases: string[];
}

// 경매/부동산 전문 플랫폼에 특화된 실무 큐레이션 테마
export const CURATION_THEMES: CurationTheme[] = [
  {
    id: "lease-protection",
    title: "주택임대차 · 전세사기 & 대항력",
    badge: "필독",
    description: "전입신고 익일 효력, 우선변제권 배당 순위, 임차권등기명령 관련 대법원 판례",
    keywords: ["주택임대차보호법", "대항력", "우선변제권", "임차권등기"],
    sampleCases: ["2001다76427", "99다59306", "2007다63074"]
  },
  {
    id: "auction-rights",
    title: "경매 권리분석 · 유치권 & 법정지상권",
    badge: "경매 핵심",
    description: "가짜 유치권 배제 요건, 점유 침탈, 법정지상권 성립 여부 판단 기준",
    keywords: ["유치권", "법정지상권", "민사집행법", "인도명령"],
    sampleCases: ["2011다44788", "2005다16942", "2013다23387"]
  },
  {
    id: "commercial-lease",
    title: "상가임대차 · 권리금 분쟁",
    badge: "상가 전문",
    description: "권리금 회수방해 손해배상 요건, 10년 계약갱신요구권 행사 범위",
    keywords: ["상가건물 임대차보호법", "권리금", "계약갱신요구권"],
    sampleCases: ["2018다252441", "2020다286102"]
  },
  {
    id: "real-estate-broker",
    title: "공인중개사법 · 중개대상물 확인설명",
    badge: "중개 실무",
    description: "선순위 임차보증금 설명 누락 손해배상 책임, 중개보수 분쟁 판례",
    keywords: ["공인중개사법", "확인설명", "중개보수", "손해배상책임"],
    sampleCases: ["2012다49490", "2022다238141"]
  },
  {
    id: "land-building",
    title: "토지 · 건축 & 맹지 도로사용권",
    badge: "강화도 토지",
    description: "주위토지통행권, 구거 점용, 농지전용 허가 관련 필수 판례",
    keywords: ["주위토지통행권", "건축법 도로", "농지법"],
    sampleCases: ["96다10171", "2016다18797"]
  }
];

// Fallback 및 초기 큐레이션용 핵심 리딩 판례 데이터
export const CURATED_PRECEDENTS: LawSearchResult[] = [
  {
    id: "prec-2018다252441",
    type: "prec",
    title: "상가건물 임대차보호법상 권리금 회수기회 보호",
    subtitle: "대법원 2019. 5. 16. 선고 2018다252441 판결",
    date: "2019.05.16",
    court: "대법원",
    caseNumber: "2018다252441",
    caseType: "손해배상(기)",
    issue: "[1] 구 상가건물 임대차보호법 제10조의4에서 정한 '임대인의 권리금 회수기회 보호의무'가 전체 임대차기간이 5년(현행 10년)을 초과하여 계약갱신요구권을 행사할 수 없는 경우에도 적용되는지 여부(적극)",
    summary: "전체 임대차기간이 5년(현 10년)을 초과하여 임차인이 계약갱신요구권을 행사할 수 없더라도, 임대인은 상가건물 임대차보호법 제10조의4 제1항에 따른 권리금 회수기회 보호의무를 부담한다고 보아야 한다. 따라서 임대인이 정당한 사유 없이 신규임차인과의 계약을 거절하면 손해배상 책임을 진다.",
    articles: ["상가건물 임대차보호법 제10조", "상가건물 임대차보호법 제10조의4"],
  },
  {
    id: "prec-2011다44788",
    type: "prec",
    title: "부동산 경매에서 압류 후 성립한 유치권의 대항력 배제",
    subtitle: "대법원 2011. 11. 24. 선고 2011다44788 판결",
    date: "2011.11.24",
    court: "대법원",
    caseNumber: "2011다44788",
    caseType: "건물명도 등",
    issue: "[1] 경매개시결정 기입등기로 압류의 효력이 발생한 후에 공사대금 채권자가 점유를 취득하여 유치권이 성립한 경우, 경매절차 매수인에게 유치권으로 대항할 수 있는지 여부(소극)",
    summary: "경매개시결정 기입등기가 마쳐져 압류의 효력이 발생한 후에 채무자가 부동산에 관한 점유를 이전함으로써 유치권을 취득하게 된 경우, 점유자로서는 매수인(낙찰자)에게 유치권으로 대항할 수 없다. 이는 압류의 처분금지효에 저촉되기 때문이다.",
    articles: ["민사집행법 제83조", "민법 제320조"],
  },
  {
    id: "prec-2001다76427",
    type: "prec",
    title: "주택임대차보호법상 대항력 발생 시기 및 근저당권과의 우열",
    subtitle: "대법원 2002. 3. 15. 선고 2001다76427 판결",
    date: "2002.03.15",
    court: "대법원",
    caseNumber: "2001다76427",
    caseType: "배당이의",
    issue: "[1] 주민등록 전입신고일과 같은 날 설정된 근저당권과 주택임차인의 대항력 간의 우선순위",
    summary: "주택임대차보호법 제3조 제1항의 대항력은 주민등록을 마친 '다음 날 오전 0시'부터 발생하므로, 전입신고 당일 설정된 근저당권설정등기보다 후순위가 되어 경매 시 낙찰자에게 대항할 수 없다.",
    articles: ["주택임대차보호법 제3조", "주택임대차보호법 제3조의2"],
  },
  {
    id: "prec-2022다238141",
    type: "prec",
    title: "공인중개사의 선순위 보증금 및 권리관계 확인설명 의무 범위",
    subtitle: "대법원 2023. 11. 30. 선고 2022다238141 판결",
    date: "2023.11.30",
    court: "대법원",
    caseNumber: "2022다238141",
    caseType: "손해배상",
    issue: "[1] 다가구주택 중개 시 공인중개사가 임대인에게 선순위 임차보증금 자료를 요구하여 확인·설명할 의무가 있는지 여부(적극)",
    summary: "공인중개사는 다가구주택 임대차계약을 중개할 때 임대인에게 선순위 보증금 내역을 요구하고 이를 확인하여 임차인에게 설명해야 하며, 임대인이 불응할 경우 그 사실을 확인설명서에 기재하여 설명할 의무가 있고, 이를 게을리하여 임차인이 보증금을 회수하지 못한 경우 손해배상 책임이 인정된다.",
    articles: ["공인중개사법 제25조", "공인중개사법 제30조"],
  },
  {
    id: "prec-2016다18797",
    type: "prec",
    title: "맹지 탈출을 위한 민법상 주위토지통행권 인정 기준",
    subtitle: "대법원 2016. 9. 28. 선고 2016다18797 판결",
    date: "2016.09.28",
    court: "대법원",
    caseNumber: "2016다18797",
    caseType: "주위토지통행권 확인",
    issue: "[1] 토지의 용도와 주위 환경에 따른 통행로의 폭과 위치 산정 기준",
    summary: "어느 토지와 공로 사이에 그 토지의 용도에 필요한 통로가 없는 경우 그 토지 소유자는 주위의 토지를 통행하거나 통로를 개설할 수 있다. 통행로의 폭과 위치는 피통행지 소유자에게 가장 손해가 적은 장소와 방법으로 결정되어야 한다.",
    articles: ["민법 제219조", "건축법 제44조"],
  },
  {
    id: "prec-2007다63074",
    type: "prec",
    title: "소액임차인의 최우선변제권 및 대항력 요건 존속 시기",
    subtitle: "대법원 2008. 6. 26. 선고 2007다63074 판결",
    date: "2008.06.26",
    court: "대법원",
    caseNumber: "2007다63074",
    caseType: "배당이의",
    issue: "[1] 주택임대차보호법상 소액임차인이 우선변제를 받기 위하여 대항요건을 유지하여야 하는 종기(=배당요구의 종기)",
    summary: "주택임대차보호법 제8조에서 정한 소액임차인의 최우선변제권은 경매신청등기 전까지 대항요건을 갖추어야 할 뿐만 아니라, 배당요구 종기까지 대항요건을 계속 유지하고 있어야 한다.",
    articles: ["주택임대차보호법 제8조", "민사집행법 제84조"],
  },
  {
    id: "prec-2013다23387",
    type: "prec",
    title: "토지와 건물의 동일인 소유 여부와 관습법상 법정지상권 성립",
    subtitle: "대법원 2013. 4. 11. 선고 2013다23387 판결",
    date: "2013.04.11",
    court: "대법원",
    caseNumber: "2013다23387",
    caseType: "건물철거 및 토지인도",
    issue: "[1] 강제경매로 인하여 관습법상 법정지상권이 성립하기 위한 토지와 건물의 동일인 소유 판단 기준 시점(=압류의 효력 발생 시)",
    summary: "부동산 강제경매절차에서 토지와 지상 건물이 동일인의 소유에 속하였는지 여부는 매각대금 완납 시가 아니라 '압류의 효력이 발생한 때(경매개시결정 기입등기 시)'를 기준으로 판단하여야 한다.",
    articles: ["민법 제366조", "민사집행법 제83조"],
  },
  {
    id: "prec-2020다286102",
    type: "prec",
    title: "상가임대인의 신규임차인 주선 거절과 손해배상 산정 기준",
    subtitle: "대법원 2021. 7. 8. 선고 2020다286102 판결",
    date: "2021.07.08",
    court: "대법원",
    caseNumber: "2020다286102",
    caseType: "손해배상(기)",
    issue: "[1] 임대인이 상가를 직접 사용할 계획이라는 이유로 신규임차인과의 임대차계약 체결을 거절한 경우 상가임대차법 위반 여부(적극)",
    summary: "임대인이 '자신이 상가를 직접 운영할 계획'이라는 이유로 임차인이 주선한 신규임차인과의 계약 체결을 명시적으로 거절한 것은 상가임대차법 제10조의4 제1항 제4호의 정당한 사유 없는 거절에 해당하므로, 임대인은 임차인에게 권리금 상당의 손해를 배상할 책임이 있다.",
    articles: ["상가건물 임대차보호법 제10조의4"],
  },
  {
    id: "prec-2005다16942",
    type: "prec",
    title: "경매 낙찰자의 인도명령과 점유자의 점유이전금지가처분 효력",
    subtitle: "대법원 2005. 5. 27. 선고 2005다16942 판결",
    date: "2005.05.27",
    court: "대법원",
    caseNumber: "2005다16942",
    caseType: "건물명도",
    issue: "[1] 점유이전금지가처분 집행 후 제3자가 점유를 승계한 경우 승계집행문 부여 여부",
    summary: "점유이전금지가처분이 집행된 후 당사자로부터 점유를 승계한 제3자에 대하여는 본안판결의 승계집행문을 부여받아 인도집행을 할 수 있다.",
    articles: ["민사집행법 제31조", "민사집행법 제136조"],
  },
  {
    id: "prec-2025다210305",
    type: "prec",
    title: "전세임대주택 입주자가 주택 소유권 취득 시 대항력 소멸 여부",
    subtitle: "대법원 2026. 2. 26. 선고 2025다210305 판결",
    date: "2026.02.26",
    court: "대법원",
    caseNumber: "2025다210305",
    caseType: "배당이의",
    issue: "[1] 주택임대차보호법 제3조 제2항에 따라 법인 임차인이 대항력을 갖춘 후 입주자가 해당 주택을 양수하여 소유자가 된 경우 대항력 소멸 여부(적극)",
    summary: "주택임대차보호법 제3조 제2항에 따라 입주자가 주택을 인도받고 주민등록을 마침으로써 법인 임차인이 대항력을 취득하였더라도, 이후 입주자가 해당 주택의 소유권을 취득하면 입주자의 주민등록은 소유권에 기한 점유가 되므로 임차권 공시방법으로서의 기능을 상실하여 법인의 대항력은 소멸한다.",
    articles: ["주택임대차보호법 제3조", "주택임대차보호법 제3조의2"],
  }
];

// Fallback 판례들에 안전한 대국민 포털 공식 원문 열람 링크 자동 생성
CURATED_PRECEDENTS.forEach(p => {
  if (!p.detailUrl && p.caseNumber) {
    p.detailUrl = `https://www.law.go.kr/precSc.do?menuId=7&subMenuId=47&tabMenuId=213&query=${encodeURIComponent(p.caseNumber)}`;
  }
});

// 메모리 캐시 (1시간 유지)
const searchCache = new Map<string, { data: LawSearchResult[]; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1시간

export async function searchLawsAndPrecedents(query: string, targetType: "all" | "law" | "prec" = "all", page: number = 1): Promise<{
  totalCount: number;
  items: LawSearchResult[];
  source: "api" | "fallback";
}> {
  const cleanQuery = query.trim();
  const cacheKey = `${cleanQuery}_${targetType}_${page}`;

  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      totalCount: cached.data.length,
      items: cached.data,
      source: "api",
    };
  }

  // 검색어가 없을 때는 큐레이션된 판례 목록 반환
  if (!cleanQuery) {
    let list = CURATED_PRECEDENTS;
    if (targetType === "law") list = [];
    return {
      totalCount: list.length,
      items: list,
      source: "fallback",
    };
  }

  const results: LawSearchResult[] = [];

  // 국가법령정보센터 Open API 호출 시도
  try {
    const promises: Promise<void>[] = [];

    // 1. 판례 검색
    if (targetType === "all" || targetType === "prec") {
      promises.push((async () => {
        try {
          const precUrl = `http://www.law.go.kr/DRF/lawSearch.do?OC=${LAW_API_OC}&target=prec&type=XML&query=${encodeURIComponent(cleanQuery)}&page=${page}&display=20`;
          const res = await fetch(precUrl, { signal: AbortSignal.timeout(4000) });
          if (res.ok) {
            const xmlText = await res.text();
            const parsed = parser.parse(xmlText);
            const precSearch = parsed.PrecSearch;
            if (precSearch && precSearch.prec) {
              const precArray = Array.isArray(precSearch.prec) ? precSearch.prec : [precSearch.prec];
              precArray.forEach((item: any) => {
                const precId = String(item["판례일련번호"] || item.판례일련번호 || Math.random());
                const caseNum = item["사건번호"] || item.사건번호 || "";
                const caseTitle = cleanHtml(item["사건명"] || item.사건명 || "판례");
                
                // 외부 원문 포털 링크: 대국민 법제처 포털 검색 또는 대법원 종합법률정보 링크 (DRF API 경로 대신 대국민 열람 경로 사용)
                const searchKeyword = caseNum || caseTitle;
                const portalUrl = `https://www.law.go.kr/precSc.do?menuId=7&subMenuId=47&tabMenuId=213&query=${encodeURIComponent(searchKeyword)}`;

                results.push({
                  id: `prec-${precId}`,
                  type: "prec",
                  title: caseTitle,
                  subtitle: `${item["법원명"] || item.법원명 || ""} ${item["선고일자"] || item.선고일자 || ""} ${caseNum}`.trim(),
                  date: item["선고일자"] || item.선고일자,
                  court: item["법원명"] || item.법원명,
                  caseNumber: caseNum,
                  caseType: item["사건종류명"] || item.사건종류명,
                  issue: cleanHtml(item["판시사항"] || item.판시사항),
                  summary: cleanHtml(item["판결요지"] || item.판결요지),
                  detailUrl: portalUrl,
                });
              });
            }
          }
        } catch (e) {
          console.warn("[LawService] Prec API search failed:", (e as Error).message);
        }
      })());
    }

    // 2. 법령 검색
    if (targetType === "all" || targetType === "law") {
      promises.push((async () => {
        try {
          const lawUrl = `http://www.law.go.kr/DRF/lawSearch.do?OC=${LAW_API_OC}&target=law&type=XML&query=${encodeURIComponent(cleanQuery)}&page=${page}&display=20`;
          const res = await fetch(lawUrl, { signal: AbortSignal.timeout(4000) });
          if (res.ok) {
            const xmlText = await res.text();
            const parsed = parser.parse(xmlText);
            const lawSearch = parsed.LawSearch;
            if (lawSearch && lawSearch.law) {
              const lawArray = Array.isArray(lawSearch.law) ? lawSearch.law : [lawSearch.law];
              lawArray.forEach((item: any) => {
                const lawId = String(item["법령일련번호"] || item.법령일련번호 || item["법령ID"] || Math.random());
                const lawTitle = cleanHtml(item["법령명한글"] || item.법령명한글 || "법령");
                const portalLawUrl = `https://www.law.go.kr/LSW/lsSc.do?menuId=1&subMenuId=15&tabMenuId=81&query=${encodeURIComponent(lawTitle)}`;

                results.push({
                  id: `law-${lawId}`,
                  type: "law",
                  title: lawTitle,
                  subtitle: `${item["소관부처명"] || item.소관부처명 || ""} | 공포 ${item["공포일자"] || item.공포일자 || ""}`,
                  date: item["시행일자"] || item.시행일자 || item["공포일자"],
                  court: item["소관부처명"] || item.소관부처명,
                  summary: item["제개정구분명"] ? `[${item["제개정구분명"]}] 시행일자: ${item["시행일자"] || "공포 즉시"}` : undefined,
                  detailUrl: portalLawUrl,
                });
              });
            }
          }
        } catch (e) {
          console.warn("[LawService] Law API search failed:", (e as Error).message);
        }
      })());
    }

    await Promise.all(promises);

    // API 응답이 없거나 키가 유효하지 않을 때 Fallback 검색 매칭
    if (results.length === 0) {
      const tokens = cleanQuery.toLowerCase().split(/\s+/).filter(Boolean);
      const filtered = CURATED_PRECEDENTS.filter(item => {
        const targetText = [
          item.title,
          item.summary || "",
          item.issue || "",
          item.caseNumber || "",
          item.court || "",
          item.caseType || "",
          ...(item.articles || [])
        ].join(" ").toLowerCase();
        
        return tokens.some(tok => targetText.includes(tok));
      });

      return {
        totalCount: filtered.length,
        items: filtered.length > 0 ? filtered : CURATED_PRECEDENTS,
        source: "fallback"
      };
    }

    searchCache.set(cacheKey, { data: results, timestamp: Date.now() });
    return {
      totalCount: results.length,
      items: results,
      source: "api"
    };
  } catch (error) {
    console.error("[LawService] Search error:", error);
    return {
      totalCount: 0,
      items: [],
      source: "fallback"
    };
  }
}

// 판례 상세 조회
export async function getPrecedentDetail(precId: string): Promise<LawSearchResult | null> {
  // 1. Fallback 사전 검사
  const localMatch = CURATED_PRECEDENTS.find(p => p.id === precId || p.caseNumber === precId);
  if (localMatch) {
    return localMatch;
  }

  const rawId = precId.replace("prec-", "");
  try {
    const detailUrl = `http://www.law.go.kr/DRF/lawService.do?OC=${LAW_API_OC}&target=prec&ID=${rawId}&type=XML`;
    const res = await fetch(detailUrl, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const xmlText = await res.text();
      const parsed = parser.parse(xmlText);
      const prec = parsed.PrecService;
      if (prec) {
        return {
          id: precId,
          type: "prec",
          title: cleanHtml(prec["사건명"] || "판례 상세"),
          subtitle: `${prec["법원명"] || ""} ${prec["선고일자"] || ""} ${prec["사건번호"] || ""}`.trim(),
          date: prec["선고일자"],
          court: prec["법원명"],
          caseNumber: prec["사건번호"],
          caseType: prec["사건종류명"],
          issue: cleanHtml(prec["판시사항"]),
          summary: cleanHtml(prec["판결요지"]),
          fullContent: cleanHtml(prec["판례내용"]),
          articles: prec["참조조문"] ? [cleanHtml(prec["참조조문"])] : [],
        };
      }
    }
  } catch (e) {
    console.error("[LawService] Get prec detail failed:", e);
  }

  return localMatch || null;
}
