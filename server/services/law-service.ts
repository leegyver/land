import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
});

const LAW_API_OC = process.env.LAW_API_OC || process.env.LAW_API_KEY || "mino3120";

export interface LawSearchResult {
  id: string;
  type: "law" | "prec";
  title: string;
  subtitle?: string;
  date?: string;
  court?: string; // 판례: 법원명 (대법원) / 법령: 소관부처
  caseNumber?: string; // 판례: 사건번호 / 법령: 공포번호
  caseType?: string; // 판례: 사건종류명 / 법령: 법령구분명 (법률, 대통령령)
  summary?: string; // 판결요지 또는 제개정구분/시행일자
  issue?: string; // 판시사항
  fullContent?: string; // 판례 전문
  articles?: string[]; // 관련 조문
  detailUrl?: string; // 국가법령정보센터 공식 웹 링크
}

export interface CurationTheme {
  id: string;
  title: string;
  badge: string;
  description: string;
  keywords: string[];
  sampleCases: string[];
}

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

// 법령 전용 큐레이션 데이터 (최신 시행/공포일자 내림차순 정렬)
export const CURATED_LAWS: LawSearchResult[] = [
  {
    id: "law-287183",
    type: "law",
    title: "주택임대차보호법 시행령",
    subtitle: "법무부, 국토교통부 | 대통령령 제36423호",
    date: "2026.07.01",
    court: "국토교통부",
    caseNumber: "제36423호",
    caseType: "대통령령",
    summary: "[일부개정] 주택임대차보호법에서 위임된 소액보증금의 범위, 최우선변제금의 범위(서울 5,500만원, 과밀억제권역·세종·김포 4,800만원, 광역시·안산·광주·파주·이천 2,800만원, 그 밖의 지역 2,500만원 등) 규정.",
    articles: ["제10조(보증금 중 일정액의 범위 등)", "제11조(우선변제를 받을 임차인의 범위)"],
    detailUrl: "https://www.law.go.kr/법령/주택임대차보호법 시행령"
  },
  {
    id: "law-276291",
    type: "law",
    title: "주택임대차보호법",
    subtitle: "법무부, 국토교통부 | 법률 제21065호",
    date: "2026.01.02",
    court: "법무부",
    caseNumber: "제21065호",
    caseType: "법률",
    summary: "[일부개정] 주택의 임대차에 관하여 「민법」에 대한 특례를 규정함으로써 국민 주거생활의 안정을 보장함을 목적으로 한다. 대항력(제3조), 보증금의 우선변제권(제3조의2), 임차권등기명령(제3조의3), 계약갱신요구(제6조의3) 등 규정.",
    articles: ["제3조(대항력 등)", "제3조의2(보증금의 회수)", "제8조(보증금 중 일정액의 보호)"],
    detailUrl: "https://www.law.go.kr/법령/주택임대차보호법"
  },
  {
    id: "law-263401",
    type: "law",
    title: "상가건물 임대차보호법",
    subtitle: "법무부 | 법률 제20401호",
    date: "2024.12.01",
    court: "법무부",
    caseNumber: "제20401호",
    caseType: "법률",
    summary: "[일부개정] 상가건물 임대차에 대한 특례 규정. 사업자등록과 인도에 의한 대항력(제3조), 10년간의 계약갱신요구권(제10조), 권리금 회수기회 보호 및 임대인의 손해배상책임(제10조의4) 규정.",
    articles: ["제3조(대항력 등)", "제10조(계약갱신 요구 등)", "제10조의4(권리금 회수기회 보호 등)"],
    detailUrl: "https://www.law.go.kr/법령/상가건물 임대차보호법"
  },
  {
    id: "law-258902",
    type: "law",
    title: "공인중개사법",
    subtitle: "국토교통부 | 법률 제20150호",
    date: "2024.07.10",
    court: "국토교통부",
    caseNumber: "제20150호",
    caseType: "법률",
    summary: "[일부개정] 중개대상물의 확인·설명의무(제25조: 권리관계, 선순위 보증금 내역 등), 손해배상책임의 보장(제30조: 공제 가입 의무), 금지행위 및 중개보수 기준 규정.",
    articles: ["제25조(중개대상물의 확인·설명)", "제30조(손해배상책임의 보장)"],
    detailUrl: "https://www.law.go.kr/법령/공인중개사법"
  },
  {
    id: "law-254129",
    type: "law",
    title: "민사집행법",
    subtitle: "법무부 | 법률 제19920호",
    date: "2024.06.01",
    court: "법무부",
    caseNumber: "제19920호",
    caseType: "법률",
    summary: "[일부개정] 부동산 강제경매 및 담보권 실행을 위한 경매절차 규정. 매각절차, 배당요구의 종기, 매수인의 대금지급 및 소유권취득, 인도명령(제136조) 등 부동산 경매 실무의 기본법률.",
    articles: ["제83조(경매개시결정)", "제84조(배당요구의 종기)", "제136조(부동산의 인도명령)"],
    detailUrl: "https://www.law.go.kr/법령/민사집행법"
  },
  {
    id: "law-245100",
    type: "law",
    title: "민법 (물권편 · 채권편)",
    subtitle: "법무부 | 법률 제19000호",
    date: "2023.08.01",
    court: "법무부",
    caseNumber: "제19000호",
    caseType: "법률",
    summary: "[일부개정] 주위토지통행권(제219조), 유치권(제320조), 저당권(제356조), 법정지상권(제366조), 임대차(제618조) 등 부동산 거래와 권리분석의 총괄 기본법.",
    articles: ["제219조(주위토지통행권)", "제320조(유치권의 내용)", "제366조(법정지상권)"],
    detailUrl: "https://www.law.go.kr/법령/민법"
  }
];

