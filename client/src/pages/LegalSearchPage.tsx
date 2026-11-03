import { useState, useEffect, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  Scale, 
  Gavel, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink, 
  Share2, 
  BookOpen, 
  ArrowRight, 
  HelpCircle,
  Building2,
  Calendar,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Lightbulb
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface LawItem {
  id: string;
  type: "law" | "prec";
  title: string;
  subtitle?: string;
  date?: string;
  court?: string;
  caseNumber?: string;
  caseType?: string;
  summary?: string;
  issue?: string;
  fullContent?: string;
  articles?: string[];
  detailUrl?: string;
}

interface CurationTheme {
  id: string;
  title: string;
  badge: string;
  description: string;
  keywords: string[];
  sampleCases: string[];
}

// 클라이언트 즉시 반응형 관련도 점수 계산기 (제목/판시사항/요지/사건번호 가중치)
function calculateClientRelevanceScore(item: LawItem, query: string): number {
  if (!query || !query.trim()) {
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
  const tokens = cleanQ.split(/\s+/).filter((w) => w.length >= 2);
  let score = 0;

  const title = (item.title || "").toLowerCase();
  const issue = (item.issue || "").toLowerCase();
  const summary = (item.summary || "").toLowerCase();
  const caseNumber = (item.caseNumber || "").toLowerCase();

  if (title === cleanQ) {
    score += 1000;
  } else if (title.startsWith(cleanQ)) {
    score += 600;
  } else if (title.includes(cleanQ)) {
    score += 400;
  }

  if (caseNumber && caseNumber.includes(cleanQ)) {
    score += 800;
  }

  if (issue.includes(cleanQ)) {
    score += 200;
  }

  if (summary.includes(cleanQ)) {
    score += 100;
  }

  tokens.forEach((tok) => {
    if (title.includes(tok)) score += 120;
    if (issue.includes(tok)) score += 50;
    if (summary.includes(tok)) score += 25;
  });

  return score;
}

// 법령/판례 외부 원문 링크 안전 생성기 (법제처 404 방지 디지털 딥링크 표준 적용)
function getSafeDetailUrl(item: LawItem): string {
  if (item.type === "law") {
    const pureTitle = (item.title || "")
      .replace(/\[.*?\]/g, "")
      .replace(/\(.*?\)/g, "")
      .trim();
    if (pureTitle) {
      return `https://www.law.go.kr/법령/${encodeURIComponent(pureTitle)}`;
    }
    return item.detailUrl || "https://www.law.go.kr";
  }
  return item.detailUrl || `https://www.law.go.kr/LSW/precSearchP.do?q=${encodeURIComponent(item.caseNumber || item.title)}`;
}

// 모바일/데스크톱 반응형 5개 페이지 번호 윈도우 계산
function getPageNumbers(current: number, total: number): number[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, 4, 5];
  }
  if (current >= total - 2) {
    return [total - 4, total - 3, total - 2, total - 1, total];
  }
  return [current - 2, current - 1, current, current + 1, current + 2];
}

