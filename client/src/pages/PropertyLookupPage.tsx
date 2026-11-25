import React, { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { 
  Search, 
  MapPin, 
  Building2, 
  Landmark, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Compass, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  ArrowUpRight,
  HelpCircle,
  Car,
  Layers,
  ExternalLink,
  Users,
  RefreshCw,
  Printer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PropertyLookupMap from "@/components/map/PropertyLookupMap";
import PrintablePropertyLookupReport from "@/components/property/PrintablePropertyLookupReport";

// 마지막 조회 주소 로컬 스토리지 키 및 기본값
const LAST_LOOKUP_ADDRESS_KEY = "last_property_lookup_address";
const DEFAULT_LOOKUP_ADDRESS = "인천광역시 강화군 강화읍 관청리 89-1";

function getInitialAddress(): string {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(LAST_LOOKUP_ADDRESS_KEY);
      if (saved && saved.trim()) {
        return saved.trim();
      }
    } catch (e) {
      // 로컬스토리지 접근 제한 등 예외 방어
    }
  }
  return DEFAULT_LOOKUP_ADDRESS;
}

// 추천 검색 주소
const SAMPLE_ADDRESSES = [
  "인천광역시 강화군 강화읍 관청리 89-1",
  "인천광역시 강화군 선원면 창리 709",
  "서울특별시 강남구 역삼동 814-1",
  "경기도 성남시 분당구 정자동 178-1"
];

