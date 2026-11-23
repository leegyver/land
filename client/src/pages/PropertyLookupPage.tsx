import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PropertyLookupMap from "@/components/map/PropertyLookupMap";

// 추천 검색 주소
const SAMPLE_ADDRESSES = [
  "인천광역시 강화군 강화읍 관청리 89-1",
  "인천광역시 강화군 선원면 창리 709",
  "서울특별시 강남구 역삼동 814-1",
  "경기도 성남시 분당구 정자동 178-1"
];

export default function PropertyLookupPage() {
  const [searchInput, setSearchInput] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("인천광역시 강화군 강화읍 관청리 89-1");

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
    staleTime: 10 * 60 * 1000, // 10분 캐싱
    retry: 1
  });

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
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
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

              {/* 카카오맵 바로가기 버튼 */}
              {data.basicInfo.lat > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5"
                    onClick={() => window.open(`https://map.kakao.com/link/map/${encodeURIComponent(data.basicInfo.addressName)},${data.basicInfo.lat},${data.basicInfo.lng}`, '_blank')}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    카카오맵에서 보기
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5"
                    onClick={() => window.open(`https://map.kakao.com/link/roadview/${data.basicInfo.lat},${data.basicInfo.lng}`, '_blank')}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    로드뷰 보기
                  </Button>
                </div>
              )}
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
                  <Badge variant="secondary" className="ml-1 text-[11px] px-1.5 py-0 h-4">
                    {data.buildingLedger.buildingCount}동
                  </Badge>
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
                      <CardHeader className="pb-3 border-b border-slate-100">
                        <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          개별공시지가 및 규제 현황
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100">
                          <div className="text-xs text-emerald-700 font-medium">
                            개별공시지가 ({data.landLedger.standardYear}년 기준)
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

                  </div>
                ) : (
                  <Card className="p-8 text-center text-slate-500">
                    해당 지번의 토지대장 정보가 등록되어 있지 않거나 조회되지 않았습니다.
                  </Card>
                )}
              </TabsContent>

              {/* 2. 건축물대장 탭 */}
              <TabsContent value="building" className="space-y-4">
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
                              <div className="text-xs text-slate-500">건폐율 / 용적률</div>
                              <div className="text-base font-bold text-slate-900 mt-0.5">
                                {b.bcRat}% / {b.vlRat}%
                              </div>
                              <div className="text-xs text-slate-500">법정 기준 내 적합</div>
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
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3 border-b border-slate-100">
                      <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-amber-600" />
                          해당 지역 인근 최근 실거래 내역
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
                              <th className="px-4 py-3">전용면적</th>
                              <th className="px-4 py-3 text-right">거래금액</th>
                              <th className="px-4 py-3 text-right">평당가격</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {data.transactions.items.map((tr: any, idx: number) => (
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
                                  {tr.dong && <div className="text-xs text-slate-400 font-normal">{tr.dong}</div>}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-600">{tr.dealDate}</td>
                                <td className="px-4 py-3 text-slate-700">
                                  {tr.areaM2} ㎡ <span className="text-xs text-slate-400">({tr.areaPyeong}평)</span>
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
  );
}
