import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Property } from "@shared/schema";
import { SpeechRecognition, SpeechRecognitionEvent } from "@/types/speech-recognition";
import PropertyCard from "@/components/property/PropertyCard";
import CompactPropertyItem from "@/components/property/CompactPropertyItem";
import PropertyMap from "@/components/map/PropertyMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Map as MapIcon, X, Mic, MicOff, Sparkles, ArrowLeft } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { useSaju } from "@/contexts/SajuContext";
import { getCompatibilityScore } from "@/lib/saju";
import { useAuth } from "@/hooks/use-auth";
import { Helmet } from "react-helmet";
import { Separator } from "@/components/ui/separator";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const formSchema = z.object({
  district: z.string(),
  type: z.string(),
  dealType: z.string(),
  priceRange: z.string(),
  sortBy: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

// Speech recognition types are provided by src/types/speech-recognition.d.ts

const PropertiesPage = () => {
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const { sajuData } = useSaju();
  const { user } = useAuth();

  // useSearch 훅에서 초기값 파싱
  const initialParams = new URLSearchParams(search);
  const initialDistrict = initialParams.get("district") || "all";
  const initialType = initialParams.get("type") || "all";
  const initialDealType = initialParams.get("dealType") || "all";
  const initialMinPrice = initialParams.get("minPrice");
  const initialMaxPrice = initialParams.get("maxPrice");
  const initialTag = initialParams.get("tag");
  const initialKeyword = initialParams.get("keyword") || "";
  const isRecommend = initialParams.get("recommend") === "true";

  let initialPriceRange = "all";
  if (initialMinPrice && initialMaxPrice) {
    initialPriceRange = `${initialMinPrice}-${initialMaxPrice}`;
  }

  const [filterParams, setFilterParams] = useState({
    district: initialDistrict,
    type: initialType,
    dealType: initialDealType,
    minPrice: initialMinPrice,
    maxPrice: initialMaxPrice,
    keyword: initialKeyword,
    tag: initialTag,
    sortBy: initialParams.get("sortBy") || "latest",
  });

  // 전문가 매물 상태
  const [expertPage, setExpertPage] = useState(1);

  // 공동 중개 매물 상태
  const [coBrokerPage, setCoBrokerPage] = useState(1);

  // 음성검색 관련 상태
  const [searchKeyword, setSearchKeyword] = useState(initialKeyword);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // 음성인식 지원 여부 확인
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'ko-KR';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setSearchKeyword(transcript);
        handleVoiceSearch(transcript);
      };
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };
    }
    return () => recognitionRef.current?.abort();
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    isListening ? recognitionRef.current.stop() : recognitionRef.current.start();
  }, [isListening]);

  const handleVoiceSearch = useCallback((keyword: string) => {
    if (!keyword.trim()) return;
    const newParams = new URLSearchParams();
    newParams.append("keyword", keyword.trim());
    if (filterParams.district && filterParams.district !== "all") newParams.append("district", filterParams.district);
    if (filterParams.type && filterParams.type !== "all") newParams.append("type", filterParams.type);
    if (filterParams.dealType && filterParams.dealType !== "all") newParams.append("dealType", filterParams.dealType);
    if (filterParams.minPrice && filterParams.maxPrice) {
      newParams.append("minPrice", filterParams.minPrice);
      newParams.append("maxPrice", filterParams.maxPrice);
    }
    if (filterParams.tag) newParams.append("tag", filterParams.tag);
    if (filterParams.sortBy) newParams.append("sortBy", filterParams.sortBy);
    setLocation(`/properties?${newParams.toString()}`);
  }, [setLocation, filterParams]);

  const getFormValues = useRef<any>(null);

  const handleKeywordSearch = useCallback(() => {
    const newParams = new URLSearchParams();
    if (searchKeyword.trim()) newParams.append("keyword", searchKeyword.trim());
    const formValues = getFormValues.current?.();
    if (formValues) {
      if (formValues.district && formValues.district !== "all") newParams.append("district", formValues.district);
      if (formValues.type && formValues.type !== "all") newParams.append("type", formValues.type);
      if (formValues.dealType && formValues.dealType !== "all") newParams.append("dealType", formValues.dealType);
      if (formValues.priceRange && formValues.priceRange !== "all") {
        const [min, max] = formValues.priceRange.split("-");
        newParams.append("minPrice", min);
        newParams.append("maxPrice", max);
      }
      if (formValues.sortBy) newParams.append("sortBy", formValues.sortBy);
    }
    if (filterParams.tag) newParams.append("tag", filterParams.tag);
    setLocation(newParams.toString() ? `/properties?${newParams.toString()}` : '/properties');
  }, [searchKeyword, setLocation]);

  const clearKeyword = useCallback(() => {
    setSearchKeyword("");
    const newParams = new URLSearchParams();
    const formValues = getFormValues.current?.();
    if (formValues) {
      if (formValues.district && formValues.district !== "all") newParams.append("district", formValues.district);
      if (formValues.type && formValues.type !== "all") newParams.append("type", formValues.type);
      if (formValues.dealType && formValues.dealType !== "all") newParams.append("dealType", formValues.dealType);
      if (formValues.priceRange && formValues.priceRange !== "all") {
        const [min, max] = formValues.priceRange.split("-");
        newParams.append("minPrice", min);
        newParams.append("maxPrice", max);
      }
      if (formValues.sortBy) newParams.append("sortBy", formValues.sortBy);
    }
    if (filterParams.tag) newParams.append("tag", filterParams.tag);
    setLocation(newParams.toString() ? `/properties?${newParams.toString()}` : '/properties');
  }, [setLocation, filterParams]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { district: initialDistrict, type: initialType, dealType: initialDealType, priceRange: initialPriceRange },
  });
  getFormValues.current = () => form.getValues();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const district = params.get("district") || "all";
    const type = params.get("type") || "all";
    const dealType = params.get("dealType") || "all";
    const minPrice = params.get("minPrice");
    const maxPrice = params.get("maxPrice");
    const keyword = params.get("keyword") || "";
    const tag = params.get("tag");
    const sortBy = params.get("sortBy") || "latest";

    let priceRange = "all";
    if (minPrice && maxPrice) priceRange = `${minPrice}-${maxPrice}`;

    form.reset({ district, type, dealType, priceRange, sortBy });
    setSearchKeyword(keyword);
    setFilterParams({ district, type, dealType, minPrice, maxPrice, keyword, tag, sortBy });
    // 페이지 초기화
    setExpertPage(1);
    setCoBrokerPage(1);
  }, [search]);

  // 1. 전문가 매물 쿼리
  const { data: expertResponse, isLoading: isExpertLoading, isError: isExpertError } = useQuery<{ properties: Property[], total: number, totalPages: number }>({
    queryKey: ["/api/search/expert", filterParams.district, filterParams.type, filterParams.dealType, filterParams.minPrice, filterParams.maxPrice, filterParams.keyword, filterParams.tag, filterParams.sortBy, expertPage],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (filterParams.keyword?.trim()) searchParams.append("keyword", filterParams.keyword.trim());
      if (filterParams.district !== "all") searchParams.append("district", filterParams.district);
      if (filterParams.type !== "all") searchParams.append("type", filterParams.type);
      if (filterParams.dealType !== "all") searchParams.append("dealType", filterParams.dealType);
      if (filterParams.minPrice && filterParams.maxPrice) {
        searchParams.append("minPrice", filterParams.minPrice);
        searchParams.append("maxPrice", filterParams.maxPrice);
      }
      if (filterParams.tag) searchParams.append("tag", filterParams.tag);
      searchParams.append("sortBy", filterParams.sortBy || "latest");
      if (!isRecommend) {
        searchParams.append("page", expertPage.toString());
        searchParams.append("limit", "12");
      } else {
        searchParams.append("limit", "1000"); // 운세 추천일 때는 전체를 가져와서 프론트에서 정렬&페이징
      }
      searchParams.append("includeCrawled", "false");
      const res = await fetch(`/api/search?${searchParams.toString()}`);
      if (!res.ok) throw new Error("전문가 매물을 불러오는데 실패했습니다.");
      const data = await res.json();
      return {
        properties: Array.isArray(data.properties) ? data.properties : [],
        total: data.total || 0,
        totalPages: data.totalPages || 0
      };
    },
    placeholderData: (prev) => prev,
  });

  // 2. 공동 중개 매물 쿼리
  const { data: coBrokerResponse, isLoading: isCoBrokerLoading, isError: isCoBrokerError } = useQuery<{ properties: Property[], total: number, totalPages: number }>({
    queryKey: ["/api/search/co-broker", filterParams.district, filterParams.type, filterParams.dealType, filterParams.minPrice, filterParams.maxPrice, filterParams.keyword, filterParams.tag, filterParams.sortBy, coBrokerPage],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (filterParams.keyword?.trim()) searchParams.append("keyword", filterParams.keyword.trim());
      if (filterParams.district !== "all") searchParams.append("district", filterParams.district);
      if (filterParams.type !== "all") searchParams.append("type", filterParams.type);
      if (filterParams.dealType !== "all") searchParams.append("dealType", filterParams.dealType);
      if (filterParams.minPrice && filterParams.maxPrice) {
        searchParams.append("minPrice", filterParams.minPrice);
        searchParams.append("maxPrice", filterParams.maxPrice);
      }
      searchParams.append("sortBy", filterParams.sortBy || "latest");
      if (!isRecommend) {
        searchParams.append("page", coBrokerPage.toString());
        searchParams.append("limit", "20");
      } else {
        searchParams.append("limit", "1000"); // 운세 추천일 때는 전체를 가져와서 프론트에서 정렬&페이징
      }
      searchParams.append("onlyCrawled", "true");
      const res = await fetch(`/api/search?${searchParams.toString()}`);
      if (!res.ok) throw new Error("공동 중개 매물을 불러오는데 실패했습니다.");
      const data = await res.json();
      return {
        properties: Array.isArray(data.properties) ? data.properties : [],
        total: data.total || 0,
        totalPages: data.totalPages || 0
      };
    },
    placeholderData: (prev) => prev,
  });

  const expertProperties = expertResponse && Array.isArray(expertResponse.properties) ? expertResponse.properties : [];
  const coBrokerProperties = coBrokerResponse && Array.isArray(coBrokerResponse.properties) ? coBrokerResponse.properties : [];

  const onSubmit = (data: FormValues) => {
    const searchParams = new URLSearchParams();
    if (data.district !== "all") searchParams.append("district", data.district);
    if (data.type !== "all") searchParams.append("type", data.type);
    if (data.dealType !== "all") searchParams.append("dealType", data.dealType);
    if (data.priceRange !== "all") {
      const [min, max] = data.priceRange.split("-");
      searchParams.append("minPrice", min);
      searchParams.append("maxPrice", max);
    }
    if (data.sortBy) searchParams.append("sortBy", data.sortBy);
    if (filterParams.tag) searchParams.append("tag", filterParams.tag);
    setLocation(searchParams.toString() ? `/properties?${searchParams.toString()}` : '/properties');
  };

  const sortedExpertProperties = useMemo(() => {
    if (!expertProperties) return [];
    if (isRecommend && sajuData) {
      return [...expertProperties].sort((a, b) => {
        const scoreA = getCompatibilityScore(sajuData, { id: a.id, direction: a.direction, floor: a.floor }).score;
        const scoreB = getCompatibilityScore(sajuData, { id: b.id, direction: b.direction, floor: b.floor }).score;
        return scoreB - scoreA;
      });
    }
    return expertProperties;
  }, [expertProperties, isRecommend, sajuData]);

  const sortedCoBrokerProperties = useMemo(() => {
    if (!coBrokerProperties) return [];
    if (isRecommend && sajuData) {
      return [...coBrokerProperties].sort((a, b) => {
        const scoreA = getCompatibilityScore(sajuData, { id: a.id, direction: a.direction, floor: a.floor }).score;
        const scoreB = getCompatibilityScore(sajuData, { id: b.id, direction: b.direction, floor: b.floor }).score;
        return scoreB - scoreA;
      });
    }
    return coBrokerProperties;
  }, [coBrokerProperties, isRecommend, sajuData]);

  // 프론트엔드 페이징 슬라이싱 (운세 추천 모드일 경우)
  const paginatedExpertProperties = useMemo(() => {
    if (isRecommend) {
      const start = (expertPage - 1) * 12;
      return sortedExpertProperties.slice(start, start + 12);
    }
    return sortedExpertProperties;
  }, [sortedExpertProperties, expertPage, isRecommend]);

  const expertTotalPages = useMemo(() => {
    if (isRecommend) {
      return Math.ceil(sortedExpertProperties.length / 12) || 1;
    }
    return expertResponse?.totalPages || 0;
  }, [sortedExpertProperties.length, expertResponse?.totalPages, isRecommend]);

  const paginatedCoBrokerProperties = useMemo(() => {
    if (isRecommend) {
      const start = (coBrokerPage - 1) * 20;
      return sortedCoBrokerProperties.slice(start, start + 20);
    }
    return sortedCoBrokerProperties;
  }, [sortedCoBrokerProperties, coBrokerPage, isRecommend]);

  const coBrokerTotalPages = useMemo(() => {
    if (isRecommend) {
      return Math.ceil(sortedCoBrokerProperties.length / 20) || 1;
    }
    return coBrokerResponse?.totalPages || 0;
  }, [sortedCoBrokerProperties.length, coBrokerResponse?.totalPages, isRecommend]);

  // 지도용 데이터
  const { data: mapProperties } = useQuery<Property[]>({
    queryKey: ["/api/search/map", filterParams.district, filterParams.type, filterParams.dealType, filterParams.minPrice, filterParams.maxPrice, filterParams.keyword, filterParams.tag],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (filterParams.keyword?.trim()) searchParams.append("keyword", filterParams.keyword.trim());
      if (filterParams.district !== "all") searchParams.append("district", filterParams.district);
      if (filterParams.type !== "all") searchParams.append("type", filterParams.type);
      if (filterParams.dealType !== "all") searchParams.append("dealType", filterParams.dealType);
      if (filterParams.minPrice && filterParams.maxPrice) {
        searchParams.append("minPrice", filterParams.minPrice);
        searchParams.append("maxPrice", filterParams.maxPrice);
      }
      if (filterParams.tag) searchParams.append("tag", filterParams.tag);
      searchParams.append("limit", "5000"); // 지도용 전체 스캔 (최대 5000개)
      const res = await fetch(`/api/search?${searchParams.toString()}&includeCrawled=true`);
      if (!res.ok) throw new Error("지도 데이터를 불러오는데 실패했습니다.");
      const data = await res.json();
      return Array.isArray(data.properties) ? data.properties : []; // 객체 응답에서 배열만 안전하게 추출
    },
    staleTime: 1000 * 60 * 2,
  });

  return (
    <>
      <Helmet>
        <title>매물 검색 | 이가이버부동산</title>
      </Helmet>

      {/* Hero Section */}
      <div className="relative pt-12 pb-8 lg:pt-16 lg:pb-12 overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(37,99,235,0.1),transparent_50%),radial-gradient(circle_at_70%_50%,rgba(16,185,129,0.05),transparent_50%)]" />
        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold tracking-wider uppercase">
              <Sparkles className="w-4 h-4" />
              강화도 No.1 프리미엄 매물 탐색
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-white leading-[1.1] tracking-tight">
              당신에게 딱 맞는<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-400">강화도 명당</span>을 찾으세요
            </h1>

            <div className="relative group max-w-3xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000" />
              <div className="relative flex flex-col md:flex-row gap-2 p-2 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                <div className="relative flex-1 group/input">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-hover/input:text-blue-400 transition-colors" />
                  <Input
                    type="text"
                    placeholder="지역 또는 키워드로 검색 (예: 길상면 토지)"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleKeywordSearch()}
                    className="h-14 pl-12 pr-12 bg-transparent border-0 text-white text-lg placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  {searchKeyword && (
                    <button onClick={clearKeyword} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2 p-1 md:p-0">
                  {speechSupported && (
                    <Button
                      onClick={toggleListening}
                      className={`h-12 w-12 rounded-xl border-white/10 ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-white/5 hover:bg-white/10'} transition-all duration-300`}
                    >
                      {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                  )}
                  <Button onClick={handleKeywordSearch} className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all duration-300">
                    검색하기
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 p-3 md:p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-2 items-end">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 w-full">
                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem className="space-y-0.5">
                      <FormLabel className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">지역 선택</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                            <SelectValue placeholder="모든 지역" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                          <SelectItem value="all">강화군 전체</SelectItem>
                          <SelectItem value="강화읍">강화읍</SelectItem>
                          <SelectItem value="선원면">선원면</SelectItem>
                          <SelectItem value="불은면">불은면</SelectItem>
                          <SelectItem value="길상면">길상면</SelectItem>
                          <SelectItem value="화도면">화도면</SelectItem>
                          <SelectItem value="양도면">양도면</SelectItem>
                          <SelectItem value="내가면">내가면</SelectItem>
                          <SelectItem value="하점면">하점면</SelectItem>
                          <SelectItem value="양사면">양사면</SelectItem>
                          <SelectItem value="송해면">송해면</SelectItem>
                          <SelectItem value="교동면">교동면</SelectItem>
                          <SelectItem value="삼산면">삼산면</SelectItem>
                          <SelectItem value="서도면">서도면</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="space-y-0.5">
                      <FormLabel className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">건물 종류</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                            <SelectValue placeholder="모든 건물" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                          <SelectItem value="all">전체 건물</SelectItem>
                          <SelectItem value="토지">토지</SelectItem>
                          <SelectItem value="주택">주택</SelectItem>
                          <SelectItem value="아파트연립다세대">아파트/빌라</SelectItem>
                          <SelectItem value="원투룸">원룸/투룸</SelectItem>
                          <SelectItem value="상가공장창고펜션">상가/공장/창고</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dealType"
                  render={({ field }) => (
                    <FormItem className="space-y-0.5">
                      <FormLabel className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">거래 유형</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                            <SelectValue placeholder="모든 유형" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                          <SelectItem value="all">전체 거래</SelectItem>
                          <SelectItem value="매매">매매</SelectItem>
                          <SelectItem value="전세">전세</SelectItem>
                          <SelectItem value="월세">월세</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priceRange"
                  render={({ field }) => (
                    <FormItem className="space-y-0.5">
                      <FormLabel className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">희망 가격대</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                            <SelectValue placeholder="모든 가격" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                          <SelectItem value="all">전체 가격대</SelectItem>
                          <SelectItem value="0-100000000">1억 이하</SelectItem>
                          <SelectItem value="100000000-300000000">1억~3억</SelectItem>
                          <SelectItem value="300000000-500000000">3억~5억</SelectItem>
                          <SelectItem value="500000000-1000000000">5억~10억</SelectItem>
                          <SelectItem value="1000000000-9999999999">10억 이상</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sortBy"
                  render={({ field }) => (
                    <FormItem className="space-y-0.5">
                      <FormLabel className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">정렬 순서</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                            <SelectValue placeholder="최신순" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                          <SelectItem value="latest">최신 등록순</SelectItem>
                          <SelectItem value="priceLow">가격 낮은순</SelectItem>
                          <SelectItem value="priceHigh">가격 높은순</SelectItem>
                          <SelectItem value="areaHigh">면적 넓은순</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full md:w-32 h-12 bg-slate-900 hover:bg-blue-600 text-white font-black rounded-xl transition-all duration-300">
                조건 적용
              </Button>
            </form>
          </Form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {isRecommend && sajuData && (
          <div className="mb-12 bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-700 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-2xl shadow-blue-200">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
            <div className="relative flex flex-col md:flex-row items-center gap-8">
              <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-inner border border-white/20">
                <Sparkles className="w-10 h-10 text-yellow-300" />
              </div>
              <div className="flex-1 text-center md:text-left space-y-2">
                <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                  {user?.username || '게스트'}님 맞춤형 <span className="text-yellow-300">기운 명당</span>
                </h2>
                <p className="text-blue-100 text-lg font-medium opacity-90">
                  사주 분석 결과가 반영되었습니다. 귀하의 기운과 가장 잘 맞는 매물을 최상단에 배치했습니다.
                </p>
              </div>
              <Button onClick={() => setLocation('/properties')} variant="secondary" className="h-14 px-8 bg-white text-blue-600 font-black rounded-2xl hover:bg-blue-50 transition-all">
                전체 매물 보기
              </Button>
            </div>
          </div>
        )}

        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <MapIcon className="w-6 h-6 text-blue-600" />
              매물 위치 전체보기
            </h3>
            <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none font-bold">인근 매물 추천 포함</Badge>
          </div>
          <div className="h-[400px] md:h-[600px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200 border border-slate-100 relative group">
            <PropertyMap properties={mapProperties} showCrawled={true} />
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
        </div>

        <div id="property-sections" className="space-y-12">
          {/* Section 1: 강화도 전문가 매물 */}
          <section id="expert-properties">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
              <div className="space-y-2">
                <Badge className="bg-blue-600 text-white font-black px-4 py-1.5 rounded-full mb-2">이가이버 공인중개사 추천</Badge>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">강화도 <span className="text-blue-600">전문가</span> 매물</h2>
                <p className="text-slate-500 font-bold text-lg">이가이버 공인중개사가 검증한 실매물 입니다</p>
              </div>
            </div>

            {isExpertLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[28rem] rounded-[2.5rem]" />)}
              </div>
            ) : isExpertError ? (
              <div className="bg-red-50 p-8 rounded-[2.5rem] text-red-600 text-center font-bold">
                전문가 매물을 불러오는 중 오류가 발생했습니다.
              </div>
            ) : paginatedExpertProperties.length > 0 ? (
              <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {paginatedExpertProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>

                {expertTotalPages > 1 && (
                  <div className="flex justify-center pt-8 border-t border-slate-50">
                    <Pagination>
                      <PaginationContent className="gap-2">
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => {
                              if (expertPage > 1) {
                                setExpertPage(p => p - 1);
                                document.getElementById('expert-properties')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }}
                            className={expertPage === 1 ? "pointer-events-none opacity-30 h-12 rounded-xl" : "cursor-pointer h-12 rounded-xl hover:bg-slate-100"}
                          />
                        </PaginationItem>
                        {(() => {
                          const maxVisible = 5;
                          let start = Math.max(1, expertPage - 2);
                          let end = Math.min(expertTotalPages, start + maxVisible - 1);
                          if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

                          const items = [];
                          for (let i = start; i <= end; i++) {
                            items.push(
                              <PaginationItem key={i}>
                                <PaginationLink
                                  isActive={expertPage === i}
                                  onClick={() => {
                                    setExpertPage(i);
                                    document.getElementById('expert-properties')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }}
                                  className={`h-10 w-10 md:h-12 md:w-12 rounded-xl text-base md:text-lg font-black transition-all ${expertPage === i ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-slate-100'}`}
                                >
                                  {i}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                          return items;
                        })()}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => {
                              if (expertPage < expertTotalPages) {
                                setExpertPage(p => p + 1);
                                document.getElementById('expert-properties')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }}
                            className={expertPage === expertTotalPages ? "pointer-events-none opacity-30 h-12 rounded-xl" : "cursor-pointer h-12 rounded-xl hover:bg-slate-100"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-100 rounded-[3rem] p-24 text-center">
                <div className="max-w-md mx-auto space-y-6">
                  <div className="bg-slate-200/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800">전문가 매물을 찾지 못했습니다</h3>
                  <p className="text-slate-500 font-bold">필터를 조정하거나 검색어를 변경하여 더 많은 매물을 확인해보세요.</p>
                  <Button variant="outline" className="h-12 px-8 rounded-xl font-bold border-slate-200 hover:bg-slate-100" onClick={() => {
                    setLocation('/properties');
                  }}>필터 초기화</Button>
                </div>
              </div>
            )}
          </section>

          {/* Section 2: 공동 중개 매물 */}
          <section id="cobroker-properties">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
              <div className="space-y-2">
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-black px-4 py-1.5 rounded-full mb-2">실시간 수집</Badge>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">강화도 <span className="text-emerald-600">공동 중개</span> 매물</h2>
                <p className="text-slate-500 font-bold text-lg">공동중개 매물! 한번더 확인해 드리겠습니다</p>
              </div>
            </div>

            {isCoBrokerLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
              </div>
            ) : isCoBrokerError ? (
              <div className="bg-red-50 p-8 rounded-[2.5rem] text-red-600 text-center font-bold">
                공동 중개 매물을 불러오는 중 오류가 발생했습니다.
              </div>
            ) : paginatedCoBrokerProperties.length > 0 ? (
              <div className="space-y-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paginatedCoBrokerProperties.map((property) => (
                    <CompactPropertyItem key={property.id} property={property} />
                  ))}
                </div>

                {coBrokerTotalPages > 1 && (
                  <div className="flex justify-center pt-8">
                    <Pagination>
                      <PaginationContent className="gap-2">
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => {
                              if (coBrokerPage > 1) {
                                setCoBrokerPage(p => p - 1);
                                document.getElementById('cobroker-properties')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }}
                            className={coBrokerPage === 1 ? "pointer-events-none opacity-30 h-12 rounded-xl" : "cursor-pointer h-12 rounded-xl hover:bg-slate-100"}
                          />
                        </PaginationItem>
                        {(() => {
                          const maxVisible = 5;
                          let start = Math.max(1, coBrokerPage - 2);
                          let end = Math.min(coBrokerTotalPages, start + maxVisible - 1);
                          if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

                          const items = [];
                          for (let i = start; i <= end; i++) {
                            items.push(
                              <PaginationItem key={i}>
                                <PaginationLink
                                  isActive={coBrokerPage === i}
                                  onClick={() => {
                                    setCoBrokerPage(i);
                                    document.getElementById('cobroker-properties')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }}
                                  className={`h-10 w-10 md:h-12 md:w-12 rounded-xl text-base md:text-lg font-black transition-all ${coBrokerPage === i ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'hover:bg-slate-100'}`}
                                >
                                  {i}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                          return items;
                        })()}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => {
                              if (coBrokerPage < coBrokerTotalPages) {
                                setCoBrokerPage(p => p + 1);
                                document.getElementById('cobroker-properties')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }}
                            className={coBrokerPage === coBrokerTotalPages ? "pointer-events-none opacity-30 h-12 rounded-xl" : "cursor-pointer h-12 rounded-xl hover:bg-slate-100"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-100 rounded-[3rem] p-24 text-center text-slate-400 font-bold text-xl">
                실시간 수집된 공동 중개 매물이 없습니다.
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default PropertiesPage;