export default function PropertyLookupPage() {
  const [selectedAddress, setSelectedAddress] = useState<string>(getInitialAddress);
  const [searchInput, setSearchInput] = useState<string>(getInitialAddress);

  // 선택된 주소 변경 시 localStorage에 저장
  useEffect(() => {
    if (selectedAddress && selectedAddress.trim()) {
      try {
        localStorage.setItem(LAST_LOOKUP_ADDRESS_KEY, selectedAddress.trim());
      } catch (e) {
        // ignore
      }
    }
  }, [selectedAddress]);

  // 부동산 통합 정보 조회 Query
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["/api/property/integrated-lookup", selectedAddress],
    queryFn: async () => {
      const res = await fetch(`/api/property/integrated-lookup?address=${encodeURIComponent(selectedAddress)}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "부동산 정보를 불러오는 데 실패했습니다.");
      }
      return res.json();
    },
    enabled: !!selectedAddress,
    placeholderData: keepPreviousData, // 주소 변경 시 기존 지도 및 데이터 유지 (맵 깜빡임/크기 축소 방지)
    staleTime: 10 * 60 * 1000, // 10분 캐싱
    retry: 1
  });

  // 조회 완료 시 표준 주소명으로 로컬스토리지 동기화
  useEffect(() => {
    if (data?.success && data?.basicInfo?.addressName) {
      try {
        localStorage.setItem(LAST_LOOKUP_ADDRESS_KEY, data.basicInfo.addressName);
      } catch (e) {
        // ignore
      }
    }
  }, [data]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSelectedAddress(searchInput.trim());
  };

  const handleSampleClick = (addr: string) => {
    setSearchInput(addr);
    setSelectedAddress(addr);
  };

  return (
    <>
      {/* 🖨️ A4 1장 인쇄 전용 브리핑 리포트 (화면에서는 hidden, 인쇄 시에만 block) */}
      {data && data.success && (
        <PrintablePropertyLookupReport data={data} />
      )}

      {/* 웹 대화형 화면 (인쇄 시에는 숨김) */}
      <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 print:hidden">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 헤더 섹션 */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            공공데이터포털 & 브이월드 실시간 연동
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            토지대장 · 건축물대장 · 실거래가 통합조회
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            주소만 입력하면 지목, 면적, 공시지가, 건축물 현황, 위반 여부, 최근 실거래가까지 한눈에 분석해 드립니다.
          </p>
        </div>

        {/* 주소 검색창 */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="지번 또는 도로명 주소를 입력하세요 (예: 강화읍 관청리 89-1)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-11 h-12 text-base border-slate-300 focus-visible:ring-blue-600"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isLoading || isFetching} 
                className="h-12 px-6 bg-blue-600 hover:bg-blue-700 font-semibold text-white text-base shrink-0"
              >
                {isLoading || isFetching ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>조회 중...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    <span>통합 조회</span>
                  </div>
                )}
              </Button>
            </form>

            {/* 추천 예시 주소 칩 */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-600">추천 검색:</span>
              {SAMPLE_ADDRESSES.map((addr) => (
                <button
                  key={addr}
                  type="button"
                  onClick={() => handleSampleClick(addr)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"
                >
                  {addr.replace("인천광역시 강화군 ", "").replace("서울특별시 ", "").replace("경기도 성남시 ", "")}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 에러 상태 안내 */}
        {isError && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="font-semibold">조회 실패</AlertTitle>
            <AlertDescription className="text-sm mt-1">
              {(error as Error)?.message || "부동산 정보를 조회하는 중 오류가 발생했습니다. 주소를 다시 확인해 주세요."}
            </AlertDescription>
          </Alert>
        )}

        {/* 조회 결과 영역 */}
        {data && data.success && (
          <div className="space-y-6">
            
            {/* 기본 주소 헤더 바 */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700 font-medium">
                    필지고유번호(PNU): {data.basicInfo.pnu}
                  </Badge>
                  {data.basicInfo.isMountain && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">산(임야)</Badge>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {data.basicInfo.addressName}
                </h2>
                {data.basicInfo.roadAddressName && (
                  <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1">
                    <span>도로명:</span> {data.basicInfo.roadAddressName}
                  </p>
                )}
              </div>

              {/* 바로가기 및 인쇄 버튼 그룹 */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                  onClick={() => window.print()}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>1장 요약 리포트 인쇄</span>
                </Button>
                {data.basicInfo.lat > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5"
                      onClick={() => window.open(`https://map.kakao.com/link/map/${encodeURIComponent(data.basicInfo.addressName)},${data.basicInfo.lat},${data.basicInfo.lng}`, '_blank')}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      카카오맵
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5"
                      onClick={() => window.open(`https://map.kakao.com/link/roadview/${data.basicInfo.lat},${data.basicInfo.lng}`, '_blank')}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      로드뷰
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* 인터랙티브 지적도 지도 (클릭하여 지번 정보 즉시 조회) */}
            <PropertyLookupMap
              lat={data.basicInfo.lat}
              lng={data.basicInfo.lng}
              addressName={data.basicInfo.addressName}
              onSelectAddress={(newAddr) => {
                setSearchInput(newAddr);
                setSelectedAddress(newAddr);
              }}
              isLoading={isLoading || isFetching}
            />

            {/* AI 스마트 분석 브리핑 패널 */}
            {data.aiSummary && (
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-blue-900 font-bold">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    AI 부동산 종합 브리핑 리포트
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {data.aiSummary.points.map((pt: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-slate-800">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>

                  {data.aiSummary.riskAnalysis.length > 0 && (
                    <div className="pt-2 border-t border-blue-200/60 space-y-1.5">
                      <div className="text-xs font-semibold text-slate-700">주요 규제 및 유의사항:</div>
                      {data.aiSummary.riskAnalysis.map((risk: string, idx: number) => (
                        <div key={idx} className="text-xs sm:text-sm text-slate-700 bg-white/80 p-2.5 rounded-lg border border-blue-100">
                          {risk}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 3대 핵심 탭 대시보드 */}
            <Tabs defaultValue="land" className="space-y-4">
              <TabsList className="grid grid-cols-3 w-full bg-slate-200/70 p-1 rounded-xl">
                <TabsTrigger value="land" className="flex items-center gap-1.5 py-2.5 font-semibold text-sm">
                  <Landmark className="w-4 h-4 text-emerald-600" />
                  <span>토지대장</span>
                  {data.landLedger.hasData && (
                    <span className="ml-1 w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="building" className="flex items-center gap-1.5 py-2.5 font-semibold text-sm">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>건축물대장</span>
                  {data.buildingLedger.hasError ? (
                    <Badge variant="outline" className="ml-1 text-[11px] px-1.5 py-0 h-4 bg-amber-50 text-amber-700 border-amber-300">
                      지연
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="ml-1 text-[11px] px-1.5 py-0 h-4">
                      {data.buildingLedger.buildingCount}동
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="trades" className="flex items-center gap-1.5 py-2.5 font-semibold text-sm">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <span>최근 실거래가</span>
                  <Badge variant="secondary" className="ml-1 text-[11px] px-1.5 py-0 h-4">
                    {data.transactions.count}건
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {/* 1. 토지대장 탭 */}
              <TabsContent value="land" className="space-y-4">
                {/* 공식 토지대장 열람/발급 바로가기 배너 */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-700" />
                      <span>공식 토지(임야)대장 열람 및 부동산종합증명서</span>
                    </div>
                    <div className="text-xs text-emerald-800 mt-0.5">
                      정부24(토지·임야대장 등초본 열람/발급) 또는 일사편리(부동산종합증명서)에서 법적 효력이 있는 공식 대장을 즉시 확인하실 수 있습니다.
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs h-8 gap-1.5 shadow-sm"
                      onClick={() => window.open('https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=13100000026', '_blank')}
                    >
                      <span>정부24 토지대장</span>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-white hover:bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold text-xs h-8 gap-1.5"
                      onClick={() => window.open('https://kras.go.kr', '_blank')}
                    >
                      <span>일사편리 종합증명서</span>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {data.landLedger.hasData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* 토지 기본 현황 */}
                    <Card className="border-slate-200">
                      <CardHeader className="pb-3 border-b border-slate-100">
                        <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Landmark className="w-4 h-4 text-emerald-600" />
                          토지 기본 및 지형 특성
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 divide-y divide-slate-100 text-sm">
                        <div className="py-2.5 flex justify-between items-center">
                          <span className="text-slate-500">지목</span>
                          <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded text-base">
                            {data.landLedger.landCategoryNm}
                          </span>
                        </div>
                        <div className="py-2.5 flex justify-between items-center">
                          <span className="text-slate-500">대지면적</span>
                          <span className="font-semibold text-slate-900">
                            {data.landLedger.areaM2.toLocaleString()} ㎡ <span className="text-blue-600">({data.landLedger.areaPyeong}평)</span>
                          </span>
                        </div>
                        <div className="py-2.5 flex justify-between items-center">
                          <span className="text-slate-500">용도지역</span>
                          <span className="font-semibold text-slate-900">
                            {data.landLedger.useArea1Nm} {data.landLedger.useArea2Nm && ` / ${data.landLedger.useArea2Nm}`}
                          </span>
                        </div>
                        <div className="py-2.5 bg-blue-50/60 px-2.5 rounded-lg -mx-1">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-700 font-medium text-xs flex items-center gap-1">
                              <span className="text-blue-600 font-bold">건축규제</span>
                              <span>법정 건폐율 / 용적률</span>
                            </span>
                            <span className="font-extrabold text-blue-900 text-xs sm:text-sm">
                              건폐율 {data.landLedger.legalBcRatLimit}% 이하 / 용적률 {data.landLedger.legalVlRatLimit}% 이하
                            </span>
                          </div>
                          {data.landLedger.legalZoningDesc && (
                            <div className="text-[11px] text-blue-700 mt-1 text-right font-medium">
                              {data.landLedger.legalZoningDesc}
                            </div>
                          )}
                        </div>
                        <div className="py-2.5 flex justify-between items-center">
                          <span className="text-slate-500">도로조건</span>
                          <span className="font-semibold text-slate-900">{data.landLedger.roadSideNm}</span>
                        </div>
                        <div className="py-2.5 flex justify-between items-center">
                          <span className="text-slate-500">지형고저 / 형상</span>
                          <span className="font-semibold text-slate-900">
                            {data.landLedger.terrainHeightNm} / {data.landLedger.terrainShapeNm}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 공시지가 및 토지이용규제 */}
                    <Card className="border-slate-200">
                      <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          개별공시지가 및 규제 현황
                        </CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 font-medium gap-1"
                          onClick={() => {
                            const pnu = data.basicInfo?.pnu;
                            const url = pnu
                              ? `https://www.eum.go.kr/web/ar/lu/luLandDet.jsp?selGbn=umd&pnu=${pnu}`
                              : 'https://www.eum.go.kr';
                            window.open(url, '_blank');
                          }}
                        >
                          <span>토지이음 열람</span>
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100">
                          <div className="text-xs text-emerald-700 font-semibold flex items-center justify-between">
                            <span>개별공시지가 ({data.landLedger.standardYear}년 최신 공시 기준)</span>
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] py-0 h-4">
                              최신 공시가
                            </Badge>
                          </div>
                          <div className="text-xl font-extrabold text-emerald-900 mt-1">
                            {data.landLedger.officialPricePerM2.toLocaleString()} 원/㎡
                          </div>
                          <div className="text-xs text-emerald-600 mt-1">
                            토지 총 공시가 환산: 약 {(data.landLedger.officialPriceTotal / 100000000).toFixed(2)}억원 ({data.landLedger.officialPriceTotal.toLocaleString()}원)
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-slate-700 mb-2">토지이용계획 및 법률상 규제 ({data.landLedger.regulations.length}건)</div>
                          {data.landLedger.regulations.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {data.landLedger.regulations.map((reg: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-300">
                                  {reg}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400">지정된 특별 제한 규제가 없습니다.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* 소유자 및 권리관계 (공유인 명부) 카드 */}
                    {data.ownership && (
                      <Card className="border-slate-200 md:col-span-2">
                        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-600" />
                            소유 및 권리관계 현황 (토지대장 기준)
                          </CardTitle>
                          {data.ownership.isCoOwned ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-semibold">
                              공동소유 (공유인 {data.ownership.coOwnerCount}명)
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100 font-semibold">
                              단독소유
                            </Badge>
                          )}
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <span className="text-xs text-slate-500">소유 구분</span>
                              <div className="text-base font-bold text-slate-900 mt-0.5">
                                {data.ownership.ownerTypeNm}
                              </div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <span className="text-xs text-slate-500">소유 형태</span>
                              <div className="text-base font-bold text-slate-900 mt-0.5">
                                {data.ownership.isCoOwned ? `공유지 (${data.ownership.coOwnerCount}명)` : '단독 소유'}
                              </div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <span className="text-xs text-slate-500">소유자 거주구분</span>
                              <div className="text-base font-bold text-slate-900 mt-0.5">
                                {data.ownership.residenceTypeNm}
                              </div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <span className="text-xs text-slate-500">소유권 변동일 (원인)</span>
                              <div className="text-base font-bold text-slate-900 mt-0.5">
                                {data.ownership.changeDate}
                              </div>
                              <div className="text-xs text-slate-500">{data.ownership.changeCauseNm}</div>
                            </div>
                          </div>

                          {/* 토지이음 해당 지번 바로가기 */}
                          <div className="bg-emerald-50/90 p-3.5 rounded-xl border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
                            <div className="space-y-1">
                              <div className="font-bold flex items-center gap-1.5 text-emerald-950">
                                <FileText className="w-4 h-4 text-emerald-700" />
                                <span>🌐 국토교통부 토지이음 (토지이용계획 · 행위제한) 바로가기</span>
                              </div>
                              <p className="text-emerald-800 leading-relaxed">
                                선택하신 지번(<strong>{data.basicInfo?.addressName}</strong>)의 행위제한, 도시계획 도면, 건폐율·용적률 규제를 국토교통부 토지이음 공식 사이트에서 즉시 확인하실 수 있습니다.
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-sm"
                              onClick={() => {
                                const pnu = data.basicInfo?.pnu;
                                const url = pnu
                                  ? `https://www.eum.go.kr/web/ar/lu/luLandDet.jsp?selGbn=umd&pnu=${pnu}`
                                  : 'https://www.eum.go.kr';
                                window.open(url, '_blank');
                              }}
                            >
                              <span>토지이음 해당번지 바로가기</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </div>

                          <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
                            <div className="space-y-1">
                              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                                <span>🔒 소유자 실명, 상세 거주주소, 공유인별 지분 명부 열람 안내</span>
                              </div>
                              <p className="text-amber-800 leading-relaxed">
                                공공데이터포털 및 브이월드는 개인정보보호법에 따라 소유자의 주민등록상 실명, 전체 주소, 주민번호를 비공개 처리합니다.
                                소유자 실명과 공유인별 지분 명부(1/2, 1/3 등)는 <strong>대법원 인터넷등기소(등기부등본)</strong>에서 즉시 확인하실 수 있습니다.
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="shrink-0 bg-white hover:bg-amber-100 text-amber-900 border-amber-300 font-bold gap-1"
                              onClick={() => window.open('http://www.iros.go.kr', '_blank')}
                            >
                              <span>대법원 등기소 바로가기</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                  </div>
                ) : (
                  <Card className="p-8 text-center text-slate-500">
                    해당 지번의 토지대장 정보가 등록되어 있지 않거나 조회되지 않았습니다.
                  </Card>
                )}
              </TabsContent>

              {/* 2. 건축물대장 탭 */}
              <TabsContent value="building" className="space-y-4">
                {/* 공식 건축물대장 열람/발급 바로가기 배너 */}
                <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-blue-950 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-blue-700" />
                      <span>공식 건축물대장 무료 열람 및 발급 바로가기</span>
                    </div>
                    <div className="text-xs text-blue-800 mt-0.5">
                      정부24(건축물대장 등·초본 무료열람/발급) 또는 세움터(국토교통부 건축행정시스템)에서 총괄표제부 및 전유부 대장을 즉시 확인하실 수 있습니다.
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 gap-1.5 shadow-sm"
                      onClick={() => window.open('https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=15000000098', '_blank')}
                    >
                      <span>정부24 건축물대장</span>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-white hover:bg-blue-100 text-blue-900 border-blue-300 font-semibold text-xs h-8 gap-1.5"
                      onClick={() => window.open('https://cloud.eais.go.kr', '_blank')}
                    >
                      <span>세움터 건축물대장</span>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {data.buildingLedger.hasData ? (
                  <div className="space-y-4">
                    {data.buildingLedger.buildings.map((b: any, idx: number) => (
                      <Card key={idx} className="border-slate-200">
                        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                              <Building2 className="w-5 h-5 text-blue-600" />
                              {b.bldNm}
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500 mt-0.5">
                              {b.mainPurpsNm} {b.etcPurps && `(${b.etcPurps})`}
                            </CardDescription>
                          </div>
                          
                          {/* 위반건축물 여부 배지 */}
                          {b.isViolated ? (
                            <Badge variant="destructive" className="flex items-center gap-1 px-3 py-1 text-xs">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              위반건축물 등재
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 flex items-center gap-1 px-2.5 py-1 text-xs font-semibold">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              위반건축물 없음 (정상)
                            </Badge>
                          )}
                        </CardHeader>
                        
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <div className="text-xs text-slate-500">연면적</div>
                              <div className="text-base font-bold text-slate-900 mt-0.5">
                                {b.totAreaM2.toLocaleString()} ㎡
                              </div>
                              <div className="text-xs text-blue-600">약 {b.totAreaPyeong}평</div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <div className="text-xs text-slate-500">건축면적</div>
                              <div className="text-base font-bold text-slate-900 mt-0.5">
                                {b.archAreaM2.toLocaleString()} ㎡
                              </div>
                              <div className="text-xs text-slate-500">대지: {b.platAreaM2.toLocaleString()}㎡</div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <div className="text-xs text-slate-500">실제 건폐율 / 용적률</div>
                              <div className="text-base font-bold text-slate-900 mt-0.5">
                                {b.bcRat > 0 || b.vlRat > 0 ? (
                                  `${b.bcRat}% / ${b.vlRat}%`
                                ) : (
                                  <span className="text-xs font-semibold text-slate-600">
                                    법정 상한 {data.landLedger.legalBcRatLimit}% / {data.landLedger.legalVlRatLimit}%
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-blue-700 font-medium">
                                {`법정 상한: ${data.landLedger?.legalBcRatLimit || b.legalBcRatLimit || 60}%↓ / ${data.landLedger?.legalVlRatLimit || b.legalVlRatLimit || 200}%↓`}
                              </div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <div className="text-xs text-slate-500">층수 / 사용승인일</div>
                              <div className="text-base font-bold text-slate-900 mt-0.5">
                                지상 {b.grndFlrCnt}층 {b.ugrndFlrCnt > 0 && `/ 지하 ${b.ugrndFlrCnt}층`}
                              </div>
                              <div className="text-xs text-slate-600">{b.useAprDay} ({b.buildingAgeYears}년차)</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                            <div><span className="text-slate-400">구조:</span> {b.strctNm}</div>
                            <div><span className="text-slate-400">지붕:</span> {b.roofNm}</div>
                            <div><span className="text-slate-400">주차 / 승강기:</span> {b.parkingCount}대 / {b.elvtCount}대</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : data.buildingLedger.hasError ? (
                  <Card className="p-8 text-center border-amber-200 bg-amber-50/50">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">국토교통부 건축물대장 서버 연계 지연</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-md">
                          공공데이터포털(세움터) 서버의 일시적인 응답 지연으로 대장 정보를 가져오지 못했습니다. 아래 버튼을 눌러 다시 조회해 보세요.
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="border-amber-300 text-amber-800 hover:bg-amber-100 flex items-center gap-1.5 font-semibold"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                        <span>건축물대장 다시 조회</span>
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-8 text-center text-slate-500">
                    <p className="font-semibold text-slate-700">공부상 등재된 건축물이 없습니다.</p>
                    <p className="text-xs text-slate-400 mt-1">나대지(토지만 있는 필지)이거나 가설건축물일 수 있습니다.</p>
                  </Card>
                )}
              </TabsContent>

              {/* 3. 최근 실거래가 탭 */}
              <TabsContent value="trades" className="space-y-4">
                {data.transactions.hasData ? (
                  <div className="space-y-4">
                    
                    {/* 1. 선택 주소지 직접 실거래가 카드 (있을 경우 최우선 표시) */}
                    {data.transactions.hasDirectTrades && (
                      <Card className="border-blue-300 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white shadow-sm overflow-hidden">
                        <CardHeader className="pb-3 border-b border-blue-200/70 flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-base sm:text-lg font-bold text-blue-950 flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-blue-600" />
                              ⭐ 선택 주소지 직접 실거래 내역 ({data.transactions.directTrades.length}건)
                            </CardTitle>
                            <CardDescription className="text-xs text-blue-700 mt-0.5">
                              검색하신 주소지({data.basicInfo.addressName})에서 실제 거래 신고된 내역입니다.
                            </CardDescription>
                          </div>
                          <Badge className="bg-blue-600 text-white font-bold px-2.5 py-1 text-xs shadow-sm">
                            해당 지번 거래
                          </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                              <thead className="bg-blue-100/60 text-xs text-blue-900 uppercase border-b border-blue-200">
                                <tr>
                                  <th className="px-4 py-3">물건유형</th>
                                  <th className="px-4 py-3">물건명 / 상세위치</th>
                                  <th className="px-4 py-3">계약일자</th>
                                  <th className="px-4 py-3">거래면적</th>
                                  <th className="px-4 py-3 text-right">거래금액</th>
                                  <th className="px-4 py-3 text-right">평당가격</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-blue-100/60 bg-white">
                                {data.transactions.directTrades.map((tr: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                      <Badge className="bg-blue-600 text-white font-bold text-xs">{tr.category}</Badge>
                                    </td>
                                    <td className="px-4 py-3 font-bold text-slate-900">
                                      {tr.name} {tr.floor ? `(${tr.floor}층)` : ''}
                                      <div className="text-xs text-blue-600 font-semibold">{data.basicInfo.addressName}</div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-700 font-semibold">{tr.dealDate}</td>
                                    <td className="px-4 py-3 text-slate-900 font-medium">
                                      <div>{tr.areaM2.toLocaleString()} ㎡ <span className="text-xs text-blue-700 font-bold">({tr.areaPyeong}평)</span></div>
                                      <div className="text-[11px] text-slate-400 font-normal">{tr.areaTypeLabel || (tr.category === '토지' ? '토지면적' : '전용면적')}</div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-black text-blue-800 text-base">
                                      {tr.dealAmountFormatted}
                                    </td>
                                    <td className="px-4 py-3 text-right text-xs text-slate-700 font-bold">
                                      {tr.pyeongPriceFormatted}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* 직접 거래가 없을 때 안내문 */}
                    {!data.transactions.hasDirectTrades && (
                      <div className="bg-slate-100/80 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-600 flex items-start gap-2.5">
                        <HelpCircle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-800">선택하신 주소지({data.basicInfo.addressName})의 직접 실거래 신고 내역이 없습니다.</span>
                          <p className="text-slate-500 mt-0.5">
                            해당 필지에 최근 매매 실거래 신고가 없었거나 나대지/보유 중인 토지일 수 있습니다. 아래의 <strong>인근 및 주변 지역 최근 실거래 시세</strong>를 참고해 주세요.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 2. 인근 및 주변 지역 실거래 내역 카드 */}
                    {data.transactions.nearbyTrades && data.transactions.nearbyTrades.length > 0 && (
                      <Card className="border-slate-200">
                        <CardHeader className="pb-3 border-b border-slate-100">
                          <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-amber-600" />
                              인근 및 주변 지역 최근 실거래 내역 ({data.transactions.nearbyTrades.length}건)
                            </div>
                            <span className="text-xs font-normal text-slate-500">국토교통부 실거래가 공개시스템</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                              <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-200">
                                <tr>
                                  <th className="px-4 py-3">물건유형</th>
                                  <th className="px-4 py-3">물건명/위치</th>
                                  <th className="px-4 py-3">계약일자</th>
                                  <th className="px-4 py-3">거래면적</th>
                                  <th className="px-4 py-3 text-right">거래금액</th>
                                  <th className="px-4 py-3 text-right">평당가격</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {data.transactions.nearbyTrades.map((tr: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-4 py-3 font-medium">
                                      <Badge variant="outline" className={`text-xs ${
                                        tr.category === '아파트' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        tr.category === '토지' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        'bg-purple-50 text-purple-700 border-purple-200'
                                      }`}>
                                        {tr.category}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-slate-900">
                                      {tr.name} {tr.floor ? <span className="text-xs font-normal text-slate-500">({tr.floor}층)</span> : ''}
                                      {tr.dong && <div className="text-xs text-slate-400 font-normal">{tr.dong} {tr.jibun ? `(${tr.jibun})` : ''}</div>}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-600">{tr.dealDate}</td>
                                    <td className="px-4 py-3 text-slate-700">
                                      <div>{tr.areaM2.toLocaleString()} ㎡ <span className="text-xs text-slate-500 font-semibold">({tr.areaPyeong}평)</span></div>
                                      <div className="text-[11px] text-slate-400 font-normal">{tr.areaTypeLabel || (tr.category === '토지' ? '토지면적' : '전용면적')}</div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-extrabold text-blue-700">
                                      {tr.dealAmountFormatted}
                                    </td>
                                    <td className="px-4 py-3 text-right text-xs text-slate-600 font-medium">
                                      {tr.pyeongPriceFormatted}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                  </div>
                ) : (
                  <Card className="p-8 text-center text-slate-500">
                    최근 1~2개 분기 내에 신고된 인근 실거래 내역이 없습니다.
                  </Card>
                )}
              </TabsContent>
            </Tabs>

          </div>
        )}

      </div>
    </div>
    </>
  );
}
