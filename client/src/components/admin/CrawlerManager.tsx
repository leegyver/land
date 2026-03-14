import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Trash2, MapPin, ExternalLink, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import CrawlerMap from "@/components/admin/CrawlerMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function CrawlerManager() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isRunning, setIsRunning] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "map" | "split">("split");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

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
        const matchesSearch = p.atclNo.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "all" || getCategoryGroup(p.rletTpNm) === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Run Crawler Mutation
    const runCrawlerMutation = useMutation({
        mutationFn: async (mode: 'single' | 'grid') => {
            const res = await fetch("/api/admin/crawler/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode })
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
                title: "수집 완료",
                description: `${data.count}개의 매물을 수집했습니다.`,
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

    const handleRunCrawler = (mode: 'single' | 'grid') => {
        if (mode === 'grid' && !confirm("강화군 전체(4x4 그리드) 수집을 시작하시겠습니까?\n이 작업은 시간이 다소 걸릴 수 있습니다 (약 40초).")) {
            return;
        }
        setIsRunning(true);
        runCrawlerMutation.mutate(mode);
    };

    const handleClear = () => {
        if (confirm("정말로 수집된 목록을 모두 삭제하시겠습니까?")) {
            clearPropertiesMutation.mutate();
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
                    <div className="flex gap-4">
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
                                "수집 시작 (강화군 읍내)"
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
                            <CrawlerMap properties={filteredProperties} />
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
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
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
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className="h-8 px-3 text-xs"
                                    >
                                        {cat.label}
                                    </Button>
                                ))}
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    placeholder="매물번호 검색..."
                                    className="pl-9 h-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
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
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>매물번호</TableHead>
                                            <TableHead>종류/지목</TableHead>
                                            <TableHead>매물명 (설명)</TableHead>
                                            <TableHead>가격</TableHead>
                                            <TableHead>정보/용도</TableHead>
                                            <TableHead>중개사</TableHead>
                                            <TableHead>수집일시</TableHead>
                                            <TableHead className="text-right">링크</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredProperties.map((item) => (
                                            <TableRow key={item.id}>
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
                                                        {item.atclNm}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-bold text-blue-600">{item.prc}</TableCell>
                                                <TableCell className="text-sm text-gray-500">
                                                    <div>{item.flrInfo}</div>
                                                    <div>{item.spc1 ? `${Math.round(Number(item.spc1) / 3.3058)}평 (${item.spc1}㎡)` : "-"}</div>
                                                    {item.zoneType && <div className="text-blue-600 font-medium">{item.zoneType}</div>}
                                                    <div className="text-xs">{item.direction}</div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    <span className="text-gray-600">{item.rltrNm || "-"}</span>
                                                </TableCell>
                                                <TableCell className="text-xs text-gray-500">
                                                    {new Date(item.crawledAt).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <a
                                                        href={`https://m.land.naver.com/article/info/${item.atclNo}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        <Button size="sm" variant="ghost">
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    </a>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
