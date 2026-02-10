import { useState, useEffect, useRef, useCallback } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Property } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PropertyCard from "@/components/property/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { MapIcon, Mic, MicOff, Search, X } from "lucide-react";
import PropertyMap from "@/components/map/PropertyMap";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  district: z.string(),
  type: z.string(),
  priceRange: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

// Web Speech API 타입 선언
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const PropertiesPage = () => {
  const [location, setLocation] = useLocation();
  const search = useSearch();

  // useSearch 훅에서 초기값 파싱 (wouter의 반응형 쿼리 문자열 사용)
  const initialParams = new URLSearchParams(search);
  const initialDistrict = initialParams.get("district") || "all";
  const initialType = initialParams.get("type") || "all";
  const initialMinPrice = initialParams.get("minPrice");
  const initialMaxPrice = initialParams.get("maxPrice");
  const initialKeyword = initialParams.get("keyword") || "";

  let initialPriceRange = "all";
  if (initialMinPrice && initialMaxPrice) {
    initialPriceRange = `${initialMinPrice}-${initialMaxPrice}`;
  }

  const [filterParams, setFilterParams] = useState({
    district: initialDistrict,
    type: initialType,
    minPrice: initialMinPrice,
    maxPrice: initialMaxPrice,
    keyword: initialKeyword,
  });

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
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'ko-KR'; // 한국어 설정

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setSearchKeyword(transcript);
        // 음성인식 완료 후 자동 검색
        handleVoiceSearch(transcript);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // 음성인식 시작/중지
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  }, [isListening]);

  // 음성검색 실행 (기존 필터 유지)
  const handleVoiceSearch = useCallback((keyword: string) => {
    if (!keyword.trim()) return;

    const newParams = new URLSearchParams();
    newParams.append("keyword", keyword.trim());

    // 기존 필터 값 유지
    if (filterParams.district && filterParams.district !== "all") {
      newParams.append("district", filterParams.district);
    }
    if (filterParams.type && filterParams.type !== "all") {
      newParams.append("type", filterParams.type);
    }
    if (filterParams.minPrice && filterParams.maxPrice) {
      newParams.append("minPrice", filterParams.minPrice);
      newParams.append("maxPrice", filterParams.maxPrice);
    }

    setLocation(`/properties?${newParams.toString()}`);
  }, [setLocation, filterParams]);

  // form 객체가 초기화된 후에 handleKeywordSearch를 정의해야 하므로,
  // form.getValues()를 사용하기 위한 간접 호출 패턴을 사용
  const getFormValues = useRef<any>(null);

  // 키워드 검색 실행 (현재 폼 필터 값 사용)
  const handleKeywordSearch = useCallback(() => {
    const newParams = new URLSearchParams();

    // 키워드가 있으면 추가
    if (searchKeyword.trim()) {
      newParams.append("keyword", searchKeyword.trim());
    }

    // 현재 폼 값을 직접 사용 (간접 호출)
    const formValues = getFormValues.current?.();
    if (formValues) {
      if (formValues.district && formValues.district !== "all") {
        newParams.append("district", formValues.district);
      }
      if (formValues.type && formValues.type !== "all") {
        newParams.append("type", formValues.type);
      }
      if (formValues.priceRange && formValues.priceRange !== "all") {
        const [minPrice, maxPrice] = formValues.priceRange.split("-");
        if (minPrice && maxPrice) {
          newParams.append("minPrice", minPrice);
          newParams.append("maxPrice", maxPrice);
        }
      }
    }

    const newUrl = newParams.toString() ? `/properties?${newParams.toString()}` : '/properties';
    setLocation(newUrl);
  }, [searchKeyword, setLocation]);

  // 키워드 검색 초기화 (현재 폼 필터 값 유지)
  const clearKeyword = useCallback(() => {
    setSearchKeyword("");

    const newParams = new URLSearchParams();

    // 현재 폼 값을 직접 사용
    const formValues = getFormValues.current?.();
    if (formValues) {
      if (formValues.district && formValues.district !== "all") {
        newParams.append("district", formValues.district);
      }
      if (formValues.type && formValues.type !== "all") {
        newParams.append("type", formValues.type);
      }
      if (formValues.priceRange && formValues.priceRange !== "all") {
        const [minPrice, maxPrice] = formValues.priceRange.split("-");
        if (minPrice && maxPrice) {
          newParams.append("minPrice", minPrice);
          newParams.append("maxPrice", maxPrice);
        }
      }
    }

    const newUrl = newParams.toString() ? `/properties?${newParams.toString()}` : '/properties';
    setLocation(newUrl);
  }, [setLocation]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      district: initialDistrict,
      type: initialType,
      priceRange: initialPriceRange,
    },
  });

  // getFormValues ref 설정 (handleKeywordSearch에서 사용)
  getFormValues.current = () => form.getValues();

  // URL이 변경될 때 폼 값 업데이트
  useEffect(() => {
    // wouter의 useSearch 훅을 통해 쿼리 문자열 가져오기
    const params = new URLSearchParams(search);
    const district = params.get("district") || "all";
    const type = params.get("type") || "all";
    const minPrice = params.get("minPrice");
    const maxPrice = params.get("maxPrice");
    const keyword = params.get("keyword") || "";

    let priceRange = "all";
    if (minPrice && maxPrice) {
      priceRange = `${minPrice}-${maxPrice}`;
    }

    console.log("URL에서 파싱된 파라미터:", { district, type, minPrice, maxPrice, priceRange, keyword });

    form.reset({
      district,
      type,
      priceRange,
    });

    setSearchKeyword(keyword);

    setFilterParams({
      district,
      type,
      minPrice: minPrice,
      maxPrice: maxPrice,
      keyword: keyword,
    });
  }, [search]);

  const { data: properties, isLoading, error } = useQuery<Property[]>({
    queryKey: ["/api/search", filterParams.district, filterParams.type, filterParams.minPrice, filterParams.maxPrice, filterParams.keyword],
    queryFn: async () => {
      // 검색 파라미터 구성
      const searchParams = new URLSearchParams();

      // 키워드 검색
      if (filterParams.keyword && filterParams.keyword.trim() !== "") {
        searchParams.append("keyword", filterParams.keyword.trim());
      }

      if (filterParams.district && filterParams.district !== "all") {
        searchParams.append("district", filterParams.district);
      }

      if (filterParams.type && filterParams.type !== "all") {
        searchParams.append("type", filterParams.type);
      }

      if (filterParams.minPrice && filterParams.maxPrice) {
        searchParams.append("minPrice", filterParams.minPrice);
        searchParams.append("maxPrice", filterParams.maxPrice);
      }

      // URL 생성 및 요청
      const url = `/api/search?${searchParams.toString()}`;
      console.log("검색 요청 URL:", url);

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch properties");
      return res.json();
    },
    placeholderData: (previousData) => previousData,
  });

  const onSubmit = (data: FormValues) => {
    const newParams: Record<string, string | null> = {
      district: data.district !== "all" ? data.district : null,
      type: data.type !== "all" ? data.type : null,
      minPrice: null,
      maxPrice: null,
    };

    if (data.priceRange !== "all") {
      const [min, max] = data.priceRange.split("-");
      newParams.minPrice = min;
      newParams.maxPrice = max;
    }

    // URL 파라미터 생성 및 페이지 이동
    const searchParams = new URLSearchParams();
    if (newParams.district) searchParams.append("district", newParams.district);
    if (newParams.type) searchParams.append("type", newParams.type);
    if (newParams.minPrice && newParams.maxPrice) {
      searchParams.append("minPrice", newParams.minPrice);
      searchParams.append("maxPrice", newParams.maxPrice);
    }

    // wouter의 setLocation을 사용하여 URL 업데이트
    const newUrl = searchParams.toString() ? `/properties?${searchParams.toString()}` : '/properties';
    setLocation(newUrl);
  };

  return (
    <>
      <Helmet>
        <title>매물 검색 | 이가이버부동산 - 강화도 부동산</title>
        <meta name="description" content="강화도 토지, 주택, 아파트, 상가 매물을 검색하세요. 음성검색 지원, 지도보기로 편리하게 매물을 찾을 수 있습니다." />
        <meta property="og:title" content="매물 검색 | 이가이버부동산" />
        <meta property="og:description" content="강화도 토지, 주택, 아파트, 상가 매물 검색" />
      </Helmet>
      <div className="bg-primary/10 py-4 mt-0">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-3">매물 검색</h1>

          {/* 음성검색 입력창 */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="음성검색 또는 입력"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleKeywordSearch();
                    }
                  }}
                  className="pl-10 pr-10"
                  data-testid="input-voice-search"
                />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={clearKeyword}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    data-testid="button-clear-search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {speechSupported && (
                <Button
                  type="button"
                  variant={isListening ? "destructive" : "outline"}
                  size="icon"
                  onClick={toggleListening}
                  className={`flex-shrink-0 ${isListening ? 'animate-pulse' : ''}`}
                  title={isListening ? "음성인식 중지" : "음성으로 검색"}
                  data-testid="button-voice-search"
                >
                  {isListening ? (
                    <MicOff className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>
              )}

              <Button
                type="button"
                onClick={handleKeywordSearch}
                className="flex-shrink-0"
                data-testid="button-search"
              >
                <Search className="h-4 w-4 mr-2" />
                검색
              </Button>
            </div>

            {isListening && (
              <div className="mt-3 flex items-center gap-2 text-sm text-primary">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span>음성을 듣고 있습니다... 말씀해 주세요</span>
              </div>
            )}

            {searchKeyword && filterParams.keyword && (
              <div className="mt-3 text-sm text-gray-600">
                <span className="font-medium">"{filterParams.keyword}"</span> 검색 결과
              </div>
            )}

            {/* 읍면별 드롭다운 */}
            <div className="mt-3">
              <Select onValueChange={(value) => {
                if (value === "전체") {
                  setLocation("/properties");
                } else {
                  setLocation(`/properties?keyword=${encodeURIComponent(value)}`);
                }
              }}>
                <SelectTrigger className="w-full" data-testid="select-district-filter">
                  <SelectValue placeholder="읍면별 검색" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체">전체</SelectItem>
                  <SelectItem value="강화읍">강화읍</SelectItem>
                  <SelectItem value="교동면">교동면</SelectItem>
                  <SelectItem value="길상면">길상면</SelectItem>
                  <SelectItem value="내가면">내가면</SelectItem>
                  <SelectItem value="불은면">불은면</SelectItem>
                  <SelectItem value="삼산면">삼산면</SelectItem>
                  <SelectItem value="서도면">서도면</SelectItem>
                  <SelectItem value="선원면">선원면</SelectItem>
                  <SelectItem value="송해면">송해면</SelectItem>
                  <SelectItem value="양도면">양도면</SelectItem>
                  <SelectItem value="양사면">양사면</SelectItem>
                  <SelectItem value="하점면">하점면</SelectItem>
                  <SelectItem value="화도면">화도면</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 카테고리 필터 숨김 - 음성검색만 사용 */}
          <div className="hidden">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>지역</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="지역 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          {/* 강화읍 옵션 */}
                          <SelectItem value="강화읍 갑곳리">강화읍 갑곳리</SelectItem>
                          <SelectItem value="강화읍 관청리">강화읍 관청리</SelectItem>
                          <SelectItem value="강화읍 국화리">강화읍 국화리</SelectItem>
                          <SelectItem value="강화읍 남산리">강화읍 남산리</SelectItem>
                          <SelectItem value="강화읍 대산리">강화읍 대산리</SelectItem>
                          <SelectItem value="강화읍 신문리">강화읍 신문리</SelectItem>
                          <SelectItem value="강화읍 옥림리">강화읍 옥림리</SelectItem>
                          <SelectItem value="강화읍 용정리">강화읍 용정리</SelectItem>
                          <SelectItem value="강화읍 월곳리">강화읍 월곳리</SelectItem>

                          {/* 교동면 옵션 */}
                          <SelectItem value="교동면 고구리">교동면 고구리</SelectItem>
                          <SelectItem value="교동면 난정리">교동면 난정리</SelectItem>
                          <SelectItem value="교동면 대룡리">교동면 대룡리</SelectItem>
                          <SelectItem value="교동면 동산리">교동면 동산리</SelectItem>
                          <SelectItem value="교동면 무학리">교동면 무학리</SelectItem>
                          <SelectItem value="교동면 봉소리">교동면 봉소리</SelectItem>
                          <SelectItem value="교동면 삼선리">교동면 삼선리</SelectItem>
                          <SelectItem value="교동면 상용리">교동면 상용리</SelectItem>
                          <SelectItem value="교동면 서한리">교동면 서한리</SelectItem>
                          <SelectItem value="교동면 양갑리">교동면 양갑리</SelectItem>
                          <SelectItem value="교동면 읍내리">교동면 읍내리</SelectItem>
                          <SelectItem value="교동면 인사리">교동면 인사리</SelectItem>
                          <SelectItem value="교동면 지석리">교동면 지석리</SelectItem>

                          {/* 길상면 옵션 */}
                          <SelectItem value="길상면 길직리">길상면 길직리</SelectItem>
                          <SelectItem value="길상면 동검리">길상면 동검리</SelectItem>
                          <SelectItem value="길상면 선두리">길상면 선두리</SelectItem>
                          <SelectItem value="길상면 온수리">길상면 온수리</SelectItem>
                          <SelectItem value="길상면 장흥리">길상면 장흥리</SelectItem>
                          <SelectItem value="길상면 초지리">길상면 초지리</SelectItem>

                          {/* 내가면 옵션 */}
                          <SelectItem value="내가면 고천리">내가면 고천리</SelectItem>
                          <SelectItem value="내가면 구하리">내가면 구하리</SelectItem>
                          <SelectItem value="내가면 오상리">내가면 오상리</SelectItem>
                          <SelectItem value="내가면 외포리">내가면 외포리</SelectItem>
                          <SelectItem value="내가면 황청리">내가면 황청리</SelectItem>

                          {/* 불은면 옵션 */}
                          <SelectItem value="불은면 고능리">불은면 고능리</SelectItem>
                          <SelectItem value="불은면 넙성리">불은면 넙성리</SelectItem>
                          <SelectItem value="불은면 덕성리">불은면 덕성리</SelectItem>
                          <SelectItem value="불은면 두운리">불은면 두운리</SelectItem>
                          <SelectItem value="불은면 삼동암리">불은면 삼동암리</SelectItem>
                          <SelectItem value="불은면 삼성리">불은면 삼성리</SelectItem>
                          <SelectItem value="불은면 신현리">불은면 신현리</SelectItem>
                          <SelectItem value="불은면 오두리">불은면 오두리</SelectItem>

                          {/* 삼산면 옵션 */}
                          <SelectItem value="삼산면 매음리">삼산면 매음리</SelectItem>
                          <SelectItem value="삼산면 미법리">삼산면 미법리</SelectItem>
                          <SelectItem value="삼산면 상리">삼산면 상리</SelectItem>
                          <SelectItem value="삼산면 서검리">삼산면 서검리</SelectItem>
                          <SelectItem value="삼산면 석모리">삼산면 석모리</SelectItem>
                          <SelectItem value="삼산면 석포리">삼산면 석포리</SelectItem>
                          <SelectItem value="삼산면 하리">삼산면 하리</SelectItem>

                          {/* 서도면 옵션 */}
                          <SelectItem value="서도면 말도리">서도면 말도리</SelectItem>
                          <SelectItem value="서도면 볼음도리">서도면 볼음도리</SelectItem>
                          <SelectItem value="서도면 아차도리">서도면 아차도리</SelectItem>
                          <SelectItem value="서도면 주문도리">서도면 주문도리</SelectItem>

                          {/* 선원면 옵션 */}
                          <SelectItem value="선원면 금월리">선원면 금월리</SelectItem>
                          <SelectItem value="선원면 냉정리">선원면 냉정리</SelectItem>
                          <SelectItem value="선원면 선행리">선원면 선행리</SelectItem>
                          <SelectItem value="선원면 신정리">선원면 신정리</SelectItem>
                          <SelectItem value="선원면 연리">선원면 연리</SelectItem>
                          <SelectItem value="선원면 지산리">선원면 지산리</SelectItem>
                          <SelectItem value="선원면 창리">선원면 창리</SelectItem>

                          {/* 송해면 옵션 */}
                          <SelectItem value="송해면 당산리">송해면 당산리</SelectItem>
                          <SelectItem value="송해면 상도리">송해면 상도리</SelectItem>
                          <SelectItem value="송해면 솔정리">송해면 솔정리</SelectItem>
                          <SelectItem value="송해면 숭뢰리">송해면 숭뢰리</SelectItem>
                          <SelectItem value="송해면 신당리">송해면 신당리</SelectItem>
                          <SelectItem value="송해면 양오리">송해면 양오리</SelectItem>
                          <SelectItem value="송해면 하도리">송해면 하도리</SelectItem>

                          {/* 양도면 옵션 */}
                          <SelectItem value="양도면 건평리">양도면 건평리</SelectItem>
                          <SelectItem value="양도면 길정리">양도면 길정리</SelectItem>
                          <SelectItem value="양도면 능내리">양도면 능내리</SelectItem>
                          <SelectItem value="양도면 도장리">양도면 도장리</SelectItem>
                          <SelectItem value="양도면 삼흥리">양도면 삼흥리</SelectItem>
                          <SelectItem value="양도면 인산리">양도면 인산리</SelectItem>
                          <SelectItem value="양도면 조산리">양도면 조산리</SelectItem>
                          <SelectItem value="양도면 하일리">양도면 하일리</SelectItem>

                          {/* 양사면 옵션 */}
                          <SelectItem value="양사면 교산리">양사면 교산리</SelectItem>
                          <SelectItem value="양사면 덕하리">양사면 덕하리</SelectItem>
                          <SelectItem value="양사면 북성리">양사면 북성리</SelectItem>
                          <SelectItem value="양사면 인화리">양사면 인화리</SelectItem>
                          <SelectItem value="양사면 철산리">양사면 철산리</SelectItem>

                          {/* 하점면 옵션 */}
                          <SelectItem value="하점면 망월리">하점면 망월리</SelectItem>
                          <SelectItem value="하점면 부근리">하점면 부근리</SelectItem>
                          <SelectItem value="하점면 삼거리">하점면 삼거리</SelectItem>
                          <SelectItem value="하점면 신봉리">하점면 신봉리</SelectItem>
                          <SelectItem value="하점면 신삼리">하점면 신삼리</SelectItem>
                          <SelectItem value="하점면 이강리">하점면 이강리</SelectItem>
                          <SelectItem value="하점면 장정리">하점면 장정리</SelectItem>
                          <SelectItem value="하점면 창후리">하점면 창후리</SelectItem>

                          {/* 화도면 옵션 */}
                          <SelectItem value="화도면 내리">화도면 내리</SelectItem>
                          <SelectItem value="화도면 덕포리">화도면 덕포리</SelectItem>
                          <SelectItem value="화도면 동막리">화도면 동막리</SelectItem>
                          <SelectItem value="화도면 문산리">화도면 문산리</SelectItem>
                          <SelectItem value="화도면 사기리">화도면 사기리</SelectItem>
                          <SelectItem value="화도면 상방리">화도면 상방리</SelectItem>
                          <SelectItem value="화도면 여차리">화도면 여차리</SelectItem>
                          <SelectItem value="화도면 장화리">화도면 장화리</SelectItem>
                          <SelectItem value="화도면 흥왕리">화도면 흥왕리</SelectItem>

                          {/* 기타 옵션 */}
                          <SelectItem value="기타지역">기타지역</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>유형</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="유형 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          <SelectItem value="토지">토지</SelectItem>
                          <SelectItem value="주택">주택</SelectItem>
                          <SelectItem value="아파트연립다세대">아파트/연립/다세대</SelectItem>
                          <SelectItem value="원투룸">원룸/투룸</SelectItem>
                          <SelectItem value="상가공장창고펜션">상가/공장/창고/펜션</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priceRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>가격대</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="가격대 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
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

                <div className="flex items-end">
                  <Button type="submit" className="w-full bg-primary hover:bg-secondary text-white">
                    검색
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {/* Map Section */}
        <div className="mb-4">
          <div className="mb-3 flex items-center">
            <MapIcon className="h-5 w-5 mr-2 text-primary" />
            <h2 className="text-lg font-bold">지도로 부동산찾기</h2>
          </div>
          {/* 메인 페이지 모델을 따라 props 없이 호출하여 데이터 갱신 시의 재로딩 현상을 해결합니다. */}
          <div className="h-[400px] md:h-[500px] w-full rounded-2xl overflow-hidden shadow-lg border border-[#EBE5CE] relative">
            <PropertyMap />
          </div>
        </div>

        {/* Properties Results */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {filterParams.district !== "all" && `${filterParams.district} `}
            {filterParams.type !== "all" && `${filterParams.type} `}
            매물
          </h2>
          {properties && (
            <p className="text-gray-medium">총 {properties.length}개의 매물</p>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <Skeleton key={index} className="h-80 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 p-6 rounded-lg text-red-600">
            <h3 className="text-xl font-bold mb-2">매물을 불러오는 중 오류가 발생했습니다</h3>
            <p>잠시 후 다시 시도해주세요.</p>
          </div>
        ) : properties && properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-light p-8 rounded-lg text-center">
            <h3 className="text-xl font-bold mb-4">검색 결과가 없습니다</h3>
            <p className="text-gray-medium mb-6">검색 조건을 변경하여 다시 시도해보세요.</p>
            <Button onClick={() => {
              form.reset({
                district: "all",
                type: "all",
                priceRange: "all",
              });
              setSearchKeyword("");
              setFilterParams({
                district: "all",
                type: "all",
                minPrice: null,
                maxPrice: null,
                keyword: "",
              });
              setLocation('/properties');
            }}>
              필터 초기화
            </Button>
          </div>
        )}
      </div>

    </>
  );
};

export default PropertiesPage;
