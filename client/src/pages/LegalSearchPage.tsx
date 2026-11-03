import { useState, useEffect } from "react";
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
  ChevronUp
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

export default function LegalSearchPage() {
  const [, setLocation] = useLocation();
  const [matchDetail, detailParams] = useRoute("/legal/:type/:id");
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "prec" | "law">("all");
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
    queryKey: ["/api/law/search", activeQuery, activeTab],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: activeQuery,
        type: activeTab,
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
                placeholder="검색어 또는 사건번호 입력 (예: 주택임대차보호법, 대항력, 2018다252441)"
                className="border-none shadow-none text-slate-900 placeholder:text-slate-400 text-base md:text-lg focus-visible:ring-0 px-2 py-3 h-auto"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-6 rounded-xl text-base shrink-0 shadow-md">
                검색
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
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                {activeQuery ? `'${activeQuery}' 검색 결과` : "실무 추천 판례"}
              </h2>
              <span className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                총 {searchData?.totalCount || 0}건
              </span>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
              <TabsList className="bg-slate-100 p-1">
                <TabsTrigger value="all" className="text-xs md:text-sm font-semibold">전체</TabsTrigger>
                <TabsTrigger value="prec" className="text-xs md:text-sm font-semibold">판례 ({activeTab === "prec" ? searchData?.totalCount || 0 : "법원"})</TabsTrigger>
                <TabsTrigger value="law" className="text-xs md:text-sm font-semibold">법령 ({activeTab === "law" ? searchData?.totalCount || 0 : "법제처"})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Results List */}
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-orange-500 mx-auto" />
              <p className="text-sm text-slate-500">법령 및 판례 데이터를 조회 중입니다...</p>
            </div>
          ) : searchData?.items && searchData.items.length > 0 ? (
            <div className="space-y-4">
              {searchData.items.map((item) => (
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
                        <div className="flex items-center text-xs text-slate-400 gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{item.date}</span>
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
                        href={item.detailUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                      >
                        국가법령정보센터 원문 <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </CardFooter>
                </Card>
              ))}
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
                className="bg-white text-orange-700 hover:bg-orange-50 font-bold shadow-lg"
                onClick={() => setLocation("/total-care")}
              >
                부동산 토탈케어 신청 <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/80 text-white hover:bg-white/10 font-bold"
                onClick={() => setLocation("/auctions")}
              >
                법원 경매 매물 보기
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
                      <a href={selectedItem.detailUrl} target="_blank" rel="noopener noreferrer">
                        국가법령정보센터 원문 <ExternalLink className="w-3 h-3 ml-1" />
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