// 판례 전용 큐레이션 데이터 (최신 선고일자 내림차순 정렬)
export const CURATED_PRECEDENTS: LawSearchResult[] = [
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
    detailUrl: "https://www.law.go.kr/LSW/precInfoP.do?precSeq=618185"
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
    detailUrl: "https://www.law.go.kr/LSW/precInfoP.do?precSeq=241512"
  },
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
    detailUrl: "https://www.law.go.kr/LSW/precInfoP.do?precSeq=197821"
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
    detailUrl: "https://www.law.go.kr/LSW/precInfoP.do?precSeq=179421"
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
    detailUrl: "https://www.law.go.kr/LSW/precInfoP.do?precSeq=117392"
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
    detailUrl: "https://www.law.go.kr/LSW/precInfoP.do?precSeq=98621"
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
    detailUrl: "https://www.law.go.kr/LSW/precInfoP.do?precSeq=73602"
  }
];

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

// 20260701 -> 2026.07.01 표준화 포맷터
function formatDateString(val: any): string {
  if (!val) return "";
  const s = String(val).trim();
  if (/^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`;
  }
  return s;
}

// 날짜 문자열/숫자를 안전하게 정수(YYYYMMDD)로 변환
function parseDateNum(val: any): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  return parseInt(String(val).replace(/\D/g, ""), 10) || 0;
}

// 날짜(선고일자 / 시행일자 / 공포일자) 기준 최신순(내림차순) 정렬 헬퍼
function sortByDateDesc(items: LawSearchResult[]): LawSearchResult[] {
  return [...items].sort((a, b) => parseDateNum(b.date) - parseDateNum(a.date));
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 검색어 관련도 점수 계산기 (제목/판시사항/요지/사건번호 가중치)
export function calculateRelevanceScore(item: LawSearchResult, query: string): number {
  if (!query || !query.trim()) {
    // 검색어가 없을 때는 실무 중요도(랜드마크 리딩판례) 우선순위 점수
    const curatedPriority: Record<string, number> = {
      "prec-2018다252441": 100, // 상가 권리금 10년 초과 보호
      "prec-2011다44788": 95,   // 경매 압류 후 유치권 대항력 배제
      "prec-2001다76427": 90,   // 대항력 전입 익일 0시 vs 근저당권
      "prec-2022다238141": 85,  // 공인중개사 선순위 보증금 확인설명의무
      "prec-2007다63074": 80,   // 소액임차인 배당요구종기
      "prec-2016다18797": 75,   // 맹지 주위토지통행권
      "prec-2025다210305": 70,  // 전세임대주택 대항력 소멸
      "law-276291": 100,        // 주택임대차보호법
      "law-263401": 95,         // 상가건물 임대차보호법
      "law-254129": 90,         // 민사집행법
      "law-258902": 85,         // 공인중개사법
      "law-287183": 80,         // 주택임대차보호법 시행령
      "law-245100": 75,         // 민법
    };
    return curatedPriority[item.id] || 10;
  }

  const cleanQ = query.trim().toLowerCase();
  const tokens = cleanQ.split(/\s+/).filter(w => w.length >= 2);
  let score = 0;

  const title = (item.title || "").toLowerCase();
  const issue = (item.issue || "").toLowerCase();
  const summary = (item.summary || "").toLowerCase();
  const caseNumber = (item.caseNumber || "").toLowerCase();

  // 1. 사건명/법령명 완전 또는 부분 일치 (가장 높은 가중치)
  if (title === cleanQ) {
    score += 1000;
  } else if (title.startsWith(cleanQ)) {
    score += 600;
  } else if (title.includes(cleanQ)) {
    score += 400;
  }

  // 2. 사건번호 검색 매칭
  if (caseNumber && caseNumber.includes(cleanQ)) {
    score += 800;
  }

  // 3. 판시사항(핵심 쟁점) 포함
  if (issue.includes(cleanQ)) {
    score += 200;
  }

  // 4. 판결요지(이유 요약) 포함
  if (summary.includes(cleanQ)) {
    score += 100;
  }

  // 5. 검색어 개별 토큰 일치 가중치
  tokens.forEach(tok => {
    if (title.includes(tok)) score += 120;
    if (issue.includes(tok)) score += 50;
    if (summary.includes(tok)) score += 25;
  });

  // 6. 제목 내 출현 횟수 추가 가산
  try {
    const reg = new RegExp(escapeRegex(cleanQ), "gi");
    const matches = title.match(reg);
    if (matches) score += matches.length * 50;
  } catch (e) {}

  return score;
}

// 관련도순 정렬 (동점일 경우 최신 선고순)
function sortByRelevance(items: LawSearchResult[], query: string): LawSearchResult[] {
  return [...items].sort((a, b) => {
    const scoreA = calculateRelevanceScore(a, query);
    const scoreB = calculateRelevanceScore(b, query);
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    return parseDateNum(b.date) - parseDateNum(a.date);
  });
}

// 메모리 캐시 (1시간 유지)
const searchCache = new Map<string, { data: LawSearchResult[]; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1시간

export async function searchLawsAndPrecedents(
  query: string, 
  targetType: "all" | "law" | "prec" = "all", 
  page: number = 1,
  sort: "latest" | "accuracy" = "latest"
): Promise<{
  totalCount: number;
  items: LawSearchResult[];
  source: "api" | "fallback";
}> {
  const cleanQuery = query.trim();
  const cacheKey = `${cleanQuery}_${targetType}_${page}_${sort}`;

  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      totalCount: cached.data.length,
      items: cached.data,
      source: "api",
    };
  }

  // 1. 검색어가 없을 때 기본 추천 데이터 반환 (탭별 엄격 분리 및 정렬 옵션 반영!)
  if (!cleanQuery) {
    let list: LawSearchResult[] = [];
    if (targetType === "prec") {
      list = CURATED_PRECEDENTS;
    } else if (targetType === "law") {
      list = CURATED_LAWS;
    } else {
      list = [...CURATED_PRECEDENTS, ...CURATED_LAWS];
    }
    const sortedList = sort === "accuracy" ? sortByRelevance(list, "") : sortByDateDesc(list);
    return {
      totalCount: sortedList.length,
      items: sortedList,
      source: "fallback",
    };
  }

  const results: LawSearchResult[] = [];

  try {
    const promises: Promise<void>[] = [];

    // ── [1] 판례 검색: 오직 'all' 또는 'prec' 탭일 때만 실행! ──
    if (targetType === "all" || targetType === "prec") {
      promises.push((async () => {
        try {
          // search=2: 판례 본문(판시사항, 판결요지, 주문, 이유) 전체 검색
          // curt=대법원: 100% 대법원 판례만 필터링
          // sort=ddes: 선고일자 내림차순(최신 판례 우선)
          // display=50: 한 번에 50건 조회
          const precUrl = `http://www.law.go.kr/DRF/lawSearch.do?OC=${LAW_API_OC}&target=prec&type=XML&query=${encodeURIComponent(cleanQuery)}&search=2&curt=${encodeURIComponent("대법원")}&sort=ddes&page=${page}&display=50`;
          let res = await fetch(precUrl, { signal: AbortSignal.timeout(4500) });
          
          let xmlText = res.ok ? await res.text() : "";
          let parsed = parser.parse(xmlText);
          let precSearch = parsed?.PrecSearch;

          // 만약 본문 검색으로 0건인데 검색어가 긴 문장일 경우, 핵심 단어로 재검색
          if ((!precSearch || !precSearch.prec) && cleanQuery.includes(" ")) {
            const firstKeywords = cleanQuery.split(/\s+/).filter(w => w.length >= 2).slice(0, 2).join(" ");
            if (firstKeywords && firstKeywords !== cleanQuery) {
              const retryUrl = `http://www.law.go.kr/DRF/lawSearch.do?OC=${LAW_API_OC}&target=prec&type=XML&query=${encodeURIComponent(firstKeywords)}&search=2&curt=${encodeURIComponent("대법원")}&sort=ddes&page=${page}&display=50`;
              const retryRes = await fetch(retryUrl, { signal: AbortSignal.timeout(4500) });
              if (retryRes.ok) {
                const retryXml = await retryRes.text();
                const retryParsed = parser.parse(retryXml);
                if (retryParsed?.PrecSearch?.prec) {
                  precSearch = retryParsed.PrecSearch;
                }
              }
            }
          }

          if (precSearch && precSearch.prec) {
            const precArray = Array.isArray(precSearch.prec) ? precSearch.prec : [precSearch.prec];
            precArray.forEach((item: any) => {
              const courtName = item["법원명"] || item.법원명 || "";
              // 대법원 판례만 엄격 필터링
              if (courtName && !courtName.includes("대법원")) {
                return;
              }

              const precSeq = String(item["판례일련번호"] || item.판례일련번호 || "");
              const caseNum = item["사건번호"] || item.사건번호 || "";
              const caseTitle = cleanHtml(item["사건명"] || item.사건명 || "판례");
              
              // 국가법령정보센터 공식 웹 퍼머링크 (실제 대국민 열람 링크!)
              // https://www.law.go.kr/LSW/precInfoP.do?precSeq=XXXXXX
              const officialWebUrl = precSeq 
                ? `https://www.law.go.kr/LSW/precInfoP.do?precSeq=${precSeq}`
                : `https://www.law.go.kr/LSW/precSearchP.do?q=${encodeURIComponent(caseNum || caseTitle)}`;

              const precDate = formatDateString(item["선고일자"] || item.선고일자);

              results.push({
                id: `prec-${precSeq || Math.random()}`,
                type: "prec", // 명확하게 판례 타입 지정
                title: caseTitle,
                subtitle: `대법원 ${precDate} ${caseNum}`.trim(),
                date: precDate,
                court: "대법원",
                caseNumber: caseNum,
                caseType: item["사건종류명"] || item.사건종류명 || "민사",
                issue: cleanHtml(item["판시사항"] || item.판시사항),
                summary: cleanHtml(item["판결요지"] || item.판결요지),
                detailUrl: officialWebUrl,
              });
            });
          }
        } catch (e) {
          console.warn("[LawService] Prec API search failed:", (e as Error).message);
        }
      })());
    }

    // ── [2] 법령 검색: 오직 'all' 또는 'law' 탭일 때만 실행! ──
    if (targetType === "all" || targetType === "law") {
      promises.push((async () => {
        try {
          const lawUrl = `http://www.law.go.kr/DRF/lawSearch.do?OC=${LAW_API_OC}&target=law&type=XML&query=${encodeURIComponent(cleanQuery)}&sort=ddes&page=${page}&display=50`;
          const res = await fetch(lawUrl, { signal: AbortSignal.timeout(4000) });
          if (res.ok) {
            const xmlText = await res.text();
            const parsed = parser.parse(xmlText);
            const lawSearch = parsed?.LawSearch;
            if (lawSearch && lawSearch.law) {
              const lawArray = Array.isArray(lawSearch.law) ? lawSearch.law : [lawSearch.law];
              lawArray.forEach((item: any) => {
                const lawSeq = String(item["법령일련번호"] || item.법령일련번호 || item["법령ID"] || "");
                const lawTitle = cleanHtml(item["법령명한글"] || item.법령명한글 || "법령");
                
                // 국가법령정보센터 공식 법령 웹 퍼머링크 (법령정보식별 디지털 딥링크 규격)
                // https://www.law.go.kr/법령/{법령명} -> 404 없이 현행 법령 본문으로 100% 이동
                const pureLawTitle = lawTitle
                  .replace(/\[.*?\]/g, "")
                  .replace(/\(.*?\)/g, "")
                  .trim();
                const officialLawUrl = pureLawTitle
                  ? `https://www.law.go.kr/법령/${encodeURIComponent(pureLawTitle)}`
                  : `https://www.law.go.kr/lsSc.do?menuId=1&query=${encodeURIComponent(lawTitle)}`;

                const lawDate = formatDateString(item["시행일자"] || item.시행일자 || item["공포일자"]);
                const pubDate = formatDateString(item["공포일자"] || item.공포일자);

                results.push({
                  id: `law-${lawSeq || Math.random()}`,
                  type: "law", // 명확하게 법령 타입 지정
                  title: lawTitle,
                  subtitle: `${item["소관부처명"] || item.소관부처명 || ""} | 공포 ${pubDate}`.trim(),
                  date: lawDate,
                  court: item["소관부처명"] || item.소관부처명 || "정부부처",
                  caseType: item["법령구분명"] || item.법령구분명 || "법령",
                  summary: item["제개정구분명"] ? `[${item["제개정구분명"]}] 시행일자: ${lawDate || "공포 즉시"}` : undefined,
                  detailUrl: officialLawUrl,
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

    // ── [3] 결과가 없을 때 Fallback 검색 (최신순 정렬 및 탭별 철저히 격리!!) ──
    if (results.length === 0) {
      const tokens = cleanQuery.toLowerCase().split(/\s+/).filter(Boolean);

      // 법령 탭이면 오직 CURATED_LAWS에서만 검색! (판례 절대 유입 금지)
      if (targetType === "law") {
        const filteredLaws = CURATED_LAWS.filter(item => {
          const targetText = [
            item.title,
            item.summary || "",
            item.court || "",
            ...(item.articles || [])
          ].join(" ").toLowerCase();
          return tokens.some(tok => targetText.includes(tok));
        });

        const targetList = filteredLaws.length > 0 ? filteredLaws : CURATED_LAWS;
        const sortedLaws = sort === "accuracy" ? sortByRelevance(targetList, cleanQuery) : sortByDateDesc(targetList);
        return {
          totalCount: sortedLaws.length,
          items: sortedLaws,
          source: "fallback"
        };
      }

      // 판례 탭이면 오직 CURATED_PRECEDENTS에서만 검색!
      if (targetType === "prec") {
        const filteredPrecs = CURATED_PRECEDENTS.filter(item => {
          const targetText = [
            item.title,
            item.summary || "",
            item.issue || "",
            item.caseNumber || "",
            ...(item.articles || [])
          ].join(" ").toLowerCase();
          return tokens.some(tok => targetText.includes(tok));
        });

        const targetList = filteredPrecs.length > 0 ? filteredPrecs : CURATED_PRECEDENTS;
        const sortedPrecs = sort === "accuracy" ? sortByRelevance(targetList, cleanQuery) : sortByDateDesc(targetList);
        return {
          totalCount: sortedPrecs.length,
          items: sortedPrecs,
          source: "fallback"
        };
      }

      // 전체 탭인 경우 둘 다 매칭 후 정렬
      const allFallback = [...CURATED_PRECEDENTS, ...CURATED_LAWS];
      const filteredAll = allFallback.filter(item => {
        const targetText = [
          item.title,
          item.summary || "",
          item.issue || "",
          item.caseNumber || "",
          item.court || "",
          ...(item.articles || [])
        ].join(" ").toLowerCase();
        return tokens.some(tok => targetText.includes(tok));
      });

      const targetList = filteredAll.length > 0 ? filteredAll : allFallback;
      const sortedAll = sort === "accuracy" ? sortByRelevance(targetList, cleanQuery) : sortByDateDesc(targetList);
      return {
        totalCount: sortedAll.length,
        items: sortedAll,
        source: "fallback"
      };
    }

    // 탭 선택에 따른 최종 방어 필터링 (결과 내 타입 일치 보장)
    let finalItems = results;
    if (targetType === "prec") {
      finalItems = results.filter(r => r.type === "prec");
    } else if (targetType === "law") {
      finalItems = results.filter(r => r.type === "law");
    }

    // ★ 정렬 적용: 관련도순(accuracy) 또는 최신 선고일자/시행일자순(latest)
    if (sort === "accuracy") {
      finalItems = sortByRelevance(finalItems, cleanQuery);
    } else {
      finalItems = sortByDateDesc(finalItems);
    }

    if (finalItems.length > 0) {
      searchCache.set(cacheKey, { data: finalItems, timestamp: Date.now() });
    }
    return {
      totalCount: finalItems.length,
      items: finalItems,
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

// 판례 상세 조회 (법제처 공식 API 연동)
export async function getPrecedentDetail(precId: string): Promise<LawSearchResult | null> {
  const localMatch = CURATED_PRECEDENTS.find(p => p.id === precId || p.caseNumber === precId);
  
  const rawId = precId.replace("prec-", "");
  try {
    const detailUrl = `http://www.law.go.kr/DRF/lawService.do?OC=${LAW_API_OC}&target=prec&ID=${rawId}&type=XML`;
    const res = await fetch(detailUrl, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const xmlText = await res.text();
      const parsed = parser.parse(xmlText);
      const prec = parsed?.PrecService;
      if (prec) {
        const precSeq = prec["판례정보일련번호"] || rawId;
        return {
          id: precId,
          type: "prec",
          title: cleanHtml(prec["사건명"] || "판례 상세"),
          subtitle: `대법원 ${prec["선고일자"] || ""} ${prec["사건번호"] || ""}`.trim(),
          date: prec["선고일자"],
          court: "대법원",
          caseNumber: prec["사건번호"],
          caseType: prec["사건종류명"] || "민사",
          issue: cleanHtml(prec["판시사항"]),
          summary: cleanHtml(prec["판결요지"]),
          fullContent: cleanHtml(prec["판례내용"]),
          articles: prec["참조조문"] ? [cleanHtml(prec["참조조문"])] : [],
          detailUrl: `https://www.law.go.kr/LSW/precInfoP.do?precSeq=${precSeq}`
        };
      }
    }
  } catch (e) {
    console.error("[LawService] Get prec detail failed:", e);
  }

  return localMatch || null;
}
