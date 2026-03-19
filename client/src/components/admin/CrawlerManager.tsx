import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Trash2, MapPin, ExternalLink, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CloudDownload, CheckCircle2 } from "lucide-react";
import CrawlerMap from "@/components/admin/CrawlerMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface CrawledProperty {
    id: number;
    atclNo: string;
    atclNm: string;
    rletTpNm: string;
    tradTpNm: string;
    prc: string;
    rentPrc?: string;
    spc1: string;
    spc2: string;
    flrInfo: string;
    lat: number;
    lng: number;
    imgUrl: string;
    crawledAt: string;
    direction?: string;
    landType?: string;
    zoneType?: string;
    rltrNm?: string;
}

import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

export default function CrawlerManager() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isRunning, setIsRunning] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "map" | "split">("split");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedRegion, setSelectedRegion] = useState<string>("eup");
    const [filterRegion, setFilterRegion] = useState<string>("all");
    const [filterDealType, setFilterDealType] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [highlightedPropertyId, setHighlightedPropertyId] = useState<number | null>(null);
    const [selectedAtclNos, setSelectedAtclNos] = useState<string[]>([]);
    const ITEMS_PER_PAGE = 20;

    // 지역별 좌표 프리셋
    const regionPresets: Record<string, { label: string, bounds: any }> = {
        "eup": { label: "강화읍", bounds: { minLat: 37.730, minLon: 126.470, maxLat: 37.760, maxLon: 126.510 } },
        "gilsang": { label: "길상면", bounds: { minLat: 37.600, minLon: 126.450, maxLat: 37.660, maxLon: 126.530 } },
        "hwado": { label: "화도면", bounds: { minLat: 37.580, minLon: 126.350, maxLat: 37.670, maxLon: 126.460 } },
        "bureun": { label: "불은면", bounds: { minLat: 37.660, minLon: 126.470, maxLat: 37.720, maxLon: 126.530 } },
        "seonwon": { label: "선원면", bounds: { minLat: 37.700, minLon: 126.470, maxLat: 37.740, maxLon: 126.520 } },
        "yangdo": { label: "양도면", bounds: { minLat: 37.650, minLon: 126.370, maxLat: 37.710, maxLon: 126.450 } },
        "naega": { label: "내가면", bounds: { minLat: 37.700, minLon: 126.350, maxLat: 37.760, maxLon: 126.425 } },
        "hajeom": { label: "하점면", bounds: { minLat: 37.750, minLon: 126.370, maxLat: 37.820, maxLon: 126.460 } },
        "songhae": { label: "송해면", bounds: { minLat: 37.770, minLon: 126.440, maxLat: 37.820, maxLon: 126.510 } },
        "yangsa": { label: "양사면", bounds: { minLat: 37.800, minLon: 126.380, maxLat: 37.850, maxLon: 126.480 } },
        "gyodong": { label: "교동면", bounds: { minLat: 37.750, minLon: 126.250, maxLat: 37.840, maxLon: 126.350 } },
        "samsan": { label: "삼산면 (석모도)", bounds: { minLat: 37.640, minLon: 126.290, maxLat: 37.760, maxLon: 126.360 } }
    };

    // Category filtering logic
    const categoryGroups = {
        land: ["토지", "임야"],
        house: ["단독/다가구", "전원주택", "상가주택", "빌라", "다세대", "아파트", "원룸", "오피스텔"],
        comm: ["상가", "사무실"],
        other: ["공장/창고"]
    };

    const getCategoryGroup = (rletTpNm: string) => {
        if (categoryGroups.land.includes(rletTpNm)) return "land";
        if (categoryGroups.house.some(h => rletTpNm.includes(h)) || rletTpNm.includes("주택")) return "house";
        if (categoryGroups.comm.includes(rletTpNm)) return "comm";
        return "other";
    };

    // Fetch Crawled Properties
    const { data: properties, isLoading } = useQuery<CrawledProperty[]>({
        queryKey: ["/api/admin/crawled-properties"],
    });

    const filteredProperties = properties?.filter(p => {
        const matchesSearch = p.atclNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.atclNm.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "all" || getCategoryGroup(p.rletTpNm) === selectedCategory;
        const matchesRegion = filterRegion === "all" || (p.flrInfo && p.flrInfo.includes(filterRegion));
        const matchesDealType = filterDealType === "all" || p.tradTpNm === filterDealType;

        return matchesSearch && matchesCategory && matchesRegion && matchesDealType;
    }) || [];

    // Pagination logic
    const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE);
    const paginatedProperties = filteredProperties.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Run Crawler Mutation
    const runCrawlerMutation = useMutation({
        mutationFn: async ({ mode, bounds }: { mode: 'single' | 'grid', bounds?: any }) => {
            const res = await fetch("/api/admin/crawler/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode, bounds })
            });
            if (!res.ok) {
                const text = await res.text();
                let message = "Failed to run crawler";
                try {
                    const err = JSON.parse(text);
                    message = err.message || message;
                } catch (e) {
                    message = text || message;
                }
                throw new Error(message);
            }
            return res.json();
        },
        onSuccess: (data) => {
            toast({
                title: "수집 시작됨",
                description: "강화군 매물 수집을 백그라운드에서 시작했습니다. 잠시 후 목록에서 확인하세요.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/crawled-properties"] });
        },
        onError: (error) => {
            toast({
                title: "수집 실패",
                description: error.message,
                variant: "destructive",
            });
        },
        onSettled: () => {
            setIsRunning(false);
        }
    });

    // Clear Properties Mutation
    const clearPropertiesMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/admin/crawled-properties", {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to clear properties");
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: "초기화 완료",
                description: "수집된 매물 목록을 삭제했습니다.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/crawled-properties"] });
        },
        onError: (error) => {
            toast({
                title: "삭제 실패",
                description: error.message,
                variant: "destructive",
            });
        }
    });

    // Import Mutation
    const importMutation = useMutation({
        mutationFn: async (atclNos: string[]) => {
            const res = await fetch("/api/properties/import-crawled", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ atclNos })
            });
            if (!res.ok) throw new Error("가져오기 실패");
            return res.json();
        },
        onSuccess: (data: any) => {
            toast({
                title: "가져오기 완료",
                description: `${data.success}건 성공, ${data.skipped}건 스킵, ${data.failed}건 실패`,
            });
            setSelectedAtclNos([]);
            queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
        },
        onError: (error: any) => {
            toast({
                title: "오류",
                description: error.message,
                variant: "destructive",
            });
        }
    });

    const handleRunCrawler = (mode: 'single' | 'grid') => {
        if (mode === 'grid' && !confirm("강화군 전체(4x4 그리드) 수집을 시작하시겠습니까?\n이 작업은 시간이 다소 걸릴 수 있습니다 (약 4분).")) {
            return;
        }
        setIsRunning(true);
        const bounds = mode === 'single' ? regionPresets[selectedRegion].bounds : undefined;
        runCrawlerMutation.mutate({ mode, bounds });
    };

    const handleClear = () => {
        if (confirm("정말로 수집된 목록을 모두 삭제하시겠습니까?")) {
            clearPropertiesMutation.mutate();
        }
    };

    const handleImportSelected = () => {
        if (selectedAtclNos.length === 0) return;
        importMutation.mutate(selectedAtclNos);
    };

    const toggleSelection = (atclNo: string) => {
        setSelectedAtclNos(prev =>
            prev.includes(atclNo) ? prev.filter(n => n !== atclNo) : [...prev, atclNo]
        );
    };

    const toggleAllSelection = () => {
        if (selectedAtclNos.length === paginatedProperties.length) {
            setSelectedAtclNos([]);
        } else {
            setSelectedAtclNos(paginatedProperties.map(p => p.atclNo));
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-green-600" />
                        네이버 부동산 매물 수집 (강화군)
                    </CardTitle>
                    <CardDescription>
                        강화군 지역(읍내 중심)의 네이버 부동산 매물을 수집합니다. (토지/주택)
                        <br />
                        주의: 너무 자주 실행하면 네이버에서 IP를 차단할 수 있습니다. (권장: 10분 이상 간격)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">수집 지역 선택</label>
                            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="지역 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(regionPresets).map(([key, region]) => (
                                        <SelectItem key={key} value={key}>
                                            {region.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={() => handleRunCrawler('single')}
                                disabled={isRunning || runCrawlerMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {(isRunning || runCrawlerMutation.isPending) ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 수집 중...
                                    </>
                                ) : (
                                    `${regionPresets[selectedRegion].label} 수집`
                                )}
                            </Button>

                            <Button
                                onClick={() => handleRunCrawler('grid')}
                                disabled={isRunning || runCrawlerMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {(isRunning || runCrawlerMutation.isPending) ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 수집 중...
                                    </>
                                ) : (
                                    "전체 수집 (4x4 Grid)"
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handleClear}
                                disabled={clearPropertiesMutation.isPending || !properties?.length}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> 목록 초기화
                            </Button>

                            {selectedAtclNos.length > 0 && (
                                <Button
                                    onClick={handleImportSelected}
                                    disabled={importMutation.isPending}
                                    className="bg-purple-600 hover:bg-purple-700 animate-pulse-subtle shadow-lg shadow-purple-200"
                                >
                                    {importMutation.isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <CloudDownload className="mr-2 h-4 w-4" />
                                    )}
                                    {selectedAtclNos.length}건 내부 DB로 가져오기
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end mb-4">
                <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                    <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                    >
                        목록
                    </Button>
                    <Button
                        variant={viewMode === "map" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("map")}
                    >
                        지도
                    </Button>
                    <Button
                        variant={viewMode === "split" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("split")}
                    >
                        분할
                    </Button>
                </div>
            </div>

            {(viewMode === "map" || viewMode === "split") && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>지도 보기</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredProperties && filteredProperties.length > 0 ? (
                            <CrawlerMap
                                properties={filteredProperties}
                                highlightedId={highlightedPropertyId}
                            />
                        ) : (
                            <div className="h-[400px] flex items-center justify-center bg-gray-100 rounded-lg text-gray-500">
                                {searchTerm ? "검색 결과와 일치하는 매물이 없습니다." : "매물 데이터가 없습니다."}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {(viewMode === "list" || viewMode === "split") && (
                <Card>
                    <CardHeader className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                        <CardTitle>수집 결과 ({filteredProperties?.length || 0}건)</CardTitle>
                        <div className="flex flex-wrap gap-4 items-center">
                            <Select value={filterRegion} onValueChange={(val) => { setFilterRegion(val); setCurrentPage(1); }}>
                                <SelectTrigger className="w-[120px] h-9">
                                    <SelectValue placeholder="지역" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">전체 지역</SelectItem>
                                    {Object.values(regionPresets).map(r => (
                                        <SelectItem key={r.label} value={r.label}>{r.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={filterDealType} onValueChange={(val) => { setFilterDealType(val); setCurrentPage(1); }}>
                                <SelectTrigger className="w-[120px] h-9">
                                    <SelectValue placeholder="거래유형" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">전체 거래</SelectItem>
                                    <SelectItem value="매매">매매</SelectItem>
                                    <SelectItem value="전세">전세</SelectItem>
                                    <SelectItem value="월세">월세</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                {[
                                    { id: "all", label: "전체" },
                                    { id: "land", label: "토지" },
                                    { id: "house", label: "주택" },
                                    { id: "comm", label: "상가" },
                                    { id: "other", label: "기타" }
                                ].map((cat) => (
                                    <Button
                                        key={cat.id}
                                        variant={selectedCategory === cat.id ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => { setSelectedCategory(cat.id); setCurrentPage(1); }}
                                        className="h-8 px-3 text-xs"
                                    >
                                        {cat.label}
                                    </Button>
                                ))}
                            </div>
                            <div className="relative w-full sm:w-48">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    placeholder="검색어..."
                                    className="pl-9 h-9"
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                            </div>
                        ) : !filteredProperties?.length ? (
                            <div className="text-center py-8 text-gray-500">
                                {searchTerm ? "검색 결과와 일치하는 매물이 없습니다." : "수집된 매물이 없습니다."}
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[40px]">
                                                    <Checkbox
                                                        checked={selectedAtclNos.length > 0 && selectedAtclNos.length === paginatedProperties.length}
                                                        onCheckedChange={toggleAllSelection}
                                                    />
                                                </TableHead>
                                                <TableHead>매물번호</TableHead>
                                                <TableHead>종류/지목</TableHead>
                                                <TableHead>매물명 (설명)</TableHead>
                                                <TableHead>가격</TableHead>
                                                <TableHead>정보/용도</TableHead>
                                                <TableHead>중개사</TableHead>
                                                <TableHead className="text-right">액션</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedProperties.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedAtclNos.includes(item.atclNo)}
                                                            onCheckedChange={() => toggleSelection(item.atclNo)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs">{item.atclNo}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{item.rletTpNm}</Badge>
                                                        {item.landType && <Badge variant="secondary" className="ml-1">{item.landType}</Badge>}
                                                        <div className="text-xs text-gray-500 mt-1">{item.tradTpNm}</div>
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            {item.imgUrl && (
                                                                <img src={item.imgUrl} alt="" className="w-8 h-8 rounded object-cover" />
                                                            )}
                                                            <span
                                                                className="cursor-pointer hover:text-blue-600 hover:underline"
                                                                onClick={() => {
                                                                    setHighlightedPropertyId(item.id);
                                                                    // 분할 모드나 지도 모드로 강제 변경 가능 (옵션)
                                                                    if (viewMode === "list") setViewMode("split");
                                                                    // 지도 영역으로 스크롤 (필요시)
                                                                }}
                                                            >
                                                                {item.atclNm}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-bold text-blue-600">
                                                        {item.tradTpNm === "월세" && item.rentPrc ? `${item.prc}/${item.rentPrc}` : item.prc}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-gray-500">
                                                        <div>{item.flrInfo}</div>
                                                        <div>{item.spc1 ? `${Math.round(Number(item.spc1) / 3.3058)}평 (${item.spc1}㎡)` : "-"}</div>
                                                        {item.zoneType && <div className="text-blue-600 font-medium">{item.zoneType}</div>}
                                                        <div className="text-xs">{item.direction}</div>
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        <span className="text-gray-600">{item.rltrNm || "-"}</span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 w-8 p-0 text-purple-600 border-purple-200 hover:bg-purple-50"
                                                                onClick={() => importMutation.mutate([item.atclNo])}
                                                                title="내부 DB로 가져오기"
                                                                disabled={importMutation.isPending}
                                                            >
                                                                <CloudDownload className="h-4 w-4" />
                                                            </Button>
                                                            <a
                                                                href={`https://m.land.naver.com/article/info/${item.atclNo}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                                    <ExternalLink className="h-4 w-4" />
                                                                </Button>
                                                            </a>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                {totalPages > 1 && (
                                    <div className="mt-6">
                                        <Pagination className="mx-auto justify-center">
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <PaginationPrevious
                                                        onClick={() => {
                                                            setCurrentPage(p => Math.max(1, p - 1));
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                                    />
                                                </PaginationItem>
                                                {[...Array(totalPages)].map((_, i) => {
                                                    const page = i + 1;
                                                    // 현재 페이지 주변 5개만 표시
                                                    if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
                                                        return (
                                                            <PaginationItem key={page}>
                                                                <PaginationLink
                                                                    onClick={() => {
                                                                        setCurrentPage(page);
                                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                    }}
                                                                    isActive={currentPage === page}
                                                                    className="cursor-pointer"
                                                                >
                                                                    {page}
                                                                </PaginationLink>
                                                            </PaginationItem>
                                                        );
                                                    } else if (page === currentPage - 3 || page === currentPage + 3) {
                                                        return <PaginationItem key={page}><span className="px-2">...</span></PaginationItem>;
                                                    }
                                                    return null;
                                                })}
                                                <PaginationItem>
                                                    <PaginationNext
                                                        onClick={() => {
                                                            setCurrentPage(p => Math.min(totalPages, p + 1));
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                                    />
                                                </PaginationItem>
                                            </PaginationContent>
                                        </Pagination>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