export default function LegalSearchPage() {
  const [, setLocation] = useLocation();
  const [matchDetail, detailParams] = useRoute("/legal/:type/:id");
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "prec" | "law">("all");
  const [sortBy, setSortBy] = useState<"latest" | "accuracy">("latest");
  const [selectedItem, setSelectedItem] = useState<LawItem | null>(null);
  const [showFullContent, setShowFullContent] = useState(false);

  // URL에서 쿼리스트링 q 읽어오기 (메인 화면 검색창 등에서 유입 시)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const qParam = urlParams.get("q");
    if (qParam) {
      setSearchQuery(qParam);
      setActiveQuery(qParam);
    }
  }, []);

  // 1. 테마 큐레이션 데이터 조회
  const { data: curationsData } = useQuery<{ success: boolean; themes: CurationTheme[] }>({
    queryKey: ["/api/law/curations"],
    queryFn: async () => {
      const res = await fetch("/api/law/curations");
      return res.json();
    },
  });

  // 2. 법령 및 판례 검색 쿼리
  const { data: searchData, isLoading, refetch } = useQuery<{
    success: boolean;
    totalCount: number;
    items: LawItem[];
    source: "api" | "fallback";
  }>({
    queryKey: ["/api/law/search", activeQuery, activeTab, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: activeQuery,
        type: activeTab,
        sort: sortBy,
      });
      const res = await fetch(`/api/law/search?${params.toString()}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5분
  });

  // 개별 판례 상세 URL 직접 진입 처리
  useEffect(() => {
    if (matchDetail && detailParams?.id) {
      fetch(`/api/law/precedent/${detailParams.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setSelectedItem(data.data);
          }
        })
        .catch(() => {});
    }
  }, [matchDetail, detailParams]);

  // 탭에 따른 엄격한 2차 필터링 및 정렬 (최신 선고순 vs 관련도순)
  const displayedItems = useMemo(() => {
    const list = (searchData?.items || []).filter((item) => {
      if (activeTab === "prec") return item.type === "prec";
      if (activeTab === "law") return item.type === "law";
      return true;
    });

    if (sortBy === "accuracy") {
      return [...list].sort((a, b) => {
        const scoreA = calculateClientRelevanceScore(a, activeQuery);
        const scoreB = calculateClientRelevanceScore(b, activeQuery);
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        const numA = parseInt((a.date || "").replace(/\D/g, ""), 10) || 0;
        const numB = parseInt((b.date || "").replace(/\D/g, ""), 10) || 0;
        return numB - numA;
      });
    }

    return [...list].sort((a, b) => {
      const numA = parseInt((a.date || "").replace(/\D/g, ""), 10) || 0;
      const numB = parseInt((b.date || "").replace(/\D/g, ""), 10) || 0;
      return numB - numA;
    });
  }, [searchData?.items, activeTab, sortBy, activeQuery]);

  // 페이지당 10건 분할 페이지네이션
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // 검색어, 탭, 정렬 변경 시 1페이지로 자동 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [activeQuery, activeTab, sortBy]);

  const totalPages = Math.ceil(displayedItems.length / ITEMS_PER_PAGE) || 1;

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return displayedItems.slice(start, start + ITEMS_PER_PAGE);
  }, [displayedItems, currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const el = document.getElementById("search-results-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(searchQuery.trim());
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    setActiveQuery(tag);
  };

  const handleOpenDetail = async (item: LawItem) => {
    setSelectedItem(item);
    setShowFullContent(false);
    // 판례인 경우 상세 API 호출하여 전문/요지 가져오기
    if (item.type === "prec") {
      try {
        const res = await fetch(`/api/law/precedent/${item.id}`);
        const data = await res.json();
        if (data.success && data.data) {
          setSelectedItem(prev => prev ? { ...prev, ...data.data } : data.data);
        }
      } catch (e) {
        console.error("Failed to load full prec detail", e);
      }
    }
  };

  const handleCopyLink = (item: LawItem) => {
    const url = `${window.location.origin}/legal/${item.type}/${item.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "링크가 복사되었습니다",
      description: "판례 고유 URL이 클립보드에 복사되었습니다.",
    });
  };

  const popularKeywords = [
    "주택임대차보호법",
    "대항력",
    "우선변제권",
    "유치권",
    "법정지상권",
    "상가 권리금",
    "공인중개사 확인설명",
    "주위토지통행권",
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Hero Header */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white py-12 md:py-16 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-none px-3 py-1 text-xs md:text-sm font-semibold tracking-wide">
            <Scale className="w-3.5 h-3.5 mr-1 inline" /> 대한민국 법령 및 대법원 판례 검색센터
          </Badge>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            부동산 · 경매 실무에 필요한<br />
            <span className="text-orange-400">법률 조문과 핵심 판례</span>를 바로 찾아보세요
          </h1>

          <p className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            법원등록 공인중개사가 검증한 대법원 판례와 최신 법령 데이터베이스.<br className="hidden sm:inline" />
            권리분석, 전세보증금 분쟁, 명도, 상가 권리금까지 빠르고 정확하게 검색할 수 있습니다.
          </p>

          {/* Search Bar */}
          <div className="pt-4 max-w-3xl mx-auto">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center shadow-2xl rounded-2xl bg-white p-2 border-2 border-orange-400/80 focus-within:ring-4 focus-within:ring-orange-500/20">
              <Search className="w-6 h-6 text-slate-400 ml-3 mr-2 shrink-0" />
              <Input
                type="text"
                placeholder="대법원 판례 본문, 판시사항, 사건번호 검색 (예: 임차권등기명령, 유치권 성립, 2021다252441)"
                className="border-none shadow-none text-slate-900 placeholder:text-slate-400 text-base md:text-lg focus-visible:ring-0 px-2 py-3 h-auto"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-6 rounded-xl text-base shrink-0 shadow-md">
                대법원 판례 검색
              </Button>
            </form>

            {/* Popular Keyword Chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-4 text-xs md:text-sm text-slate-300">
              <span className="text-slate-400 font-medium">자주 찾는 키워드:</span>
              {popularKeywords.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => handleTagClick(kw)}
                  className="bg-slate-800/80 hover:bg-orange-500/20 hover:text-orange-300 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 transition-all text-xs"
                >
                  #{kw}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 mt-8 space-y-10">

        {/* 1. 부동산 실무 테마 큐레이션 (SEO 롱테일 공략) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 text-slate-900">
                <Sparkles className="w-5 h-5 text-orange-500" />
                부동산·경매 실무 핵심 테마
              </h2>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                실제 분쟁과 경매 입찰에서 가장 자주 참조되는 대표 판례 주제입니다.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {curationsData?.themes?.map((theme) => (
              <Card 
                key={theme.id} 
                className="hover:border-orange-300 hover:shadow-md transition-all cursor-pointer group bg-white border-slate-200"
                onClick={() => handleTagClick(theme.keywords[0])}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs font-semibold">
                      {theme.badge}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors pt-1">
                    {theme.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {theme.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {theme.keywords.map((kw) => (
                      <span key={kw} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 2. 검색 필터 & 결과 리스트 */}
        <section id="search-results-section" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                {activeQuery ? `'${activeQuery}' 검색 결과` : "실무 추천 판례"}
              </h2>
              <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                총 {displayedItems.length}건
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto">
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
                <TabsList className="bg-slate-100 p-1">
                  <TabsTrigger value="all" className="text-xs md:text-sm font-semibold whitespace-nowrap px-2.5 sm:px-3">전체</TabsTrigger>
                  <TabsTrigger value="prec" className="text-xs md:text-sm font-semibold whitespace-nowrap px-2.5 sm:px-3">판례 (대법원)</TabsTrigger>
                  <TabsTrigger value="law" className="text-xs md:text-sm font-semibold whitespace-nowrap px-2.5 sm:px-3">법령 (법제처)</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* 최신순 / 관련도순 정렬 토글 */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80 text-xs shrink-0 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => setSortBy("latest")}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer touch-manipulation ${
                    sortBy === "latest"
                      ? "bg-white text-orange-600 shadow-sm font-bold"
                      : "text-slate-500 hover:text-slate-800 font-medium"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  최신 선고순
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy("accuracy")}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer touch-manipulation ${
                    sortBy === "accuracy"
                      ? "bg-white text-orange-600 shadow-sm font-bold"
                      : "text-slate-500 hover:text-slate-800 font-medium"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  관련도순
                </button>
              </div>
            </div>
          </div>

          {/* 50건 이상 검색 시 상세 검색 유도 안내 배너 */}
          {displayedItems.length >= 50 && (
            <div className="bg-gradient-to-r from-amber-50/95 via-orange-50/80 to-amber-50/95 border border-amber-200/90 rounded-xl p-4 sm:p-5 shadow-xs text-slate-800">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0 mt-0.5 shadow-xs">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-bold text-sm sm:text-base text-amber-950 flex items-center gap-1.5">
                      정확한 검색을 위해서 필요한 단어들을 추가하세요
                    </h4>
                    <span className="text-[11px] sm:text-xs font-semibold bg-amber-200/70 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                      검색결과 {displayedItems.length}건 이상
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    검색된 판례가 많아 원하시는 내용을 한눈에 찾기 어려우실 수 있습니다.<br className="hidden sm:inline" />
                    찾으시는 <strong>핵심 단어나 구체적 상황(2단어 이상)</strong> 또는 <strong>사건번호</strong>를 검색창에 덧붙여 입력해 보세요.
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                    <span className="text-slate-500 font-semibold text-[11px] sm:text-xs">추천 검색 팁:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newQ = `${activeQuery || '상가 권리금'} 10년`.trim();
                        setSearchQuery(newQ);
                        setActiveQuery(newQ);
                      }}
                      className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors shadow-2xs"
                    >
                      + "10년" 추가
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newQ = `${activeQuery || '대항력'} 전입 익일 0시`.trim();
                        setSearchQuery(newQ);
                        setActiveQuery(newQ);
                      }}
                      className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors shadow-2xs"
                    >
                      + "전입 익일 0시"
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newQ = `${activeQuery || '경매'} 압류 유치권 배제`.trim();
                        setSearchQuery(newQ);
                        setActiveQuery(newQ);
                      }}
                      className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors shadow-2xs"
                    >
                      + "압류 유치권 배제"
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results List */}
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-orange-500 mx-auto" />
              <p className="text-sm text-slate-500">법령 및 판례 데이터를 조회 중입니다...</p>
            </div>
          ) : displayedItems.length > 0 ? (
            <div className="space-y-4">
              {paginatedItems.map((item) => (
                <Card 
                  key={item.id} 
                  className="bg-white border-slate-200 hover:border-slate-300 hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className={item.type === "prec" ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"}>
                          {item.type === "prec" ? (
                            <><Gavel className="w-3 h-3 mr-1 inline" /> 판례</>
                          ) : (
                            <><FileText className="w-3 h-3 mr-1 inline" /> 법령</>
                          )}
                        </Badge>
                        {item.court && (
                          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {item.court}
                          </span>
                        )}
                        {item.caseNumber && (
                          <span className="text-xs font-mono text-slate-500">
                            {item.caseNumber}
                          </span>
                        )}
                      </div>
                      {item.date && (
                        <div className="flex items-center text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-md gap-1">
                          <Calendar className="w-3.5 h-3.5 text-orange-500" />
                          <span>{item.type === "prec" ? `선고 ${item.date}` : `시행 ${item.date}`}</span>
                        </div>
                      )}
                    </div>

                    <CardTitle className="text-base sm:text-lg font-bold text-slate-900 pt-2 leading-snug">
                      {item.title}
                    </CardTitle>
                    {item.subtitle && (
                      <CardDescription className="text-xs sm:text-sm text-slate-500 font-medium">
                        {item.subtitle}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3 pt-1 pb-3">
                    {/* 판시사항 */}
                    {item.issue && (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs sm:text-sm text-slate-700">
                        <strong className="text-slate-900 font-semibold block mb-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-blue-600" /> 판시사항
                        </strong>
                        <p className="line-clamp-2 leading-relaxed">{item.issue}</p>
                      </div>
                    )}

                    {/* 판결요지 */}
                    {item.summary && (
                      <div className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        <strong className="text-slate-800 font-semibold block mb-1">판결요지</strong>
                        <p className="line-clamp-3 bg-orange-50/50 p-3 rounded-lg border border-orange-100/60">
                          {item.summary}
                        </p>
                      </div>
                    )}

                    {/* 관련 법령 조문 태그 */}
                    {item.articles && item.articles.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.articles.map((art, idx) => (
                          <Badge key={idx} variant="outline" className="text-[11px] text-slate-500 border-slate-200">
                            {art}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-2 pb-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4"
                        onClick={() => handleOpenDetail(item)}
                      >
                        상세 전문 보기
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-500 hover:text-slate-900 gap-1"
                        onClick={() => handleCopyLink(item)}
                      >
                        <Share2 className="w-3.5 h-3.5" /> 공유 링크 복사
                      </Button>
                    </div>

                    {item.detailUrl && (
                      <a
                        href={getSafeDetailUrl(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-semibold"
                      >
                        {item.type === "prec" ? "대법원 판례 원문 보기" : "법제처 법령 원문 보기"} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </CardFooter>
                </Card>
              ))}

              {/* 페이지네이션 (10건 단위 분할 탐색) */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">
                    총 <strong className="text-slate-800">{displayedItems.length}</strong>건 중{" "}
                    <strong className="text-slate-800">
                      {(currentPage - 1) * ITEMS_PER_PAGE + 1} ~ {Math.min(currentPage * ITEMS_PER_PAGE, displayedItems.length)}
                    </strong>
                    건 표시 (페이지 {currentPage} / {totalPages})
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="h-8 px-2.5 text-xs gap-1 border-slate-200 cursor-pointer disabled:opacity-40"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> 이전
                    </Button>

                    <div className="flex items-center gap-1">
                      {getPageNumbers(currentPage, totalPages).map((pageNum) => (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={`h-8 w-8 p-0 text-xs font-bold cursor-pointer touch-manipulation ${
                            currentPage === pageNum
                              ? "bg-orange-600 text-white hover:bg-orange-700 border-orange-600 shadow-xs"
                              : "text-slate-600 hover:text-slate-900 border-slate-200"
                          }`}
                        >
                          {pageNum}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 px-2.5 text-xs gap-1 border-slate-200 cursor-pointer disabled:opacity-40"
                    >
                      다음 <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200 space-y-3">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">검색된 법령이나 판례가 없습니다</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                검색어를 정확하게 입력하셨는지 확인하시거나, 상단의 추천 키워드를 클릭해보세요.
              </p>
            </div>
          )}
        </section>

        {/* 3. 전환(CTA) 브릿지 배너 (방문자를 고객으로 전환) */}
        <section className="bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <Badge className="bg-white/20 text-white border-none font-semibold text-xs">
                <Building2 className="w-3.5 h-3.5 mr-1 inline" /> 이가이버 법원등록 경매공매 전문
              </Badge>
              <h3 className="text-xl sm:text-2xl font-black">
                판례로 봐도 복잡한 권리분석, 전문가가 대신 검토해 드립니다
              </h3>
              <p className="text-orange-100 text-xs sm:text-sm max-w-2xl">
                전세보증금 회수 가능성, 가짜 유치권 배제, 낙찰 후 명도 협상까지.<br />
                강화도 및 수도권 경매 실전 노하우를 바탕으로 1:1 맞춤 진단을 제공합니다.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              <Button
                size="lg"
                className="bg-white text-orange-600 hover:bg-orange-50 font-bold shadow-lg"
                onClick={() => setLocation("/total-care")}
              >
                부동산 토탈케어 신청 <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                size="lg"
                className="bg-slate-900 text-white hover:bg-slate-800 font-bold shadow-lg border border-slate-700/50"
                onClick={() => setLocation("/auctions")}
              >
                <Gavel className="w-4 h-4 mr-1.5 text-amber-400" /> 법원 경매 매물 보기
              </Button>
            </div>
          </div>
        </section>

      </div>

      {/* 4. 판례/법령 상세 모달 다이얼로그 */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedItem && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={selectedItem.type === "prec" ? "bg-blue-600" : "bg-emerald-600"}>
                    {selectedItem.type === "prec" ? "대법원 판례" : "법령"}
                  </Badge>
                  {selectedItem.court && (
                    <span className="text-xs text-slate-500 font-semibold">{selectedItem.court}</span>
                  )}
                  {selectedItem.caseNumber && (
                    <span className="text-xs font-mono text-slate-500">{selectedItem.caseNumber}</span>
                  )}
                </div>
                <DialogTitle className="text-xl font-bold text-slate-900 leading-snug">
                  {selectedItem.title}
                </DialogTitle>
                {selectedItem.subtitle && (
                  <DialogDescription className="text-sm text-slate-500">
                    {selectedItem.subtitle}
                  </DialogDescription>
                )}
              </DialogHeader>

              {/* 판시사항 */}
              {selectedItem.issue && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" /> 【판시사항】
                  </h4>
                  <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {selectedItem.issue}
                  </div>
                </div>
              )}

              {/* 판결요지 */}
              {selectedItem.summary && (
                <div className="bg-orange-50/60 p-4 rounded-xl border border-orange-200">
                  <h4 className="font-bold text-sm text-orange-900 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-orange-600" /> 【판결요지 및 핵심해설】
                  </h4>
                  <div className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                    {selectedItem.summary}
                  </div>
                </div>
              )}

              {/* 참조조문 */}
              {selectedItem.articles && selectedItem.articles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">
                    【참조조문】
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItem.articles.map((art, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs text-slate-700 bg-slate-50">
                        {art}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 판례 전문 (Full Content) 접기/펼치기 */}
              {selectedItem.fullContent && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowFullContent(!showFullContent)}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-100 hover:bg-slate-200/80 transition-colors text-left"
                  >
                    <span className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-slate-600" /> 【판례 전문 (이유 및 결론)】
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      {showFullContent ? "전문 닫기" : "전문 펼쳐보기"}
                      {showFullContent ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>
                  {showFullContent && (
                    <div className="p-4 bg-white text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed max-h-96 overflow-y-auto border-t border-slate-200">
                      {selectedItem.fullContent}
                    </div>
                  )}
                </div>
              )}

              {/* 다이얼로그 푸터 CTA */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleCopyLink(selectedItem)}
                  >
                    <Share2 className="w-3.5 h-3.5 mr-1" /> 공유 링크 복사
                  </Button>
                  {selectedItem.detailUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      asChild
                    >
                      <a href={getSafeDetailUrl(selectedItem)} target="_blank" rel="noopener noreferrer">
                        {selectedItem.type === "prec" ? "대법원 판례 원문 보기" : "법제처 법령 원문 보기"} <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold"
                    onClick={() => {
                      setSelectedItem(null);
                      setLocation("/contact");
                    }}
                  >
                    전문가 상담 신청
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
